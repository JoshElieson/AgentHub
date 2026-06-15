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
 * POST /api/skills/rate
 * Upsert a rating and recalculate the skill's aggregate avg_rating / rating_count.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { skillId, anonId, rating } = body as {
    skillId?: string;
    anonId?: string;
    rating?: number;
  };

  if (!skillId || !anonId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "skillId, anonId, and rating (1-5) are required" },
      { status: 400 }
    );
  }

  try {
    // Upsert the individual rating
    const { error: upsertError } = await supabase
      .from("skill_ratings")
      .upsert(
        { skill_id: skillId, anon_id: anonId, rating },
        { onConflict: "skill_id,anon_id" }
      );

    if (upsertError) throw upsertError;

    // Recalculate aggregates
    const { data: agg, error: aggError } = await supabase
      .from("skill_ratings")
      .select("rating")
      .eq("skill_id", skillId);

    if (aggError) throw aggError;

    const ratings = (agg || []).map((r: any) => r.rating as number);
    const avg = ratings.length > 0
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : 0;

    const { error: updateError } = await supabase
      .from("skills")
      .update({
        avg_rating: Math.round(avg * 100) / 100,
        rating_count: ratings.length,
      })
      .eq("id", skillId);

    if (updateError) throw updateError;

    return NextResponse.json({
      avg_rating: Math.round(avg * 100) / 100,
      rating_count: ratings.length,
      user_rating: rating,
    });
  } catch (err: any) {
    console.error("Rating error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/skills/rate?skillId=...&anonId=...
 * Get the current user's rating for a skill.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ user_rating: null });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const anonId = searchParams.get("anonId");

  if (!skillId || !anonId) {
    return NextResponse.json({ user_rating: null });
  }

  const { data } = await supabase
    .from("skill_ratings")
    .select("rating")
    .eq("skill_id", skillId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ user_rating: data?.rating ?? null });
}
