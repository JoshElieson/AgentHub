import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Auth.js / NextAuth route handler. Without OAuth secrets the app runs in
// mock-auth mode (see src/lib/session.ts); this endpoint only does real work
// once GITHUB_* / GOOGLE_* env vars are configured.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
