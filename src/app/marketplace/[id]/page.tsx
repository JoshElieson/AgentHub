"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkdownPanel } from "@/components/markdown-panel";
import { RatingStars } from "@/components/ui/rating-stars";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { InstalledBadge } from "@/components/installed-badge";
import { supabase, type SkillRow } from "@/lib/supabase";
import { compileSkill } from "@/lib/skills-compiler";
import { getAnonId } from "@/lib/anon-id";
import { useInstalled } from "@/lib/installed-context";
import { EXPORT_PLATFORMS, getPlatform } from "@/lib/export-platforms";
import { Button } from "@/components/ui/button";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
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
  ChevronDown,
  BookOpen,
  Zap,
  Link2,
  Info,
  ThumbsUp,
  BarChart3,
  Code,
  Sparkles,
  Cpu,
  FolderOpen,
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

  // Install state — whether this anon user has installed the skill before.
  const { markInstalled } = useInstalled();
  const [installInfo, setInstallInfo] = useState<{
    installed: boolean;
    installedAt: string | null;
    target: string | null;
  }>({ installed: false, installedAt: null, target: null });

  // Export states
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false);
  const [exportingTarget, setExportingTarget] = useState<string | null>(null);
  const [showExportPicker, setShowExportPicker] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsFileSystemAccessSupported("showDirectoryPicker" in window);
    }
  }, []);

  // Dynamic page title
  useEffect(() => {
    if (skill) {
      document.title = `${skill.name} — Nuclexa Skills`;
    } else if (loading) {
      document.title = "Loading… — Nuclexa Skills";
    }
    return () => {
      document.title = "Nuclexa — The package registry for AI agents";
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

  // Fetch this user's prior-install state for the skill.
  useEffect(() => {
    if (!skillId) return;
    const anonId = getAnonId();
    fetch(`/api/skills/install?skillId=${skillId}&anonId=${anonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.installed) {
          setInstallInfo({
            installed: true,
            installedAt: data.installed_at ?? null,
            target: data.target ?? null,
          });
        }
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

  // Record a durable per-user install (separate from the global export count)
  // so we can show "you've installed this before" everywhere.
  const recordInstall = useCallback(
    async (target: string) => {
      if (!skillId) return;
      const installedAt = new Date().toISOString();
      // Optimistic — update local + shared state immediately.
      setInstallInfo({ installed: true, installedAt, target });
      markInstalled("skill", skillId);
      try {
        const anonId = getAnonId();
        await fetch("/api/skills/install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId, anonId, target }),
        });
      } catch {
        // Fire and forget — optimistic state stands.
      }
    },
    [skillId, markInstalled]
  );

  // Close export picker when clicking outside
  useEffect(() => {
    if (!showExportPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-export-picker]")) {
        setShowExportPicker(false);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [showExportPicker]);

  /** Platform icon helper */
  const getPlatformIcon = (iconHint: string, className: string) => {
    switch (iconHint) {
      case "terminal": return <Terminal className={className} />;
      case "code": return <Code className={className} />;
      case "sparkles": return <Sparkles className={className} />;
      case "cpu": return <Cpu className={className} />;
      default: return <Download className={className} />;
    }
  };

  /**
   * File System Access API export — registry-driven, no alert() dialogs.
   * Pass platformId = "custom" to write directly into the user-picked folder.
   */
  const handleFileSystemExport = async (platformId: string) => {
    if (!skill || typeof window === "undefined") return;

    const isCustom = platformId === "custom";
    const platform = isCustom ? null : getPlatform(platformId);
    setShowExportPicker(false);

    if (!("showDirectoryPicker" in window)) {
      setExportStatus({
        type: "error",
        message: "Your browser doesn't support direct file export. Use Chrome, Edge, or Opera.",
      });
      setTimeout(() => setExportStatus(null), 5000);
      return;
    }

    setExportingTarget(platformId);
    setExportStatus({ type: "success", message: "Select your target folder\u2026" });

    try {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      setExportStatus({ type: "success", message: "Writing files\u2026" });

      let targetHandle = directoryHandle;

      if (!isCustom && platform) {
        // Smart path resolution using platform's pathSegments
        const { pathSegments } = platform;
        const pickedDirName = directoryHandle.name;
        let startIndex = 0;
        for (let i = 0; i < pathSegments.length; i++) {
          if (pickedDirName === pathSegments[i]) {
            startIndex = i + 1;
            break;
          }
        }

        for (let i = startIndex; i < pathSegments.length; i++) {
          targetHandle = await targetHandle.getDirectoryHandle(pathSegments[i], {
            create: true,
          });
        }
      }
      // For custom: targetHandle stays as the user-picked directory

      const folderName = skill.name.toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const subDirHandle = await targetHandle.getDirectoryHandle(folderName, {
        create: true,
      });

      const fileHandle = await subDirHandle.getFileHandle("SKILL.md", { create: true });
      const writable = await fileHandle.createWritable();
      const compiledContent = compileSkill(skill, isCustom ? "custom" : platform!.id);
      await writable.write(compiledContent);
      await writable.close();

      // Track the export (global counter) + record the per-user install.
      trackExport();
      recordInstall(isCustom ? "custom" : platform!.id);

      const pathDesc = isCustom
        ? `${directoryHandle.name}/${folderName}`
        : `${platform!.pathSegments.join("/")}/${folderName}`;
      setExportStatus({
        type: "success",
        message: `Exported to ${pathDesc}/SKILL.md`,
      });

      setTimeout(() => {
        setExportStatus(null);
        setExportingTarget(null);
      }, 4000);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setExportStatus(null);
        setExportingTarget(null);
        return;
      }
      setExportStatus({ type: "error", message: err.message || "Export failed" });
      setTimeout(() => {
        setExportStatus(null);
        setExportingTarget(null);
      }, 4000);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-faint animate-fade-in">
          <Link
            href="/explore?type=skill"
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
                    href={`/explore?q=${encodeURIComponent(skill.tags[0])}`}
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
              onClick={() => router.push("/explore")}
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
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {skill.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-2xs font-mono text-brand-muted border border-line shrink-0">
                      <Terminal className="h-3 w-3" /> skill
                    </span>
                    {installInfo.installed && <InstalledBadge size="md" />}
                  </div>
                  <p className="mt-4 text-base text-muted leading-relaxed max-w-2xl">
                    {skill.description}
                  </p>
                </div>

                {/* Like (thumbs up) + Save (bookmark) actions */}
                <div className="flex items-center gap-2">
                  <LikeButton
                    skillId={skill.id}
                    count={skill.star_count}
                    size="md"
                    showCount
                    onToggle={(liked, newCount) => {
                      setSkill({ ...skill, star_count: newCount });
                    }}
                  />
                  <SaveButton skillId={skill.id} size="md" />
                </div>
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

                {/* Like count */}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <ThumbsUp className="h-3.5 w-3.5 text-brand-muted" />
                  <span className="font-medium tabular-nums">{formatCompact(skill.star_count)}</span>
                  <span>likes</span>
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xs font-bold uppercase tracking-wider text-faint flex items-center gap-1.5">
                    <Download className="h-3 w-3" />
                    Export to Workspace
                  </h2>
                  {installInfo.installed && (
                    <span className="flex items-center gap-1.5 text-2xs font-medium text-success">
                      <Check className="h-3.5 w-3.5" />
                      {installInfo.installedAt
                        ? `Installed ${timeAgo(installInfo.installedAt)}`
                        : "Installed before"}
                    </span>
                  )}
                </div>

                {/* Single export button + platform dropdown */}
                <div className="relative" data-export-picker>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full gap-2"
                    disabled={!!exportingTarget}
                    onClick={() => setShowExportPicker(!showExportPicker)}
                  >
                    {exportingTarget ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {installInfo.installed
                      ? "Re-export to Workspace"
                      : "Export to Workspace"}
                    {!exportingTarget && <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-60" />}
                  </Button>

                  {/* Platform picker dropdown */}
                  {showExportPicker && !exportingTarget && (
                    <div
                      className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-line-strong bg-surface-3 shadow-overlay animate-fade-in-up"
                      style={{
                        boxShadow:
                          "0 18px 48px -16px rgba(0,0,0,0.8), 0 4px 12px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="flex items-center gap-2 border-b border-line-strong px-4 py-3 bg-surface-2">
                        <Download className="h-3.5 w-3.5 text-brand" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          Choose your editor
                        </span>
                      </div>

                      {EXPORT_PLATFORMS.map((platform, idx) => (
                        <button
                          key={platform.id}
                          className="group flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2 border-b border-line"
                          onClick={() => handleFileSystemExport(platform.id)}
                        >
                          <span
                            className={cn(
                              "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-all",
                              platform.variant === "brand"
                                ? "border-brand-line bg-brand-dim text-brand group-hover:border-brand/40 group-hover:bg-brand/10"
                                : "border-line-strong bg-surface-2 text-content group-hover:border-line-strong group-hover:bg-surface"
                            )}
                          >
                            {getPlatformIcon(platform.iconHint, "h-4.5 w-4.5")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-content">
                              {platform.label}
                              {installInfo.installed && installInfo.target === platform.id && (
                                <span className="ml-2 text-2xs font-medium text-success">previously installed</span>
                              )}
                            </div>
                            <div className="mt-0.5 truncate font-mono text-2xs text-muted">
                              {platform.pathHint}
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}

                      {/* Custom directory option */}
                      <button
                        className="group flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2"
                        onClick={() => handleFileSystemExport("custom")}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-dashed border-line-strong bg-surface text-subtle transition-all group-hover:border-muted group-hover:bg-surface-2 group-hover:text-content">
                          <FolderOpen className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-content">
                            Other
                          </div>
                          <div className="mt-0.5 truncate text-2xs text-muted">
                            Choose any directory
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>

                      <div className="border-t border-line-strong bg-surface-2 px-4 py-2.5">
                        <p className="text-2xs leading-relaxed text-subtle">
                          Select your project root — skill subfolders will be created automatically.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status message */}
                {exportStatus && (
                  <p
                    className={cn(
                      "text-center font-mono text-2xs font-medium px-1 mt-2",
                      exportStatus.type === "success" ? "text-emerald-400" : "text-danger"
                    )}
                  >
                    {exportStatus.message}
                  </p>
                )}
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
