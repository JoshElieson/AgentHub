import Link from "next/link";
import type { AgentPackage } from "@/lib/types";
import { formatCompact, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import {
  Activity as ActivityIcon,
  GitCommitVertical,
  Package,
  Rocket,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

type TimelineKind = "publish" | "update" | "milestone" | "likes";

interface TimelineItem {
  id: string;
  kind: TimelineKind;
  agent: AgentPackage;
  title: React.ReactNode;
  detail?: string;
  date: string; // ISO
}

const KIND_META: Record<
  TimelineKind,
  { icon: React.ReactNode; ring: string; tint: string }
> = {
  publish: {
    icon: <Rocket className="h-3.5 w-3.5" />,
    ring: "border-brand-line bg-brand-dim",
    tint: "text-brand-muted",
  },
  update: {
    icon: <GitCommitVertical className="h-3.5 w-3.5" />,
    ring: "border-info/30 bg-info-dim",
    tint: "text-info",
  },
  milestone: {
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    ring: "border-success/30 bg-success-dim",
    tint: "text-success",
  },
  likes: {
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    ring: "border-brand-line bg-brand-dim",
    tint: "text-brand-muted",
  },
};

/**
 * Synthesize a deterministic activity timeline from a creator's packages.
 * Derives "published / updated" events from version release dates and a couple
 * of milestone events from install / star counts. No Date.now / random.
 */
function buildTimeline(agents: AgentPackage[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const agent of agents) {
    const sortedVersions = [...agent.versions].sort(
      (a, b) =>
        new Date(a.releasedAt).getTime() - new Date(b.releasedAt).getTime()
    );
    const initial = sortedVersions[0];
    const latest =
      sortedVersions[sortedVersions.length - 1] ?? initial;

    // Initial publish.
    if (initial) {
      items.push({
        id: `${agent.slug}-publish`,
        kind: "publish",
        agent,
        title: (
          <>
            Published{" "}
            <Link
              href={`/agents/${agent.slug}`}
              className="font-medium text-content hover:text-brand-muted"
            >
              {agent.name}
            </Link>{" "}
            v{initial.version}
          </>
        ),
        detail: agent.shortDescription,
        date: initial.releasedAt,
      });
    }

    // Latest version bump (only if it differs from the initial release).
    if (latest && latest !== initial) {
      items.push({
        id: `${agent.slug}-update`,
        kind: "update",
        agent,
        title: (
          <>
            Released{" "}
            <Link
              href={`/agents/${agent.slug}`}
              className="font-medium text-content hover:text-brand-muted"
            >
              {agent.name}
            </Link>{" "}
            v{latest.version}
          </>
        ),
        detail: latest.changelog[0],
        date: latest.releasedAt,
      });
    }

    // Install milestone — attach to the latest update date so it reads as recent.
    if (agent.installCount >= 1000) {
      items.push({
        id: `${agent.slug}-milestone`,
        kind: "milestone",
        agent,
        title: (
          <>
            <Link
              href={`/agents/${agent.slug}`}
              className="font-medium text-content hover:text-brand-muted"
            >
              {agent.name}
            </Link>{" "}
            reached {formatCompact(agent.installCount)} installs
          </>
        ),
        date: agent.updatedAt,
      });
    }

    // Likes milestone for the most-loved packages.
    if (agent.stars >= 500) {
      items.push({
        id: `${agent.slug}-likes`,
        kind: "likes",
        agent,
        title: (
          <>
            <Link
              href={`/agents/${agent.slug}`}
              className="font-medium text-content hover:text-brand-muted"
            >
              {agent.name}
            </Link>{" "}
            passed {formatCompact(agent.stars)} likes
          </>
        ),
        date: agent.updatedAt,
      });
    }
  }

  // Newest first, deterministic tie-break by id.
  return items.sort((a, b) => {
    const d = new Date(b.date).getTime() - new Date(a.date).getTime();
    return d !== 0 ? d : a.id.localeCompare(b.id);
  });
}

export function ActivityTimeline({
  agents,
  creatorName,
  avatarColor,
}: {
  agents: AgentPackage[];
  creatorName: string;
  avatarColor?: string;
}) {
  const items = buildTimeline(agents);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon className="h-5 w-5" />}
        title="No activity yet"
        description="Published packages, releases, and milestones will show up here."
      />
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={creatorName} color={avatarColor} size="md" />
        <div>
          <div className="text-sm font-semibold text-content">{creatorName}</div>
          <div className="text-xs text-subtle">Recent activity</div>
        </div>
      </div>

      <ol className="relative space-y-6">
        {/* Vertical rail */}
        <span
          className="pointer-events-none absolute bottom-2 left-3.5 top-2 w-px bg-line"
          aria-hidden
        />
        {items.map((item) => {
          const meta = KIND_META[item.kind];
          return (
            <li key={item.id} className="relative flex gap-4">
              <span
                className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${meta.ring} ${meta.tint}`}
              >
                {meta.icon}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm leading-snug text-muted">{item.title}</p>
                {item.detail && (
                  <p className="mt-1 line-clamp-2 text-xs text-subtle">
                    {item.detail}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-1.5 text-2xs text-faint">
                  <Package className="h-3 w-3" />
                  <span className="font-mono">{item.agent.packageId}</span>
                  <span aria-hidden>·</span>
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
