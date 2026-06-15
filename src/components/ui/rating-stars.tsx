"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

const SIZE = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" } as const;

/**
 * Read-only OR interactive star rating display.
 * Pass `onRate` to enable click-to-rate with hover preview.
 */
export function RatingStars({
  rating,
  size = "md",
  showValue = false,
  count,
  onRate,
  className,
}: {
  rating: number;
  size?: keyof typeof SIZE;
  showValue?: boolean;
  count?: number;
  onRate?: (value: number) => void;
  className?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const interactive = !!onRate;

  const displayRating = hoverIndex !== null ? hoverIndex + 1 : rating;
  const full = Math.floor(displayRating);
  const frac = displayRating - full;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("inline-flex items-center", interactive && "cursor-pointer")}
        onMouseLeave={() => interactive && setHoverIndex(null)}
        aria-hidden
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = i < full ? 1 : i === full ? frac : 0;
          const isHovered = hoverIndex !== null && i <= hoverIndex;
          return (
            <span
              key={i}
              className={cn("relative", interactive && "transition-transform duration-100 hover:scale-110")}
              onMouseEnter={() => interactive && setHoverIndex(i)}
              onClick={() => onRate?.(i + 1)}
            >
              <Star
                className={cn(SIZE[size], "text-line-strong")}
                strokeWidth={1.5}
              />
              {(fill > 0 || isHovered) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(isHovered ? 1 : fill) * 100}%` }}
                >
                  <Star
                    className={cn(
                      SIZE[size],
                      isHovered
                        ? "fill-brand text-brand"
                        : "fill-warning text-warning"
                    )}
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-medium tabular-nums text-content">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs tabular-nums text-subtle">({count})</span>
      )}
      <span className="sr-only">{rating.toFixed(1)} out of 5</span>
    </span>
  );
}
