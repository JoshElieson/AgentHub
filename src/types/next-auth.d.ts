import type { DefaultSession } from "next-auth";

// Extend the NextAuth session so server/client code can read the extra profile
// fields we attach in the `session` callback (see src/lib/auth.ts).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      avatarColor: string | null;
      bio: string | null;
      website: string | null;
      github: string | null;
      twitter: string | null;
      location: string | null;
      isVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
