/**
 * Trim the bottom of the catalog by engagement.
 * Deletes at least 5000 lowest-signal skills (export_count, then star_count,
 * then created_at). Protects official / curated / homepage spotlight names.
 *
 *   node scripts/trim-bottom-catalog.mjs [--count=5000] [--dry-run]
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

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const countArg = args.find((a) => a.startsWith("--count="));
const TRIM_COUNT = parseInt(countArg?.split("=")[1] || "5000", 10);

const OFFICIAL_OWNERS = new Set([
  "anthropics", "anthropic", "modelcontextprotocol", "openai", "google",
  "googleapis", "google-gemini", "microsoft", "github", "stripe", "cloudflare",
  "huggingface", "vercel", "vercel-labs", "supabase", "hashicorp", "mongodb",
  "elastic", "redis", "aws", "awslabs", "amazon", "atlassian", "notionhq",
  "slackapi", "figma", "netlify", "prisma", "docker", "gitlab", "sentry",
  "grafana", "trailofbits", "expo",
]);

/** Homepage spotlight + pinned / well-known packages — never delete. */
const PROTECTED_NAMES = new Set(
  [
    "skill-creator",
    "brainstorming",
    "ponytail",
    "impeccable",
    "impeccable-ui",
    "frontend-design",
    "mcp-builder",
    "pdf",
    "pptx",
    "docx",
    "xlsx",
    "claude-api",
    "webapp-testing",
    "security-audit",
    "nextjs-best-practices",
    "postgres-best-practices",
    "github",
    "filesystem",
    "memory",
    "fetch",
    "puppeteer",
    "brave-search",
    "postgres",
    "sqlite",
    "sequential-thinking",
  ].map((s) => s.toLowerCase())
);

function githubOwner(u) {
  if (!u) return null;
  const m = String(u).match(/github\.com\/([^/]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function isProtected(row) {
  const name = String(row.name || "").toLowerCase();
  if (PROTECTED_NAMES.has(name)) return true;
  if ((row.tags || []).some((t) => String(t).toLowerCase() === "official")) return true;
  const owner = githubOwner(row.source_url || row.github_url);
  if (owner && OFFICIAL_OWNERS.has(owner)) return true;
  // High existing engagement — keep
  if ((row.star_count ?? 0) >= 20 || (row.export_count ?? 0) >= 40) return true;
  if ((row.avg_rating ?? 0) >= 4 && (row.rating_count ?? 0) >= 5) return true;
  return false;
}

async function fetchAll(table, columns) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from(table)
      .select(columns)
      .range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

function rankKey(r) {
  // Lower = more deletable
  return [
    r.export_count ?? 0,
    r.star_count ?? 0,
    r.rating_count ?? 0,
    // Prefer deleting mega-library long-tail over curated
    (r.tags || []).includes("mega-library") ? 0 : 1,
    new Date(r.created_at || 0).getTime(),
  ];
}

function cmpRank(a, b) {
  const ka = rankKey(a);
  const kb = rankKey(b);
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return ka[i] - kb[i];
  }
  return String(a.name).localeCompare(String(b.name));
}

async function trimTable(table, urlCol, extraProtect = 0) {
  console.log(`\n=== Trim ${table} ===`);
  const cols = `id, name, tags, ${urlCol}, star_count, export_count, avg_rating, rating_count, created_at`;
  const all = await fetchAll(table, cols);
  console.log(`Loaded ${all.length}`);

  const candidates = all.filter((r) => !isProtected({ ...r, github_url: r[urlCol], source_url: r[urlCol] }));
  candidates.sort(cmpRank);

  const doomed = candidates.slice(0, TRIM_COUNT + extraProtect);
  console.log(`Selected ${doomed.length} for deletion (protected kept: ${all.length - candidates.length})`);
  console.log(
    "Sample:",
    doomed.slice(0, 8).map((d) => `${d.name} (exp=${d.export_count}, ★=${d.star_count})`)
  );

  fs.writeFileSync(
    `scripts/_trimmed-${table}.json`,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        count: doomed.length,
        names: doomed.map((d) => d.name),
      },
      null,
      2
    )
  );

  if (dry) {
    console.log("Dry run — no deletes.");
    return doomed.length;
  }

  let deleted = 0;
  for (let i = 0; i < doomed.length; i += 100) {
    const batch = doomed.slice(i, i + 100);
    const ids = batch.map((d) => d.id);
    const { error } = await sb.from(table).delete().in("id", ids);
    if (error) {
      console.error("batch delete error", error.message);
      for (const d of batch) {
        const { error: e2 } = await sb.from(table).delete().eq("id", d.id);
        if (!e2) deleted++;
      }
    } else {
      deleted += batch.length;
    }
    if ((i / 100) % 5 === 0) console.log(`  …deleted ${deleted}`);
  }

  const { count } = await sb.from(table).select("id", { count: "exact", head: true });
  console.log(`Deleted ${deleted}. Remaining ${table}: ${count}`);
  return deleted;
}

async function run() {
  // Skills: trim 5000. MCPs: trim an additional 1500 long-tail if present.
  const s = await trimTable("skills", "source_url", 0);
  // Only trim MCPs if we still need more to hit "at least 5k" — skills alone usually enough
  let m = 0;
  if (s < TRIM_COUNT) {
    // adjust TRIM for second call — temporarily
    console.log(`Skills only trimmed ${s}; topping up with MCPs…`);
  }
  // Trim 1500 lowest-engagement non-protected MCPs for quality
  const mcpAll = await fetchAll(
    "mcp_servers",
    "id, name, tags, github_url, star_count, export_count, avg_rating, rating_count, created_at, command"
  );
  const mcpCand = mcpAll
    .filter((r) => !isProtected({ ...r, source_url: r.github_url }))
    .sort(cmpRank)
    .slice(0, 1500);

  console.log(`\n=== Trim mcp_servers (extra ${mcpCand.length}) ===`);
  if (!dry && mcpCand.length) {
    let deleted = 0;
    for (let i = 0; i < mcpCand.length; i += 100) {
      const ids = mcpCand.slice(i, i + 100).map((d) => d.id);
      const { error } = await sb.from("mcp_servers").delete().in("id", ids);
      if (!error) deleted += ids.length;
    }
    m = deleted;
    const { count } = await sb.from("mcp_servers").select("id", { count: "exact", head: true });
    console.log(`Deleted ${deleted} MCPs. Remaining: ${count}`);
  } else {
    console.log(dry ? "Dry run MCP candidates:" : "No MCP trim", mcpCand.length);
    m = mcpCand.length;
  }

  console.log(`\nTotal trimmed (skills+mcps): ${s + m}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
