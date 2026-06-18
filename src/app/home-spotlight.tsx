"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn, formatCompact } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Code2,
  Download,
  FlaskConical,
  FolderTree,
  GitBranch,
  Play,
  ShieldCheck,
  Palette,
  Star,
  ThumbsUp,
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
    icon: Palette,
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
    name: "Ponytail",
    type: "Skill",
    category: "Minimalism",
    tagline: "He writes one line. It works.",
    description:
      "The agent that says nothing and changes everything it needs to — and nothing it doesn't. No essays, no scaffolding, no apology. The smallest correct diff, every time.",
    icon: FlaskConical,
    accent: "green",
    chips: ["minimal diffs", "terse", "no over-engineering"],
    preview: ["// ponytail: this exists"],
    rating: 4.9,
    ratingCount: 146,
    stars: 3200,
    exports: 11000,
    href: "/explore?q=Ponytail",
  },
  {
    name: "skill-creator",
    type: "Skill",
    category: "Authoring",
    tagline: "The skill that makes skills.",
    description:
      "Draft a skill, run it against real prompts, and benchmark it with hard pass rates — then iterate until the numbers move. Don't guess whether your skill works. Measure it.",
    icon: Code2,
    accent: "blue",
    chips: ["draft → eval → improve", "benchmarks", "pass rates", "iteration"],
    preview: [
      "→ draft SKILL.md",
      "→ eval vs. baseline",
      "→ benchmark + iterate",
    ],
    rating: 4.9,
    ratingCount: 173,
    stars: 2400,
    exports: 8700,
    href: "/explore?q=skill-creator",
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

// Ponytail spotlight — the deliberate opposite of Impeccable. Palette is sampled
// straight from the portrait so the cropped face bleeds into the canvas with no
// visible seam: near-black GitHub canvas, bone-white ink, one terminal green.
const PONYTAIL_CANVAS = "#0d1116";
const PONYTAIL_INK = "#f3f5fb";
const PONYTAIL_MUTE = "#9ca0a6";
const PONYTAIL_GREEN = "#7ee787";

// Heavy grotesque for the wordmark — the counterweight to Impeccable's hairline
// Raleway. Inter is already loaded with its full variable weight axis.
const PONYTAIL_TITLE: CSSProperties = {
  fontFamily: 'var(--font-sans), "Inter", system-ui, sans-serif',
  fontWeight: 800,
  letterSpacing: "-0.035em",
};
const PONYTAIL_TAGLINE: CSSProperties = {
  fontFamily: 'var(--font-sans), system-ui, sans-serif',
  fontStyle: "italic",
  fontWeight: 400,
};

const AUTOPLAY_MS = 6500;

// Light-brown gradient for the dot indicators: darkest on the left, the brand
// base in the middle, lightest on the right.
const DOT_SHADES = ["#9c7a4e", "#b48c5d", "#c49b6c", "#d3b287", "#e1c9a3"];

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

  // Click-to-scroll: a click on the left half of the panel goes back, the right
  // half advances. Clicks that land on an interactive element (the CTAs or the
  // dot indicators) are left alone so those keep working independently.
  const handlePanelClick = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest("a,button")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientX - rect.left < rect.width / 2) prev();
      else next();
    },
    [prev, next]
  );

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
      className="relative isolate cursor-pointer overflow-hidden rounded-card border border-line bg-surface shadow-card"
      onClick={handlePanelClick}
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
                isActive ? "w-7 opacity-100" : "w-1.5 opacity-50 hover:opacity-100"
              )}
              style={{
                // Spread the shades across the dots: darkest → base → lightest.
                backgroundColor:
                  DOT_SHADES[
                    SPOTLIGHTS.length === 1
                      ? 0
                      : Math.round((i * (DOT_SHADES.length - 1)) / (SPOTLIGHTS.length - 1))
                  ],
              }}
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

  // Ponytail gets its own bespoke, monochrome terminal treatment.
  if (item.name === "Ponytail") {
    return (
      <PonytailPanel
        item={item}
        position={position}
        total={total}
        active={active}
      />
    );
  }

  // skill-creator gets its own bespoke cyanotype-blueprint treatment.
  if (item.name === "skill-creator") {
    return (
      <SkillCreatorPanel
        item={item}
        position={position}
        total={total}
        active={active}
      />
    );
  }

  // Placeholder slides show only their name — no badge, copy, stats, buttons,
  // or video placeholder.
  if (!isImpeccable) {
    return (
      <div
        className="relative grid min-h-[34rem] w-full shrink-0 place-items-center px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem]"
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
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 gap-8 px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-14"
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
            <ThumbsUp className="h-3.5 w-3.5 text-brand-muted" />
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

        <div className="relative z-20 mt-7 flex flex-wrap items-center gap-3">
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

// ---------------------------------------------------------------------------
// Ponytail — a bespoke spotlight themed as a code editor, because the skill it
// sells writes code. A window title bar tops it and an editor status bar floors
// it (both full-bleed, so there is no idle vertical space). The custom canvas is
// a *ghost file*: the sprawling, over-engineered function — line-numbered and
// greyed almost to nothing on the left — that Ponytail collapses into the single
// green line shown in the diff. A low green pool and a depth vignette give the
// near-black its dimension. The hand-drawn portrait is the author, bled in from
// the right and dissolved into the canvas via an edge mask. Everything is
// monochrome but one terminal green — restraint, like the skill itself.
// ---------------------------------------------------------------------------

const PONYTAIL_CHROME = "#12161c"; // title / status bar fill
const PONYTAIL_BORDER = "#1c2128"; // hairline rules
const PONYTAIL_DIM = "#6b7280"; // de-emphasised code
const PONYTAIL_RED = "#f08a8a"; // removed-line marker
const PONYTAIL_GHOST = "#283341"; // faint background "ghost file" code
const PONYTAIL_GUTTER = "#1b222c"; // line-number gutter ink
const PONYTAIL_VOID = "#07090d"; // vignette floor, a hair below the canvas

// The wall of abstraction the diff collapses to one line. Kept syntactically
// plausible so it reads as a real file at a glance, then dissolves.
const PONYTAIL_GHOST_LINES = [
  "export function resolveCurrentUser(ctx: Context): User {",
  "  const session = ctx.session ?? loadSession(ctx.request)",
  "  if (!session) return buildGuest(ctx.locale, ctx.flags)",
  "  const cached = userCache.get(session.id)",
  "  if (cached && !cached.isStale(ctx.now)) return cached.value",
  "  const record = reconcile(",
  "    pipeline(session, ctx.options),",
  "    fetchProfile(session.id),",
  "    ctx.overrides,",
  "  )",
  "  if (record.kind === 'partial') {",
  "    return hydrate(record, defaults(ctx)) ?? buildGuest(ctx)",
  "  }",
  "  userCache.set(session.id, new Entry(record, ctx.now))",
  "  return normalize(record, ctx.policy)",
  "}",
];

// The ghost file fades out to the right (before the portrait) and softly at top
// and bottom, so it never competes with the face or the chrome bars.
const PONYTAIL_FILE_MASK =
  "linear-gradient(to right, #000 0%, #000 42%, transparent 60%), linear-gradient(to bottom, transparent 0%, #000 12%, #000 82%, transparent 100%)";

function PonytailPanel({
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
  return (
    <div
      className="relative flex min-h-[34rem] w-full shrink-0 flex-col overflow-hidden sm:min-h-[40rem] lg:min-h-[52rem]"
      style={{ backgroundColor: PONYTAIL_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Window title bar — a single open file, no chrome buttons */}
      <div
        className="relative z-20 flex items-center justify-between gap-3 border-b px-5 py-3 sm:px-6"
        style={{ borderColor: PONYTAIL_BORDER, backgroundColor: PONYTAIL_CHROME }}
      >
        <div
          className="flex items-center gap-2 font-mono text-xs"
          style={{ color: PONYTAIL_MUTE }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: PONYTAIL_GREEN }}
            title="unsaved"
          />
          <span style={{ color: PONYTAIL_INK }}>ponytail</span>
          <span className="opacity-50">.skill</span>
        </div>
        <span
          className="font-mono text-2xs uppercase tracking-[0.2em]"
          style={{ color: PONYTAIL_MUTE }}
        >
          minimalism
        </span>
      </div>

      {/* Editor body */}
      <div className="relative flex flex-1 items-center">
        {/* Ghost file — the wall of abstraction, line-numbered and greyed almost
            to nothing, that the diff collapses to a single line. Masked to the
            left so it never reaches the portrait. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono text-xs leading-[1.7] sm:text-[0.8rem]"
          style={{
            WebkitMaskImage: PONYTAIL_FILE_MASK,
            WebkitMaskComposite: "source-in",
            maskImage: PONYTAIL_FILE_MASK,
            maskComposite: "intersect",
          }}
        >
          <div className="py-9 sm:py-12 lg:py-14">
            {PONYTAIL_GHOST_LINES.map((code, i) => (
              <div key={i} className="flex whitespace-pre">
                <span
                  className="w-14 shrink-0 pr-3 text-right tabular-nums"
                  style={{
                    color: PONYTAIL_GUTTER,
                    borderRight: `1px solid ${PONYTAIL_BORDER}`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="pl-4" style={{ color: PONYTAIL_GHOST }}>
                  {code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Green ambient pool — light gathers low-left, where the diff and the
            one green action live. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 50% at 20% 86%, rgba(126,231,135,0.10), transparent 70%)",
          }}
          aria-hidden
        />

        {/* Depth vignette — keeps the flat near-black from reading as empty. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(125% 100% at 50% 28%, transparent 46%, ${PONYTAIL_VOID} 100%)`,
          }}
          aria-hidden
        />

        {/* Portrait — the author, bled in from the right, edges dissolved. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ponytail-face.webp"
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute right-0 top-1/2 h-[78%] max-w-none -translate-y-1/2 select-none opacity-80 sm:h-[88%] sm:opacity-90 lg:right-[-1%] lg:h-[100%] lg:opacity-100"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 42%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 42%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            maskComposite: "intersect",
          }}
        />

        {/* Centre scrim — the far left stays clear so the ghost file reads; a
            band of canvas protects the type where it meets the portrait, then
            clears again so the face shows. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(13,17,22,0) 0%, rgba(13,17,22,0) 34%, rgba(13,17,22,0.92) 56%, rgba(13,17,22,0.5) 72%, rgba(13,17,22,0) 88%)",
          }}
          aria-hidden
        />

        {/* Content */}
        <div className="relative z-10 w-full px-6 py-10 sm:px-12 sm:py-12 lg:px-16">
          <div className="max-w-[38rem]">
            {/* Wordmark — heavy, tight, bone-white */}
            <h2
              className="text-6xl leading-[0.9] sm:text-7xl lg:text-8xl"
              style={{ ...PONYTAIL_TITLE, color: PONYTAIL_INK }}
            >
              Ponytail
            </h2>

            {/* Docstring — the product in its own terse voice */}
            <p
              className="mt-5 text-2xl leading-snug sm:text-[1.7rem]"
              style={{ ...PONYTAIL_TAGLINE, color: PONYTAIL_MUTE }}
            >
              He says nothing.
              <br />
              He writes one line. It works.
            </p>

            {/* Signature — the one-line diff. The deadpan green comment lifted
                from the art is the file header; the body shows a wall of effort
                collapsing to a single line that ships. */}
            <div
              className="mt-7 max-w-[27rem] overflow-hidden rounded-lg border shadow-elevated"
              style={{
                borderColor: PONYTAIL_BORDER,
                backgroundColor: "#11161d",
              }}
            >
              <div
                className="flex items-center justify-between gap-3 border-b px-3 py-1.5 font-mono text-2xs"
                style={{ borderColor: PONYTAIL_BORDER }}
              >
                <span className="truncate">
                  <span style={{ color: PONYTAIL_GREEN, opacity: 0.5 }}>
                    {"// "}
                  </span>
                  <span style={{ color: PONYTAIL_GREEN }}>
                    ponytail: this exists
                  </span>
                </span>
                <span
                  className="flex shrink-0 items-center gap-1"
                  style={{ color: PONYTAIL_GREEN }}
                >
                  <Check className="h-3 w-3" />
                  it works
                </span>
              </div>
              <div className="overflow-hidden whitespace-nowrap px-3 py-2 font-mono text-2xs leading-relaxed sm:text-xs">
                <div
                  className="-mx-3 px-3"
                  style={{ backgroundColor: "rgba(240,138,138,0.08)" }}
                >
                  <span style={{ color: PONYTAIL_RED, opacity: 0.7 }}>{"- "}</span>
                  <span style={{ color: PONYTAIL_MUTE }}>
                    return reconcile(pipeline(opts), base)
                  </span>
                </div>
                <div
                  className="-mx-3 px-3"
                  style={{ backgroundColor: "rgba(240,138,138,0.08)" }}
                >
                  <span style={{ color: PONYTAIL_RED, opacity: 0.7 }}>{"- "}</span>
                  <span style={{ color: PONYTAIL_DIM }}>
                    {"/* …and the 38 lines you didn’t need */"}
                  </span>
                </div>
                <div
                  className="-mx-3 px-3"
                  style={{ backgroundColor: "rgba(126,231,135,0.10)" }}
                >
                  <span style={{ color: PONYTAIL_GREEN }}>{"+ "}</span>
                  <span style={{ color: PONYTAIL_INK }}>return user ?? guest</span>
                </div>
              </div>
            </div>

            {/* Stats — terminal output */}
            <div
              className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs"
              style={{ color: PONYTAIL_MUTE }}
            >
              <span
                className="flex items-center gap-1.5"
                style={{ color: PONYTAIL_INK }}
              >
                <Star
                  className="h-3.5 w-3.5"
                  style={{ fill: PONYTAIL_GREEN, color: PONYTAIL_GREEN }}
                />
                {item.rating.toFixed(1)}
              </span>
              <span className="opacity-30">·</span>
              <span>{formatCompact(item.stars)} likes</span>
              <span className="opacity-30">·</span>
              <span>{formatCompact(item.exports)} installs</span>
            </div>

            {/* One bold action; everything else stays quiet */}
            <div className="relative z-20 mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={item.href}
                tabIndex={active ? 0 : -1}
                className="group/get inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-mono text-sm font-semibold transition-transform duration-200 hover:-translate-y-px"
                style={{ backgroundColor: PONYTAIL_GREEN, color: PONYTAIL_CANVAS }}
              >
                Get
                <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
              </Link>
              <Link
                href="/explore"
                tabIndex={active ? 0 : -1}
                className="inline-flex items-center rounded-md border border-white/15 px-5 py-2.5 font-mono text-sm text-[#9ca0a6] transition-colors hover:border-white/30 hover:text-white"
              >
                Browse all
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Editor status bar */}
      <div
        className="relative z-20 flex items-center gap-4 border-t px-5 py-2 font-mono text-2xs sm:px-6"
        style={{
          borderColor: PONYTAIL_BORDER,
          backgroundColor: PONYTAIL_CHROME,
          color: PONYTAIL_MUTE,
        }}
      >
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3" />
          main
        </span>
        <span
          className="flex items-center gap-1.5"
          style={{ color: PONYTAIL_GREEN }}
        >
          <Check className="h-3 w-3" />0 problems
        </span>
        <span className="ml-auto hidden sm:inline">markdown</span>
        <span className="hidden opacity-60 sm:inline">UTF-8</span>
        <span>Ln 1, Col 1</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// skill-creator — a bespoke "cyanotype blueprint" spotlight. The skill that
// makes skills earns a draughtsman's treatment: a deep blueprint-blue field, a
// fine graph-paper grid, and a hand-built technical drawing of its own value
// proposition — the draft → eval → review → improve loop, plus a pass-rate
// readout that climbs across iterations (the thing that actually sets this
// skill apart: it measures, it doesn't guess). Mint is the single accent, used
// only where something is "measured" or "improved".
// ---------------------------------------------------------------------------

const BP_CANVAS = "#0e3a61"; // blueprint-blue field
const BP_DEEP = "#0a2c49"; // vignette + node fill
const BP_INK = "#eef4fb"; // near-white ink
const BP_LINE = "#84b4da"; // pale-cyan linework / muted strokes
const BP_MUTE = "#a6c5e0"; // muted text
const BP_PASS = "#8be3b4"; // mint — the measured-improvement accent
const BP_GRID = "rgba(238,244,251,0.06)";

function SkillCreatorPanel({
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
  const Icon = item.icon;
  const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace';

  return (
    <div
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 items-center gap-10 overflow-hidden px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[1fr_1fr] lg:gap-14"
      style={{ backgroundColor: BP_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Fine graph-paper grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${BP_GRID} 1px, transparent 1px), linear-gradient(90deg, ${BP_GRID} 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
        }}
        aria-hidden
      />
      {/* Coarser major grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(238,244,251,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(238,244,251,0.05) 1px, transparent 1px)",
          backgroundSize: "150px 150px",
        }}
        aria-hidden
      />
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(130% 100% at 50% 28%, transparent 42%, ${BP_DEEP} 100%)`,
        }}
        aria-hidden
      />
      {/* Cyan glow behind the drawing */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 translate-x-1/4 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(132,180,218,0.16), transparent 65%)",
        }}
        aria-hidden
      />

      {/* Type column */}
      <div className="relative z-10 min-w-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.22em]"
          style={{ fontFamily: mono, color: BP_MUTE }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: BP_PASS }} />
          <span style={{ color: BP_PASS }}>Skill</span>
          <span className="opacity-60">— {item.category}</span>
        </div>

        {/* Wordmark — set as its own kebab-case skill id, mono, with a caret */}
        <h2
          className="mt-5 text-4xl leading-[0.95] sm:text-5xl lg:text-[3.75rem]"
          style={{
            fontFamily: mono,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: BP_INK,
          }}
        >
          skill-creator
          <span
            className="ml-1 inline-block animate-pulse"
            style={{ color: BP_PASS }}
            aria-hidden
          >
            ▍
          </span>
        </h2>

        {/* Tagline */}
        <p
          className="mt-6 text-2xl leading-snug sm:text-3xl"
          style={{ color: BP_INK, fontWeight: 300 }}
        >
          The skill that makes skills.
        </p>

        {/* Body */}
        <p
          className="mt-4 max-w-prose text-sm leading-relaxed sm:text-base"
          style={{ color: BP_MUTE }}
        >
          Draft a skill, run it against real prompts, and benchmark it with hard
          pass rates — then iterate until the numbers move. Don&apos;t guess
          whether your skill works.{" "}
          <span style={{ color: BP_INK }}>Measure it.</span>
        </p>

        {/* Loop strip */}
        <div
          className="mt-6 inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs sm:text-sm"
          style={{
            fontFamily: mono,
            borderColor: "rgba(132,180,218,0.3)",
            color: BP_MUTE,
          }}
        >
          <span style={{ color: BP_PASS }}>↺</span>
          <span style={{ color: BP_INK }}>draft</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BP_INK }}>eval</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BP_INK }}>improve</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BP_INK }}>repeat</span>
        </div>

        {/* Stats — blueprint annotation */}
        <div
          className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, color: BP_MUTE }}
        >
          <span className="flex items-center gap-1.5" style={{ color: BP_INK }}>
            <Star
              className="h-3.5 w-3.5"
              style={{ fill: BP_PASS, color: BP_PASS }}
            />
            {item.rating.toFixed(1)}
          </span>
          <span className="opacity-40">·</span>
          <span>{formatCompact(item.stars)} likes</span>
          <span className="opacity-40">·</span>
          <span>{formatCompact(item.exports)} installs</span>
        </div>

        {/* CTAs */}
        <div className="relative z-20 mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={item.href}
            tabIndex={active ? 0 : -1}
            className="group/get inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-mono text-sm font-semibold transition-transform duration-200 hover:-translate-y-px"
            style={{ fontFamily: mono, backgroundColor: BP_PASS, color: BP_DEEP }}
          >
            Get
            <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
          </Link>
          <Link
            href="/explore"
            tabIndex={active ? 0 : -1}
            className="inline-flex items-center rounded-md border px-5 py-2.5 font-mono text-sm transition-colors hover:text-white"
            style={{
              fontFamily: mono,
              borderColor: "rgba(132,180,218,0.35)",
              color: BP_MUTE,
            }}
          >
            Browse all
          </Link>
        </div>
      </div>

      {/* Blueprint drawing — the custom centrepiece: the iteration loop and a
          pass-rate readout that climbs across iterations. */}
      <div className="relative z-10 mx-auto w-full max-w-[26rem]">
        <svg
          viewBox="0 0 460 620"
          className="h-auto w-full"
          fill="none"
          role="img"
          aria-label="Blueprint of the skill-creator iteration loop and a pass rate climbing from 38 to 94 percent across three iterations"
        >
          <defs>
            <marker
              id="bp-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={BP_LINE} />
            </marker>
          </defs>

          {/* Sheet frame */}
          <rect
            x="12"
            y="12"
            width="436"
            height="596"
            rx="12"
            stroke={BP_LINE}
            strokeOpacity="0.5"
            strokeWidth="1.25"
          />

          {/* Header / title block */}
          <text x="30" y="40" fill={BP_MUTE} fontFamily={mono} fontSize="12" letterSpacing="1.5">
            FIG. 1 — ITERATION LOOP
          </text>
          <text x="430" y="34" textAnchor="end" fill={BP_INK} fontFamily={mono} fontSize="12" fontWeight="700" letterSpacing="1">
            SKILL-CREATOR
          </text>
          <text x="430" y="50" textAnchor="end" fill={BP_MUTE} fontFamily={mono} fontSize="10" letterSpacing="1">
            REV 4.8 · SHEET 1/1
          </text>
          <line x1="30" y1="60" x2="430" y2="60" stroke={BP_LINE} strokeOpacity="0.25" />

          {/* Loop arrows — clockwise diamond */}
          <g stroke={BP_LINE} strokeWidth="1.5">
            <line x1="252" y1="117" x2="326" y2="191" markerEnd="url(#bp-arrow)" />
            <line x1="330" y1="235" x2="252" y2="313" markerEnd="url(#bp-arrow)" />
            <line x1="208" y1="313" x2="132" y2="237" markerEnd="url(#bp-arrow)" />
            <line x1="130" y1="193" x2="206" y2="117" markerEnd="url(#bp-arrow)" />
          </g>

          {/* Loop nodes */}
          <g>
            <rect x="170" y="75" width="120" height="40" rx="8" fill={BP_DEEP} fillOpacity="0.55" stroke={BP_LINE} strokeWidth="1.25" />
            <text x="230" y="100" textAnchor="middle" fill={BP_INK} fontFamily={mono} fontSize="14" letterSpacing="2">DRAFT</text>

            <rect x="290" y="195" width="120" height="40" rx="8" fill={BP_DEEP} fillOpacity="0.55" stroke={BP_LINE} strokeWidth="1.25" />
            <text x="350" y="220" textAnchor="middle" fill={BP_INK} fontFamily={mono} fontSize="14" letterSpacing="2">EVAL</text>

            <rect x="170" y="315" width="120" height="40" rx="8" fill={BP_DEEP} fillOpacity="0.55" stroke={BP_LINE} strokeWidth="1.25" />
            <text x="230" y="340" textAnchor="middle" fill={BP_INK} fontFamily={mono} fontSize="14" letterSpacing="2">REVIEW</text>

            <rect x="50" y="195" width="120" height="40" rx="8" fill={BP_DEEP} fillOpacity="0.55" stroke={BP_LINE} strokeWidth="1.25" />
            <text x="110" y="220" textAnchor="middle" fill={BP_INK} fontFamily={mono} fontSize="14" letterSpacing="2">IMPROVE</text>
          </g>

          {/* Loop hub */}
          <text x="230" y="212" textAnchor="middle" fill={BP_PASS} fontFamily={mono} fontSize="30">↺</text>
          <text x="230" y="232" textAnchor="middle" fill={BP_MUTE} fontFamily={mono} fontSize="9" letterSpacing="2">ITERATE</text>

          {/* Section divider */}
          <line x1="30" y1="384" x2="430" y2="384" stroke={BP_LINE} strokeOpacity="0.25" />
          <text x="30" y="408" fill={BP_MUTE} fontFamily={mono} fontSize="12" letterSpacing="1.5">
            FIG. 2 — PASS RATE / ITERATION
          </text>
          <text x="430" y="408" textAnchor="end" fill={BP_PASS} fontFamily={mono} fontSize="12" fontWeight="700">
            ▲ +56 pts
          </text>

          {/* Benchmark guide lines */}
          <line x1="70" y1="430" x2="410" y2="430" stroke={BP_LINE} strokeOpacity="0.16" strokeDasharray="2 4" />
          <text x="62" y="434" textAnchor="end" fill={BP_MUTE} fontFamily={mono} fontSize="9" opacity="0.7">100</text>
          <line x1="70" y1="495" x2="410" y2="495" stroke={BP_LINE} strokeOpacity="0.16" strokeDasharray="2 4" />
          <text x="62" y="499" textAnchor="end" fill={BP_MUTE} fontFamily={mono} fontSize="9" opacity="0.7">50</text>

          {/* Baseline */}
          <line x1="70" y1="560" x2="410" y2="560" stroke={BP_LINE} strokeOpacity="0.5" strokeWidth="1.25" />

          {/* Bars — pass rate rising 38 → 71 → 94 */}
          <g>
            <rect x="112" y="511" width="56" height="49" rx="3" fill={BP_PASS} fillOpacity="0.14" stroke={BP_LINE} strokeWidth="1" />
            <text x="140" y="503" textAnchor="middle" fill={BP_MUTE} fontFamily={mono} fontSize="12">38</text>
            <text x="140" y="576" textAnchor="middle" fill={BP_MUTE} fontFamily={mono} fontSize="9" letterSpacing="1">iter 1</text>

            <rect x="212" y="468" width="56" height="92" rx="3" fill={BP_PASS} fillOpacity="0.5" />
            <text x="240" y="460" textAnchor="middle" fill={BP_INK} fontFamily={mono} fontSize="12">71</text>
            <text x="240" y="576" textAnchor="middle" fill={BP_MUTE} fontFamily={mono} fontSize="9" letterSpacing="1">iter 2</text>

            <rect x="312" y="438" width="56" height="122" rx="3" fill={BP_PASS} fillOpacity="0.95" />
            <text x="340" y="430" textAnchor="middle" fill={BP_PASS} fontFamily={mono} fontSize="13" fontWeight="700">94</text>
            <text x="340" y="576" textAnchor="middle" fill={BP_MUTE} fontFamily={mono} fontSize="9" letterSpacing="1">iter 3</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
