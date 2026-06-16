import { prisma, isDbConfigured } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { getCreator, creators } from "./data";
import { GRADIENTS } from "./data/creators";
import { hashIndex } from "./utils";
import type { Creator } from "./types";

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

// --- Follow lists (followers / following) ----------------------------------

/** Which side of the follow graph to list. */
export type FollowDirection = "followers" | "following";

/** Compact profile shape rendered in a followers/following list. */
export interface ProfileSummary {
  id: string | null;
  username: string;
  name: string;
  bio: string;
  avatarColor: string;
  image: string | null;
  isVerified: boolean;
  /** Backed by a real DB row (vs. a seeded mock creator). */
  isDbUser: boolean;
  /** Whether the current viewer already follows this person (DB users only). */
  viewerFollows: boolean;
}

/** Cap on how many connections we render at once. */
const FOLLOW_LIST_LIMIT = 200;

/** Structural shape of the User columns a summary needs (Prisma returns more). */
type DbUserLike = {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarColor: string | null;
  image: string | null;
  isVerified: boolean;
};

function dbUserToSummary(u: DbUserLike): ProfileSummary {
  const username = u.username ?? u.id;
  return {
    id: u.id,
    username,
    name: u.name ?? username,
    bio: u.bio ?? "",
    avatarColor: u.avatarColor ?? FALLBACK_AVATAR,
    image: u.image,
    isVerified: u.isVerified,
    isDbUser: true,
    viewerFollows: false,
  };
}

function creatorToSummary(c: Creator): ProfileSummary {
  return {
    id: null,
    username: c.username,
    name: c.name,
    bio: c.bio,
    avatarColor: c.avatarColor,
    image: null,
    isVerified: c.isVerified,
    isDbUser: false,
    viewerFollows: false,
  };
}

/**
 * List the people on one side of a profile's follow graph.
 *
 * - Real DB users → the actual follow edges, newest first, with each entry
 *   flagged when `viewerId` already follows them (so the list can show a
 *   correctly-stated Follow/Following button).
 * - Seeded mock creators (demo mode, no DB) → a deterministic sample drawn from
 *   the creator pool so the connections view is populated and explorable. These
 *   are genuine creator profiles, just not joined by persisted follow rows.
 */
export async function getFollowList(
  profile: PublicProfile,
  direction: FollowDirection,
  viewerId: string | null
): Promise<ProfileSummary[]> {
  if (isDbConfigured && profile.isDbUser && profile.id) {
    try {
      // Skip users whose username hasn't been backfilled yet (nullable right
      // after OAuth sign-in): they have no handle to link to or follow, so a
      // `/u/<id>` link would 404. The denormalized counter stays the canonical
      // total; the "Showing N of total" UI already handles a smaller sample.
      let users: DbUserLike[];
      if (direction === "followers") {
        const rows = await prisma.follow.findMany({
          where: { followingId: profile.id, follower: { username: { not: null } } },
          include: { follower: true },
          orderBy: { createdAt: "desc" },
          take: FOLLOW_LIST_LIMIT,
        });
        users = rows.map((r) => r.follower);
      } else {
        const rows = await prisma.follow.findMany({
          where: { followerId: profile.id, following: { username: { not: null } } },
          include: { following: true },
          orderBy: { createdAt: "desc" },
          take: FOLLOW_LIST_LIMIT,
        });
        users = rows.map((r) => r.following);
      }

      const summaries = users.map(dbUserToSummary);

      // Flag which of these the viewer already follows, in a single query.
      if (viewerId) {
        const ids = summaries
          .map((s) => s.id)
          .filter((id): id is string => Boolean(id) && id !== viewerId);
        if (ids.length > 0) {
          const mine = await prisma.follow.findMany({
            where: { followerId: viewerId, followingId: { in: ids } },
            select: { followingId: true },
          });
          const followed = new Set(mine.map((m) => m.followingId));
          for (const s of summaries) {
            s.viewerFollows = s.id ? followed.has(s.id) : false;
          }
        }
      }

      return summaries;
    } catch (err) {
      console.error("[profile] follow-list lookup failed:", err);
      return [];
    }
  }

  // Mock / demo fallback: a deterministic, stable sample from the creator pool.
  // Partition the pool by a per-relationship hash so "followers" and "following"
  // are genuinely different sets (bucket 2 = mutuals appear in both) rather than
  // the same faces in both tabs.
  const total = direction === "followers" ? profile.followers : profile.following;
  if (total <= 0) return [];
  const SAMPLE = 8;
  const pool = creators.filter((c) => c.username !== profile.username);
  const eligible = pool.filter((c) => {
    // bucket 0 → followers only, 1 → following only, 2 → mutual (both lists).
    const bucket = hashIndex(`${profile.username}:rel:${c.username}`, 3);
    return direction === "followers" ? bucket !== 1 : bucket !== 0;
  });
  const ordered = eligible.sort(
    (a, b) =>
      hashIndex(`${profile.username}:${direction}:${a.username}`, 100_000) -
      hashIndex(`${profile.username}:${direction}:${b.username}`, 100_000)
  );
  return ordered
    .slice(0, Math.min(total, SAMPLE, ordered.length))
    .map(creatorToSummary);
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
