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
 * POST /api/mcp/install
 * Record that the current anonymous user installed an MCP server (copied its
 * config into a client). Mirrors /api/skills/install.
 * Body: { serverId, anonId, target? }.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ installed: true, install_count: 1 });
  }

  const body = await req.json();
  const { serverId, anonId, target } = body as {
    serverId?: string;
    anonId?: string;
    target?: string;
  };

  if (!serverId || !anonId) {
    return NextResponse.json(
      { error: "serverId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    const { data: existing } = await supabase
      .from("mcp_installs")
      .select("install_count, first_installed_at")
      .eq("server_id", serverId)
      .eq("anon_id", anonId)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (existing) {
      const newCount = (existing.install_count ?? 1) + 1;
      const { error } = await supabase
        .from("mcp_installs")
        .update({
          install_count: newCount,
          installed_at: nowIso,
          target: target ?? "unknown",
        })
        .eq("server_id", serverId)
        .eq("anon_id", anonId);
      if (error) throw error;
      return NextResponse.json({
        installed: true,
        install_count: newCount,
        first_installed_at: existing.first_installed_at,
        installed_at: nowIso,
      });
    }

    const { error } = await supabase.from("mcp_installs").insert({
      server_id: serverId,
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
    console.error("MCP install error:", err);
    return NextResponse.json({ installed: true, install_count: 1 });
  }
}

/**
 * GET /api/mcp/install?serverId=...&anonId=...
 * Whether the current anonymous user has installed an MCP server before.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ installed: false });
  }

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");
  const anonId = searchParams.get("anonId");

  if (!serverId || !anonId) {
    return NextResponse.json({ installed: false });
  }

  const { data } = await supabase
    .from("mcp_installs")
    .select("target, install_count, first_installed_at, installed_at")
    .eq("server_id", serverId)
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
 * DELETE /api/mcp/install?serverId=...&anonId=...
 * Remove an install record (the dashboard "Uninstall" action).
 */
export async function DELETE(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ installed: false });
  }

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId");
  const anonId = searchParams.get("anonId");

  if (!serverId || !anonId) {
    return NextResponse.json(
      { error: "serverId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("mcp_installs")
      .delete()
      .eq("server_id", serverId)
      .eq("anon_id", anonId);
    if (error) throw error;
    return NextResponse.json({ installed: false });
  } catch (err: any) {
    console.error("MCP uninstall error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
