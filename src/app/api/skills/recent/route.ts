import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

/** Homepage "Newly Uploaded" gate: must have a rating, ≥10 likes, ≥50 installs. */
const MIN_LIKES = 10;
const MIN_INSTALLS = 50;

function passesHomepageGate(row: {
  star_count?: number | null;
  export_count?: number | null;
  avg_rating?: number | null;
  rating_count?: number | null;
}) {
  return (
    (row.rating_count ?? 0) >= 1 &&
    (row.avg_rating ?? 0) > 0 &&
    (row.star_count ?? 0) >= MIN_LIKES &&
    (row.export_count ?? 0) >= MIN_INSTALLS
  );
}

/**
 * GET /api/skills/recent
 * Returns the 15 most recently created skills and MCP servers that pass the
 * homepage quality gate, merged and sorted by created_at descending.
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  try {
    // Over-fetch then filter — gate may exclude many brand-new zero-engagement rows.
    const [skillsRes, mcpRes] = await Promise.all([
      supabase
        .from("skills")
        .select(
          "id, name, description, tags, trigger_phrases, source_url, created_at, star_count, export_count, avg_rating, rating_count, category, model"
        )
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("mcp_servers")
        .select(
          "id, name, description, tags, github_url, created_at, star_count, export_count, avg_rating, rating_count, category, model"
        )
        .not("tags", "cs", "{catalog-trimmed}")
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    if (skillsRes.error) throw skillsRes.error;
    if (mcpRes.error) throw mcpRes.error;

    const skills = (skillsRes.data ?? [])
      .filter(passesHomepageGate)
      .map((s) => ({
        ...s,
        kind: "skill" as const,
        source_url: s.source_url ?? null,
      }));

    const mcps = (mcpRes.data ?? [])
      .filter(passesHomepageGate)
      .map((m) => ({
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
