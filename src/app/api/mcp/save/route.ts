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
 * POST /api/mcp/save
 * Toggle a personal bookmark on an MCP server: insert if not saved, delete if
 * already saved. Saved servers surface in the Dashboard "Saved" tab. Private,
 * per-user list with no public count (separate from the thumbs-up counter).
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
    // Check if already saved
    const { data: existing } = await supabase
      .from("mcp_saves")
      .select("server_id")
      .eq("server_id", serverId)
      .eq("anon_id", anonId)
      .maybeSingle();

    let saved: boolean;

    if (existing) {
      const { error } = await supabase
        .from("mcp_saves")
        .delete()
        .eq("server_id", serverId)
        .eq("anon_id", anonId);
      if (error) throw error;
      saved = false;
    } else {
      const { error } = await supabase
        .from("mcp_saves")
        .insert({ server_id: serverId, anon_id: anonId });
      if (error) throw error;
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (err: any) {
    console.error("MCP save toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/mcp/save?serverId=...&anonId=...
 * Check if the current anonymous user has saved an MCP server.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ saved: false });
  }

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");
  const anonId = searchParams.get("anonId");

  if (!serverId || !anonId) {
    return NextResponse.json({ saved: false });
  }

  const { data } = await supabase
    .from("mcp_saves")
    .select("server_id")
    .eq("server_id", serverId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ saved: !!data });
}
