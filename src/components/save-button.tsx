"use client";

import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { getAnonId } from "@/lib/anon-id";

/**
 * Bookmark / save toggle button. Saving adds the item to the current user's
 * private "Saved" list (Dashboard → Saved tab). Unlike a like, a save has no
 * public count — it's a personal bookmark. Wired to `/api/skills/save` or
 * `/api/mcp/save` depending on which ID prop is provided. Pass `skillId` or
 * `mcpServerId` to enable API persistence; omit both for local-only mode.
 */
export function SaveButton({
  skillId,
  mcpServerId,
  initial = false,
  size = "md",
  showLabel = true,
  className,
  onToggle,
}: {
  skillId?: string;
  mcpServerId?: string;
  initial?: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
  onToggle?: (saved: boolean) => void;
}) {
  const [active, setActive] = useState(initial);
  const [loading, setLoading] = useState(false);
  const itemId = skillId ?? mcpServerId;
  const isMcp = !!mcpServerId;
  const [initialized, setInitialized] = useState(!itemId); // skip init for non-API mode

  // Check initial saved state from API
  useEffect(() => {
    if (!itemId || initialized) return;
    const anonId = getAnonId();
    const url = isMcp
      ? `/api/mcp/save?serverId=${itemId}&anonId=${anonId}`
      : `/api/skills/save?skillId=${itemId}&anonId=${anonId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setActive(!!data.saved);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, [itemId, isMcp, initialized]);

  const handleToggle = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const newActive = !active;
    setActive(newActive);

    if (itemId) {
      setLoading(true);
      try {
        const anonId = getAnonId();
        const endpoint = isMcp ? "/api/mcp/save" : "/api/skills/save";
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
  }, [active, loading, itemId, isMcp, onToggle]);

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
