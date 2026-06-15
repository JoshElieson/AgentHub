import type { Organization } from "../types";

export const ORG_GRADIENTS = {
  anthropic: "linear-gradient(135deg,#D97757,#B85338)",
  openai: "linear-gradient(135deg,#19C37D,#0E8C6D)",
  stripe: "linear-gradient(135deg,#7A73FF,#4B45C6)",
  datadog: "linear-gradient(135deg,#8B5CF6,#5B21B6)",
  cloudflare: "linear-gradient(135deg,#F6821F,#C2410C)",
  google: "linear-gradient(135deg,#4285F4,#1A73E8)",
  github: "linear-gradient(135deg,#6E7681,#24292F)",
  supabase: "linear-gradient(135deg,#3ECF8E,#249361)",
  replit: "linear-gradient(135deg,#F26207,#C2410C)",
} as const;

export const organizations: Organization[] = [
  {
    slug: "anthropic",
    name: "Anthropic",
    description:
      "Building reliable, interpretable, and steerable AI. Official Claude Code skills, MCP servers, and agent tooling.",
    avatarColor: ORG_GRADIENTS.anthropic,
    website: "https://anthropic.com",
    github: "anthropics",
    location: "San Francisco, CA",
    isVerified: true,
    members: 64,
    followers: 41200,
    joinedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    slug: "openai",
    name: "OpenAI",
    description:
      "Creating safe AGI that benefits all of humanity. Agents SDK tooling, function-calling packs, and developer utilities.",
    avatarColor: ORG_GRADIENTS.openai,
    website: "https://openai.com",
    github: "openai",
    location: "San Francisco, CA",
    isVerified: true,
    members: 58,
    followers: 38800,
    joinedAt: "2024-01-12T00:00:00.000Z",
  },
  {
    slug: "stripe",
    name: "Stripe",
    description:
      "Financial infrastructure for the internet. Official integration agents, API copilots, and billing automation.",
    avatarColor: ORG_GRADIENTS.stripe,
    website: "https://stripe.com",
    github: "stripe",
    location: "South San Francisco, CA",
    isVerified: true,
    members: 37,
    followers: 22600,
    joinedAt: "2024-02-02T00:00:00.000Z",
  },
  {
    slug: "datadog",
    name: "Datadog",
    description:
      "Observability for modern infrastructure. Release planning, incident triage, and DevOps automation agents.",
    avatarColor: ORG_GRADIENTS.datadog,
    website: "https://datadoghq.com",
    github: "datadog",
    location: "New York, NY",
    isVerified: true,
    members: 29,
    followers: 15400,
    joinedAt: "2024-03-15T00:00:00.000Z",
  },
  {
    slug: "cloudflare",
    name: "Cloudflare",
    description:
      "The connectivity cloud. Security scanning, edge tooling, and agent-safety packages for the modern web.",
    avatarColor: ORG_GRADIENTS.cloudflare,
    website: "https://cloudflare.com",
    github: "cloudflare",
    location: "San Francisco, CA",
    isVerified: true,
    members: 33,
    followers: 19100,
    joinedAt: "2024-02-20T00:00:00.000Z",
  },
  {
    slug: "google",
    name: "Google",
    description:
      "Gemini models and the Gemini CLI. Research workflows, automations, and tool adapters for the Gemini ecosystem.",
    avatarColor: ORG_GRADIENTS.google,
    website: "https://ai.google.dev",
    github: "google-gemini",
    location: "Mountain View, CA",
    isVerified: true,
    members: 71,
    followers: 44300,
    joinedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    slug: "github",
    name: "GitHub",
    description:
      "Home for all developers, including Copilot. Instruction packs, custom modes, and review automations for Copilot.",
    avatarColor: ORG_GRADIENTS.github,
    website: "https://github.com",
    github: "github",
    location: "San Francisco, CA",
    isVerified: true,
    members: 52,
    followers: 51200,
    joinedAt: "2024-01-18T00:00:00.000Z",
  },
  {
    slug: "supabase",
    name: "Supabase",
    description:
      "The open-source Firebase alternative. MCP servers and tool adapters that connect agents to Postgres, Auth, and Storage.",
    avatarColor: ORG_GRADIENTS.supabase,
    website: "https://supabase.com",
    github: "supabase",
    location: "Remote",
    isVerified: true,
    members: 24,
    followers: 17800,
    joinedAt: "2024-03-01T00:00:00.000Z",
  },
  {
    slug: "replit",
    name: "Replit",
    description:
      "Build software collaboratively with AI. Agent templates and automations for the Replit Agent runtime.",
    avatarColor: ORG_GRADIENTS.replit,
    website: "https://replit.com",
    github: "replit",
    location: "San Francisco, CA",
    isVerified: true,
    members: 26,
    followers: 20400,
    joinedAt: "2024-02-08T00:00:00.000Z",
  },
];

const bySlug = new Map(organizations.map((o) => [o.slug, o]));

export function getOrganization(slug: string): Organization | undefined {
  return bySlug.get(slug);
}
