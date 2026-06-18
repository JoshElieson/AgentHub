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
 * GET /api/skills/saved?anonId=...
 * Fetch all saved (bookmarked) skills, MCP servers, and bundles (collections)
 * for a given anonymous user. Powers the Dashboard "Saved" tab.
 * Returns { skills: SkillRow[], mcpServers: McpServerRow[], collections: [] }.
 *
 * Each save-table read is isolated so that a not-yet-applied migration (e.g.
 * collection_saves missing) degrades gracefully to an empty list for that
 * section instead of failing the whole Saved tab.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ skills: [], mcpServers: [], collections: [] });
  }

  const { searchParams } = new URL(req.url);
  const anonId = searchParams.get("anonId");

  if (!anonId) {
    return NextResponse.json({ skills: [], mcpServers: [], collections: [] });
  }

  // Saved skills ------------------------------------------------------------
  let skills: any[] = [];
  try {
    const { data: savedSkills } = await supabase
      .from("skill_saves")
      .select("skill_id")
      .eq("anon_id", anonId);
    const skillIds = (savedSkills ?? []).map((s) => s.skill_id);
    if (skillIds.length > 0) {
      const { data } = await supabase
        .from("skills")
        .select("id, name, description, tags, source_url, created_at, star_count, export_count, avg_rating, rating_count")
        .in("id", skillIds);
      skills = data ?? [];
    }
  } catch (err) {
    console.error("Fetch saved skills error:", err);
  }

  // Saved MCP servers -------------------------------------------------------
  let mcpServers: any[] = [];
  try {
    const { data: savedMcps } = await supabase
      .from("mcp_saves")
      .select("server_id")
      .eq("anon_id", anonId);
    const mcpIds = (savedMcps ?? []).map((m) => m.server_id);
    if (mcpIds.length > 0) {
      const { data } = await supabase
        .from("mcp_servers")
        .select("id, name, description, tags, github_url, command, args, env_vars, created_at, star_count, export_count, avg_rating, rating_count")
        .in("id", mcpIds);
      mcpServers = data ?? [];
    }
  } catch (err) {
    console.error("Fetch saved MCP servers error:", err);
  }

  // Saved bundles (collections) --------------------------------------------
  let collections: any[] = [];
  try {
    const { data: savedCollections } = await supabase
      .from("collection_saves")
      .select("collection_id")
      .eq("anon_id", anonId);
    const collectionIds = (savedCollections ?? []).map((c) => c.collection_id);
    if (collectionIds.length > 0) {
      const { data } = await supabase
        .from("collections")
        .select("id, name, description, kind, cover_color, anon_id, is_public, created_at, updated_at")
        .in("id", collectionIds);
      // Attach an item_count to each bundle so cards can show its size.
      collections = await Promise.all(
        (data ?? []).map(async (c: any) => {
          const { count } = await supabase!
            .from("collection_items")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", c.id);
          return { ...c, item_count: count ?? 0 };
        })
      );
    }
  } catch (err) {
    console.error("Fetch saved bundles error:", err);
  }

  return NextResponse.json({ skills, mcpServers, collections });
}
