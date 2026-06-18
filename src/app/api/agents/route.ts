import { NextRequest } from "next/server";
import { SEED_AGENTS } from "@/lib/agents-data";
import { readCustomAgents, saveCustomAgent } from "@/lib/custom-agents";

export async function GET() {
  try {
    const customAgents = await readCustomAgents();
    
    // Combine SEED_AGENTS and custom agents
    const combined = { ...SEED_AGENTS };
    
    for (const [slug, agent] of Object.entries(customAgents)) {
      combined[slug] = {
        slug: agent.slug,
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        category: agent.category,
        tags: agent.tags,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        interactionMode: agent.interactionMode,
        estimatedCredits: Math.max(1, Math.ceil(5 + agent.creatorFeeCredits)),
        creatorFeeCredits: agent.creatorFeeCredits,
        creatorName: agent.creatorName,
        creatorUsername: agent.creatorUsername,
        creatorColor: agent.creatorColor,
        runCount: agent.runCount,
        uniqueUsers: agent.uniqueUsers,
        avgRating: agent.avgRating,
        ratingCount: agent.ratingCount,
        starCount: agent.starCount,
      } as any;
    }
    
    return Response.json({ results: Object.values(combined) });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to list agents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      description,
      icon,
      category,
      tags,
      systemPrompt,
      modelPreference,
      temperature,
      maxTokens,
      canSearchWeb,
      canScrape,
      canGenerateFiles,
      canRunCode,
      canGenerateImages,
      interactionMode,
      outputFormat,
      enabledDestinations,
      webhookUrl,
      creatorFeeCredits,
      visibility,
    } = body;

    if (!name || !description || !systemPrompt) {
      return Response.json(
        { error: "Missing required fields (name, description, or systemPrompt)" },
        { status: 400 }
      );
    }

    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const saved = await saveCustomAgent({
      name,
      slug: finalSlug,
      description,
      icon: icon || "🤖",
      category: category || "development",
      tags: tags || [],
      systemPrompt,
      modelPreference: modelPreference || "auto",
      temperature: typeof temperature === "number" ? temperature : 0.5,
      maxTokens: typeof maxTokens === "number" ? maxTokens : 4096,
      canSearchWeb: !!canSearchWeb,
      canScrape: !!canScrape,
      canGenerateFiles: !!canGenerateFiles,
      canRunCode: !!canRunCode,
      canGenerateImages: !!canGenerateImages,
      interactionMode: interactionMode || "chat",
      outputFormat: outputFormat || "markdown",
      enabledDestinations: enabledDestinations || ["in-app", "download"],
      webhookUrl: webhookUrl || undefined,
      creatorFeeCredits: typeof creatorFeeCredits === "number" ? creatorFeeCredits : 0,
      visibility: visibility || "public",
    });

    return Response.json({ success: true, agent: saved });
  } catch (err: any) {
    return Response.json({ error: err.message || "Failed to create agent" }, { status: 500 });
  }
}
