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
import { cn, formatCompact } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Cloud,
  Code2,
  FlaskConical,
  Lightbulb,
  Lock,
  Package,
  Sparkles,
  Palette,
  Star,
  Terminal,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Accent palette — restrained per the design language: the canvas stays
// neutral, accents only tint the emblem, glow, eyebrow dot and progress.
// ---------------------------------------------------------------------------

type AccentKey = "brand" | "green" | "blue" | "amber" | "red";

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
    name: "Cloudflare Skills",
    type: "Bundle",
    category: "Edge Platform",
    tagline: "Build once. Deploy to the edge, everywhere.",
    description:
      "Ten official Agent Skills that teach Claude to build on Cloudflare — Workers, Durable Objects, the Agents SDK, Wrangler, and the rest of the developer platform — then ship it straight to the global network.",
    icon: Cloud,
    accent: "amber",
    chips: ["workers", "durable objects", "agents sdk", "wrangler"],
    preview: ["→ wrangler deploy", "→ live at the edge"],
    rating: 4.9,
    ratingCount: 204,
    stars: 5400,
    exports: 16200,
    href: "/explore?q=Cloudflare",
  },
  {
    name: "brainstorming",
    type: "Skill",
    category: "Design",
    tagline: "Vague idea in. Validated design out.",
    description:
      "A design facilitator that refuses to write a line of code until the thinking is sound. It asks one question at a time, locks a shared understanding, weighs two or three approaches, and keeps a decision log — so you start building from a spec, not a guess.",
    icon: Lightbulb,
    accent: "amber",
    chips: [
      "one question at a time",
      "understanding lock",
      "explore approaches",
      "decision log",
    ],
    preview: [
      "→ understand before designing",
      "→ lock the understanding",
      "→ explore 2–3 approaches",
    ],
    rating: 4.8,
    ratingCount: 168,
    stars: 2900,
    exports: 9600,
    href: "/explore?q=brainstorming",
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
];

// Impeccable UI spotlight — a warm "design studio" field. The product is a
// design skill, so the whole panel is staged like a designer's workspace: a warm
// espresso canvas, brand-gold accents, and a hairline display face that itself
// looks designed. The video is the centrepiece, framed inside a polished app
// window with a floating design-token annotation — the craft made literal.
const IMP_CANVAS = "#15120e"; // warm espresso field
const IMP_DEEP = "#0c0a07"; // vignette floor
const IMP_PANEL = "#1d1812"; // window chrome / card fill
const IMP_PANEL_2 = "#0e0c09"; // letterbox / inner screen
const IMP_INK = "#f6f1e9"; // warm near-white ink
const IMP_MUTE = "#b6a98f"; // warm muted text
const IMP_FAINT = "#7e7256"; // faintest text
const IMP_LINE = "#33291b"; // warm hairline (brand-line family)
const IMP_GOLD = "#D8B894"; // brand-muted — primary accent
const IMP_GOLD_DK = "#C49B6C"; // brand — gradient base

// Hairline display face for the wordmark — a designed object in its own right,
// the visual antithesis of the heavy grotesques and monospaces elsewhere.
const IMP_DISPLAY: CSSProperties = {
  fontFamily:
    '"Raleway", "Avenir Next", "SF Pro Display", var(--font-display), sans-serif',
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
  // Impeccable UI gets its own bespoke "design studio" treatment.
  if (item.name === "Impeccable UI") {
    return (
      <ImpeccablePanel
        item={item}
        position={position}
        total={total}
        active={active}
      />
    );
  }

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

  // The Cloudflare Skills bundle gets its own bespoke global-edge-network treatment.
  if (item.name === "Cloudflare Skills") {
    return (
      <CloudflarePanel
        item={item}
        position={position}
        total={total}
        active={active}
      />
    );
  }

  // brainstorming gets its own bespoke ideation-canvas treatment.
  if (item.name === "brainstorming") {
    return (
      <BrainstormPanel
        item={item}
        position={position}
        total={total}
        active={active}
      />
    );
  }

  // Fallback — name-only (every catalogued spotlight has a bespoke panel above).
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

// ---------------------------------------------------------------------------
// Impeccable UI — a bespoke "design studio" spotlight. The product is a design
// skill, so the panel is staged as a designer's workspace: a warm espresso
// field, brand-gold accents, and a hairline display face that is itself a
// designed object. The centrepiece is the live demo video, framed inside a
// polished app window — three-dot chrome, a file-path tab, a "live" pip — with a
// floating design-token annotation card overlapping one corner so the craft the
// skill produces is made literal. Gold is the only accent; the rest is warm ink.
// ---------------------------------------------------------------------------

function ImpeccablePanel({
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
  const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace';

  return (
    <div
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 items-center gap-10 overflow-hidden px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[0.85fr_1.15fr] lg:gap-14"
      style={{ backgroundColor: IMP_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Structural grid backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-hero-grid opacity-60" aria-hidden />
      {/* Warm gold glow, gathered on the right where the window sits */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-[44rem] w-[44rem] -translate-y-1/2 translate-x-1/4 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(216,184,148,0.14), transparent 62%)",
        }}
        aria-hidden
      />
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(130% 100% at 50% 28%, transparent 42%, ${IMP_DEEP} 100%)`,
        }}
        aria-hidden
      />

      {/* Type column */}
      <div className="relative z-10 min-w-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.22em]"
          style={{ fontFamily: mono, color: IMP_MUTE }}
        >
          <Palette className="h-3.5 w-3.5" style={{ color: IMP_GOLD }} />
          <span style={{ color: IMP_GOLD }}>Skill</span>
          <span className="opacity-60">— {item.category}</span>
        </div>

        {/* Wordmark — hairline display, warm-gold gradient */}
        <h2
          className="mt-5 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
          style={{
            ...IMP_DISPLAY,
            backgroundImage: `linear-gradient(120deg, ${IMP_INK}, ${IMP_GOLD} 60%, ${IMP_GOLD_DK})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Impeccable UI
        </h2>

        {/* Tagline — large, hairline */}
        <p
          className="mt-5 text-3xl leading-[1.1] sm:text-4xl"
          style={{ ...IMP_DISPLAY, color: IMP_INK, fontWeight: 300 }}
        >
          The missing design vocabulary for agents.
        </p>

        {/* Body */}
        <p
          className="mt-5 max-w-prose text-sm leading-relaxed sm:text-base"
          style={{ color: IMP_MUTE }}
        >
          AI frontends all share one look because the model has no words for
          hierarchy, contrast, or restraint. Impeccable hands your agent the
          designer&apos;s vocabulary — and you the same commands — so you both
          stop guessing and start directing,{" "}
          <span style={{ color: IMP_INK }}>live, in your codebase.</span>
        </p>

        {/* Craft strip — the design primitives it reasons with */}
        <div
          className="mt-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, borderColor: IMP_LINE, color: IMP_MUTE }}
        >
          <span style={{ color: IMP_INK }}>type scale</span>
          <span className="opacity-50">·</span>
          <span style={{ color: IMP_INK }}>spacing</span>
          <span className="opacity-50">·</span>
          <span style={{ color: IMP_INK }}>contrast</span>
          <span className="opacity-50">·</span>
          <span style={{ color: IMP_GOLD }}>micro-states</span>
        </div>

        {/* Stats — studio annotation */}
        <div
          className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, color: IMP_MUTE }}
        >
          <span className="flex items-center gap-1.5" style={{ color: IMP_INK }}>
            <Star className="h-3.5 w-3.5" style={{ fill: IMP_GOLD, color: IMP_GOLD }} />
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
            className="group/get inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold shadow-elevated transition-transform duration-200 hover:-translate-y-px"
            style={{
              backgroundImage: `linear-gradient(135deg, ${IMP_GOLD}, ${IMP_GOLD_DK})`,
              color: IMP_DEEP,
            }}
          >
            Get
            <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
          </Link>
          <Link
            href="/explore"
            tabIndex={active ? 0 : -1}
            className="inline-flex items-center rounded-md border px-5 py-2.5 text-sm transition-colors hover:text-white"
            style={{ borderColor: IMP_LINE, color: IMP_MUTE }}
          >
            Browse all
          </Link>
        </div>
      </div>

      {/* Centrepiece — the live demo framed inside a polished app window */}
      <div className="relative z-10 mx-auto w-full max-w-[42rem]">
        <div
          className="group relative overflow-hidden rounded-2xl border shadow-elevated"
          style={{ borderColor: IMP_LINE, backgroundColor: IMP_PANEL }}
        >
          {/* Window chrome — three dots, a file tab, a live pip */}
          <div
            className="flex items-center gap-3 border-b px-4 py-2.5"
            style={{ borderColor: IMP_LINE }}
          >
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#3a2f20" }} />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#4a3c28" }} />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#5a4930" }} />
            </div>
            <span
              className="ml-1 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-2xs"
              style={{ fontFamily: mono, borderColor: IMP_LINE, color: IMP_MUTE }}
            >
              <Sparkles className="h-3 w-3" style={{ color: IMP_GOLD }} />
              Button.tsx
            </span>
            <span
              className="ml-auto inline-flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.18em]"
              style={{ fontFamily: mono, color: IMP_GOLD }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: IMP_GOLD }}
              />
              live
            </span>
          </div>

          {/* Screen — the demo video, letterboxed on near-black so nothing crops */}
          <div
            className="relative h-[16rem] w-full sm:h-[22rem] lg:h-[30rem]"
            style={{ backgroundColor: IMP_PANEL_2 }}
          >
            <video
              className="absolute inset-0 h-full w-full object-contain"
              src="/impeccable-ui-demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-label={`${item.name} demo`}
            />
            {/* Soft top sheen for screen realism */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-16"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(246,241,233,0.05), transparent)",
              }}
              aria-hidden
            />
          </div>
        </div>

        {/* Floating design-token annotation — the craft, made literal */}
        <div
          className="absolute -bottom-5 -left-4 hidden rounded-xl border px-4 py-3 shadow-elevated backdrop-blur sm:block"
          style={{
            borderColor: IMP_LINE,
            backgroundColor: "rgba(29,24,18,0.92)",
          }}
        >
          <div
            className="flex items-center gap-1.5 font-mono text-2xs uppercase tracking-[0.18em]"
            style={{ fontFamily: mono, color: IMP_FAINT }}
          >
            <Palette className="h-3 w-3" style={{ color: IMP_GOLD }} />
            design tokens
          </div>
          <div className="mt-2 flex items-center gap-3 font-mono text-2xs" style={{ fontFamily: mono }}>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: IMP_GOLD }} />
              <span style={{ color: IMP_MUTE }}>#C49B6C</span>
            </span>
            <span className="opacity-30" style={{ color: IMP_MUTE }}>|</span>
            <span style={{ color: IMP_INK }}>1.250 scale</span>
          </div>
          <div
            className="mt-1.5 flex items-center gap-1.5 font-mono text-2xs"
            style={{ fontFamily: mono, color: IMP_GOLD }}
          >
            <Check className="h-3 w-3" />
            <span>AA contrast · 4px grid</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ponytail — a bespoke "minimalist's profile card" spotlight. The skill sells
// restraint, so the panel sells the author: the hand-drawn portrait is framed
// as a collectible profile card — its own bordered object with a header pip, a
// green-pooled portrait window, and a name plate — set against a near-black
// field sampled from the art. The type column carries the manifesto and the one
// proof that matters: a single-line diff where a wall of effort collapses to one
// green line that ships. Heavy grotesque wordmark, bone-white ink, one terminal
// green — the deliberate opposite of Impeccable's hairline gold.
// ---------------------------------------------------------------------------

const PONYTAIL_CHROME = "#12161c"; // card header / plate fill
const PONYTAIL_BORDER = "#1c2128"; // hairline rules
const PONYTAIL_DIM = "#6b7280"; // de-emphasised code
const PONYTAIL_RED = "#f08a8a"; // removed-line marker
const PONYTAIL_VOID = "#07090d"; // vignette floor, a hair below the canvas

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
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 items-center gap-10 overflow-hidden px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
      style={{ backgroundColor: PONYTAIL_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Green ambient pool — gathers on the right, behind the portrait card */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(46% 52% at 78% 50%, rgba(126,231,135,0.12), transparent 70%)",
        }}
        aria-hidden
      />
      {/* Depth vignette — keeps the flat near-black from reading as empty */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(125% 100% at 50% 26%, transparent 44%, ${PONYTAIL_VOID} 100%)`,
        }}
        aria-hidden
      />

      {/* Type column — the manifesto and the one proof that matters */}
      <div className="relative z-10 min-w-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.22em]"
          style={{ color: PONYTAIL_MUTE }}
        >
          <Terminal className="h-3.5 w-3.5" style={{ color: PONYTAIL_GREEN }} />
          <span style={{ color: PONYTAIL_GREEN }}>Skill</span>
          <span className="opacity-60">— Minimalism</span>
        </div>

        {/* Wordmark — heavy, tight, bone-white */}
        <h2
          className="mt-5 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl"
          style={{ ...PONYTAIL_TITLE, color: PONYTAIL_INK }}
        >
          Ponytail
        </h2>

        {/* Tagline — the product in its own terse voice */}
        <p
          className="mt-5 text-2xl leading-snug sm:text-[1.7rem]"
          style={{ ...PONYTAIL_TAGLINE, color: PONYTAIL_MUTE }}
        >
          He says nothing.
          <br />
          He writes one line. It works.
        </p>

        {/* Body */}
        <p
          className="mt-5 max-w-prose text-sm leading-relaxed sm:text-base"
          style={{ color: PONYTAIL_MUTE }}
        >
          The agent that changes everything it needs to — and nothing it
          doesn&apos;t. No essays, no scaffolding, no apology.{" "}
          <span style={{ color: PONYTAIL_INK }}>
            The smallest correct diff, every time.
          </span>
        </p>

        {/* Signature — the one-line diff. A wall of effort collapses to a single
            line that ships. */}
        <div
          className="mt-7 max-w-[27rem] overflow-hidden rounded-lg border shadow-elevated"
          style={{ borderColor: PONYTAIL_BORDER, backgroundColor: "#11161d" }}
        >
          <div
            className="flex items-center justify-between gap-3 border-b px-3 py-1.5 font-mono text-2xs"
            style={{ borderColor: PONYTAIL_BORDER }}
          >
            <span className="truncate">
              <span style={{ color: PONYTAIL_GREEN, opacity: 0.5 }}>{"// "}</span>
              <span style={{ color: PONYTAIL_GREEN }}>ponytail: this exists</span>
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
          <span className="flex items-center gap-1.5" style={{ color: PONYTAIL_INK }}>
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
        <div className="relative z-20 mt-6 flex flex-wrap items-center gap-3">
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

      {/* Portrait card — the author, framed as a collectible profile */}
      <div className="relative z-10 mx-auto w-full max-w-[24rem]">
        {/* Soft green halo behind the card */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-[2rem] blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(126,231,135,0.13), transparent 65%)",
          }}
          aria-hidden
        />
        <div
          className="relative overflow-hidden rounded-2xl border shadow-elevated"
          style={{
            borderColor: PONYTAIL_BORDER,
            backgroundImage: `linear-gradient(180deg, ${PONYTAIL_CHROME}, ${PONYTAIL_CANVAS})`,
          }}
        >
          {/* Card header — a single open file, status live */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5 font-mono text-2xs"
            style={{ borderColor: PONYTAIL_BORDER, color: PONYTAIL_MUTE }}
          >
            <span className="truncate">
              <span style={{ color: PONYTAIL_GREEN, opacity: 0.55 }}>{"// "}</span>
              the author
            </span>
            <span
              className="flex shrink-0 items-center gap-1.5"
              style={{ color: PONYTAIL_GREEN }}
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: PONYTAIL_GREEN }}
              />
              active
            </span>
          </div>

          {/* Portrait window — the face, lit by a low green pool */}
          <div
            className="relative h-[18rem] w-full sm:h-[22rem] lg:h-[26rem]"
            style={{ backgroundColor: PONYTAIL_VOID }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(62% 60% at 50% 44%, rgba(126,231,135,0.16), transparent 72%)",
              }}
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ponytail-face.webp"
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-contain object-bottom"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, #000 84%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, #000 84%, transparent 100%)",
              }}
            />
          </div>

          {/* Name plate */}
          <div
            className="flex items-center gap-3 border-t px-4 py-3"
            style={{ borderColor: PONYTAIL_BORDER }}
          >
            <div className="min-w-0">
              <p
                className="truncate text-2xl leading-none"
                style={{ ...PONYTAIL_TITLE, color: PONYTAIL_INK }}
              >
                Ponytail
              </p>
              <p
                className="mt-1.5 font-mono text-2xs"
                style={{ color: PONYTAIL_MUTE }}
              >
                {formatCompact(item.stars)} likes · {formatCompact(item.exports)}{" "}
                installs
              </p>
            </div>
            <span
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-2xs"
              style={{ borderColor: PONYTAIL_GREEN, color: PONYTAIL_GREEN }}
            >
              <Star
                className="h-3 w-3"
                style={{ fill: PONYTAIL_GREEN, color: PONYTAIL_GREEN }}
              />
              minimalist
            </span>
          </div>
        </div>
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
            className="ml-1 inline-block"
            // Steady terminal blink (reuses the caret-blink keyframes), slowed
            // to a 1.6s on/off cadence so it blinks gently.
            style={{ color: BP_PASS, animation: "caret-blink 1.6s step-end infinite" }}
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

// ---------------------------------------------------------------------------
// Cloudflare Skills — a bespoke "global edge network" spotlight. Unlike the
// others this is a *bundle*, not one skill, so the panel sells two ideas at
// once: the unmistakable Cloudflare orange against a deep-midnight field, and
// the network itself. The centrepiece is a hand-built wireframe globe — one
// bright origin node radiating routing arcs out to glowing points of presence
// — the "deploy once, run everywhere" story Cloudflare is known for. The type
// column carries a bundle.lock manifest listing the ten real skills and a
// wrangler-deploy footer, so the "ten skills, one install" idea is literal.
// Orange is the single accent; everything else is cool slate and near-white.
// ---------------------------------------------------------------------------

const CF_CANVAS = "#0a0f1c"; // deep-midnight field
const CF_DEEP = "#05080f"; // vignette floor
const CF_PANEL = "#0f1626"; // manifest card fill
const CF_INK = "#f6f4ef"; // warm near-white ink
const CF_MUTE = "#94a0b4"; // muted slate text
const CF_LINE = "#283449"; // hairline rules / wireframe base
const CF_ORANGE = "#f6821f"; // Cloudflare brand orange
const CF_ORANGE_LT = "#fbad41"; // light orange — logo-gradient top stop
const CF_ORANGE_DK = "#e2620a"; // deep orange — gradient base
const CF_DOT = "rgba(120,140,170,0.06)"; // faint network dot-field

// The bundle's actual contents (github.com/cloudflare/skills), shown as a
// lockfile manifest so "ten skills, one install" reads at a glance.
const CF_BUNDLE = [
  "cloudflare",
  "agents-sdk",
  "durable-objects",
  "wrangler",
  "sandbox-sdk",
  "web-perf",
  "mcp-server",
  "ai-agent",
  "cloudflare-one",
  "one-migrations",
];

// Globe geometry. One origin hub near the sphere's centre; arcs bow out from it
// to a ring of points of presence scattered across the visible hemisphere.
const CF_GLOBE_C = { x: 240, y: 240 }; // sphere centre
const CF_HUB = { x: 240, y: 234 }; // origin node ("your deploy")
const CF_POPS = [
  { x: 150, y: 152 },
  { x: 330, y: 150 },
  { x: 374, y: 248 },
  { x: 318, y: 346 },
  { x: 176, y: 344 },
  { x: 108, y: 250 },
  { x: 250, y: 112 },
  { x: 205, y: 288 },
];

// A routing arc from the hub to a PoP — a quadratic whose control point is the
// midpoint pushed away from the sphere centre, so the path bows above the
// surface like a great-circle hop.
function cfArc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx + (mx - CF_GLOBE_C.x) * 0.55;
  const cy = my + (my - CF_GLOBE_C.y) * 0.55;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
}

function CloudflarePanel({
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
  const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace';

  return (
    <div
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 items-center gap-10 overflow-hidden px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
      style={{ backgroundColor: CF_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Faint network dot-field */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${CF_DOT} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
        aria-hidden
      />
      {/* Warm edge glow, gathered on the right where the globe sits */}
      <div
        className="pointer-events-none absolute right-0 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 translate-x-1/4 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(246,130,31,0.16), transparent 60%)",
        }}
        aria-hidden
      />
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(130% 100% at 50% 30%, transparent 40%, ${CF_DEEP} 100%)`,
        }}
        aria-hidden
      />

      {/* Type column */}
      <div className="relative z-10 min-w-0">
        {/* Eyebrow — declares this is a bundle, not a single skill */}
        <div
          className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.22em]"
          style={{ fontFamily: mono, color: CF_MUTE }}
        >
          <Cloud className="h-4 w-4" style={{ color: CF_ORANGE }} />
          <span style={{ color: CF_ORANGE_LT }}>Bundle</span>
          <span className="opacity-60">— 10 skills · {item.category}</span>
        </div>

        {/* Wordmark — "Cloudflare" in the brand orange gradient, "Skills" in ink */}
        <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          <span
            style={{
              backgroundImage: `linear-gradient(135deg, ${CF_ORANGE_LT}, ${CF_ORANGE} 55%, ${CF_ORANGE_DK})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Cloudflare
          </span>
          <br />
          <span style={{ color: CF_INK }}>Skills</span>
        </h2>

        {/* Tagline */}
        <p
          className="mt-5 text-2xl leading-snug sm:text-3xl"
          style={{ color: CF_INK, fontWeight: 300 }}
        >
          Build once.{" "}
          <span style={{ color: CF_ORANGE_LT }}>
            Deploy to the edge, everywhere.
          </span>
        </p>

        {/* Body */}
        <p
          className="mt-4 max-w-prose text-sm leading-relaxed sm:text-base"
          style={{ color: CF_MUTE }}
        >
          Ten official Agent Skills that teach Claude to build on Cloudflare —
          Workers, Durable Objects, the Agents SDK, Wrangler, and the rest of the
          developer platform — then ship it straight to the global network.
        </p>

        {/* bundle.lock — the literal contents of the bundle */}
        <div
          className="mt-7 max-w-[30rem] overflow-hidden rounded-xl border shadow-elevated"
          style={{ borderColor: CF_LINE, backgroundColor: CF_PANEL }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.18em]"
            style={{ fontFamily: mono, borderColor: CF_LINE, color: CF_MUTE }}
          >
            <span className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5" style={{ color: CF_ORANGE }} />
              bundle.lock
            </span>
            <span style={{ color: CF_ORANGE_LT }}>10 skills</span>
          </div>
          <ul
            className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-4 py-3 font-mono text-xs"
            style={{ fontFamily: mono, color: CF_INK }}
          >
            {CF_BUNDLE.map((skill) => (
              <li key={skill} className="flex items-center gap-2">
                <Check
                  className="h-3 w-3 shrink-0"
                  style={{ color: CF_ORANGE }}
                />
                <span className="truncate">{skill}</span>
              </li>
            ))}
          </ul>
          <div
            className="flex items-center gap-2 border-t px-4 py-2 font-mono text-2xs"
            style={{ fontFamily: mono, borderColor: CF_LINE, color: CF_MUTE }}
          >
            <span style={{ color: CF_ORANGE }}>$</span>
            <span style={{ color: CF_INK }}>wrangler deploy</span>
            <span
              className="ml-auto flex items-center gap-1.5"
              style={{ color: CF_ORANGE_LT }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: CF_ORANGE }}
              />
              live · 330+ cities
            </span>
          </div>
        </div>

        {/* Stats — terminal annotation */}
        <div
          className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, color: CF_MUTE }}
        >
          <span className="flex items-center gap-1.5" style={{ color: CF_INK }}>
            <Star
              className="h-3.5 w-3.5"
              style={{ fill: CF_ORANGE, color: CF_ORANGE }}
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
            className="group/get inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-elevated transition-transform duration-200 hover:-translate-y-px"
            style={{
              backgroundImage: `linear-gradient(135deg, ${CF_ORANGE_LT}, ${CF_ORANGE})`,
            }}
          >
            Get the bundle
            <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
          </Link>
          <Link
            href="/explore"
            tabIndex={active ? 0 : -1}
            className="inline-flex items-center rounded-md border px-5 py-2.5 text-sm transition-colors hover:text-white"
            style={{ borderColor: CF_LINE, color: CF_MUTE }}
          >
            Browse all
          </Link>
        </div>
      </div>

      {/* Globe — the custom centrepiece: one origin node routing out to a ring
          of points of presence across the visible hemisphere. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[30rem] items-center justify-center">
        <svg
          viewBox="0 0 480 480"
          className="h-auto w-full"
          fill="none"
          role="img"
          aria-label="A wireframe globe of the Cloudflare edge network: one origin node routing connection arcs out to eight glowing points of presence"
        >
          <defs>
            <radialGradient id="cf-sphere" cx="38%" cy="32%" r="78%">
              <stop offset="0%" stopColor="#1a2742" />
              <stop offset="55%" stopColor="#0e1830" />
              <stop offset="100%" stopColor="#070b16" />
            </radialGradient>
            <radialGradient id="cf-glow">
              <stop offset="0%" stopColor={CF_ORANGE} stopOpacity="0.85" />
              <stop offset="100%" stopColor={CF_ORANGE} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cf-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={CF_ORANGE_LT} />
              <stop offset="100%" stopColor={CF_ORANGE} />
            </linearGradient>
            <clipPath id="cf-clip">
              <circle cx="240" cy="240" r="180" />
            </clipPath>
          </defs>

          {/* Sphere body */}
          <circle
            cx="240"
            cy="240"
            r="180"
            fill="url(#cf-sphere)"
            stroke={CF_LINE}
            strokeWidth="1.25"
          />

          {/* Wireframe — meridians + parallels, clipped to the sphere */}
          <g
            clipPath="url(#cf-clip)"
            stroke={CF_LINE}
            strokeWidth="1"
            fill="none"
            strokeOpacity="0.6"
          >
            {/* meridians (longitude) */}
            <line x1="240" y1="60" x2="240" y2="420" />
            <ellipse cx="240" cy="240" rx="90" ry="180" />
            <ellipse cx="240" cy="240" rx="156" ry="180" />
            {/* parallels (latitude) */}
            <ellipse cx="240" cy="240" rx="180" ry="29" />
            <ellipse cx="240" cy="150" rx="156" ry="25" />
            <ellipse cx="240" cy="330" rx="156" ry="25" />
            <ellipse cx="240" cy="84" rx="90" ry="14" />
            <ellipse cx="240" cy="396" rx="90" ry="14" />
          </g>

          {/* Routing arcs from the origin hub to each PoP */}
          <g
            stroke="url(#cf-arc)"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
            strokeOpacity="0.9"
          >
            {CF_POPS.map((p, i) => (
              <path key={i} d={cfArc(CF_HUB, p)} />
            ))}
          </g>

          {/* Points of presence — faint twinkling halo + crisp core */}
          {CF_POPS.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="11"
                fill="url(#cf-glow)"
                className="animate-pulse"
                style={{ animationDelay: `${(i % 4) * 0.45}s` }}
              />
              <circle cx={p.x} cy={p.y} r="3.5" fill={CF_ORANGE_LT} />
            </g>
          ))}

          {/* Origin hub — brighter, with a pulsing ring */}
          <circle cx={CF_HUB.x} cy={CF_HUB.y} r="24" fill="url(#cf-glow)" />
          <circle
            cx={CF_HUB.x}
            cy={CF_HUB.y}
            r="13"
            fill="none"
            stroke={CF_ORANGE}
            strokeWidth="1.25"
            strokeOpacity="0.5"
            className="animate-pulse"
          />
          <circle cx={CF_HUB.x} cy={CF_HUB.y} r="5.5" fill={CF_ORANGE_LT} />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// brainstorming — a bespoke "ideation canvas" spotlight. The skill turns vague
// ideas into validated designs by slowing the process down: one question at a
// time, a hard "understanding lock", then two or three weighed approaches with
// a recommendation, all captured in a decision log. The centrepiece renders
// that exact flow as a dark studio whiteboard — a raw, vague idea up top, a
// single focused question, the lock gate, then the branch of approaches with
// the recommended one lit. Deep plum-indigo field, warm-white ink, and a single
// gold "insight" accent used only where something is decided. An editorial
// serif wordmark sets it apart from the sans/mono voices of the other slides.
// ---------------------------------------------------------------------------

const BS_CANVAS = "#171228"; // deep plum-indigo field
const BS_DEEP = "#0f0b1d"; // vignette floor / deepest shade
const BS_PANEL = "#221a3a"; // raised card fill
const BS_PANEL_2 = "#1b1430"; // secondary / inset card fill
const BS_INK = "#f4efe6"; // warm near-white ink
const BS_MUTE = "#b4aacb"; // lavender-grey muted text
const BS_FAINT = "#7b7099"; // faintest text / dashed strokes
const BS_LINE = "#372d54"; // hairline rules / connectors
const BS_GOLD = "#f2c879"; // amber "insight / decided" accent
const BS_GOLD_SOFT = "rgba(242,200,121,0.14)";

// Editorial serif wordmark — the considered, studio-journal voice. None of the
// other slides use a serif, so it reads as its own identity at a glance.
const BS_SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';

// One focused question with multiple-choice answers — the skill's signature
// "one question at a time". Option B is the chosen answer.
const BS_OPTIONS: { key: string; label: string; chosen: boolean }[] = [
  { key: "A", label: "Internal team", chosen: false },
  { key: "B", label: "End users", chosen: true },
  { key: "C", label: "Both — phased", chosen: false },
];

// The two-or-three weighed approaches, recommendation lit.
const BS_APPROACHES: { key: string; label: string; rec: boolean }[] = [
  { key: "A", label: "Local-first", rec: true },
  { key: "B", label: "Server sync", rec: false },
  { key: "C", label: "Hybrid", rec: false },
];

function BrainstormPanel({
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
  const mono = 'ui-monospace, "JetBrains Mono", "SF Mono", "Menlo", monospace';

  // A thin centred connector between board stations.
  const connector = (
    <div className="mx-auto h-5 w-px" style={{ backgroundColor: BS_LINE }} aria-hidden />
  );

  return (
    <div
      className="relative grid min-h-[34rem] w-full shrink-0 grid-cols-1 items-center gap-10 overflow-hidden px-6 pb-16 pt-12 sm:min-h-[40rem] sm:px-12 sm:pb-20 sm:pt-16 lg:min-h-[52rem] lg:grid-cols-[1fr_1fr] lg:gap-14"
      style={{ backgroundColor: BS_CANVAS }}
      aria-hidden={!active}
      aria-roledescription="slide"
      aria-label={`${position} of ${total}`}
    >
      {/* Dotted whiteboard canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(244,239,230,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      {/* Gold ambient glow — gathers on the right, where the decision lands */}
      <div
        className="pointer-events-none absolute right-[6%] top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(242,200,121,0.12), transparent 65%)",
        }}
        aria-hidden
      />
      {/* Edge vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(125% 100% at 50% 24%, transparent 44%, ${BS_DEEP} 100%)`,
        }}
        aria-hidden
      />

      {/* Type column */}
      <div className="relative z-10 min-w-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.22em]"
          style={{ fontFamily: mono, color: BS_MUTE }}
        >
          <Lightbulb className="h-3.5 w-3.5" style={{ color: BS_GOLD }} />
          <span style={{ color: BS_GOLD }}>Skill</span>
          <span className="opacity-60">— {item.category}</span>
        </div>

        {/* Wordmark — editorial serif */}
        <h2
          className="mt-5 text-4xl leading-[0.95] sm:text-6xl lg:text-[4.25rem]"
          style={{
            fontFamily: BS_SERIF,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: BS_INK,
          }}
        >
          brainstorming
        </h2>

        {/* Tagline */}
        <p
          className="mt-6 text-2xl leading-snug sm:text-3xl"
          style={{
            fontFamily: BS_SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            color: BS_INK,
          }}
        >
          Vague idea in.{" "}
          <span style={{ color: BS_GOLD }}>Validated design out.</span>
        </p>

        {/* Body */}
        <p
          className="mt-4 max-w-prose text-sm leading-relaxed sm:text-base"
          style={{ color: BS_MUTE }}
        >
          A design facilitator that refuses to write a line of code until the
          thinking is sound — one question at a time, a hard understanding lock,
          then two or three weighed approaches.{" "}
          <span style={{ color: BS_INK }}>
            You build from a spec, not a guess.
          </span>
        </p>

        {/* Principle strip */}
        <div
          className="mt-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-3 py-2 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, borderColor: BS_LINE, color: BS_MUTE }}
        >
          <span style={{ color: BS_INK }}>understand</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BS_INK }}>lock</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BS_INK }}>explore</span>
          <span className="opacity-50">→</span>
          <span style={{ color: BS_GOLD }}>decide</span>
        </div>

        {/* Stats — studio annotation */}
        <div
          className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs sm:text-sm"
          style={{ fontFamily: mono, color: BS_MUTE }}
        >
          <span className="flex items-center gap-1.5" style={{ color: BS_INK }}>
            <Star
              className="h-3.5 w-3.5"
              style={{ fill: BS_GOLD, color: BS_GOLD }}
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
            style={{ fontFamily: mono, backgroundColor: BS_GOLD, color: BS_DEEP }}
          >
            Get
            <ArrowRight className="h-4 w-4 transition-transform group-hover/get:translate-x-0.5" />
          </Link>
          <Link
            href="/explore"
            tabIndex={active ? 0 : -1}
            className="inline-flex items-center rounded-md border px-5 py-2.5 font-mono text-sm transition-colors hover:text-white"
            style={{ fontFamily: mono, borderColor: BS_LINE, color: BS_MUTE }}
          >
            Browse all
          </Link>
        </div>
      </div>

      {/* Ideation board — the bespoke centrepiece: raw idea → one question →
          understanding lock → weighed approaches with a recommendation. */}
      <div className="relative z-10 mx-auto w-full max-w-[26rem]">
        {/* Board caption */}
        <div
          className="mb-4 flex items-center justify-between font-mono text-2xs uppercase tracking-[0.2em]"
          style={{ fontFamily: mono, color: BS_FAINT }}
        >
          <span>design session</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" style={{ color: BS_GOLD }} />
            live
          </span>
        </div>

        {/* 1 — Raw idea: the vague input, fragments still unanswered */}
        <div
          className="rounded-xl border border-dashed px-4 py-3"
          style={{ borderColor: BS_FAINT, backgroundColor: BS_PANEL_2 }}
        >
          <span
            className="font-mono text-2xs uppercase tracking-[0.18em]"
            style={{ fontFamily: mono, color: BS_FAINT }}
          >
            raw idea
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["“some kind of sync?”", "offline?", "who’s it for?", "realtime…"].map(
              (frag) => (
                <span
                  key={frag}
                  className="rounded border border-dashed px-1.5 py-0.5 font-mono text-2xs"
                  style={{ fontFamily: mono, borderColor: BS_LINE, color: BS_MUTE }}
                >
                  {frag}
                </span>
              )
            )}
          </div>
        </div>

        {connector}

        {/* 2 — One question at a time, with multiple-choice answers */}
        <div
          className="rounded-xl border px-4 py-3 shadow-elevated"
          style={{ borderColor: BS_LINE, backgroundColor: BS_PANEL }}
        >
          <div
            className="flex items-center justify-between font-mono text-2xs"
            style={{ fontFamily: mono }}
          >
            <span className="flex items-center gap-1.5" style={{ color: BS_GOLD }}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: BS_GOLD }}
              />
              one question at a time
            </span>
            <span style={{ color: BS_FAINT }}>q01</span>
          </div>
          <p
            className="mt-2 text-lg"
            style={{ fontFamily: BS_SERIF, color: BS_INK }}
          >
            Who is this actually for?
          </p>
          <div className="mt-3 space-y-1.5">
            {BS_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
                style={{
                  borderColor: opt.chosen ? BS_GOLD : BS_LINE,
                  backgroundColor: opt.chosen ? BS_GOLD_SOFT : "transparent",
                  color: opt.chosen ? BS_INK : BS_MUTE,
                }}
              >
                <span
                  className="font-mono text-2xs"
                  style={{ fontFamily: mono, color: opt.chosen ? BS_GOLD : BS_FAINT }}
                >
                  {opt.key}
                </span>
                <span>{opt.label}</span>
                {opt.chosen && (
                  <Check className="ml-auto h-3.5 w-3.5" style={{ color: BS_GOLD }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {connector}

        {/* 3 — Understanding lock: the hard gate before any design */}
        <div
          className="flex items-center gap-2 rounded-lg border px-3.5 py-2.5"
          style={{ borderColor: BS_GOLD, backgroundColor: BS_GOLD_SOFT }}
        >
          <Lock className="h-4 w-4" style={{ color: BS_GOLD }} />
          <span className="text-sm font-medium" style={{ color: BS_INK }}>
            Understanding locked
          </span>
          <span
            className="ml-auto flex items-center gap-1 font-mono text-2xs"
            style={{ fontFamily: mono, color: BS_GOLD }}
          >
            <Check className="h-3 w-3" />
            confirmed
          </span>
        </div>

        {connector}

        {/* 4 — Weighed approaches, recommendation lit, decision logged */}
        <div
          className="font-mono text-2xs uppercase tracking-[0.18em]"
          style={{ fontFamily: mono, color: BS_FAINT }}
        >
          explore 2–3 approaches
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {BS_APPROACHES.map((a) => (
            <div
              key={a.key}
              className="rounded-lg border px-2.5 py-2"
              style={{
                borderColor: a.rec ? BS_GOLD : BS_LINE,
                backgroundColor: a.rec ? BS_GOLD_SOFT : BS_PANEL_2,
              }}
            >
              <div
                className="flex items-center justify-between font-mono text-2xs"
                style={{ fontFamily: mono, color: a.rec ? BS_GOLD : BS_FAINT }}
              >
                <span>{a.key}</span>
                {a.rec && <span aria-hidden>★</span>}
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: a.rec ? BS_INK : BS_MUTE }}
              >
                {a.label}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-2 font-mono text-2xs"
          style={{ fontFamily: mono, color: BS_FAINT }}
        >
          <span style={{ color: BS_GOLD }}>A</span> recommended · decision logged
        </div>
      </div>
    </div>
  );
}
