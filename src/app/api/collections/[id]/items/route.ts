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
 * POST /api/collections/[id]/items
 * Add an item to a collection.
 * Body: { itemId, itemKind, anonId }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { itemId, itemKind, anonId } = await req.json();

    if (!itemId || !itemKind || !anonId) {
      return NextResponse.json(
        { error: "itemId, itemKind, and anonId are required" },
        { status: 400 }
      );
    }

    const { data: collection } = await supabase
      .from("collections")
      .select("anon_id")
      .eq("id", id)
      .single();

    if (!collection || collection.anon_id !== anonId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("collection_items")
      .select("position")
      .eq("collection_id", id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { error } = await supabase.from("collection_items").upsert(
      {
        collection_id: id,
        item_id: itemId,
        item_kind: itemKind,
        position: nextPosition,
      },
      { onConflict: "collection_id,item_id" }
    );

    if (error) throw error;

    // Touch the collection's updated_at
    await supabase
      .from("collections")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/collections/[id]/items error:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/[id]/items
 * Remove an item from a collection.
 * Body: { itemId, anonId }
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { itemId, anonId } = await req.json();

    if (!itemId || !anonId) {
      return NextResponse.json(
        { error: "itemId and anonId are required" },
        { status: 400 }
      );
    }

    const { data: collection } = await supabase
      .from("collections")
      .select("anon_id")
      .eq("id", id)
      .single();

    if (!collection || collection.anon_id !== anonId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", id)
      .eq("item_id", itemId);

    if (error) throw error;

    // Touch the collection's updated_at
    await supabase
      .from("collections")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/collections/[id]/items error:", err);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
