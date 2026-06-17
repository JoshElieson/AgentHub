import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Insert the researched skills (scripts/researched-skills.json) into Supabase.
// Idempotent: skips any skill whose `name` already exists in the table.
// Category/model are NOT stored here — they live in skill-classification.ts
// (curated map keyed by name) and are applied at normalize-time.
// ─────────────────────────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data file is configurable: `node insert-researched-skills.mjs [path]`.
// Defaults to the original curated set for backward compatibility.
const dataPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'scripts', 'researched-skills.json');
const { skills } = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

async function run() {
  console.log(`\n📦 Loaded ${skills.length} researched skills.\n`);

  // 1. Fetch existing names so we don't create duplicates. Supabase caps a
  // select at 1000 rows by default, so paginate with .range() to capture the
  // full table — otherwise rows past the first 1000 look "new" and collide.
  const existing = new Set();
  {
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('skills')
        .select('name')
        .range(from, from + PAGE - 1);
      if (error) {
        console.error('❌ Could not read existing skills:', error.message);
        process.exit(1);
      }
      for (const r of data ?? []) existing.add(r.name);
      if (!data || data.length < PAGE) break;
    }
  }
  console.log(`🔍 ${existing.size} skills already in the database.`);

  const toInsert = skills.filter((s) => !existing.has(s.name));
  const skipped = skills.filter((s) => existing.has(s.name)).map((s) => s.name);
  if (skipped.length) console.log(`⏭️  Skipping ${skipped.length} already present: ${skipped.join(', ')}`);
  console.log(`\n🚀 Inserting ${toInsert.length} new skills...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < toInsert.length; i += 10) {
    const batch = toInsert.slice(i, i + 10);
    const rows = batch.map((s) => ({
      name: s.name,
      description: s.description,
      trigger_phrases: s.trigger_phrases ?? [],
      markdown_instructions: s.markdown_instructions ?? '',
      tags: s.tags ?? [],
      script_urls: [],
      source_url: s.source_url ?? null,
    }));

    const { data, error } = await supabase.from('skills').insert(rows).select('name');
    if (error) {
      console.error(`  ⚠️  Batch ${Math.floor(i / 10) + 1} failed (${error.message}); retrying individually...`);
      for (const row of rows) {
        const { error: singleErr } = await supabase.from('skills').insert(row);
        if (singleErr) {
          console.error(`    ❌ ${row.name}: ${singleErr.message}`);
          errors.push(row.name);
          failed++;
        } else {
          console.log(`    ✅ ${row.name}`);
          success++;
        }
      }
    } else {
      console.log(`  ✅ Batch ${Math.floor(i / 10) + 1}: ${data.map((d) => d.name).join(', ')}`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} inserted, ${failed} failed, ${skipped.length} skipped.`);
  if (errors.length) console.log(`❌ Failed: ${errors.join(', ')}`);

  const { count } = await supabase.from('skills').select('id', { count: 'exact', head: true });
  console.log(`\nTotal skills in database now: ${count ?? 'unknown'}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
