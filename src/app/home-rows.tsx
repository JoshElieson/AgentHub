"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Horizontal placeholder rows — "Trending Now" and "Newly Uploaded". Each
// holds 15 blocks but reveals 5 at a time. The arrows page through them five
// at a time and wrap around infinitely, so the user can always go left or
// right. The illusion is built with one cloned page on each side of the real
// track: when a slide lands on a clone, we snap (without animation) back to
// the matching real page.
// ---------------------------------------------------------------------------

const PER_PAGE = 5;
const TOTAL = 15;
const PAGES = TOTAL / PER_PAGE; // 3 real pages

// Light-brown gradient for the dots: darkest on the left, the brand base in the
// middle, lightest on the right.
const SELECTED_SHADES = ["#9c7a4e", "#b48c5d", "#c49b6c", "#d3b287", "#e1c9a3"];

function ScrollRow({ title }: { title: string }) {
  const blocks = Array.from({ length: TOTAL }, (_, i) => i + 1);

  // The extended track has a clone of the last page prepended and a clone of
  // the first page appended, so real pages live at positions 1..PAGES.
  const extended = [
    ...blocks.slice((PAGES - 1) * PER_PAGE), // clone of last page
    ...blocks,
    ...blocks.slice(0, PER_PAGE), // clone of first page
  ];

  // `pos` is the visible page index within the extended track (starts on the
  // first real page). `animate` is toggled off only for the instant snap.
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);

  const step = useCallback((dir: number) => {
    setAnimate(true);
    setPos((p) => p + dir);
  }, []);

  const goTo = useCallback((page: number) => {
    setAnimate(true);
    setPos(page + 1); // real pages live at positions 1..PAGES
  }, []);

  // Current real page (0..PAGES-1), wrapping the clone positions to their twin.
  const activePage = (((pos - 1) % PAGES) + PAGES) % PAGES;

  const handleTransitionEnd = useCallback(() => {
    setPos((p) => {
      if (p === 0) {
        setAnimate(false);
        return PAGES; // snap from leading clone to last real page
      }
      if (p === PAGES + 1) {
        setAnimate(false);
        return 1; // snap from trailing clone to first real page
      }
      return p;
    });
  }, []);

  return (
    <section className="py-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-content sm:text-2xl">
          {title}
        </h2>
      </div>

      {/* Block strip flanked by prev/next arrows, mirroring the spotlight. */}
      <div className="relative">
        {/* Viewport reveals exactly PER_PAGE blocks; the track slides by pages. */}
        <div className="overflow-hidden">
          <div
            className={
              animate ? "flex gap-4 transition-transform duration-500 ease-out-expo" : "flex gap-4"
            }
            style={{
              transform: `translateX(calc(-${pos * 100}% - ${pos * 1}rem))`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extended.map((n, i) => (
              <div
                key={i}
                aria-hidden={i < PER_PAGE || i >= extended.length - PER_PAGE}
                className="grid aspect-[4/3] shrink-0 basis-[calc((100%-4rem)/5)] place-items-center rounded-card border border-line bg-surface text-2xl font-semibold text-muted shadow-card"
              >
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows — flanking the strip, like the spotlight. */}
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={`Previous ${title}`}
          className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label={`Next ${title}`}
          className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dot indicators — one per page, centered under the strip. They carry
          the same light-brown gradient: left darker, middle base, right lighter. */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: PAGES }, (_, i) => {
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
                isActive ? "w-7 opacity-100" : "w-1.5 opacity-50 hover:opacity-100"
              )}
              style={{
                // Spread the 5 shades across the 3 dots: darkest → base → lightest.
                backgroundColor:
                  SELECTED_SHADES[Math.round((i * (SELECTED_SHADES.length - 1)) / (PAGES - 1))],
              }}
            />
          );
        })}
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
