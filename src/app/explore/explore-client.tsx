"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  EMPTY_FILTERS,
  filterAgents,
  type FilterState,
} from "@/lib/data";
import {
  CATEGORY_LABELS,
  PACKAGE_TYPE_LABELS,
  PLATFORM_LABELS,
  PRICING_LABELS,
  SORT_OPTIONS,
  type SortKey,
} from "@/lib/taxonomy";
import type {
  Category,
  License,
  PackageType,
  Platform,
  Pricing,
} from "@/lib/types";
import { cn, formatNumber, pluralize } from "@/lib/utils";
import { AgentGrid } from "@/components/agent-grid";
import { FilterSidebar } from "@/components/filter-sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ChevronDown, PackageOpen, Search, SlidersHorizontal, X } from "lucide-react";

// ---------------------------------------------------------------------------
// URL seeding — translate the supported query params into a FilterState.
// ---------------------------------------------------------------------------

const SORT_VALUES = new Set(SORT_OPTIONS.map((s) => s.value));

function seedFromParams(params: URLSearchParams): FilterState {
  const next: FilterState = {
    ...EMPTY_FILTERS,
    types: [],
    platforms: [],
    categories: [],
    licenses: [],
    pricing: [],
  };

  const q = params.get("q");
  if (q) next.query = q;

  const category = params.get("category");
  if (category && category in CATEGORY_LABELS) {
    next.categories = [category as Category];
  }

  const platform = params.get("platform");
  if (platform && platform in PLATFORM_LABELS) {
    next.platforms = [platform as Platform];
  }

  const sort = params.get("sort");
  if (sort && SORT_VALUES.has(sort as SortKey)) {
    next.sort = sort as SortKey;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Active filter chips
// ---------------------------------------------------------------------------

type ChipKey = "types" | "platforms" | "categories" | "licenses" | "pricing";

interface Chip {
  key: ChipKey;
  value: string;
  label: string;
}

function buildChips(state: FilterState): Chip[] {
  const chips: Chip[] = [];
  for (const t of state.types) {
    chips.push({ key: "types", value: t, label: PACKAGE_TYPE_LABELS[t as PackageType] });
  }
  for (const p of state.platforms) {
    chips.push({ key: "platforms", value: p, label: PLATFORM_LABELS[p as Platform] });
  }
  for (const c of state.categories) {
    chips.push({ key: "categories", value: c, label: CATEGORY_LABELS[c as Category] });
  }
  for (const l of state.licenses) {
    chips.push({ key: "licenses", value: l, label: l === "Unknown" ? "No license" : (l as License) });
  }
  for (const pr of state.pricing) {
    chips.push({ key: "pricing", value: pr, label: PRICING_LABELS[pr as Pricing] });
  }
  return chips;
}

// ---------------------------------------------------------------------------
// Page client
// ---------------------------------------------------------------------------

export function ExploreClient() {
  const searchParams = useSearchParams();
  // Seed once from the URL; thereafter filters are owned by client state.
  const [state, setState] = useState<FilterState>(() =>
    seedFromParams(new URLSearchParams(searchParams?.toString() ?? ""))
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const seeded = useRef(false);

  // Re-seed if the URL params change after mount (e.g. clicking a category
  // link elsewhere that navigates to /explore?category=…). Runs once per
  // distinct param string; never clobbers user edits on the same URL.
  const paramKey = searchParams?.toString() ?? "";
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    setState(seedFromParams(new URLSearchParams(paramKey)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  const results = useMemo(() => filterAgents(state), [state]);
  const chips = useMemo(() => buildChips(state), [state]);

  const facetCount =
    state.types.length +
    state.platforms.length +
    state.categories.length +
    state.licenses.length +
    state.pricing.length;
  const hasAnyFilter = facetCount > 0 || state.query.trim().length > 0;

  const clearAll = () =>
    setState((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }));

  const removeChip = (chip: Chip) =>
    setState((prev) => ({
      ...prev,
      [chip.key]: (prev[chip.key] as string[]).filter((v) => v !== chip.value),
    }));

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
          Explore the marketplace
        </h1>
        <p className="text-sm text-muted">
          Search and filter every agent, skill, MCP server, workflow, and prompt
          pack in the registry.
        </p>
      </div>

      {/* Search + sort + mobile filter toggle */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/60">
          <Search className="h-4 w-4 shrink-0 text-subtle" />
          <input
            value={state.query}
            onChange={(e) =>
              setState((prev) => ({ ...prev, query: e.target.value }))
            }
            placeholder="Search agents, skills, MCP servers, tags…"
            className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
            aria-label="Search packages"
          />
          {state.query && (
            <button
              onClick={() => setState((prev) => ({ ...prev, query: "" }))}
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-surface-2 hover:text-content"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {facetCount > 0 && (
              <span className="ml-0.5 grid h-4 min-w-4 place-items-center rounded-sm bg-brand px-1 text-2xs font-semibold text-brand-fg tabular-nums">
                {facetCount}
              </span>
            )}
          </Button>
          <SortSelect
            value={state.sort}
            onChange={(sort) => setState((prev) => ({ ...prev, sort }))}
          />
        </div>
      </div>

      {/* Body: sidebar + results */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar (desktop) */}
        <div className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20">
            <FilterSidebar
              value={state}
              onChange={setState}
              onClear={clearAll}
            />
          </div>
        </div>

        {/* Results column */}
        <div className="min-w-0 flex-1">
          {/* Result count + active chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm font-medium text-content tabular-nums">
              {formatNumber(results.length)}{" "}
              <span className="text-muted">
                {pluralize(results.length, "package")}
              </span>
            </span>
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted transition-colors hover:text-brand"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <button
                  key={`${chip.key}:${chip.value}`}
                  onClick={() => removeChip(chip)}
                  className="group inline-flex items-center gap-1 rounded-md border border-brand-line bg-brand-dim py-0.5 pl-2 pr-1 text-2xs font-medium text-brand-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {chip.label}
                  <X className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {/* Grid / empty */}
          <div className="mt-5">
            {results.length > 0 ? (
              <AgentGrid agents={results} columns={3} />
            ) : (
              <EmptyState
                icon={<PackageOpen className="h-6 w-6" />}
                title="No packages match your filters"
                description="Try removing a filter or searching for something broader."
                action={
                  <Button variant="primary" size="md" onClick={clearAll}>
                    Clear all filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-canvas/80 animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-line bg-surface shadow-overlay animate-slide-up">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold text-content">Filters</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-content"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <FilterSidebar
                value={state}
                onChange={setState}
                onClear={clearAll}
              />
            </div>
            <div className="border-t border-line p-4">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Show {formatNumber(results.length)}{" "}
                {pluralize(results.length, "package")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort select — native <select> styled to match the dark design language.
// ---------------------------------------------------------------------------

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-3 text-xs font-medium text-subtle">
        Sort:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Sort packages"
        className={cn(
          "h-9 cursor-pointer appearance-none rounded-lg border border-line bg-surface-2 pl-[3.1rem] pr-8 text-sm font-medium text-content transition-colors",
          "hover:border-line-strong focus:border-brand/60 focus:outline-none"
        )}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-content">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-subtle" />
    </label>
  );
}
