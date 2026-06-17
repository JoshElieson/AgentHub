import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SKILLS_DIR = path.join(process.cwd(), '.agents', 'skills');

async function ingestSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error('Skills directory not found:', SKILLS_DIR);
    return;
  }

  const skillFolders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let successCount = 0;
  let errorCount = 0;

  for (const folder of skillFolders) {
    const skillPath = path.join(SKILLS_DIR, folder, 'SKILL.md');
    
    if (!fs.existsSync(skillPath)) {
      console.log(`Skipping ${folder}: No SKILL.md found`);
      continue;
    }

    const content = fs.readFileSync(skillPath, 'utf8');
    
    // Simple regex to parse frontmatter
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    let name = folder;
    let description = 'No description provided.';
    let markdown = content;

    if (match) {
      const frontmatter = match[1];
      markdown = match[2];
      
      const nameMatch = frontmatter.match(/name:\s*"?([^"\n]+)"?/);
      if (nameMatch) name = nameMatch[1].trim();
      
      const descMatch = frontmatter.match(/description:\s*"?([^"\n]+)"?/);
      if (descMatch) description = descMatch[1].trim();
    } else {
      console.log(`Warning: Could not parse frontmatter for ${folder}, using default name/description.`);
    }

    console.log(`Ingesting: ${name}...`);

    const { error } = await supabase
      .from('skills')
      .upsert({
        name,
        description,
        markdown_instructions: markdown
      }, { onConflict: 'name' });

    if (error) {
      console.error(`Error inserting ${name}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(`\nIngestion complete. Success: ${successCount}, Errors: ${errorCount}`);
}

ingestSkills().catch(console.error);
