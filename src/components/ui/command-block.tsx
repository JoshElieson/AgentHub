"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  value,
  className,
  label,
}: {
  value: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          },
          () => {}
        );
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-content",
        className
      )}
      aria-label={label ?? "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}

/**
 * Terminal-style command block with a copy affordance.
 * `prompt` toggles the leading "$".
 */
export function CommandBlock({
  command,
  prompt = true,
  label,
  className,
}: {
  command: string;
  prompt?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("group", className)}>
      {label && (
        <div className="mb-1.5 text-xs font-medium text-subtle">{label}</div>
      )}
      <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-content no-scrollbar">
          {prompt && <span className="select-none text-brand-muted">$ </span>}
          {command}
        </code>
        <CopyButton value={command} className="shrink-0 opacity-70 group-hover:opacity-100" />
      </div>
    </div>
  );
}

/** Multi-line code/snippet panel with copy. */
export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-lg border border-line bg-surface-2", className)}>
      <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-1.5">
        <span className="font-mono text-2xs uppercase tracking-wide text-subtle">
          {language ?? "text"}
        </span>
        <CopyButton value={code} className="border-transparent bg-transparent px-1 opacity-70 group-hover:opacity-100" />
      </div>
      <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed">
        <code className="font-mono text-content/90">{code}</code>
      </pre>
    </div>
  );
}
