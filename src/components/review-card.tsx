import type { Review } from "@/lib/types";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { RatingStars } from "./ui/rating-stars";
import { ThumbsUp, CheckCircle2 } from "lucide-react";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar name={review.authorName} color={review.avatarColor} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-content">{review.authorName}</span>
            {review.verifiedInstall && (
              <span className="inline-flex items-center gap-1 text-2xs text-success">
                <CheckCircle2 className="h-3 w-3" /> Verified install
              </span>
            )}
            <span className="text-2xs text-subtle">{timeAgo(review.createdAt)}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={review.rating} size="sm" />
            {review.version && (
              <Badge variant="outline">v{review.version}</Badge>
            )}
          </div>
          <h4 className="mt-2 text-sm font-semibold text-content">{review.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>
          <div className="mt-3">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 text-2xs font-medium text-subtle transition-colors hover:text-content">
              <ThumbsUp className="h-3 w-3" />
              Helpful ({review.helpful})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const DIST_SHAPE = (avg: number): number[] => {
  if (avg >= 4.7) return [0.8, 0.15, 0.03, 0.01, 0.01];
  if (avg >= 4.4) return [0.68, 0.22, 0.06, 0.02, 0.02];
  if (avg >= 4.0) return [0.55, 0.28, 0.1, 0.04, 0.03];
  return [0.45, 0.3, 0.13, 0.07, 0.05];
};

export function RatingBreakdown({
  ratingAvg,
  ratingCount,
}: {
  ratingAvg: number;
  ratingCount: number;
}) {
  const shape = DIST_SHAPE(ratingAvg);
  const counts = shape.map((p) => Math.round(p * ratingCount));
  // Fix rounding drift into the 5-star bucket.
  const drift = ratingCount - counts.reduce((s, c) => s + c, 0);
  counts[0] = Math.max(0, counts[0] + drift);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-5">
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-tight text-content tnum">
            {ratingAvg.toFixed(1)}
          </div>
          <RatingStars rating={ratingAvg} size="sm" className="mt-1" />
          <div className="mt-1 text-xs text-subtle">{formatNumber(ratingCount)} reviews</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, i) => {
            const pct = ratingCount ? (counts[i] / ratingCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-xs tabular-nums text-subtle">{star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-2xs tabular-nums text-subtle">
                  {formatNumber(counts[i])}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
