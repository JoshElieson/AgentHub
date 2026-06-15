import type { AgentVersion } from "@/lib/types";
import { cn, formatCompact, formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { CommandBlock } from "./ui/command-block";
import { Download, Tag } from "lucide-react";

export function VersionList({
  versions,
  packageId,
}: {
  versions: AgentVersion[];
  packageId: string;
}) {
  return (
    <ol className="relative space-y-5 border-l border-line pl-6">
      {versions.map((v) => (
        <li key={v.version} className="relative">
          <span
            className={cn(
              "absolute -left-[27px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-canvas",
              v.isLatest ? "bg-brand" : "bg-line-strong"
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-content">
              <Tag className="h-3.5 w-3.5 text-subtle" />
              v{v.version}
            </span>
            {v.isLatest && <Badge variant="brand">Latest</Badge>}
            {v.isPrerelease && <Badge variant="warning">Pre-release</Badge>}
            <span className="text-xs text-subtle">{formatDate(v.releasedAt)}</span>
            <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
              <Download className="h-3 w-3" />
              {formatCompact(v.downloads)}
            </span>
            <span className="text-xs text-subtle">· {v.size}</span>
          </div>

          {v.changelog.length > 0 && (
            <ul className="mt-2 space-y-1">
              {v.changelog.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-subtle" />
                  {c}
                </li>
              ))}
            </ul>
          )}

          <CommandBlock
            command={`npx agentdock install ${packageId}@${v.version}`}
            prompt
            className="mt-3 max-w-md"
          />
        </li>
      ))}
    </ol>
  );
}
