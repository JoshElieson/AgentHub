import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

// ---------------------------------------------------------------------------
// The first page of "Trending Now" is hand-curated for recognisability.
// Skills are matched case-insensitively against the name column. Order
// matters — the first 5 (PER_PAGE) will appear on page 1 of the carousel.
// ---------------------------------------------------------------------------

const PINNED_NAMES = [
  "stripe-best-practices",
  "cloudflare-workers-best-practices",
  "firebase-basics",
  "mcp-builder",
];

/**
 * GET /api/skills/trending
 * Returns skills ordered for the home-page "Trending Now" carousel.
 * The first page contains the curated recognisable-brand skills (pinned);
 * remaining pages are filled by star_count descending.
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json({ skills: [] }, { status: 200 });
  }

  try {
    // Fetch all skills (lightweight columns only)
    const { data, error } = await supabase
      .from("skills")
      .select(
        "id, name, description, tags, trigger_phrases, source_url, created_at, star_count, export_count, avg_rating, rating_count"
      )
      .order("star_count", { ascending: false })
      .limit(500);

    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ skills: [] });
    }

    // Partition into pinned (order-preserving) and the rest
    const pinnedMap = new Map<string, number>();
    PINNED_NAMES.forEach((n, i) => pinnedMap.set(n.toLowerCase(), i));

    const pinned: (typeof data)[number][] = new Array(PINNED_NAMES.length);
    const rest: (typeof data)[number][] = [];

    for (const skill of data) {
      const idx = pinnedMap.get(skill.name?.toLowerCase());
      if (idx !== undefined && !pinned[idx]) {
        pinned[idx] = skill;
      } else {
        rest.push(skill);
      }
    }

    // Remove any unfilled slots (skill not in DB yet)
    const ordered = [...pinned.filter(Boolean), ...rest];

    return NextResponse.json({ skills: ordered });
  } catch (err) {
    console.error("GET /api/skills/trending error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trending skills" },
      { status: 500 }
    );
  }
}
