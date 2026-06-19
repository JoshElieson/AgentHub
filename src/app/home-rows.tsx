"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ThumbsUp,
  Download,
  Layers,
  Package,
  Plug,
  Clock,
  Code2,
  Shield,
  Server,
  FlaskConical,
  Palette,
  PenLine,
  BarChart3,
  Zap,
  GraduationCap,
  MousePointerClick,
  Megaphone,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { cn, formatCompact } from "@/lib/utils";
import { isOfficial } from "@/lib/marketplace-data";
import { classifySkill } from "@/lib/skill-classification";
import type { Category } from "@/lib/types";

// ---------------------------------------------------------------------------
// Layout — exactly PER_PAGE items per page, PAGES total → TOTAL cards in the
// track. Trending Bundles uses 3 pages (15 collections).
// Newly Uploaded uses 3 pages of recent skills/MCPs (15 cards).
// ---------------------------------------------------------------------------

const PER_PAGE = 5;

// Light-brown gradient for the dots: darkest left → brand base → lightest right.
const SELECTED_SHADES = ["#9c7a4e", "#b48c5d", "#c49b6c", "#d3b287", "#e1c9a3"];

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

interface TrendingSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  trigger_phrases: string[];
  source_url: string | null;
  created_at: string;
  star_count: number;
  export_count: number;
  avg_rating: number;
  rating_count: number;
  category?: string;
  model?: string[];
}

interface TrendingCollection {
  id: string;
  name: string;
  description: string;
  kind: "skills" | "mcps";
  cover_color: string;
  item_count: number;
  updated_at: string;
}

// A single carousel slot is either a skill or a collection.
type TrendingItem =
  | { type: "skill"; data: TrendingSkill }
  | { type: "collection"; data: TrendingCollection };

// ---------------------------------------------------------------------------
// Trending Bundles — 15 top collections across 3 pages
// ---------------------------------------------------------------------------

const PINNED_COLLECTION_NAME = "Anthropic Skills";
const REMAINING_COLLECTIONS = 14; // 15 total minus 1 pinned
const TRENDING_TOTAL = 15; // 3 pages × 5
const TRENDING_PAGES = 3;

export function TrendingNow() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const collectionsRes = await fetch("/api/collections?public=true");
        const combined: TrendingItem[] = [];

        if (collectionsRes.ok) {
          const { collections } = await collectionsRes.json();
          // Sort descending by item_count so worst (fewest items) falls off the end
          const allCollections = (collections ?? []).sort(
            (a: any, b: any) => (b.item_count ?? 0) - (a.item_count ?? 0)
          );

          // Pin "Anthropic Skills" first
          const pinnedIdx = allCollections.findIndex(
            (c: any) =>
              c.name?.toLowerCase() === PINNED_COLLECTION_NAME.toLowerCase()
          );
          if (pinnedIdx >= 0) {
            const [pinned] = allCollections.splice(pinnedIdx, 1);
            combined.push({ type: "collection", data: pinned });
          }

          // Fill remaining 14 slots from the top by item_count
          const rest = allCollections.slice(0, REMAINING_COLLECTIONS);
          for (const c of rest) {
            combined.push({ type: "collection", data: c });
          }
        }

        setItems(combined);
      } catch {
        // fail silently — skeleton stays
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
            Trending Bundles
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-pulse rounded-card border border-line bg-surface"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Pad to exactly TRENDING_TOTAL so we always have 4 full pages.
  // If fewer items came back (e.g. no collections yet), pad with what we have.
  const padded = [...items];
  while (padded.length < TRENDING_TOTAL && padded.length > 0) {
    padded.push(items[padded.length % items.length]);
  }
  const track = padded.slice(0, TRENDING_TOTAL);

  return (
    <TrendingScrollRow
      title="Trending Bundles"
      items={track}
      pages={TRENDING_PAGES}
      seeAllHref="/explore"
    />
  );
}

// ---------------------------------------------------------------------------
// Newly Uploaded — 15 most recent skills / MCPs (3 pages × 5)
// ---------------------------------------------------------------------------

interface RecentItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  trigger_phrases: string[];
  source_url: string | null;
  created_at: string;
  star_count: number;
  export_count: number;
  avg_rating: number;
  rating_count: number;
  kind: "skill" | "mcp";
  // Added after classification (skills only)
  category?: string;
  model?: string[];
}

const RECENT_TOTAL = 15;
const RECENT_PAGES = RECENT_TOTAL / PER_PAGE; // 3

export function NewlyUploaded() {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/skills/recent");
        if (!res.ok) throw new Error("fetch failed");
        const { items: raw } = await res.json();

        const classified: RecentItem[] = (raw ?? [])
          .slice(0, RECENT_TOTAL)
          .map((item: any) => {
            if (item.kind === "skill") {
              const { category, model } = classifySkill({
                name: item.name,
                description: item.description,
                tags: item.tags,
              });
              return { ...item, category, model };
            }
            return item;
          });

        setItems(classified);
      } catch {
        // fail silently — skeleton stays
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
            Newly Uploaded
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: PER_PAGE }, (_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-pulse rounded-card border border-line bg-surface"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <NewlyUploadedScrollRow
      title="Newly Uploaded"
      items={items}
      pages={RECENT_PAGES}
    />
  );
}

// ---------------------------------------------------------------------------
// TrendingScrollRow — infinite-wrap carousel of mixed skill + collection cards
// with a fixed page count and dot indicators.
// ---------------------------------------------------------------------------

function TrendingScrollRow({
  title,
  items,
  pages,
  seeAllHref,
}: {
  title: string;
  items: TrendingItem[];
  pages: number;
  seeAllHref?: string;
}) {
  // Clone last page at front and first page at end for infinite wrapping.
  const extended = [
    ...items.slice((pages - 1) * PER_PAGE), // clone of last page
    ...items,
    ...items.slice(0, PER_PAGE), // clone of first page
  ];

  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);

  const step = useCallback((dir: number) => {
    setAnimate(true);
    setPos((p) => p + dir);
  }, []);

  const goTo = useCallback((page: number) => {
    setAnimate(true);
    setPos(page + 1); // real pages live at positions 1..pages
  }, []);

  const activePage = (((pos - 1) % pages) + pages) % pages;

  const handleTransitionEnd = useCallback(() => {
    setPos((p) => {
      if (p === 0) {
        setAnimate(false);
        return pages; // snap from leading clone to last real page
      }
      if (p === pages + 1) {
        setAnimate(false);
        return 1; // snap from trailing clone to first real page
      }
      return p;
    });
  }, [pages]);

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
          {title}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="group flex items-center gap-1 text-sm font-medium text-brand-muted transition-colors hover:text-brand"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Mobile (<sm): a native, swipeable snap-scrolling strip — one-and-a-bit
          cards in view at a phone width, instead of five crammed across ~375px.
          The paged transform carousel below is desktop/tablet only. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:hidden">
        {items.map((item, i) => (
          <div key={i} className="w-[82%] shrink-0 snap-start">
            {item.type === "skill" ? (
              <SkillCard skill={item.data} />
            ) : (
              <CollectionCard collection={item.data} />
            )}
          </div>
        ))}
      </div>

      <div className="relative hidden sm:block">
        <div className="overflow-hidden">
          <div
            className={
              animate
                ? "flex gap-4 transition-transform duration-500 ease-out-expo"
                : "flex gap-4"
            }
            style={{
              transform: `translateX(calc(-${pos * 100}% - ${pos * 1}rem))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extended.map((item, i) => (
              <div
                key={i}
                aria-hidden={i < PER_PAGE || i >= extended.length - PER_PAGE}
                className="shrink-0 basis-[calc((100%-4rem)/5)]"
              >
                {item.type === "skill" ? (
                  <SkillCard skill={item.data} />
                ) : (
                  <CollectionCard collection={item.data} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Previous ${title}`}
          className="absolute -left-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Next ${title}`}
          className="absolute -right-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-4 hidden items-center justify-center gap-2 sm:flex">
        {Array.from({ length: pages }, (_, i) => {
          const isActive = i === activePage;
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={isActive}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isActive
                  ? "w-7 opacity-100"
                  : "w-1.5 opacity-50 hover:opacity-100"
              )}
              style={{
                backgroundColor:
                  SELECTED_SHADES[
                    Math.round(
                      (i * (SELECTED_SHADES.length - 1)) / (pages - 1)
                    )
                  ],
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Category → visual palette (gradient + accent for floating emblem)
// ---------------------------------------------------------------------------

const CATEGORY_PALETTE: Record<
  string,
  { gradient: string; accent: string; icon: LucideIcon }
> = {
  development: {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    accent: "text-[#667eea]",
    icon: Code2,
  },
  security: {
    gradient: "linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)",
    accent: "text-[#f5576c]",
    icon: Shield,
  },
  devops: {
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    accent: "text-[#4facfe]",
    icon: Server,
  },
  research: {
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    accent: "text-[#43e97b]",
    icon: FlaskConical,
  },
  design: {
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    accent: "text-[#f093fb]",
    icon: Palette,
  },
  writing: {
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    accent: "text-[#a18cd1]",
    icon: PenLine,
  },
  "data-science": {
    gradient: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
    accent: "text-[#fccb90]",
    icon: BarChart3,
  },
  productivity: {
    gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    accent: "text-[#30cfd0]",
    icon: Zap,
  },
  education: {
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
    accent: "text-[#a1c4fd]",
    icon: GraduationCap,
  },
  "browser-automation": {
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    accent: "text-[#fa709a]",
    icon: MousePointerClick,
  },
  integrations: {
    gradient: "linear-gradient(135deg, #c49b6c 0%, #9c7a4e 100%)",
    accent: "text-brand-muted",
    icon: Plug,
  },
  marketing: {
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    accent: "text-[#ff9a9e]",
    icon: Megaphone,
  },
};

const DEFAULT_PALETTE = CATEGORY_PALETTE.development;

// ---------------------------------------------------------------------------
// SkillCard — gradient header card matching the collection card visual style
// ---------------------------------------------------------------------------

function SkillCard({ skill }: { skill: TrendingSkill }) {
  const palette =
    CATEGORY_PALETTE[skill.category ?? ""] ?? DEFAULT_PALETTE;
  const Icon = palette.icon;
  const official = isOfficial({
    tags: skill.tags,
    source_url: skill.source_url,
  });

  return (
    <Link
      href={`/marketplace/${skill.id}`}
      className="group flex aspect-[4/3] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:border-brand-line hover:shadow-glow/5"
    >
      {/* Cover gradient — category-specific */}
      <div
        className="relative h-16 w-full shrink-0 border-b border-line"
        style={{ background: palette.gradient }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/35" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        {/* Floating emblem */}
        <div className="absolute -bottom-3.5 left-3.5 grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface shadow-sm">
          <Icon className={cn("h-3.5 w-3.5", palette.accent)} />
        </div>
        {/* Official badge */}
        {official && (
          <span className="absolute right-2.5 top-2.5" title="Official package">
            <BadgeCheck className="h-4 w-4 text-sky-400 drop-shadow-sm" />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-5">
        {/* Type badge */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-sm border border-brand-line bg-brand-dim px-1 py-px text-2xs font-medium text-brand-muted">
            <Package className="h-2.5 w-2.5" />
            Skill
          </span>
        </div>

        <h3 className="truncate text-sm font-semibold text-content transition-colors group-hover:text-white">
          {skill.name}
        </h3>

        <p className="mt-0.5 line-clamp-2 flex-1 text-xs leading-snug text-muted">
          {skill.description}
        </p>

        {/* Footer stats */}
        <div className="mt-auto flex items-center justify-between pt-2 text-2xs text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3 text-brand-muted" />
              <span className="font-medium tabular-nums">
                {formatCompact(skill.star_count)}
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <Download className="h-3 w-3" />
              <span className="font-medium tabular-nums">
                {formatCompact(skill.export_count)}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgoShort(skill.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// CollectionCard — compact card for a single collection in the carousel
// ---------------------------------------------------------------------------

function CollectionCard({ collection }: { collection: TrendingCollection }) {
  const isMcp = collection.kind === "mcps";

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group flex aspect-[4/3] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:border-brand-line hover:shadow-glow/5"
    >
      {/* Cover gradient */}
      <div
        className="relative h-16 w-full shrink-0 border-b border-line"
        style={{ background: collection.cover_color }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/35" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        <div className="absolute -bottom-3.5 left-3.5 grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface shadow-sm">
          <Layers className="h-3.5 w-3.5 text-brand-muted" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-5">
        {/* Kind badge */}
        <div className="mb-1.5 flex items-center gap-1.5">
          {isMcp ? (
            <span className="inline-flex items-center gap-0.5 rounded-sm border border-info/30 bg-info-dim px-1 py-px text-2xs font-medium text-info">
              <Plug className="h-2.5 w-2.5" />
              MCP Servers
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-sm border border-brand-line bg-brand-dim px-1 py-px text-2xs font-medium text-brand-muted">
              <Package className="h-2.5 w-2.5" />
              Skills
            </span>
          )}
        </div>

        <h3 className="truncate text-sm font-semibold text-content transition-colors group-hover:text-white">
          {collection.name}
        </h3>

        {collection.description && (
          <p className="mt-0.5 line-clamp-2 flex-1 text-xs leading-snug text-muted">
            {collection.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2 text-2xs text-subtle">
          <span className="flex items-center gap-1 tabular-nums">
            {isMcp ? (
              <Plug className="h-3 w-3" />
            ) : (
              <Package className="h-3 w-3" />
            )}
            {collection.item_count}{" "}
            {isMcp
              ? collection.item_count === 1
                ? "server"
                : "servers"
              : collection.item_count === 1
                ? "skill"
                : "skills"}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgoShort(collection.updated_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
// ---------------------------------------------------------------------------
// McpCard — gradient header card for MCP servers in the recent carousel
// ---------------------------------------------------------------------------

function McpCard({ item }: { item: RecentItem }) {
  return (
    <Link
      href={`/marketplace/mcp/${item.id}`}
      className="group flex aspect-[4/3] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:border-brand-line hover:shadow-glow/5"
    >
      {/* Cover gradient — MCP teal-blue */}
      <div
        className="relative h-16 w-full shrink-0 border-b border-line"
        style={{
          background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/35" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        <div className="absolute -bottom-3.5 left-3.5 grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface shadow-sm">
          <Plug className="h-3.5 w-3.5 text-[#06b6d4]" />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3 pt-5">
        {/* Type badge */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-sm border border-info/30 bg-info-dim px-1 py-px text-2xs font-medium text-info">
            <Plug className="h-2.5 w-2.5" />
            MCP Server
          </span>
        </div>

        <h3 className="truncate text-sm font-semibold text-content transition-colors group-hover:text-white">
          {item.name}
        </h3>

        <p className="mt-0.5 line-clamp-2 flex-1 text-xs leading-snug text-muted">
          {item.description}
        </p>

        {/* Footer stats */}
        <div className="mt-auto flex items-center justify-between pt-2 text-2xs text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3 text-brand-muted" />
              <span className="font-medium tabular-nums">
                {formatCompact(item.star_count)}
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <Download className="h-3 w-3" />
              <span className="font-medium tabular-nums">
                {formatCompact(item.export_count)}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgoShort(item.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// NewlyUploadedScrollRow — infinite-wrap carousel of recent skill + MCP cards
// ---------------------------------------------------------------------------

function NewlyUploadedScrollRow({
  title,
  items,
  pages,
}: {
  title: string;
  items: RecentItem[];
  pages: number;
}) {
  // Pad to exactly pages * PER_PAGE by cycling
  const padded: RecentItem[] = [];
  const total = pages * PER_PAGE;
  for (let i = 0; i < total; i++) padded.push(items[i % items.length]);

  // Clone last page before + first page after for infinite wrap
  const extended = [
    ...padded.slice((pages - 1) * PER_PAGE),
    ...padded,
    ...padded.slice(0, PER_PAGE),
  ];

  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);

  const step = useCallback(
    (dir: number) => {
      setAnimate(true);
      setPos((p) => p + dir);
    },
    []
  );

  const goTo = useCallback((page: number) => {
    setAnimate(true);
    setPos(page + 1);
  }, []);

  const activePage = (((pos - 1) % pages) + pages) % pages;

  const handleTransitionEnd = useCallback(() => {
    setPos((p) => {
      if (p === 0) {
        setAnimate(false);
        return pages;
      }
      if (p === pages + 1) {
        setAnimate(false);
        return 1;
      }
      return p;
    });
  }, [pages]);

  return (
    <section className="py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
          {title}
        </h2>
      </div>

      {/* Mobile (<sm): native swipeable snap-scrolling strip. The paged
          transform carousel below is desktop/tablet only. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:hidden">
        {items.map((item, i) => (
          <div key={`m-${item.id}-${i}`} className="w-[82%] shrink-0 snap-start">
            {item.kind === "mcp" ? (
              <McpCard item={item} />
            ) : (
              <SkillCard skill={item as unknown as TrendingSkill} />
            )}
          </div>
        ))}
      </div>

      <div className="relative hidden sm:block">
        <div className="overflow-hidden">
          <div
            className={
              animate
                ? "flex gap-4 transition-transform duration-500 ease-out-expo"
                : "flex gap-4"
            }
            style={{
              transform: `translateX(calc(-${pos * 100}% - ${pos * 1}rem))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extended.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                aria-hidden={
                  i < PER_PAGE || i >= extended.length - PER_PAGE
                }
                className="shrink-0 basis-[calc((100%-4rem)/5)]"
              >
                {item.kind === "mcp" ? (
                  <McpCard item={item} />
                ) : (
                  <SkillCard
                    skill={item as unknown as TrendingSkill}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Previous ${title}`}
          className="absolute -left-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Next ${title}`}
          className="absolute -right-5 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="mt-4 hidden items-center justify-center gap-2 sm:flex">
        {Array.from({ length: pages }, (_, i) => {
          const isActive = i === activePage;
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
              aria-current={isActive}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isActive
                  ? "w-7 opacity-100"
                  : "w-1.5 opacity-50 hover:opacity-100"
              )}
              style={{
                backgroundColor:
                  SELECTED_SHADES[
                    Math.round(
                      (i * (SELECTED_SHADES.length - 1)) / (pages - 1)
                    )
                  ],
              }}
            />
          );
        })}
      </div>
    </section>
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

