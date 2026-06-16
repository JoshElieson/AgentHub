import type { Category, SkillModel } from "./types";

// ---------------------------------------------------------------------------
// Catalogue classification — every seeded skill / MCP server is "marked" with
// one of the 12 landing-page categories and the AI model(s) it targets.
//
// The curated maps below are the source of truth (keyed by exact package name).
// They are applied in the marketplace-data normalizers, so the classification
// works on live Supabase rows (matched by name) as well as the mock catalogue —
// no DB column is required for the filters to function. New / unknown packages
// fall back to a keyword heuristic so they still get a sensible category.
// ---------------------------------------------------------------------------

export interface Classification {
  category: Category;
  model: SkillModel[];
}

// Filled from the verified classification workflow. See
// scripts/classify-marketplace-catalog (workflow) for how these were derived.
export const SKILL_CLASSIFICATIONS: Record<string, Classification> = {
  "mcp-builder": { category: "development", model: ["anthropic"] },
  "prompt-engineering": { category: "research", model: ["universal"] },
  "rag-architecture": { category: "research", model: ["universal"] },
  "huggingface-model-trainer": { category: "research", model: ["universal"] },
  "frontend-design": { category: "design", model: ["universal"] },
  "nextjs-best-practices": { category: "development", model: ["universal"] },
  "react-accessibility": { category: "development", model: ["universal"] },
  "css-architecture": { category: "design", model: ["universal"] },
  "web-performance": { category: "development", model: ["universal"] },
  "gsap-animation": { category: "design", model: ["universal"] },
  "stripe-best-practices": { category: "integrations", model: ["universal"] },
  "graphql-patterns": { category: "development", model: ["universal"] },
  "postgres-best-practices": { category: "development", model: ["universal"] },
  "api-design": { category: "development", model: ["universal"] },
  "authentication-patterns": { category: "security", model: ["universal"] },
  "cloudflare-workers": { category: "devops", model: ["universal"] },
  "docker-best-practices": { category: "devops", model: ["universal"] },
  "terraform-patterns": { category: "devops", model: ["universal"] },
  "ci-cd-pipelines": { category: "devops", model: ["universal"] },
  "kubernetes-operations": { category: "devops", model: ["universal"] },
  "observability": { category: "devops", model: ["universal"] },
  "webapp-testing": { category: "development", model: ["universal"] },
  "testing-strategy": { category: "development", model: ["universal"] },
  "property-based-testing": { category: "development", model: ["universal"] },
  "security-audit": { category: "security", model: ["universal"] },
  "secrets-management": { category: "security", model: ["universal"] },
  "git-workflow": { category: "development", model: ["universal"] },
  "react-native-best-practices": { category: "development", model: ["universal"] },
  "expo-development": { category: "development", model: ["universal"] },
  "data-visualization": { category: "data-science", model: ["universal"] },
  "sql-optimization": { category: "development", model: ["universal"] },
  "technical-writing": { category: "writing", model: ["universal"] },
  "skill-creator": { category: "development", model: ["anthropic"] },
  "algorithmic-art": { category: "design", model: ["universal"] },
  "remotion-video": { category: "design", model: ["universal"] },
  "netlify-deployment": { category: "devops", model: ["universal"] },
  "sentry-observability": { category: "devops", model: ["universal"] },
  "typescript-patterns": { category: "development", model: ["universal"] },
  "python-best-practices": { category: "development", model: ["universal"] },
  "rust-fundamentals": { category: "development", model: ["universal"] },
  "go-patterns": { category: "development", model: ["universal"] },
  "seo-optimization": { category: "marketing", model: ["universal"] },
  "docx-creation": { category: "writing", model: ["anthropic"] },
  "xlsx-analysis": { category: "data-science", model: ["anthropic"] },
  "composio-integrations": { category: "integrations", model: ["universal"] },
  "firecrawl-web-scraping": { category: "browser-automation", model: ["universal"] },
  "replicate-ai-models": { category: "integrations", model: ["universal"] },
  "angular-development": { category: "development", model: ["universal"] },
  "system-design": { category: "development", model: ["universal"] },
  "microservices-patterns": { category: "development", model: ["universal"] },
  "bash-scripting": { category: "development", model: ["universal"] },
  "regex-patterns": { category: "development", model: ["universal"] },
  "error-handling": { category: "development", model: ["universal"] },
  "smart-contract-security": { category: "security", model: ["universal"] },
  "notification-systems": { category: "productivity", model: ["universal"] },
  "social-media-publishing": { category: "marketing", model: ["universal"] },
  "gradio-apps": { category: "development", model: ["universal"] },
  "content-modeling": { category: "development", model: ["universal"] },
  "clickhouse-analytics": { category: "development", model: ["universal"] },
  "neon-serverless-postgres": { category: "development", model: ["universal"] },
  // ── Researched skills batch (scripts/researched-skills.json) ──────────────
  // Anthropic official skills
  "pdf": { category: "productivity", model: ["anthropic"] },
  "pptx": { category: "productivity", model: ["anthropic"] },
  "docx": { category: "writing", model: ["anthropic"] },
  "xlsx": { category: "data-science", model: ["anthropic"] },
  "canvas-design": { category: "design", model: ["anthropic"] },
  "brand-guidelines": { category: "design", model: ["anthropic"] },
  "theme-factory": { category: "design", model: ["anthropic"] },
  "web-artifacts-builder": { category: "development", model: ["anthropic"] },
  "doc-coauthoring": { category: "writing", model: ["anthropic"] },
  "internal-comms": { category: "writing", model: ["anthropic"] },
  "slack-gif-creator": { category: "design", model: ["anthropic"] },
  "claude-api": { category: "development", model: ["anthropic"] },
  // Vendor + community skills
  "prisma-orm-v7-upgrade": { category: "development", model: ["universal"] },
  "prisma-client-api": { category: "development", model: ["universal"] },
  "convex-migration-helper": { category: "development", model: ["universal"] },
  "convex-performance-audit": { category: "development", model: ["universal"] },
  "clerk-nextjs-patterns": { category: "security", model: ["universal"] },
  "clerk-webhooks": { category: "integrations", model: ["universal"] },
  "auth0-nextjs-authentication": { category: "security", model: ["universal"] },
  "twilio-verify-otp": { category: "security", model: ["universal"] },
  "sendgrid-email-send": { category: "integrations", model: ["universal"] },
  "elevenlabs-text-to-speech": { category: "integrations", model: ["universal"] },
  "elevenlabs-sound-effects": { category: "design", model: ["universal"] },
  "shopify-liquid-themes": { category: "development", model: ["universal"] },
  "shopify-admin-graphql": { category: "development", model: ["universal"] },
  "datadog-api-integration": { category: "devops", model: ["universal"] },
  "browserbase-browser-automation": { category: "browser-automation", model: ["universal"] },
  "browserbase-ui-test": { category: "browser-automation", model: ["universal"] },
  "d3-viz": { category: "data-science", model: ["universal"] },
  "ffuf-web-fuzzing": { category: "security", model: ["universal"] },
  "playwright-browser-automation": { category: "browser-automation", model: ["universal"] },
  "web-asset-generator": { category: "design", model: ["universal"] },
  "frontend-slides": { category: "design", model: ["universal"] },
  "ios-simulator": { category: "development", model: ["universal"] },
  "mermaid-diagram": { category: "development", model: ["universal"] },
  "csv-data-summarizer": { category: "data-science", model: ["universal"] },
  "postgres-readonly-query": { category: "data-science", model: ["universal"] },
  "email-html-mjml": { category: "marketing", model: ["universal"] },
  "aws-architecture-diagram": { category: "devops", model: ["universal"] },
  "elevenlabs-tts-podcast": { category: "productivity", model: ["universal"] },
  "code-review-multilang": { category: "development", model: ["universal"] },
  "github-pr-review": { category: "development", model: ["universal"] },
  "career-ops": { category: "productivity", model: ["universal"] },
  // mock-only name variants (src/lib/supabase.ts MOCK_SKILLS)
  "lol-touch-grass": { category: "productivity", model: ["universal"] },
  "git-semantic-commit": { category: "development", model: ["universal"] },
  "react-accessibility-lint": { category: "development", model: ["universal"] },
  "cloudflare-workers-best-practices": { category: "devops", model: ["universal"] },
};

export const MCP_CLASSIFICATIONS: Record<string, Classification> = {
  "github": { category: "development", model: ["universal"] },
  "postgres": { category: "data-science", model: ["universal"] },
  "sqlite": { category: "data-science", model: ["universal"] },
  "filesystem": { category: "development", model: ["universal"] },
  "memory": { category: "research", model: ["universal"] },
  "fetch": { category: "research", model: ["universal"] },
  "puppeteer": { category: "browser-automation", model: ["universal"] },
  "brave-search": { category: "research", model: ["universal"] },
  "slack": { category: "integrations", model: ["universal"] },
  "gdrive": { category: "integrations", model: ["universal"] },
  "sequential-thinking": { category: "research", model: ["universal"] },
  "google-maps": { category: "integrations", model: ["universal"] },
  "gitlab": { category: "development", model: ["universal"] },
  "sentry": { category: "devops", model: ["universal"] },
  "notion": { category: "productivity", model: ["universal"] },
  "linear": { category: "productivity", model: ["universal"] },
  "time": { category: "productivity", model: ["universal"] },
  "aws-kb": { category: "research", model: ["universal"] },
  "supabase": { category: "data-science", model: ["universal"] },
  "docker": { category: "devops", model: ["universal"] },
  "kubernetes": { category: "devops", model: ["universal"] },
  "obsidian": { category: "productivity", model: ["universal"] },
  "jira": { category: "productivity", model: ["universal"] },
  "confluence": { category: "writing", model: ["universal"] },
  "tavily": { category: "research", model: ["universal"] },
  "stripe": { category: "integrations", model: ["universal"] },
  "cloudflare": { category: "devops", model: ["universal"] },
  "npm": { category: "development", model: ["universal"] },
  "figma": { category: "design", model: ["universal"] },
  "vercel": { category: "devops", model: ["universal"] },
  "asana": { category: "productivity", model: ["universal"] },
  "trello": { category: "productivity", model: ["universal"] },
  "mongodb": { category: "data-science", model: ["universal"] },
  "mysql": { category: "data-science", model: ["universal"] },
  "redis": { category: "integrations", model: ["universal"] },
  "aws-s3": { category: "integrations", model: ["universal"] },
  "google-docs": { category: "writing", model: ["universal"] },
  "google-sheets": { category: "data-science", model: ["universal"] },
  "google-calendar": { category: "productivity", model: ["universal"] },
  "zendesk": { category: "integrations", model: ["universal"] },
  "hubspot": { category: "integrations", model: ["universal"] },
  "salesforce": { category: "integrations", model: ["universal"] },
  "shopify": { category: "integrations", model: ["universal"] },
  "airtable": { category: "integrations", model: ["universal"] },
  "datadog": { category: "devops", model: ["universal"] },
  "grafana": { category: "devops", model: ["universal"] },
  "elasticsearch": { category: "data-science", model: ["universal"] },
  "pinecone": { category: "data-science", model: ["universal"] },
  "qdrant": { category: "data-science", model: ["universal"] },
  "chroma": { category: "data-science", model: ["universal"] },
  "huggingface": { category: "data-science", model: ["universal"] },
  "discord": { category: "integrations", model: ["universal"] },
  "zoom": { category: "integrations", model: ["universal"] },
  "intercom": { category: "integrations", model: ["universal"] },
  "reddit": { category: "integrations", model: ["universal"] },
  "twitter": { category: "marketing", model: ["universal"] },
  "stripe-billing": { category: "integrations", model: ["universal"] },
  "sendgrid": { category: "integrations", model: ["universal"] },
  "twilio": { category: "integrations", model: ["universal"] },
  "aws-lambda": { category: "devops", model: ["universal"] },
  "git": { category: "development", model: ["universal"] },
  "everything": { category: "development", model: ["universal"] },
  // mock-only (src/lib/supabase.ts MOCK_MCP_SERVERS)
  "github-mcp": { category: "development", model: ["universal"] },
};

// ---------------------------------------------------------------------------
// Heuristic fallback — keyword match over name + tags + description.
// Only used when a package is not present in the curated maps above.
// ---------------------------------------------------------------------------

const CATEGORY_RULES: [Category, RegExp][] = [
  ["security", /\b(security|secret|vault|auth|oauth|vulnerab|audit|owasp|encryption|smart[- ]?contract|pentest)\b/],
  ["devops", /\b(devops|ci\/?cd|pipeline|docker|kubernetes|k8s|terraform|infra|infrastructure|deploy|observability|monitoring|sentry|grafana|datadog|serverless|workers|netlify|vercel|lambda|release)\b/],
  ["browser-automation", /\b(browser|scrap(e|ing)|puppeteer|playwright|crawl|firecrawl|e2e|selenium|headless)\b/],
  ["data-science", /\b(sql|analytics|dataset|notebook|machine[- ]learning|\bml\b|clickhouse|spreadsheet|xlsx|visualization|pandas|data[- ]science|warehouse|query)\b/],
  ["design", /\b(design|\bui\b|\bux\b|typography|\bcss\b|animation|gsap|generative art|\bart\b|video|remotion|figma|aesthetic)\b/],
  ["marketing", /\b(seo|marketing|campaign|social[- ]media|growth|copywrit|advertis|newsletter)\b/],
  ["writing", /\b(writing|docs|documentation|content|editing|docx|technical[- ]writing|prose)\b/],
  ["research", /\b(research|\brag\b|prompt[- ]engineering|summariz|embedding|retrieval|knowledge|memory)\b/],
  ["integrations", /\b(integration|connector|webhook|stripe|payment|notion|slack|salesforce|hubspot|shopify|twilio|sendgrid|zendesk|airtable|composio|replicate|saas|\bapi\b)\b/],
  ["education", /\b(tutor|learn(ing)?|education|explain|teaching|course)\b/],
  ["productivity", /\b(productivity|notes|planning|workflow|notification|reminder|utility|todo)\b/],
];

const MODEL_RULES: [SkillModel, RegExp][] = [
  ["anthropic", /\b(claude|anthropic|\bmcp\b|model context protocol|skill\.md|sonnet|opus|haiku)\b/],
  ["openai", /\b(openai|gpt-?\d|chatgpt|assistants api)\b/],
  ["google", /\b(gemini|vertex ai|palm)\b/],
  ["meta", /\b(llama)\b/],
  ["mistral", /\b(mistral|mixtral)\b/],
];

function blob(parts: (string | undefined | null | string[])[]): string {
  return parts
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function heuristicCategory(text: string, fallback: Category): Category {
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return fallback;
}

function heuristicModels(text: string): SkillModel[] {
  const found = MODEL_RULES.filter(([, re]) => re.test(text)).map(([m]) => m);
  return found.length > 0 ? found : ["universal"];
}

// ---------------------------------------------------------------------------
// Public classify helpers — explicit fields → curated map → heuristic.
// ---------------------------------------------------------------------------

interface ClassifiableRow {
  name?: string;
  description?: string | null;
  tags?: string[];
  category?: Category | string | null;
  model?: SkillModel[] | null;
}

function fromExplicit(row: ClassifiableRow): Partial<Classification> {
  const out: Partial<Classification> = {};
  if (row.category) out.category = row.category as Category;
  if (Array.isArray(row.model) && row.model.length > 0) out.model = row.model;
  return out;
}

function classify(
  row: ClassifiableRow,
  curated: Record<string, Classification>,
  fallbackCategory: Category
): Classification {
  const explicit = fromExplicit(row);
  const mapped = row.name ? curated[row.name] : undefined;
  const text = blob([row.name, row.description, row.tags]);
  return {
    category:
      explicit.category ??
      mapped?.category ??
      heuristicCategory(text, fallbackCategory),
    model: explicit.model ?? mapped?.model ?? heuristicModels(text),
  };
}

export function classifySkill(row: ClassifiableRow): Classification {
  return classify(row, SKILL_CLASSIFICATIONS, "development");
}

export function classifyMcp(row: ClassifiableRow): Classification {
  return classify(row, MCP_CLASSIFICATIONS, "integrations");
}

// ---------------------------------------------------------------------------
// Catalogue category counts — derived from the curated maps. Used by the home
// page so the category tiles reflect the real seeded catalogue.
// ---------------------------------------------------------------------------

export function catalogCategoryCounts(): Record<Category, number> {
  const counts = {} as Record<Category, number>;
  for (const { category } of [
    ...Object.values(SKILL_CLASSIFICATIONS),
    ...Object.values(MCP_CLASSIFICATIONS),
  ]) {
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}
