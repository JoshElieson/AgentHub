"use client";

import type { AgentPackage, Platform } from "@/lib/types";
import {
  aggregateRisk,
  PERMISSION_KEYS,
  PERMISSION_META,
  PLATFORM_META,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { CommandBlock, CodeBlock } from "./ui/command-block";
import { RiskBadge } from "./ui/badge";
import { Check, Download, FileArchive, FileJson, FolderTree, X } from "lucide-react";
import { useEffect, useState } from "react";

export function InstallModal({
  agent,
  open,
  onClose,
}: {
  agent: AgentPackage;
  open: boolean;
  onClose: () => void;
}) {
  const cmds = agent.installCommands;
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [showManifest, setShowManifest] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Reset selection whenever the modal re-opens.
  useEffect(() => {
    if (open) {
      setPlatform(cmds[0]?.platform ?? null);
      setShowManifest(false);
    }
  }, [open, cmds]);

  if (!open) return null;

  const selected = cmds.find((c) => c.platform === platform) ?? cmds[0];
  const risk = aggregateRisk(agent.permissions);
  const grantedPerms = PERMISSION_KEYS.filter((k) => agent.permissions[k]);
  const manifest =
    agent.files.find((f) => f.path === "agent.json")?.content ?? "{}";

  const downloadPackage = () => {
    const payload = JSON.stringify(
      {
        slug: agent.slug,
        name: agent.name,
        version: agent.version,
        type: agent.type,
        platforms: agent.platforms,
        permissions: agent.permissions,
        installCommands: agent.installCommands,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent.slug}-${agent.version}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-line bg-overlay shadow-overlay animate-slide-up sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="text-sm font-semibold text-content">
              Choose your platform
            </div>
            <div className="text-xs text-subtle">{agent.name}</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-content"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Platform picker */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cmds.map((c) => {
              const meta = PLATFORM_META[c.platform];
              const active = c.platform === selected?.platform;
              return (
                <button
                  key={c.platform}
                  onClick={() => {
                    setPlatform(c.platform);
                    setShowManifest(false);
                  }}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-brand bg-brand-dim"
                      : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-sm font-mono text-[10px] font-semibold",
                      active ? "bg-brand text-brand-fg" : "bg-surface-2 text-content/80"
                    )}
                  >
                    {meta.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content">
                      {meta.label}
                    </span>
                    <span className="block text-2xs text-subtle">
                      {meta.installMethod}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      c.action === "export"
                        ? "border-info/30 bg-info-dim text-info"
                        : "border-line bg-surface-2 text-subtle"
                    )}
                  >
                    {c.action}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected platform detail */}
          {selected && (
            <div className="mt-4 space-y-3">
              <CommandBlock
                command={selected.command}
                label={`${PLATFORM_META[selected.platform].label} — run in your terminal`}
              />
              {selected.targetPath && (
                <div className="rounded-md border border-line bg-surface p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-subtle">
                    <FolderTree className="h-3.5 w-3.5" />
                    {selected.action === "export" ? "Exports to" : "Installs to"}
                  </div>
                  <code className="mt-1 block break-all font-mono text-xs text-brand-muted">
                    {selected.targetPath}
                  </code>
                  {selected.platform === "claude-desktop" && (
                    <p className="mt-1.5 text-2xs text-subtle">
                      The CLI detects the correct per-OS path automatically.
                    </p>
                  )}
                </div>
              )}

              {/* Permissions */}
              <div className="rounded-md border border-line bg-surface p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">
                    This package requests
                  </span>
                  <RiskBadge risk={risk} />
                </div>
                {grantedPerms.length === 0 ? (
                  <div className="text-xs text-success">
                    No special permissions — fully sandboxed.
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {grantedPerms.map((k) => {
                      const m = PERMISSION_META[k];
                      return (
                        <li
                          key={k}
                          className="flex items-center gap-2 text-xs text-muted"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              m.risk === "low" && "bg-success",
                              m.risk === "medium" && "bg-warning",
                              m.risk === "high" && "bg-danger"
                            )}
                          />
                          {m.label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Manifest viewer */}
              {showManifest && <CodeBlock code={manifest} language="json" />}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="grid grid-cols-3 gap-2 border-t border-line p-4">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowManifest((v) => !v)}
          >
            <FileJson className="h-4 w-4" />
            {showManifest ? "Hide" : "Manifest"}
          </Button>
          <Button variant="secondary" size="md" onClick={downloadPackage}>
            <FileArchive className="h-4 w-4" />
            Download
          </Button>
          <Button variant="primary" size="md" onClick={onClose}>
            <Check className="h-4 w-4" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Trigger ----------------------------------------------------------------

export function InstallButton({
  agent,
  variant = "primary",
  size = "md",
  className,
  label = "Install",
  fullWidth,
}: {
  agent: AgentPackage;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  label?: string;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>
      <InstallModal agent={agent} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
