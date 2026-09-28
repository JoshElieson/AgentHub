/**
 * Harvest Claude/agent skills from the-mega-skill-library CATALOG.tsv,
 * fetching SKILL.md from the mega repo (attributed via source_repo).
 *
 * Strict deny-list + safety/quality gates. Skips sources already fully
 * ingested (antigravity / kdense) unless --include-known.
 *
 *   node scripts/harvest-mega-skills.mjs [--limit=N] [--concurrency=16] [--out=path]
 */
import fs from "fs";
import path from "path";
import {
  DENY_SOURCE_REPOS,
  mapPool,
  normalizeRepo,
  parseFrontmatter,
  sanitizeName,
  validateSkillCandidate,
} from "./lib/catalog-safety.mjs";

const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function opt(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const LIMIT = parseInt(opt("limit", "0"), 10) || 0;
const CONCURRENCY = parseInt(opt("concurrency", "20"), 10) || 20;
const INCLUDE_KNOWN = flag("include-known");
const OUT = path.resolve(
  opt("out", path.join(process.cwd(), "scripts", "harvested-mega-skills.json"))
);
const EXISTING_PATH = path.join(process.cwd(), "scripts", "_existing-skill-names.json");

const MEGA = "thedixitjain/the-mega-skill-library";
const BRANCH = "main";
const RAW = `https://raw.githubusercontent.com/${MEGA}/${BRANCH}`;
const CATALOG_URL = `${RAW}/CATALOG.tsv`;

/** Already bulk-ingested into Nuclexa — skip unless --include-known. */
const KNOWN_INGESTED = new Set([
  "sickn33/antigravity-awesome-skills",
  "sickn33/agentic-awesome-skills",
  "k-dense-ai/scientific-agent-skills",
]);

/** Extra deny: red-team / exploit-heavy / low-trust dumps. */
const EXTRA_DENY = new Set(
  [
    "snailploit/claude-red",
    "mukul975/anthropic-cybersecurity-skills",
    "affaan-m/ecc", // mixed / unverified ECC bundle — skip for safety-first pass
  ].map((s) => s.toLowerCase())
);

const UA = { "User-Agent": "Nuclexa-catalog-harvest/1.0" };

async function fetchText(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.text();
}

function parseCatalog(tsv) {
  const lines = tsv.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split("\t");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = line.split("\t");
    const kind = cols[idx.kind];
    if (kind !== "skill") continue;
    const catalogPath = cols[idx.path];
    if (!catalogPath?.startsWith("library/")) continue;
    rows.push({
      kind,
      category: cols[idx.category] || "",
      name: cols[idx.name] || "",
      path: catalogPath,
      source_repo: cols[idx.source_repo] || "",
      description: cols[idx.description] || cols.slice(idx.description).join("\t") || "",
    });
  }
  return rows;
}

function generateTags(name, description, category) {
  const tags = new Set(["skill"]);
  if (category) {
    const c = category.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 24);
    if (c) tags.add(c);
  }
  const text = `${name} ${description}`.toLowerCase();
  const map = {
    react: "frontend",
    nextjs: "frontend",
    python: "python",
    security: "security",
    devops: "devops",
    docker: "devops",
    kubernetes: "devops",
    postgres: "database",
    database: "database",
    marketing: "marketing",
    design: "design",
    testing: "testing",
    mcp: "mcp",
  };
  for (const [k, t] of Object.entries(map)) {
    if (text.includes(k)) tags.add(t);
  }
  return [...tags].slice(0, 10);
}

async function run() {
  const existing = new Set(
    fs.existsSync(EXISTING_PATH) ? JSON.parse(fs.readFileSync(EXISTING_PATH, "utf8")) : []
  );
  console.log(`🔍 ${existing.size} skill names already in DB`);

  console.log("⬇️  Fetching CATALOG.tsv…");
  const tsv = await fetchText(CATALOG_URL);
  let rows = parseCatalog(tsv);
  console.log(`📦 Catalog skills: ${rows.length}`);

  const drops = {};
  const bump = (r) => {
    drops[r] = (drops[r] || 0) + 1;
  };

  // Filter by source repo policy before network
  rows = rows.filter((row) => {
    const repo = normalizeRepo(row.source_repo);
    if (!repo) {
      bump("no-source-repo");
      return false;
    }
    if (DENY_SOURCE_REPOS.has(repo) || EXTRA_DENY.has(repo)) {
      bump("deny-source-repo");
      return false;
    }
    if (!INCLUDE_KNOWN && KNOWN_INGESTED.has(repo)) {
      bump("already-harvested-source");
      return false;
    }
    // Skip path that isn't a skill folder ending in skill.md-ish — mega stores as path/SKILL.md sometimes
    return true;
  });

  if (LIMIT) rows = rows.slice(0, LIMIT);
  console.log(`🌐 Fetching ${rows.length} skill files (concurrency ${CONCURRENCY})…`);

  let fetched = 0;
  const bodies = await mapPool(rows, CONCURRENCY, async (row) => {
    // Prefer SKILL.md under the catalog path; mega layout is library/.../NAME/SKILL.md or .md
    const candidates = [];
    if (row.path.endsWith(".md")) candidates.push(row.path);
    else {
      candidates.push(`${row.path}/SKILL.md`);
      candidates.push(`${row.path}/skill.md`);
      candidates.push(`${row.path}.md`);
    }
    for (const p of candidates) {
      try {
        const text = await fetchText(`${RAW}/${p}`);
        fetched++;
        if (fetched % 500 === 0) console.log(`   …${fetched}/${rows.length}`);
        return { row, text, resolvedPath: p };
      } catch {
        // try next
      }
    }
    bump("fetch");
    return null;
  });

  const approved = [];
  const rejected = [];
  const seen = new Set([...existing]);

  for (const item of bodies) {
    if (!item) continue;
    const { row, text, resolvedPath } = item;
    const folderName = row.name || row.path.split("/").pop();
    const parsed = parseFrontmatter(text, folderName);
    const name = sanitizeName(folderName);

    const candidate = {
      name,
      description: parsed.description || row.description,
      markdown_instructions: parsed.markdown_instructions,
      tags: generateTags(name, parsed.description || row.description, row.category),
      source_repo: row.source_repo,
      source_url: `https://github.com/${MEGA}/tree/${BRANCH}/${resolvedPath}`,
    };

    // Use a temp set so validateSkillCandidate's already-in-db works, then mark seen
    const v = validateSkillCandidate(candidate, { existingNames: seen });
    if (!v.ok) {
      bump(v.reason);
      rejected.push({ name: candidate.name, reason: v.reason, source_repo: row.source_repo });
      continue;
    }
    // Attribute upstream in tags
    const upstream = normalizeRepo(row.source_repo);
    if (upstream && !v.skill.tags.includes("mega-library")) v.skill.tags.push("mega-library");
    if (upstream) v.skill.tags.push(`src:${upstream.split("/")[0]}`.slice(0, 32));

    seen.add(v.skill.name);
    approved.push(v.skill);
  }

  const payload = {
    harvested_at: new Date().toISOString(),
    source: `https://github.com/${MEGA}`,
    skills: approved,
    meta: { approved: approved.length, rejected: rejected.length, drops },
  };
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  fs.writeFileSync(
    OUT.replace(/\.json$/, ".rejected.json"),
    JSON.stringify({ rejected: rejected.slice(0, 8000), drops }, null, 2)
  );

  console.log("\n📊 Mega skill harvest summary");
  console.log(`   approved: ${approved.length}`);
  console.log(`   rejected: ${rejected.length}`);
  console.log("   drops:", drops);
  console.log(`💾 Wrote ${approved.length} → ${OUT}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
