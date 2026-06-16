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
 * GET /api/skills/starred?anonId=...
 * Fetch all starred skills and MCP servers for a given anonymous user.
 * Returns { skills: SkillRow[], mcpServers: McpServerRow[] }.
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
    // Fetch starred skill IDs
    const { data: starredSkills, error: skillStarError } = await supabase
      .from("skill_stars")
      .select("skill_id")
      .eq("anon_id", anonId);

    if (skillStarError) throw skillStarError;

    // Fetch starred MCP server IDs
    const { data: starredMcps, error: mcpStarError } = await supabase
      .from("mcp_stars")
      .select("server_id")
      .eq("anon_id", anonId);

    if (mcpStarError) throw mcpStarError;

    const skillIds = (starredSkills ?? []).map((s) => s.skill_id);
    const mcpIds = (starredMcps ?? []).map((m) => m.server_id);

    // Fetch full skill data for starred skills
    let skills: any[] = [];
    if (skillIds.length > 0) {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, description, tags, source_url, created_at, star_count, export_count, avg_rating, rating_count")
        .in("id", skillIds);
      if (error) throw error;
      skills = data ?? [];
    }

    // Fetch full MCP server data for starred servers
    let mcpServers: any[] = [];
    if (mcpIds.length > 0) {
      const { data, error } = await supabase
        .from("mcp_servers")
        .select("id, name, description, tags, github_url, command, args, env_vars, created_at, star_count, export_count, avg_rating, rating_count")
        .in("id", mcpIds);
      if (error) throw error;
      mcpServers = data ?? [];
    }

    return NextResponse.json({ skills, mcpServers });
  } catch (err: any) {
    console.error("Fetch starred items error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
