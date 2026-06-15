"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, useContext } from "react";

/** Minimal user shape the chrome (navbar, publish preview) renders. */
export interface ClientUser {
  id: string | null;
  name: string;
  username: string;
  avatarColor: string | null;
  image: string | null;
  isVerified: boolean;
}

type AuthConfig = {
  /** "oauth" once provider secrets are configured; "mock" in dev. */
  authMode: "oauth" | "mock";
  /** The deterministic demo user shown in mock mode (null in oauth mode). */
  mockUser: ClientUser | null;
};

const AuthConfigContext = createContext<AuthConfig>({
  authMode: "mock",
  mockUser: null,
});

export function useAuthConfig() {
  return useContext(AuthConfigContext);
}

/**
 * The current display user for client components.
 * - mock mode: the seeded demo user.
 * - oauth mode: the live NextAuth session, or null when signed out / loading.
 */
export function useDisplayUser(): ClientUser | null {
  const { authMode, mockUser } = useAuthConfig();
  const { data } = useSession();

  if (authMode === "mock") return mockUser;
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

/** True while the session is still being fetched (oauth mode only). */
export function useAuthStatus() {
  const { authMode } = useAuthConfig();
  const { status } = useSession();
  if (authMode === "mock") return "authenticated" as const;
  return status; // "loading" | "authenticated" | "unauthenticated"
}

export function Providers({
  authMode,
  mockUser,
  children,
}: AuthConfig & { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthConfigContext.Provider value={{ authMode, mockUser }}>
        {children}
      </AuthConfigContext.Provider>
    </SessionProvider>
  );
}
