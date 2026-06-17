/**
 * seed-collections.cjs
 * 
 * Creates one "skills" collection per GitHub org, populated with
 * all skills whose source_url matches that org. Uses the live
 * Supabase skills table so it picks up whatever is actually in the DB.
 *
 * Usage:  node scripts/seed-collections.cjs
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

// ── Org display names & gradient colors ─────────────────────────────────────
const ORG_META = {
  anthropics: {
    displayName: "Anthropic Skills",
    description: "Official skills created and maintained by the Anthropic team. Includes MCP builder, frontend design, webapp testing, document creation, and more.",
    gradient: "linear-gradient(135deg, #D97706 0%, #92400E 100%)",
  },
  "vercel-labs": {
    displayName: "Vercel Skills",
    description: "Best practices and development guides from the Vercel team for Next.js, React, and modern web development.",
    gradient: "linear-gradient(135deg, #000000 0%, #434343 100%)",
  },
  cloudflare: {
    displayName: "Cloudflare Skills",
    description: "Web performance optimization and Workers development guides from Cloudflare.",
    gradient: "linear-gradient(135deg, #F48120 0%, #E6522C 100%)",
  },
  stripe: {
    displayName: "Stripe Skills",
    description: "Payment integration best practices from the Stripe agent toolkit.",
    gradient: "linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)",
  },
  supabase: {
    displayName: "Supabase Skills",
    description: "PostgreSQL best practices and database optimization from the Supabase team.",
    gradient: "linear-gradient(135deg, #3ECF8E 0%, #1A7F5A 100%)",
  },
  hashicorp: {
    displayName: "HashiCorp Skills",
    description: "Infrastructure-as-code patterns and Terraform style guides from HashiCorp.",
    gradient: "linear-gradient(135deg, #7B42BC 0%, #5C2D91 100%)",
  },
  trailofbits: {
    displayName: "Trail of Bits Skills",
    description: "Security auditing, static analysis, property-based testing, and Python best practices from Trail of Bits.",
    gradient: "linear-gradient(135deg, #EF4444 0%, #991B1B 100%)",
  },
  huggingface: {
    displayName: "Hugging Face Skills",
    description: "ML model training and Gradio app building guides from the Hugging Face team.",
    gradient: "linear-gradient(135deg, #FFD21E 0%, #FF9D00 100%)",
  },
  callstackincubator: {
    displayName: "Callstack Skills",
    description: "React Native best practices and Git workflow guides from the Callstack team.",
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
  },
  "sanity-io": {
    displayName: "Sanity Skills",
    description: "SEO optimization and content modeling best practices from Sanity.io.",
    gradient: "linear-gradient(135deg, #F03E2F 0%, #C32018 100%)",
  },
  expo: {
    displayName: "Expo Skills",
    description: "Mobile development and deployment guides for the Expo framework.",
    gradient: "linear-gradient(135deg, #4630EB 0%, #2D1FA0 100%)",
  },
  greensock: {
    displayName: "GreenSock Skills",
    description: "GSAP animation techniques and best practices from GreenSock.",
    gradient: "linear-gradient(135deg, #88CE02 0%, #5A8A01 100%)",
  },
  "remotion-dev": {
    displayName: "Remotion Skills",
    description: "Programmatic video creation using React with Remotion.",
    gradient: "linear-gradient(135deg, #0B84F3 0%, #064FA0 100%)",
  },
  netlify: {
    displayName: "Netlify Skills",
    description: "Deployment and hosting best practices from Netlify.",
    gradient: "linear-gradient(135deg, #00C7B7 0%, #009A8D 100%)",
  },
  getsentry: {
    displayName: "Sentry Skills",
    description: "Observability and error monitoring setup guides from Sentry.",
    gradient: "linear-gradient(135deg, #362D59 0%, #6C5FC7 100%)",
  },
  composiohq: {
    displayName: "Composio Skills",
    description: "Tool integrations and agentic automation guides from Composio.",
    gradient: "linear-gradient(135deg, #6366F1 0%, #4338CA 100%)",
  },
  firecrawl: {
    displayName: "Firecrawl Skills",
    description: "Web scraping and data extraction best practices from Firecrawl.",
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  },
  replicate: {
    displayName: "Replicate Skills",
    description: "AI model deployment and inference guides using the Replicate platform.",
    gradient: "linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)",
  },
  angular: {
    displayName: "Angular Skills",
    description: "Official Angular framework development guides and best practices.",
    gradient: "linear-gradient(135deg, #DD0031 0%, #B52E31 100%)",
  },
  trycourier: {
    displayName: "Courier Skills",
    description: "Notification infrastructure and messaging guides from Courier.",
    gradient: "linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)",
  },
  typefully: {
    displayName: "Typefully Skills",
    description: "Social media publishing and content creation tools from Typefully.",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
  },
  clickhouse: {
    displayName: "ClickHouse Skills",
    description: "Analytical database best practices and query optimization from ClickHouse.",
    gradient: "linear-gradient(135deg, #FACC15 0%, #EAB308 100%)",
  },
  neondatabase: {
    displayName: "Neon Skills",
    description: "Serverless Postgres development and branching guides from Neon.",
    gradient: "linear-gradient(135deg, #00E599 0%, #00B377 100%)",
  },
  "better-auth": {
    displayName: "Better Auth Skills",
    description: "Authentication best practices and integration guides from the Better Auth team.",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  },
  microsoft: {
    displayName: "Microsoft Skills",
    description: "Development tools and best practices from Microsoft, including TypeScript, Azure, and VS Code guides.",
    gradient: "linear-gradient(135deg, #00A4EF 0%, #0078D4 100%)",
  },
  googleworkspace: {
    displayName: "Google Workspace Skills",
    description: "Google Workspace integration and Apps Script development guides.",
    gradient: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
  },
  "google-labs-code": {
    displayName: "Google Labs Skills",
    description: "Experimental development tools and AI integration guides from Google Labs.",
    gradient: "linear-gradient(135deg, #EA4335 0%, #FBBC05 100%)",
  },
  voltagent: {
    displayName: "VoltAgent Skills",
    description: "AI agent framework development and orchestration guides from VoltAgent.",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  },
  "google-gemini": {
    displayName: "Google Gemini Skills",
    description: "Gemini AI model integration, prompt engineering, and multimodal development guides from Google.",
    gradient: "linear-gradient(135deg, #4285F4 0%, #8AB4F8 100%)",
  },
  tinybirdco: {
    displayName: "Tinybird Skills",
    description: "Real-time analytics and data pipeline development guides from Tinybird.",
    gradient: "linear-gradient(135deg, #24B47E 0%, #1A8D62 100%)",
  },
  veniceai: {
    displayName: "Venice AI Skills",
    description: "Private AI model inference and deployment guides from Venice.ai.",
    gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
  },
};

// A consistent anon_id for "system" seeded collections
const SYSTEM_ANON_ID = "system-seed";

async function run() {
  console.log("\n🔍 Fetching all skills from Supabase...\n");

  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, source_url")
    .not("source_url", "is", null);

  if (error) {
    console.error("Failed to fetch skills:", error.message);
    process.exit(1);
  }

  console.log(`  Found ${skills.length} skills with source URLs\n`);

  // Group skill IDs by GitHub org
  const orgSkills = {};
  for (const skill of skills) {
    const match = skill.source_url.match(/github\.com\/([^/]+)\//);
    if (!match) continue;
    const org = match[1];
    if (!orgSkills[org]) orgSkills[org] = [];
    orgSkills[org].push(skill);
  }

  // Sort orgs by skill count descending
  const sortedOrgs = Object.entries(orgSkills).sort(
    (a, b) => b[1].length - a[1].length
  );

  console.log(`  Found ${sortedOrgs.length} organizations:\n`);
  for (const [org, orgList] of sortedOrgs) {
    console.log(`    ${org}: ${orgList.length} skills`);
  }

  // ── Delete existing system-seeded collections ───────────────────────────
  console.log("\n🧹 Cleaning up existing system-seeded collections...\n");
  const { error: delErr } = await supabase
    .from("collections")
    .delete()
    .eq("anon_id", SYSTEM_ANON_ID);
  if (delErr) {
    console.error("  ⚠️  Failed to clean up:", delErr.message);
  } else {
    console.log("  ✅ Cleaned up old system collections\n");
  }

  // ── Create collections ────────────────────────────────────────────────
  console.log("📦 Creating collections...\n");

  let created = 0;
  let failed = 0;

  for (const [org, orgList] of sortedOrgs) {
    const meta = ORG_META[org];
    if (!meta) {
      console.log(`  ⏭  Skipping ${org} (no metadata configured)`);
      continue;
    }

    // 1) Create the collection
    const { data: collection, error: cErr } = await supabase
      .from("collections")
      .insert({
        name: meta.displayName,
        description: meta.description,
        kind: "skills",
        cover_color: meta.gradient,
        anon_id: SYSTEM_ANON_ID,
        is_public: true,
      })
      .select()
      .single();

    if (cErr) {
      console.error(`  ❌ Failed to create "${meta.displayName}": ${cErr.message}`);
      failed++;
      continue;
    }

    // 2) Insert collection items
    const items = orgList.map((skill, i) => ({
      collection_id: collection.id,
      item_id: skill.id,
      item_kind: "skill",
      position: i,
    }));

    const { error: iErr } = await supabase
      .from("collection_items")
      .insert(items);

    if (iErr) {
      console.error(`  ⚠️  Created "${meta.displayName}" but failed to add items: ${iErr.message}`);
    } else {
      console.log(`  ✅ ${meta.displayName} — ${orgList.length} skill(s)`);
      orgList.forEach((s) => console.log(`       • ${s.name}`));
    }

    created++;
  }

  console.log(`\n📊 Results: ${created} collections created, ${failed} failed\n`);

  // Verify
  const { data: all } = await supabase
    .from("collections")
    .select("id, name, kind")
    .eq("anon_id", SYSTEM_ANON_ID);
  console.log(`🔍 Total system collections in database: ${all?.length || 0}\n`);
}

run().catch(console.error);
