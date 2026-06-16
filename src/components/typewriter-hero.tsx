"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Typewriter hero — the headline types itself in from empty, with a caret that
// trails the text as it lands, then blinks three times and disappears once the
// whole headline has finished typing.
// ---------------------------------------------------------------------------

const LINES = ["The Home for AI Agent Tools", "AgentDock"] as const;
const FULL = LINES.join("\n");

// Per-character cadence. The newline gets a longer beat so the caret visibly
// drops to the second line before the brand name appears.
const CHAR_MS = 58;
const NEWLINE_MS = 460;
const START_DELAY_MS = 360;

export function TypewriterHero() {
  // Number of characters of FULL currently revealed (newline counts as one).
  const [count, setCount] = useState(0);
  // "typing" while characters appear → "settling" once the headline is complete
  // (the caret stays put and blinks three more times) → "done" (caret removed).
  const [phase, setPhase] = useState<"typing" | "settling" | "done">("typing");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Respect reduced-motion: skip the animation, show the headline at rest.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setCount(FULL.length);
      setPhase("done");
      return;
    }

    const tick = (next: number) => {
      if (next > FULL.length) {
        setPhase("settling");
        return;
      }
      setCount(next);
      if (next === FULL.length) {
        setPhase("settling");
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
              {/* Caret blinks from the start and trails the text as it types.
                  When typing completes it stays on the last line and blinks
                  three more times (a fresh `key` restarts the animation), then
                  removes itself when that bounded blink ends. */}
              {isActive && phase !== "done" && (
                <Caret
                  key={phase}
                  settling={phase === "settling"}
                  onSettled={() => setPhase("done")}
                />
              )}
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
// One row per headline line. Alumni Sans is narrow, so the 27-char slogan fits
// on a single line; the size scales with the viewport and caps at 8rem — a
// slight step down from 9rem so the slogan clears the max-w-5xl (1024px) box
// instead of wrapping.
const HEADING_CLS =
  "font-wordmark text-[clamp(1.75rem,10.5vw,8rem)] font-normal leading-[1.15] tracking-tighter-lg";

const lineClass = (i: number) =>
  cn("block whitespace-nowrap pb-[0.2em]", i === 0 && "-mb-[0.12em]");

function Caret({
  settling,
  onSettled,
}: {
  // While typing the caret blinks forever; once `settling` it runs the bounded
  // three-cycle blink and fires `onSettled` when that animation ends.
  settling: boolean;
  onSettled: () => void;
}) {
  return (
    <span
      aria-hidden
      onAnimationEnd={settling ? onSettled : undefined}
      // Settle = three more blinks at the SAME 1.05s cadence as the typing
      // caret (so the rhythm doesn't change), then `onAnimationEnd` removes it.
      // Declared inline (not a Tailwind `animate-*` utility) so it works without
      // a config rebuild — it reuses the `caret-blink` @keyframes that the
      // typing utility below already emits.
      style={settling ? { animation: "caret-blink 1.05s step-end 3" } : undefined}
      // A thin upright bar sitting just after the last glyph.
      className={cn(
        "ml-1.5 inline-block h-[0.82em] w-[3px] translate-y-[0.08em] rounded-[1px] bg-brand align-baseline sm:w-[4px]",
        !settling && "animate-caret-blink",
      )}
    />
  );
}
