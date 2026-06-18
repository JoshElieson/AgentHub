"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useCollections } from "@/lib/collections-data";
import { CreateCollectionModal } from "@/components/create-collection-modal";
import { SegmentedTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatCompact } from "@/lib/utils";
import type { CollectionKind, UserCollection } from "@/lib/types";
import {
  Clock,
  Layers,
  Package,
  Plug,
  Plus,
  Search,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

type FilterTab = "all" | "skills" | "mcps";

const FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "skills", label: "Skills" },
  { value: "mcps", label: "MCP Servers" },
];

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export function CollectionsClient() {
  const { collections, loading, refresh } = useCollections();
  const [tab, setTab] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isOwner, setIsOwner] = useState<Set<string>>(new Set());

  // Determine which collections belong to the current user
  useEffect(() => {
    (async () => {
      try {
        const { getAnonId } = await import("@/lib/anon-id");
        const anonId = getAnonId();
        const owned = new Set(
          collections
            .filter((c) => c.anon_id === anonId)
            .map((c) => c.id)
        );
        setIsOwner(owned);
      } catch {
        // Ignore
      }
    })();
  }, [collections]);

  const filtered = useMemo(() => {
    let items = collections;

    // Filter by kind
    if (tab !== "all") {
      items = items.filter((c) => c.kind === tab);
    }

    // Filter by search
    if (query.trim()) {
      const needle = query.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.description.toLowerCase().includes(needle)
      );
    }

    return items;
  }, [collections, tab, query]);

  const handleCreated = () => {
    refresh();
  };

  return (
    <div className="py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xs font-medium uppercase tracking-wide text-brand-muted">
            <Layers className="h-3.5 w-3.5" />
            Curated
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
            Bundles
          </h1>
          <p className="mt-1 text-sm text-muted">
            Curated groups of skills and MCP servers — install an entire
            toolkit with one click.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      {/* Search + filter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/60">
          <Search className="h-4 w-4 shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections…"
            className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-surface-2 hover:text-content"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <SegmentedTabs
          options={FILTER_OPTIONS}
          value={tab}
          onChange={(v) => setTab(v as FilterTab)}
        />
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-card border border-line bg-surface"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">
              <span className="font-medium text-content tabular-nums">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "collection" : "collections"}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <UserCollectionCard
                  key={c.id}
                  collection={c}
                  isOwner={isOwner.has(c.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title={
              query
                ? "No collections match your search"
                : "No collections yet"
            }
            description={
              query
                ? "Try a different search term."
                : "Create your first collection to group skills or MCP servers together."
            }
            action={
              !query ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  New Collection
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      {/* Create modal */}
      <CreateCollectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// User collection card
// ---------------------------------------------------------------------------

function UserCollectionCard({
  collection,
  isOwner,
}: {
  collection: UserCollection & { item_count?: number };
  isOwner: boolean;
}) {
  const isMcp = collection.kind === "mcps";
  const itemCount = collection.item_count ?? collection.items?.length ?? 0;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group card-interactive flex flex-col overflow-hidden"
    >
      {/* Cover gradient */}
      <div
        className="relative h-20 w-full border-b border-line"
        style={{ background: collection.cover_color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/35" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
        {isOwner && (
          <span className="absolute right-3 top-3 rounded-md border border-line bg-canvas/80 px-1.5 py-0.5 text-2xs font-medium text-subtle">
            Yours
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Kind badge */}
        <div className="mb-2 flex items-center gap-1.5">
          {isMcp ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-info/30 bg-info-dim px-1.5 py-0.5 text-2xs font-medium text-info">
              <Plug className="h-3 w-3" />
              MCP Servers
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-sm border border-brand-line bg-brand-dim px-1.5 py-0.5 text-2xs font-medium text-brand-muted">
              <Package className="h-3 w-3" />
              Skills
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-content group-hover:text-white">
          {collection.name}
        </h3>

        {collection.description && (
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">
            {collection.description}
          </p>
        )}

        {/* Footer stats */}
        <div className="mt-3 flex items-center justify-between text-xs text-subtle">
          <span className="flex items-center gap-1 tabular-nums">
            {isMcp ? (
              <Plug className="h-3.5 w-3.5" />
            ) : (
              <Package className="h-3.5 w-3.5" />
            )}
            {itemCount} {isMcp ? (itemCount === 1 ? "server" : "servers") : (itemCount === 1 ? "skill" : "skills")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgoShort(collection.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgoShort(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
