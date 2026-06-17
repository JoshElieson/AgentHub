import type { Collection, Creator, Organization } from "@/lib/types";
import { getCollectionAgents, getCollectionItemCount, getCreator, getCreatorStats, getOrgStats, getOrganization } from "@/lib/data";
import { getAgentsByCreator } from "@/lib/data";
import { cn, formatCompact } from "@/lib/utils";
import Link from "next/link";
import { Avatar } from "./ui/avatar";
import { VerifiedBadge } from "./ui/badge";
import { Download, Package, Plug, Users } from "lucide-react";

// --- Collection -------------------------------------------------------------

export function CollectionCard({ collection }: { collection: Collection }) {
  const itemCount = getCollectionItemCount(collection);
  const org = collection.orgSlug
    ? getOrganization(collection.orgSlug)
    : undefined;
  const isMcp = collection.kind === "mcps";

  // For skill collections, resolve agents for the avatar stack
  const agents = isMcp ? [] : getCollectionAgents(collection);

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group card-interactive flex flex-col overflow-hidden"
    >
      <div
        className="relative h-16 w-full border-b border-line"
        style={{ background: collection.coverColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/35" />
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-50" />
        {collection.isOfficial && (
          <span className="absolute right-3 top-3" title="Official collection">
            <VerifiedBadge label="Official collection" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {/* Kind label */}
        <div className="mb-2 flex items-center gap-1.5">
          {isMcp ? (
            <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle">
              <Plug className="h-3 w-3" />
              MCP Servers
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle">
              <Package className="h-3 w-3" />
              Skills
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-content group-hover:text-white">
          {collection.name}
        </h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">
          {collection.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          {org ? (
            <div className="flex items-center gap-2">
              <Avatar
                name={org.name}
                color={org.avatarColor}
                size="sm"
                className="ring-2 ring-surface"
              />
              <span className="text-xs font-medium text-muted">
                {org.name}
              </span>
            </div>
          ) : !isMcp && agents.length > 0 ? (
            <div className="flex -space-x-2">
              {agents.slice(0, 4).map((a) => {
                const c = getCreator(a.creatorUsername);
                return (
                  <Avatar
                    key={a.slug}
                    name={a.name}
                    color={c?.avatarColor}
                    size="sm"
                    className="ring-2 ring-surface"
                  />
                );
              })}
              {agents.length > 4 && (
                <span className="grid h-7 w-7 place-items-center rounded-md border border-line bg-surface-2 text-2xs font-medium text-muted ring-2 ring-surface tnum">
                  +{agents.length - 4}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md border border-line bg-surface-2">
                <Plug className="h-3.5 w-3.5 text-subtle" />
              </div>
              <span className="text-xs text-subtle">{itemCount} servers</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="flex items-center gap-1 tabular-nums">
              {isMcp ? (
                <Plug className="h-3.5 w-3.5" />
              ) : (
                <Package className="h-3.5 w-3.5" />
              )}
              {itemCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- Organization -----------------------------------------------------------

export function OrgCard({ org }: { org: Organization }) {
  const stats = getOrgStats(org.slug);
  return (
    <Link href={`/org/${org.slug}`} className="group card-interactive flex items-center gap-4 p-4">
      <Avatar name={org.name} color={org.avatarColor} size="xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-base font-semibold text-content group-hover:text-white">
            {org.name}
          </h3>
          {org.isVerified && <VerifiedBadge />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-muted">{org.description}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-subtle">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {stats.totalAgents} packages
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Download className="h-3.5 w-3.5" />
            {formatCompact(stats.totalInstalls)}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <Users className="h-3.5 w-3.5" />
            {formatCompact(org.followers)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// --- Creator ----------------------------------------------------------------

export function CreatorCard({ creator }: { creator: Creator }) {
  const stats = getCreatorStats(creator.username);
  return (
    <Link href={`/u/${creator.username}`} className="group card-interactive flex items-center gap-4 p-4">
      <Avatar name={creator.name} color={creator.avatarColor} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-content group-hover:text-white">
            {creator.name}
          </h3>
          {creator.isVerified && <VerifiedBadge />}
        </div>
        <div className="truncate text-xs text-subtle">@{creator.username}</div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-subtle">
          <span className="tabular-nums">{stats.totalAgents} packages</span>
          <span className="tabular-nums">{formatCompact(stats.totalInstalls)} installs</span>
        </div>
      </div>
    </Link>
  );
}
