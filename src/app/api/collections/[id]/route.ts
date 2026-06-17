import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/collections/[id]
 * Fetch a single collection with its resolved items.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const db = supabase; // narrowed non-null reference for closures

  try {
    const { data: collection, error: cErr } = await db
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (cErr || !collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const { data: items, error: iErr } = await db
      .from("collection_items")
      .select("*")
      .eq("collection_id", id)
      .order("position", { ascending: true });

    if (iErr) throw iErr;

    // Resolve item details from skills / mcp_servers
    const resolvedItems = await Promise.all(
      (items ?? []).map(async (item: any) => {
        const table = item.item_kind === "skill" ? "skills" : "mcp_servers";
        const cols =
          item.item_kind === "skill"
            ? "name,description,tags,star_count,export_count,avg_rating,rating_count"
            : "name,description,tags,star_count,export_count,avg_rating,rating_count,command,args,env_vars,github_url";
        const { data: detail } = await db
          .from(table)
          .select(cols)
          .eq("id", item.item_id)
          .single();

        return {
          ...item,
          ...((detail ?? {}) as Record<string, unknown>),
        };
      })
    );

    return NextResponse.json({
      collection: { ...collection, items: resolvedItems },
    });
  } catch (err) {
    console.error("GET /api/collections/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

/**
 * PATCH /api/collections/[id]
 * Update collection name, description, or cover_color.
 * Body: { anonId, name?, description?, cover_color? }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { anonId, ...updates } = body;

    if (!anonId) {
      return NextResponse.json({ error: "anonId is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("collections")
      .select("anon_id")
      .eq("id", id)
      .single();

    if (!existing || existing.anon_id !== anonId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const allowed: Record<string, unknown> = {};
    if (updates.name !== undefined) allowed.name = updates.name;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.cover_color !== undefined) allowed.cover_color = updates.cover_color;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("collections")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ collection: data });
  } catch (err) {
    console.error("PATCH /api/collections/[id] error:", err);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[id]?anonId=...
 * Delete a collection (cascade deletes its items).
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const anonId = searchParams.get("anonId");

  if (!anonId) {
    return NextResponse.json({ error: "anonId is required" }, { status: 400 });
  }

  try {
    const { data: existing } = await supabase
      .from("collections")
      .select("anon_id")
      .eq("id", id)
      .single();

    if (!existing || existing.anon_id !== anonId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/collections/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
