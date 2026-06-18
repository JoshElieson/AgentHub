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
 * POST /api/skills/save
 * Toggle a personal bookmark: insert if not saved, delete if already saved.
 * Saved skills surface in the Dashboard "Saved" tab. This is a private,
 * per-user list — it has no public count (unlike the thumbs-up / like counter).
 * Returns the new saved state.
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
    // Check if already saved
    const { data: existing } = await supabase
      .from("skill_saves")
      .select("skill_id")
      .eq("skill_id", skillId)
      .eq("anon_id", anonId)
      .maybeSingle();

    let saved: boolean;

    if (existing) {
      const { error } = await supabase
        .from("skill_saves")
        .delete()
        .eq("skill_id", skillId)
        .eq("anon_id", anonId);
      if (error) throw error;
      saved = false;
    } else {
      const { error } = await supabase
        .from("skill_saves")
        .insert({ skill_id: skillId, anon_id: anonId });
      if (error) throw error;
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (err: any) {
    console.error("Skill save toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/skills/save?skillId=...&anonId=...
 * Check if the current anonymous user has saved a skill.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ saved: false });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const anonId = searchParams.get("anonId");

  if (!skillId || !anonId) {
    return NextResponse.json({ saved: false });
  }

  const { data } = await supabase
    .from("skill_saves")
    .select("skill_id")
    .eq("skill_id", skillId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ saved: !!data });
}
