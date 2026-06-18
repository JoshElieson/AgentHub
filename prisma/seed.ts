// Seeds the mock creators (src/lib/data/creators.ts) as real User rows so the
// existing /u/[username] profiles become database-backed — editable, followable,
// and consistent with newly registered OAuth users.
//
// Run with: npm run db:seed   (requires DATABASE_URL + `npm run db:push`)
import { PrismaClient } from "@prisma/client";
import { creators } from "../src/lib/data/creators";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${creators.length} creators…`);

  for (const c of creators) {
    await prisma.user.upsert({
      where: { username: c.username },
      // Don't clobber profile edits a real user may have made; only refresh the
      // descriptive fields on re-seed.
      update: {
        name: c.name,
        bio: c.bio,
        avatarColor: c.avatarColor,
        website: c.website ?? null,
        github: c.github ?? null,
        twitter: c.twitter ?? null,
        location: c.location ?? null,
        isVerified: c.isVerified,
        followers: c.followers,
        following: c.following,
      },
      create: {
        username: c.username,
        name: c.name,
        email: `${c.username}@seed.nuclexa.dev`,
        bio: c.bio,
        avatarColor: c.avatarColor,
        website: c.website ?? null,
        github: c.github ?? null,
        twitter: c.twitter ?? null,
        location: c.location ?? null,
        isVerified: c.isVerified,
        followers: c.followers,
        following: c.following,
        createdAt: new Date(c.joinedAt),
      },
    });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
