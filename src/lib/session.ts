import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions, isAuthConfigured } from "./auth";
import { GRADIENTS } from "./data/creators";

/** Re-exported so server components can reflect whether sign-in is configured. */
export { isAuthConfigured };

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
  /** Always true here (a SessionUser only exists for a real session); kept so
   * call sites that branch on `viewer?.isAuthenticated` stay correct. */
  isAuthenticated: boolean;
}

/**
 * Resolve the signed-in user from the real NextAuth session, or null when
 * signed out. There is no demo/mock fallback: every visitor starts signed out
 * and authenticates through an OAuth provider (GitHub or Google).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
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
 * Like {@link getSessionUser} but redirects to /login when signed out.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
