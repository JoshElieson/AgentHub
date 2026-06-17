// ─────────────────────────────────────────────────────────────────────────────
// Harvest Claude Skills from sickn33/antigravity-awesome-skills into a JSON file
// (scripts/harvested-skills.json) that the existing inserter can consume.
//
//   node scripts/harvest-antigravity-skills.mjs [options]
//
// Options:
//   --repo-dir=<path>     Use an already-cloned/extracted repo on disk instead of
//                         fetching SKILL.md files over the network (offline re-runs).
//                         Expects <path>/skills_index.json + <path>/skills/<name>/SKILL.md
//   --include-risky       Keep skills flagged critical/offensive in the index.
//   --lang=all            Disable the English-only gate (default: en).
//   --limit=<n>           Only process the first <n> index entries (debugging).
//   --concurrency=<n>     Parallel SKILL.md fetches (default 16).
//   --out=<path>          Output JSON path (default scripts/harvested-skills.json).
//
// Source license: code MIT, content CC BY 4.0 → we preserve source_url for attribution.
// Classification (category/model) is NOT stored here — it lives in
// src/lib/skill-classification.ts and is applied at normalize time. Unknown names
// fall back to the keyword heuristic, so no per-skill DB work is needed.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

const REPO = "sickn33/antigravity-awesome-skills";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const TREE_BASE = `https://github.com/${REPO}/tree/${BRANCH}`;

// ── arg parsing ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name) {
  return args.includes(`--${name}`);
}
function opt(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const REPO_DIR = opt("repo-dir", null);
const INCLUDE_RISKY = flag("include-risky");
const LANG = opt("lang", "en");
const LIMIT = parseInt(opt("limit", "0"), 10) || 0;
const CONCURRENCY = parseInt(opt("concurrency", "16"), 10) || 16;
const OUT_PATH = opt("out", path.join(process.cwd(), "scripts", "harvested-skills.json"));

const MAX_BODY = 80_000; // cap markdown_instructions (~80 KB)
const MAX_DESC = 1024; // SKILL.md frontmatter constraint
const MIN_DESC = 20;
const MIN_BODY = 400; // raw body length
const MIN_PROSE = 200; // body length after stripping links/headings/code

// ── frontmatter parser (ported verbatim from scripts/ingest-local-skills.mjs) ──
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
        const val = line
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

// ── tag generation (ported from src/app/api/skills/ingest/route.ts) ───────────
function generateTags(name, description, content) {
  const tagsSet = new Set();
  const fullText = `${name} ${description} ${content}`.toLowerCase();
  const keywordMap = {
    react: ["react", "frontend"],
    nextjs: ["react", "frontend"],
    jsx: ["react", "frontend"],
    accessibility: ["accessibility", "frontend"],
    a11y: ["accessibility", "frontend"],
    git: ["git", "development"],
    commit: ["git", "development"],
    github: ["git", "development"],
    security: ["security"],
    owasp: ["security"],
    audit: ["security"],
    jailbreak: ["security"],
    injection: ["security"],
    mcp: ["mcp"],
    "model context": ["mcp"],
    test: ["testing"],
    jest: ["testing"],
    vitest: ["testing"],
    pytest: ["testing"],
    coverage: ["testing"],
    sql: ["database", "sql"],
    postgres: ["database", "sql"],
    database: ["database"],
    supabase: ["database", "supabase"],
    css: ["design", "ui"],
    ui: ["ui"],
    design: ["design", "ui"],
    animation: ["design", "ui"],
    workflow: ["automation"],
    automation: ["automation"],
    python: ["python"],
    cli: ["cli"],
    bash: ["cli"],
    terminal: ["cli"],
  };
  for (const [key, tags] of Object.entries(keywordMap)) {
    // Word-boundary match so short keys like "ui" don't match inside "build",
    // "require", "gui" etc. (which otherwise stamps a spurious "ui" tag on
    // nearly everything and poisons the category heuristic).
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(fullText)) tags.forEach((t) => tagsSet.add(t));
  }
  if (tagsSet.size === 0) tagsSet.add("general");
  return Array.from(tagsSet);
}

// ── trigger phrases (ported from src/app/api/skills/ingest/route.ts) ──────────
function generateTriggerPhrases(name) {
  const parts = name.split("-");
  if (parts.length > 1) {
    return [parts.join(" "), `run ${parts.join(" ")}`, parts.slice(1).join(" ")];
  }
  return [name, `run ${name}`];
}

// ── helpers ──────────────────────────────────────────────────────────────────
function sanitizeName(raw) {
  // strip leading numeric organizational prefixes (00-, 01- …), then slugify
  let n = String(raw || "").trim();
  n = n.replace(/^\d+[-_]/, "");
  n = n.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return n.slice(0, 64).replace(/-$/, "");
}

// Postgres text cannot store NUL / other C0-C1 control chars or unpaired UTF-16
// surrogates — they cause "unsupported Unicode escape sequence" on insert.
// Done via code-point iteration to avoid embedding control bytes in this source.
function sanitizeText(s) {
  let out = "";
  for (const ch of String(s || "")) {
    const c = ch.codePointAt(0);
    if (c < 0x20 && c !== 9 && c !== 10 && c !== 13) continue; // C0 controls (keep \t \n \r)
    if (c >= 0x7f && c <= 0x9f) continue; // DEL + C1 controls
    if (c >= 0xd800 && c <= 0xdfff) continue; // lone surrogates
    out += ch;
  }
  return out;
}

function strippedProseLength(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ") // links / images
    .replace(/^#{1,6}\s.*$/gm, " ") // headings
    .replace(/[>*_|#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

// Language detection over the DESCRIPTION (the user-facing / activation text):
// flag predominantly non-Latin script, or Latin-script with clear foreign
// evidence and almost no English. Keeps English skills that merely mention a
// foreign term. Mirrors scripts/remove-non-english-skills.mjs.
const EN_STOP = new Set(
  ('the be to of and a in that have it for not on with he as you do at this but his by from they we say her ' +
    'she or an will my one all would there their what so up out if about who get which go me when make can like ' +
    'time no just him know take into year your good some could them see other than then now look only come its ' +
    'over think also use two how our work first well way even new want because any these give day most us is are ' +
    'was were has had been being does did should must more such using where while each between through after ' +
    'before here help create build write code file user data app').split(/\s+/)
);
const FOREIGN_STOP = new Set(
  ('de la el los las en un una uno y que para con del por sus como más este esta estas estos pero muy son está ' +
    'están también cuando donde desde hacia sobre entre sin ser hacer puede debe necesita usuario archivo ' +
    'siguiente análisis español datos você não são então isso aqui fazer seu sua usuário deve guia ferramenta ' +
    'dos das da uma le les des une pour avec vous votre dans cette plus sont être faire peut doit lorsque ' +
    'fichier utilisateur ainsi aussi comme nous vos lors et du au aux ce cet il lo gli della dei che questo ' +
    'questa sono essere può deve quando dove uno utente per der die das und für mit ein eine ist den von auf ' +
    'wie sie ihre werden kann muss wenn oder auch sich nicht dass einen einem dieser diese benutzer datei').split(/\s+/)
);
const NON_LATIN_RE = /[Ͱ-ϿЀ-ӿ֐-׿؀-ۿऀ-ॿ฀-๿぀-ヿ㐀-䶿一-鿿가-힯]/g;
const DIACRITIC_RE = /[áéíóúüñàâãäçèêëìîïòôõùûœ]/i;

function isNonEnglish(name, description) {
  const desc = (description || "").trim();
  const letters = (desc.match(/\p{L}/gu) || []).length;
  const nonLatin = (desc.match(NON_LATIN_RE) || []).length;
  if (letters >= 4 && nonLatin / letters > 0.15) return true;

  const words = (`${name} ${desc}`.toLowerCase().match(/[\p{L}][\p{L}'’]*/gu) || []);
  if (words.length < 6) return false;
  let en = 0;
  let foreign = 0;
  let evidence = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) en++;
    else if (FOREIGN_STOP.has(w)) { foreign++; evidence++; }
    else if (DIACRITIC_RE.test(w)) evidence++;
  }
  const enRatio = en / words.length;
  return (foreign >= 3 && enRatio < 0.1) || (en === 0 && evidence >= 2 && words.length >= 5);
}

const PLACEHOLDER = /^(todo|tbd|placeholder|coming soon|n\/a|none)$/i;

// Map the source index's 86 granular categories onto our 12 catalogue
// categories. This is a far cleaner signal than keyword-scraping the body, and
// is written to the DB `category` column where classifySkill prefers it over
// the heuristic. Unmapped / "uncategorized" → null so the heuristic decides.
const CATEGORY_MAP = {
  development: "development", "web-development": "development", "web-dev": "development",
  backend: "development", frontend: "development", "front-end": "development",
  code: "development", "code-quality": "development", framework: "development",
  mobile: "development", testing: "development", "test-automation": "development",
  architecture: "development", api: "development", programming: "development",
  "game-development": "development",
  cloud: "devops", devops: "devops", reliability: "devops", infrastructure: "devops",
  sre: "devops", deployment: "devops", "ci-cd": "devops",
  security: "security",
  "data-science": "data-science", data: "data-science", database: "data-science",
  analytics: "data-science", "data-ai": "data-science",
  "ai-ml": "research", "ai-agents": "research", ai: "research", "machine-learning": "research",
  ml: "research", science: "research", research: "research", llm: "research",
  design: "design", ux: "design", ui: "design",
  content: "writing", writing: "writing", documentation: "writing", docs: "writing",
  legal: "writing",
  marketing: "marketing", seo: "marketing", growth: "marketing", sales: "marketing",
  "api-integration": "integrations", integration: "integrations", integrations: "integrations",
  business: "productivity", "project-management": "productivity", productivity: "productivity",
  workflow: "productivity", automation: "productivity", "workflow-bundle": "productivity",
  "granular-workflow-bundle": "productivity", meta: "productivity", "agent-squad": "productivity",
  health: "productivity", finance: "productivity",
  education: "education", learning: "education", tutorial: "education",
  "browser-automation": "browser-automation", scraping: "browser-automation",
};

function mapCategory(indexCategory) {
  return CATEGORY_MAP[String(indexCategory || "").toLowerCase()] ?? null;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// bounded-concurrency map
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

// ── load index ───────────────────────────────────────────────────────────────
async function loadIndex() {
  if (REPO_DIR) {
    const p = path.join(REPO_DIR, "skills_index.json");
    return JSON.parse(fs.readFileSync(p, "utf8"));
  }
  console.log("⬇️  Fetching skills_index.json …");
  return JSON.parse(await fetchText(`${RAW_BASE}/skills_index.json`));
}

async function loadSkillMd(entry) {
  if (REPO_DIR) {
    const p = path.join(REPO_DIR, entry.path, "SKILL.md");
    return fs.readFileSync(p, "utf8");
  }
  return fetchText(`${RAW_BASE}/${entry.path}/SKILL.md`);
}

// ── main ─────────────────────────────────────────────────────────────────────
async function run() {
  let index = await loadIndex();
  if (!Array.isArray(index)) {
    console.error("❌ skills_index.json is not an array — aborting.");
    process.exit(1);
  }
  if (LIMIT) index = index.slice(0, LIMIT);
  console.log(`📦 Index has ${index.length} entries.\n`);

  const drops = {
    risk: 0,
    fetch: 0,
    badName: 0,
    badDescription: 0,
    placeholderDescription: 0,
    thinBody: 0,
    nonEnglish: 0,
    dupeInRun: 0,
  };

  // 1. risk gate (before any network fetch). The index marks the bulk of skills
  // "unknown" (simply unrated, not dangerous) — only `critical` and `offensive`
  // are genuine danger signals, so we deny-list those rather than allow-list safe.
  const RISKY = new Set(["critical", "offensive"]);
  const candidates = index.filter((e) => {
    if (!INCLUDE_RISKY && RISKY.has(String(e.risk || "").toLowerCase())) {
      drops.risk++;
      return false;
    }
    return true;
  });

  console.log(`🌐 Fetching ${candidates.length} SKILL.md files (concurrency ${CONCURRENCY})…`);
  let fetched = 0;
  const fetchedBodies = await mapPool(candidates, CONCURRENCY, async (entry) => {
    try {
      const text = await loadSkillMd(entry);
      fetched++;
      if (fetched % 200 === 0) console.log(`   …${fetched}/${candidates.length}`);
      return { entry, text };
    } catch (e) {
      drops.fetch++;
      return null;
    }
  });

  // 2. parse + quality filter + dedup
  const seen = new Set();
  const skills = [];

  for (const item of fetchedBodies) {
    if (!item) continue;
    const { entry, text } = item;
    const folderName = entry.path.split("/").pop() || entry.name;

    const { name: rawName, description: rawDesc, markdown_instructions } =
      parseFrontmatter(text, folderName);

    // name (folder name is the uniqueness + classification key)
    const name = sanitizeName(folderName || rawName);
    if (!name || name.length < 2) {
      drops.badName++;
      continue;
    }

    // description
    let description = sanitizeText((rawDesc || entry.description || "").trim());
    if (PLACEHOLDER.test(description)) {
      drops.placeholderDescription++;
      continue;
    }
    if (description.length < MIN_DESC) {
      drops.badDescription++;
      continue;
    }
    if (description.length > MAX_DESC) description = description.slice(0, MAX_DESC - 1).trim() + "…";

    // body
    let body = sanitizeText((markdown_instructions || "").trim());
    if (body.length < MIN_BODY || strippedProseLength(body) < MIN_PROSE) {
      drops.thinBody++;
      continue;
    }
    if (body.length > MAX_BODY) {
      const sourceUrl = `${TREE_BASE}/${entry.path}`;
      body = body.slice(0, MAX_BODY).trim() + `\n\n…(truncated — see full skill at ${sourceUrl})`;
    }

    // language gate (description-based; see isNonEnglish)
    if (LANG === "en" && isNonEnglish(name, description)) {
      drops.nonEnglish++;
      continue;
    }

    // in-run dedup (keep first / longer body)
    if (seen.has(name)) {
      const prev = skills.find((s) => s.name === name);
      if (prev && body.length > prev.markdown_instructions.length) {
        prev.markdown_instructions = body;
        prev.description = description;
      }
      drops.dupeInRun++;
      continue;
    }
    seen.add(name);

    // derive tags / triggers / source
    const tags = generateTags(name, description, body);
    const cat = String(entry.category || "").toLowerCase();
    if (cat && /^[a-z0-9-]{2,20}$/.test(cat) && !tags.includes(cat)) tags.push(cat);

    skills.push({
      name,
      description,
      trigger_phrases: generateTriggerPhrases(name),
      markdown_instructions: body,
      tags,
      script_urls: [],
      source_url: `${TREE_BASE}/${entry.path}`,
      // Data-driven classification from the source index (null → heuristic).
      category: mapCategory(entry.category),
      model: ["universal"],
    });
  }

  // 3. write output
  fs.writeFileSync(OUT_PATH, JSON.stringify({ skills }, null, 2));

  // 4. summary
  console.log(`\n📊 Harvest summary`);
  console.log(`   index entries:      ${index.length}`);
  console.log(`   dropped (risk):     ${drops.risk}`);
  console.log(`   dropped (fetch):    ${drops.fetch}`);
  console.log(`   dropped (name):     ${drops.badName}`);
  console.log(`   dropped (desc):     ${drops.badDescription + drops.placeholderDescription}`);
  console.log(`   dropped (thin body):${drops.thinBody}`);
  console.log(`   dropped (non-en):   ${drops.nonEnglish}`);
  console.log(`   dropped (dupe):     ${drops.dupeInRun}`);
  console.log(`   ✅ kept:            ${skills.length}`);
  console.log(`\n💾 Wrote ${skills.length} skills → ${OUT_PATH}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
