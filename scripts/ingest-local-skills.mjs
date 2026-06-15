import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Read env variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found!');
  process.exit(1);
}
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Ingestion helper maps
const triggerPhrasesMap = {
  'deploy-to-vercel': ["deploy my app", "deploy and give me the link", "push this live", "create a preview deployment", "vercel deploy"],
  'emil-design-eng': ["design engineering", "ui polish", "animations", "spring animations", "component design"],
  'vercel-optimize': ["vercel optimize", "reduce vercel bill", "observability", "metrics", "performance check"],
  'vercel-react-best-practices': ["react best practices", "next.js performance", "optimize bundle size", "rendering performance", "react data fetching"],
  'vercel-react-native-skills': ["react native performance", "expo optimization", "mobile animation", "native stack navigation", "flashlist react native"],
  'lol-touch-grass': ["League of Legends", "LoL", "Master tier", "solo queue", "climbing"]
};

const tagsMap = {
  'deploy-to-vercel': ["vercel", "deployment", "devops", "hosting", "cloud"],
  'emil-design-eng': ["design", "ui", "ux", "animation", "frontend", "framer-motion"],
  'vercel-optimize': ["vercel", "performance", "optimization", "metrics", "analytics", "observability"],
  'vercel-react-best-practices': ["react", "nextjs", "performance", "best-practices", "optimization", "javascript"],
  'vercel-react-native-skills': ["react-native", "expo", "mobile", "performance", "animation", "navigation"],
  'lol-touch-grass': ["gaming", "fun", "utility"]
};

async function run() {
  const skillsDir = path.join(process.cwd(), '.agents', 'skills');
  if (!fs.existsSync(skillsDir)) {
    console.error('.agents/skills directory not found');
    process.exit(1);
  }

  const skillFolders = fs.readdirSync(skillsDir).filter(f => 
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );

  console.log(`Found local skill folders: ${skillFolders.join(', ')}`);

  for (const folder of skillFolders) {
    const skillMdPath = path.join(skillsDir, folder, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      console.warn(`SKILL.md not found in ${folder}, skipping...`);
      continue;
    }

    const textContent = fs.readFileSync(skillMdPath, 'utf8');

    // Parse YAML frontmatter
    let name = folder;
    let description = "";
    let markdown_instructions = textContent;

    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const frontmatterMatch = textContent.match(frontmatterRegex);

    if (frontmatterMatch) {
      const yamlText = frontmatterMatch[1];
      markdown_instructions = textContent.replace(frontmatterRegex, "").trim();

      const lines = yamlText.split("\n");
      for (const line of lines) {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "").trim();

          if (key === "name") {
            name = val;
          } else if (key === "description") {
            description = val;
          }
        }
      }
    }

    // Determine triggers and tags
    const trigger_phrases = triggerPhrasesMap[name] || [name, `run ${name}`];
    const tags = tagsMap[name] || ["general"];

    console.log(`Ingesting skill: ${name} (${tags.join(', ')})`);

    const { error } = await supabase
      .from('skills')
      .upsert({
        name,
        description: description || `Local skill: ${name}`,
        trigger_phrases,
        markdown_instructions,
        tags,
        script_urls: [],
        source_url: null
      }, { onConflict: 'name' });

    if (error) {
      console.error(`Failed to ingest ${name}:`, error.message);
    } else {
      console.log(`Successfully ingested ${name}`);
    }
  }
}

run();
