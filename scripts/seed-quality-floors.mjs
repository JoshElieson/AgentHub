/**
 * Ensure high-reputation (official) items have:
 *   avg_rating ≥ 4.0, rating_count ≥ 1, star_count ≥ 10, export_count ≥ 10
 *
 * And homepage-eligible recent items have:
 *   avg_rating ≥ 4.0, rating_count ≥ 1, star_count ≥ 10, export_count ≥ 50
 *
 * Uses seed-fake-* anon ids (removable via remove-fake-engagement.sql).
 *
 *   node scripts/seed-quality-floors.mjs
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

const HOMEPAGE_NAMES = new Set(
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
    "stripe-best-practices",
    "cloudflare-workers-best-practices",
    "firebase-basics",
    "github",
    "filesystem",
    "memory",
    "fetch",
    "puppeteer",
    "brave-search",
    "postgres",
    "sqlite",
    "slack",
    "notion",
    "stripe",
    "supabase",
    "docker",
    "kubernetes",
  ].map((s) => s.toLowerCase())
);

const FLOOR_ANON = "seed-fake-floor-";
const RATING_ANON = "seed-fake-floor-r-";
const INSTALL_ANON = "seed-fake-floor-installs";

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const round2 = (n) => Math.round(n * 100) / 100;

function githubOwner(u) {
  if (!u) return null;
  const m = String(u).match(/github\.com\/([^/]+)/i);
  return m ? m[1].toLowerCase() : null;
}

function isOfficial(tags, url) {
  if ((tags ?? []).some((t) => String(t).toLowerCase() === "official")) return true;
  const o = githubOwner(url);
  return o != null && OFFICIAL_OWNERS.has(o);
}

function ratingsWithMin(n, floor) {
  const r = Array.from({ length: n }, () => (Math.random() < 0.75 ? 5 : 4));
  const mean = () => r.reduce((a, b) => a + b, 0) / r.length;
  let guard = 0;
  while (mean() < floor && guard++ < 200) {
    const i = r.findIndex((x) => x === 4);
    if (i >= 0) r[i] = 5;
    else break;
  }
  return r;
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

async function insertChunked(table, rows, size = 800) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await sb.from(table).insert(chunk);
    if (!error) continue;
    // Unique conflicts are fine on re-runs — insert row-by-row skipping dupes
    if (/duplicate key|unique constraint/i.test(error.message)) {
      for (const row of chunk) {
        const { error: e2 } = await sb.from(table).insert(row);
        if (e2 && !/duplicate key|unique constraint/i.test(e2.message)) {
          throw new Error(`insert ${table}: ${e2.message}`);
        }
      }
      continue;
    }
    throw new Error(`insert ${table}: ${error.message}`);
  }
}

async function pool(items, worker, concurrency = 30) {
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
}

/**
 * Ensure item meets floors by topping up seed rows + denormalized columns.
 */
async function ensureFloors({
  label,
  itemTable,
  urlCol,
  starTable,
  installTable,
  ratingTable, // null for MCP
  fkCol,
  minStars,
  minExports,
  minRating,
}) {
  console.log(`\n=== ${label} floors (≥${minStars} likes, ≥${minExports} installs, ≥${minRating}★) ===`);

  const items = await fetchAll(
    itemTable,
    `id, name, tags, ${urlCol}, star_count, export_count, avg_rating, rating_count`
  );

  const targets = items.filter((it) => {
    const official = isOfficial(it.tags, it[urlCol]);
    const homepage = HOMEPAGE_NAMES.has(String(it.name).toLowerCase());
    return official || homepage;
  });
  console.log(`Targets: ${targets.length}`);

  // Clear prior floor seed rows for these tables (idempotent)
  await sb.from(starTable).delete().like("anon_id", `${FLOOR_ANON}%`);
  await sb.from(installTable).delete().eq("anon_id", INSTALL_ANON);
  if (ratingTable) {
    await sb.from(ratingTable).delete().like("anon_id", `${RATING_ANON}%`);
  }

  // Recount real stars (non seed-fake)
  const realStars = await fetchAll(starTable, fkCol, undefined);
  // fetchAll doesn't support filter easily here — query non-fake
  const realStarRows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from(starTable)
      .select(fkCol)
      .not("anon_id", "like", "seed-fake-%")
      .range(from, from + 999);
    if (error) throw error;
    realStarRows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const realStarCount = new Map();
  for (const r of realStarRows) {
    realStarCount.set(r[fkCol], (realStarCount.get(r[fkCol]) ?? 0) + 1);
  }

  // Also count existing seed-fake stars (base engagement) so we top up rather than replace
  const seedStarRows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from(starTable)
      .select(`${fkCol}, anon_id`)
      .like("anon_id", "seed-fake-%")
      .range(from, from + 999);
    if (error) throw error;
    seedStarRows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  const seedStarCount = new Map();
  for (const r of seedStarRows) {
    // exclude floor namespace we just cleared
    if (String(r.anon_id).startsWith(FLOOR_ANON)) continue;
    seedStarCount.set(r[fkCol], (seedStarCount.get(r[fkCol]) ?? 0) + 1);
  }

  const starInserts = [];
  const installInserts = [];
  const ratingInserts = [];
  const updates = [];
  const nowIso = new Date().toISOString();

  for (const it of targets) {
    const id = it.id;
    const homepage = HOMEPAGE_NAMES.has(String(it.name).toLowerCase());
    const needStars = homepage ? Math.max(minStars, 10) : minStars;
    const needExports = homepage ? Math.max(minExports, 50) : minExports;

    const currentStars =
      (realStarCount.get(id) ?? 0) + (seedStarCount.get(id) ?? 0);
    const topUp = Math.max(0, needStars - currentStars);
    for (let i = 1; i <= topUp; i++) {
      starInserts.push({ [fkCol]: id, anon_id: `${FLOOR_ANON}${i}` });
    }
    const finalStars = currentStars + topUp;

    const currentExports = it.export_count ?? 0;
    const exportBump = Math.max(0, needExports - currentExports);
    if (exportBump > 0 || homepage) {
      installInserts.push({
        [fkCol]: id,
        anon_id: INSTALL_ANON,
        target: "seed",
        install_count: Math.max(exportBump, needExports),
        first_installed_at: nowIso,
        installed_at: nowIso,
      });
    }
    const finalExports = Math.max(currentExports, needExports);

    let avg = Number(it.avg_rating) || 0;
    let rcount = Number(it.rating_count) || 0;

    if (ratingTable) {
      const n = randInt(10, 28);
      const ratings = ratingsWithMin(n, minRating);
      ratings.forEach((rating, i) =>
        ratingInserts.push({
          [fkCol]: id,
          anon_id: `${RATING_ANON}${i + 1}`,
          rating,
        })
      );
      // blend with existing if any real ratings exist — for simplicity set from seed floor ratings only when below floor
      if (avg < minRating || rcount < 1) {
        avg = round2(ratings.reduce((a, b) => a + b, 0) / ratings.length);
        rcount = ratings.length;
      } else if (avg < minRating) {
        avg = minRating;
      }
    } else {
      // MCP column-only
      if (avg < minRating || rcount < 1) {
        avg = round2(4.0 + Math.random() * 0.95);
        rcount = randInt(10, 40);
      }
    }

    updates.push({
      id,
      star_count: finalStars,
      export_count: finalExports,
      avg_rating: avg,
      rating_count: rcount,
    });
  }

  console.log(
    `Inserting ${starInserts.length} likes, ${installInserts.length} install ledgers, ${ratingInserts.length} ratings…`
  );
  if (starInserts.length) await insertChunked(starTable, starInserts);
  if (installInserts.length) await insertChunked(installTable, installInserts);
  if (ratingTable && ratingInserts.length) await insertChunked(ratingTable, ratingInserts);

  console.log(`Updating ${updates.length} denormalized rows…`);
  await pool(updates, async (u) => {
    const { error } = await sb
      .from(itemTable)
      .update({
        star_count: u.star_count,
        export_count: u.export_count,
        avg_rating: u.avg_rating,
        rating_count: u.rating_count,
      })
      .eq("id", u.id);
    if (error) throw new Error(`update ${u.id}: ${error.message}`);
  });

  // Verify
  let ok = 0;
  let bad = 0;
  for (const u of updates) {
    if (u.star_count >= minStars && u.export_count >= minExports && u.avg_rating >= minRating && u.rating_count >= 1)
      ok++;
    else bad++;
  }
  console.log(`Verified ok=${ok} below-floor=${bad}`);
}

async function boostRecentForHomepage() {
  // Ensure at least 20 recent skills/MCPs meet homepage gate so /api/skills/recent has inventory
  console.log("\n=== Boost recent items for homepage gate ===");
  const [skills, mcps] = await Promise.all([
    sb
      .from("skills")
      .select("id, name, star_count, export_count, avg_rating, rating_count")
      .order("created_at", { ascending: false })
      .limit(80),
    sb
      .from("mcp_servers")
      .select("id, name, star_count, export_count, avg_rating, rating_count")
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const pick = [
    ...(skills.data || []).map((r) => ({ ...r, table: "skills" })),
    ...(mcps.data || []).map((r) => ({ ...r, table: "mcp_servers" })),
  ].slice(0, 40);

  const nowIso = new Date().toISOString();
  for (const it of pick) {
    const starTable = it.table === "skills" ? "skill_stars" : "mcp_stars";
    const installTable = it.table === "skills" ? "skill_installs" : "mcp_installs";
    const fk = it.table === "skills" ? "skill_id" : "server_id";
    const ratingTable = it.table === "skills" ? "skill_ratings" : null;

    const needStars = Math.max(0, 10 - (it.star_count ?? 0));
    const starRows = [];
    for (let i = 1; i <= needStars; i++) {
      starRows.push({ [fk]: it.id, anon_id: `${FLOOR_ANON}recent-${i}` });
    }
    if (starRows.length) {
      await sb.from(starTable).delete().like("anon_id", `${FLOOR_ANON}recent-%`).eq(fk, it.id);
      await insertChunked(starTable, starRows);
    }

    await sb.from(installTable).delete().eq("anon_id", `${INSTALL_ANON}-recent`).eq(fk, it.id);
    await sb.from(installTable).insert({
      [fk]: it.id,
      anon_id: `${INSTALL_ANON}-recent`,
      target: "seed",
      install_count: 50,
      first_installed_at: nowIso,
      installed_at: nowIso,
    });

    let avg = Number(it.avg_rating) || 0;
    let rcount = Number(it.rating_count) || 0;
    if (ratingTable && (avg < 4 || rcount < 1)) {
      await sb.from(ratingTable).delete().like("anon_id", `${RATING_ANON}recent-%`).eq(fk, it.id);
      const ratings = ratingsWithMin(12, 4.0);
      await insertChunked(
        ratingTable,
        ratings.map((rating, i) => ({
          [fk]: it.id,
          anon_id: `${RATING_ANON}recent-${i + 1}`,
          rating,
        }))
      );
      avg = round2(ratings.reduce((a, b) => a + b, 0) / ratings.length);
      rcount = ratings.length;
    } else if (!ratingTable && (avg < 4 || rcount < 1)) {
      avg = round2(4.1 + Math.random() * 0.8);
      rcount = randInt(10, 30);
    }

    await sb
      .from(it.table)
      .update({
        star_count: Math.max(it.star_count ?? 0, 10),
        export_count: Math.max(it.export_count ?? 0, 50),
        avg_rating: Math.max(avg, 4.0),
        rating_count: Math.max(rcount, 1),
      })
      .eq("id", it.id);
  }
  console.log(`Boosted ${pick.length} recent items to homepage floors`);
}

async function run() {
  await ensureFloors({
    label: "skills (official/homepage)",
    itemTable: "skills",
    urlCol: "source_url",
    starTable: "skill_stars",
    installTable: "skill_installs",
    ratingTable: "skill_ratings",
    fkCol: "skill_id",
    minStars: 10,
    minExports: 10,
    minRating: 4.0,
  });

  await ensureFloors({
    label: "MCP (official/homepage)",
    itemTable: "mcp_servers",
    urlCol: "github_url",
    starTable: "mcp_stars",
    installTable: "mcp_installs",
    ratingTable: null,
    fkCol: "server_id",
    minStars: 10,
    minExports: 10,
    minRating: 4.0,
  });

  // Homepage names need 50 installs specifically
  console.log("\n=== Homepage name install floor (≥50) ===");
  for (const table of ["skills", "mcp_servers"]) {
    const urlCol = table === "skills" ? "source_url" : "github_url";
    const { data } = await sb
      .from(table)
      .select(`id, name, export_count, star_count, avg_rating, rating_count`)
      .in(
        "name",
        [...HOMEPAGE_NAMES]
      );
    // names may not match case — fetch broader and filter
  }
  // Fetch all and filter by protected names
  const skills = await fetchAll("skills", "id, name, export_count, star_count, avg_rating, rating_count");
  const mcps = await fetchAll("mcp_servers", "id, name, export_count, star_count, avg_rating, rating_count");
  const homeItems = [...skills, ...mcps].filter((r) =>
    HOMEPAGE_NAMES.has(String(r.name).toLowerCase())
  );
  for (const it of homeItems) {
    const table = skills.find((s) => s.id === it.id) ? "skills" : "mcp_servers";
    await sb
      .from(table)
      .update({
        export_count: Math.max(it.export_count ?? 0, 50),
        star_count: Math.max(it.star_count ?? 0, 10),
        avg_rating: Math.max(Number(it.avg_rating) || 0, 4.0),
        rating_count: Math.max(it.rating_count ?? 0, 1),
      })
      .eq("id", it.id);
  }
  console.log(`Homepage-named items updated: ${homeItems.length}`);

  await boostRecentForHomepage();

  fs.writeFileSync(
    "scripts/quality-floors-report.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        homepage_names: [...HOMEPAGE_NAMES],
        floors: {
          high_reputation: { avg_rating: 4.0, likes: 10, installs: 10 },
          homepage: { avg_rating: 4.0, likes: 10, installs: 50 },
        },
      },
      null,
      2
    )
  );
  console.log("\n✅ Quality floors applied");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
