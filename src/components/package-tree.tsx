"use client";

import type { AgentFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CopyButton } from "./ui/command-block";
import {
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMemo, useState } from "react";

function fileIcon(f: AgentFile) {
  if (f.type === "dir") return <Folder className="h-4 w-4 text-info" />;
  if (f.language === "json") return <FileJson className="h-4 w-4 text-warning" />;
  if (f.language === "markdown") return <FileText className="h-4 w-4 text-muted" />;
  return <FileCode2 className="h-4 w-4 text-brand-muted" />;
}

export function PackageTree({ files }: { files: AgentFile[] }) {
  const previews = useMemo(
    () => files.filter((f) => f.type === "file" && f.content !== undefined),
    [files]
  );
  const [selected, setSelected] = useState(previews[0]?.path ?? "");
  const current = previews.find((f) => f.path === selected) ?? previews[0];

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
      {/* Tree */}
      <div className="card overflow-hidden">
        <div className="border-b border-line px-3 py-2 text-xs font-semibold text-subtle">
          {files.filter((f) => f.type === "file").length} files
        </div>
        <ul className="p-1.5">
          {files.map((f) => {
            const depth = f.path.split("/").length - 1;
            const name = f.path.split("/").pop()!;
            const isDir = f.type === "dir";
            const isSelected = f.path === selected;
            return (
              <li key={f.path}>
                <button
                  disabled={isDir || f.content === undefined}
                  onClick={() => setSelected(f.path)}
                  style={{ paddingLeft: 8 + depth * 16 }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
                    isDir
                      ? "cursor-default font-medium text-content"
                      : isSelected
                        ? "bg-surface-2 text-content"
                        : "text-muted hover:bg-surface-2 hover:text-content"
                  )}
                >
                  {isDir ? (
                    <FolderOpen className="h-4 w-4 shrink-0 text-info" />
                  ) : (
                    <span className="shrink-0">{fileIcon(f)}</span>
                  )}
                  <span className="truncate font-mono text-xs">{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preview */}
      <div className="card flex min-h-[420px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-3.5 py-2">
          <div className="flex items-center gap-2">
            {current && fileIcon(current)}
            <span className="font-mono text-xs text-content">{current?.path}</span>
            {current?.size && (
              <span className="text-2xs text-subtle">· {current.size}</span>
            )}
          </div>
          {current?.content && <CopyButton value={current.content} />}
        </div>
        <div className="flex-1 overflow-auto">
          {current?.content ? (
            <pre className="p-4 text-xs leading-relaxed">
              <code className="font-mono text-content/90">{current.content}</code>
            </pre>
          ) : (
            <div className="grid h-full place-items-center text-sm text-subtle">
              Select a file to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
