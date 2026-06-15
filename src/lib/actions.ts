"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { prisma, isDbConfigured } from "./prisma";
import { GRADIENTS } from "./data/creators";

export type ActionFailure = {
  ok: false;
  error: string;
  code?: "mock" | "auth" | "validation";
};

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? {} : { data: T }))
  | ActionFailure;

const GRADIENT_VALUES = Object.values(GRADIENTS);

const NOT_CONFIGURED: ActionFailure = {
  ok: false,
  code: "mock",
  error:
    "Profile changes are saved once a database (DATABASE_URL) and OAuth sign-in are configured. You're in dev mode.",
};

/** Resolve the signed-in DB user id, or null. */
async function currentUserId(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// --- Profile edit ----------------------------------------------------------

const handle = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v.replace(/^@+/, ""))
    .optional()
    .or(z.literal(""));

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Use lowercase letters, numbers, and hyphens"
    ),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(200)
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  github: handle(60),
  twitter: handle(60),
});

export type ProfileInput = z.input<typeof profileSchema>;

export async function updateProfile(
  input: ProfileInput
): Promise<ActionResult> {
  const id = await currentUserId();
  if (!isDbConfigured) return NOT_CONFIGURED;
  if (!id) return { ok: false, code: "auth", error: "You're not signed in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const data = parsed.data;

  try {
    // Username must stay unique.
    const clash = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id } },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, code: "validation", error: "That username is taken." };
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { username: true },
    });

    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        username: data.username,
        bio: data.bio || null,
        website: data.website || null,
        location: data.location || null,
        github: data.github || null,
        twitter: data.twitter || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/u/${data.username}`);
    if (existing?.username && existing.username !== data.username) {
      revalidatePath(`/u/${existing.username}`);
    }
    return { ok: true };
  } catch (err) {
    console.error("[actions] updateProfile failed:", err);
    return { ok: false, error: "Something went wrong saving your profile." };
  }
}

// --- Avatar ----------------------------------------------------------------

export async function regenerateAvatar(): Promise<ActionResult<{ avatarColor: string }>> {
  const id = await currentUserId();
  if (!isDbConfigured) return NOT_CONFIGURED;
  if (!id) return { ok: false, code: "auth", error: "You're not signed in." };

  try {
    const current = await prisma.user.findUnique({
      where: { id },
      select: { avatarColor: true, username: true },
    });
    // Pick a different gradient than the current one.
    const options = GRADIENT_VALUES.filter((g) => g !== current?.avatarColor);
    const avatarColor =
      options[Math.floor(Math.random() * options.length)] ?? GRADIENT_VALUES[0];

    await prisma.user.update({ where: { id }, data: { avatarColor } });
    revalidatePath("/dashboard");
    if (current?.username) revalidatePath(`/u/${current.username}`);
    return { ok: true, data: { avatarColor } };
  } catch (err) {
    console.error("[actions] regenerateAvatar failed:", err);
    return { ok: false, error: "Couldn't update your avatar." };
  }
}

// --- Connected accounts ----------------------------------------------------

export async function disconnectAccount(
  provider: string
): Promise<ActionResult> {
  const id = await currentUserId();
  if (!isDbConfigured) return NOT_CONFIGURED;
  if (!id) return { ok: false, code: "auth", error: "You're not signed in." };

  try {
    const accounts = await prisma.account.findMany({
      where: { userId: id },
      select: { id: true, provider: true },
    });
    if (accounts.length <= 1) {
      return {
        ok: false,
        error: "You can't disconnect your only sign-in method.",
      };
    }
    const target = accounts.find((a) => a.provider === provider);
    if (!target) return { ok: false, error: "That account isn't connected." };

    await prisma.account.delete({ where: { id: target.id } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    console.error("[actions] disconnectAccount failed:", err);
    return { ok: false, error: "Couldn't disconnect that account." };
  }
}

// --- Delete account --------------------------------------------------------

export async function deleteAccount(): Promise<ActionResult> {
  const id = await currentUserId();
  if (!isDbConfigured) return NOT_CONFIGURED;
  if (!id) return { ok: false, code: "auth", error: "You're not signed in." };

  try {
    // Sessions / accounts / follows cascade via the schema.
    await prisma.user.delete({ where: { id } });
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    console.error("[actions] deleteAccount failed:", err);
    return { ok: false, error: "Couldn't delete your account." };
  }
}

// --- Follow ----------------------------------------------------------------

export async function toggleFollow(
  targetUsername: string
): Promise<ActionResult<{ following: boolean; followers: number }>> {
  if (!isDbConfigured) return NOT_CONFIGURED;
  const viewerId = await currentUserId();
  if (!viewerId)
    return { ok: false, code: "auth", error: "Sign in to follow creators." };

  try {
    const target = await prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, followers: true },
    });
    if (!target) {
      return { ok: false, error: "You can only follow registered users." };
    }
    if (target.id === viewerId) {
      return { ok: false, error: "You can't follow yourself." };
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: target.id },
      },
    });

    let following: boolean;
    if (existing) {
      await prisma.$transaction([
        prisma.follow.delete({ where: { id: existing.id } }),
        prisma.user.update({
          where: { id: target.id },
          data: { followers: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: viewerId },
          data: { following: { decrement: 1 } },
        }),
      ]);
      following = false;
    } else {
      await prisma.$transaction([
        prisma.follow.create({
          data: { followerId: viewerId, followingId: target.id },
        }),
        prisma.user.update({
          where: { id: target.id },
          data: { followers: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: viewerId },
          data: { following: { increment: 1 } },
        }),
      ]);
      following = true;
    }

    const updated = await prisma.user.findUnique({
      where: { id: target.id },
      select: { followers: true },
    });
    revalidatePath(`/u/${targetUsername}`);
    return {
      ok: true,
      data: { following, followers: updated?.followers ?? target.followers },
    };
  } catch (err) {
    console.error("[actions] toggleFollow failed:", err);
    return { ok: false, error: "Couldn't update your follow." };
  }
}
