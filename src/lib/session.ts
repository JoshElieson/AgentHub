import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions, isAuthConfigured } from "./auth";
import { getCurrentUser } from "./data";
import { GRADIENTS } from "./data/creators";

export type AuthMode = "oauth" | "mock";

export const AUTH_MODE: AuthMode = isAuthConfigured ? "oauth" : "mock";

const FALLBACK_AVATAR = GRADIENTS.slate;

export interface SessionUser {
  id: string | null;
  username: string;
  name: string;
  email: string;
  image: string | null;
  avatarColor: string;
  bio: string;
  website: string | null;
  github: string | null;
  twitter: string | null;
  location: string | null;
  isVerified: boolean;
  /** true = real signed-in session; false = mock demo user. */
  isAuthenticated: boolean;
}

/**
 * Deterministic demo user used when no OAuth provider is configured, so the
 * dashboard and authenticated surfaces stay navigable in dev. Safe to pass to
 * client components (plain serializable object).
 */
export function getMockSessionUser(): SessionUser {
  const u = getCurrentUser();
  return {
    id: u.username,
    username: u.username,
    name: u.name,
    email: "marcus@agentdock.dev",
    image: null,
    avatarColor: u.avatarColor,
    bio: u.bio,
    website: u.website ?? null,
    github: u.github ?? null,
    twitter: u.twitter ?? null,
    location: u.location ?? null,
    isVerified: u.isVerified,
    isAuthenticated: false,
  };
}

/**
 * Resolve the current user.
 * - mock mode: the demo user (never null) so the app is fully usable.
 * - oauth mode: the live NextAuth session, or null when signed out.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (AUTH_MODE === "mock") return getMockSessionUser();

  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const su = session.user;
  const username = su.username ?? su.email?.split("@")[0] ?? su.id;
  return {
    id: su.id,
    username,
    name: su.name ?? username,
    email: su.email ?? "",
    image: su.image ?? null,
    avatarColor: su.avatarColor ?? FALLBACK_AVATAR,
    bio: su.bio ?? "",
    website: su.website ?? null,
    github: su.github ?? null,
    twitter: su.twitter ?? null,
    location: su.location ?? null,
    isVerified: su.isVerified ?? false,
    isAuthenticated: true,
  };
}

/**
 * Like {@link getSessionUser} but redirects to /login when signed out. In mock
 * mode it never redirects (the demo user is always present).
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
