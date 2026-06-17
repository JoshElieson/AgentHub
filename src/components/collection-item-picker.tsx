"use client";

import { useState, useEffect, useMemo } from "react";
import { useMarketplaceData, type SkillRow, type McpServerRow } from "@/lib/marketplace-data";
import { cn, formatCompact } from "@/lib/utils";
import { RatingStars } from "@/components/ui/rating-stars";
import { Search, Star, Download, Package, Plug, X, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Item picker — two tabs: Favorites + Browse
// ---------------------------------------------------------------------------

export type PickerItemKind = "skill" | "mcp";

export interface PickerItem {
  id: string;
  kind: PickerItemKind;
  name: string;
  description: string;
  tags: string[];
  star_count: number;
  export_count: number;
  avg_rating: number;
  rating_count: number;
}

interface CollectionItemPickerProps {
  /** "skills" shows only skills, "mcps" shows only MCP servers */
  filterKind: "skills" | "mcps";
  /** Currently selected item IDs */
  selected: Set<string>;
  /** Toggle an item in/out */
  onToggle: (item: PickerItem) => void;
}

export function CollectionItemPicker({
  filterKind,
  selected,
  onToggle,
}: CollectionItemPickerProps) {
  const [tab, setTab] = useState<"browse" | "favorites">("browse");
  const [query, setQuery] = useState("");
  const { skills, mcpServers, loading } = useMarketplaceData();

  // Favorites
  const [favSkills, setFavSkills] = useState<PickerItem[]>([]);
  const [favMcps, setFavMcps] = useState<PickerItem[]>([]);
  const [favLoading, setFavLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { getAnonId } = await import("@/lib/anon-id");
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/starred?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          setFavSkills(
            (data.skills ?? []).map((s: any) => ({
              id: s.id,
              kind: "skill" as const,
              name: s.name,
              description: s.description,
              tags: s.tags ?? [],
              star_count: s.star_count ?? 0,
              export_count: s.export_count ?? 0,
              avg_rating: s.avg_rating ?? 0,
              rating_count: s.rating_count ?? 0,
            }))
          );
          setFavMcps(
            (data.mcpServers ?? []).map((s: any) => ({
              id: s.id,
              kind: "mcp" as const,
              name: s.name,
              description: s.description,
              tags: s.tags ?? [],
              star_count: s.star_count ?? 0,
              export_count: s.export_count ?? 0,
              avg_rating: s.avg_rating ?? 0,
              rating_count: s.rating_count ?? 0,
            }))
          );
        }
      } catch {
        // Fail silently
      } finally {
        setFavLoading(false);
      }
    })();
  }, []);

  // Convert marketplace data to PickerItems
  const browseItems = useMemo<PickerItem[]>(() => {
    const items: PickerItem[] = [];
    if (filterKind === "skills") {
      for (const s of skills) {
        items.push({
          id: s.id,
          kind: "skill",
          name: s.name,
          description: s.description,
          tags: s.tags ?? [],
          star_count: s.star_count,
          export_count: s.export_count,
          avg_rating: s.avg_rating,
          rating_count: s.rating_count,
        });
      }
    } else {
      for (const m of mcpServers) {
        items.push({
          id: m.id,
          kind: "mcp",
          name: m.name,
          description: m.description,
          tags: m.tags ?? [],
          star_count: m.star_count,
          export_count: m.export_count,
          avg_rating: m.avg_rating,
          rating_count: m.rating_count,
        });
      }
    }
    return items;
  }, [skills, mcpServers, filterKind]);

  // Filter by search query
  const filteredBrowse = useMemo(() => {
    if (!query.trim()) return browseItems;
    const needle = query.toLowerCase().trim();
    return browseItems.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }, [browseItems, query]);

  const favoriteItems =
    filterKind === "skills" ? favSkills : favMcps;

  const displayItems = tab === "favorites" ? favoriteItems : filteredBrowse;
  const isLoading = tab === "favorites" ? favLoading : loading;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-line">
        <button
          onClick={() => setTab("browse")}
          className={cn(
            "relative px-3 py-2 text-sm font-medium transition-colors",
            tab === "browse"
              ? "text-content after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand"
              : "text-muted hover:text-content"
          )}
        >
          Browse
        </button>
        <button
          onClick={() => setTab("favorites")}
          className={cn(
            "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
            tab === "favorites"
              ? "text-content after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand"
              : "text-muted hover:text-content"
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Favorites
          {favoriteItems.length > 0 && (
            <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-subtle">
              {favoriteItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Search (browse tab only) */}
      {tab === "browse" && (
        <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 transition-colors focus-within:border-brand/60">
          <Search className="h-4 w-4 shrink-0 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              filterKind === "skills"
                ? "Search skills…"
                : "Search MCP servers…"
            }
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
      )}

      {/* Item list */}
      <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-line bg-surface"
            />
          ))
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface-2 text-muted">
              {filterKind === "skills" ? (
                <Package className="h-5 w-5" />
              ) : (
                <Plug className="h-5 w-5" />
              )}
            </div>
            <p className="mt-3 text-sm text-muted">
              {tab === "favorites"
                ? "No favorites yet — star items from the marketplace first."
                : "No results found."}
            </p>
          </div>
        ) : (
          displayItems.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                  isSelected
                    ? "border-brand/40 bg-brand-dim/30 shadow-sm"
                    : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                )}
              >
                {/* Checkbox indicator */}
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded border transition-all",
                    isSelected
                      ? "border-brand bg-brand"
                      : "border-line-strong bg-transparent"
                  )}
                >
                  {isSelected && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </span>

                {/* Item info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-content">
                      {item.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-sm px-1.5 py-0.5 text-2xs font-medium",
                        item.kind === "skill"
                          ? "border border-brand-line bg-brand-dim text-brand-muted"
                          : "border border-info/30 bg-info-dim text-info"
                      )}
                    >
                      {item.kind === "skill" ? "Skill" : "MCP"}
                    </span>
                  </div>
                  <span className="mt-0.5 block truncate text-xs text-subtle">
                    {item.description}
                  </span>
                </div>

                {/* Stats */}
                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {formatCompact(item.star_count)}
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Download className="h-3 w-3" />
                    {formatCompact(item.export_count)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected count */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-dim/30 px-3 py-2">
          <Check className="h-4 w-4 text-brand" />
          <span className="text-sm font-medium text-brand-muted">
            {selected.size} {selected.size === 1 ? "item" : "items"} selected
          </span>
        </div>
      )}
    </div>
  );
}
