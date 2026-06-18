"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAnonId } from "@/lib/anon-id";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Bot, Download, Package } from "lucide-react";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface InstalledItem {
  id: string;
  name: string;
  description: string;
  install_target: string | null;
  installed_at: string | null;
}

const TARGET_LABEL: Record<string, string> = {
  claude: "Claude Code",
  antigravity: "Antigravity",
  config: "Config copied",
  unknown: "Workspace",
};

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card animate-pulse p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-surface-3" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-surface-3" />
              <div className="h-3 w-2/3 rounded bg-surface-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Installed tab
// ---------------------------------------------------------------------------

export function InstalledTab() {
  const [skills, setSkills] = useState<InstalledItem[]>([]);
  const [mcpServers, setMcpServers] = useState<InstalledItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/installed?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setSkills(data.skills ?? []);
          setMcpServers(data.mcpServers ?? []);
        }
      } catch {
        // Fail silently — show empty state.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingRows />;

  const items = [
    ...skills.map((s) => ({ ...s, kind: "skill" as const, href: `/marketplace/${s.id}` })),
    ...mcpServers.map((s) => ({ ...s, kind: "mcp" as const, href: `/marketplace/mcp/${s.id}` })),
  ].sort(
    (a, b) =>
      new Date(b.installed_at ?? 0).getTime() - new Date(a.installed_at ?? 0).getTime()
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-5 w-5" />}
        title="Nothing installed yet"
        description="Skills and MCP servers you install from the marketplace show up here."
        action={
          <ButtonLink href="/explore" variant="primary" size="md">
            Explore marketplace
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="card divide-y divide-line">
      {items.map((item) => (
        <Link
          key={`${item.kind}-${item.id}`}
          href={item.href}
          className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-success/30 bg-success-dim text-success">
            {item.kind === "skill" ? (
              <Bot className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-content">
                {item.name}
              </span>
              <Badge variant="success" className="shrink-0">
                Installed
              </Badge>
            </div>
            <span className="block truncate text-xs text-subtle">
              {item.installed_at
                ? `Installed ${timeAgo(item.installed_at)} · ${
                    TARGET_LABEL[item.install_target ?? "unknown"] ?? "Workspace"
                  }`
                : item.description}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
