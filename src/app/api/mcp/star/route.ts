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
 * POST /api/mcp/star
 * Toggle star on an MCP server: insert if not exists, delete if already starred.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { serverId, anonId } = body as { serverId?: string; anonId?: string };

  if (!serverId || !anonId) {
    return NextResponse.json(
      { error: "serverId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    // Check if already starred
    const { data: existing } = await supabase
      .from("mcp_stars")
      .select("server_id")
      .eq("server_id", serverId)
      .eq("anon_id", anonId)
      .maybeSingle();

    let starred: boolean;

    if (existing) {
      // Remove star
      const { error } = await supabase
        .from("mcp_stars")
        .delete()
        .eq("server_id", serverId)
        .eq("anon_id", anonId);
      if (error) throw error;
      starred = false;
    } else {
      // Add star
      const { error } = await supabase
        .from("mcp_stars")
        .insert({ server_id: serverId, anon_id: anonId });
      if (error) throw error;
      starred = true;
    }

    // Recalculate star_count
    const { count, error: countError } = await supabase
      .from("mcp_stars")
      .select("*", { count: "exact", head: true })
      .eq("server_id", serverId);

    if (countError) throw countError;

    const newCount = count ?? 0;

    const { error: updateError } = await supabase
      .from("mcp_servers")
      .update({ star_count: newCount })
      .eq("id", serverId);

    if (updateError) throw updateError;

    return NextResponse.json({ starred, star_count: newCount });
  } catch (err: any) {
    console.error("MCP star toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/mcp/star?serverId=...&anonId=...
 * Check if the current anonymous user has starred an MCP server.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ starred: false });
  }

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");
  const anonId = searchParams.get("anonId");

  if (!serverId || !anonId) {
    return NextResponse.json({ starred: false });
  }

  const { data } = await supabase
    .from("mcp_stars")
    .select("server_id")
    .eq("server_id", serverId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ starred: !!data });
}
