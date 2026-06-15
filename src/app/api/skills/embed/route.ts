import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, buildEmbeddingInput, isEmbeddingConfigured } from "@/lib/embeddings";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * POST /api/skills/embed
 *
 * Generate and store an embedding for a specific skill.
 * Called asynchronously after a skill is inserted or updated.
 *
 * Body: { skillId: string }
 */
export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  if (!isEmbeddingConfigured()) {
    return NextResponse.json(
      { error: "Embedding API key not configured", skipped: true },
      { status: 200 }
    );
  }

  try {
    const { skillId } = await req.json();

    if (!skillId) {
      return NextResponse.json(
        { error: "skillId is required" },
        { status: 400 }
      );
    }

    // Fetch the skill
    const { data: skill, error: fetchError } = await supabase
      .from("skills")
      .select("id, name, description, tags, trigger_phrases")
      .eq("id", skillId)
      .single();

    if (fetchError || !skill) {
      return NextResponse.json(
        { error: fetchError?.message || "Skill not found" },
        { status: 404 }
      );
    }

    // Build embedding input and generate embedding
    const input = buildEmbeddingInput(skill);
    const embedding = await generateEmbedding(input);

    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 }
      );
    }

    // Store the embedding
    const { error: updateError } = await supabase
      .from("skills")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", skillId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      skillId,
      embeddingDimensions: embedding.length,
    });
  } catch (err: any) {
    console.error("[embed] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
