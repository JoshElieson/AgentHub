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
 * POST /api/skills/track-export
 * Fire-and-forget endpoint to increment a skill's export count.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ ok: true }); // Silently succeed in mock mode
  }

  const body = await req.json();
  const { skillId } = body as { skillId?: string };

  if (!skillId) {
    return NextResponse.json({ error: "skillId is required" }, { status: 400 });
  }

  try {
    // Fetch current count, increment
    const { data: skill, error: fetchError } = await supabase
      .from("skills")
      .select("export_count")
      .eq("id", skillId)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (skill?.export_count ?? 0) + 1;

    const { error: updateError } = await supabase
      .from("skills")
      .update({ export_count: newCount })
      .eq("id", skillId);

    if (updateError) throw updateError;

    return NextResponse.json({ export_count: newCount });
  } catch (err: any) {
    console.error("Export tracking error:", err);
    // Don't fail the user's export — return success anyway
    return NextResponse.json({ ok: true });
  }
}
