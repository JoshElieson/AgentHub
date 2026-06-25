// ─────────────────────────────────────────────────────────────────────────────
// Harvest scientific agent skills from K-Dense-AI/scientific-agent-skills
// into a JSON file that insert-researched-skills.mjs can consume.
//
//   node scripts/harvest-kdense-skills.mjs [options]
//
// Options:
//   --limit=<n>           Only process the first <n> skills (debugging).
//   --concurrency=<n>     Parallel SKILL.md fetches (default 10).
//   --out=<path>          Output JSON path (default scripts/kdense-skills.json).
//
// This script:
//   1. Lists all subdirectories under skills/ via the GitHub API
//   2. Downloads each SKILL.md from raw.githubusercontent.com
//   3. Parses frontmatter for name + description
//   4. Generates tags, trigger phrases, and source URLs
//   5. Writes a JSON file in the same format as harvested-skills.json
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

const REPO = "K-Dense-AI/scientific-agent-skills";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const TREE_BASE = `https://github.com/${REPO}/tree/${BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REPO}/contents/skills`;

// ── arg parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function opt(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const LIMIT = parseInt(opt("limit", "0"), 10) || 0;
const CONCURRENCY = parseInt(opt("concurrency", "10"), 10) || 10;
const OUT_PATH = opt("out", path.join(process.cwd(), "scripts", "kdense-skills.json"));

const MAX_BODY = 80_000;
const MAX_DESC = 1024;
const MIN_DESC = 10;
const MIN_BODY = 100;

// ── frontmatter parser ──────────────────────────────────────────────────────
function parseFrontmatter(textContent, folderName) {
  let name = folderName;
  let description = "";
  let markdown_instructions = textContent;

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const frontmatterMatch = textContent.match(frontmatterRegex);

  if (frontmatterMatch) {
    const yamlText = frontmatterMatch[1];
    markdown_instructions = textContent.replace(frontmatterRegex, "").trim();

    const lines = yamlText.split("\n");
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        let val = line
          .slice(colonIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
          .trim();

        if (key === "name") name = val;
        else if (key === "description") description = val;
      }
    }
  }

  return { name, description, markdown_instructions };
}

// ── tag generation ──────────────────────────────────────────────────────────
function generateTags(name, description, content) {
  const tagsSet = new Set();
  const fullText = `${name} ${description} ${content}`.toLowerCase();

  // Science-specific keywords
  const keywordMap = {
    // Biology & Genomics
    "protein": ["biology", "science"],
    "genome": ["genomics", "biology", "science"],
    "sequence": ["biology", "science"],
    "gene": ["genomics", "biology", "science"],
    "rna": ["genomics", "biology", "science"],
    "dna": ["genomics", "biology", "science"],
    "phylogen": ["biology", "science"],
    "bioinformatics": ["bioinformatics", "biology", "science"],
    "biopython": ["biology", "python", "science"],
    "alignment": ["biology", "science"],
    "variant": ["genomics", "biology", "science"],
    "scrnaseq": ["genomics", "biology", "science"],
    "single-cell": ["genomics", "biology", "science"],
    "rnaseq": ["genomics", "biology", "science"],

    // Chemistry & Drug Discovery
    "molecule": ["chemistry", "science"],
    "chemical": ["chemistry", "science"],
    "drug": ["drug-discovery", "chemistry", "science"],
    "docking": ["drug-discovery", "chemistry", "science"],
    "smiles": ["chemistry", "science"],
    "rdkit": ["chemistry", "python", "science"],
    "compound": ["chemistry", "science"],
    "pharma": ["drug-discovery", "science"],

    // Clinical & Medical
    "clinical": ["clinical", "medical", "science"],
    "patient": ["clinical", "medical", "science"],
    "diagnosis": ["medical", "science"],
    "medical": ["medical", "science"],
    "health": ["medical", "science"],
    "fda": ["regulatory", "medical", "science"],
    "hipaa": ["regulatory", "medical", "science"],

    // Data Analysis
    "data analysis": ["data-science", "science"],
    "statistical": ["statistics", "data-science", "science"],
    "visualization": ["data-science", "science"],
    "pandas": ["data-science", "python"],
    "numpy": ["data-science", "python"],
    "matplotlib": ["data-science", "python"],

    // Lab & Research
    "laboratory": ["lab", "science"],
    "experiment": ["research", "science"],
    "hypothesis": ["research", "science"],
    "literature": ["research", "science"],
    "citation": ["research", "science"],
    "paper": ["research", "science"],
    "pubmed": ["research", "biology", "science"],
    "arxiv": ["research", "science"],
    "latex": ["writing", "research", "science"],

    // Computational Science
    "simulation": ["simulation", "science"],
    "modeling": ["modeling", "science"],
    "quantum": ["physics", "science"],
    "astro": ["astronomy", "science"],

    // General tech
    "python": ["python"],
    "api": ["api"],
    "database": ["database"],
    "machine learning": ["ai-ml", "science"],
    "deep learning": ["ai-ml", "science"],
    "neural network": ["ai-ml", "science"],
  };

  for (const [key, tags] of Object.entries(keywordMap)) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i");
    if (re.test(fullText)) tags.forEach((t) => tagsSet.add(t));
  }

  // Always add science tag for this repo
  tagsSet.add("science");

  if (tagsSet.size <= 1) tagsSet.add("research");
  return Array.from(tagsSet);
}

// ── trigger phrases ──────────────────────────────────────────────────────────
function generateTriggerPhrases(name) {
  const parts = name.split("-");
  if (parts.length > 1) {
    return [parts.join(" "), `run ${parts.join(" ")}`, parts.slice(1).join(" ")];
  }
  return [name, `run ${name}`, `${name} skill`];
}

// ── text sanitization ────────────────────────────────────────────────────────
function sanitizeName(raw) {
  let n = String(raw || "").trim();
  n = n.replace(/^\d+[-_]/, "");
  n = n.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return n.slice(0, 64).replace(/-$/, "");
}

function sanitizeText(s) {
  let out = "";
  for (const ch of String(s || "")) {
    const c = ch.codePointAt(0);
    if (c < 0x20 && c !== 9 && c !== 10 && c !== 13) continue;
    if (c >= 0x7f && c <= 0x9f) continue;
    if (c >= 0xd800 && c <= 0xdfff) continue;
    out += ch;
  }
  return out;
}

// ── bounded-concurrency map ──────────────────────────────────────────────────
async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ── fetch helpers ────────────────────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "AgentHub-Harvester" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "AgentHub-Harvester" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n🧬 Harvesting skills from ${REPO}...\n`);

  // 1. List all skill directories via GitHub API
  console.log("📂 Fetching skill directory listing...");
  const entries = await fetchJSON(API_BASE);
  let skillDirs = entries.filter((e) => e.type === "dir").map((e) => e.name);

  console.log(`   Found ${skillDirs.length} skill directories.\n`);

  if (LIMIT) {
    skillDirs = skillDirs.slice(0, LIMIT);
    console.log(`   (Limited to first ${LIMIT})\n`);
  }

  // 2. Download all SKILL.md files
  console.log(`🌐 Fetching ${skillDirs.length} SKILL.md files (concurrency ${CONCURRENCY})...\n`);
  let fetched = 0;
  let fetchErrors = 0;

  const results = await mapPool(skillDirs, CONCURRENCY, async (dirName) => {
    const url = `${RAW_BASE}/skills/${dirName}/SKILL.md`;
    try {
      const text = await fetchText(url);
      fetched++;
      if (fetched % 20 === 0) console.log(`   ...${fetched}/${skillDirs.length}`);
      return { dirName, text };
    } catch (e) {
      fetchErrors++;
      console.error(`   ⚠️  Failed to fetch ${dirName}: ${e.message}`);
      return null;
    }
  });

  // 3. Parse and build skills array
  const skills = [];
  const seen = new Set();
  let skippedDesc = 0;
  let skippedBody = 0;
  let skippedDupe = 0;

  for (const item of results) {
    if (!item) continue;
    const { dirName, text } = item;

    const { name: rawName, description: rawDesc, markdown_instructions } =
      parseFrontmatter(text, dirName);

    const name = sanitizeName(dirName || rawName);
    if (!name || name.length < 2) continue;

    // Dedup
    if (seen.has(name)) { skippedDupe++; continue; }
    seen.add(name);

    // Description
    let description = sanitizeText((rawDesc || "").trim());
    if (description.length < MIN_DESC) {
      // Try to extract description from first paragraph of body
      const firstPara = (markdown_instructions || "")
        .replace(/^#.*$/gm, "")
        .trim()
        .split("\n\n")[0]
        ?.trim();
      if (firstPara && firstPara.length >= MIN_DESC) {
        description = firstPara.slice(0, MAX_DESC);
      } else {
        description = `Scientific agent skill: ${name.replace(/-/g, " ")}`;
      }
    }
    if (description.length > MAX_DESC) {
      description = description.slice(0, MAX_DESC - 1).trim() + "…";
    }

    // Body
    let body = sanitizeText((markdown_instructions || "").trim());
    if (body.length < MIN_BODY) {
      skippedBody++;
      continue;
    }
    if (body.length > MAX_BODY) {
      const sourceUrl = `${TREE_BASE}/skills/${dirName}`;
      body = body.slice(0, MAX_BODY).trim() + `\n\n…(truncated — see full skill at ${sourceUrl})`;
    }

    // Generate metadata
    const tags = generateTags(name, description, body);
    const trigger_phrases = generateTriggerPhrases(name);
    const source_url = `${TREE_BASE}/skills/${dirName}`;

    skills.push({
      name,
      description,
      trigger_phrases,
      markdown_instructions: body,
      tags,
      script_urls: [],
      source_url,
      category: "research",
      model: ["universal"],
    });
  }

  // 4. Write output
  fs.writeFileSync(OUT_PATH, JSON.stringify({ skills }, null, 2));

  // 5. Summary
  console.log(`\n📊 Harvest summary`);
  console.log(`   skill directories:   ${skillDirs.length}`);
  console.log(`   fetched OK:          ${fetched}`);
  console.log(`   fetch errors:        ${fetchErrors}`);
  console.log(`   skipped (desc):      ${skippedDesc}`);
  console.log(`   skipped (thin body): ${skippedBody}`);
  console.log(`   skipped (dupe):      ${skippedDupe}`);
  console.log(`   ✅ kept:             ${skills.length}`);
  console.log(`\n💾 Wrote ${skills.length} skills → ${OUT_PATH}`);
  console.log(`\n🚀 Next step: node scripts/insert-researched-skills.mjs scripts/kdense-skills.json\n`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
