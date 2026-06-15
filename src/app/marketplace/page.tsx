"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Tabs } from "@/components/ui/tabs";
import { McpMarketplaceView } from "@/components/mcp-marketplace-view";
import { supabase, MOCK_SKILLS, type SkillRow } from "@/lib/supabase";
import { compileSkill } from "@/lib/skills-compiler";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
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
  Info,
  ArrowUpDown,
  Star,
} from "lucide-react";

type SortOption = "newest" | "rating" | "stars" | "exports";
const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  rating: "Highest Rated",
  stars: "Most Starred",
  exports: "Most Exported",
};

// Extended type to include similarity from semantic search
interface SkillSearchResult extends SkillRow {
  similarity?: number | null;
}

function SkillsMarketplaceView() {
  const searchParams = useSearchParams();
  const [skills, setSkills] = useState<SkillSearchResult[]>(MOCK_SKILLS);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "mock">("mock");
  const [searchMode, setSearchMode] = useState<"listing" | "semantic" | "text" | "client">("listing");
  const [expandedInstructions, setExpandedInstructions] = useState<Record<string, boolean>>({});
  const [expandedMarkdown, setExpandedMarkdown] = useState<Record<string, string>>({});
  const [exportStatuses, setExportStatuses] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false);

  // Search and Tag state — seed from ?tag= query param
  const [searchQuery, setSearchQuery] = useState("");
  const initialTag = searchParams.get("tag");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTag ? [initialTag] : []);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // ── Server-side search function ──────────────────────────────────────────
  const performSearch = useCallback(async (query: string) => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("limit", "1000");

      const res = await fetch(`/api/skills/search?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // If search API isn't available, fall back to client-side
        if (body.fallback) {
          setSearchMode("client");
          return;
        }
        throw new Error(body.error || "Search failed");
      }

      const { results, mode } = await res.json();

      const formattedData: SkillSearchResult[] = (results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        trigger_phrases: Array.isArray(row.trigger_phrases) ? row.trigger_phrases : [],
        markdown_instructions: row.markdown_instructions || "",
        script_urls: Array.isArray(row.script_urls) ? row.script_urls : [],
        tags: Array.isArray(row.tags) ? row.tags : [],
        source_url: row.source_url || null,
        created_at: row.created_at,
        star_count: row.star_count ?? 0,
        export_count: row.export_count ?? 0,
        avg_rating: row.avg_rating ? Number(row.avg_rating) : 0,
        rating_count: row.rating_count ?? 0,
        similarity: row.similarity ?? null,
      }));

      setSkills(formattedData);
      setDbStatus("connected");
      setSearchMode(mode || "listing");
    } catch (err) {
      console.error("Search API error, falling back to client-side:", err);
      setSearchMode("client");
      // On error, try to load all skills from Supabase directly
      if (supabase) {
        const { data } = await supabase
          .from("skills")
          .select("id, name, description, tags, trigger_phrases, source_url, script_urls, created_at, star_count, export_count, avg_rating, rating_count")
          .order("name", { ascending: true });
        if (data && data.length > 0) {
          setSkills(data.map((row: any) => ({
            ...row,
            trigger_phrases: Array.isArray(row.trigger_phrases) ? row.trigger_phrases : [],
            markdown_instructions: "",
            script_urls: Array.isArray(row.script_urls) ? row.script_urls : [],
            tags: Array.isArray(row.tags) ? row.tags : [],
            source_url: row.source_url || null,
            star_count: row.star_count ?? 0,
            export_count: row.export_count ?? 0,
            avg_rating: row.avg_rating ? Number(row.avg_rating) : 0,
            rating_count: row.rating_count ?? 0,
            similarity: null,
          })));
        }
      }
    } finally {
      setSearching(false);
    }
  }, []);

  // ── Debounced search on query change ────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, searchQuery ? 300 : 0); // Immediate for empty query (show all)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  // ── Fetch markdown instructions on-demand ───────────────────────────────
  const fetchMarkdownInstructions = useCallback(async (skillId: string) => {
    if (expandedMarkdown[skillId]) return; // Already fetched
    if (!supabase) return;

    const { data, error } = await supabase
      .from("skills")
      .select("markdown_instructions")
      .eq("id", skillId)
      .single();

    if (!error && data) {
      setExpandedMarkdown((prev) => ({
        ...prev,
        [skillId]: data.markdown_instructions || "(No instructions available)",
      }));
    }
  }, [expandedMarkdown]);

  useEffect(() => {
    // Check if the File System Access API is supported
    if (typeof window !== "undefined") {
      setIsFileSystemAccessSupported("showDirectoryPicker" in window);
    }

    // Initial load
    async function initialLoad() {
      try {
        setLoading(true);
        if (!supabase) {
          console.log("Supabase not configured, using mock marketplace data.");
          setSkills(MOCK_SKILLS);
          setDbStatus("mock");
          setSearchMode("client");
          return;
        }
        await performSearch("");
      } catch (err) {
        console.error("Failed initial load:", err);
        setSkills(MOCK_SKILLS);
        setDbStatus("mock");
        setSearchMode("client");
      } finally {
        setLoading(false);
      }
    }

    initialLoad();
  }, []);

  const toggleInstructions = (id: string) => {
    const willExpand = !expandedInstructions[id];
    setExpandedInstructions(prev => ({
      ...prev,
      [id]: willExpand
    }));
    // Fetch markdown on-demand when expanding
    if (willExpand) {
      fetchMarkdownInstructions(id);
    }
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
      
      // 1. Alert the user to select their project root (or the skills folder directly)
      alert(
        `[Direct Local Export]\n\n` +
        `Select your project root or any parent folder.\n` +
        `We'll automatically create the '${targetFolderDesc}/<skill-name>/' path for you.`
      );

      // 2. Invoke window.showDirectoryPicker
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { type: "success", message: "Resolving target path..." }
      }));

      // 3. Smart path resolution into the target subdirectory
      //    Detects if the user already picked a directory partway into the path
      //    (e.g., picked ".agents" or "skills") and skips already-traversed segments.
      const pathSegments = target === "antigravity"
        ? [".agents", "skills"]
        : [".claude", "skills"];

      const pickedDirName = directoryHandle.name;
      let startIndex = 0;
      for (let i = 0; i < pathSegments.length; i++) {
        if (pickedDirName === pathSegments[i]) {
          startIndex = i + 1; // Skip this segment and all before it
          break;
        }
      }

      let currentHandle = directoryHandle;
      for (let i = startIndex; i < pathSegments.length; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], {
          create: true,
        });
      }

      // 4. Create a new subdirectory named after the skill's slug
      const folderName = skill.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const subDirHandle = await currentHandle.getDirectoryHandle(folderName, {
        create: true,
      });

      setExportStatuses(prev => ({
        ...prev,
        [statusKey]: { type: "success", message: "Streaming SKILL.md..." }
      }));

      // 5. Create and write to SKILL.md
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
          message: `Exported to ${targetFolderDesc}/${folderName}/SKILL.md!` 
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
          const newRow: SkillSearchResult = {
            id: data[0].id,
            name: data[0].name,
            description: data[0].description,
            trigger_phrases: Array.isArray(data[0].trigger_phrases) ? data[0].trigger_phrases : [],
            markdown_instructions: data[0].markdown_instructions || "",
            script_urls: Array.isArray(data[0].script_urls) ? data[0].script_urls : [],
            tags: Array.isArray(data[0].tags) ? data[0].tags : [],
            source_url: data[0].source_url || null,
            created_at: data[0].created_at,
            star_count: 0,
            export_count: 0,
            avg_rating: 0,
            rating_count: 0,
            similarity: null,
          };
          setSkills((prev) => [newRow, ...prev]);

          // Fire background embedding generation for the new skill
          fetch("/api/skills/embed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillId: data[0].id }),
          }).catch((e) => console.warn("Background embedding failed:", e));
        }
      } else {
        // Fallback mock mode
        const mockRow: SkillSearchResult = {
          id: `mock-${Date.now()}`,
          name: ingestParsed.name,
          description: ingestParsed.description,
          trigger_phrases: ingestParsed.trigger_phrases,
          markdown_instructions: ingestParsed.markdown_instructions,
          script_urls: ingestParsed.script_urls,
          tags: ingestParsed.tags,
          source_url: ingestParsed.source_url,
          created_at: new Date().toISOString(),
          star_count: 0,
          export_count: 0,
          avg_rating: 0,
          rating_count: 0,
          similarity: null,
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

  // Filter skills — server handles search, client handles tag filtering
  const filteredSkills = skills.filter((skill) => {
    // In client fallback mode, also do text search client-side
    if (searchMode === "client" && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        (skill.tags || []).some((t) => t.toLowerCase().includes(query)) ||
        (skill.trigger_phrases || []).some((tp) => tp.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Tag filtering is always client-side for instant UX
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => (skill.tags || []).includes(tag));

    return matchesTags;
  });

  // Sort filtered skills
  const sortedSkills = [...filteredSkills].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      case "stars":
        return (b.star_count ?? 0) - (a.star_count ?? 0);
      case "exports":
        return (b.export_count ?? 0) - (a.export_count ?? 0);
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        // No sort selected, keep original order (which is semantic similarity or alphabetical)
        return 0;
    }
  });

  return (
    <div className="flex flex-col gap-6">
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

      {/* Search, Tag Filtering, and Ingestion controls */}
        <div className="mt-6 flex flex-col gap-4 border-b border-line pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className={cn(
              "flex flex-1 items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/60",
              searching ? "border-brand/40" : "border-line"
            )}>
              {searching ? (
                <Loader2 className="h-4 w-4 shrink-0 text-brand-muted animate-spin" />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-subtle" />
              )}
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === "semantic" || searchMode === "listing" ? "Semantic search — try \"help me process payments\" or \"test my frontend\"..." : "Search skills by name, description, or tags..."}
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
              {/* Search mode indicator */}
              {searchQuery && !searching && (
                <span className={cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider border",
                  searchMode === "semantic"
                    ? "bg-brand/10 border-brand/30 text-brand"
                    : searchMode === "text"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-surface-2 border-line text-muted"
                )}>
                  {searchMode === "semantic" ? "AI" : searchMode === "text" ? "Text" : "Local"}
                </span>
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
        ) : sortedSkills.length === 0 ? (
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
          <>
            {/* Sort Controls */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-muted">
                <span className="font-medium text-content tabular-nums">{sortedSkills.length}</span>{" "}
                {sortedSkills.length === 1 ? "skill" : "skills"}
              </p>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-faint" />
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(sortBy === opt ? null : opt)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
                      sortBy === opt
                        ? "bg-brand border-brand text-brand-fg"
                        : "bg-surface-2 border-line text-muted hover:border-line-strong hover:text-content"
                    )}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            </div>

          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sortedSkills.map((skill) => {
              const antiStatus = exportStatuses[`${skill.id}-antigravity`];
              const claudeStatus = exportStatuses[`${skill.id}-claude`];
              const similarityPct = skill.similarity != null ? Math.round(skill.similarity * 100) : null;

              return (
                <div
                  key={skill.id}
                  className="flex flex-col rounded-card border border-line bg-surface transition-all duration-300 hover:border-brand-line hover:shadow-glow/5"
                >
                  {/* Clickable area — navigates to detail page */}
                  <a
                    href={`/skills/${skill.id}`}
                    className="flex flex-col flex-1 p-5 cursor-pointer group"
                  >
                    {/* Name + Similarity */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-mono text-base font-semibold text-content group-hover:text-white transition-colors truncate">
                        {skill.name}
                      </h3>
                      {similarityPct !== null && searchMode === "semantic" && (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold border shrink-0",
                          similarityPct >= 80
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : similarityPct >= 60
                            ? "bg-brand-dim border-brand-line text-brand-muted"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        )}>
                          <Sparkles className="h-2.5 w-2.5" />
                          {similarityPct}%
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-3">
                      {skill.description}
                    </p>

                    {/* Trigger Phrases (compact) */}
                    {skill.trigger_phrases && skill.trigger_phrases.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {skill.trigger_phrases.slice(0, 3).map((phrase, idx) => (
                          <span
                            key={idx}
                            className="rounded-sm bg-surface-2 border border-line px-1.5 py-0.5 text-2xs font-medium text-subtle truncate max-w-[200px]"
                          >
                            "{phrase}"
                          </span>
                        ))}
                        {skill.trigger_phrases.length > 3 && (
                          <span className="text-2xs text-faint font-medium px-1 py-0.5">
                            +{skill.trigger_phrases.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* GitHub Source */}
                    {skill.source_url && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <FolderGit className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
                        <span className="truncate font-mono text-2xs text-brand-muted">
                          {skill.source_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
                        </span>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="mt-3 pt-3 border-t border-line/60 flex items-center gap-3">
                      <RatingStars
                        rating={skill.avg_rating}
                        size="sm"
                        showValue
                        count={skill.rating_count}
                      />
                      <span className="h-3 w-px bg-line" />
                      <span className="flex items-center gap-1 text-2xs text-subtle">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="tabular-nums font-medium">{formatCompact(skill.star_count)}</span>
                      </span>
                      <span className="flex items-center gap-1 text-2xs text-subtle">
                        <Download className="h-3 w-3" />
                        <span className="tabular-nums font-medium">{formatCompact(skill.export_count)}</span>
                      </span>
                    </div>
                  </a>

                  {/* Export Actions — separated from clickable area */}
                  <div className="border-t border-line px-5 py-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-2xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSystemExport(skill, "antigravity");
                          }}
                        >
                          <FolderGit className="h-3 w-3" />
                          Antigravity
                        </Button>
                        {antiStatus && (
                          <span className={cn(
                            "text-center font-mono text-3xs font-medium",
                            antiStatus.type === "success" ? "text-emerald-400" : "text-danger"
                          )}>
                            {antiStatus.message}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-2xs text-content hover:bg-surface-2 border border-line-strong"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSystemExport(skill, "claude");
                          }}
                        >
                          <Cpu className="h-3 w-3" />
                          Claude
                        </Button>
                        {claudeStatus && (
                          <span className={cn(
                            "text-center font-mono text-3xs font-medium",
                            claudeStatus.type === "success" ? "text-emerald-400" : "text-danger"
                          )}>
                            {claudeStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

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
    </div>
  );
}

export default function MarketplacesPage() {
  const tabs = [
    {
      id: "skills",
      label: "Skills",
      icon: <Sparkles className="h-4 w-4" />,
      content: <SkillsMarketplaceView />
    },
    {
      id: "mcp",
      label: "MCP Servers",
      icon: <Terminal className="h-4 w-4" />,
      content: <McpMarketplaceView />
    }
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl py-8 sm:py-10">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
              Marketplaces
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Discover, configure, and install Skills and MCP servers for your AI agents.
          </p>
        </div>
        <Tabs tabs={tabs} defaultTab="mcp" />
      </div>
    </AppShell>
  );
}
