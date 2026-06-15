import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AgentCard } from "@/components/agent-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";
import { CommandBlock } from "@/components/ui/command-block";
import {
  collections,
  getCollection,
  getCollectionAgents,
  getCreator,
} from "@/lib/data";
import { CATEGORY_LABELS, PLATFORM_LABELS } from "@/lib/taxonomy";
import { formatCompact, formatDate, pluralize } from "@/lib/utils";
import type { Category, Platform } from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  Download,
  Layers,
  Package,
  Star,
  Users,
} from "lucide-react";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) {
    return { title: "Collection not found — AgentDock" };
  }
  return {
    title: `${collection.name} — Collections — AgentDock`,
    description: collection.description,
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const agents = getCollectionAgents(collection);
  const curator = getCreator(collection.curatorUsername);

  // Aggregate stats across the collection.
  const totalInstalls = agents.reduce((s, a) => s + a.installCount, 0);
  const totalStars = agents.reduce((s, a) => s + a.stars, 0);

  // "Why these go together" — shared platforms + category spread.
  const platformCounts = new Map<Platform, number>();
  const categorySet = new Set<Category>();
  for (const a of agents) {
    categorySet.add(a.category);
    for (const p of a.platforms) {
      platformCounts.set(p, (platformCounts.get(p) ?? 0) + 1);
    }
  }
  const sharedPlatforms = [...platformCounts.entries()]
    .filter(([, n]) => n === agents.length)
    .map(([p]) => PLATFORM_LABELS[p]);
  const categoryLabels = [...categorySet].map((c) => CATEGORY_LABELS[c]);

  return (
    <AppShell fullWidth>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0"
          style={{ background: collection.coverColor }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />

        <div className="relative mx-auto w-full max-w-site px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All collections
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas/80 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-content">
              <Layers className="h-3.5 w-3.5" />
              Collection
            </span>
            {collection.isOfficial && (
              <Badge variant="brand">
                Official
              </Badge>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
            {collection.name}
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-base text-muted">
            {collection.description}
          </p>

          {/* Curator + meta */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            {curator && (
              <Link
                href={`/u/${curator.username}`}
                className="group inline-flex items-center gap-2"
              >
                <Avatar
                  name={curator.name}
                  color={curator.avatarColor}
                  size="sm"
                />
                <span className="flex items-center gap-1">
                  <span className="text-xs text-subtle">Curated by</span>
                  <span className="font-medium text-content group-hover:text-white">
                    {curator.name}
                  </span>
                  {curator.isVerified && <VerifiedBadge />}
                </span>
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              <Package className="h-3.5 w-3.5" />
              {agents.length} {pluralize(agents.length, "package")}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              <Users className="h-3.5 w-3.5" />
              {formatCompact(collection.followers)} followers
            </span>
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              <Download className="h-3.5 w-3.5" />
              {formatCompact(totalInstalls)} installs
            </span>
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              <Star className="h-3.5 w-3.5" />
              {formatCompact(totalStars)} stars
            </span>
            <span className="flex items-center gap-1.5 text-xs text-subtle">
              <Calendar className="h-3.5 w-3.5" />
              Updated {formatDate(collection.updatedAt)}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FavoriteButton
              count={collection.followers}
              showCount
              className="h-9"
            />
            <Button variant="primary" size="md">
              <Download className="h-4 w-4" />
              Install all
            </Button>
          </div>

          {/* Install command */}
          <div className="mt-4 max-w-xl">
            <CommandBlock
              command={`npx agentdock install --collection ${collection.slug}`}
              label="Install the whole stack"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-site px-4 py-10 sm:px-6">
        {/* Why these go together */}
        <div className="rounded-card border border-brand-line bg-brand-dim/40 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-content">
            <Layers className="h-4 w-4 text-brand-muted" />
            Why these go together
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            {collection.name} bundles {agents.length}{" "}
            {pluralize(agents.length, "package")} spanning{" "}
            {categoryLabels.slice(0, 3).join(", ")}
            {categoryLabels.length > 3
              ? `, and ${categoryLabels.length - 3} more`
              : ""}
            .{" "}
            {sharedPlatforms.length > 0
              ? `Every package in this stack runs on ${sharedPlatforms
                  .slice(0, 3)
                  .join(", ")}, so they slot into the same workflow without extra setup.`
              : "They're chosen to complement one another across your toolchain — install once and the whole workflow is ready."}{" "}
            One command installs the complete toolkit.
          </p>
          {sharedPlatforms.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-2xs font-medium uppercase tracking-wide text-subtle">
                Works everywhere
              </span>
              {sharedPlatforms.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Packages */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
              In this collection
            </h2>
            <span className="text-sm text-subtle tabular-nums">
              {agents.length} {pluralize(agents.length, "package")}
            </span>
          </div>

          <ol className="mt-6 space-y-3">
            {agents.map((agent, i) => (
              <li key={agent.slug} className="flex items-start gap-3 sm:gap-4">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-sm font-semibold tabular-nums text-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <AgentCard agent={agent} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
