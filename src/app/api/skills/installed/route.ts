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
 * GET /api/skills/installed?anonId=...
 * Every skill and MCP server the anonymous user has installed, each annotated
 * with its install metadata (target, installed_at, install_count). Powers the
 * dashboard Installed tab. Returns { skills: [...], mcpServers: [...] }.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ skills: [], mcpServers: [] });
  }

  const { searchParams } = new URL(req.url);
  const anonId = searchParams.get("anonId");

  if (!anonId) {
    return NextResponse.json({ skills: [], mcpServers: [] });
  }

  try {
    // Install records (carry the per-user metadata we surface in the UI).
    const { data: skillInstalls, error: skillInstallErr } = await supabase
      .from("skill_installs")
      .select("skill_id, target, install_count, first_installed_at, installed_at")
      .eq("anon_id", anonId);
    if (skillInstallErr) throw skillInstallErr;

    const { data: mcpInstalls, error: mcpInstallErr } = await supabase
      .from("mcp_installs")
      .select("server_id, target, install_count, first_installed_at, installed_at")
      .eq("anon_id", anonId);
    if (mcpInstallErr) throw mcpInstallErr;

    const skillMeta = new Map(
      (skillInstalls ?? []).map((r) => [r.skill_id, r])
    );
    const mcpMeta = new Map(
      (mcpInstalls ?? []).map((r) => [r.server_id, r])
    );

    const skillIds = [...skillMeta.keys()];
    const mcpIds = [...mcpMeta.keys()];

    let skills: any[] = [];
    if (skillIds.length > 0) {
      const { data, error } = await supabase
        .from("skills")
        .select(
          "id, name, description, tags, source_url, created_at, star_count, export_count, avg_rating, rating_count"
        )
        .in("id", skillIds);
      if (error) throw error;
      skills = (data ?? []).map((s) => {
        const m = skillMeta.get(s.id);
        return {
          ...s,
          install_target: m?.target ?? null,
          install_count: m?.install_count ?? 0,
          first_installed_at: m?.first_installed_at ?? null,
          installed_at: m?.installed_at ?? null,
        };
      });
    }

    let mcpServers: any[] = [];
    if (mcpIds.length > 0) {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select(
          "id, name, description, tags, github_url, command, args, env_vars, created_at, star_count, export_count, avg_rating, rating_count"
        )
        .in("id", mcpIds);
      if (error) throw error;
      mcpServers = (data ?? []).map((s) => {
        const m = mcpMeta.get(s.id);
        return {
          ...s,
          install_target: m?.target ?? null,
          install_count: m?.install_count ?? 0,
          first_installed_at: m?.first_installed_at ?? null,
          installed_at: m?.installed_at ?? null,
        };
      });
    }

    // Most-recently installed first.
    const byRecency = (a: any, b: any) =>
      new Date(b.installed_at ?? 0).getTime() -
      new Date(a.installed_at ?? 0).getTime();
    skills.sort(byRecency);
    mcpServers.sort(byRecency);

    return NextResponse.json({ skills, mcpServers });
  } catch (err: any) {
    console.error("Fetch installed items error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
