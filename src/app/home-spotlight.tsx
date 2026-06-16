"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn, formatCompact } from "@/lib/utils";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  FlaskConical,
  FolderTree,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Accent palette — restrained per the design language: the canvas stays
// neutral, accents only tint the emblem, glow, eyebrow dot and progress.
// ---------------------------------------------------------------------------

type AccentKey = "brand" | "green" | "blue" | "amber" | "red";

const ACCENTS: Record<
  AccentKey,
  { text: string; dot: string; ring: string; chip: string; glow: string }
> = {
  brand: {
    text: "text-brand-muted",
    dot: "bg-brand",
    ring: "border-brand-line",
    chip: "border-brand-line text-brand-muted",
    glow: "rgba(196,155,108,0.18)",
  },
  green: {
    text: "text-success",
    dot: "bg-success",
    ring: "border-success/30",
    chip: "border-success/25 text-success",
    glow: "rgba(34,197,94,0.15)",
  },
  blue: {
    text: "text-info",
    dot: "bg-info",
    ring: "border-info/30",
    chip: "border-info/25 text-info",
    glow: "rgba(91,155,216,0.16)",
  },
  amber: {
    text: "text-warning",
    dot: "bg-warning",
    ring: "border-warning/30",
    chip: "border-warning/25 text-warning",
    glow: "rgba(224,168,46,0.15)",
  },
  red: {
    text: "text-danger",
    dot: "bg-danger",
    ring: "border-danger/30",
    chip: "border-danger/25 text-danger",
    glow: "rgba(239,68,68,0.14)",
  },
};

// ---------------------------------------------------------------------------
// Curated spotlight catalogue — the five highlighted packages.
// ---------------------------------------------------------------------------

interface Spotlight {
  name: string;
  type: string;
  category: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: AccentKey;
  chips: string[];
  preview: string[];
  rating: number;
  ratingCount: number;
  stars: number;
  exports: number;
  href: string;
}

const SPOTLIGHTS: Spotlight[] = [
  {
    name: "Impeccable UI",
    type: "Skill",
    category: "Design",
    tagline: "Pixel-perfect components, on demand.",
    description:
      "Generates production-grade, accessible interface components with deliberate typography, spacing, and motion — never templated defaults.",
    icon: Sparkles,
    accent: "brand",
    chips: ["design UI", "components", "accessibility", "motion"],
    preview: [
      "→ derive type scale + spacing rhythm",
      "→ compose accessible primitives",
      "→ wire hover / focus micro-states",
    ],
    rating: 4.9,
    ratingCount: 212,
    stars: 1800,
    exports: 6400,
    href: "/explore?q=Impeccable+UI",
  },
  {
    name: "Placeholder 1",
    type: "Placeholder",
    category: "Placeholder",
    tagline: "Placeholder",
    description: "Placeholder",
    icon: FlaskConical,
    accent: "green",
    chips: ["Placeholder"],
    preview: ["Placeholder"],
    rating: 0,
    ratingCount: 0,
    stars: 0,
    exports: 0,
    href: "/explore",
  },
  {
    name: "Placeholder 2",
    type: "Placeholder",
    category: "Placeholder",
    tagline: "Placeholder",
    description: "Placeholder",
    icon: Code2,
    accent: "blue",
    chips: ["Placeholder"],
    preview: ["Placeholder"],
    rating: 0,
    ratingCount: 0,
    stars: 0,
    exports: 0,
    href: "/explore",
  },
  {
    name: "Placeholder 3",
    type: "Placeholder",
    category: "Placeholder",
    tagline: "Placeholder",
    description: "Placeholder",
    icon: FolderTree,
    accent: "amber",
    chips: ["Placeholder"],
    preview: ["Placeholder"],
    rating: 0,
    ratingCount: 0,
    stars: 0,
    exports: 0,
    href: "/explore",
  },
  {
    name: "Placeholder 4",
    type: "Placeholder",
    category: "Placeholder",
    tagline: "Placeholder",
    description: "Placeholder",
    icon: ShieldCheck,
    accent: "red",
    chips: ["Placeholder"],
    preview: ["Placeholder"],
    rating: 0,
    ratingCount: 0,
    stars: 0,
    exports: 0,
    href: "/explore",
  },
];

// Typography for the Impeccable UI spotlight — a lighter, tighter display face.
const IMPECCABLE_FONT: CSSProperties = {
  fontFamily:
    '"Avenir Next", "SF Pro Display", var(--font-display), sans-serif',
  fontWeight: 200,
  letterSpacing: "-0.03em",
};

const AUTOPLAY_MS = 6500;

// Physical track layout. The real slides are framed by a clone of the last
// slide at the start and a clone of the first at the end, so wrapping in either
// direction is just one more step the same way — then we snap (without
// animation) onto the matching real slide once the slide settles.
const REAL_COUNT = SPOTLIGHTS.length;
const FIRST = 1; // physical position of the first real slide
const LAST = REAL_COUNT; // physical position of the last real slide
const CLONE_LAST = 0; // clone of the last slide, sits before FIRST
const CLONE_FIRST = REAL_COUNT + 1; // clone of the first slide, sits after LAST

const TRACK: { item: Spotlight; realIdx: number; key: string }[] = [
  { item: SPOTLIGHTS[REAL_COUNT - 1], realIdx: REAL_COUNT - 1, key: "clone-last" },
  ...SPOTLIGHTS.map((item, i) => ({ item, realIdx: i, key: `real-${i}` })),
  { item: SPOTLIGHTS[0], realIdx: 0, key: "clone-first" },
];

// ---------------------------------------------------------------------------
// Spotlight carousel — one highlighted package at a time, auto-advancing with
// a sliding track and manual prev/next + dot controls. Wraps seamlessly in
// both directions via cloned end slides.
// ---------------------------------------------------------------------------

export function HomeSpotlight() {
  // `pos` is the physical track position (0..CLONE_FIRST). `animate` is toggled
  // off only for the instantaneous clone→real snap so that jump never slides.
  const [pos, setPos] = useState(FIRST);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  const realIndex = (((pos - 1) % REAL_COUNT) + REAL_COUNT) % REAL_COUNT;

  const step = useCallback((dir: number) => {
    setAnimate(true);
    setPos((p) => Math.min(CLONE_FIRST, Math.max(CLONE_LAST, p + dir)));
  }, []);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);
  const goTo = useCallback((real: number) => {
    setAnimate(true);
    setPos(real + 1);
  }, []);

  // When we land on a clone, jump to its real twin with animation disabled so
  // the next move continues seamlessly in the same direction.
  const normalize = useCallback(() => {
    if (pos === CLONE_FIRST) {
      setAnimate(false);
      setPos(FIRST);
    } else if (pos === CLONE_LAST) {
      setAnimate(false);
      setPos(LAST);
    }
  }, [pos]);

  // Detect reduced-motion once.
  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // Reduced motion has no transition to listen for — normalize synchronously.
  useLayoutEffect(() => {
    if (reducedMotion.current) normalize();
  }, [normalize]);

  // Re-enable animation on the frame after a no-animation snap, so the snap
  // itself never animates but the following move does.
  useEffect(() => {
    if (animate) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimate(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [animate]);

  // Autoplay — advance forward; reset on each move so manual nav gets a full dwell.
  useEffect(() => {
    if (paused || reducedMotion.current) return;
    const id = window.setTimeout(() => step(1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [pos, paused, step]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured packages"
      className="relative isolate overflow-hidden rounded-card border border-line bg-surface shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Structural grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-hero-grid" aria-hidden />

      {/* Sliding track */}
      <div
        className={cn(
          "flex",
          animate &&
            !reducedMotion.current &&
            "transition-transform duration-700 ease-out-expo"
        )}
        style={{ transform: `translateX(-${pos * 100}%)` }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "transform") {
            normalize();
          }
        }}
      >
        {TRACK.map((slot, i) => (
          <SpotlightPanel
            key={slot.key}
            item={slot.item}
            position={slot.realIdx + 1}
            total={REAL_COUNT}
            active={i === pos}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous package"
        className="group absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content sm:left-4"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next package"
        className="group absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-canvas/70 text-muted backdrop-blur transition-colors hover:border-line-strong hover:bg-surface-2 hover:text-content sm:right-4"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dot indicators */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
        {SPOTLIGHTS.map((item, i) => {
          const isActive = i === realIndex;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${item.name}`}
              aria-current={isActive}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                isActive
                  ? cn("w-7", ACCENTS[item.accent].dot)
                  : "w-1.5 bg-line-strong hover:bg-subtle"
              )}
            />
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A single highlighted-package panel.
// ---------------------------------------------------------------------------

function SpotlightPanel({
  item,
  position,
  total,
  active,
}: {
  item: Spotlight;
  position: number;
  total: number;
  active: boolean;
}) {
  const accent = ACCENTS[item.accent];
  const isImpeccable = item.name === "Impeccable UI";

  // Placeholder slides show only their name — no badge, copy, stats, buttons,
  // or video placeholder.
  if (!isImpeccable) {
    return (
      <div
        className="grid min-h-[34rem] w-full shrink-0 place-items-center px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem]"
        aria-hidden={!active}
        aria-roledescription="slide"
        aria-label={`${position} of ${total}`}
      >
        <h2 className="font-semibold tracking-tighter-lg text-4xl text-content sm:text-5xl">
          {item.name}
        </h2>
      </div>
    );
  }

  return (
    <div
      className="grid min-h-[34rem] w-full shrink-0 grid-cols-1 gap-8 px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14"
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Content */}
      <div className="min-w-0">
        {!isImpeccable && (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 label-caps",
                accent.ring,
                accent.text
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
              {item.type}
            </span>
            <span className="text-2xs font-medium uppercase tracking-wider text-subtle">
              {item.category}
            </span>
          </div>
        )}

        <h2
          className={cn(
            "font-semibold tracking-tighter-lg",
            isImpeccable
              ? "bg-gradient-to-r from-brand-muted via-brand to-brand-hover bg-clip-text text-transparent text-5xl sm:text-6xl lg:text-7xl"
              : "mt-4 text-4xl text-content sm:text-5xl"
          )}
          style={isImpeccable ? IMPECCABLE_FONT : undefined}
        >
          {item.name}
        </h2>

        {isImpeccable && (
          <>
            <p
              className="mt-4 text-4xl leading-[1.05] text-content/85 sm:text-5xl lg:text-6xl"
              style={IMPECCABLE_FONT}
            >
              The missing design vocabulary for agents.
            </p>
            <p
              className="mt-5 max-w-prose text-base leading-relaxed text-muted sm:text-lg"
              style={IMPECCABLE_FONT}
            >
              It&apos;s why AI frontends all share one look: no words for
              hierarchy, contrast, or restraint. Impeccable gives your agent the
              designer&apos;s vocabulary, and gives you the same commands, so you
              both stop guessing and start directing, live, in your production
              codebase.
            </p>
          </>
        )}

        {!isImpeccable && (
          <>
            <p className="mt-3 text-lg text-muted sm:text-xl">{item.tagline}</p>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted sm:text-base">
              {item.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {item.chips.map((chip) => (
                <span
                  key={chip}
                  className={cn(
                    "rounded-md border bg-surface-2/60 px-2 py-0.5 text-2xs font-medium",
                    accent.chip
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <RatingStars
            rating={item.rating}
            size="sm"
            showValue
            count={item.ratingCount}
          />
          <span className="h-3 w-px bg-line" />
          <span className="flex items-center gap-1 text-xs text-subtle">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="font-medium tabular-nums">
              {formatCompact(item.stars)}
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs text-subtle">
            <Download className="h-3.5 w-3.5" />
            <span className="font-medium tabular-nums">
              {formatCompact(item.exports)}
            </span>
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <ButtonLink
            href={item.href}
            variant="primary"
            size="lg"
            tabIndex={active ? 0 : -1}
            className="group/get gap-2"
          >
            Get
            <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
          </ButtonLink>
          <ButtonLink
            href="/explore"
            variant="outline"
            size="lg"
            tabIndex={active ? 0 : -1}
          >
            Browse all
          </ButtonLink>
        </div>
      </div>

      {/* Video placeholder */}
      <div className="relative">
        {/* Accent glow */}
        <div
          className="pointer-events-none absolute -inset-6 -z-10"
          style={{
            background: `radial-gradient(ellipse 60% 60% at 50% 45%, ${accent.glow}, transparent 70%)`,
          }}
          aria-hidden
        />
        <div
          className={cn(
            "group relative w-full overflow-hidden rounded-card",
            isImpeccable
              ? "mx-auto max-w-[64rem]"
              : "border border-line bg-canvas shadow-elevated h-[18rem] sm:h-[26rem] lg:h-[44rem]"
          )}
        >
          {isImpeccable ? (
            <video
              className="block h-auto w-full object-contain"
              src="/impeccable-ui-demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label={`${item.name} demo`}
            />
          ) : (
            <>
              {/* Structural grid + accent glow */}
              <div className="pointer-events-none absolute inset-0 bg-hero-grid" aria-hidden />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse 55% 55% at 50% 45%, ${accent.glow}, transparent 70%)`,
                }}
                aria-hidden
              />

              {/* Faux player chrome */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
                <span className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  Demo
                </span>
                <span className="font-mono text-2xs tabular-nums text-faint">02:14</span>
              </div>

              {/* Play button */}
              <div className="absolute inset-0 grid place-items-center">
                <span className="relative grid place-items-center">
                  <span
                    className={cn(
                      "absolute h-20 w-20 rounded-full opacity-25 blur-xl",
                      accent.dot
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "relative grid h-16 w-16 place-items-center rounded-full border bg-surface/80 backdrop-blur transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20",
                      accent.ring,
                      accent.text
                    )}
                  >
                    <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-8 sm:w-8" />
                  </span>
                </span>
              </div>

              {/* Caption */}
              <div className="absolute inset-x-0 bottom-0 px-5 py-4 sm:px-6 sm:py-5">
                <p className="text-sm font-medium text-content sm:text-base">
                  Watch the {item.name} demo
                </p>
                <p className="mt-0.5 text-2xs text-subtle sm:text-xs">
                  Video placeholder — coming soon
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
