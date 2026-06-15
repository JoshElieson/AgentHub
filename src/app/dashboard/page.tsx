import type { Metadata } from "next";
import { requireSessionUser } from "@/lib/session";
import { getConnectedProviders } from "@/lib/profile";
import { AUTH_MODE } from "@/lib/session";
import { DashboardClient, type DashboardSection } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

const SECTIONS: DashboardSection[] = [
  "overview",
  "my-agents",
  "installed",
  "favorites",
  "collections",
  "settings",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  // Redirects to /login when signed out (no-op in mock dev mode).
  const user = await requireSessionUser();
  const connectedProviders = await getConnectedProviders(user);
  const { section } = await searchParams;
  const initialSection = SECTIONS.includes(section as DashboardSection)
    ? (section as DashboardSection)
    : "overview";

  return (
    <DashboardClient
      user={user}
      connectedProviders={connectedProviders}
      authMode={AUTH_MODE}
      initialSection={initialSection}
    />
  );
}
