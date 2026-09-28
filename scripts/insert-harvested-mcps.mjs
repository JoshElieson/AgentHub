/**
 * Insert harvested MCP servers (scripts/harvested-mcp-servers.json) into Supabase.
 * Idempotent by name.
 *
 *   node scripts/insert-harvested-mcps.mjs [path]
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const dataPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "scripts", "harvested-mcp-servers.json");

const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const servers = payload.servers || payload;

async function fetchExisting() {
  const existing = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("mcp_servers")
      .select("name")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data ?? []) existing.add(r.name);
    if (!data || data.length < PAGE) break;
  }
  return existing;
}

async function run() {
  console.log(`Loaded ${servers.length} MCP servers from ${dataPath}`);
  const existing = await fetchExisting();
  console.log(`${existing.size} already in DB`);

  const toInsert = servers.filter((s) => !existing.has(s.name));
  console.log(`Inserting ${toInsert.length}…`);

  let success = 0;
  let failed = 0;
  for (let i = 0; i < toInsert.length; i += 25) {
    const batch = toInsert.slice(i, i + 25).map((s) => ({
      name: s.name,
      description: s.description,
      github_url: s.github_url || null,
      command: s.command,
      args: s.args || [],
      env_vars: s.env_vars || {},
      tags: s.tags || [],
    }));
    const { error } = await supabase.from("mcp_servers").insert(batch);
    if (error) {
      console.error(`Batch failed: ${error.message}; retrying one-by-one`);
      for (const row of batch) {
        const { error: e2 } = await supabase.from("mcp_servers").insert(row);
        if (e2) {
          console.error(`  ❌ ${row.name}: ${e2.message}`);
          failed++;
        } else success++;
      }
    } else {
      success += batch.length;
      if ((i / 25) % 10 === 0) console.log(`  …${success} inserted`);
    }
  }

  const { count } = await supabase
    .from("mcp_servers")
    .select("id", { count: "exact", head: true });
  console.log(`Done: ${success} inserted, ${failed} failed. Total MCPs: ${count}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
