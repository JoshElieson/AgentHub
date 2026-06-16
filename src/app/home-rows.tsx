"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Horizontal placeholder rows — "Trending Now" and "Newly Uploaded". Each
// holds 10 blocks but reveals 5 at a time; the arrows page through them five
// at a time, clamped at either end.
// ---------------------------------------------------------------------------

const PER_PAGE = 5;
const TOTAL = 10;

function ScrollRow({ title }: { title: string }) {
  // `page` is the index of the leftmost visible block (0 or 5).
  const [page, setPage] = useState(0);
  const maxPage = TOTAL - PER_PAGE;

  const step = useCallback(
    (dir: number) =>
      setPage((p) => Math.min(maxPage, Math.max(0, p + dir * PER_PAGE))),
    [maxPage]
  );

  const atStart = page === 0;
  const atEnd = page >= maxPage;

  const blocks = Array.from({ length: TOTAL }, (_, i) => i + 1);

  return (
    <section className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label={`Previous ${title}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label={`Next ${title}`}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Viewport reveals exactly PER_PAGE blocks; the track slides by pages. */}
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-out-expo"
          style={{
            transform: `translateX(calc(-${(page / PER_PAGE) * 100}% - ${
              (page / PER_PAGE) * 1
            }rem))`,
          }}
        >
          {blocks.map((n) => (
            <div
              key={n}
              className="grid aspect-[4/3] shrink-0 basis-[calc((100%-4rem)/5)] place-items-center rounded-card border border-line bg-surface text-2xl font-semibold text-muted shadow-card"
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendingNow() {
  return <ScrollRow title="Trending Now" />;
}

export function NewlyUploaded() {
  return <ScrollRow title="Newly Uploaded" />;
}
