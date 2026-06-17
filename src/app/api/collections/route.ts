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
 * GET /api/collections?anonId=...
 * List all public collections, or all collections for the given user.
 * When `mine=true` is passed, returns only the user's own collections.
 */
export async function GET(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ collections: [] }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const anonId = searchParams.get("anonId");
  const mine = searchParams.get("mine") === "true";

  try {
    let query = supabase
      .from("collections")
      .select("*")
      .order("updated_at", { ascending: false });

    if (mine && anonId) {
      query = query.eq("anon_id", anonId);
    } else {
      if (anonId) {
        query = query.or(`is_public.eq.true,anon_id.eq.${anonId}`);
      } else {
        query = query.eq("is_public", true);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    // For each collection, fetch item count
    const collections = await Promise.all(
      (data ?? []).map(async (c: any) => {
        const { count } = await supabase!
          .from("collection_items")
          .select("*", { count: "exact", head: true })
          .eq("collection_id", c.id);
        return { ...c, item_count: count ?? 0 };
      })
    );

    return NextResponse.json({ collections });
  } catch (err) {
    console.error("GET /api/collections error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections
 * Create a new collection.
 * Body: { name, kind, anonId, description?, cover_color? }
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { name, kind, anonId, description, cover_color } = body;

    if (!name || !kind || !anonId) {
      return NextResponse.json(
        { error: "name, kind, and anonId are required" },
        { status: 400 }
      );
    }

    if (kind !== "skills" && kind !== "mcps") {
      return NextResponse.json(
        { error: "kind must be 'skills' or 'mcps'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({
        name,
        kind,
        anon_id: anonId,
        description: description ?? "",
        cover_color:
          cover_color ??
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        is_public: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ collection: { ...data, items: [] } });
  } catch (err) {
    console.error("POST /api/collections error:", err);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
