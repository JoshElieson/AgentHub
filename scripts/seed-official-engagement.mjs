// ════════════════════════════════════════════════════════════════════════════
// Seed "official-tier" engagement on top of the base fake engagement:
//   1. Every OFFICIAL skill / MCP server gets > 20 thumbs-up (tops up to 21–50).
//   2. Ratings:
//        • official  → avg 4.5+   (skills: integer 4/5 rating rows; MCP: column)
//        • the rest  → ~50% unrated; rated ones land in 3.0–5.0
//
// SEPARABILITY (same scheme as seed-fake-engagement.mjs — anon_id 'seed-fake-%'):
//   • like top-ups   → rows in *_stars  with anon_id 'seed-fake-off-<n>'
//   • skill ratings  → rows in skill_ratings with anon_id 'seed-fake-r-<n>'
//   • MCP ratings    → mcp_servers.avg_rating/rating_count set directly (there is
//                      NO mcp_ratings table and no rate route, so no REAL MCP
//                      rating data exists to preserve; removal resets them to 0).
// All recoverable via supabase/remove-fake-engagement.sql.
//
// "Official" mirrors isOfficial() in src/lib/marketplace-data.ts: tagged
// "official" OR the source/github repo owner is a known first-party vendor.
//
// IDEMPOTENT: clears its own tagged rows + recomputes real baselines first.
// RUN:  node scripts/seed-official-engagement.mjs
// ════════════════════════════════════════════════════════════════════════════
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}
const sb = createClient(url, key);

const LIKE_TOPUP_ANON = "seed-fake-off-"; // distinct namespace, still matches seed-fake-%
const RATING_ANON = "seed-fake-r-";

// ── official detection (kept in sync with src/lib/marketplace-data.ts) ───────
const OFFICIAL_OWNERS = new Set([
  "anthropics", "anthropic", "modelcontextprotocol", "openai", "google",
  "googleapis", "google-gemini", "microsoft", "github", "stripe", "cloudflare",
  "huggingface", "vercel", "vercel-labs", "supabase", "hashicorp", "mongodb",
  "elastic", "redis", "aws", "awslabs", "amazon", "atlassian", "notionhq",
  "slackapi", "figma", "netlify", "prisma", "docker", "gitlab", "sentry", "grafana",
]);
function githubOwner(u) {
  if (!u) return null;
  const m = u.match(/github\.com\/([^/]+)/i);
  return m ? m[1].toLowerCase() : null;
}
function isOfficial(tags, sourceUrl) {
  if ((tags ?? []).some((t) => String(t).toLowerCase() === "official")) return true;
  const owner = githubOwner(sourceUrl);
  return owner != null && OFFICIAL_OWNERS.has(owner);
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.random() * (max - min) + min;
const round2 = (n) => Math.round(n * 100) / 100;

async function fetchAll(table, columns, filter) {
  const out = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let q = sb.from(table).select(columns).range(from, from + pageSize - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}
async function insertChunked(table, rows, size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + size));
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
}
async function pool(items, worker, concurrency = 25) {
  let idx = 0, done = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i], i);
      if (++done % 300 === 0) console.log(`   …${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
}

// Generate integer ratings whose mean (blended with a real baseline) clears `floor`.
function ratingsWithMin(n, floor) {
  // start mostly 5s
  const r = Array.from({ length: n }, () => (Math.random() < 0.8 ? 5 : 4));
  const mean = () => r.reduce((a, b) => a + b, 0) / r.length;
  for (let i = 0; i < r.length && mean() < floor; i++) if (r[i] === 4) r[i] = 5;
  return r;
}

async function seedKind({ label, itemTable, idCol, urlCol, starTable, fkCol, ratingTable }) {
  console.log(`\n=== ${label} ===`);
  const items = await fetchAll(
    itemTable,
    `${idCol}, tags, ${urlCol}, star_count`
  );
  const officials = items.filter((it) => isOfficial(it.tags, it[urlCol]));
  console.log(`${items.length} ${label} (${officials.length} official).`);

  // ── 1) LIKES: ensure every official item has > 20 ──────────────────────────
  // Reset our own top-up namespace, then recompute the authoritative per-item
  // like count from the surviving rows (real + base seed-fake-<n>).
  await sb.from(starTable).delete().like("anon_id", `${LIKE_TOPUP_ANON}%`);
  const starRows = await fetchAll(starTable, `${fkCol}`); // all remaining like rows
  const likeCount = new Map();
  for (const r of starRows) likeCount.set(r[fkCol], (likeCount.get(r[fkCol]) ?? 0) + 1);

  const topupRows = [];
  const starUpdates = [];
  for (const it of officials) {
    const cur = likeCount.get(it[idCol]) ?? 0;
    if (cur > 20) continue;
    const target = randInt(21, 50);
    const needed = target - cur;
    for (let i = 1; i <= needed; i++)
      topupRows.push({ [fkCol]: it[idCol], anon_id: `${LIKE_TOPUP_ANON}${i}` });
    starUpdates.push({ id: it[idCol], star_count: target });
  }
  console.log(`Likes: topping up ${starUpdates.length} official items below 21 (+${topupRows.length} rows)…`);
  await insertChunked(starTable, topupRows);
  await pool(starUpdates, async (u) => {
    const { error } = await sb.from(itemTable).update({ star_count: u.star_count }).eq(idCol, u.id);
    if (error) throw new Error(`star_count ${u.id}: ${error.message}`);
  });

  // ── 2) RATINGS ─────────────────────────────────────────────────────────────
  if (ratingTable) {
    // Row-backed ratings (skills). Reset our tagged rows, recompute real base.
    await sb.from(ratingTable).delete().like("anon_id", `${RATING_ANON}%`);
    const realRows = await fetchAll(ratingTable, `${fkCol}, rating`, (q) =>
      q.not("anon_id", "like", "seed-fake-%")
    );
    const realSum = new Map(), realCnt = new Map();
    for (const r of realRows) {
      realSum.set(r[fkCol], (realSum.get(r[fkCol]) ?? 0) + r.rating);
      realCnt.set(r[fkCol], (realCnt.get(r[fkCol]) ?? 0) + 1);
    }

    const ratingRows = [];
    const aggUpdates = [];
    for (const it of items) {
      const id = it[idCol];
      const official = isOfficial(it.tags, it[urlCol]);
      let generated = [];
      if (official) {
        generated = ratingsWithMin(randInt(8, 40), 4.5);
      } else if (Math.random() < 0.5) {
        // rated non-official: integers in 3..5 → mean in [3,5]
        generated = Array.from({ length: randInt(5, 30) }, () => randInt(3, 5));
      } // else: ~50% unrated → no rows

      generated.forEach((rating, i) =>
        ratingRows.push({ [fkCol]: id, anon_id: `${RATING_ANON}${i + 1}`, rating })
      );

      const sum = (realSum.get(id) ?? 0) + generated.reduce((a, b) => a + b, 0);
      const cnt = (realCnt.get(id) ?? 0) + generated.length;
      aggUpdates.push({ id, avg_rating: cnt ? round2(sum / cnt) : 0, rating_count: cnt });
    }
    console.log(`Ratings: inserting ${ratingRows.length} rating rows; updating ${aggUpdates.length} aggregates…`);
    await insertChunked(ratingTable, ratingRows);
    await pool(aggUpdates, async (u) => {
      const { error } = await sb
        .from(itemTable)
        .update({ avg_rating: u.avg_rating, rating_count: u.rating_count })
        .eq(idCol, u.id);
      if (error) throw new Error(`rating agg ${u.id}: ${error.message}`);
    });
  } else {
    // Column-only ratings (MCP servers): no ledger table exists.
    const aggUpdates = items.map((it) => {
      const id = it[idCol];
      if (isOfficial(it.tags, it[urlCol]))
        return { id, avg_rating: round2(randFloat(4.5, 5.0)), rating_count: randInt(8, 40) };
      if (Math.random() < 0.5) return { id, avg_rating: 0, rating_count: 0 };
      return { id, avg_rating: round2(randFloat(3.0, 5.0)), rating_count: randInt(5, 30) };
    });
    console.log(`Ratings (column-only): updating ${aggUpdates.length} MCP aggregates…`);
    await pool(aggUpdates, async (u) => {
      const { error } = await sb
        .from(itemTable)
        .update({ avg_rating: u.avg_rating, rating_count: u.rating_count })
        .eq(idCol, u.id);
      if (error) throw new Error(`mcp rating ${u.id}: ${error.message}`);
    });
  }
  console.log(`Done: ${label}.`);
}

(async () => {
  await seedKind({
    label: "skills", itemTable: "skills", idCol: "id", urlCol: "source_url",
    starTable: "skill_stars", fkCol: "skill_id", ratingTable: "skill_ratings",
  });
  await seedKind({
    label: "MCP servers", itemTable: "mcp_servers", idCol: "id", urlCol: "github_url",
    starTable: "mcp_stars", fkCol: "server_id", ratingTable: null,
  });
  console.log("\n✅ Official-tier engagement seeded. Remove with supabase/remove-fake-engagement.sql");
})().catch((e) => {
  console.error("\n❌ Failed:", e.message);
  process.exit(1);
});
