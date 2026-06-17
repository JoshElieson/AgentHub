"use client";

import type { Collection, UserCollection, UserCollectionItem } from "@/lib/types";
import type { McpServerRow } from "@/lib/supabase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AgentCard } from "@/components/agent-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCollection,
  getCollectionAgents,
  getCollectionItemCount,
  getCollectionMcpServers,
  getCreator,
  getOrganization,
} from "@/lib/data";
import {
  useCollection,
  deleteCollection,
  removeCollectionItem,
  addCollectionItem,
} from "@/lib/collections-data";
import { formatCompact, pluralize } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plug,
  Plus,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Try legacy mock collection first
  const legacyCollection = getCollection(slug);

  if (legacyCollection) {
    return <LegacyCollectionView collection={legacyCollection} />;
  }

  // Otherwise treat slug as a UUID for a user collection
  return <UserCollectionView id={slug} />;
}

// =============================================================================
// User-created collection view
// =============================================================================

function UserCollectionView({ id }: { id: string }) {
  const { collection, loading, refresh } = useCollection(id);
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!collection) return;
      const { getAnonId } = await import("@/lib/anon-id");
      setIsOwner(collection.anon_id === getAnonId());
    })();
  }, [collection]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-sm text-muted">Collection not found.</p>
          <Link
            href="/collections"
            className="mt-3 text-sm font-medium text-brand-muted hover:text-brand"
          >
            ← All collections
          </Link>
        </div>
      </AppShell>
    );
  }

  const isMcp = collection.kind === "mcps";
  const items = collection.items ?? [];

  const handleDelete = async () => {
    if (!confirm("Delete this collection? This cannot be undone.")) return;
    setDeleting(true);
    const ok = await deleteCollection(collection.id);
    if (ok) {
      router.push("/collections");
    }
    setDeleting(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeCollectionItem(collection.id, itemId);
    refresh();
  };

  return (
    <AppShell fullWidth>
      {/* Banner */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: collection.cover_color }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" />
          <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />
        </div>

        <div className="relative mx-auto w-full max-w-site px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All collections
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas/80 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-content">
              <Layers className="h-3.5 w-3.5" />
              Collection
            </span>
            {isMcp ? (
              <Badge variant="info">
                <Plug className="h-3 w-3" />
                MCP Servers
              </Badge>
            ) : (
              <Badge variant="brand">
                <Package className="h-3 w-3" />
                Skills
              </Badge>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-3 max-w-2xl text-balance text-base text-muted">
              {collection.description}
            </p>
          )}

          {/* Item count + last updated */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              {isMcp ? (
                <Plug className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              {items.length}{" "}
              {isMcp
                ? pluralize(items.length, "server")
                : pluralize(items.length, "skill")}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {isMcp ? (
              <CopyAllMcpConfigs items={items} />
            ) : (
              <InstallAllSkills items={items} />
            )}
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowAddPicker(!showAddPicker)}
                >
                  <Plus className="h-4 w-4" />
                  Add items
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto w-full max-w-site px-4 py-10 sm:px-6">
        {/* Add items picker (inline, collapsible) */}
        {showAddPicker && isOwner && (
          <AddItemsSection
            collection={collection}
            onDone={() => {
              setShowAddPicker(false);
              refresh();
            }}
          />
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={
              isMcp ? (
                <Plug className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )
            }
            title="No items yet"
            description={
              isOwner
                ? "Add skills or MCP servers to this collection."
                : "This collection is empty."
            }
            action={
              isOwner ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowAddPicker(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add items
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
                {isMcp ? "Included MCP servers" : "Included skills"}
              </h2>
              <span className="text-sm text-subtle tabular-nums">
                {items.length}{" "}
                {isMcp
                  ? pluralize(items.length, "server")
                  : pluralize(items.length, "skill")}
              </span>
            </div>
            <ol className="mt-6 space-y-3">
              {items.map((item, i) => (
                <li key={item.item_id} className="flex items-start gap-3 sm:gap-4">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-sm font-semibold tabular-nums text-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <CollectionItemCard
                      item={item}
                      isMcp={isMcp}
                      isOwner={isOwner}
                      onRemove={() => handleRemoveItem(item.item_id)}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Collection item card
// ---------------------------------------------------------------------------

function CollectionItemCard({
  item,
  isMcp,
  isOwner,
  onRemove,
}: {
  item: UserCollectionItem;
  isMcp: boolean;
  isOwner: boolean;
  onRemove: () => void;
}) {
  const detailHref = isMcp
    ? `/marketplace/mcp/${item.item_id}`
    : `/marketplace/${item.item_id}`;

  return (
    <div className="group relative flex flex-col rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-start justify-between gap-3">
        <Link href={detailHref} className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-3 border border-line">
            {isMcp ? (
              <Terminal className="h-5 w-5 text-info" />
            ) : (
              <Package className="h-5 w-5 text-brand-muted" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-content group-hover:text-white">
              {item.name ?? "Unnamed item"}
            </h3>
            {item.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {item.description}
              </p>
            )}
          </div>
        </Link>

        {isOwner && (
          <button
            onClick={onRemove}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-line text-faint opacity-0 transition-all hover:border-danger/40 hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
            title="Remove from collection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* MCP command preview */}
      {isMcp && item.command && (
        <div className="mt-3 rounded-md border border-line bg-canvas p-2.5">
          <code className="block break-all font-mono text-xs text-brand-muted">
            {item.command} {(item.args ?? []).join(" ")}
          </code>
        </div>
      )}

      {/* Stats footer */}
      <div className="mt-3 flex items-center gap-3 border-t border-line/60 pt-3 text-xs text-subtle">
        {item.avg_rating !== undefined && (
          <RatingStars
            rating={item.avg_rating}
            count={item.rating_count}
            size="sm"
          />
        )}
        {item.export_count !== undefined && (
          <span className="flex items-center gap-1 tabular-nums">
            <Download className="h-3.5 w-3.5" />
            {formatCompact(item.export_count)}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Install All Skills button — real File System Access API export
// ---------------------------------------------------------------------------

type ExportTarget = "antigravity" | "claude";

function InstallAllSkills({ items }: { items: UserCollectionItem[] }) {
  const [showPicker, setShowPicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    currentName?: string;
  } | null>(null);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    count?: number;
  } | null>(null);

  const skillItems = items.filter((i) => i.item_kind === "skill");

  // Close picker when clicking outside
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-export-picker]")) {
        setShowPicker(false);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [showPicker]);

  const handleExport = async (target: ExportTarget) => {
    if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
      setResult({
        type: "error",
        message:
          "Your browser doesn't support direct file export. Use Chrome, Edge, or Opera.",
      });
      setTimeout(() => setResult(null), 5000);
      return;
    }

    setShowPicker(false);
    setExporting(true);
    setProgress({ done: 0, total: skillItems.length });

    try {
      // 1) Open directory picker
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      // 2) Resolve skills subfolder
      const pathSegments =
        target === "antigravity"
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

      let skillsDir = directoryHandle;
      for (let i = startIndex; i < pathSegments.length; i++) {
        skillsDir = await skillsDir.getDirectoryHandle(pathSegments[i], {
          create: true,
        });
      }

      // 3) Fetch full data, compile, and write each skill
      const { compileSkill } = await import("@/lib/skills-compiler");
      const { supabase } = await import("@/lib/supabase");
      const { getAnonId } = await import("@/lib/anon-id");
      const anonId = getAnonId();

      let written = 0;
      let failed = 0;

      for (const item of skillItems) {
        try {
          // Fetch full skill row from Supabase
          let skill = null;
          if (supabase) {
            const { data } = await supabase
              .from("skills")
              .select("*")
              .eq("id", item.item_id)
              .single();
            if (data) {
              skill = {
                id: data.id,
                name: data.name,
                description: data.description,
                trigger_phrases: Array.isArray(data.trigger_phrases)
                  ? data.trigger_phrases
                  : [],
                markdown_instructions: data.markdown_instructions || "",
                script_urls: Array.isArray(data.script_urls)
                  ? data.script_urls
                  : [],
                tags: Array.isArray(data.tags) ? data.tags : [],
                source_url: data.source_url || null,
                created_at: data.created_at,
                star_count: data.star_count ?? 0,
                export_count: data.export_count ?? 0,
                avg_rating: data.avg_rating ? Number(data.avg_rating) : 0,
                rating_count: data.rating_count ?? 0,
              };
            }
          }

          if (!skill) {
            failed++;
            continue;
          }

          setProgress({
            done: written + failed,
            total: skillItems.length,
            currentName: skill.name,
          });

          // Create skill folder and SKILL.md
          const folderName = skill.name
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-");
          const subDir = await skillsDir.getDirectoryHandle(folderName, {
            create: true,
          });
          const fileHandle = await subDir.getFileHandle("SKILL.md", {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          const compiledContent = compileSkill(skill, target);
          await writable.write(compiledContent);
          await writable.close();

          // Track export + install (fire & forget)
          fetch("/api/skills/track-export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ skillId: skill.id }),
          }).catch(() => {});

          fetch("/api/skills/install", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skillId: skill.id,
              anonId,
              target,
            }),
          }).catch(() => {});

          written++;
        } catch {
          failed++;
        }

        setProgress({
          done: written + failed,
          total: skillItems.length,
        });
      }

      const targetLabel =
        target === "antigravity" ? ".agents/skills" : ".claude/skills";

      setResult({
        type: "success",
        count: written,
        message:
          failed === 0
            ? `Exported ${written} skills to ${targetLabel}/`
            : `Exported ${written} skills, ${failed} failed`,
      });
      setTimeout(() => setResult(null), 6000);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled picker
      } else {
        setResult({ type: "error", message: err.message || "Export failed" });
        setTimeout(() => setResult(null), 5000);
      }
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  return (
    <div className="relative" data-export-picker>
      {/* Main button */}
      <Button
        variant="primary"
        size="md"
        onClick={() => setShowPicker(!showPicker)}
        disabled={exporting || skillItems.length === 0}
      >
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting…
          </>
        ) : result?.type === "success" ? (
          <>
            <Check className="h-4 w-4" />
            {result.message}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Install all {skillItems.length} skills
          </>
        )}
      </Button>

      {/* ── Export target dropdown ───────────────────────────────────── */}
      {showPicker && !exporting && (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-line-strong bg-surface-3 shadow-overlay animate-fade-in-up"
          style={{
            boxShadow:
              "0 18px 48px -16px rgba(0,0,0,0.8), 0 4px 12px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-line-strong px-4 py-3 bg-surface-2">
            <Download className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Choose export target
            </span>
          </div>

          {/* Antigravity option */}
          <button
            className="group flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2 border-b border-line"
            onClick={() => handleExport("antigravity")}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-line bg-brand-dim text-brand transition-all group-hover:border-brand/40 group-hover:bg-brand/10">
              <Download className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-content">
                Export for Antigravity
              </div>
              <div className="mt-0.5 truncate font-mono text-2xs text-muted">
                → .agents/skills/
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Claude Code option */}
          <button
            className="group flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors hover:bg-surface-2"
            onClick={() => handleExport("claude")}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface-2 text-content transition-all group-hover:border-line-strong group-hover:bg-surface">
              <Terminal className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-content">
                Export for Claude Code
              </div>
              <div className="mt-0.5 truncate font-mono text-2xs text-muted">
                → .claude/skills/
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
          </button>

          {/* Footer hint */}
          <div className="border-t border-line-strong bg-surface-2 px-4 py-2.5">
            <p className="text-2xs leading-relaxed text-subtle">
              Select your project root — skill subfolders will be created
              automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Progress overlay ────────────────────────────────────────── */}
      {exporting && progress && (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-line-strong bg-surface-3 shadow-overlay animate-fade-in-up"
          style={{
            boxShadow:
              "0 18px 48px -16px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-4 pt-4 pb-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-content">
                Exporting skills…
              </span>
              <span className="tabular-nums font-medium text-brand">
                {progress.done}/{progress.total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover transition-all duration-300 ease-out-expo"
                style={{
                  width: `${Math.round(
                    (progress.done / Math.max(progress.total, 1)) * 100
                  )}%`,
                }}
              />
            </div>

            {/* Current skill name */}
            {progress.currentName && (
              <p className="mt-3 flex items-center gap-1.5 truncate font-mono text-2xs text-muted">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-brand" />
                {progress.currentName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Success toast ───────────────────────────────────────────── */}
      {result?.type === "success" && !exporting && (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-success/30 bg-surface-3 shadow-overlay animate-fade-in-up"
          style={{
            boxShadow:
              "0 18px 48px -16px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(34,197,94,0.08)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/15 text-success ring-1 ring-success/20">
              <Check className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content">
                {result.count ?? 0} skills exported
              </p>
              <p className="mt-0.5 truncate text-2xs text-success">
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error toast ─────────────────────────────────────────────── */}
      {result?.type === "error" && !exporting && (
        <div
          className="absolute left-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-danger/30 bg-surface-3 shadow-overlay animate-fade-in-up"
          style={{
            boxShadow:
              "0 18px 48px -16px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(239,68,68,0.08)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/15 text-danger ring-1 ring-danger/20">
              <X className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content">Export failed</p>
              <p className="mt-0.5 truncate text-2xs text-danger">
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy All MCP Configs button
// ---------------------------------------------------------------------------

function CopyAllMcpConfigs({ items }: { items: UserCollectionItem[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const mergedConfig: Record<string, unknown> = {};
    for (const item of items) {
      if (item.item_kind !== "mcp") continue;
      if (!item.name || !item.command) continue;
      const envKeys = Object.keys(item.env_vars ?? {});
      mergedConfig[item.name] = {
        command: item.command,
        args: item.args ?? [],
        ...(envKeys.length > 0 ? { env: item.env_vars } : {}),
      };
    }
    navigator.clipboard.writeText(JSON.stringify(mergedConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [items]);

  return (
    <Button variant="primary" size="md" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied all configs
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy all {items.length} server configs
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Add Items section (inline picker for owners)
// ---------------------------------------------------------------------------

function AddItemsSection({
  collection,
  onDone,
}: {
  collection: UserCollection;
  onDone: () => void;
}) {
  // Dynamic import to avoid circular deps
  const [Picker, setPicker] = useState<React.ComponentType<any> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(collection.items.map((i) => i.item_id))
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    import("@/components/collection-item-picker").then((mod) => {
      setPicker(() => mod.CollectionItemPicker);
    });
  }, []);

  const handleToggle = (item: any) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    // Find items to add (in selectedIds but not in collection.items)
    const existingIds = new Set(collection.items.map((i) => i.item_id));
    const toAdd = [...selectedIds].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !selectedIds.has(id));

    for (const id of toAdd) {
      await addCollectionItem(
        collection.id,
        id,
        collection.kind === "skills" ? "skill" : "mcp"
      );
    }
    for (const id of toRemove) {
      await removeCollectionItem(collection.id, id);
    }

    setSaving(false);
    onDone();
  };

  return (
    <div className="mb-8 rounded-xl border border-brand-line bg-brand-dim/10 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content">
          Add {collection.kind === "skills" ? "skills" : "MCP servers"}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
      {Picker && (
        <Picker
          filterKind={collection.kind}
          selected={selectedIds}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}

// =============================================================================
// Legacy collection view (existing mock data)
// =============================================================================

function LegacyCollectionView({
  collection,
}: {
  collection: Collection;
}) {
  const org = collection.orgSlug
    ? getOrganization(collection.orgSlug)
    : undefined;
  const curator = getCreator(collection.curatorUsername);
  const itemCount = getCollectionItemCount(collection);
  const isMcp = collection.kind === "mcps";

  const attributionName =
    org?.name ?? curator?.name ?? collection.curatorUsername;
  const attributionColor = org?.avatarColor ?? curator?.avatarColor;
  const attributionHref = org
    ? `/org/${org.slug}`
    : `/u/${collection.curatorUsername}`;
  const isVerified = org?.isVerified ?? curator?.isVerified ?? false;

  return (
    <AppShell fullWidth>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0"
          style={{ background: collection.coverColor }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-30" />

        <div className="relative mx-auto w-full max-w-site px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
          <Link
            href="/collections"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-content"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All collections
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas/80 px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-content">
              <Layers className="h-3.5 w-3.5" />
              Collection
            </span>
            {isMcp ? (
              <Badge variant="info">
                <Plug className="h-3 w-3" />
                MCP Servers
              </Badge>
            ) : (
              <Badge variant="brand">
                <Package className="h-3 w-3" />
                Skills
              </Badge>
            )}
            {collection.isOfficial && (
              <Badge variant="brand">Official</Badge>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
            {collection.name}
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-base text-muted">
            {collection.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <Link
              href={attributionHref}
              className="group inline-flex items-center gap-2"
            >
              <Avatar
                name={attributionName}
                color={attributionColor}
                size="sm"
              />
              <span className="flex items-center gap-1">
                <span className="text-xs text-subtle">by</span>
                <span className="font-medium text-content group-hover:text-white">
                  {attributionName}
                </span>
                {isVerified && <VerifiedBadge />}
              </span>
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-subtle tabular-nums">
              {isMcp ? (
                <Plug className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              {itemCount}{" "}
              {isMcp
                ? pluralize(itemCount, "server")
                : pluralize(itemCount, "skill")}
            </span>
          </div>

          <div className="mt-6">
            {isMcp ? (
              <LegacyCopyAllConfigsButton collection={collection} />
            ) : (
              <Button variant="primary" size="md">
                <Download className="h-4 w-4" />
                Install all {itemCount} skills
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-site px-4 py-10 sm:px-6">
        {isMcp ? (
          <LegacyMcpCollectionContent collection={collection} />
        ) : (
          <LegacySkillCollectionContent collection={collection} />
        )}
      </div>
    </AppShell>
  );
}

// Legacy sub-components (unchanged from original)

function LegacySkillCollectionContent({ collection }: { collection: Collection }) {
  const agents = getCollectionAgents(collection);
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
          Included skills
        </h2>
        <span className="text-sm text-subtle tabular-nums">
          {agents.length} {pluralize(agents.length, "skill")}
        </span>
      </div>
      <ol className="mt-6 space-y-3">
        {agents.map((agent, i) => (
          <li key={agent.slug} className="flex items-start gap-3 sm:gap-4">
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-sm font-semibold tabular-nums text-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <AgentCard agent={agent} />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function LegacyMcpCollectionContent({ collection }: { collection: Collection }) {
  const servers = getCollectionMcpServers(collection);
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
          Included MCP servers
        </h2>
        <span className="text-sm text-subtle tabular-nums">
          {servers.length} {pluralize(servers.length, "server")}
        </span>
      </div>
      <ol className="mt-6 space-y-3">
        {servers.map((server, i) => (
          <li key={server.id} className="flex items-start gap-3 sm:gap-4">
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-sm font-semibold tabular-nums text-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <LegacyMcpServerCard server={server} />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function LegacyMcpServerCard({ server }: { server: McpServerRow }) {
  const [copied, setCopied] = useState(false);
  const envKeys = Object.keys(server.env_vars);

  const handleCopy = useCallback(() => {
    const config = {
      [server.name]: {
        command: server.command,
        args: server.args,
        ...(envKeys.length > 0 ? { env: server.env_vars } : {}),
      },
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [server, envKeys.length]);

  return (
    <div className="group relative flex flex-col rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-3 border border-line">
            <Terminal className="h-5 w-5 text-brand-muted" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-content">
                {server.name}
              </h3>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
              <RatingStars
                rating={server.avg_rating}
                count={server.rating_count}
                size="sm"
              />
            </div>
          </div>
        </div>
        <Badge variant="success">
          <Plug className="h-3 w-3" />
          MCP
        </Badge>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {server.description}
      </p>

      {server.tags && server.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {server.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-md border border-line bg-canvas p-2.5">
        <code className="block break-all font-mono text-xs text-brand-muted">
          {server.command} {server.args.join(" ")}
        </code>
      </div>

      {envKeys.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {envKeys.map((key) => (
            <span
              key={key}
              className="rounded-sm border border-warning/20 bg-warning-dim px-1.5 py-0.5 text-2xs font-mono font-medium text-warning"
            >
              {key}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <div className="flex-1 flex gap-3 text-xs text-subtle">
          <span className="flex items-center gap-1 tabular-nums" title="Exports">
            <Download className="h-3.5 w-3.5" />
            {formatCompact(server.export_count)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {server.github_url && (
            <a
              href={server.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-surface-2 px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-content"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Source
            </a>
          )}
          <Button
            variant={copied ? "primary" : "secondary"}
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Config
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LegacyCopyAllConfigsButton({ collection }: { collection: Collection }) {
  const [copied, setCopied] = useState(false);
  const servers = getCollectionMcpServers(collection);

  const handleCopyAll = useCallback(() => {
    const mergedConfig: Record<string, unknown> = {};
    for (const server of servers) {
      const envKeys = Object.keys(server.env_vars);
      mergedConfig[server.name] = {
        command: server.command,
        args: server.args,
        ...(envKeys.length > 0 ? { env: server.env_vars } : {}),
      };
    }
    navigator.clipboard.writeText(JSON.stringify(mergedConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [servers]);

  return (
    <Button variant="primary" size="md" onClick={handleCopyAll}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied all {servers.length} configs
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy all {servers.length} server configs
        </>
      )}
    </Button>
  );
}
