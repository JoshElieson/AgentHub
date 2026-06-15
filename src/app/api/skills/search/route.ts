import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, isEmbeddingConfigured } from "@/lib/embeddings";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * GET /api/skills/search?q=<query>&limit=<n>
 *
 * Semantic search for skills using pgvector embeddings.
 * Falls back to ilike text search if embeddings are unavailable.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "1000", 10),
    1000
  );

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured", fallback: true },
      { status: 503 }
    );
  }

  // Empty query → return all skills (light listing, no markdown_instructions)
  if (!query) {
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, description, tags, trigger_phrases, source_url, script_urls, created_at, star_count, export_count, avg_rating, rating_count")
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      results: (data || []).map((s: any) => ({ ...s, similarity: null })),
      mode: "listing",
    });
  }

  // Try semantic search first
  if (isEmbeddingConfigured()) {
    const embedding = await generateEmbedding(query);

    if (embedding) {
      const { data, error } = await supabase.rpc("match_skills", {
        query_embedding: JSON.stringify(embedding),
        match_threshold: 0.3,
        match_count: limit,
      });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          results: data,
          mode: "semantic",
        });
      }

      // If semantic returned zero results, fall through to text search
      if (error) {
        console.error("[search] match_skills RPC error:", error.message);
      }
    }
  }

  // Fallback: text-based ilike search across name + description
  const pattern = `%${query}%`;
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, description, tags, trigger_phrases, source_url, script_urls, created_at, star_count, export_count, avg_rating, rating_count")
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: (data || []).map((s: any) => ({ ...s, similarity: null })),
    mode: "text",
  });
}
