import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireSessionUser } from "@/lib/session";
import { PublishWizard } from "./publish-wizard";

export const metadata: Metadata = {
  title: "Publish",
  description:
    "Publish an agent, skill, MCP server, workflow, or prompt pack to AgentDock. Versioned, permission-scoped, and installable everywhere.",
};

export default async function PublishPage() {
  // Redirects to /login when signed out (no-op in mock dev mode).
  await requireSessionUser();
  return (
    <AppShell>
      <PublishWizard />
    </AppShell>
  );
}
