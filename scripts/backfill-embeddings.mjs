/**
 * Backfill embeddings for all existing skills in the database.
 *
 * Usage:
 *   node scripts/backfill-embeddings.mjs
 *
 * Requires GOOGLE_AI_API_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ── Read env ──────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const googleApiKey = envContent.match(/GOOGLE_AI_API_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase credentials missing in .env.local");
  process.exit(1);
}
if (!googleApiKey) {
  console.error("❌ GOOGLE_AI_API_KEY missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Embedding helpers ─────────────────────────────────────────────────────────
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

function buildEmbeddingInput(skill) {
  const parts = [
    skill.name.replace(/-/g, " "),
    skill.description,
  ];
  if (skill.tags && skill.tags.length > 0) {
    parts.push(`Tags: ${skill.tags.join(", ")}`);
  }
  if (skill.trigger_phrases && skill.trigger_phrases.length > 0) {
    const phrases = Array.isArray(skill.trigger_phrases)
      ? skill.trigger_phrases
      : [];
    if (phrases.length > 0) {
      parts.push(`Triggers: ${phrases.join(", ")}`);
    }
  }
  return parts.join("\n");
}

async function generateEmbedding(text) {
  const response = await fetch(`${EMBEDDING_ENDPOINT}?key=${googleApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google AI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data?.embedding?.values;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log("\n🔍 Fetching skills without embeddings...\n");

  // Fetch skills that don't have embeddings yet.
  // Note: We can't filter `embedding IS NULL` via supabase-js easily for vector
  // columns, so we page through every row and check client-side. We MUST
  // paginate with .range() — supabase-js caps an unbounded select at 1000 rows,
  // which would silently skip the rest of the catalog.
  const PAGE = 1000;
  const allSkills = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, description, tags, trigger_phrases, embedding")
      .order("name", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("❌ Failed to fetch skills:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allSkills.push(...data);
    if (data.length < PAGE) break;
  }

  // Filter to skills without embeddings
  const skills = allSkills.filter((s) => !s.embedding);
  const total = skills.length;

  if (total === 0) {
    console.log("✅ All skills already have embeddings! Nothing to do.\n");
    return;
  }

  console.log(`📦 Found ${total} skills to embed.\n`);

  let success = 0;
  let failed = 0;

  // Process in batches of 5 with a small delay between batches
  const BATCH_SIZE = 5;
  const DELAY_MS = 500;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = skills.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (skill) => {
      try {
        const input = buildEmbeddingInput(skill);
        const embedding = await generateEmbedding(input);

        if (!embedding || embedding.length !== 768) {
          throw new Error(`Unexpected embedding shape: ${embedding?.length}`);
        }

        const { error: updateError } = await supabase
          .from("skills")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", skill.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        success++;
        console.log(`  ✅ [${success + failed}/${total}] ${skill.name}`);
      } catch (err) {
        failed++;
        console.error(`  ❌ [${success + failed}/${total}] ${skill.name}: ${err.message}`);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < total) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n📊 Results: ${success} embedded, ${failed} failed out of ${total}`);
  console.log("✨ Backfill complete!\n");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
