import type { SkillRow } from "./supabase";

/**
 * Capitalizes and formats skill names into a standard display title.
 */
function getDisplayName(name: string): string {
  if (name === "lol-touch-grass") return "League of Legends Reality Check (LoL Touch Grass)";
  
  return name
    .split("-")
    .map((word) => {
      if (word === "lol") return "LoL";
      if (word === "git") return "Git";
      if (word === "react") return "React";
      if (word === "mcp") return "MCP";
      if (word === "api") return "API";
      if (word === "ui") return "UI";
      if (word === "p5js") return "p5.js";
      if (word === "e2e") return "E2E";
      if (word === "sdk") return "SDK";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Compiles a normalized skill database record into a platform-specific SKILL.md format.
 *
 * @param skill The normalized skill row
 * @param platform The target platform ('antigravity' or 'claude')
 * @returns The compiled Markdown content with YAML frontmatter
 */
export function compileSkill(skill: SkillRow, platform: "antigravity" | "claude"): string {
  const folderName = skill.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
  const cleanDescription = skill.description.replace(/\n/g, " ");

  // Compile standard metadata structure conforming strictly to the platform schema
  const frontmatter = `---
name: ${folderName}
description: ${cleanDescription}
metadata:
  author: Nuclexa
  version: "1.0.0"
---

`;

  const displayName = getDisplayName(skill.name);
  
  // Format body with a proper H1 heading and description paragraph
  const body = `# ${displayName}

${cleanDescription}

${skill.markdown_instructions}`;

  return frontmatter + body;
}
