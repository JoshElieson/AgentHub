import type { Issue } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import {
  Bug,
  CircleDot,
  CheckCircle2,
  Lightbulb,
  Puzzle,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

function kindIcon(issue: Issue) {
  if (issue.state === "closed")
    return <CheckCircle2 className="h-4 w-4 text-brand-muted" />;
  switch (issue.kind) {
    case "bug":
      return <Bug className="h-4 w-4 text-danger" />;
    case "feature":
      return <Lightbulb className="h-4 w-4 text-warning" />;
    case "compatibility":
      return <Puzzle className="h-4 w-4 text-info" />;
    default:
      return <HelpCircle className="h-4 w-4 text-success" />;
  }
}

const LABEL_TONE: Record<string, string> = {
  bug: "border-danger/30 text-danger",
  "false-positive": "border-warning/30 text-warning",
  enhancement: "border-success/30 text-success",
  ci: "border-info/30 text-info",
  compatibility: "border-info/30 text-info",
  windows: "border-line-strong text-muted",
  docs: "border-brand-line text-brand-muted",
};

export function IssueList({ issues }: { issues: Issue[] }) {
  const open = issues.filter((i) => i.state === "open").length;
  const closed = issues.length - open;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-line bg-surface-2 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-content">
          <CircleDot className="h-4 w-4 text-success" />
          {open} Open
        </span>
        <span className="flex items-center gap-1.5 text-muted">
          <CheckCircle2 className="h-4 w-4" />
          {closed} Closed
        </span>
      </div>
      <ul className="divide-y divide-line">
        {issues.map((issue) => (
          <li
            key={issue.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <span className="mt-0.5">{kindIcon(issue)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-content hover:text-brand-muted">
                  {issue.title}
                </span>
                {issue.labels.map((l) => (
                  <span
                    key={l}
                    className={cn(
                      "rounded-sm border px-1.5 py-0.5 text-2xs font-medium",
                      LABEL_TONE[l] ?? "border-line-strong text-muted"
                    )}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <div className="mt-1 text-xs text-subtle">
                #{issue.number} opened {timeAgo(issue.createdAt)} by {issue.authorName}
              </div>
            </div>
            {issue.comments > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-subtle">
                <MessageSquare className="h-3.5 w-3.5" />
                {issue.comments}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
