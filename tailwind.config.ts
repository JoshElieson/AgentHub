import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — flat, layered, near-black canvas (infrastructure-grade)
        canvas: "#080B10",
        surface: "#111317",
        "surface-2": "#171A1F",
        "surface-3": "#1E2229",
        overlay: "#1A1D23",

        // Lines / borders — the primary structural device
        line: "#23262B",
        "line-strong": "#2F333A",

        // Text
        content: "#F3F4F6",
        muted: "#A3A8B2",
        subtle: "#70757F",
        faint: "#565B64",

        // Brand — warm light brown, used for actions only
        brand: "#C49B6C",
        "brand-fg": "#211910",
        "brand-hover": "#D2AE82",
        "brand-muted": "#D8B894",
        "brand-dim": "#1C140B99",
        "brand-line": "#3A2E1F",

        // Semantic — status & actions, never large fills
        success: "#22C55E",
        "success-dim": "#0E2017",
        warning: "#E0A82E",
        "warning-dim": "#241B0A",
        danger: "#EF4444",
        "danger-dim": "#2A1414",
        info: "#5B9BD8",
        "info-dim": "#10202E",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        "tight-lg": "-0.02em",
        "tighter-lg": "-0.03em",
      },
      // Engineered corners — nothing rounder than 6px.
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
        xl: "6px",
        "2xl": "6px",
        "3xl": "6px",
        card: "6px",
        full: "9999px",
      },
      maxWidth: {
        site: "1280px",
        prose: "44rem",
      },
      // Borders over shadows. Only the faintest elevation where floating is required.
      boxShadow: {
        none: "none",
        sm: "0 1px 0 0 rgba(255,255,255,0.03)",
        DEFAULT: "0 1px 2px 0 rgba(0,0,0,0.35)",
        card: "0 1px 0 0 rgba(255,255,255,0.025)",
        md: "0 2px 6px -2px rgba(0,0,0,0.4)",
        lg: "0 4px 12px -4px rgba(0,0,0,0.5)",
        elevated:
          "0 10px 30px -12px rgba(0,0,0,0.7), 0 2px 6px -2px rgba(0,0,0,0.5)",
        overlay:
          "0 18px 48px -16px rgba(0,0,0,0.8), 0 4px 12px -6px rgba(0,0,0,0.6)",
        "inner-line": "inset 0 0 0 1px rgba(255,255,255,0.04)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.022) 1px, transparent 1px)",
        // Subtle warm-brown accent glow — used sparingly behind CTAs
        "brand-glow":
          "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(196,155,108,0.10), transparent 70%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.985)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out both",
        "fade-in-up": "fade-in-up 0.2s ease-out both",
        "scale-in": "scale-in 0.12s ease-out both",
        "slide-up": "slide-up 0.2s cubic-bezier(0.16,1,0.3,1) both",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
