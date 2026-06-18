import type { AgentPackage } from "@/lib/types";
import { getCreator } from "@/lib/data";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { Avatar } from "./ui/avatar";
import {
  TypeBadge,
  VerifiedBadge,
} from "./ui/badge";
import { RatingStars } from "./ui/rating-stars";
import { InstallButton } from "./install-modal";
import { Download, ThumbsUp } from "lucide-react";

export function AgentCard({
  agent,
  className,
  compact,
}: {
  agent: AgentPackage;
  className?: string;
  compact?: boolean;
}) {
  const creator = getCreator(agent.creatorUsername);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/agents/${agent.slug}`} className="flex min-w-0 items-start gap-3">
          <Avatar name={agent.name} color={creator?.avatarColor} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-content group-hover:text-white">
                {agent.name}
              </h3>
              {agent.isVerified && <VerifiedBadge />}
            </div>
            <div className="mt-0.5 truncate text-xs text-subtle">
              {agent.orgSlug ? agent.orgSlug : agent.creatorUsername}
              <span className="mx-1 text-faint">/</span>
              <span className="font-mono">{agent.packageId}</span>
            </div>
          </div>
        </Link>
        <TypeBadge type={agent.type} className="shrink-0" />
      </div>

      {/* Tagline */}
      <Link href={`/agents/${agent.slug}`} className="mt-3 block">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {agent.shortDescription}
        </p>
      </Link>

      {/* Tags */}
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {agent.tags.slice(0, 3).map((t) => (
            <Link
              key={t}
              href={`/explore?q=${encodeURIComponent(t)}`}
              className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle transition-colors hover:border-line-strong hover:text-muted"
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats */}
      <div className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-xs text-subtle">
        <RatingStars rating={agent.ratingAvg} size="sm" showValue />
        <span className="flex items-center gap-1 tabular-nums" title="Installs">
          <Download className="h-3.5 w-3.5" />
          {formatCompact(agent.installCount)}
        </span>
        <span className="flex items-center gap-1 tabular-nums" title="Likes">
          <ThumbsUp className="h-3.5 w-3.5" />
          {formatCompact(agent.stars)}
        </span>
        <span className="ml-auto hidden whitespace-nowrap sm:block">
          {timeAgo(agent.updatedAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <InstallButton agent={agent} size="sm" fullWidth />
        <Link
          href={`/agents/${agent.slug}`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-surface-2 px-3 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-content"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
