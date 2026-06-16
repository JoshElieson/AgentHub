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
 * POST /api/skills/install
 * Record that the current anonymous user installed a skill into a workspace.
 * This is durable per-user state (separate from the global export_count): it
 * powers the "you've installed this before" badge and the dashboard Installed
 * list. Re-installing keeps a single row, bumping install_count and refreshing
 * installed_at / target. Body: { skillId, anonId, target? }.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    // No DB — pretend it worked so the user's export flow isn't blocked.
    return NextResponse.json({ installed: true, install_count: 1 });
  }

  const body = await req.json();
  const { skillId, anonId, target } = body as {
    skillId?: string;
    anonId?: string;
    target?: string;
  };

  if (!skillId || !anonId) {
    return NextResponse.json(
      { error: "skillId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    const { data: existing } = await supabase
      .from("skill_installs")
      .select("install_count, first_installed_at")
      .eq("skill_id", skillId)
      .eq("anon_id", anonId)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (existing) {
      const newCount = (existing.install_count ?? 1) + 1;
      const { error } = await supabase
        .from("skill_installs")
        .update({
          install_count: newCount,
          installed_at: nowIso,
          target: target ?? "unknown",
        })
        .eq("skill_id", skillId)
        .eq("anon_id", anonId);
      if (error) throw error;
      return NextResponse.json({
        installed: true,
        install_count: newCount,
        first_installed_at: existing.first_installed_at,
        installed_at: nowIso,
      });
    }

    const { error } = await supabase.from("skill_installs").insert({
      skill_id: skillId,
      anon_id: anonId,
      target: target ?? "unknown",
      install_count: 1,
      first_installed_at: nowIso,
      installed_at: nowIso,
    });
    if (error) throw error;

    return NextResponse.json({
      installed: true,
      install_count: 1,
      first_installed_at: nowIso,
      installed_at: nowIso,
    });
  } catch (err: any) {
    console.error("Skill install error:", err);
    // Never block the export — report soft success.
    return NextResponse.json({ installed: true, install_count: 1 });
  }
}

/**
 * GET /api/skills/install?skillId=...&anonId=...
 * Whether the current anonymous user has installed a skill before.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ installed: false });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const anonId = searchParams.get("anonId");

  if (!skillId || !anonId) {
    return NextResponse.json({ installed: false });
  }

  const { data } = await supabase
    .from("skill_installs")
    .select("target, install_count, first_installed_at, installed_at")
    .eq("skill_id", skillId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({
    installed: !!data,
    target: data?.target ?? null,
    install_count: data?.install_count ?? 0,
    first_installed_at: data?.first_installed_at ?? null,
    installed_at: data?.installed_at ?? null,
  });
}

/**
 * DELETE /api/skills/install?skillId=...&anonId=...
 * Remove an install record (the dashboard "Uninstall" action).
 */
export async function DELETE(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ installed: false });
  }

  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("skillId");
  const anonId = searchParams.get("anonId");

  if (!skillId || !anonId) {
    return NextResponse.json(
      { error: "skillId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("skill_installs")
      .delete()
      .eq("skill_id", skillId)
      .eq("anon_id", anonId);
    if (error) throw error;
    return NextResponse.json({ installed: false });
  } catch (err: any) {
    console.error("Skill uninstall error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
