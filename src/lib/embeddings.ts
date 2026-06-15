/**
 * Server-side embedding utility for pgvector semantic search.
 *
 * Uses Google's gemini-embedding-001 model (768 dimensions) via REST API.
 * Gracefully returns null when the API key is not configured, allowing
 * the app to fall back to client-side filtering in dev/mock mode.
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

/**
 * Build a focused text string from a skill's metadata for embedding.
 *
 * Deliberately excludes `markdown_instructions` to keep the embedding
 * signal focused on discoverability (what the skill IS) rather than
 * implementation details (HOW it works).
 */
export function buildEmbeddingInput(skill: {
  name: string;
  description: string;
  tags?: string[];
  trigger_phrases?: string[];
}): string {
  const parts: string[] = [
    // Name gets repeated for emphasis — it's the strongest identity signal
    skill.name.replace(/-/g, " "),
    skill.description,
  ];

  if (skill.tags && skill.tags.length > 0) {
    parts.push(`Tags: ${skill.tags.join(", ")}`);
  }

  if (skill.trigger_phrases && skill.trigger_phrases.length > 0) {
    parts.push(`Triggers: ${skill.trigger_phrases.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Generate a 768-dimensional embedding vector for the given text.
 *
 * Returns null if:
 * - The Google AI API key is not configured
 * - The API call fails for any reason
 *
 * This makes it safe to call unconditionally — callers don't need to
 * check for API key availability.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!GOOGLE_AI_API_KEY) {
    console.warn("[embeddings] GOOGLE_AI_API_KEY not set — skipping embedding generation");
    return null;
  }

  try {
    const response = await fetch(`${EMBEDDING_ENDPOINT}?key=${GOOGLE_AI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }],
        },
        outputDimensionality: 768,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[embeddings] Google AI API error (${response.status}):`, errorBody);
      return null;
    }

    const data = await response.json();
    const values: number[] = data?.embedding?.values;

    if (!values || values.length !== 768) {
      console.error("[embeddings] Unexpected embedding shape:", values?.length);
      return null;
    }

    return values;
  } catch (err) {
    console.error("[embeddings] Failed to generate embedding:", err);
    return null;
  }
}

/**
 * Check whether the embedding system is available.
 */
export function isEmbeddingConfigured(): boolean {
  return !!GOOGLE_AI_API_KEY;
}
