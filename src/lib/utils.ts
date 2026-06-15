import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 17842 -> "17,842" ; 132000 -> "132k" ; 1_300_000 -> "1.3M" */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : trimZero(k.toFixed(1))}k`;
  }
  const m = n / 1_000_000;
  return `${trimZero(m.toFixed(1))}M`;
}

/** 17842 -> "17,842" */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function trimZero(s: string): string {
  return s.replace(/\.0$/, "");
}

/** Format an ISO date as "Jan 5, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Relative time vs. a fixed "now". We pass `now` explicitly so output is
 * deterministic during SSR/build and never drifts between server and client.
 */
export function timeAgo(iso: string, now: string = NOW): string {
  const then = new Date(iso).getTime();
  const diff = new Date(now).getTime() - then;
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const mo = Math.round(day / 30);
  const yr = Math.round(day / 365);

  if (sec < 60) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${yr} year${yr === 1 ? "" : "s"} ago`;
}

/** Fixed reference timestamp for deterministic relative dates across the app. */
export const NOW = "2026-06-14T12:00:00.000Z";

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : plural ?? `${singular}s`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic color index from a string (for avatar gradients, etc.). */
export function hashIndex(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}
