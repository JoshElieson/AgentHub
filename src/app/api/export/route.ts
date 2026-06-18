import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { compileSkill } from "@/lib/skills-compiler";
import { getPlatform } from "@/lib/export-platforms";
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

    // Resolve platform from registry — unknown IDs fall back to the default
    const platform = getPlatform(target);

    // Sanitize name for folder name
    const folderName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    // Build target path from platform's path segments
    const rootDir = process.cwd();
    const targetDir = path.join(rootDir, ...platform.pathSegments, folderName);

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
      source_url: null,
      created_at: new Date().toISOString(),
      star_count: 0,
      export_count: 0,
      avg_rating: 0,
      rating_count: 0,
    };

    // Use unified compiler
    const fileContent = compileSkill(mockSkill, platform.id);
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
