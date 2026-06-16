"use client";

import { useEffect, useState } from "react";
import {
  supabase,
  MOCK_SKILLS,
  MOCK_MCP_SERVERS,
  type SkillRow,
  type McpServerRow,
} from "./supabase";
import { classifySkill, classifyMcp } from "./skill-classification";

export type { SkillRow, McpServerRow };

// ---------------------------------------------------------------------------
// Normalizers — Supabase / API rows arrive loosely typed; coerce defensively.
// ---------------------------------------------------------------------------

function normalizeSkill(row: any): SkillRow {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const { category, model } = classifySkill({
    name: row.name,
    description: row.description,
    tags,
    category: row.category,
    model: row.model,
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    trigger_phrases: Array.isArray(row.trigger_phrases) ? row.trigger_phrases : [],
    markdown_instructions: row.markdown_instructions ?? "",
    script_urls: Array.isArray(row.script_urls) ? row.script_urls : [],
    tags,
    source_url: row.source_url ?? null,
    created_at: row.created_at,
    star_count: row.star_count ?? 0,
    export_count: row.export_count ?? 0,
    avg_rating: row.avg_rating ? Number(row.avg_rating) : 0,
    rating_count: row.rating_count ?? 0,
    category,
    model,
  };
}

function normalizeMcp(row: any): McpServerRow {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const { category, model } = classifyMcp({
    name: row.name,
    description: row.description,
    tags,
    category: row.category,
    model: row.model,
  });
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    github_url: row.github_url ?? null,
    command: row.command ?? "",
    args: Array.isArray(row.args) ? row.args : [],
    env_vars: row.env_vars ?? {},
    tags,
    created_at: row.created_at,
    star_count: row.star_count ?? 0,
    export_count: row.export_count ?? 0,
    avg_rating: row.avg_rating ? Number(row.avg_rating) : 0,
    rating_count: row.rating_count ?? 0,
    category,
    model,
  };
}

// ---------------------------------------------------------------------------
// Fetchers — same real sources the /marketplace views use, with mock fallback.
// ---------------------------------------------------------------------------

/**
 * Load every skill from the marketplace. Uses the same `/api/skills/search`
 * listing endpoint the Marketplace page relies on; when Supabase isn't
 * configured (API returns 503) we fall back to the mock catalogue.
 */
export async function fetchSkills(): Promise<SkillRow[]> {
  try {
    const res = await fetch(`/api/skills/search?limit=1000`);
    if (res.ok) {
      const { results } = await res.json();
      // When the API answers, it is the source of truth — even if empty.
      return (results ?? []).map(normalizeSkill);
    }
  } catch {
    // network error — fall through to direct query / mock
  }

  if (supabase) {
    try {
      const { data } = await supabase
        .from("skills")
        .select(
          "id, name, description, tags, trigger_phrases, source_url, script_urls, created_at, star_count, export_count, avg_rating, rating_count"
        )
        .order("name", { ascending: true });
      if (data && data.length > 0) return data.map(normalizeSkill);
    } catch {
      // ignore — fall through to mock
    }
  }

  return MOCK_SKILLS.map(normalizeSkill);
}

/**
 * Load every MCP server from the marketplace. Mirrors the MCP Marketplace
 * view: direct Supabase query with a mock fallback.
 */
export async function fetchMcpServers(): Promise<McpServerRow[]> {
  if (supabase) {
    try {
      const { data } = await supabase
        .from("mcp_servers")
        .select("*")
        .order("name", { ascending: true });
      if (data && data.length > 0) return data.map(normalizeMcp);
    } catch {
      // ignore — fall through to mock
    }
  }
  return MOCK_MCP_SERVERS.map(normalizeMcp);
}

// ---------------------------------------------------------------------------
// Hook — load skills + MCP servers together for a client surface.
// ---------------------------------------------------------------------------

export interface MarketplaceData {
  skills: SkillRow[];
  mcpServers: McpServerRow[];
  loading: boolean;
}

export function useMarketplaceData(): MarketplaceData {
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, m] = await Promise.all([fetchSkills(), fetchMcpServers()]);
      if (cancelled) return;
      setSkills(s);
      setMcpServers(m);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { skills, mcpServers, loading };
}

// ---------------------------------------------------------------------------
// "Official" detection — first-party packages get a verified checkmark.
// A package is official when it is explicitly tagged "official" (used by the
// seeded MCP servers) OR its source repo is owned by a known vendor org.
// ---------------------------------------------------------------------------

const OFFICIAL_OWNERS = new Set([
  "anthropics",
  "anthropic",
  "modelcontextprotocol",
  "openai",
  "google",
  "googleapis",
  "google-gemini",
  "microsoft",
  "github",
  "stripe",
  "cloudflare",
  "huggingface",
  "vercel",
  "vercel-labs",
  "supabase",
  "hashicorp",
  "mongodb",
  "elastic",
  "redis",
  "aws",
  "awslabs",
  "amazon",
  "atlassian",
  "notionhq",
  "slackapi",
  "figma",
  "netlify",
  "prisma",
  "docker",
  "gitlab",
  "sentry",
  "grafana",
]);

function githubOwner(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** Whether a skill or MCP server is a first-party / official package. */
export function isOfficial(item: {
  tags?: string[];
  source_url?: string | null;
  github_url?: string | null;
}): boolean {
  if ((item.tags ?? []).some((t) => t.toLowerCase() === "official")) return true;
  const owner = githubOwner(item.source_url ?? item.github_url);
  return owner != null && OFFICIAL_OWNERS.has(owner);
}

// ---------------------------------------------------------------------------
// Sorting helpers shared by Explore + Home.
// ---------------------------------------------------------------------------

export type MarketplaceSort = "relevance" | "newest" | "rating" | "stars" | "exports";

export function sortByExports<T extends { export_count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.export_count ?? 0) - (a.export_count ?? 0));
}

export function sortByNewest<T extends { created_at: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
