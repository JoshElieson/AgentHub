"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Typewriter hero — the headline types itself in from empty, with a caret that
// trails the text as it lands and settles into a steady blink once finished.
// ---------------------------------------------------------------------------

const LINES = ["The Home for AI Agent Tools", "AgentHub"] as const;
const FULL = LINES.join("\n");

// Per-character cadence. The newline gets a longer beat so the caret visibly
// drops to the second line before the brand name appears.
const CHAR_MS = 58;
const NEWLINE_MS = 460;
const START_DELAY_MS = 360;

export function TypewriterHero() {
  // Number of characters of FULL currently revealed (newline counts as one).
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Respect reduced-motion: skip the animation, show the headline at rest.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(FULL.length);
      setDone(true);
      return;
    }

    const tick = (next: number) => {
      if (next > FULL.length) {
        setDone(true);
        return;
      }
      setCount(next);
      if (next === FULL.length) {
        setDone(true);
        return;
      }
      const delay = FULL[next] === "\n" ? NEWLINE_MS : CHAR_MS;
      timer.current = window.setTimeout(() => tick(next + 1), delay);
    };

    timer.current = window.setTimeout(() => tick(1), START_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, []);

  const typed = FULL.slice(0, count);
  const typedLines = typed.split("\n");
  // The line the caret currently sits on (the last line with revealed text).
  const activeLine = typedLines.length - 1;

  return (
    <div className="relative mx-auto max-w-5xl text-center">
      {/* Semantic, screen-reader / SEO heading. Kept in flow at zero opacity so
          it reserves the final layout box and prevents any vertical jump as the
          visible text grows in. */}
      <h1 className={cn(HEADING_CLS, "opacity-0")}>
        {LINES.map((line, i) => (
          <span key={i} className={lineClass(i)}>
            {line}
          </span>
        ))}
      </h1>

      {/* Visible animated overlay — decorative; the heading above carries the
          accessible text. Shares HEADING_CLS / lineClass so its line boxes line
          up exactly with the ghost. */}
      <div aria-hidden className={cn(HEADING_CLS, "absolute inset-0")}>
        {LINES.map((line, i) => {
          const text = i < typedLines.length ? typedLines[i] : "";
          const isActive = i === activeLine;
          return (
            <span
              key={i}
              className={cn(lineClass(i), i === 0 ? "text-gradient" : "text-brand")}
            >
              {text}
              {/* Caret blinks from the start and trails the text as it types,
                  then disappears once the whole headline has landed. */}
              {isActive && !done && <Caret />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Shared headline typography. Generous leading + per-line descender padding so
// glyph tails (the "g" in "Agents") clear the line box — critical for line 0,
// whose `text-gradient` uses background-clip:text and would otherwise paint no
// gradient below the baseline, clipping the descender.
const HEADING_CLS =
  "text-balance text-5xl font-semibold leading-[1.15] tracking-tighter-lg sm:text-6xl lg:text-7xl";

const lineClass = (i: number) => cn("block pb-[0.2em]", i === 0 && "-mb-[0.12em]");

function Caret() {
  return (
    <span
      aria-hidden
      // A thin upright bar sitting just after the last glyph, blinking as it
      // trails the text. Removed from the tree entirely once typing finishes.
      className="ml-1.5 inline-block h-[0.82em] w-[3px] translate-y-[0.08em] animate-caret-blink rounded-[1px] bg-brand align-baseline sm:w-[4px]"
    />
  );
}
