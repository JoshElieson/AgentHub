"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { supabase, MOCK_SKILLS, type SkillRow } from "@/lib/supabase";
import { compileSkill } from "@/lib/skills-compiler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Terminal, 
  Cpu, 
  Settings, 
  CheckCircle, 
  Download, 
  FolderGit, 
  FileText, 
  Globe, 
  Database,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FolderSync,
  Search,
  X,
  Plus,
  Loader2,
  Tag,
  Info
} from "lucide-react";

export default function SkillsMarketplace() {
  const [skills, setSkills] = useState<SkillRow[]>(MOCK_SKILLS);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<"connected" | "mock">("mock");
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});
  const [exportStatuses, setExportStatuses] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false);

  // Search and Tag state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Ingestion Modal state
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [ingestUrl, setIngestUrl] = useState("");
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState("");
  const [ingestParsed, setIngestParsed] = useState<{
    name: string;
    description: string;
    trigger_phrases: string[];
    markdown_instructions: string;
    tags: string[];
    script_urls: string[];
    source_url: string | null;
  } | null>(null);
  const [confirmingIngest, setConfirmingIngest] = useState(false);

  useEffect(() => {
    // Check if the File System Access API is supported
    if (typeof window !== "undefined") {
      setIsFileSystemAccessSupported("showDirectoryPicker" in window);
    }

    async function fetchSkills() {
      try {
        setLoading(true);
        if (!supabase) {
          console.log("Supabase not configured, using mock marketplace data.");
          setSkills(MOCK_SKILLS);
          setDbStatus("mock");
          return;
        }

        const { data, error } = await supabase
          .from("skills")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const formattedData: SkillRow[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            trigger_phrases: Array.isArray(row.trigger_phrases) ? row.trigger_phrases : [],
            markdown_instructions: row.markdown_instructions || "",
            script_urls: Array.isArray(row.script_urls) ? row.script_urls : [],
            tags: Array.isArray(row.tags) ? row.tags : [],
            source_url: row.source_url || null,
            created_at: row.created_at,
          }));
          setSkills(formattedData);
          setDbStatus("connected");
        } else {
          setSkills(MOCK_SKILLS);
          setDbStatus("connected");
        }
      } catch (err) {
        console.error("Failed to fetch skills from Supabase:", err);
        setSkills(MOCK_SKILLS);
        setDbStatus("mock");
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, []);

  const toggleInstructions = (id: string) => {
    setExpandedInstructions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /**
   * Main export handler using the modern Browser File System Access API
   */
  const handleFileSystemExport = async (skill: SkillRow, target: "antigravity" | "claude") => {
    if (typeof window === "undefined") return;

    const statusKey = `${skill.id}-${target}`;

    // Graceful check for API support
    if (!("showDirectoryPicker" in window)) {
      alert(
        `Your browser does not support the File System Access API (e.g. Firefox or Safari).\n\n` +
        `Please use a Chromium-based browser (Chrome, Edge, Opera) to export files directly to your local workspace, ` +
        `or use our local server-side API helper instead.`
      );
      return;
    }

    setExportStatuses(prev => ({
      ...prev,
      [statusKey]: { type: "success", message: "Awaiting folder selection..." }
    }));

    try {
      const targetFolderDesc = target === "antigravity" ? ".agents/skills" : ".claude/skills";
      
      // 1. Alert the user to select their target local directory
      alert(
        `[Direct Local Export]\n\n` +
        `Please choose the destination folder in the next screen.\n` +
        `Ideally, select the root of your local '${targetFolderDesc}' folder.`
      );

      // 2. Invoke window.showDirectoryPicker
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { type: "success", message: "Compiling structure..." }
      }));

      // 3. Create a new subdirectory named after the skill's slug
      const folderName = skill.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const subDirHandle = await directoryHandle.getDirectoryHandle(folderName, {
        create: true,
      });

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { type: "success", message: "Streaming SKILL.md..." }
      }));

      // 4. Create and write to SKILL.md
      const fileHandle = await subDirHandle.getFileHandle("SKILL.md", {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      
      // Compile the YAML frontmatter + markdown instructions
      const compiledContent = compileSkill(skill, target);
      
      await writable.write(compiledContent);
      await writable.close();

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { 
          type: "success", 
          message: `Exported to /${folderName}/SKILL.md!` 
        }
      }));

      // Clear the status after 5 seconds
      setTimeout(() => {
        setExportStatuses(prev => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
      }, 5000);

    } catch (err: any) {
      console.error("Local file system write error:", err);
      
      // 5. Catch AbortError if the user closes the picker
      if (err.name === "AbortError") {
        setExportStatuses(prev => ({
          ...prev,
          [statusKey]: { 
            type: "error", 
            message: "Export cancelled." 
          }
        }));
      } else {
        setExportStatuses(prev => ({
          ...prev,
          [statusKey]: { 
            type: "error", 
            message: err.message || "Failed to write local files." 
          }
        }));
      }

      // Auto-clear error after 4 seconds
      setTimeout(() => {
        setExportStatuses(prev => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
      }, 4000);
    }
  };

  /**
   * Fallback server-side compiler/writer if filesystem picker is not supported
   */
  const handleServerFallbackExport = async (skill: SkillRow, target: "antigravity" | "claude") => {
    const statusKey = `${skill.id}-${target}`;
    setExportStatuses(prev => ({
      ...prev,
      [statusKey]: { type: "success", message: "Exporting via server..." }
    }));

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: skill.name,
          description: skill.description,
          markdownInstructions: skill.markdown_instructions,
          target,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to compile skill");
      }

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { 
          type: "success", 
          message: `Server wrote to ${result.path}!` 
        }
      }));

      setTimeout(() => {
        setExportStatuses(prev => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
      }, 5000);

    } catch (err: any) {
      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { 
          type: "error", 
          message: err.message || "Export failed" 
        }
      }));
    }
  };

  // Ingestion handlers
  const handleIngestStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestUrl.trim()) return;

    setIngestLoading(true);
    setIngestError("");
    setIngestParsed(null);

    try {
      const response = await fetch("/api/skills/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: ingestUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse URL");
      }

      setIngestParsed(result.parsed);
    } catch (err: any) {
      console.error(err);
      setIngestError(err.message || "An unexpected error occurred while parsing the URL.");
    } finally {
      setIngestLoading(false);
    }
  };

  const handleParsedFieldChange = (field: string, value: any) => {
    if (!ingestParsed) return;
    setIngestParsed({
      ...ingestParsed,
      [field]: value,
    });
  };

  const handleIngestConfirm = async () => {
    if (!ingestParsed) return;

    setConfirmingIngest(true);
    setIngestError("");

    try {
      if (dbStatus === "connected" && supabase) {
        const { data, error } = await supabase
          .from("skills")
          .insert([
            {
              name: ingestParsed.name,
              description: ingestParsed.description,
              trigger_phrases: ingestParsed.trigger_phrases,
              markdown_instructions: ingestParsed.markdown_instructions,
              tags: ingestParsed.tags,
              script_urls: ingestParsed.script_urls,
              source_url: ingestParsed.source_url,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newRow: SkillRow = {
            id: data[0].id,
            name: data[0].name,
            description: data[0].description,
            trigger_phrases: Array.isArray(data[0].trigger_phrases) ? data[0].trigger_phrases : [],
            markdown_instructions: data[0].markdown_instructions || "",
            script_urls: Array.isArray(data[0].script_urls) ? data[0].script_urls : [],
            tags: Array.isArray(data[0].tags) ? data[0].tags : [],
            source_url: data[0].source_url || null,
            created_at: data[0].created_at,
          };
          setSkills((prev) => [newRow, ...prev]);
        }
      } else {
        // Fallback mock mode
        const mockRow: SkillRow = {
          id: `mock-${Date.now()}`,
          name: ingestParsed.name,
          description: ingestParsed.description,
          trigger_phrases: ingestParsed.trigger_phrases,
          markdown_instructions: ingestParsed.markdown_instructions,
          script_urls: ingestParsed.script_urls,
          tags: ingestParsed.tags,
          source_url: ingestParsed.source_url,
          created_at: new Date().toISOString(),
        };
        setSkills((prev) => [mockRow, ...prev]);
      }

      setIsIngestOpen(false);
      setIngestUrl("");
      setIngestParsed(null);
    } catch (err: any) {
      console.error(err);
      setIngestError(err.message || "Failed to save skill to database.");
    } finally {
      setConfirmingIngest(false);
    }
  };

  // Get all unique tags from currently loaded skills
  const allTags = Array.from(
    new Set(skills.flatMap((s) => s.tags || []))
  ).sort();

  // Filter skills based on search query and selected tags
  const filteredSkills = skills.filter((skill) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query) ||
      skill.markdown_instructions.toLowerCase().includes(query) ||
      (skill.tags || []).some((t) => t.toLowerCase().includes(query)) ||
      (skill.trigger_phrases || []).some((tp) => tp.toLowerCase().includes(query));

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => (skill.tags || []).includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl py-8 sm:py-10">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-dim px-2 py-0.5 text-2xs font-semibold text-brand-muted">
                <Sparkles className="h-3 w-3 animate-pulse" /> Local Sandbox
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
                Centralized Skills Marketplace
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted">
              Normalized Supabase backend records dynamically mapped and exported directly to your local workspace files.
            </p>
          </div>

          {/* API Status indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* File System Access Status */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-xs text-muted backdrop-blur">
              <FolderSync className="h-4 w-4 text-brand-muted" />
              <span>Browser FS API:</span>
              {isFileSystemAccessSupported ? (
                <span className="font-medium text-emerald-400">Supported</span>
              ) : (
                <span className="font-medium text-amber-400" title="Firefox, Safari and old browsers are not supported. Fallback active.">
                  Fallback Alert
                </span>
              )}
            </div>

            {/* Supabase Status */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-xs text-muted backdrop-blur">
              <Database className="h-4 w-4 text-brand-muted" />
              <span>Storage:</span>
              {dbStatus === "connected" ? (
                <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Supabase Live
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-medium text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Mock Sandbox
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search, Tag Filtering, and Ingestion controls */}
        <div className="mt-6 flex flex-col gap-4 border-b border-line pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/60">
              <Search className="h-4 w-4 shrink-0 text-subtle" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search local skills by name, description, trigger phrases, or tags..."
                className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-surface-2 hover:text-content"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Ingest Button */}
            <Button
              variant="primary"
              size="md"
              className="sm:w-auto w-full gap-2 px-5 py-2.5 rounded-xl text-sm"
              onClick={() => setIsIngestOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Ingest External Skill
            </Button>
          </div>

          {/* Tag Chips */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-faint flex items-center gap-1 mr-1">
                <Tag className="h-3.5 w-3.5" /> Filter by tags:
              </span>
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
                      isSelected
                        ? "bg-brand border-brand text-brand-fg shadow-glow/10"
                        : "bg-surface-2 border-line text-muted hover:border-line-strong hover:text-content"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-brand-muted hover:text-brand hover:underline font-semibold flex items-center gap-0.5 ml-2"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="mt-4 text-sm text-muted">Fetching centralized skill definitions...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center py-12 rounded-xl border border-line bg-surface-2/40">
            <AlertCircle className="h-8 w-8 text-subtle" />
            <p className="mt-4 text-sm text-content font-medium">No skills match your filters</p>
            <p className="mt-1 text-xs text-muted">Try clearing search or filters to see all available skills.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTags([]);
              }}
              className="mt-4 text-xs font-semibold text-brand-muted hover:text-brand underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredSkills.map((skill) => {
              const hasInstructions = !!skill.markdown_instructions;
              const isExpanded = !!expandedInstructions[skill.id];
              const antiStatus = exportStatuses[`${skill.id}-antigravity`];
              const claudeStatus = exportStatuses[`${skill.id}-claude`];

              return (
                <div 
                  key={skill.id}
                  className="flex flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-line hover:shadow-glow/5"
                >
                  {/* Skill Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-mono text-base font-semibold text-content group-hover:text-white">
                        {skill.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-faint">
                        ID: {skill.id}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-2xs font-mono text-brand-muted border border-line">
                      <Terminal className="h-3 w-3" /> skill.json
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm text-muted leading-relaxed">
                    {skill.description}
                  </p>

                  {/* Tags on Skill Card */}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {skill.tags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="rounded bg-brand-dim border border-brand-line px-2 py-0.5 text-3xs font-semibold text-brand-muted"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Source URL */}
                  {skill.source_url && (
                    <div className="mt-3.5 flex items-center gap-1.5">
                      <FolderGit className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
                      <a
                        href={skill.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-mono text-2xs text-brand-muted hover:text-brand hover:underline transition-colors"
                      >
                        {skill.source_url}
                      </a>
                    </div>
                  )}

                  {/* Trigger Phrases */}
                  {skill.trigger_phrases && skill.trigger_phrases.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-2xs font-bold uppercase tracking-wider text-faint">Trigger Phrases</h4>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {skill.trigger_phrases.map((phrase, idx) => (
                          <span 
                            key={idx}
                            className="rounded-sm bg-surface-2 border border-line px-1.5 py-0.5 text-2xs font-medium text-subtle"
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Storage Script URLs */}
                  {skill.script_urls && skill.script_urls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-2xs font-bold uppercase tracking-wider text-faint">Executable Scripts (Storage Bucket)</h4>
                      <div className="mt-1.5 space-y-1">
                        {skill.script_urls.map((url, idx) => (
                          <a 
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 font-mono text-2xs text-brand-muted hover:text-brand transition-colors"
                          >
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="truncate">{url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collapsible Instructions */}
                  {hasInstructions && (
                    <div className="mt-4 border-t border-line pt-3">
                      <button
                        onClick={() => toggleInstructions(skill.id)}
                        className="flex w-full items-center justify-between text-2xs font-bold uppercase tracking-wider text-subtle hover:text-content transition-colors"
                      >
                        <span>Markdown Instructions</span>
                        <span className="text-brand-muted hover:underline text-2xs font-semibold capitalize font-sans">
                          {isExpanded ? "Hide" : "Show"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 rounded-lg bg-surface-2 p-3 font-mono text-2xs border border-line-strong overflow-x-auto max-h-48 scrollbar-thin">
                          <pre className="text-subtle whitespace-pre-wrap">{skill.markdown_instructions}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Spacer to push buttons down */}
                  <div className="flex-1 min-h-[1.5rem]" />

                  {/* Export Action Buttons */}
                  <div className="mt-4 border-t border-line pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Export for Antigravity */}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-2xs"
                          onClick={() => handleFileSystemExport(skill, "antigravity")}
                        >
                          <FolderGit className="h-3.5 w-3.5" />
                          Export for Antigravity
                        </Button>
                        {antiStatus && (
                          <span className={`text-center font-mono text-2xs font-medium ${antiStatus.type === "success" ? "text-emerald-400" : "text-danger"}`}>
                            {antiStatus.message}
                          </span>
                        )}
                      </div>

                      {/* Export for Claude Code */}
                      <div className="flex flex-col gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-2xs text-content hover:bg-surface-2 border border-line-strong hover:border-line-strong-hover"
                          onClick={() => handleFileSystemExport(skill, "claude")}
                        >
                          <Cpu className="h-3.5 w-3.5" />
                          Export for Claude Code
                        </Button>
                        {claudeStatus && (
                          <span className={`text-center font-mono text-2xs font-medium ${claudeStatus.type === "success" ? "text-emerald-400" : "text-danger"}`}>
                            {claudeStatus.message}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Server-side Fallback Link */}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => handleServerFallbackExport(skill, "antigravity")}
                        className="text-3xs text-muted hover:text-brand-muted underline transition-colors"
                      >
                        Trouble with picker? Export via local server-side fallback
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ingest Skill Dialog Modal */}
      {isIngestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-canvas/80 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              if (!ingestLoading && !confirmingIngest) {
                setIsIngestOpen(false);
                setIngestUrl("");
                setIngestParsed(null);
                setIngestError("");
              }
            }}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-overlay animate-slide-up max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-lg font-semibold text-content flex items-center gap-2">
                <Plus className="h-5 w-5 text-brand-muted" /> Ingest Public Skill
              </h2>
              <button
                onClick={() => {
                  setIsIngestOpen(false);
                  setIngestUrl("");
                  setIngestParsed(null);
                  setIngestError("");
                }}
                disabled={ingestLoading || confirmingIngest}
                className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-content transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {ingestError && (
              <div className="mt-4 flex gap-2 rounded-xl bg-danger-dim border border-danger-line p-3.5 text-sm text-danger-muted animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-danger">Ingestion Error</h4>
                  <p className="mt-0.5 text-xs">{ingestError}</p>
                </div>
              </div>
            )}

            {!ingestParsed ? (
              // Step 1: Input URL
              <form onSubmit={handleIngestStart} className="mt-4 space-y-4">
                <p className="text-xs text-muted leading-relaxed">
                  Enter the URL of a public skill repository (e.g. GitHub repo link like <code className="font-mono text-brand-muted">https://github.com/lina-vogel/impeccable-ui-reviewer</code>) or a raw <code className="font-mono text-brand-muted">SKILL.md</code> markdown file.
                  We will fetch and parse it, extract its frontmatter metadata, and automatically categorize tags to ingest it into the marketplace.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="url" className="text-xs font-semibold text-subtle">
                    Skill URL / GitHub Repository
                  </label>
                  <input
                    id="url"
                    type="url"
                    required
                    placeholder="https://github.com/owner/repository-name"
                    value={ingestUrl}
                    onChange={(e) => setIngestUrl(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-content placeholder:text-faint focus:outline-none focus:border-brand/60 transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsIngestOpen(false)}
                    className="rounded-lg text-content"
                    disabled={ingestLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={ingestLoading || !ingestUrl}
                    className="rounded-lg gap-2"
                  >
                    {ingestLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching & Parsing...
                      </>
                    ) : (
                      "Ingest Skill"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // Step 2: Preview & Edit parsed values
              <div className="mt-4 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 rounded-xl bg-brand-dim border border-brand-line p-3 text-xs text-brand-muted">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    Successfully parsed skill! Review and customize the metadata fields below before confirming ingestion.
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Name Slug */}
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-faint">
                      Name / Slug
                    </label>
                    <input
                      type="text"
                      required
                      value={ingestParsed.name}
                      onChange={(e) => handleParsedFieldChange("name", e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
                      className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-mono text-content focus:outline-none focus:border-brand"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1">
                    <label className="text-2xs font-bold uppercase tracking-wider text-faint">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={ingestParsed.tags.join(", ")}
                      onChange={(e) => handleParsedFieldChange("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                      className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-content focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase tracking-wider text-faint">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={ingestParsed.description}
                    onChange={(e) => handleParsedFieldChange("description", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-content focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Trigger Phrases */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase tracking-wider text-faint">
                    Trigger Phrases (comma separated)
                  </label>
                  <input
                    type="text"
                    value={ingestParsed.trigger_phrases.join(", ")}
                    onChange={(e) => handleParsedFieldChange("trigger_phrases", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                    className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-content focus:outline-none focus:border-brand"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold uppercase tracking-wider text-faint">
                    Markdown Instructions
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={ingestParsed.markdown_instructions}
                    onChange={(e) => handleParsedFieldChange("markdown_instructions", e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-mono text-content focus:outline-none focus:border-brand scrollbar-thin"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIngestParsed(null)}
                    disabled={confirmingIngest}
                    className="text-xs text-muted hover:text-brand transition-colors underline"
                  >
                    Back to URL input
                  </button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsIngestOpen(false);
                        setIngestUrl("");
                        setIngestParsed(null);
                      }}
                      className="rounded-lg text-content"
                      disabled={confirmingIngest}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleIngestConfirm}
                      variant="primary"
                      disabled={confirmingIngest || !ingestParsed.name || !ingestParsed.description || !ingestParsed.markdown_instructions}
                      className="rounded-lg gap-2"
                    >
                      {confirmingIngest ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Confirm Ingestion"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
