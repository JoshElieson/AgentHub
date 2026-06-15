import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

/**
 * POST /api/skills/star
 * Toggle star: insert if not exists, delete if already starred.
 * Returns the new starred state and updated star_count.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { skillId, anonId } = body as { skillId?: string; anonId?: string };

  if (!skillId || !anonId) {
    return NextResponse.json(
      { error: "skillId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    // Check if already starred
    const { data: existing } = await supabase
      .from("skill_stars")
      .select("skill_id")
      .eq("skill_id", skillId)
      .eq("anon_id", anonId)
      .maybeSingle();

    let starred: boolean;

    if (existing) {
      // Remove star
      const { error } = await supabase
        .from("skill_stars")
        .delete()
        .eq("skill_id", skillId)
        .eq("anon_id", anonId);
      if (error) throw error;
      starred = false;
    } else {
      // Add star
      const { error } = await supabase
        .from("skill_stars")
        .insert({ skill_id: skillId, anon_id: anonId });
      if (error) throw error;
      starred = true;
    }

    // Recalculate star_count
    const { count, error: countError } = await supabase
      .from("skill_stars")
      .select("*", { count: "exact", head: true })
      .eq("skill_id", skillId);

    if (countError) throw countError;

    const newCount = count ?? 0;

    const { error: updateError } = await supabase
      .from("skills")
      .update({ star_count: newCount })
      .eq("id", skillId);

    if (updateError) throw updateError;

    return NextResponse.json({ starred, star_count: newCount });
  } catch (err: any) {
    console.error("Star toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/skills/star?skillId=...&anonId=...
 * Check if the current anonymous user has starred a skill.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ starred: false });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const anonId = searchParams.get("anonId");

  if (!skillId || !anonId) {
    return NextResponse.json({ starred: false });
  }

  const { data } = await supabase
    .from("skill_stars")
    .select("skill_id")
    .eq("skill_id", skillId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ starred: !!data });
}
