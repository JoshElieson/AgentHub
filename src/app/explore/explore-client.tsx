"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useMarketplaceData,
  type SkillRow,
  type McpServerRow,
  type MarketplaceSort,
} from "@/lib/marketplace-data";
import {
  SkillCard,
  McpServerCard,
  MarketplaceCardSkeleton,
} from "@/components/marketplace-cards";
import { CATEGORIES, MODELS, compatibleModels } from "@/lib/taxonomy";
import type { Category, SkillModel } from "@/lib/types";
import { cn, formatNumber, pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChevronDown,
  PackageOpen,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Unified item model — skills and MCP servers browse together; `kind` picks
// the card.
// ---------------------------------------------------------------------------

type ItemKind = "skill" | "mcp";

// Each catalogue entry carries a precomputed lowercased search string and its
// resolved compatible-provider list, so the per-keystroke filter does only
// cheap substring/inclusion checks instead of rebuilding strings/arrays across
// the whole (~1.5k+) catalogue on every render.
type Item =
  | { kind: "skill"; data: SkillRow; haystack: string; compat: SkillModel[] }
  | { kind: "mcp"; data: McpServerRow; haystack: string; compat: SkillModel[] };

/** How many cards to render per page; more are revealed as the user scrolls. */
const PAGE_SIZE = 48;

const TYPE_OPTIONS: { value: ItemKind; label: string }[] = [
  { value: "skill", label: "Skills" },
  { value: "mcp", label: "MCP servers" },
];

const CATEGORY_OPTIONS: { value: Category; label: string }[] = CATEGORIES.map(
  (c) => ({ value: c.value, label: c.label })
);

const MODEL_OPTIONS: { value: SkillModel; label: string }[] = MODELS.map((m) => ({
  value: m.value,
  label: m.label,
}));

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest rated" },
  { value: "stars", label: "Most starred" },
  { value: "exports", label: "Most exported" },
];

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface FilterState {
  query: string;
  types: ItemKind[];
  categories: Category[];
  models: SkillModel[];
  sort: MarketplaceSort;
}

const EMPTY_FILTERS: FilterState = {
  query: "",
  types: [],
  categories: [],
  models: [],
  sort: "relevance",
};

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/** Build the lowercased searchable string for an item once, at index time. */
function buildHaystack(
  kind: ItemKind,
  data: SkillRow | McpServerRow
): string {
  const triggers =
    kind === "skill" ? (data as SkillRow).trigger_phrases : [];
  return [data.name, data.description, ...(data.tags ?? []), ...triggers]
    .join(" ")
    .toLowerCase();
}

function sortItems(items: Item[], sort: MarketplaceSort): Item[] {
  const arr = [...items];
  switch (sort) {
    case "newest":
      return arr.sort(
        (a, b) =>
          new Date(b.data.created_at).getTime() -
          new Date(a.data.created_at).getTime()
      );
    case "rating":
      return arr.sort((a, b) => b.data.avg_rating - a.data.avg_rating);
    case "stars":
      return arr.sort((a, b) => b.data.star_count - a.data.star_count);
    case "exports":
      return arr.sort((a, b) => b.data.export_count - a.data.export_count);
    case "relevance":
    default:
      // Stable popularity signal when no explicit sort is chosen.
      return arr.sort((a, b) => b.data.export_count - a.data.export_count);
  }
}

// ---------------------------------------------------------------------------
// URL seeding — translate supported query params into a FilterState.
// Supports comma-separated lists, e.g. /explore?category=devops,security
// ---------------------------------------------------------------------------

function seedFromParams(params: URLSearchParams): FilterState {
  const next: FilterState = { ...EMPTY_FILTERS, types: [], categories: [], models: [] };

  const q = params.get("q");
  if (q) next.query = q;

  const type = params.get("type");
  if (type === "skill" || type === "mcp") next.types = [type];

  const category = params.get("category");
  if (category) {
    const valid = new Set(CATEGORY_OPTIONS.map((o) => o.value));
    next.categories = category
      .split(",")
      .map((c) => c.trim())
      .filter((c): c is Category => valid.has(c as Category));
  }

  const model = params.get("model");
  if (model) {
    const valid = new Set(MODEL_OPTIONS.map((o) => o.value));
    next.models = model
      .split(",")
      .map((m) => m.trim())
      .filter((m): m is SkillModel => valid.has(m as SkillModel));
  }

  const sort = params.get("sort");
  if (SORT_OPTIONS.some((o) => o.value === sort)) {
    next.sort = sort as MarketplaceSort;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Active filter chips — each chip knows which facet it belongs to.
// ---------------------------------------------------------------------------

type FacetKind = "type" | "category" | "model";

interface Chip {
  kind: FacetKind;
  value: string;
  label: string;
}

function buildChips(state: FilterState): Chip[] {
  return [
    ...state.types.map((t): Chip => ({
      kind: "type",
      value: t,
      label: TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
    })),
    ...state.categories.map((c): Chip => ({
      kind: "category",
      value: c,
      label: CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c,
    })),
    ...state.models.map((m): Chip => ({
      kind: "model",
      value: m,
      label: MODEL_OPTIONS.find((o) => o.value === m)?.label ?? m,
    })),
  ];
}

// ---------------------------------------------------------------------------
// Page client
// ---------------------------------------------------------------------------

export function ExploreClient() {
  const searchParams = useSearchParams();
  const { skills, mcpServers, loading } = useMarketplaceData();

  // Seed once from the URL; thereafter filters are owned by client state.
  const [state, setState] = useState<FilterState>(() =>
    seedFromParams(new URLSearchParams(searchParams?.toString() ?? ""))
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const seeded = useRef(false);

  // Re-seed if the URL params change after mount (e.g. a category link elsewhere
  // navigating to /explore?category=…). Runs once per distinct param string.
  const paramKey = searchParams?.toString() ?? "";
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    setState(seedFromParams(new URLSearchParams(paramKey)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramKey]);

  // Full unified catalogue, indexed once (haystack + compatible providers) so
  // filtering never rebuilds per-item strings/arrays on each keystroke.
  const allItems = useMemo<Item[]>(
    () => [
      ...skills.map((s): Item => ({
        kind: "skill",
        data: s,
        haystack: buildHaystack("skill", s),
        compat: compatibleModels(s.model),
      })),
      ...mcpServers.map((m): Item => ({
        kind: "mcp",
        data: m,
        haystack: buildHaystack("mcp", m),
        compat: compatibleModels(m.model),
      })),
    ],
    [skills, mcpServers]
  );

  // Defer the *filtering* query so typing stays responsive: the controlled
  // input updates at high priority while the heavy list recompute runs at a
  // lower priority (and is interruptible by the next keystroke).
  const deferredQuery = useDeferredValue(state.query);
  const { types, categories, models, sort } = state;

  const results = useMemo(() => {
    const needle = deferredQuery.toLowerCase().trim();
    const terms = needle ? needle.split(/\s+/) : [];
    const filtered = allItems.filter((item) => {
      if (types.length && !types.includes(item.kind)) return false;
      if (categories.length) {
        const cat = item.data.category;
        if (!cat || !categories.includes(cat)) return false;
      }
      if (models.length) {
        const raw = item.data.model ?? [];
        // Provider filters match a package that lists that provider OR is
        // model-agnostic (universal expands to all providers, matching its
        // logos); the "Universal" filter matches only agnostic packages.
        const ok = models.some((sel) =>
          sel === "universal"
            ? raw.includes("universal")
            : item.compat.includes(sel)
        );
        if (!ok) return false;
      }
      if (terms.length && !terms.every((t) => item.haystack.includes(t)))
        return false;
      return true;
    });
    return sortItems(filtered, sort);
  }, [allItems, deferredQuery, types, categories, models, sort]);

  // Windowed rendering — start with a single page and reveal more on scroll so
  // the initial mount isn't the whole ~1.5k+ catalogue (the root cause of the
  // typing/filter jank). Cards scrolled past stay mounted but are culled from
  // browser layout/paint via `.cv-card` (content-visibility), so a deep scroll
  // doesn't re-accumulate cost. Reset the window synchronously (during render)
  // whenever the result set changes so a new search starts at the top with no
  // flash of the previous overflow.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filterSig = `${deferredQuery} ${sort} ${types.join(
    ","
  )} ${categories.join(",")} ${models.join(",")}`;
  const [prevSig, setPrevSig] = useState(filterSig);
  if (filterSig !== prevSig) {
    setPrevSig(filterSig);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount]
  );
  const hasMore = visibleCount < results.length;

  // Reveal the next page as a bottom sentinel scrolls into view. Re-observing
  // on each change lets a fresh callback fire when the sentinel is still in
  // range (e.g. a short page), so the grid fills smoothly without a button.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, results.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, visibleCount, results]);

  const chips = useMemo(() => buildChips(state), [state]);
  const facetCount =
    state.types.length + state.categories.length + state.models.length;
  const hasAnyFilter = facetCount > 0 || state.query.trim().length > 0;

  const clearAll = () =>
    setState((prev) => ({ ...EMPTY_FILTERS, sort: prev.sort }));

  const removeChip = (chip: Chip) =>
    setState((prev) => {
      switch (chip.kind) {
        case "type":
          return { ...prev, types: prev.types.filter((v) => v !== chip.value) };
        case "category":
          return {
            ...prev,
            categories: prev.categories.filter((v) => v !== chip.value),
          };
        case "model":
          return { ...prev, models: prev.models.filter((v) => v !== chip.value) };
        default:
          return prev;
      }
    });

  const toggleType = (v: ItemKind) =>
    setState((prev) => ({ ...prev, types: toggle(prev.types, v) }));
  const toggleCategory = (v: Category) =>
    setState((prev) => ({ ...prev, categories: toggle(prev.categories, v) }));
  const toggleModel = (v: SkillModel) =>
    setState((prev) => ({ ...prev, models: toggle(prev.models, v) }));

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const sidebar = (
    <MarketplaceFilters
      types={state.types}
      categories={state.categories}
      models={state.models}
      onToggleType={toggleType}
      onToggleCategory={toggleCategory}
      onToggleModel={toggleModel}
      onClear={clearAll}
      activeCount={facetCount}
    />
  );

  return (
    <div className="py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
          Explore the marketplace
        </h1>
        <p className="text-sm text-muted">
          Search and filter every Skill and MCP server in the registry.
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
            placeholder="Search skills, MCP servers, tags…"
            className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
            aria-label="Search the marketplace"
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
          <div className="sticky top-20">{sidebar}</div>
        </div>

        {/* Results column */}
        <div className="min-w-0 flex-1">
          {/* Result count + active chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm font-medium text-content tabular-nums">
              {formatNumber(results.length)}{" "}
              <span className="text-muted">
                {pluralize(results.length, "result")}
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
                  key={`${chip.kind}-${chip.value}`}
                  onClick={() => removeChip(chip)}
                  className="group inline-flex items-center gap-1 rounded-md border border-brand-line bg-brand-dim py-0.5 pl-2 pr-1 text-2xs font-medium text-brand-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {chip.label}
                  <X className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {/* Grid / empty / loading */}
          <div className="mt-5">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MarketplaceCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleResults.map((item) =>
                    item.kind === "skill" ? (
                      <SkillCard
                        key={`skill-${item.data.id}`}
                        skill={item.data}
                        className="cv-card"
                      />
                    ) : (
                      <McpServerCard
                        key={`mcp-${item.data.id}`}
                        server={item.data}
                        className="cv-card"
                      />
                    )
                  )}
                </div>
                {hasMore && (
                  <div
                    ref={sentinelRef}
                    className="h-10"
                    aria-hidden
                    data-testid="explore-load-more-sentinel"
                  />
                )}
              </>
            ) : (
              <EmptyState
                icon={<PackageOpen className="h-6 w-6" />}
                title="Nothing matches your filters"
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
            <div className="flex-1 overflow-y-auto px-4 py-4">{sidebar}</div>
            <div className="border-t border-line p-4">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Show {formatNumber(results.length)}{" "}
                {pluralize(results.length, "result")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter sidebar — Type, Category, and Model facets.
// ---------------------------------------------------------------------------

function MarketplaceFilters({
  types,
  categories,
  models,
  onToggleType,
  onToggleCategory,
  onToggleModel,
  onClear,
  activeCount,
}: {
  types: ItemKind[];
  categories: Category[];
  models: SkillModel[];
  onToggleType: (v: ItemKind) => void;
  onToggleCategory: (v: Category) => void;
  onToggleModel: (v: SkillModel) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <aside className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted hover:text-brand"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup
        title="Type"
        options={TYPE_OPTIONS}
        selected={types}
        onToggle={(v) => onToggleType(v as ItemKind)}
      />

      <FilterGroup
        title="Category"
        options={CATEGORY_OPTIONS}
        selected={categories}
        onToggle={(v) => onToggleCategory(v as Category)}
      />

      <FilterGroup
        title="Model"
        options={MODEL_OPTIONS}
        selected={models}
        onToggle={(v) => onToggleModel(v as SkillModel)}
      />
    </aside>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="border-b border-line py-4 first:pt-0">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
        {title}
      </h4>
      <div className="space-y-0.5">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
                  checked
                    ? "border-brand bg-brand"
                    : "border-line-strong bg-transparent"
                )}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none">
                    <path
                      d="M2 6l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
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
  value: MarketplaceSort;
  onChange: (v: MarketplaceSort) => void;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="pointer-events-none absolute left-3 text-xs font-medium text-subtle">
        Sort:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MarketplaceSort)}
        aria-label="Sort results"
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
