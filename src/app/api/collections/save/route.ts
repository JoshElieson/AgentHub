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
 * POST /api/collections/save
 * Toggle a personal bookmark on a bundle (collection): insert if not saved,
 * delete if already saved. Saved bundles surface in the Dashboard "Saved" tab
 * alongside saved skills and MCP servers. This is a private, per-user list — it
 * has no public count (unlike the thumbs-up / like counter).
 * Returns the new saved state.
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { collectionId, anonId } = body as {
    collectionId?: string;
    anonId?: string;
  };

  if (!collectionId || !anonId) {
    return NextResponse.json(
      { error: "collectionId and anonId are required" },
      { status: 400 }
    );
  }

  try {
    // Check if already saved
    const { data: existing } = await supabase
      .from("collection_saves")
      .select("collection_id")
      .eq("collection_id", collectionId)
      .eq("anon_id", anonId)
      .maybeSingle();

    let saved: boolean;

    if (existing) {
      const { error } = await supabase
        .from("collection_saves")
        .delete()
        .eq("collection_id", collectionId)
        .eq("anon_id", anonId);
      if (error) throw error;
      saved = false;
    } else {
      const { error } = await supabase
        .from("collection_saves")
        .insert({ collection_id: collectionId, anon_id: anonId });
      if (error) throw error;
      saved = true;
    }

    return NextResponse.json({ saved });
  } catch (err: any) {
    console.error("Collection save toggle error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/collections/save?collectionId=...&anonId=...
 * Check if the current anonymous user has saved a bundle.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ saved: false });
  }

  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId");
  const anonId = searchParams.get("anonId");

  if (!collectionId || !anonId) {
    return NextResponse.json({ saved: false });
  }

  const { data } = await supabase
    .from("collection_saves")
    .select("collection_id")
    .eq("collection_id", collectionId)
    .eq("anon_id", anonId)
    .maybeSingle();

  return NextResponse.json({ saved: !!data });
}
