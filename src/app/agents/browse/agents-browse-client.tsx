"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORIES } from "@/lib/taxonomy";
import { cn, formatCompact } from "@/lib/utils";
import {
  Bot,
  Plus,
  Search,
  Star,
  Play,
  Sparkles,
  Filter,
  ChevronDown,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// We pull agent metadata from the API so the browse page and the runtime
// share a single source of truth (the SEED_AGENTS object in the API route).
// ---------------------------------------------------------------------------

interface BrowseAgent {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  interactionMode: string;
  estimatedCredits: number;
  creatorFeeCredits: number;
  creatorName: string;
  creatorUsername: string;
  creatorColor: string;
  runCount: number;
  uniqueUsers: number;
  avgRating: number;
  ratingCount: number;
  starCount: number;
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

type SortKey = "trending" | "most-runs" | "newest" | "highest-rated";

const SORT_OPTIONS: { value: SortKey; label: string; icon: React.ReactNode }[] =
  [
    { value: "trending", label: "Trending", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: "most-runs", label: "Most Runs", icon: <Play className="h-3.5 w-3.5" /> },
    { value: "newest", label: "Newest", icon: <Clock className="h-3.5 w-3.5" /> },
    { value: "highest-rated", label: "Highest Rated", icon: <Star className="h-3.5 w-3.5" /> },
  ];

// ---------------------------------------------------------------------------
// Agent Card — links directly to the playground
// ---------------------------------------------------------------------------

function AgentCard({ agent }: { agent: BrowseAgent }) {
  const MODE_LABEL: Record<string, string> = {
    chat: "Chat",
    form: "Form",
    hybrid: "Hybrid",
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-line hover:shadow-glow/5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-3 text-xl shadow-inner overflow-hidden">
          {agent.icon.startsWith("data:") || agent.icon.startsWith("http") || agent.icon.startsWith("/") ? (
            <img src={agent.icon} alt={agent.name} className="h-full w-full object-cover" />
          ) : (
            agent.icon
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-content transition-colors group-hover:text-white">
              {agent.name}
            </h3>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
            <span className="font-medium">{agent.creatorName}</span>
            <span className="text-faint">·</span>
            <span className="inline-flex items-center gap-0.5 rounded bg-surface-3 px-1.5 py-0.5 text-2xs font-medium text-muted">
              <Bot className="h-3 w-3" />
              {MODE_LABEL[agent.interactionMode] ?? "Chat"}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {agent.description}
      </p>

      {/* Tags */}
      {agent.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle"
            >
              {tag}
            </span>
          ))}
          {agent.tags.length > 3 && (
            <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle">
              +{agent.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-4 flex items-center gap-3 border-t border-line/60 pt-3">
        {/* Rating */}
        <span className="flex items-center gap-1 text-2xs text-subtle">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="font-medium tabular-nums">
            {agent.avgRating > 0 ? agent.avgRating.toFixed(1) : "—"}
          </span>
          {agent.ratingCount > 0 && (
            <span className="text-faint">({formatCompact(agent.ratingCount)})</span>
          )}
        </span>

        <span className="h-3 w-px bg-line" />

        {/* Runs */}
        <span className="flex items-center gap-1 text-2xs text-subtle">
          <Play className="h-3 w-3" />
          <span className="font-medium tabular-nums">{formatCompact(agent.runCount)}</span>
          <span className="text-faint">runs</span>
        </span>

        <span className="h-3 w-px bg-line" />

        {/* Cost */}
        <span className="flex items-center gap-1 text-2xs text-subtle">
          <Zap className="h-3 w-3 text-warning" />
          <span className="font-medium tabular-nums">~{agent.estimatedCredits}</span>
          <span className="text-faint">credits</span>
        </span>

        {/* Run CTA */}
        <Link
          href={`/agents/${agent.slug}/playground`}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-brand-line bg-brand-dim px-3 py-1.5 text-2xs font-semibold text-brand-muted transition-colors hover:bg-brand/20"
        >
          <Play className="h-3 w-3" />
          Run
        </Link>
      </div>
    </div>
  );
}

function AgentCardSkeleton() {
  return (
    <div className="h-60 animate-pulse rounded-2xl border border-line bg-surface" />
  );
}

// ---------------------------------------------------------------------------
// Browse Client
// ---------------------------------------------------------------------------

export function AgentsBrowseClient() {
  const [agents, setAgents] = useState<BrowseAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("trending");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch agent list from the API (single source of truth)
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch("/api/agents");
        if (response.ok) {
          const data = await response.json();
          setAgents(data.results || []);
        }
      } catch {
        // Fallback: empty
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    return agents
      .filter((a) => {
        if (search) {
          const q = search.toLowerCase();
          return (
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .filter((a) => {
        if (categoryFilter) return a.category === categoryFilter;
        return true;
      })
      .sort((a, b) => {
        switch (sort) {
          case "most-runs":
            return b.runCount - a.runCount;
          case "newest":
            return 0; // seed agents don't have dates
          case "highest-rated":
            return b.avgRating - a.avgRating;
          case "trending":
          default:
            return b.runCount * b.avgRating - a.runCount * a.avgRating;
        }
      });
  }, [agents, search, categoryFilter, sort]);

  return (
    <AppShell>
      <div className="py-10">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-line bg-brand-dim shadow-glow/10">
            <Sparkles className="h-7 w-7 text-brand" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
            AI Agents
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted leading-relaxed">
            Build your own agents or run community-created ones instantly.
            Pay only for what you use with credits.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <ButtonLink href="/agents/create" variant="primary" size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Agent
            </ButtonLink>
            <ButtonLink href="#browse" variant="outline" size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Agents
            </ButtonLink>
          </div>
        </div>

        {/* ── Search + Filters ──────────────────────────────────── */}
        <div id="browse" className="mb-6 space-y-4 animate-fade-in">
          {/* Search bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Search agents by name, description, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface-2 pl-10 pr-4 text-sm text-content placeholder:text-faint outline-none transition-colors focus:border-brand-line focus:ring-1 focus:ring-brand/30"
            />
          </div>

          {/* Sort + category filter row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort chips */}
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  sort === opt.value
                    ? "border-brand-line bg-brand-dim text-brand-muted"
                    : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-content"
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}

            <span className="h-5 w-px bg-line" />

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                showFilters
                  ? "border-brand-line bg-brand-dim text-brand-muted"
                  : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-content"
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  showFilters && "rotate-180"
                )}
              />
            </button>

            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter(null)}
                className="rounded-lg border border-danger/30 bg-danger-dim px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/20"
              >
                Clear filter ×
              </button>
            )}
          </div>

          {/* Category chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-1.5 animate-fade-in">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() =>
                    setCategoryFilter(
                      categoryFilter === cat.value ? null : cat.value
                    )
                  }
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    categoryFilter === cat.value
                      ? "border-brand-line bg-brand-dim text-brand-muted"
                      : "border-line bg-surface text-subtle hover:bg-surface-2 hover:text-content"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Results info ──────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            <span className="font-medium tabular-nums text-content">
              {filtered.length}
            </span>{" "}
            agent{filtered.length !== 1 && "s"}
            {categoryFilter && (
              <span className="text-faint">
                {" "}
                in{" "}
                <span className="font-medium text-subtle">
                  {CATEGORIES.find((c) => c.value === categoryFilter)?.label}
                </span>
              </span>
            )}
          </p>
        </div>

        {/* ── Grid ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-5 w-5" />}
            title="No agents found"
            description={
              search
                ? `No agents match "${search}". Try a different search or create your own!`
                : "No agents in this category yet. Be the first to create one!"
            }
            action={
              <ButtonLink href="/agents/create" variant="primary" size="md" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Agent
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
            {filtered.map((agent) => (
              <AgentCard key={agent.slug} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
