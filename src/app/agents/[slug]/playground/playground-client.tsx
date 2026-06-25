"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MarkdownPanel } from "@/components/markdown-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import {
  ArrowLeft,
  Bot,
  ChevronRight,
  Copy,
  Check,
  Download,
  Loader2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  User,
  Zap,
  StopCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Agent metadata type (subset returned by /api/agents/[slug])
// ---------------------------------------------------------------------------

interface AgentMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  interactionMode: string;
  estimatedCredits: number;
  creatorName: string;
  creatorUsername: string;
  creatorColor: string;
  runCount: number;
  avgRating: number;
  ratingCount: number;
  starCount: number;
  enabledDestinations?: string[];
  googleDriveFolderName?: string;
}

// ---------------------------------------------------------------------------
// Suggested prompts per agent
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  "market-research-analyst": [
    "Analyze the AI code review tools market in 2026",
    "Compare Figma vs Canva — market position and growth",
    "What's the TAM for developer tools in Latin America?",
  ],
};

// ---------------------------------------------------------------------------
// Helper: extract text content from a UIMessage
// ---------------------------------------------------------------------------

function getMessageText(msg: UIMessage): string {
  if (!msg.parts) return "";
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentPlayground() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [runnerDriveFolder, setRunnerDriveFolder] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch agent metadata
  useEffect(() => {
    fetch(`/api/agents/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setAgent(null);
        } else {
          setAgent(data);
          if (data.googleDriveFolderName) {
            setRunnerDriveFolder(data.googleDriveFolderName);
          }
        }
      })
      .catch(() => setAgent(null))
      .finally(() => setLoadingMeta(false));
  }, [slug]);

  // Vercel AI SDK v6 useChat — DefaultChatTransport for proper
  // UIMessage serialization and SSE parsing
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agents/run", body: { slug, runnerDriveFolder } }),
    [slug, runnerDriveFolder]
  );

  const {
    messages,
    sendMessage,
    stop,
    regenerate,
    status,
  } = useChat({ transport });

  const isLoading = status === "submitted" || status === "streaming";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Copy message to clipboard
  const copyMessage = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fail silently */
    }
  };

  // Download message as markdown
  const downloadMessage = (content: string, agentName: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agentName.toLowerCase().replace(/\s+/g, "-")}-output.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send message
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Use a suggested prompt
  const useSuggestion = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  // Loading state
  if (loadingMeta) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-brand-muted" />
        </div>
      </AppShell>
    );
  }

  // Agent not found
  if (!agent) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-24 text-center">
          <Bot className="mx-auto h-12 w-12 text-faint" />
          <h1 className="mt-4 text-xl font-semibold text-content">
            Agent not found
          </h1>
          <p className="mt-2 text-sm text-muted">
            The agent &ldquo;{slug}&rdquo; doesn&apos;t exist.
          </p>
          <ButtonLink
            href="/agents/browse"
            variant="primary"
            size="md"
            className="mt-6"
          >
            Browse Agents
          </ButtonLink>
        </div>
      </AppShell>
    );
  }

  const suggestions = SUGGESTED_PROMPTS[slug] ?? [];

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* ── Top bar ──────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-line bg-surface-2/60 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <button
              onClick={() => router.push("/agents/browse")}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted hover:text-content hover:bg-surface-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-xl shadow-inner overflow-hidden">
              {agent.icon.startsWith("data:") || agent.icon.startsWith("http") || agent.icon.startsWith("/") ? (
                <img src={agent.icon} alt={agent.name} className="h-full w-full object-cover" />
              ) : (
                agent.icon
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold text-content">
                {agent.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-subtle">
                <span>{agent.creatorName}</span>
                <span className="text-faint">·</span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {agent.avgRating.toFixed(1)}
                </span>
                <span className="text-faint">·</span>
                <span className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-warning" />
                  ~{agent.estimatedCredits} credits/run
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success-dim px-2.5 py-1 text-2xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>

        {/* ── Chat messages ────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              /* ── Empty state with suggestions ──────────────────── */
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-3 text-3xl shadow-inner border border-line overflow-hidden">
                  {agent.icon.startsWith("data:") || agent.icon.startsWith("http") || agent.icon.startsWith("/") ? (
                    <img src={agent.icon} alt={agent.name} className="h-full w-full object-cover" />
                  ) : (
                    agent.icon
                  )}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-content">
                  {agent.name}
                </h2>
                <p className="mt-1 max-w-md text-center text-sm text-muted">
                  {agent.description}
                </p>

                {suggestions.length > 0 && (
                  <div className="mt-8 w-full max-w-xl space-y-2">
                    <p className="text-center text-xs font-medium text-faint uppercase tracking-wider mb-3">
                      Try one of these
                    </p>
                    {suggestions.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => useSuggestion(prompt)}
                        className="group w-full rounded-xl border border-line bg-surface p-4 text-left transition-all hover:border-brand-line hover:bg-surface-2 hover:shadow-sm"
                      >
                        <span className="flex items-start gap-3">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
                          <span className="text-sm text-muted group-hover:text-content transition-colors whitespace-pre-line line-clamp-2">
                            {prompt}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── Message list ────────────────────────────────── */
              <div className="space-y-6">
                {messages.map((msg) => {
                  const text = getMessageText(msg);
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-base border border-line overflow-hidden">
                          {agent.icon.startsWith("data:") || agent.icon.startsWith("http") || agent.icon.startsWith("/") ? (
                            <img src={agent.icon} alt={agent.name} className="h-full w-full object-cover" />
                          ) : (
                            agent.icon
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-2xl px-4 py-3",
                          msg.role === "user"
                            ? "bg-brand text-white rounded-br-md"
                            : "bg-surface-2 border border-line rounded-bl-md"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose-sm">
                            <MarkdownPanel content={text} />
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{text}</p>
                        )}

                        {/* Action buttons for assistant messages */}
                        {msg.role === "assistant" && text && (
                          <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessage(msg.id, text)}
                              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-2xs font-medium text-subtle hover:text-content transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3 w-3 text-success" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copy
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                downloadMessage(text, agent.name)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-2xs font-medium text-subtle hover:text-content transition-colors"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/20 text-brand">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Streaming indicator */}
                {status === "submitted" && (
                  <div className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-base border border-line overflow-hidden">
                      {agent.icon.startsWith("data:") || agent.icon.startsWith("http") || agent.icon.startsWith("/") ? (
                        <img src={agent.icon} alt={agent.name} className="h-full w-full object-cover" />
                      ) : (
                        agent.icon
                      )}
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-surface-2 border border-line px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-muted" />
                        Thinking…
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Input bar ────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-line bg-surface-2/60 px-4 py-3 sm:px-6">
          {agent.enabledDestinations?.includes("google-drive") && (
            <div className="mx-auto max-w-4xl mb-3 flex items-center gap-2">
              <span className="text-xs font-medium text-muted whitespace-nowrap">Drive Output Path:</span>
              <input
                type="text"
                value={runnerDriveFolder}
                onChange={(e) => setRunnerDriveFolder(e.target.value)}
                placeholder="e.g. AgentHub/Reports"
                className="w-full max-w-sm rounded border border-line bg-surface px-2 py-1 text-xs text-content placeholder:text-faint focus:border-brand-line focus:outline-none"
              />
            </div>
          )}
          <div className="mx-auto flex max-w-4xl items-end gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}…`}
                rows={1}
                className="max-h-36 min-h-[2.75rem] w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 pr-12 text-sm text-content placeholder:text-faint outline-none transition-colors focus:border-brand-line focus:ring-1 focus:ring-brand/30"
                style={{ height: "auto", minHeight: "2.75rem" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 144)}px`;
                }}
              />
            </div>

            {isLoading ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                className="h-11 w-11 shrink-0 !p-0"
                onClick={() => stop()}
              >
                <StopCircle className="h-4 w-4 text-danger" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                className="h-11 w-11 shrink-0 !p-0"
                disabled={!inputValue.trim()}
                onClick={handleSend}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mx-auto mt-2 flex max-w-4xl items-center justify-between">
            <p className="text-2xs text-faint">
              Shift+Enter for new line · Powered by Gemini
            </p>
            {messages.length > 0 && (
              <button
                onClick={() => regenerate()}
                className="inline-flex items-center gap-1 text-2xs text-subtle hover:text-content transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
