import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CollectionsClient } from "./collections-client";

export const metadata: Metadata = {
  title: "Bundles — Nuclexa",
  description:
    "Curated groups of skills and MCP servers. Install an entire toolkit with one click.",
};

export default function CollectionsPage() {
  return (
    <AppShell>
      <Suspense fallback={<CollectionsFallback />}>
        <CollectionsClient />
      </Suspense>
    </AppShell>
  );
}

function CollectionsFallback() {
  return (
    <div className="py-8 sm:py-10">
      <div className="h-4 w-16 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-3 h-8 w-48 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-6 h-11 w-full animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
    </div>
  );
}
