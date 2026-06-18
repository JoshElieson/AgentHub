import { memo } from "react";
import Link from "next/link";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn, formatCompact } from "@/lib/utils";
import { isOfficial, type SkillRow, type McpServerRow } from "@/lib/marketplace-data";
import { CardInstalledBadge } from "@/components/card-installed-badge";
import { ClassificationBadges } from "@/components/classification-badges";
import { SaveButton } from "@/components/save-button";
import { BadgeCheck, FolderGit, Download, ThumbsUp, Terminal } from "lucide-react";

/** Blue verified checkmark shown on first-party / official packages. */
export function OfficialBadge({ className }: { className?: string }) {
  return (
    <span title="Official package" className="inline-flex shrink-0">
      <BadgeCheck
        className={cn("h-4 w-4 text-sky-400", className)}
        aria-label="Official package"
      />
    </span>
  );
}

/**
 * Compact card for a real marketplace skill. Links to the canonical detail
 * page (`/marketplace/[id]`) where install/export lives.
 */
export const SkillCard = memo(function SkillCard({
  skill,
  className,
}: {
  skill: SkillRow;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-line hover:shadow-glow/5",
        className
      )}
    >
      <Link
        href={`/marketplace/${skill.id}`}
        aria-label={skill.name}
        className="absolute inset-0 z-[1] rounded-card"
      />
      <div className="flex min-w-0 items-center gap-1.5">
        <h3 className="truncate font-mono text-base font-semibold text-content transition-colors group-hover:text-white">
          {skill.name}
        </h3>
        {isOfficial(skill) && <OfficialBadge />}
        <CardInstalledBadge kind="skill" id={skill.id} className="ml-auto" />
      </div>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
        {skill.description}
      </p>

      <ClassificationBadges
        category={skill.category}
        model={skill.model}
        className="mt-3"
      />

      {skill.trigger_phrases.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skill.trigger_phrases.slice(0, 3).map((phrase, idx) => (
            <span
              key={idx}
              className="max-w-[200px] truncate rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle"
            >
              &quot;{phrase}&quot;
            </span>
          ))}
          {skill.trigger_phrases.length > 3 && (
            <span className="px-1 py-0.5 text-2xs font-medium text-faint">
              +{skill.trigger_phrases.length - 3} more
            </span>
          )}
        </div>
      )}

      {skill.source_url && (
        <div className="mt-3 flex items-center gap-1.5">
          <FolderGit className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
          <span className="truncate font-mono text-2xs text-brand-muted">
            {skill.source_url.replace(/^https?:\/\/(www\.)?github\.com\//, "")}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center gap-3 border-t border-line/60 pt-3">
        <RatingStars
          rating={skill.avg_rating}
          size="sm"
          showValue
          count={skill.rating_count}
        />
        <span className="h-3 w-px bg-line" />
        <span className="flex items-center gap-1 text-2xs text-subtle" title="Likes">
          <ThumbsUp className="h-3 w-3 text-brand-muted" />
          <span className="font-medium tabular-nums">{formatCompact(skill.star_count)}</span>
        </span>
        <span className="flex items-center gap-1 text-2xs text-subtle">
          <Download className="h-3 w-3" />
          <span className="font-medium tabular-nums">{formatCompact(skill.export_count)}</span>
        </span>
        <div className="relative z-[2] ml-auto">
          <SaveButton skillId={skill.id} size="sm" showLabel={false} checkInitial={false} />
        </div>
      </div>
    </div>
  );
});

/**
 * Compact card for a real MCP server. Links to `/marketplace/mcp/[id]`.
 */
export const McpServerCard = memo(function McpServerCard({
  server,
  className,
}: {
  server: McpServerRow;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-line hover:shadow-glow/5",
        className
      )}
    >
      <Link
        href={`/marketplace/mcp/${server.id}`}
        aria-label={server.name}
        className="absolute inset-0 z-[1] rounded-card"
      />
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-3 shadow-inner">
          <Terminal className="h-5 w-5 text-brand-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-base font-semibold text-content transition-colors group-hover:text-brand-muted">
              {server.name}
            </h3>
            {isOfficial(server) && <OfficialBadge />}
            <CardInstalledBadge kind="mcp" id={server.id} className="ml-auto" />
          </div>
          <div className="mt-1">
            <RatingStars rating={server.avg_rating} count={server.rating_count} size="sm" />
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {server.description}
      </p>

      <ClassificationBadges
        category={server.category}
        model={server.model}
        className="mt-3"
      />

      {server.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {server.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle"
            >
              {tag}
            </span>
          ))}
          {server.tags.length > 3 && (
            <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle">
              +{server.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 border-t border-line pt-4 text-xs text-faint">
        <span className="flex items-center gap-1" title="Exports">
          <Download className="h-3.5 w-3.5" />
          {formatCompact(server.export_count)}
        </span>
        <span className="flex items-center gap-1" title="Likes">
          <ThumbsUp className="h-3.5 w-3.5" />
          {formatCompact(server.star_count)}
        </span>
        <div className="relative z-[2] ml-auto">
          <SaveButton mcpServerId={server.id} size="sm" showLabel={false} checkInitial={false} />
        </div>
      </div>
    </div>
  );
});

/** Skeleton placeholder while marketplace data loads. */
export function MarketplaceCardSkeleton() {
  return (
    <div className="h-56 animate-pulse rounded-card border border-line bg-surface" />
  );
}
