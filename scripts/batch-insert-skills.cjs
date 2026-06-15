const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read env
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Load skills from JSON
const skills = JSON.parse(fs.readFileSync(path.join(__dirname, 'skills-data.json'), 'utf8'));

async function run() {
  console.log(`\n🚀 Inserting ${skills.length} skills into Supabase...\n`);
  
  let success = 0;
  let failed = 0;

  // Insert in batches of 5
  for (let i = 0; i < skills.length; i += 5) {
    const batch = skills.slice(i, i + 5);
    const rows = batch.map(s => ({
      name: s.name,
      description: s.description,
      trigger_phrases: s.trigger_phrases,
      markdown_instructions: s.markdown_instructions,
      tags: s.tags,
      script_urls: [],
      source_url: s.source_url || null,
    }));

    const { data, error } = await supabase.from('skills').insert(rows).select('name');

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/5) + 1} failed:`, error.message);
      // Try individually
      for (const row of rows) {
        const { error: e2 } = await supabase.from('skills').insert(row);
        if (e2) { console.error(`    ❌ ${row.name}: ${e2.message}`); failed++; }
        else { console.log(`    ✅ ${row.name}`); success++; }
      }
    } else {
      console.log(`  ✅ Batch ${Math.floor(i/5) + 1}: ${batch.map(s => s.name).join(', ')}`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed out of ${skills.length}`);
  const { data: all } = await supabase.from('skills').select('id');
  console.log(`🔍 Total skills in database: ${all?.length || 0}\n`);
}

run().catch(console.error);
