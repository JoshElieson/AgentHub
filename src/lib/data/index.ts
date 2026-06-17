import type {
  AgentPackage,
  Category,
  Creator,
  InstalledAgent,
  License,
  Organization,
  PackageType,
  Platform,
  Pricing,
} from "../types";
import {
  CATEGORY_LABELS,
  PACKAGE_TYPE_LABELS,
  PLATFORM_LABELS,
  type SortKey,
} from "../taxonomy";
import { agents } from "./agents";
import { creators, getCreator } from "./creators";
import { getOrganization, organizations } from "./organizations";
import { MOCK_MCP_SERVERS, type McpServerRow } from "../supabase";

export { agents, creators, organizations };
export { getCreator, getOrganization };
export { MOCK_MCP_SERVERS, type McpServerRow };
export { GRADIENTS } from "./creators";
export { ORG_GRADIENTS } from "./organizations";

// --- Single-record lookups --------------------------------------------------

const agentBySlug = new Map(agents.map((a) => [a.slug, a]));
export function getAgent(slug: string): AgentPackage | undefined {
  return agentBySlug.get(slug);
}

export function getAgentsBySlugs(slugs: string[]): AgentPackage[] {
  return slugs.map((s) => agentBySlug.get(s)).filter((a): a is AgentPackage => !!a);
}

// --- Relations --------------------------------------------------------------

export function getAgentsByCreator(username: string): AgentPackage[] {
  return agents
    .filter((a) => a.creatorUsername === username)
    .sort((a, b) => b.installCount - a.installCount);
}

export function getAgentsByOrg(slug: string): AgentPackage[] {
  return agents
    .filter((a) => a.orgSlug === slug)
    .sort((a, b) => b.installCount - a.installCount);
}



// --- Aggregate stats --------------------------------------------------------

export interface CreatorStats {
  totalAgents: number;
  totalInstalls: number;
  avgRating: number;
  totalStars: number;
}

export function getCreatorStats(username: string): CreatorStats {
  const list = getAgentsByCreator(username);
  const totalInstalls = list.reduce((s, a) => s + a.installCount, 0);
  const totalStars = list.reduce((s, a) => s + a.stars, 0);
  const rated = list.filter((a) => a.ratingCount > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, a) => s + a.ratingAvg, 0) / rated.length
      : 0;
  return { totalAgents: list.length, totalInstalls, totalStars, avgRating };
}

export function getOrgStats(slug: string): CreatorStats {
  const list = getAgentsByOrg(slug);
  const totalInstalls = list.reduce((s, a) => s + a.installCount, 0);
  const totalStars = list.reduce((s, a) => s + a.stars, 0);
  const rated = list.filter((a) => a.ratingCount > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, a) => s + a.ratingAvg, 0) / rated.length
      : 0;
  return { totalAgents: list.length, totalInstalls, totalStars, avgRating };
}

// --- Homepage stat row (derived from real data) -----------------------------

export const SITE_STATS = {
  agents: agents.length,
  creators: creators.length + organizations.length,
  installs: agents.reduce((sum, a) => sum + a.installCount, 0),
};

// --- Curated homepage sections ---------------------------------------------

export function getTrending(limit = 6): AgentPackage[] {
  return [...agents]
    .sort((a, b) => b.weeklyInstalls - a.weeklyInstalls)
    .slice(0, limit);
}

export function getTopSecurity(limit = 4): AgentPackage[] {
  return agents
    .filter((a) => a.category === "security")
    .sort((a, b) => b.installCount - a.installCount)
    .slice(0, limit);
}

/** Most-installed packages that target a given platform. */
export function getPopularForPlatform(
  platform: Platform,
  limit = 4
): AgentPackage[] {
  return agents
    .filter((a) => a.platforms.includes(platform))
    .sort((a, b) => b.installCount - a.installCount)
    .slice(0, limit);
}

/** Most-installed MCP servers (by type, then any MCP-compatible package). */
export function getMcpServers(limit = 4): AgentPackage[] {
  const servers = agents.filter((a) => a.type === "mcp-server");
  const rest = agents.filter(
    (a) => a.type !== "mcp-server" && a.platforms.includes("mcp")
  );
  return [...servers, ...rest]
    .sort((a, b) => b.installCount - a.installCount)
    .slice(0, limit);
}

/** Most-installed packages in a given category. */
export function getByCategory(
  category: Category,
  limit = 4
): AgentPackage[] {
  return agents
    .filter((a) => a.category === category)
    .sort((a, b) => b.installCount - a.installCount)
    .slice(0, limit);
}

/** Design + frontend-leaning packages for the homepage rail. */
export function getDesignAndFrontend(limit = 4): AgentPackage[] {
  const FRONTEND_TAGS = ["ui", "frontend", "react", "design", "css"];
  return agents
    .filter(
      (a) =>
        a.category === "design" ||
        (a.category === "development" &&
          a.tags.some((t) => FRONTEND_TAGS.includes(t)))
    )
    .sort((a, b) => b.installCount - a.installCount)
    .slice(0, limit);
}

export function getNewReleases(limit = 6): AgentPackage[] {
  return [...agents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, limit);
}

export function getFeatured(limit = 6): AgentPackage[] {
  const featured = agents.filter((a) => a.isFeatured);
  return featured.slice(0, limit);
}

export interface CategoryCount {
  category: Category;
  label: string;
  count: number;
  installs: number;
}

export function getCategoryCounts(): CategoryCount[] {
  const map = new Map<Category, { count: number; installs: number }>();
  for (const a of agents) {
    const cur = map.get(a.category) ?? { count: 0, installs: 0 };
    cur.count += 1;
    cur.installs += a.installCount;
    map.set(a.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count: v.count,
      installs: v.installs,
    }))
    .sort((a, b) => b.installs - a.installs);
}

// --- Search & filter --------------------------------------------------------

export interface FilterState {
  query: string;
  types: PackageType[];
  platforms: Platform[];
  categories: Category[];
  licenses: License[];
  pricing: Pricing[];
  sort: SortKey;
}

export const EMPTY_FILTERS: FilterState = {
  query: "",
  types: [],
  platforms: [],
  categories: [],
  licenses: [],
  pricing: [],
  sort: "trending",
};

function matchesQuery(a: AgentPackage, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  const creator = getCreator(a.creatorUsername);
  const haystack = [
    a.name,
    a.packageId,
    a.shortDescription,
    a.longDescription,
    a.type,
    PACKAGE_TYPE_LABELS[a.type],
    a.category,
    CATEGORY_LABELS[a.category],
    a.creatorUsername,
    creator?.name ?? "",
    a.orgSlug ?? "",
    ...a.tags,
    ...a.platforms,
    ...a.platforms.map((p) => PLATFORM_LABELS[p]),
  ]
    .join(" ")
    .toLowerCase();
  // Match all whitespace-separated terms (AND semantics).
  return needle.split(/\s+/).every((term) => haystack.includes(term));
}

function sortAgents(list: AgentPackage[], sort: SortKey): AgentPackage[] {
  const arr = [...list];
  switch (sort) {
    case "most-installed":
      return arr.sort((a, b) => b.installCount - a.installCount);
    case "newest":
      return arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "highest-rated":
      return arr.sort(
        (a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount
      );
    case "recently-updated":
      return arr.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "trending":
    default:
      return arr.sort(
        (a, b) => b.weeklyInstalls - a.weeklyInstalls || b.installCount - a.installCount
      );
  }
}

/** Pure, deterministic filter+sort — used by the client Explore page. */
export function filterAgents(state: FilterState, source: AgentPackage[] = agents): AgentPackage[] {
  const filtered = source.filter((a) => {
    if (!matchesQuery(a, state.query)) return false;
    if (state.types.length && !state.types.includes(a.type)) return false;
    if (
      state.platforms.length &&
      !state.platforms.some((p) => a.platforms.includes(p))
    )
      return false;
    if (state.categories.length && !state.categories.includes(a.category))
      return false;
    if (state.licenses.length && !state.licenses.includes(a.license))
      return false;
    if (state.pricing.length && !state.pricing.includes(a.pricing)) return false;
    return true;
  });
  return sortAgents(filtered, state.sort);
}

/** Lightweight search used by the global command/search bar. */
export function searchAgents(query: string, limit = 8): AgentPackage[] {
  if (!query.trim()) return [];
  return agents.filter((a) => matchesQuery(a, query)).slice(0, limit);
}

// --- Mock "current user" / dashboard state ----------------------------------

export const CURRENT_USERNAME = "marcus-dev";

export function getCurrentUser(): Creator {
  return getCreator(CURRENT_USERNAME)!;
}

export const installedAgents: InstalledAgent[] = [
  {
    slug: "security-review",
    installedVersion: "2.1.0",
    target: "claude-code",
    installedAt: "2026-05-29T00:00:00.000Z",
    hasUpdate: false,
  },
  {
    slug: "react-refactor-rules",
    installedVersion: "3.1.0",
    target: "cursor",
    installedAt: "2026-04-02T00:00:00.000Z",
    hasUpdate: true,
  },
  {
    slug: "mcp-filesystem-server",
    installedVersion: "1.7.2",
    target: "claude-desktop",
    installedAt: "2026-03-16T00:00:00.000Z",
    hasUpdate: true,
  },
  {
    slug: "test-generator-agent",
    installedVersion: "2.5.0",
    target: "claude-code",
    installedAt: "2026-06-01T00:00:00.000Z",
    hasUpdate: false,
  },
];

export function getInstalledAgents(): { install: InstalledAgent; agent: AgentPackage }[] {
  return installedAgents
    .map((install) => ({ install, agent: getAgent(install.slug)! }))
    .filter((x) => x.agent);
}

export const favoriteSlugs: string[] = [
  "mcp-filesystem-server",
  "impeccable-ui-reviewer",
  "prompt-injection-tester",
  "sql-optimizer-agent",
];

export function getFavoriteAgents(): AgentPackage[] {
  return getAgentsBySlugs(favoriteSlugs);
}

export function getMyAgents(): AgentPackage[] {
  return getAgentsByCreator(CURRENT_USERNAME);
}

// --- Dashboard activity feed (mock) -----------------------------------------

export interface ActivityItem {
  id: string;
  kind: "install" | "review" | "version" | "star" | "follow";
  text: string;
  agentSlug?: string;
  createdAt: string;
}

export const activityFeed: ActivityItem[] = [
  {
    id: "act-1",
    kind: "version",
    text: "You published test-generator-agent v2.5.0",
    agentSlug: "test-generator-agent",
    createdAt: "2026-05-30T00:00:00.000Z",
  },
  {
    id: "act-2",
    kind: "review",
    text: "qa_lead left a 5★ review on Test Generator Agent",
    agentSlug: "test-generator-agent",
    createdAt: "2026-06-02T00:00:00.000Z",
  },
  {
    id: "act-3",
    kind: "install",
    text: "Replit App Builder Agent passed 27k installs",
    agentSlug: "replit-app-builder",
    createdAt: "2026-06-05T00:00:00.000Z",
  },
  {
    id: "act-4",
    kind: "star",
    text: "founder_v starred Browser Automation Agent",
    agentSlug: "browser-automation-agent",
    createdAt: "2026-06-08T00:00:00.000Z",
  },
  {
    id: "act-5",
    kind: "follow",
    text: "12 new followers this week",
    createdAt: "2026-06-10T00:00:00.000Z",
  },
];
