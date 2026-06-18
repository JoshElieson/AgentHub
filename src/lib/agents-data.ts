// ---------------------------------------------------------------------------
// Seed Agent definitions — single source of truth for the 6 launch agents.
// Shared by the runtime API, browse page, and playground.
// ---------------------------------------------------------------------------

export interface SeedAgent {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  interactionMode: "chat" | "form" | "hybrid";
  estimatedCredits: number;
  creatorFeeCredits: number;
  creatorName: string;
  creatorUsername: string;
  creatorColor: string;
  runCount: number;
  uniqueUsers: number;
  avgRating: number;
  ratingCount: number;
  starCount: number;

  // Built-in capabilities
  canSearchWeb?: boolean;
  canScrape?: boolean;
  canGenerateFiles?: boolean;
  canRunCode?: boolean;
  canGenerateImages?: boolean;
}

export const SEED_AGENTS: Record<string, SeedAgent> = {};
