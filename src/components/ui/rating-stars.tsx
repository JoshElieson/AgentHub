import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const SIZE = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" } as const;

export function RatingStars({
  rating,
  size = "md",
  showValue = false,
  count,
  className,
}: {
  rating: number;
  size?: keyof typeof SIZE;
  showValue?: boolean;
  count?: number;
  className?: string;
}) {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex items-center" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = i < full ? 1 : i === full ? frac : 0;
          return (
            <span key={i} className="relative">
              <Star className={cn(SIZE[size], "text-line-strong")} strokeWidth={1.5} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={cn(SIZE[size], "fill-warning text-warning")}
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
