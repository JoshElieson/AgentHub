import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma, isDbConfigured } from "./prisma";
import { GRADIENTS } from "./data/creators";
import { hashIndex, slugify } from "./utils";

// Each provider only activates when both of its credentials are present, so the
// app builds and runs with zero secrets — sign-in is simply unavailable until
// a provider is configured (there is no demo/mock sign-in).
export const isGithubConfigured = Boolean(
  process.env.GITHUB_ID && process.env.GITHUB_SECRET
);
export const isGoogleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const providers: NextAuthOptions["providers"] = [];

if (isGithubConfigured) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })
  );
}

if (isGoogleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

/** True when at least one OAuth provider is configured via env. */
export const isAuthConfigured = providers.length > 0;

// Shape of the database User row as returned by the adapter in the `session`
// callback (Prisma returns every column at runtime even though the NextAuth
// `AdapterUser` type only declares a subset).
type DbUser = {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  avatarColor: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  location: string | null;
  isVerified: boolean;
};

const GRADIENT_VALUES = Object.values(GRADIENTS);

/** Pick a deterministic avatar gradient for a user id. */
function pickAvatarColor(seed: string): string {
  return GRADIENT_VALUES[hashIndex(seed, GRADIENT_VALUES.length)];
}

/** Generate a unique, URL-safe username from a display name or email. */
async function generateUsername(base: string): Promise<string> {
  const root = slugify(base).slice(0, 30) || "user";
  let candidate = root;
  let n = 1;
  // Bounded loop — append -2, -3, … until a free handle is found.
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    n += 1;
    if (n > 1000) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export const authOptions: NextAuthOptions = {
  // Persist users / accounts / sessions to Postgres when a database is
  // configured; otherwise fall back to stateless JWT sessions so the app still
  // runs (degraded) with OAuth keys but no database.
  adapter: isDbConfigured ? PrismaAdapter(prisma) : undefined,
  providers,
  session: { strategy: isDbConfigured ? "database" : "jwt" },
  pages: { signIn: "/login" },
  secret:
    process.env.NEXTAUTH_SECRET ??
    "agentdock-dev-insecure-secret-change-me-in-production",
  callbacks: {
    async session({ session, user, token }) {
      if (!session.user) return session;
      if (user) {
        // Database strategy — `user` is the full DB row (Prisma returns every
        // column at runtime even though AdapterUser only declares a subset).
        const u = user as unknown as DbUser;
        session.user.id = u.id;
        session.user.name = u.name ?? u.username ?? null;
        session.user.image = u.image ?? null;
        session.user.username = u.username ?? null;
        session.user.avatarColor = u.avatarColor ?? null;
        session.user.bio = u.bio ?? null;
        session.user.website = u.website ?? null;
        session.user.github = u.github ?? null;
        session.user.twitter = u.twitter ?? null;
        session.user.location = u.location ?? null;
        session.user.isVerified = u.isVerified ?? false;
      } else if (token?.sub) {
        // JWT strategy (no database) — only identity fields are available.
        session.user.id = token.sub;
        session.user.username = session.user.email
          ? session.user.email.split("@")[0]
          : null;
        session.user.avatarColor = pickAvatarColor(token.sub);
        session.user.bio = null;
        session.user.website = null;
        session.user.github = null;
        session.user.twitter = null;
        session.user.location = null;
        session.user.isVerified = false;
      }
      return session;
    },
  },
  events: {
    // Assign a unique username + avatar gradient the first time an account is
    // created (the OAuth adapter doesn't populate these).
    async createUser({ user }) {
      if (!isDbConfigured) return;
      try {
        const base = user.name || user.email?.split("@")[0] || "user";
        await prisma.user.update({
          where: { id: user.id },
          data: {
            username: await generateUsername(base),
            name: user.name ?? base,
            avatarColor: pickAvatarColor(user.id),
          },
        });
      } catch (err) {
        console.error("[auth] createUser enrichment failed:", err);
      }
    },
    // Sync the OAuth profile photo on every sign-in, and import a brand-new
    // GitHub user's bio/links the first time they connect.
    async signIn({ user, account, profile, isNewUser }) {
      if (!isDbConfigured || !account || !profile) return;
      try {
        const data: Record<string, string> = {};
        const p = profile as {
          login?: string;
          bio?: string;
          blog?: string;
          location?: string;
          twitter_username?: string;
          // GitHub exposes the avatar as `avatar_url`; Google as `picture`.
          avatar_url?: string;
          picture?: string;
        };

        // Always pull the latest profile picture from the provider so a changed
        // GitHub/Google avatar propagates on the next sign-in. (`image` is only
        // ever sourced from OAuth — no in-app upload path overwrites it.)
        const image =
          account.provider === "github"
            ? p.avatar_url
            : account.provider === "google"
              ? p.picture
              : undefined;
        if (image) data.image = image;

        // First-time GitHub users: seed bio / links from their GitHub profile.
        if (isNewUser && account.provider === "github") {
          if (p.login) data.github = p.login;
          if (p.bio) data.bio = p.bio;
          if (p.blog)
            data.website = p.blog.startsWith("http")
              ? p.blog
              : `https://${p.blog}`;
          if (p.location) data.location = p.location;
          if (p.twitter_username) data.twitter = p.twitter_username;
        }

        if (Object.keys(data).length > 0) {
          await prisma.user.update({ where: { id: user.id }, data });
        }
      } catch (err) {
        console.error("[auth] signIn enrichment failed:", err);
      }
    },
  },
};
