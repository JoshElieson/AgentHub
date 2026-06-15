import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ExploreClient } from "./explore-client";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse the AgentDock marketplace — agents, skills, MCP servers, workflows, and prompt packs. Filter by type, platform, category, license, and pricing.",
};

export default function ExplorePage() {
  return (
    <AppShell>
      <Suspense fallback={<ExploreFallback />}>
        <ExploreClient />
      </Suspense>
    </AppShell>
  );
}

/** Static, SSR-safe skeleton shown until the client component reads URL state. */
function ExploreFallback() {
  return (
    <div className="py-8 sm:py-10">
      <div className="h-7 w-40 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
