import type { Collection } from "../types";
import { GRADIENTS } from "./creators";
import { ORG_GRADIENTS } from "./organizations";

export const collections: Collection[] = [
  // ── Skill Collections ──────────────────────────────────────────────────
  {
    slug: "anthropic-skills",
    name: "Anthropic Skills",
    description:
      "The official collection of skills released by Anthropic — prompt packs and developer tooling for the Claude ecosystem. Install them all with one click.",
    coverColor: ORG_GRADIENTS.anthropic,
    curatorUsername: "kenji",
    orgSlug: "anthropic",
    kind: "skills",
    agentSlugs: ["mcp-filesystem-server", "docs-writer-pack"],
    followers: 12400,
    isOfficial: true,
    updatedAt: "2026-06-12T00:00:00.000Z",
  },

  // ── MCP Collections ────────────────────────────────────────────────────
  {
    slug: "essential-mcp-servers",
    name: "Essential MCP Servers",
    description:
      "The foundational MCP servers every developer should have — GitHub, filesystem, database, and web search. One config block to rule them all.",
    coverColor: GRADIENTS.teal,
    curatorUsername: "kenji",
    kind: "mcps",
    mcpServerIds: [
      "m1a2c3d4-e5f6-7890-abcd-111111111111", // github-mcp
      "m1a2c3d4-e5f6-7890-abcd-444444444444", // filesystem-mcp
      "m1a2c3d4-e5f6-7890-abcd-555555555555", // postgres-mcp
      "m1a2c3d4-e5f6-7890-abcd-666666666666", // brave-search-mcp
    ],
    followers: 6200,
    isOfficial: true,
    updatedAt: "2026-06-14T00:00:00.000Z",
  },
  {
    slug: "productivity-mcp-pack",
    name: "Productivity MCP Pack",
    description:
      "Connect your agent to the tools you use every day — Google Drive for documents, Slack for communication, and GitHub for code.",
    coverColor: GRADIENTS.amber,
    curatorUsername: "nadia-q",
    kind: "mcps",
    mcpServerIds: [
      "m1a2c3d4-e5f6-7890-abcd-111111111111", // github-mcp
      "m1a2c3d4-e5f6-7890-abcd-222222222222", // google-drive-mcp
      "m1a2c3d4-e5f6-7890-abcd-333333333333", // slack-mcp
    ],
    followers: 3400,
    updatedAt: "2026-06-13T00:00:00.000Z",
  },
];

const bySlug = new Map(collections.map((c) => [c.slug, c]));

export function getCollection(slug: string): Collection | undefined {
  return bySlug.get(slug);
}
