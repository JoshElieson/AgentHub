import { promises as fs } from "fs";
import path from "path";
import { supabase } from "./supabase";
import type { Category, InteractionMode, ModelPreference, OutputFormat, OutputDestinationType } from "./types";

const CUSTOM_AGENTS_FILE = path.join(
  process.cwd(),
  "src/lib/data/custom-agents.json"
);

export interface CustomAgent {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: Category;
  tags: string[];
  systemPrompt: string;
  modelPreference: ModelPreference;
  temperature: number;
  maxTokens: number;
  canSearchWeb: boolean;
  canScrape: boolean;
  canGenerateFiles: boolean;
  canRunCode: boolean;
  canGenerateImages: boolean;
  interactionMode: InteractionMode;
  outputFormat: OutputFormat;
  enabledDestinations: OutputDestinationType[];
  webhookUrl?: string;
  googleDriveFolderName?: string;
  creatorFeeCredits: number;
  visibility: string;
  // Metadata for browsing
  creatorName: string;
  creatorUsername: string;
  creatorColor: string;
  runCount: number;
  uniqueUsers: number;
  avgRating: number;
  ratingCount: number;
  starCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Supabase row ↔ CustomAgent mapping
// ---------------------------------------------------------------------------

interface CustomAgentRow {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  system_prompt: string;
  model_preference: string;
  temperature: number;
  max_tokens: number;
  can_search_web: boolean;
  can_scrape: boolean;
  can_generate_files: boolean;
  can_run_code: boolean;
  can_generate_images: boolean;
  interaction_mode: string;
  output_format: string;
  enabled_destinations: string[];
  webhook_url: string | null;
  google_drive_folder_name: string | null;
  creator_fee_credits: number;
  visibility: string;
  creator_name: string;
  creator_username: string;
  creator_color: string;
  anon_id: string | null;
  run_count: number;
  unique_users: number;
  avg_rating: number;
  rating_count: number;
  star_count: number;
  created_at: string;
  updated_at: string;
}

function rowToAgent(row: CustomAgentRow): CustomAgent {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category as Category,
    tags: row.tags ?? [],
    systemPrompt: row.system_prompt,
    modelPreference: row.model_preference as ModelPreference,
    temperature: row.temperature,
    maxTokens: row.max_tokens,
    canSearchWeb: row.can_search_web,
    canScrape: row.can_scrape,
    canGenerateFiles: row.can_generate_files,
    canRunCode: row.can_run_code,
    canGenerateImages: row.can_generate_images,
    interactionMode: row.interaction_mode as InteractionMode,
    outputFormat: row.output_format as OutputFormat,
    enabledDestinations: (row.enabled_destinations ?? []) as OutputDestinationType[],
    webhookUrl: row.webhook_url ?? undefined,
    googleDriveFolderName: row.google_drive_folder_name ?? undefined,
    creatorFeeCredits: row.creator_fee_credits,
    visibility: row.visibility,
    creatorName: row.creator_name,
    creatorUsername: row.creator_username,
    creatorColor: row.creator_color,
    runCount: row.run_count,
    uniqueUsers: row.unique_users,
    avgRating: row.avg_rating,
    ratingCount: row.rating_count,
    starCount: row.star_count,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Read all custom agents — Supabase first, JSON fallback
// ---------------------------------------------------------------------------

export async function readCustomAgents(): Promise<Record<string, CustomAgent>> {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("custom_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const result: Record<string, CustomAgent> = {};
        for (const row of data as CustomAgentRow[]) {
          result[row.slug] = rowToAgent(row);
        }
        return result;
      }

      // If Supabase returned empty or error, fall through to JSON
      if (error) {
        console.warn("[custom-agents] Supabase read error, falling back to JSON:", error.message);
      }
    } catch (err: any) {
      console.warn("[custom-agents] Supabase read failed, falling back to JSON:", err.message);
    }
  }

  // Fallback: local JSON
  try {
    const data = await fs.readFile(CUSTOM_AGENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Save a custom agent — Supabase first, JSON fallback
// ---------------------------------------------------------------------------

export async function saveCustomAgent(
  agent: Omit<CustomAgent, "creatorName" | "creatorUsername" | "creatorColor" | "runCount" | "uniqueUsers" | "avgRating" | "ratingCount" | "starCount" | "createdAt">
): Promise<CustomAgent> {
  const now = new Date().toISOString();

  // Try Supabase first
  if (supabase) {
    try {
      const row = {
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        icon: agent.icon || "🤖",
        category: agent.category || "development",
        tags: agent.tags || [],
        system_prompt: agent.systemPrompt,
        model_preference: agent.modelPreference || "auto",
        temperature: agent.temperature ?? 0.5,
        max_tokens: agent.maxTokens ?? 4096,
        can_search_web: !!agent.canSearchWeb,
        can_scrape: !!agent.canScrape,
        can_generate_files: !!agent.canGenerateFiles,
        can_run_code: !!agent.canRunCode,
        can_generate_images: !!agent.canGenerateImages,
        interaction_mode: agent.interactionMode || "chat",
        output_format: agent.outputFormat || "markdown",
        enabled_destinations: agent.enabledDestinations || ["in-app", "download"],
        webhook_url: agent.webhookUrl || null,
        google_drive_folder_name: agent.googleDriveFolderName || null,
        creator_fee_credits: agent.creatorFeeCredits ?? 0,
        visibility: agent.visibility || "public",
        creator_name: "You",
        creator_username: "creator",
        creator_color: "#3b82f6",
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("custom_agents")
        .upsert(row, { onConflict: "slug" })
        .select()
        .single();

      if (error) {
        console.error("[custom-agents] Supabase upsert error:", error.message);
        // Fall through to JSON fallback
      } else if (data) {
        console.log(`[custom-agents] Saved to Supabase: ${agent.slug}`);
        return rowToAgent(data as CustomAgentRow);
      }
    } catch (err: any) {
      console.error("[custom-agents] Supabase save failed:", err.message);
      // Fall through to JSON fallback
    }
  }

  // Fallback: local JSON
  const all = await readJsonFallback();
  const dir = path.dirname(CUSTOM_AGENTS_FILE);
  await fs.mkdir(dir, { recursive: true });

  const updated: CustomAgent = {
    ...agent,
    creatorName: "You",
    creatorUsername: "creator",
    creatorColor: "#3b82f6",
    runCount: 0,
    uniqueUsers: 0,
    avgRating: 0,
    ratingCount: 0,
    starCount: 0,
    createdAt: now,
  };

  all[agent.slug] = updated;
  await fs.writeFile(CUSTOM_AGENTS_FILE, JSON.stringify(all, null, 2), "utf-8");
  return updated;
}

// ---------------------------------------------------------------------------
// Internal: read local JSON (always, bypasses Supabase)
// ---------------------------------------------------------------------------

async function readJsonFallback(): Promise<Record<string, CustomAgent>> {
  try {
    const data = await fs.readFile(CUSTOM_AGENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
