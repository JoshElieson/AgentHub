"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RatingStars } from "@/components/ui/rating-stars";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { InstalledBadge } from "@/components/installed-badge";
import { supabase, type McpServerRow } from "@/lib/supabase";
import { getAnonId } from "@/lib/anon-id";
import { useInstalled } from "@/lib/installed-context";
import { Button } from "@/components/ui/button";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import {
  FolderGit,
  Terminal,
  Loader2,
  Tag,
  ExternalLink,
  Calendar,
  Copy,
  Check,
  Download,
  ChevronRight,
  Link2,
  ThumbsUp,
  Settings,
  Code2
} from "lucide-react";

export default function McpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [server, setServer] = useState<McpServerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Install state — whether this anon user has installed the server before.
  const { markInstalled } = useInstalled();
  const [installInfo, setInstallInfo] = useState<{
    installed: boolean;
    installedAt: string | null;
  }>({ installed: false, installedAt: null });

  // Dynamic page title
  useEffect(() => {
    if (server) {
      document.title = `${server.name} — Nuclexa MCP Servers`;
    } else if (loading) {
      document.title = "Loading… — Nuclexa MCP Servers";
    }
    return () => {
      document.title = "Nuclexa — The package registry for AI agents";
    };
  }, [server, loading]);

  // Fetch server data
  useEffect(() => {
    async function fetchServer() {
      if (!supabase || !serverId) {
        setError("Unable to load MCP server.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("mcp_servers")
          .select("*")
          .eq("id", serverId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Server not found");

        setServer({
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
          args: Array.isArray(data.args) ? data.args : [],
          env_vars: data.env_vars || {},
        } as McpServerRow);
      } catch (err: any) {
        console.error("Failed to fetch server:", err);
        setError(err.message || "Failed to load server");
      } finally {
        setLoading(false);
      }
    }

    fetchServer();
  }, [serverId]);

  // Fetch this user's prior-install state for the server.
  useEffect(() => {
    if (!serverId) return;
    const anonId = getAnonId();
    fetch(`/api/mcp/install?serverId=${serverId}&anonId=${anonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.installed) {
          setInstallInfo({
            installed: true,
            installedAt: data.installed_at ?? null,
          });
        }
      })
      .catch(() => {});
  }, [serverId]);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Silently fail
    }
  }, []);

  // Copying the config is the MCP "install" moment — record it per user.
  const recordInstall = useCallback(async () => {
    if (!serverId) return;
    setInstallInfo({ installed: true, installedAt: new Date().toISOString() });
    markInstalled("mcp", serverId);
    try {
      const anonId = getAnonId();
      await fetch("/api/mcp/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, anonId, target: "config" }),
      });
    } catch {
      // Fire and forget — optimistic state stands.
    }
  }, [serverId, markInstalled]);

  const handleCopyConfig = useCallback(() => {
    if (!server) return;
    const config = {
      [server.name]: {
        command: server.command,
        args: server.args,
        env: server.env_vars
      }
    };
    copyToClipboard(JSON.stringify(config, null, 2), "config");
    recordInstall();
  }, [server, copyToClipboard, recordInstall]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-faint animate-fade-in">
          <Link
            href="/explore"
            className="hover:text-content transition-colors"
          >
            Explore
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link
            href="/explore?type=mcp"
            className="hover:text-content transition-colors"
          >
            MCP Servers
          </Link>
          {server && (
            <>
              <ChevronRight className="h-3 w-3" />
              {server.tags && server.tags.length > 0 && (
                <>
                  <Link
                    href={`/explore?q=${encodeURIComponent(server.tags[0])}`}
                    className="hover:text-content transition-colors"
                  >
                    {server.tags[0]}
                  </Link>
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
              <span className="text-muted font-medium font-mono truncate max-w-[200px]">
                {server.name}
              </span>
            </>
          )}
        </nav>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-brand-muted" />
            <p className="mt-4 text-sm text-muted">Loading server details...</p>
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

        {/* Server Detail Content */}
        {server && !loading && (
          <div className="space-y-5 animate-fade-in-up">
            {/* ── Header Card (elevated) ─────────────────────────── */}
            <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-8 border-t-2 border-t-brand/50">
              {/* Title Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
                      {server.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-0.5 text-2xs font-mono text-brand-muted border border-line shrink-0">
                      <Terminal className="h-3 w-3" /> mcp server
                    </span>
                    {installInfo.installed && <InstalledBadge size="md" />}
                  </div>
                  <p className="mt-4 text-base text-muted leading-relaxed max-w-2xl">
                    {server.description}
                  </p>
                </div>

                {/* Like (thumbs up) + Save (bookmark) actions */}
                <div className="flex items-center gap-2">
                  <LikeButton
                    mcpServerId={server.id}
                    count={server.star_count}
                    size="md"
                    showCount
                    onToggle={(liked, newCount) => {
                      setServer({ ...server, star_count: newCount });
                    }}
                  />
                  <SaveButton mcpServerId={server.id} size="md" />
                </div>
              </div>

              {/* ── Stats Row ──────────────────────────────────────── */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {/* Export count */}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Download className="h-3.5 w-3.5 text-subtle" />
                  <span className="font-medium tabular-nums">{formatCompact(server.export_count)}</span>
                  <span>exports</span>
                </span>

                <span className="h-4 w-px bg-line" />

                {/* Like count */}
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <ThumbsUp className="h-3.5 w-3.5 text-brand-muted" />
                  <span className="font-medium tabular-nums">{formatCompact(server.star_count)}</span>
                  <span>likes</span>
                </span>
              </div>

              {/* Meta Row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint">
                {server.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Added {new Date(server.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(server.id, "id")}
                  className="flex items-center gap-1.5 hover:text-content transition-colors cursor-pointer"
                >
                  {copiedField === "id" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="font-mono">{server.id.slice(0, 8)}…</span>
                </button>
              </div>

              {/* Tags — clickable */}
              {server.tags && server.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {server.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      href={`/explore?q=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-dim border border-brand-line px-2.5 py-1 text-xs font-semibold text-brand-muted hover:bg-brand/10 hover:border-brand/40 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                {/* ── Configuration Snippet ────────────────────────────────────── */}
                <div className="rounded-2xl border border-line bg-surface p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-faint flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5" />
                      Configuration Snippet
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "gap-1.5 transition-colors h-8 text-xs",
                        copiedField === "config" && "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                      )}
                      onClick={handleCopyConfig}
                    >
                      {copiedField === "config" ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Copied JSON
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Config
                        </>
                      )}
                    </Button>
                  </div>
                  {installInfo.installed && (
                    <div className="mb-3 flex items-center gap-1.5 text-2xs font-medium text-success">
                      <Check className="h-3.5 w-3.5" />
                      {installInfo.installedAt
                        ? `You installed this ${timeAgo(installInfo.installedAt)}`
                        : "You've installed this before"}
                    </div>
                  )}
                  <div className="rounded-xl bg-[#0d1117] border border-line-strong p-4 overflow-x-auto text-sm font-mono text-gray-300">
                    <pre>
                      <code>
                        {JSON.stringify({
                          [server.name]: {
                            command: server.command,
                            args: server.args,
                            env: server.env_vars
                          }
                        }, null, 2)}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* ── Environment Variables ────────────────────────────────────── */}
                {server.env_vars && Object.keys(server.env_vars).length > 0 && (
                  <div className="rounded-2xl border border-line bg-surface p-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-4 flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Required Environment Variables
                    </h2>
                    <div className="space-y-3">
                      {Object.entries(server.env_vars).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 rounded-lg border border-line bg-surface-2 p-3">
                          <code className="text-xs font-bold text-brand-muted">{key}</code>
                          <span className="text-xs text-muted font-mono bg-surface-3 px-2 py-1 rounded inline-block max-w-max border border-line">
                            {String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* ── Source & Links ─────────────────────────────────────── */}
                {server.github_url && (
                  <div className="rounded-2xl border border-line bg-surface p-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-faint mb-4 flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      Source Repository
                    </h2>

                    <a
                      href={server.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-all hover:border-brand-line hover:bg-surface-3 group"
                    >
                      <FolderGit className="h-4 w-4 text-brand-muted shrink-0" />
                      <span className="truncate font-mono text-sm text-muted group-hover:text-content transition-colors">
                        GitHub Source
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-faint group-hover:text-brand-muted shrink-0 ml-auto" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
