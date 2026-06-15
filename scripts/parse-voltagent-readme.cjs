const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read env
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// Parse the VoltAgent awesome-agent-skills README
// ─────────────────────────────────────────────────────────────────────────────

const readmePath = 'C:\\Users\\nicka\\.gemini\\antigravity-ide\\brain\\0f780bd7-6e60-4cc4-a749-ed050e95e896\\.system_generated\\steps\\207\\content.md';

// Fallback: try reading from a local copy
let readme;
try {
  readme = fs.readFileSync(readmePath, 'utf8');
} catch {
  console.error('Could not read README from cached path. Provide it as an argument.');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Section → tag mapping
// ─────────────────────────────────────────────────────────────────────────────
const sectionTags = {
  'official claude skills': ['anthropic', 'claude', 'official'],
  'voltagent': ['voltagent', 'agents', 'typescript'],
  'angular': ['angular', 'frontend', 'typescript'],
  'composio': ['composio', 'integration', 'agents'],
  'supabase': ['supabase', 'postgres', 'database'],
  'google gemini': ['google', 'gemini', 'ai', 'ml'],
  'stripe': ['stripe', 'payments', 'fintech'],
  'courier': ['notifications', 'email', 'sms'],
  'callstack': ['react-native', 'mobile', 'performance'],
  'better auth': ['authentication', 'security', 'auth'],
  'tinybird': ['tinybird', 'analytics', 'data'],
  'hashicorp': ['terraform', 'iac', 'infrastructure'],
  'sanity': ['sanity', 'cms', 'content'],
  'firecrawl': ['firecrawl', 'scraping', 'data'],
  'neon': ['neon', 'postgres', 'serverless'],
  'clickhouse': ['clickhouse', 'analytics', 'database'],
  'remotion': ['remotion', 'video', 'react'],
  'replicate': ['replicate', 'ai', 'models'],
  'typefully': ['social-media', 'content', 'publishing'],
  'venice': ['venice', 'ai', 'api'],
  'vercel': ['vercel', 'nextjs', 'frontend'],
  'cloudflare': ['cloudflare', 'workers', 'edge'],
  'netlify': ['netlify', 'deployment', 'serverless'],
  'google labs': ['google', 'stitch', 'design'],
  'google workspace': ['google', 'workspace', 'productivity'],
  'expo': ['expo', 'react-native', 'mobile'],
  'hugging face': ['huggingface', 'ml', 'ai'],
  'trail of bits': ['security', 'audit', 'blockchain'],
  'sentry': ['sentry', 'monitoring', 'observability'],
  'microsoft': ['microsoft', 'azure', 'cloud'],
  'fal.ai': ['fal', 'ai', 'image-generation'],
  'wordpress': ['wordpress', 'cms', 'php'],
  'openai': ['openai', 'ai', 'api'],
  'figma': ['figma', 'design', 'ui'],
  'corey haines': ['marketing', 'growth', 'strategy'],
  'binance': ['binance', 'crypto', 'blockchain'],
  'dean peters': ['product-management', 'agile'],
  'pawel huryn': ['product-management', 'strategy'],
  'minimax': ['minimax', 'ai', 'api'],
  'duckdb': ['duckdb', 'analytics', 'database'],
  'gsap': ['gsap', 'animation', 'frontend'],
  'garry tan': ['startup', 'engineering', 'architecture'],
  'notion': ['notion', 'productivity', 'integration'],
  'resend': ['resend', 'email', 'api'],
  'addy osmani': ['web-quality', 'performance', 'frontend'],
  'mongodb': ['mongodb', 'database', 'nosql'],
  'kim barrett': ['advertising', 'marketing'],
  'apollo graphql': ['graphql', 'api', 'backend'],
  'auth0': ['auth0', 'authentication', 'security'],
  'brave': ['brave', 'browser', 'search'],
  'browserbase': ['browserbase', 'automation', 'scraping'],
  'coderabbit': ['coderabbit', 'code-review', 'ai'],
  'coinbase': ['coinbase', 'crypto', 'blockchain'],
  'datadog': ['datadog', 'monitoring', 'observability'],
  'firebase': ['firebase', 'google', 'backend'],
  'flutter': ['flutter', 'mobile', 'dart'],
  'red hat': ['redhat', 'openshift', 'enterprise'],
  'community': ['community', 'open-source'],
  'redis': ['redis', 'database', 'caching'],
  'nvidia': ['nvidia', 'gpu', 'ai'],
  'google cloud': ['gcp', 'cloud', 'infrastructure'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Skills to SKIP (already in DB or too niche for marketplace)
// ─────────────────────────────────────────────────────────────────────────────
const SKIP_PREFIXES = [
  // Skip hyper-specific Azure SDK skills (130+ of them)
  'microsoft/azure-ai-anomalydetector',
  'microsoft/azure-ai-contentsafety-',
  'microsoft/azure-ai-formrecognizer',
  'microsoft/azure-ai-projects-',
  'microsoft/azure-ai-vision-',
  'microsoft/azure-ai-voicelive-',
  'microsoft/azure-ai-document-intelligence-',
  'microsoft/azure-ai-openai-',
  'microsoft/azure-ai-contentunderstanding',
  'microsoft/azure-ai-ml-py',
  'microsoft/azure-ai-textanalytics',
  'microsoft/azure-ai-transcription',
  'microsoft/azure-ai-translation',
  'microsoft/azure-appconfiguration',
  'microsoft/azure-communication-',
  'microsoft/azure-compute-',
  'microsoft/azure-containerregistry',
  'microsoft/azure-cosmos',
  'microsoft/azure-data-tables',
  'microsoft/azure-eventgrid-',
  'microsoft/azure-eventhub-',
  'microsoft/azure-identity-',
  'microsoft/azure-keyvault',
  'microsoft/azure-maps-',
  'microsoft/azure-messaging-',
  'microsoft/azure-mgmt-',
  'microsoft/azure-monitor-',
  'microsoft/azure-resource-manager-',
  'microsoft/azure-search-',
  'microsoft/azure-security-keyvault-',
  'microsoft/azure-servicebus-',
  'microsoft/azure-storage-',
  'microsoft/azure-webjobs',
  'microsoft/m365-agents-',
  'microsoft/microsoft-azure-',
  'microsoft/agents-v2-py',
  'microsoft/agent-framework-azure',
  // Skip very niche per-platform Sentry SDK skills (keep the main ones)
  'getsentry/sentry-android-sdk',
  'getsentry/sentry-browser-sdk',
  'getsentry/sentry-cloudflare-sdk',
  'getsentry/sentry-cocoa-sdk',
  'getsentry/sentry-dotnet-sdk',
  'getsentry/sentry-elixir-sdk',
  'getsentry/sentry-flutter-sdk',
  'getsentry/sentry-go-sdk',
  'getsentry/sentry-nestjs-sdk',
  'getsentry/sentry-nextjs-sdk',
  'getsentry/sentry-node-sdk',
  'getsentry/sentry-php-sdk',
  'getsentry/sentry-python-sdk',
  'getsentry/sentry-react-native-sdk',
  'getsentry/sentry-react-sdk',
  'getsentry/sentry-ruby-sdk',
  'getsentry/sentry-svelte-sdk',
  'getsentry/sentry-sdk-skill-creator',
  'getsentry/sentry-sdk-upgrade',
  // Skip very niche Venice sub-skills (keep overview)
  'veniceai/venice-auth',
  'veniceai/venice-chat',
  'veniceai/venice-responses',
  'veniceai/venice-embeddings',
  'veniceai/venice-image-edit',
  'veniceai/venice-audio-speech',
  'veniceai/venice-audio-music',
  'veniceai/venice-audio-transcription',
  'veniceai/venice-video',
  'veniceai/venice-models',
  'veniceai/venice-characters',
  'veniceai/venice-api-keys',
  'veniceai/venice-billing',
  'veniceai/venice-x402',
  'veniceai/venice-crypto-rpc',
  'veniceai/venice-augment',
  'veniceai/venice-errors',
  // Skip very niche Google Workspace sub-skills (keep a few key ones)
  'googleworkspace/gws-admin-reports',
  'googleworkspace/gws-slides',
  'googleworkspace/gws-tasks',
  'googleworkspace/gws-people',
  'googleworkspace/gws-chat',
  'googleworkspace/gws-classroom',
  'googleworkspace/gws-forms',
  'googleworkspace/gws-keep',
  'googleworkspace/gws-events',
  'googleworkspace/gws-modelarmor',
  'googleworkspace/gws-workflow',
  // Skip template/meta skills
  'anthropics/template',
  'anthropics/brand-guidelines',
];

// Names we already have in the DB — will be checked dynamically
let existingNames = new Set();

// ─────────────────────────────────────────────────────────────────────────────
// Parse each skill line from the README
// ─────────────────────────────────────────────────────────────────────────────

function parseSkills(text) {
  const skills = [];
  let currentSection = 'general';

  const lines = text.split('\n');
  for (const line of lines) {
    // Detect section headers
    const sectionMatch = line.match(/#{1,4}\s+(?:Skills?\s+by\s+)?(.+?)(?:\s+Team)?(?:\s+for\s+.+)?$/i)
      || line.match(/<summary>.*?<\/summary>/i)
      || line.match(/Official\s+Claude\s+Skills/i);

    if (sectionMatch) {
      const raw = (sectionMatch[1] || line).replace(/<[^>]+>/g, '').trim().toLowerCase();
      // Find matching section
      for (const key of Object.keys(sectionTags)) {
        if (raw.includes(key)) {
          currentSection = key;
          break;
        }
      }
    }

    // Parse skill entries: - **[org/name](url)** - Description
    const skillMatch = line.match(/^\s*-\s+\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*[-–—]\s*(.+)$/);
    if (!skillMatch) continue;

    const [, fullName, url, description] = skillMatch;
    const slug = fullName.split('/').pop()?.trim();
    if (!slug) continue;

    // Check skip list
    const shouldSkip = SKIP_PREFIXES.some(prefix => fullName.startsWith(prefix));
    if (shouldSkip) continue;

    // Derive source URL — prefer GitHub URLs, fall back to officialskills.sh
    let sourceUrl = url;
    if (url.includes('officialskills.sh')) {
      // Convert to GitHub URL pattern
      const parts = fullName.split('/');
      if (parts.length === 2) {
        sourceUrl = `https://github.com/${parts[0]}/skills/tree/main/skills/${parts[1]}`;
      }
    }

    const baseTags = sectionTags[currentSection] || ['community'];
    // Add some description-derived tags
    const descLower = description.toLowerCase();
    const extraTags = [];
    if (descLower.includes('security') || descLower.includes('audit')) extraTags.push('security');
    if (descLower.includes('deploy')) extraTags.push('deployment');
    if (descLower.includes('test')) extraTags.push('testing');
    if (descLower.includes('api')) extraTags.push('api');
    if (descLower.includes('sdk')) extraTags.push('sdk');

    const tags = [...new Set([...baseTags, ...extraTags])].slice(0, 6);

    // Generate trigger phrases from the skill name and description
    const trigger_phrases = [
      slug.replace(/-/g, ' '),
      ...description.split(/[,;]/).slice(0, 2).map(s => s.trim().substring(0, 50)),
    ].filter(Boolean);

    skills.push({
      name: slug,
      description: description.trim(),
      trigger_phrases,
      tags,
      source_url: sourceUrl,
      markdown_instructions: `# ${slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}\n\n${description.trim()}\n\nSource: ${sourceUrl}\n\nThis skill was sourced from the VoltAgent awesome-agent-skills registry. Visit the source URL above for full documentation and SKILL.md instructions.`,
    });
  }

  return skills;
}

async function run() {
  // 1. Get existing skill names to avoid duplicates
  const { data: existing } = await supabase.from('skills').select('name');
  existingNames = new Set((existing || []).map(s => s.name));
  console.log(`📋 ${existingNames.size} skills already in database\n`);

  // 2. Parse README
  const parsed = parseSkills(readme);
  console.log(`📝 Parsed ${parsed.length} skills from VoltAgent README\n`);

  // 3. Filter out duplicates
  const newSkills = parsed.filter(s => !existingNames.has(s.name));
  console.log(`🆕 ${newSkills.length} new skills to insert (${parsed.length - newSkills.length} duplicates skipped)\n`);

  if (newSkills.length === 0) {
    console.log('Nothing to insert!');
    return;
  }

  // 4. Insert in batches of 5
  let success = 0;
  let failed = 0;

  for (let i = 0; i < newSkills.length; i += 5) {
    const batch = newSkills.slice(i, i + 5);
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
      // Try individually on batch failure
      for (const row of rows) {
        const { error: e2 } = await supabase.from('skills').insert(row);
        if (e2) {
          console.error(`  ❌ ${row.name}: ${e2.message}`);
          failed++;
        } else {
          console.log(`  ✅ ${row.name}`);
          success++;
        }
      }
    } else {
      const batchNum = Math.floor(i / 5) + 1;
      console.log(`  ✅ Batch ${batchNum}: ${batch.map(s => s.name).join(', ')}`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed out of ${newSkills.length}`);
  const { data: all } = await supabase.from('skills').select('id');
  console.log(`🔍 Total skills in database: ${all?.length || 0}\n`);
}

run().catch(console.error);
