import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

/**
 * GET /api/skills/recent
 * Returns the 15 most recently created skills and MCP servers, merged and
 * sorted by created_at descending. Each item carries a `kind` field so the
 * client can render the right card type.
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  try {
    // Fetch recent skills and MCP servers in parallel
    const [skillsRes, mcpRes] = await Promise.all([
      supabase
        .from("skills")
        .select(
          "id, name, description, tags, trigger_phrases, source_url, created_at, star_count, export_count, avg_rating, rating_count"
        )
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("mcp_servers")
        .select(
          "id, name, description, tags, github_url, created_at, star_count, export_count, avg_rating, rating_count"
        )
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    if (skillsRes.error) throw skillsRes.error;
    if (mcpRes.error) throw mcpRes.error;

    // Tag each item with its kind, then merge and sort by created_at desc
    const skills = (skillsRes.data ?? []).map((s) => ({
      ...s,
      kind: "skill" as const,
      source_url: s.source_url ?? null,
    }));

    const mcps = (mcpRes.data ?? []).map((m) => ({
      ...m,
      kind: "mcp" as const,
      source_url: m.github_url ?? null,
      trigger_phrases: [] as string[],
    }));

    const merged = [...skills, ...mcps]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 15);

    return NextResponse.json({ items: merged });
  } catch (err) {
    console.error("GET /api/skills/recent error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recent items" },
      { status: 500 }
    );
  }
}
