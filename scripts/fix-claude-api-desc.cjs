/**
 * fix-claude-api-desc.cjs
 * 
 * Fixes the claude-api skill description in Supabase.
 * The YAML frontmatter parser stored "|-" instead of the real description.
 *
 * Usage:  node scripts/fix-claude-api-desc.cjs
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey =
  envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
  envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const FIXED_DESCRIPTION =
  "Complete reference for the Claude API and Anthropic SDK — covers model IDs, pricing, streaming, tool use, agents, MCP integration, prompt caching, and token counting across Python, TypeScript, Java, Go, Ruby, C#, and PHP.";

async function run() {
  console.log("🔧 Fixing claude-api description...\n");

  const { data, error } = await supabase
    .from("skills")
    .update({ description: FIXED_DESCRIPTION })
    .eq("name", "claude-api")
    .select("id, name, description");

  if (error) {
    console.error("❌ Failed:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("⚠️  No skill named 'claude-api' found in the database.");
  } else {
    console.log("✅ Updated claude-api:");
    console.log(`   ID: ${data[0].id}`);
    console.log(`   Description: ${data[0].description}`);
  }
}

run().catch(console.error);
