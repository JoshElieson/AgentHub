import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, SectionHeader } from "@/components/app-shell";
import { CollectionCard } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { collections } from "@/lib/data";
import { ArrowRight, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Collections — AgentDock",
  description:
    "Curated stacks of agents that work well together. Hand-picked toolkits for security, frontend, DevOps, research, and more.",
};

export default function CollectionsPage() {
  const official = collections.filter((c) => c.isOfficial);
  const community = collections.filter((c) => !c.isOfficial);

  return (
    <AppShell>
      {/* Page header */}
      <section className="border-b border-line pt-10 pb-7 sm:pt-12 sm:pb-8">
        <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-brand-muted">
          <Layers className="h-3.5 w-3.5" />
          Curated
        </div>
        <div className="mt-3">
          <SectionHeader
            title="Collections"
            description="Curated stacks of agents that work well together."
          />
        </div>
      </section>

      {/* Official highlight */}
      {official.length > 0 && (
        <section className="py-10">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                Official collections
                <Badge variant="brand">Curated by AgentDock</Badge>
              </span>
            }
            description="Vetted, maintained, and recommended by the AgentDock team."
          />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {official.map((c) => (
              <CollectionCard key={c.slug} collection={c} />
            ))}
          </div>
        </section>
      )}

      {/* All / community collections */}
      <section className="pb-14 pt-4">
        <SectionHeader
          title={official.length > 0 ? "Community collections" : "All collections"}
          description="Stacks shared by creators across the registry."
        />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(official.length > 0 ? community : collections).map((c) => (
            <CollectionCard key={c.slug} collection={c} />
          ))}
        </div>

        {/* Curator credit strip */}
        <div className="mt-10 rounded-card border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-content">
            Build your own stack
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Collections group packages that compose well — one install pulls the
            whole toolkit. Explore what curators are assembling, then publish
            your own.
          </p>
          <Link
            href="/explore"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
          >
            Browse the marketplace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
