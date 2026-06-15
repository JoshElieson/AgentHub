import { NextResponse } from "next/server";

// Helper to clean quotes from yaml string values
function cleanYamlValue(val: string): string {
  return val.replace(/^["']|["']$/g, "").trim();
}

// Helper to auto-generate tags from text content
function generateTags(name: string, description: string, content: string): string[] {
  const tagsSet = new Set<string>();
  const fullText = `${name} ${description} ${content}`.toLowerCase();

  const keywordMap: Record<string, string[]> = {
    react: ["react", "frontend"],
    nextjs: ["react", "frontend"],
    jsx: ["react", "frontend"],
    accessibility: ["accessibility", "frontend"],
    a11y: ["accessibility", "frontend"],
    git: ["git", "development"],
    commit: ["git", "development"],
    github: ["git", "development"],
    security: ["security"],
    owasp: ["security"],
    audit: ["security"],
    jailbreak: ["security"],
    injection: ["security"],
    mcp: ["mcp"],
    "model context": ["mcp"],
    test: ["testing"],
    jest: ["testing"],
    vitest: ["testing"],
    pytest: ["testing"],
    coverage: ["testing"],
    sql: ["database", "sql"],
    postgres: ["database", "sql"],
    database: ["database"],
    supabase: ["database", "supabase"],
    css: ["design", "ui"],
    ui: ["ui"],
    design: ["design", "ui"],
    animation: ["design", "ui"],
    workflow: ["automation"],
    automation: ["automation"],
    python: ["python"],
    cli: ["cli"],
    bash: ["cli"],
    terminal: ["cli"],
  };

  for (const [key, tags] of Object.entries(keywordMap)) {
    if (fullText.includes(key)) {
      tags.forEach((tag) => tagsSet.add(tag));
    }
  }

  // Add a generic tag if none matched
  if (tagsSet.size === 0) {
    tagsSet.add("general");
  }

  return Array.from(tagsSet);
}

// Helper to extract trigger phrases from name if missing
function generateTriggerPhrases(name: string): string[] {
  const parts = name.split("-");
  if (parts.length > 1) {
    return [
      parts.join(" "),
      `run ${parts.join(" ")}`,
      parts.slice(1).join(" "),
    ];
  }
  return [name, `run ${name}`];
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url.trim();

    // 1. Resolve GitHub repository pages to raw SKILL.md or README.md
    const githubRepoRegex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/?|(?:\/tree\/([^/]+))\/?)$/;
    const githubBlobRegex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

    const urlsToTry: string[] = [];

    if (githubBlobRegex.test(targetUrl)) {
      // Direct file in a GitHub repo -> transform to raw content url
      const match = targetUrl.match(githubBlobRegex);
      if (match) {
        const [, owner, repo, branch, path] = match;
        urlsToTry.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
      }
    } else if (githubRepoRegex.test(targetUrl)) {
      // GitHub repo root -> try standard paths (SKILL.md, then README.md) on main/master branches
      const match = targetUrl.match(githubRepoRegex);
      if (match) {
        const [, owner, repo, branchOption] = match;
        const branch = branchOption || "main";
        
        urlsToTry.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`);
        urlsToTry.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`);
        
        // If branch wasn't specified, also check 'master' branch fallbacks
        if (!branchOption) {
          urlsToTry.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/SKILL.md`);
          urlsToTry.push(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
        }
      }
    } else {
      // For any other URL, use it directly
      urlsToTry.push(targetUrl);
    }

    let textContent = "";
    let fetchedUrl = "";
    let success = false;

    for (const fetchUrl of urlsToTry) {
      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          textContent = await response.text();
          fetchedUrl = fetchUrl;
          success = true;
          break;
        }
      } catch (e) {
        // Continue to try next URL
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: `Could not fetch content from URL. Checked: ${urlsToTry.join(", ")}` },
        { status: 400 }
      );
    }

    // 2. Parse YAML Frontmatter & Markdown Content
    let name = "";
    let description = "";
    let trigger_phrases: string[] = [];
    let tags: string[] = [];
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
          const val = line.slice(colonIdx + 1).trim();
          const cleanVal = cleanYamlValue(val);

          if (key === "name") {
            name = cleanVal;
          } else if (key === "description") {
            description = cleanVal;
          } else if (key === "trigger_phrases" || key === "triggers") {
            try {
              // Attempt to parse JSON array: ["a", "b"]
              const parsed = JSON.parse(val.replace(/'/g, '"'));
              trigger_phrases = Array.isArray(parsed) ? parsed : [cleanVal];
            } catch (e) {
              trigger_phrases = cleanVal.split(",").map((v) => v.trim()).filter(Boolean);
            }
          } else if (key === "tags") {
            try {
              const parsed = JSON.parse(val.replace(/'/g, '"'));
              tags = Array.isArray(parsed) ? parsed : [cleanVal];
            } catch (e) {
              tags = cleanVal.split(",").map((v) => v.trim()).filter(Boolean);
            }
          }
        }
      }
    }

    // 3. Fallbacks for missing metadata
    // Name fallback from first H1
    if (!name) {
      const h1Match = markdown_instructions.match(/^#\s+(.+)$/m);
      if (h1Match) {
        name = h1Match[1].trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      } else {
        // Fallback from filename in URL
        const urlParts = fetchedUrl.split("/");
        const lastPart = urlParts[urlParts.length - 1];
        name = lastPart.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      }
    }

    // Ensure name is clean slug format
    name = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    // Description fallback from first text paragraph
    if (!description) {
      const paragraphs = markdown_instructions
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p && !p.startsWith("#") && !p.startsWith(">") && !p.startsWith("`"));
      
      if (paragraphs.length > 0) {
        const firstParagraph = paragraphs[0];
        description = firstParagraph.length > 160 
          ? firstParagraph.slice(0, 157) + "..." 
          : firstParagraph;
      } else {
        description = `Ingested skill from ${url}`;
      }
    }

    // Tags fallback
    if (tags.length === 0) {
      tags = generateTags(name, description, markdown_instructions);
    }

    // Trigger phrases fallback
    if (trigger_phrases.length === 0) {
      trigger_phrases = generateTriggerPhrases(name);
    }

    return NextResponse.json({
      success: true,
      parsed: {
        name,
        description,
        trigger_phrases,
        markdown_instructions,
        tags,
        script_urls: [],
        source_url: url,
      },
    });
  } catch (error: any) {
    console.error("Error ingesting skill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ingest skill" },
      { status: 500 }
    );
  }
}
