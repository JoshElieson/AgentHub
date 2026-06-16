"use client";

import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { getAnonId } from "@/lib/anon-id";

/**
 * Star / favorite toggle button wired to the `/api/skills/star` or
 * `/api/mcp/star` endpoint depending on which ID prop is provided.
 * Pass `skillId` or `mcpServerId` to enable API persistence; omit both for local-only mode.
 */
export function FavoriteButton({
  skillId,
  mcpServerId,
  count: initialCount,
  initial = false,
  size = "md",
  showCount = true,
  className,
  onToggle,
}: {
  skillId?: string;
  mcpServerId?: string;
  count?: number;
  initial?: boolean;
  size?: "sm" | "md";
  showCount?: boolean;
  className?: string;
  onToggle?: (starred: boolean, newCount: number) => void;
}) {
  const [active, setActive] = useState(initial);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  const itemId = skillId ?? mcpServerId;
  const isMcp = !!mcpServerId;
  const [initialized, setInitialized] = useState(!itemId); // skip init for non-API mode

  // Check initial starred state from API
  useEffect(() => {
    if (!itemId || initialized) return;
    const anonId = getAnonId();
    const url = isMcp
      ? `/api/mcp/star?serverId=${itemId}&anonId=${anonId}`
      : `/api/skills/star?skillId=${itemId}&anonId=${anonId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setActive(data.starred);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, [itemId, isMcp, initialized]);

  // Sync external count changes
  useEffect(() => {
    if (initialCount !== undefined) setCount(initialCount);
  }, [initialCount]);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const newActive = !active;
    const newCount = newActive ? count + 1 : Math.max(0, count - 1);
    setActive(newActive);
    setCount(newCount);

    if (itemId) {
      setLoading(true);
      try {
        const anonId = getAnonId();
        const endpoint = isMcp ? "/api/mcp/star" : "/api/skills/star";
        const payload = isMcp
          ? { serverId: itemId, anonId }
          : { skillId: itemId, anonId };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          setActive(data.starred);
          setCount(data.star_count);
          onToggle?.(data.starred, data.star_count);
        } else {
          // Revert on error
          setActive(!newActive);
          setCount(newActive ? count : count + 1);
        }
      } catch {
        // Revert on error
        setActive(!newActive);
        setCount(newActive ? count : count + 1);
      } finally {
        setLoading(false);
      }
    } else {
      onToggle?.(newActive, newCount);
    }
  }, [active, count, loading, itemId, isMcp, onToggle]);

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
      <Star className={cn("h-4 w-4 transition-transform", active && "fill-warning scale-110")} />
      {showCount && (
        <span className="tabular-nums">{formatCompact(count)}</span>
      )}
    </button>
  );
}
