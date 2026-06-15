import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { compileSkill } from "@/lib/skills-compiler";
import type { SkillRow } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { name, description, markdownInstructions, target } = await req.json();

    if (!name || !description || !markdownInstructions || !target) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Sanitize name for folder name
    const folderName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    // Determine target path
    const rootDir = process.cwd();
    let targetDir = "";

    if (target === "antigravity") {
      targetDir = path.join(rootDir, ".agents", "skills", folderName);
    } else if (target === "claude") {
      targetDir = path.join(rootDir, ".claude", "skills", folderName);
    } else {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Ensure the directory exists
    fs.mkdirSync(targetDir, { recursive: true });

    // Build standard skill record mock to compile
    const mockSkill: SkillRow = {
      id: "temp",
      name,
      description,
      trigger_phrases: [],
      markdown_instructions: markdownInstructions,
      script_urls: [],
      tags: [],
      created_at: new Date().toISOString()
    };

    // Use unified compiler
    const fileContent = compileSkill(mockSkill, target);
    const filePath = path.join(targetDir, "SKILL.md");
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return NextResponse.json({
      success: true,
      path: path.relative(rootDir, filePath).replace(/\\/g, "/"),
    });
  } catch (error: any) {
    console.error("Error exporting skill:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export skill" },
      { status: 500 }
    );
  }
}
