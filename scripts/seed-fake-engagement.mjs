// ════════════════════════════════════════════════════════════════════════════
// Seed FAKE engagement (thumbs-up likes + installs) onto every skill & MCP server.
//
// WHY THIS IS SEPARABLE FROM REAL ENGAGEMENT
// ------------------------------------------
// All fake rows are tagged with a reserved anon_id prefix: "seed-fake-".
// Real likes/installs never use that prefix, so the fake stats can be removed
// later with one query (see supabase/remove-fake-engagement.sql) while every
// genuine like/install is preserved.
//
//   • Likes   → N = rand(1..50) distinct rows in skill_stars / mcp_stars,
//               anon_id = "seed-fake-1" … "seed-fake-N".
//               star_count is then set to (real rows) + N. Distinct rows are
//               REQUIRED: the app recomputes star_count = COUNT(rows) whenever
//               anyone toggles a like, so the fake rows must physically exist or
//               the bump would be lost on the next toggle.
//   • Installs→ M = rand(1..20) recorded as ONE ledger row in
//               skill_installs / mcp_installs (anon_id = "seed-fake-installs",
//               install_count = M, target = "seed"). export_count (the number
//               shown under the Download icon) is then set to (real base) + M.
//               Nothing in the app ever recomputes export_count from rows, so a
//               single offset row is enough and stays consistent.
//
// IDEMPOTENT: re-running first removes any prior fake rows and recovers the real
// baseline, so counts don't compound across runs.
//
// RUN:  node scripts/seed-fake-engagement.mjs
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

const FAKE_PREFIX = "seed-fake-";
const INSTALL_ANON = "seed-fake-installs";
const MAX_LIKES = 50;
const MIN_LIKES = 1;
const MAX_INSTALLS = 20;
const MIN_INSTALLS = 1;
const nowIso = new Date().toISOString();

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Fetch every row of a table (paginated past the 1000-row PostgREST cap).
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

// Insert rows in chunks so we stay well under request-size limits.
async function insertChunked(table, rows, size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await sb.from(table).insert(chunk);
    if (error) throw new Error(`insert ${table}: ${error.message}`);
  }
}

// Run async tasks with bounded concurrency.
async function pool(items, worker, concurrency = 25) {
  let idx = 0;
  let done = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i], i);
      done++;
      if (done % 200 === 0) console.log(`   …${done}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
}

async function seedKind({
  label,
  itemTable, // "skills" | "mcp_servers"
  idCol, // "id" — the PK column name on the item table
  starTable, // "skill_stars" | "mcp_stars"
  installTable, // "skill_installs" | "mcp_installs"
  fkCol, // "skill_id" | "server_id" — the FK column on star/install tables
}) {
  console.log(`\n=== ${label} ===`);

  // 0) Current items + their denormalized counts.
  const items = await fetchAll(itemTable, `${idCol}, star_count, export_count`);
  console.log(`Loaded ${items.length} ${label}.`);

  // Real (non-fake) like counts, tallied per item.
  const realStars = await fetchAll(starTable, fkCol, (q) =>
    q.not("anon_id", "like", `${FAKE_PREFIX}%`)
  );
  const realStarCount = new Map();
  for (const r of realStars)
    realStarCount.set(r[fkCol], (realStarCount.get(r[fkCol]) ?? 0) + 1);

  // Previously-seeded fake install offsets, so we can recover the real base.
  const oldFakeInstalls = await fetchAll(
    installTable,
    `${fkCol}, install_count`,
    (q) => q.eq("anon_id", INSTALL_ANON)
  );
  const oldFakeInstall = new Map();
  for (const r of oldFakeInstalls)
    oldFakeInstall.set(r[fkCol], r.install_count ?? 0);

  // 1) Clear all prior fake rows (idempotency).
  console.log("Clearing prior fake rows…");
  for (const t of [starTable, installTable]) {
    const { error } = await sb.from(t).delete().like("anon_id", `${FAKE_PREFIX}%`);
    if (error) throw new Error(`clear ${t}: ${error.message}`);
  }

  // 2) Build fresh random fake rows.
  const starRows = [];
  const installRows = [];
  const updates = []; // { id, star_count, export_count }
  for (const it of items) {
    const id = it[idCol];
    const likes = randInt(MIN_LIKES, MAX_LIKES);
    const installs = randInt(MIN_INSTALLS, MAX_INSTALLS);

    for (let i = 1; i <= likes; i++)
      starRows.push({ [fkCol]: id, anon_id: `${FAKE_PREFIX}${i}` });

    installRows.push({
      [fkCol]: id,
      anon_id: INSTALL_ANON,
      target: "seed",
      install_count: installs,
      first_installed_at: nowIso,
      installed_at: nowIso,
    });

    const realBaseExport = (it.export_count ?? 0) - (oldFakeInstall.get(id) ?? 0);
    updates.push({
      id,
      star_count: (realStarCount.get(id) ?? 0) + likes,
      export_count: Math.max(0, realBaseExport) + installs,
    });
  }

  // 3) Insert fake like rows + install ledger rows.
  console.log(`Inserting ${starRows.length} fake like rows…`);
  await insertChunked(starTable, starRows);
  console.log(`Inserting ${installRows.length} fake install ledger rows…`);
  await insertChunked(installTable, installRows);

  // 4) Update denormalized display counts.
  console.log(`Updating ${updates.length} ${label} display counts…`);
  await pool(updates, async (u) => {
    const { error } = await sb
      .from(itemTable)
      .update({ star_count: u.star_count, export_count: u.export_count })
      .eq(idCol, u.id);
    if (error) throw new Error(`update ${itemTable} ${u.id}: ${error.message}`);
  });

  const totalLikes = updates.reduce((a, u) => a + u.star_count, 0);
  console.log(
    `Done: ${label} now show ${totalLikes} total likes (incl. fake) across ${items.length} items.`
  );
}

(async () => {
  await seedKind({
    label: "skills",
    itemTable: "skills",
    idCol: "id",
    starTable: "skill_stars",
    installTable: "skill_installs",
    fkCol: "skill_id",
  });
  await seedKind({
    label: "MCP servers",
    itemTable: "mcp_servers",
    idCol: "id",
    starTable: "mcp_stars",
    installTable: "mcp_installs",
    fkCol: "server_id",
  });
  console.log("\n✅ Fake engagement seeded. Remove later with supabase/remove-fake-engagement.sql");
})().catch((e) => {
  console.error("\n❌ Seeding failed:", e.message);
  process.exit(1);
});
