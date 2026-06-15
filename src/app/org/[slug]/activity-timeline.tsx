import type { AgentPackage } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { GitCommitVertical, History, Package, Rocket } from "lucide-react";

interface TimelineEntry {
  agent: AgentPackage;
  version: string;
  releasedAt: string;
  changelog: string[];
  isInitial: boolean;
}

/**
 * Derives a release timeline from every version of every agent the org ships,
 * sorted newest-first.
 */
function buildTimeline(agents: AgentPackage[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const agent of agents) {
    const versions = agent.versions;
    versions.forEach((v, i) => {
      entries.push({
        agent,
        version: v.version,
        releasedAt: v.releasedAt,
        changelog: v.changelog,
        // The earliest version in the list is the initial publish.
        isInitial: i === versions.length - 1,
      });
    });
  }
  return entries.sort(
    (a, b) =>
      new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()
  );
}

export function ActivityTimeline({
  agents,
  orgName,
  orgColor,
}: {
  agents: AgentPackage[];
  orgName: string;
  orgColor: string;
}) {
  const timeline = buildTimeline(agents).slice(0, 24);

  if (timeline.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-5 w-5" />}
        title="No activity yet"
        description="When this organization publishes or updates packages, releases will show up here."
      />
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-line pl-6">
      {timeline.map((entry, i) => (
        <li key={`${entry.agent.slug}-${entry.version}-${i}`} className="relative">
          {/* Node */}
          <span
            className={`absolute -left-[31px] top-1 grid h-6 w-6 place-items-center rounded-full border ${
              entry.isInitial
                ? "border-brand-line bg-brand-dim text-brand-muted"
                : "border-line bg-surface-2 text-subtle"
            }`}
          >
            {entry.isInitial ? (
              <Rocket className="h-3 w-3" />
            ) : (
              <GitCommitVertical className="h-3.5 w-3.5" />
            )}
          </span>

          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Avatar
                name={orgName}
                color={orgColor}
                size="xs"
                className="mr-0.5"
              />
              <span className="font-medium text-content">{orgName}</span>
              <span className="text-muted">
                {entry.isInitial ? "published" : "released"}
              </span>
              <Link
                href={`/agents/${entry.agent.slug}`}
                className="inline-flex items-center gap-1 font-medium text-content hover:text-brand-muted"
              >
                <Package className="h-3.5 w-3.5 text-subtle" />
                {entry.agent.name}
              </Link>
              <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-brand-muted">
                v{entry.version}
              </code>
              <span
                className="ml-auto text-xs text-subtle"
                title={formatDate(entry.releasedAt)}
              >
                {timeAgo(entry.releasedAt)}
              </span>
            </div>

            {entry.changelog.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-muted">
                {entry.changelog.slice(0, 3).map((line, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
