import type { Collection } from "../types";
import { GRADIENTS } from "./creators";

export const collections: Collection[] = [
  {
    slug: "best-security-toolkit",
    name: "Best Security Toolkit",
    description:
      "Everything you need to ship secure code and secure agents: PR reviews, full OWASP audits, and prompt-injection red-teaming.",
    coverColor: GRADIENTS.violet,
    curatorUsername: "ana-li",
    agentSlugs: ["security-review", "owasp-audit", "prompt-injection-tester"],
    followers: 8240,
    isOfficial: true,
    updatedAt: "2026-06-09T00:00:00.000Z",
  },
  {
    slug: "frontend-design-stack",
    name: "Frontend & Design Stack",
    description:
      "Ship polished UI faster: review designs, steer React edits with Cursor rules, and generate the tests.",
    coverColor: GRADIENTS.fuchsia,
    curatorUsername: "lina-code",
    agentSlugs: [
      "impeccable-ui-reviewer",
      "react-refactor-rules",
      "test-generator-agent",
    ],
    followers: 6120,
    updatedAt: "2026-06-04T00:00:00.000Z",
  },
  {
    slug: "mcp-integrations-pack",
    name: "MCP Integrations Pack",
    description:
      "Connect your agents to the real world over the Model Context Protocol: filesystem and Supabase, ready for any MCP client.",
    coverColor: GRADIENTS.teal,
    curatorUsername: "kenji",
    agentSlugs: ["mcp-filesystem-server", "supabase-integration-mcp"],
    followers: 4810,
    isOfficial: true,
    updatedAt: "2026-06-06T00:00:00.000Z",
  },
  {
    slug: "cross-platform-essentials",
    name: "Cross-Platform Essentials",
    description:
      "One registry, every tool: a Gemini research workflow, a Copilot review pack, and a browser automation agent.",
    coverColor: GRADIENTS.amber,
    curatorUsername: "nadia-q",
    agentSlugs: [
      "gemini-research-workflow",
      "github-copilot-review",
      "browser-automation-agent",
    ],
    followers: 3990,
    updatedAt: "2026-06-03T00:00:00.000Z",
  },
  {
    slug: "data-and-backend-kit",
    name: "Data & Backend Kit",
    description:
      "Ship a reliable backend: optimize the slow queries, wire up Supabase, and plan the release.",
    coverColor: GRADIENTS.lime,
    curatorUsername: "devon-ops",
    agentSlugs: [
      "sql-optimizer-agent",
      "supabase-integration-mcp",
      "devops-release-planner",
    ],
    followers: 4790,
    updatedAt: "2026-06-06T00:00:00.000Z",
  },
  {
    slug: "claude-code-power-pack",
    name: "Claude Code Power Pack",
    description:
      "The packages we run on every Claude Code session: security review, tests, docs, and scoped file access.",
    coverColor: GRADIENTS.indigo,
    curatorUsername: "marcus-dev",
    agentSlugs: [
      "security-review",
      "test-generator-agent",
      "docs-writer-pack",
      "mcp-filesystem-server",
    ],
    followers: 7180,
    updatedAt: "2026-06-05T00:00:00.000Z",
  },
];

const bySlug = new Map(collections.map((c) => [c.slug, c]));

export function getCollection(slug: string): Collection | undefined {
  return bySlug.get(slug);
}
