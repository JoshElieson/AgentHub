"use client";

import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

export function FavoriteButton({
  count,
  initial = false,
  size = "md",
  showCount = true,
  className,
}: {
  count?: number;
  initial?: boolean;
  size?: "sm" | "md";
  showCount?: boolean;
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const display = count !== undefined ? count + (active && !initial ? 1 : 0) : undefined;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive((v) => !v);
      }}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors duration-150",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        active
          ? "border-warning/40 bg-warning/10 text-warning"
          : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-content",
        className
      )}
    >
      <Star className={cn("h-4 w-4", active && "fill-warning")} />
      {showCount && display !== undefined && (
        <span className="tabular-nums">{formatCompact(display)}</span>
      )}
    </button>
  );
}
