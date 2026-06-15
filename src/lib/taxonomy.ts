import type {
  Category,
  License,
  PackageType,
  PermissionKey,
  Platform,
  Pricing,
  RiskLevel,
} from "./types";

// ---------------------------------------------------------------------------
// Package types
// ---------------------------------------------------------------------------

export const PACKAGE_TYPES: {
  value: PackageType;
  label: string;
  description: string;
}[] = [
  { value: "agent", label: "Agent", description: "Autonomous, multi-step AI agent with tools and instructions." },
  { value: "claude-skill", label: "Claude Skill", description: "A packaged Claude skill (SKILL.md + resources)." },
  { value: "cursor-rule", label: "Cursor Rule", description: "Project rules and context for Cursor (.mdc)." },
  { value: "mcp-server", label: "MCP Server", description: "Model Context Protocol server exposing tools & resources." },
  { value: "workflow", label: "Workflow", description: "Multi-step or multi-agent orchestration." },
  { value: "prompt-pack", label: "Prompt Pack", description: "Curated, versioned collection of prompts and instructions." },
  { value: "custom-mode", label: "Custom Mode", description: "A reusable editor/assistant mode with its own behavior." },
  { value: "tool-adapter", label: "Tool Adapter", description: "Connects an agent to an external tool, API, or service." },
  { value: "agent-template", label: "Agent Template", description: "A starter scaffold for building a new agent." },
  { value: "automation", label: "Automation", description: "Triggered or scheduled task that runs without a human in the loop." },
];

export const PACKAGE_TYPE_LABELS: Record<PackageType, string> = Object.fromEntries(
  PACKAGE_TYPES.map((t) => [t.value, t.label])
) as Record<PackageType, string>;

// Short badge label (sometimes tighter than full label)
export const PACKAGE_TYPE_SHORT: Record<PackageType, string> = {
  agent: "Agent",
  "claude-skill": "Skill",
  "cursor-rule": "Rule",
  "mcp-server": "MCP Server",
  workflow: "Workflow",
  "prompt-pack": "Prompts",
  "custom-mode": "Mode",
  "tool-adapter": "Adapter",
  "agent-template": "Template",
  automation: "Automation",
};

// ---------------------------------------------------------------------------
// Platforms
// ---------------------------------------------------------------------------

export interface PlatformMeta {
  value: Platform;
  label: string;
  short: string;
  /** Short mono "glyph" used in the platform badge chip. */
  glyph: string;
  /** CLI `--target` value. */
  target: string;
  /** Whether the CLI installs in place or exports to another format. */
  action: "install" | "export";
  /** Where the package lands. `[slug]` is replaced with the package slug. */
  installPath?: string;
  /** Short label for how the package is consumed (compatibility table). */
  installMethod: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    value: "claude-code",
    label: "Claude Code",
    short: "Claude Code",
    glyph: "CC",
    target: "claude-code",
    action: "install",
    installPath: ".claude/skills/[slug]",
    installMethod: "CLI install",
  },
  {
    value: "claude-desktop",
    label: "Claude Desktop",
    short: "Claude Desktop",
    glyph: "CD",
    target: "claude-desktop",
    action: "install",
    installPath: "~/Library/Application Support/Claude/skills/[slug]",
    installMethod: "Desktop install",
  },
  {
    value: "cursor",
    label: "Cursor",
    short: "Cursor",
    glyph: "Cu",
    target: "cursor",
    action: "install",
    installPath: ".cursor/rules/[slug].mdc",
    installMethod: "Cursor rule",
  },
  {
    value: "windsurf",
    label: "Windsurf",
    short: "Windsurf",
    glyph: "Ws",
    target: "windsurf",
    action: "install",
    installPath: ".windsurf/rules/[slug].md",
    installMethod: "Windsurf rule",
  },
  {
    value: "openai-agents",
    label: "OpenAI Agents",
    short: "OpenAI Agents",
    glyph: "OA",
    target: "openai-agents",
    action: "export",
    installPath: "agent.json",
    installMethod: "agent.json export",
  },
  {
    value: "gemini-cli",
    label: "Gemini CLI",
    short: "Gemini CLI",
    glyph: "Gm",
    target: "gemini-cli",
    action: "install",
    installPath: "~/.gemini/extensions/[slug]",
    installMethod: "CLI install",
  },
  {
    value: "github-copilot",
    label: "GitHub Copilot",
    short: "Copilot",
    glyph: "Co",
    target: "copilot-instructions",
    action: "export",
    installPath: ".github/copilot-instructions.md",
    installMethod: "Instructions export",
  },
  {
    value: "replit-agent",
    label: "Replit Agent",
    short: "Replit",
    glyph: "Rp",
    target: "replit-agent",
    action: "install",
    installPath: ".replit/agents/[slug]",
    installMethod: "Replit install",
  },
  {
    value: "mcp",
    label: "MCP-compatible",
    short: "MCP",
    glyph: "M",
    target: "mcp",
    action: "install",
    installPath: ".mcp/[slug]",
    installMethod: "MCP config",
  },
];

export const PLATFORM_LABELS: Record<Platform, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.value, p.label])
) as Record<Platform, string>;

export const PLATFORM_META: Record<Platform, PlatformMeta> = Object.fromEntries(
  PLATFORMS.map((p) => [p.value, p])
) as Record<Platform, PlatformMeta>;

/** Build the install/export command for a slug on a given platform. */
export function platformCommand(slug: string, platform: Platform): string {
  const p = PLATFORM_META[platform];
  return `npx agentdock ${p.action} ${slug} --target ${p.target}`;
}

/** Resolve the concrete install path for a slug on a given platform. */
export function platformPath(slug: string, platform: Platform): string | undefined {
  return PLATFORM_META[platform].installPath?.replace("[slug]", slug);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES: {
  value: Category;
  label: string;
  description: string;
}[] = [
  { value: "development", label: "Development", description: "Coding, refactoring, frameworks, and tooling." },
  { value: "security", label: "Security", description: "AppSec, audits, secrets, and agent safety." },
  { value: "devops", label: "DevOps", description: "CI/CD, infra, releases, and observability." },
  { value: "research", label: "Research", description: "Reading, summarizing, and synthesizing sources." },
  { value: "design", label: "Design", description: "UI, UX, design systems, and assets." },
  { value: "writing", label: "Writing", description: "Docs, content, and editing." },
  { value: "data-science", label: "Data Science", description: "Analysis, SQL, ML, and notebooks." },
  { value: "productivity", label: "Productivity", description: "Planning, notes, and workflows." },
  { value: "education", label: "Education", description: "Tutoring, explanations, and learning." },
  { value: "browser-automation", label: "Browser Automation", description: "Driving browsers, scraping, and end-to-end flows." },
  { value: "integrations", label: "Integrations", description: "Connectors for APIs, databases, and external services." },
];

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
) as Record<Category, string>;

// ---------------------------------------------------------------------------
// Licenses & pricing
// ---------------------------------------------------------------------------

export const LICENSES: License[] = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0",
  "Proprietary",
  "Unknown",
];

export const PRICING_OPTIONS: { value: Pricing; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "open-source", label: "Open Source" },
];

export const PRICING_LABELS: Record<Pricing, string> = {
  free: "Free",
  paid: "Paid",
  "open-source": "Open Source",
};

// ---------------------------------------------------------------------------
// Permissions — metadata, labels, and per-permission risk
// ---------------------------------------------------------------------------

export const PERMISSION_META: Record<
  PermissionKey,
  { label: string; description: string; risk: RiskLevel }
> = {
  readFiles: {
    label: "Read files",
    description: "Read files in the workspace.",
    risk: "low",
  },
  writeFiles: {
    label: "Write files",
    description: "Create or modify files in the workspace.",
    risk: "medium",
  },
  runCommands: {
    label: "Run shell commands",
    description: "Execute commands in your shell.",
    risk: "high",
  },
  network: {
    label: "Network access",
    description: "Make outbound network requests.",
    risk: "medium",
  },
  env: {
    label: "Access environment variables",
    description: "Read process environment variables.",
    risk: "high",
  },
  browser: {
    label: "Access browser",
    description: "Control a browser session.",
    risk: "medium",
  },
  gitHistory: {
    label: "Access git history",
    description: "Read commit history and diffs.",
    risk: "low",
  },
  secrets: {
    label: "Access secrets",
    description: "Read configured secrets and tokens.",
    risk: "high",
  },
};

export const PERMISSION_KEYS = Object.keys(PERMISSION_META) as PermissionKey[];

const RISK_WEIGHT: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

/** Aggregate risk for a permissions object: the max risk of any granted perm. */
export function aggregateRisk(perms: Partial<Record<PermissionKey, boolean>>): RiskLevel {
  let max = 0;
  for (const key of PERMISSION_KEYS) {
    if (perms[key]) max = Math.max(max, RISK_WEIGHT[PERMISSION_META[key].risk]);
  }
  return (["low", "low", "medium", "high"] as RiskLevel[])[max] ?? "low";
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

// ---------------------------------------------------------------------------
// Install targets & package install paths (mock CLI concept)
// ---------------------------------------------------------------------------

export const INSTALL_PATHS: { target: string; path: string; note: string }[] = [
  { target: "Claude Code", path: ".claude/skills/[slug]", note: "Skills & agents for Claude Code" },
  { target: "Claude Desktop", path: "~/Library/Application Support/Claude/skills/[slug]", note: "Path detected per-OS by the CLI" },
  { target: "Cursor", path: ".cursor/rules/[slug].mdc", note: "Rules loaded into Cursor context" },
  { target: "MCP", path: ".mcp/[slug]", note: "Registered with any MCP-compatible client" },
  { target: "Universal", path: ".agentdock/[slug]", note: "Portable AgentDock package directory" },
];

// ---------------------------------------------------------------------------
// Sort options (Explore)
// ---------------------------------------------------------------------------

export type SortKey =
  | "trending"
  | "most-installed"
  | "newest"
  | "highest-rated"
  | "recently-updated";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "most-installed", label: "Most Installed" },
  { value: "newest", label: "Newest" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "recently-updated", label: "Recently Updated" },
];
