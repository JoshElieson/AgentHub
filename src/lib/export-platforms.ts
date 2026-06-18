/**
 * Centralized registry of export platforms.
 *
 * Each platform defines the folder path segments where skills are installed
 * and metadata for UI display. Adding a new platform is a single object here —
 * all export buttons, API routes, and the compiler pick it up automatically.
 */

export interface ExportPlatform {
  /** Unique machine-readable key, e.g. "antigravity" */
  id: string;
  /** Human-facing label shown in buttons / dropdowns */
  label: string;
  /**
   * Directory segments relative to the project root.
   * e.g. [".agents", "skills"] → <root>/.agents/skills/<skill>/
   */
  pathSegments: string[];
  /** Short description shown beneath the label (e.g. "→ .agents/skills/") */
  pathHint: string;
  /** Lucide icon name hint — consumed by UI to pick the right icon */
  iconHint: "download" | "terminal" | "sparkles" | "cpu" | "code";
  /** Visual variant for the icon badge in UI */
  variant: "brand" | "default";
}

/**
 * The ordered list of supported export platforms.
 * The first entry is used as the DEFAULT / fallback when:
 *  - An unknown platform ID is encountered
 *  - The API receives an unrecognized target value
 *  - Only one option needs to be shown
 */
export const EXPORT_PLATFORMS: ExportPlatform[] = [
  {
    id: "antigravity",
    label: "Antigravity",
    pathSegments: [".agents", "skills"],
    pathHint: "→ .agents/skills/",
    iconHint: "download",
    variant: "brand",
  },
  {
    id: "claude",
    label: "Claude Code",
    pathSegments: [".claude", "skills"],
    pathHint: "→ .claude/skills/",
    iconHint: "terminal",
    variant: "default",
  },
  {
    id: "cursor",
    label: "Cursor",
    pathSegments: [".cursor", "skills"],
    pathHint: "→ .cursor/skills/",
    iconHint: "code",
    variant: "default",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    pathSegments: [".windsurf", "skills"],
    pathHint: "→ .windsurf/skills/",
    iconHint: "sparkles",
    variant: "default",
  },
];

/** The default platform — always the first entry in the registry. */
export const DEFAULT_PLATFORM: ExportPlatform = EXPORT_PLATFORMS[0];

/** Quick lookup map: platform ID → ExportPlatform */
const platformMap = new Map(EXPORT_PLATFORMS.map((p) => [p.id, p]));

/**
 * Resolve a platform by ID.  Returns the matching platform, or the DEFAULT
 * platform if the ID is unknown — ensuring we never crash on bad input.
 */
export function getPlatform(id: string): ExportPlatform {
  return platformMap.get(id) ?? DEFAULT_PLATFORM;
}

/**
 * Type-safe union of all known platform IDs.
 * Consumers can use this instead of raw strings when they need narrowed types.
 */
export type PlatformId = (typeof EXPORT_PLATFORMS)[number]["id"];
