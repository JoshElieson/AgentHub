/**
 * Backfill skills.category / skills.model and mcp_servers.category / model
 * using the same keyword heuristic as src/lib/skill-classification.ts.
 *
 *   node scripts/backfill-classifications.mjs
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CATEGORY_RULES = [
  ["security", /\b(security|secret|vault|auth|oauth|vulnerab|audit|owasp|encryption|smart[- ]?contract|pentest|malware|threat)\b/],
  ["devops", /\b(devops|ci\/?cd|pipeline|docker|kubernetes|k8s|terraform|infra|infrastructure|deploy|observability|monitoring|sentry|grafana|datadog|serverless|workers|netlify|vercel|lambda|release|cloudflare)\b/],
  ["browser-automation", /\b(browser|scrap(e|ing)|puppeteer|playwright|crawl|firecrawl|e2e|selenium|headless)\b/],
  ["data-science", /\b(sql|analytics|dataset|notebook|machine[- ]learning|\bml\b|clickhouse|spreadsheet|xlsx|visualization|pandas|data[- ]science|warehouse|query|postgres|mongodb|redis)\b/],
  ["design", /\b(design|ui|ux|css|figma|typography|animation|gsap|palette|accessibility|a11y|tailwind)\b/],
  ["marketing", /\b(marketing|seo|growth|sales|campaign|ads|social[- ]media|twitter|linkedin)\b/],
  ["writing", /\b(writing|docs|documentation|blog|copy|content|markdown|docx|pdf|pptx|comms)\b/],
  ["education", /\b(education|tutorial|course|learn|teaching|curriculum|lesson)\b/],
  ["productivity", /\b(productivity|workflow|automation|notion|jira|linear|calendar|todo|task|project[- ]management)\b/],
  ["integrations", /\b(integrat|api[- ]|stripe|slack|discord|webhook|sdk|composio|zapier|oauth[- ]client)\b/],
  ["research", /\b(research|llm|agent|rag|prompt|embedding|vector|huggingface|model|ai[- ]|openai|anthropic|claude)\b/],
  ["development", /\b(react|nextjs|typescript|javascript|python|rust|golang|\bgo\b|node|frontend|backend|testing|git|code|debug|refactor)\b/],
];

const MODEL_RULES = [
  ["anthropic", /\b(claude|anthropic)\b/],
  ["openai", /\b(openai|gpt|chatgpt)\b/],
  ["google", /\b(gemini|google[- ]ai|vertex)\b/],
];

function heuristicCategory(text, fallback = "development") {
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return fallback;
}

function heuristicModels(text) {
  const found = MODEL_RULES.filter(([, re]) => re.test(text)).map(([m]) => m);
  return found.length > 0 ? found : ["universal"];
}

function blob(parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function pool(items, worker, concurrency = 40) {
  let idx = 0;
  let done = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
      if (++done % 500 === 0) console.log(`   …${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
}

async function backfill(table, fallback) {
  console.log(`\n=== Classify ${table} ===`);
  const rows = await fetchAll(table, "id, name, description, tags, category, model");
  console.log(`Loaded ${rows.length}`);

  // Prefer filling missing; also overwrite heuristic-only if category null
  const updates = [];
  const counts = {};
  for (const r of rows) {
    const text = blob([r.name, r.description, ...(r.tags || [])]);
    const category = r.category || heuristicCategory(text, fallback);
    const model =
      Array.isArray(r.model) && r.model.length > 0 ? r.model : heuristicModels(text);
    counts[category] = (counts[category] || 0) + 1;
    if (r.category === category && JSON.stringify(r.model) === JSON.stringify(model)) continue;
    updates.push({ id: r.id, category, model });
  }

  console.log("Category distribution:", counts);
  console.log(`Updating ${updates.length} rows…`);
  await pool(updates, async (u) => {
    const { error } = await sb
      .from(table)
      .update({ category: u.category, model: u.model })
      .eq("id", u.id);
    if (error) throw new Error(`${table} ${u.id}: ${error.message}`);
  });

  // Also emit a generated map snippet for skills (name → classification) for the TS map
  if (table === "skills") {
    const map = {};
    for (const r of rows) {
      const text = blob([r.name, r.description, ...(r.tags || [])]);
      map[r.name] = {
        category: r.category || heuristicCategory(text, fallback),
        model: Array.isArray(r.model) && r.model.length ? r.model : heuristicModels(text),
      };
    }
    const lines = Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([name, c]) =>
          `  ${JSON.stringify(name)}: { category: ${JSON.stringify(c.category)}, model: ${JSON.stringify(c.model)} },`
      );
    const file = `// AUTO-GENERATED by scripts/backfill-classifications.mjs — ${new Date().toISOString()}
import type { Classification } from "./skill-classification";

export const HARVESTED_SKILL_CLASSIFICATIONS: Record<string, Classification> = {
${lines.join("\n")}
};
`;
    fs.writeFileSync(
      path.join(process.cwd(), "src/lib/harvested-classifications.generated.ts"),
      file
    );
    console.log(`Wrote harvested-classifications.generated.ts (${lines.length} entries)`);
  }
}

async function run() {
  await backfill("skills", "development");
  await backfill("mcp_servers", "integrations");
  console.log("\n✅ Classifications backfilled");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
