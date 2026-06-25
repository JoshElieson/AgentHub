import { SEED_AGENTS } from "@/lib/agents-data";
import { readCustomAgents } from "@/lib/custom-agents";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let agent = SEED_AGENTS[slug];

  if (!agent) {
    const customAgents = await readCustomAgents();
    const custom = customAgents[slug];
    if (custom) {
      agent = {
        slug: custom.slug,
        name: custom.name,
        description: custom.description,
        icon: custom.icon,
        category: custom.category,
        tags: custom.tags,
        systemPrompt: custom.systemPrompt,
        temperature: custom.temperature,
        maxTokens: custom.maxTokens,
        interactionMode: custom.interactionMode,
        estimatedCredits: Math.max(1, Math.ceil(5 + custom.creatorFeeCredits)),
        creatorFeeCredits: custom.creatorFeeCredits,
        creatorName: custom.creatorName,
        creatorUsername: custom.creatorUsername,
        creatorColor: custom.creatorColor,
        runCount: custom.runCount,
        uniqueUsers: custom.uniqueUsers,
        avgRating: custom.avgRating,
        ratingCount: custom.ratingCount,
        starCount: custom.starCount,
        enabledDestinations: custom.enabledDestinations,
        googleDriveFolderName: custom.googleDriveFolderName,
      } as any;
    }
  }

  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Return public-facing metadata (no system prompt exposed)
  return Response.json({
    slug: agent.slug,
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    category: agent.category,
    tags: agent.tags,
    interactionMode: agent.interactionMode,
    estimatedCredits: agent.estimatedCredits,
    creatorFeeCredits: agent.creatorFeeCredits,
    creatorName: agent.creatorName,
    creatorUsername: agent.creatorUsername,
    creatorColor: agent.creatorColor,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    runCount: agent.runCount,
    uniqueUsers: agent.uniqueUsers,
    avgRating: agent.avgRating,
    ratingCount: agent.ratingCount,
    starCount: agent.starCount,
    enabledDestinations: agent.enabledDestinations,
    googleDriveFolderName: agent.googleDriveFolderName,
  });
}
