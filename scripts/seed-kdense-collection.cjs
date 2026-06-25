/**
 * seed-kdense-collection.cjs
 *
 * Creates a "Scientific Research Skills" collection containing all
 * K-Dense-AI skills (source_url contains K-Dense-AI). Idempotent — deletes
 * any existing collection with that name first.
 *
 * Usage:  node scripts/seed-kdense-collection.cjs
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ── Env ─────────────────────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey =
  envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
  envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const COLLECTION_NAME = "Scientific Research Skills";
const COLLECTION_DESC =
  "140+ ready-to-use scientific agent skills covering biology, chemistry, drug discovery, genomics, clinical research, data analysis, and scientific writing. Sourced from K-Dense-AI's open-source scientific-agent-skills library.";
const COLLECTION_GRADIENT =
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #667eea 100%)";
const SYSTEM_ANON_ID = "system-seed";

async function run() {
  console.log("\n🧬 Creating Scientific Research Skills collection...\n");

  // 1. Fetch all K-Dense-AI skills from the database
  console.log("🔍 Fetching K-Dense-AI skills...");
  const allSkills = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, source_url")
      .like("source_url", "%K-Dense-AI%")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("❌ Failed to fetch skills:", error.message);
      process.exit(1);
    }
    allSkills.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  console.log(`   Found ${allSkills.length} K-Dense-AI skills.\n`);

  if (allSkills.length === 0) {
    console.error("❌ No K-Dense-AI skills found. Run harvest-kdense-skills.mjs first.");
    process.exit(1);
  }

  // 2. Delete any existing collection with this name (idempotent)
  console.log("🧹 Cleaning up any existing collection...");
  const { data: existing } = await supabase
    .from("collections")
    .select("id")
    .eq("name", COLLECTION_NAME);

  if (existing && existing.length > 0) {
    for (const col of existing) {
      await supabase.from("collection_items").delete().eq("collection_id", col.id);
      await supabase.from("collections").delete().eq("id", col.id);
    }
    console.log(`   Deleted ${existing.length} existing collection(s).\n`);
  } else {
    console.log("   None found.\n");
  }

  // 3. Create the collection
  console.log("📦 Creating collection...");
  const { data: collection, error: cErr } = await supabase
    .from("collections")
    .insert({
      name: COLLECTION_NAME,
      description: COLLECTION_DESC,
      kind: "skills",
      cover_color: COLLECTION_GRADIENT,
      anon_id: SYSTEM_ANON_ID,
      is_public: true,
    })
    .select()
    .single();

  if (cErr) {
    console.error("❌ Failed to create collection:", cErr.message);
    process.exit(1);
  }

  console.log(`   ✅ Created collection: ${collection.id}\n`);

  // 4. Insert collection items (in batches of 50)
  console.log(`📎 Linking ${allSkills.length} skills to collection...\n`);
  let linked = 0;
  let failed = 0;

  for (let i = 0; i < allSkills.length; i += 50) {
    const batch = allSkills.slice(i, i + 50);
    const items = batch.map((skill, idx) => ({
      collection_id: collection.id,
      item_id: skill.id,
      item_kind: "skill",
      position: i + idx,
    }));

    const { error: iErr } = await supabase.from("collection_items").insert(items);
    if (iErr) {
      console.error(`   ⚠️  Batch ${Math.floor(i / 50) + 1} failed: ${iErr.message}`);
      // Try individually
      for (const item of items) {
        const { error: sErr } = await supabase.from("collection_items").insert(item);
        if (sErr) {
          console.error(`     ❌ ${allSkills[item.position]?.name}: ${sErr.message}`);
          failed++;
        } else {
          linked++;
        }
      }
    } else {
      linked += batch.length;
      console.log(`   ✅ Batch ${Math.floor(i / 50) + 1}: ${batch.length} skills linked`);
    }
  }

  console.log(`\n📊 Results: ${linked} linked, ${failed} failed`);
  console.log(`\n🧬 Collection "${COLLECTION_NAME}" ready with ${linked} skills.`);
  console.log(`   ID: ${collection.id}\n`);
}

run().catch(console.error);
