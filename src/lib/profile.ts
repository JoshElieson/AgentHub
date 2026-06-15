import { prisma, isDbConfigured } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { getCreator } from "./data";
import { GRADIENTS } from "./data/creators";

const FALLBACK_AVATAR = GRADIENTS.slate;

/** Normalized profile shape rendered by the public `/u/[username]` page. */
export interface PublicProfile {
  id: string | null;
  username: string;
  name: string;
  bio: string;
  avatarColor: string;
  image: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  location: string | null;
  isVerified: boolean;
  followers: number;
  following: number;
  joinedAt: string;
  /** True when backed by a real database row (vs. seeded mock creator). */
  isDbUser: boolean;
}

/**
 * Look up a profile by username. Prefers the database (real, editable users);
 * falls back to the seeded mock creators so existing demo profiles keep
 * rendering even before the DB is seeded / configured.
 */
export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  if (isDbConfigured) {
    try {
      const u = await prisma.user.findUnique({ where: { username } });
      if (u) {
        return {
          id: u.id,
          username: u.username ?? username,
          name: u.name ?? u.username ?? username,
          bio: u.bio ?? "",
          avatarColor: u.avatarColor ?? FALLBACK_AVATAR,
          image: u.image,
          website: u.website,
          github: u.github,
          twitter: u.twitter,
          location: u.location,
          isVerified: u.isVerified,
          followers: u.followers,
          following: u.following,
          joinedAt: u.createdAt.toISOString(),
          isDbUser: true,
        };
      }
    } catch (err) {
      console.error("[profile] DB lookup failed, falling back to mock:", err);
    }
  }

  const c = getCreator(username);
  if (c) {
    return {
      id: null,
      username: c.username,
      name: c.name,
      bio: c.bio,
      avatarColor: c.avatarColor,
      image: null,
      website: c.website ?? null,
      github: c.github ?? null,
      twitter: c.twitter ?? null,
      location: c.location ?? null,
      isVerified: c.isVerified,
      followers: c.followers,
      following: c.following,
      joinedAt: c.joinedAt,
      isDbUser: false,
    };
  }

  // Final fallback: the signed-in user viewing their own profile before it has
  // been persisted to a database (e.g. OAuth configured but DATABASE_URL is
  // not). Render from the live session so /u/<me> works instead of 404ing.
  const session = await getServerSession(authOptions);
  const su = session?.user;
  if (su?.username && su.username === username) {
    return {
      id: su.id ?? null,
      username: su.username,
      name: su.name ?? su.username,
      bio: su.bio ?? "",
      avatarColor: su.avatarColor ?? FALLBACK_AVATAR,
      image: su.image ?? null,
      website: su.website ?? null,
      github: su.github ?? null,
      twitter: su.twitter ?? null,
      location: su.location ?? null,
      isVerified: su.isVerified ?? false,
      followers: 0,
      following: 0,
      joinedAt: new Date().toISOString(),
      isDbUser: false,
    };
  }

  return null;
}

/** Providers (e.g. ["github", "google"]) linked to the current account. */
export async function getConnectedProviders(user: {
  id: string | null;
  github?: string | null;
}): Promise<string[]> {
  if (isDbConfigured && user.id) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        select: { provider: true },
      });
      return accounts.map((a) => a.provider);
    } catch (err) {
      console.error("[profile] account lookup failed:", err);
    }
  }
  // Mock-mode best guess so the UI reflects something sensible.
  return user.github ? ["github"] : [];
}

/** Whether the signed-in viewer currently follows `targetUserId`. */
export async function isFollowing(targetUserId: string): Promise<boolean> {
  if (!isDbConfigured) return false;
  try {
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;
    if (!viewerId || viewerId === targetUserId) return false;
    const rel = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: targetUserId },
      },
    });
    return Boolean(rel);
  } catch (err) {
    console.error("[profile] follow-state lookup failed:", err);
    return false;
  }
}
