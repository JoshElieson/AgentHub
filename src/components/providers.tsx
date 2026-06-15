"use client";

import { SessionProvider, useSession } from "next-auth/react";

/** Minimal user shape the chrome (navbar, publish preview) renders. */
export interface ClientUser {
  id: string | null;
  name: string;
  username: string;
  avatarColor: string | null;
  image: string | null;
  isVerified: boolean;
}

/**
 * The current display user for client components: the live NextAuth session,
 * or null when signed out / still loading.
 */
export function useDisplayUser(): ClientUser | null {
  const { data } = useSession();
  if (!data?.user) return null;

  const u = data.user;
  const username = u.username ?? u.email?.split("@")[0] ?? "user";
  return {
    id: u.id ?? null,
    name: u.name ?? username,
    username,
    avatarColor: u.avatarColor ?? null,
    image: u.image ?? null,
    isVerified: u.isVerified ?? false,
  };
}

/** Session fetch status: "loading" | "authenticated" | "unauthenticated". */
export function useAuthStatus() {
  return useSession().status;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
