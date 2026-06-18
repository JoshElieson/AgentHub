"use client";

import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { getAnonId } from "@/lib/anon-id";

/**
 * Bookmark / save toggle button. Saving adds the item to the current user's
 * private "Saved" list (Dashboard → Saved tab). Unlike a like, a save has no
 * public count — it's a personal bookmark. Wired to `/api/skills/save`,
 * `/api/mcp/save`, or `/api/collections/save` depending on which ID prop is
 * provided. Pass `skillId`, `mcpServerId`, or `collectionId` to enable API
 * persistence; omit all for local-only mode.
 */
export function SaveButton({
  skillId,
  mcpServerId,
  collectionId,
  initial = false,
  checkInitial = true,
  size = "md",
  showLabel = true,
  className,
  onToggle,
}: {
  skillId?: string;
  mcpServerId?: string;
  collectionId?: string;
  initial?: boolean;
  /**
   * Whether to fetch the current saved state on mount. Defaults to true (used
   * on detail pages where one button renders). Set false in dense lists (cards)
   * to avoid firing one request per card on every page load.
   */
  checkInitial?: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
  onToggle?: (saved: boolean) => void;
}) {
  const [active, setActive] = useState(initial);
  const [loading, setLoading] = useState(false);
  const itemId = skillId ?? mcpServerId ?? collectionId;
  const kind: "skill" | "mcp" | "collection" = mcpServerId
    ? "mcp"
    : collectionId
      ? "collection"
      : "skill";
  const [initialized, setInitialized] = useState(!itemId || !checkInitial);

  // Check initial saved state from API
  useEffect(() => {
    if (!itemId || initialized) return;
    const anonId = getAnonId();
    const url =
      kind === "mcp"
        ? `/api/mcp/save?serverId=${itemId}&anonId=${anonId}`
        : kind === "collection"
          ? `/api/collections/save?collectionId=${itemId}&anonId=${anonId}`
          : `/api/skills/save?skillId=${itemId}&anonId=${anonId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setActive(!!data.saved);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, [itemId, kind, initialized]);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const newActive = !active;
    setActive(newActive);

    if (itemId) {
      setLoading(true);
      try {
        const anonId = getAnonId();
        const endpoint =
          kind === "mcp"
            ? "/api/mcp/save"
            : kind === "collection"
              ? "/api/collections/save"
              : "/api/skills/save";
        const payload =
          kind === "mcp"
            ? { serverId: itemId, anonId }
            : kind === "collection"
              ? { collectionId: itemId, anonId }
              : { skillId: itemId, anonId };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setActive(!!data.saved);
          onToggle?.(!!data.saved);
        } else {
          setActive(!newActive); // revert
        }
      } catch {
        setActive(!newActive); // revert
      } finally {
        setLoading(false);
      }
    } else {
      onToggle?.(newActive);
    }
  }, [active, loading, itemId, kind, onToggle]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={loading}
      aria-pressed={active}
      title={active ? "Saved — click to remove" : "Save for later"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors duration-150",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        active
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-content",
        loading && "opacity-60 pointer-events-none",
        className
      )}
    >
      <Bookmark className={cn("h-4 w-4 transition-transform", active && "fill-current scale-110")} />
      {showLabel && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
