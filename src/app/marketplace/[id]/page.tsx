"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkdownPanel } from "@/components/markdown-panel";
import { RatingStars } from "@/components/ui/rating-stars";
import { FavoriteButton } from "@/components/favorite-button";
import { supabase, type SkillRow } from "@/lib/supabase";
import { compileSkill } from "@/lib/skills-compiler";
import { getAnonId } from "@/lib/anon-id";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import {
  FolderGit,
  Globe,
  Terminal,
  Loader2,
  Tag,
  ExternalLink,
  Calendar,
  Copy,
  Check,
  Download,
  ChevronRight,
  BookOpen,
  Zap,
  Link2,
  Info,
  Star,
  BarChart3,
} from "lucide-react";

export default function SkillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [skill, setSkill] = useState<SkillRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Rating state
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Export states
  const [exportStatuses, setExportStatuses] = useState<
    Record<string, { type: "success" | "error"; message: string }>
  >({});
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false);
  const [exportingTarget, setExportingTarget] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFileSystemAccessSupported("showDirectoryPicker" in window);
    }
  }, []);

  // Dynamic page title
  useEffect(() => {
    if (skill) {
      document.title = `${skill.name} — AgentDock Skills`;
    } else if (loading) {
      document.title = "Loading… — AgentDock Skills";
    }
    return () => {
      document.title = "AgentDock — The package registry for AI agents";
    };
  }, [skill, loading]);

  // Fetch skill data
  useEffect(() => {
    async function fetchSkill() {
      if (!supabase || !skillId) {
        setError("Unable to load skill.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("skills")
          .select("*")
          .eq("id", skillId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Skill not found");

        setSkill({
          id: data.id,
          name: data.name,
          description: data.description,
          trigger_phrases: Array.isArray(data.trigger_phrases) ? data.trigger_phrases : [],
          markdown_instructions: data.markdown_instructions || "",
          script_urls: Array.isArray(data.script_urls) ? data.script_urls : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          source_url: data.source_url || null,
          created_at: data.created_at,
          star_count: data.star_count ?? 0,
          export_count: data.export_count ?? 0,
          avg_rating: data.avg_rating ? Number(data.avg_rating) : 0,
          rating_count: data.rating_count ?? 0,
        });
      } catch (err: any) {
        console.error("Failed to fetch skill:", err);
        setError(err.message || "Failed to load skill");
      } finally {
        setLoading(false);
      }
    }

    fetchSkill();
  }, [skillId]);

  // Fetch user's existing rating
  useEffect(() => {
    if (!skillId) return;
    const anonId = getAnonId();
    fetch(`/api/skills/rate?skillId=${skillId}&anonId=${anonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user_rating) setUserRating(data.user_rating);
      })
      .catch(() => {});
  }, [skillId]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Silently fail
    }
  }, []);

  // Submit a rating
  const handleRate = useCallback(
    async (value: number) => {
      if (ratingLoading) return;
      setRatingLoading(true);
      setUserRating(value);

      try {
        const anonId = getAnonId();
        const res = await fetch("/api/skills/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId, anonId, rating: value }),
        });
        const data = await res.json();
        if (res.ok && skill) {
          setSkill({
            ...skill,
            avg_rating: data.avg_rating,
            rating_count: data.rating_count,
          });
          setUserRating(data.user_rating);
        }
      } catch {
        // Keep optimistic value
      } finally {
        setRatingLoading(false);
      }
    },
    [ratingLoading, skillId, skill]
  );

  // Track export count
  const trackExport = useCallback(async () => {
    if (!skillId) return;
    try {
      const res = await fetch("/api/skills/track-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      const data = await res.json();
      if (res.ok && skill && data.export_count !== undefined) {
        setSkill({ ...skill, export_count: data.export_count });
      }
    } catch {
      // Fire and forget
    }
  }, [skillId, skill]);

  /**
   * File System Access API export — no alert() dialogs
   */
  const handleFileSystemExport = async (target: "antigravity" | "claude") => {
    if (!skill || typeof window === "undefined") return;

    const statusKey = `${skill.id}-${target}`;

    if (!("showDirectoryPicker" in window)) {
      setExportStatuses((prev) => ({
        ...prev,
        [statusKey]: {
          type: "error",
          message: "Your browser doesn't support direct file export. Use Chrome, Edge, or Opera.",
        },
      }));
      setTimeout(() => {
        setExportStatuses((prev) => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
      }, 5000);
      return;
    }

    setExportingTarget(statusKey);
    setExportStatuses((prev) => ({
      ...prev,
      [statusKey]: { type: "success", message: "Select your project folder…" },
    }));

    try {
      const targetFolderDesc = target === "antigravity" ? ".agents/skills" : ".claude/skills";

      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      setExportStatuses((prev) => ({
        ...prev,
        [statusKey]: { type: "success", message: "Writing files…" },
      }));

      // Smart path resolution
      const pathSegments = target === "antigravity"
        ? [".agents", "skills"]
        : [".claude", "skills"];

      const pickedDirName = directoryHandle.name;
      let startIndex = 0;
      for (let i = 0; i < pathSegments.length; i++) {
        if (pickedDirName === pathSegments[i]) {
          startIndex = i + 1;
          break;
        }
      }

      let currentHandle = directoryHandle;
      for (let i = startIndex; i < pathSegments.length; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathSegments[i], {
          create: true,
        });
      }

      const folderName = skill.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const subDirHandle = await currentHandle.getDirectoryHandle(folderName, {
        create: true,
      });

      const fileHandle = await subDirHandle.getFileHandle("SKILL.md", { create: true });
      const writable = await fileHandle.createWritable();
      const compiledContent = compileSkill(skill, target);
      await writable.write(compiledContent);
      await writable.close();

      // Track the export
      trackExport();

      setExportStatuses((prev) => ({
        ...prev,
        [statusKey]: {
          type: "success",
          message: `Exported to ${targetFolderDesc}/${folderName}/SKILL.md`,
        },
      }));

      setTimeout(() => {
        setExportStatuses((prev) => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
        setExportingTarget(null);
      }, 4000);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setExportStatuses((prev) => {
          const next = { ...prev };
          delete next[statusKey];
          return next;
        });
        setExportingTarget(null);
        return;
      }
      setExportStatuses((prev) => ({
        ...prev,
        [statusKey]: { type: "error", message: err.message || "Export failed" },
      }));
      setTimeout(() => {
        setExportingTarget(null);
      }, 4000);
    }
  };

  const antiStatus = exportStatuses[`${skillId}-antigravity`];
  const claudeStatus = exportStatuses[`${skillId}-claude`];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-faint animate-fade-in">
          <Link
            href="/marketplace"
            className="hover:text-content transition-colors"
          >
            Skills
          </Link>
          {skill && (
            <>
              <ChevronRight className="h-3 w-3" />
              {skill.tags && skill.tags.length > 0 && (
                <>
                  <Link
                    href={`/skills?tag=${encodeURIComponent(skill.tags[0])}`}
                    className="hover:text-content transition-colors"
                  >
                    {skill.tags[0]}
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-muted font-medium font-mono truncate max-w-[200px]">
                {skill.name}
              </span>
            </>
          )}
        </nav>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-brand-muted" />
            <p className="mt-4 text-sm text-muted">Loading skill details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-line bg-surface-2/40 animate-fade-in-up">
            <p className="text-sm text-danger-muted font-medium">{error}</p>
            <button
              onClick={() => router.push("/marketplace")}
              className="mt-4 text-xs text-brand-muted hover:text-brand underline"
            >
              Return to marketplace
            </button>
          </div>
        )}

        {/* Skill Detail Content */}
        {skill && !loading && (
          <div className="space-y-5 animate-fade-in-up">
            {/* ── Header Card (elevated) ─────────────────────────── */}
            <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-8 border-t-2 border-t-brand/50">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {skill.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-2xs font-mono text-brand-muted border border-line shrink-0">
                      <Terminal className="h-3 w-3" /> skill
                    </span>
                  </div>
                  <p className="mt-4 text-base text-muted leading-relaxed max-w-2xl">
                    {skill.description}
                  </p>
                </div>

                {/* Star (favorite) button */}
                <FavoriteButton
                  skillId={skill.id}
                  count={skill.star_count}
                  size="md"
                  showCount
                  onToggle={(starred, newCount) => {
                    setSkill({ ...skill, star_count: newCount });
                  }}
                />
              </div>

              {/* ── Stats Row ──────────────────────────────────────── */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {/* Interactive Rating */}
                <div className="flex items-center gap-2">
                  <RatingStars
                    rating={userRating ?? skill.avg_rating}
                    size="md"
                    showValue
                    count={skill.rating_count}
                    onRate={handleRate}
                  />
                  {userRating && (
                    <span className="text-2xs text-brand-muted font-medium">
                      Your rating
                    </span>
                  )}
                </div>

                <span className="h-4 w-px bg-line" />

                {/* Export count */}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Download className="h-3.5 w-3.5 text-subtle" />
                  <span className="font-medium tabular-nums">{formatCompact(skill.export_count)}</span>
                  <span>exports</span>
                </span>

                <span className="h-4 w-px bg-line" />

                {/* Star count */}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                  <span className="font-medium tabular-nums">{formatCompact(skill.star_count)}</span>
                  <span>stars</span>
                </span>
              </div>

              {/* Meta Row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint">
                {skill.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Added {new Date(skill.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(skill.id, "id")}
                  className="flex items-center gap-1.5 hover:text-content transition-colors cursor-pointer"
                >
                  {copiedField === "id" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="font-mono">{skill.id.slice(0, 8)}…</span>
                </button>
              </div>

              {/* Tags — clickable */}
              {skill.tags && skill.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {skill.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      href={`/skills?tag=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-dim border border-brand-line px-2.5 py-1 text-xs font-semibold text-brand-muted hover:bg-brand/10 hover:border-brand/40 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Export Actions ──────────────────────────────────── */}
              <div className="mt-6 pt-5 border-t border-line">
                <h2 className="text-2xs font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
                  <Download className="h-3 w-3" />
                  Export to Workspace
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Antigravity */}
                  <div className="flex flex-col gap-1.5">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full gap-2"
                      disabled={exportingTarget === `${skillId}-antigravity`}
                      onClick={() => handleFileSystemExport("antigravity")}
                    >
                      {exportingTarget === `${skillId}-antigravity` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export for Antigravity
                    </Button>
                    {antiStatus && (
                      <span
                        className={cn(
                          "text-center font-mono text-2xs font-medium px-1",
                          antiStatus.type === "success" ? "text-emerald-400" : "text-danger"
                        )}
                      >
                        {antiStatus.message}
                      </span>
                    )}
                  </div>

                  {/* Claude */}
                  <div className="flex flex-col gap-1.5">
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full gap-2 text-content hover:bg-surface-3 border border-line-strong"
                      disabled={exportingTarget === `${skillId}-claude`}
                      onClick={() => handleFileSystemExport("claude")}
                    >
                      {exportingTarget === `${skillId}-claude` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export for Claude Code
                    </Button>
                    {claudeStatus && (
                      <span
                        className={cn(
                          "text-center font-mono text-2xs font-medium px-1",
                          claudeStatus.type === "success" ? "text-emerald-400" : "text-danger"
                        )}
                      >
                        {claudeStatus.message}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-2xs text-faint leading-relaxed mt-2">
                  Select your project root. We'll create the skill folder automatically.
                </p>
              </div>
            </div>

            {/* ── Source & Links ─────────────────────────────────────── */}
            {(skill.source_url || (skill.script_urls && skill.script_urls.length > 0)) && (
              <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-4 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Source & Resources
                </h2>

                {skill.source_url && (
                  <a
                    href={skill.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-all hover:border-brand-line hover:bg-surface-3 group"
                  >
                    <FolderGit className="h-4 w-4 text-brand-muted shrink-0" />
                    <span className="truncate font-mono text-sm text-muted group-hover:text-content transition-colors">
                      {skill.source_url}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-faint group-hover:text-brand-muted shrink-0 ml-auto" />
                  </a>
                )}

                {skill.script_urls && skill.script_urls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h3 className="text-2xs font-semibold text-faint uppercase tracking-wider">
                      Executable Scripts
                    </h3>
                    {skill.script_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 hover:border-line-strong transition-colors group"
                      >
                        <Globe className="h-3.5 w-3.5 text-brand-muted shrink-0" />
                        <span className="truncate font-mono text-xs text-muted group-hover:text-content">
                          {url}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Trigger Phrases ────────────────────────────────────── */}
            {skill.trigger_phrases && skill.trigger_phrases.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-4 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Trigger Phrases
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skill.trigger_phrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-surface-2 border border-line px-3 py-1.5 text-sm font-medium text-subtle"
                    >
                      &ldquo;{phrase}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Markdown Instructions (rendered) ────────────────── */}
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-4 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Full Instructions
              </h2>
              {skill.markdown_instructions ? (
                <div className="rounded-xl bg-surface-2 border border-line-strong p-5 overflow-x-auto max-h-[700px] overflow-y-auto scrollbar-thin">
                  <MarkdownPanel content={skill.markdown_instructions} />
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-line p-4">
                  <Info className="h-4 w-4 text-faint shrink-0" />
                  <p className="text-sm text-muted">
                    No markdown instructions available for this skill.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
