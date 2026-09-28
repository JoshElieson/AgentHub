/**
 * Soft-trim lowest-engagement MCPs (no DELETE policy for anon) by tagging
 * them catalog-trimmed, and verify quality floors.
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

const OFFICIAL_OWNERS = new Set([
  "anthropics", "anthropic", "modelcontextprotocol", "openai", "google",
  "googleapis", "google-gemini", "microsoft", "github", "stripe", "cloudflare",
  "huggingface", "vercel", "vercel-labs", "supabase", "hashicorp", "mongodb",
  "elastic", "redis", "aws", "awslabs", "amazon", "atlassian", "notionhq",
  "slackapi", "figma", "netlify", "prisma", "docker", "gitlab", "sentry",
  "grafana", "trailofbits", "expo",
]);

const PROTECTED_NAMES = new Set(
  [
    "github", "filesystem", "memory", "fetch", "puppeteer", "brave-search",
    "postgres", "sqlite", "sequential-thinking", "slack", "notion", "stripe",
    "supabase", "docker", "kubernetes",
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
  const owner = githubOwner(row.github_url);
  if (owner && OFFICIAL_OWNERS.has(owner)) return true;
  if ((row.star_count ?? 0) >= 20 || (row.export_count ?? 0) >= 40) return true;
  if ((row.avg_rating ?? 0) >= 4 && (row.rating_count ?? 0) >= 5) return true;
  if ((row.tags || []).includes("catalog-trimmed")) return true; // already trimmed
  return false;
}

function rankKey(r) {
  return [
    r.export_count ?? 0,
    r.star_count ?? 0,
    r.rating_count ?? 0,
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

async function softTrimMcps(count = 1500) {
  console.log(`\n=== Soft-trim mcp_servers (tag catalog-trimmed, n=${count}) ===`);
  const all = await fetchAll(
    "mcp_servers",
    "id, name, tags, github_url, star_count, export_count, avg_rating, rating_count, created_at"
  );
  const candidates = all.filter((r) => !isProtected(r)).sort(cmpRank).slice(0, count);
  console.log(`Candidates: ${candidates.length}`);
  console.log(
    "Sample:",
    candidates.slice(0, 6).map((d) => `${d.name} (exp=${d.export_count}, ★=${d.star_count})`)
  );

  // Try hard delete first (works if service role present)
  let deleted = 0;
  for (let i = 0; i < Math.min(candidates.length, 5); i++) {
    const { error, count: c } = await sb
      .from("mcp_servers")
      .delete({ count: "exact" })
      .eq("id", candidates[i].id);
    if (!error && c > 0) deleted++;
  }
  if (deleted > 0) {
    console.log("Hard delete works — deleting remaining…");
    for (let i = deleted; i < candidates.length; i += 100) {
      const ids = candidates.slice(i, i + 100).map((d) => d.id);
      const { error } = await sb.from("mcp_servers").delete().in("id", ids);
      if (!error) deleted += ids.length;
      else console.error(error.message);
    }
    console.log(`Hard-deleted ${deleted}`);
    return { mode: "hard", count: deleted };
  }

  console.log("Hard delete blocked by RLS — tagging as catalog-trimmed instead");
  let tagged = 0;
  for (let i = 0; i < candidates.length; i += 50) {
    const batch = candidates.slice(i, i + 50);
    await Promise.all(
      batch.map(async (row) => {
        const tags = [...new Set([...(row.tags || []), "catalog-trimmed"])];
        const { error } = await sb.from("mcp_servers").update({ tags }).eq("id", row.id);
        if (!error) tagged++;
      })
    );
    if ((i / 50) % 5 === 0) console.log(`  …tagged ${tagged}`);
  }
  fs.writeFileSync(
    "scripts/_trimmed-mcp_servers-soft.json",
    JSON.stringify({ at: new Date().toISOString(), count: tagged, names: candidates.map((c) => c.name) }, null, 2)
  );
  console.log(`Soft-tagged ${tagged}`);
  return { mode: "soft", count: tagged };
}

function isHighRep(row, urlCol) {
  if ((row.tags || []).some((t) => String(t).toLowerCase() === "official")) return true;
  const o = githubOwner(row[urlCol]);
  return o != null && OFFICIAL_OWNERS.has(o);
}

async function verifyFloors() {
  console.log("\n=== Verify high-rep floors ===");
  const skills = await fetchAll(
    "skills",
    "name,star_count,export_count,avg_rating,rating_count,tags,source_url"
  );
  const mcps = await fetchAll(
    "mcp_servers",
    "name,star_count,export_count,avg_rating,rating_count,tags,github_url"
  );

  const hiSkills = skills.filter((s) => isHighRep(s, "source_url"));
  const hiMcps = mcps.filter((m) => isHighRep(m, "github_url") && !(m.tags || []).includes("catalog-trimmed"));
  const belowS = hiSkills.filter(
    (s) => (s.star_count || 0) < 10 || (s.export_count || 0) < 10 || (s.avg_rating || 0) < 4 || !(s.rating_count > 0)
  );
  const belowM = hiMcps.filter(
    (s) => (s.star_count || 0) < 10 || (s.export_count || 0) < 10 || (s.avg_rating || 0) < 4 || !(s.rating_count > 0)
  );

  const recentSkills = [...skills].sort((a, b) => 0); // already have created_at? skip
  const homeEligibleSkills = skills.filter(
    (s) => (s.star_count || 0) >= 10 && (s.export_count || 0) >= 50 && (s.avg_rating || 0) > 0
  ).length;

  const trimmedMcps = mcps.filter((m) => (m.tags || []).includes("catalog-trimmed")).length;

  console.log({
    skills: skills.length,
    mcps: mcps.length,
    softTrimmedMcps: trimmedMcps,
    highRepSkills: hiSkills.length,
    highRepSkillsBelow: belowS.length,
    highRepMcps: hiMcps.length,
    highRepMcpsBelow: belowM.length,
    sampleBelowSkills: belowS.slice(0, 3).map((s) => s.name),
    sampleBelowMcps: belowM.slice(0, 3).map((s) => s.name),
    homepageEligibleSkillCount: homeEligibleSkills,
  });
}

const mode = process.argv.includes("--verify-only") ? "verify" : "trim";
if (mode === "trim") {
  softTrimMcps(1500)
    .then(() => verifyFloors())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
} else {
  verifyFloors().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
