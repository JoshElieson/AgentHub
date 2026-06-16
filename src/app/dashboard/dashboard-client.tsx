"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DashboardSidebar,
  DASHBOARD_SECTIONS,
  type DashboardSection,
} from "@/components/dashboard-sidebar";
import { AppShell } from "@/components/app-shell";
import { ProfileSettings } from "./profile-settings";
import type { SessionUser } from "@/lib/session";

export type { DashboardSection };
import { CollectionCard } from "@/components/cards";
import { StatCard } from "@/components/ui/stat-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Badge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import {
  getCreator,
  getCreatorStats,
  getAgentsByCreator,
  getCollectionsByCurator,
  collections,
  activityFeed,
  CURRENT_USERNAME,
  type ActivityItem,
} from "@/lib/data";
import type { AgentPackage } from "@/lib/types";
import { cn, formatCompact, formatNumber, timeAgo } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderHeart,
  GitBranch,
  Github,
  Bot,
  LayoutList,
  Package,
  RotateCw,
  Star,
  Trash2,
  UserPlus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Section registry
// ---------------------------------------------------------------------------

const SECTION_META: Record<
  DashboardSection,
  { title: string; description: string }
> = {
  overview: {
    title: "Overview",
    description: "Your packages, installs, and recent activity at a glance.",
  },
  "my-agents": {
    title: "My Agents",
    description: "Packages you've published to AgentDock.",
  },
  installed: {
    title: "Installed",
    description: "Packages installed across your AI tools.",
  },
  favorites: {
    title: "Favorites",
    description: "Packages you've starred to install later.",
  },
  collections: {
    title: "Collections",
    description: "Collections you curate and follow.",
  },
  settings: {
    title: "Settings",
    description: "Manage your profile, connected accounts, and account.",
  },
};

const ACTIVITY_ICON: Record<ActivityItem["kind"], React.ReactNode> = {
  install: <Download className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
  version: <GitBranch className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  follow: <UserPlus className="h-4 w-4" />,
};

const ACTIVITY_TONE: Record<ActivityItem["kind"], string> = {
  install: "text-info bg-info-dim border-info/30",
  review: "text-warning bg-warning-dim border-warning/30",
  version: "text-brand-muted bg-brand-dim border-brand-line",
  star: "text-warning bg-warning-dim border-warning/30",
  follow: "text-success bg-success-dim border-success/30",
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function DashboardClient({
  user,
  connectedProviders,
  canPersist,
  initialSection = "overview",
}: {
  user: SessionUser;
  connectedProviders: string[];
  canPersist: boolean;
  initialSection?: DashboardSection;
}) {
  const [active, setActive] = useState<DashboardSection>(initialSection);
  const meta = SECTION_META[active];

  // Dashboard content is scoped to the signed-in user. Published agents and
  // curated collections come from the seeded marketplace data only when the
  // user is the demo "seed" creator; a brand-new account simply has none yet
  // (the sections render their empty states). Installed / favorites / activity
  // aren't creator-keyed in the mock data, so they show for the seed user only.
  const username = user.username;
  const isSeedCreator = username === CURRENT_USERNAME;
  const creatorColor = getCreator(username)?.avatarColor ?? user.avatarColor;

  return (
    <AppShell>
      <div className="py-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={user.name}
              color={user.avatarColor}
              image={user.image}
              size="xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-content">
                  Dashboard
                </h1>
                {user.isVerified && <VerifiedBadge />}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {user.name}{" "}
                <span className="text-faint">Â·</span>{" "}
                <span className="font-mono text-subtle">@{user.username}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink
              href={`/u/${user.username}`}
              variant="outline"
              size="md"
            >
              View public profile
              <ExternalLink className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/publish" variant="primary" size="md">
              Publish
            </ButtonLink>
          </div>
        </div>

        {/* Mobile section nav */}
        <div className="mt-6 lg:hidden">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
            {DASHBOARD_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  active === s.id
                    ? "border-line-strong bg-surface-2 text-content"
                    : "border-line bg-surface text-muted hover:text-content"
                )}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two columns */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <DashboardSidebar
                active={active}
                onSelect={setActive}
                user={{
                  name: user.name,
                  username: user.username,
                  avatarColor: user.avatarColor,
                  image: user.image,
                }}
              />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
                {meta.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{meta.description}</p>
            </div>

            <div key={active} className="animate-fade-in">
              {active === "overview" && (
                <OverviewSection
                  username={username}
                  isSeedCreator={isSeedCreator}
                  creatorColor={creatorColor}
                />
              )}
              {active === "my-agents" && (
                <MyAgentsSection
                  username={username}
                  creatorColor={creatorColor}
                />
              )}
              {active === "installed" && <InstalledSection />}
              {active === "favorites" && (
                <FavoritesSection isSeedCreator={isSeedCreator} />
              )}
              {active === "collections" && (
                <CollectionsSection
                  username={username}
                  isSeedCreator={isSeedCreator}
                />
              )}
              {active === "settings" && (
                <ProfileSettings
                  user={user}
                  connectedProviders={connectedProviders}
                  canPersist={canPersist}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function OverviewSection({
  username,
  isSeedCreator,
  creatorColor,
}: {
  username: string;
  isSeedCreator: boolean;
  creatorColor: string;
}) {
  const stats = getCreatorStats(username);
  const { skills: installedSkills, mcpServers: installedMcps } =
    useInstalledItems();
  const installedCount = installedSkills.length + installedMcps.length;
  const published = getAgentsByCreator(username);
  const activity = isSeedCreator ? activityFeed : [];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Installed"
          value={installedCount}
          icon={<Download className="h-4 w-4" />}
          hint="Skills & MCP servers"
        />
        <StatCard
          label="Published"
          value={stats.totalAgents}
          icon={<Package className="h-4 w-4" />}
          hint="Packages you maintain"
        />
        <StatCard
          label="Total installs"
          value={formatCompact(stats.totalInstalls)}
          icon={<ArrowUpCircle className="h-4 w-4" />}
          hint="Across all your agents"
        />
        <StatCard
          label="Avg rating"
          value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "â€”"}
          icon={<Star className="h-4 w-4" />}
          hint={
            stats.totalStars > 0
              ? `${formatCompact(stats.totalStars)} stars`
              : "No ratings yet"
          }
        />
      </div>

      {/* Recent activity */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-muted" />
          <h3 className="text-sm font-semibold text-content">Recent activity</h3>
        </div>
        <div className="card divide-y divide-line">
          {activity.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-subtle">
              No recent activity yet.
            </div>
          ) : (
            activity.map((item) => {
            const inner = (
              <>
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                    ACTIVITY_TONE[item.kind]
                  )}
                >
                  {ACTIVITY_ICON[item.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-content">{item.text}</span>
                  <span className="mt-0.5 block text-xs text-subtle">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
                {item.agentSlug && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                )}
              </>
            );
            return item.agentSlug ? (
              <Link
                key={item.id}
                href={`/agents/${item.agentSlug}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
              >
                {inner}
              </Link>
            ) : (
              <div key={item.id} className="flex items-center gap-3 p-3">
                {inner}
              </div>
            );
          })
          )}
        </div>
      </section>

      {/* Installed preview (real per-user installs) */}
      <InstalledPreview skills={installedSkills} mcpServers={installedMcps} />

      {/* Published preview */}
      <PreviewSection
        title="Published"
        icon={<Package className="h-4 w-4 text-brand-muted" />}
        href="published"
        empty="You haven't published any agents yet."
        agents={published}
        color={creatorColor}
      />
    </div>
  );
}

function PreviewSection({
  title,
  icon,
  empty,
  agents,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  empty: string;
  agents: AgentPackage[];
  color: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        <span className="text-xs text-subtle">({agents.length})</span>
      </div>
      {agents.length === 0 ? (
        <div className="card px-4 py-6 text-center text-sm text-subtle">
          {empty}
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {agents.slice(0, 4).map((a) => (
            <AgentRow key={a.slug} agent={a} color={color} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgentRow({ agent, color }: { agent: AgentPackage; color: string }) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
    >
      <Avatar name={agent.name} color={color} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-content">
            {agent.name}
          </span>
          <TypeBadge type={agent.type} className="shrink-0" />
        </div>
        <span className="truncate text-xs text-subtle">{agent.shortDescription}</span>
      </div>
      <span className="hidden items-center gap-1 text-xs tabular-nums text-subtle sm:flex">
        <Download className="h-3.5 w-3.5" />
        {formatCompact(agent.installCount)}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
    </Link>
  );
}

/** Overview glance at the user's most-recent real installs (skills + MCP). */
function InstalledPreview({
  skills,
  mcpServers,
}: {
  skills: InstalledSkill[];
  mcpServers: InstalledMcp[];
}) {
  const items = [
    ...skills.map((s) => ({
      kind: "skill" as const,
      id: s.id,
      name: s.name,
      description: s.description,
      installedAt: s.installed_at,
      href: `/marketplace/${s.id}`,
    })),
    ...mcpServers.map((s) => ({
      kind: "mcp" as const,
      id: s.id,
      name: s.name,
      description: s.description,
      installedAt: s.installed_at,
      href: `/marketplace/mcp/${s.id}`,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.installedAt ?? 0).getTime() -
        new Date(a.installedAt ?? 0).getTime()
    )
    .slice(0, 4);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Download className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold text-content">Installed</h3>
        <span className="text-xs text-subtle">
          ({skills.length + mcpServers.length})
        </span>
      </div>
      {items.length === 0 ? (
        <div className="card px-4 py-6 text-center text-sm text-subtle">
          You haven&apos;t installed any skills or MCP servers yet.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-success/30 bg-success-dim text-success">
                {item.kind === "skill" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-content">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-subtle">
                  {item.installedAt
                    ? `Installed ${timeAgo(item.installedAt)}`
                    : item.description}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// My Agents
// ---------------------------------------------------------------------------

function MyAgentsSection({
  username,
  creatorColor,
}: {
  username: string;
  creatorColor: string;
}) {
  const agents = getAgentsByCreator(username);

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-5 w-5" />}
        title="No published agents"
        description="Publish your first package to see it here."
        action={
          <ButtonLink href="/publish" variant="primary" size="md">
            Publish an agent
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header (desktop) */}
      <div className="hidden border-b border-line bg-surface-2/40 px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-subtle md:grid md:grid-cols-[1.6fr_0.7fr_0.7fr_1fr_0.8fr_auto] md:items-center md:gap-4">
        <span>Package</span>
        <span>Version</span>
        <span>Installs</span>
        <span>Rating</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-line">
        {agents.map((a) => (
          <div
            key={a.slug}
            className="grid grid-cols-1 gap-3 p-4 transition-colors hover:bg-surface-2/50 md:grid-cols-[1.6fr_0.7fr_0.7fr_1fr_0.8fr_auto] md:items-center md:gap-4"
          >
            {/* Package */}
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={a.name} color={creatorColor} size="md" />
              <div className="min-w-0">
                <Link
                  href={`/agents/${a.slug}`}
                  className="block truncate text-sm font-medium text-content hover:text-white"
                >
                  {a.name}
                </Link>
                <span className="block truncate font-mono text-xs text-subtle">
                  {a.packageId}
                </span>
              </div>
            </div>

            {/* Version */}
            <div className="flex items-center gap-2 md:block">
              <span className="text-2xs uppercase tracking-wide text-faint md:hidden">
                Version
              </span>
              <Badge variant="outline" className="font-mono">
                v{a.version}
              </Badge>
            </div>

            {/* Installs */}
            <div className="flex items-center gap-2 md:block">
              <span className="text-2xs uppercase tracking-wide text-faint md:hidden">
                Installs
              </span>
              <span className="flex items-center gap-1 text-sm tabular-nums text-muted">
                <Download className="h-3.5 w-3.5 text-subtle" />
                {formatCompact(a.installCount)}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 md:block">
              <span className="text-2xs uppercase tracking-wide text-faint md:hidden">
                Rating
              </span>
              {a.ratingCount > 0 ? (
                <RatingStars
                  rating={a.ratingAvg}
                  size="sm"
                  showValue
                  count={a.ratingCount}
                />
              ) : (
                <span className="text-xs text-subtle">No ratings</span>
              )}
            </div>

            {/* Updated */}
            <div className="flex items-center gap-2 md:block">
              <span className="text-2xs uppercase tracking-wide text-faint md:hidden">
                Updated
              </span>
              <span className="text-xs text-subtle">{timeAgo(a.updatedAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:justify-end">
              <ButtonLink href={`/agents/${a.slug}`} variant="outline" size="sm">
                Manage
              </ButtonLink>
              <ButtonLink
                href={`/agents/${a.slug}`}
                variant="outline"
                size="sm"
              >
                Edit
              </ButtonLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Installed (real per-user data from /api/skills/installed)
// ---------------------------------------------------------------------------

interface InstalledSkill {
  id: string;
  name: string;
  description: string;
  star_count: number;
  export_count: number;
  install_target: string | null;
  installed_at: string | null;
}
interface InstalledMcp {
  id: string;
  name: string;
  description: string;
  star_count: number;
  export_count: number;
  install_target: string | null;
  installed_at: string | null;
}

const TARGET_LABEL: Record<string, string> = {
  claude: "Claude Code",
  antigravity: "Antigravity",
  config: "Config copied",
  unknown: "Workspace",
};

/**
 * Loads the skills + MCP servers the current anonymous user has installed.
 * Shared by the Installed tab and the Overview glance.
 */
function useInstalledItems() {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [mcpServers, setMcpServers] = useState<InstalledMcp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getAnonId } = await import("@/lib/anon-id");
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/installed?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setSkills(data.skills ?? []);
          setMcpServers(data.mcpServers ?? []);
        }
      } catch {
        // Fail silently — show empty state.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeSkill = (id: string) =>
    setSkills((prev) => prev.filter((s) => s.id !== id));
  const removeMcp = (id: string) =>
    setMcpServers((prev) => prev.filter((s) => s.id !== id));

  return { skills, mcpServers, loading, removeSkill, removeMcp };
}

function InstalledSection() {
  const { skills, mcpServers, loading, removeSkill, removeMcp } =
    useInstalledItems();

  const handleUninstallSkill = async (id: string) => {
    removeSkill(id); // optimistic
    try {
      const { getAnonId } = await import("@/lib/anon-id");
      const anonId = getAnonId();
      await fetch(`/api/skills/install?skillId=${id}&anonId=${anonId}`, {
        method: "DELETE",
      });
    } catch {
      // Fail silently
    }
  };

  const handleUninstallMcp = async (id: string) => {
    removeMcp(id); // optimistic
    try {
      const { getAnonId } = await import("@/lib/anon-id");
      const anonId = getAnonId();
      await fetch(`/api/mcp/install?serverId=${id}&anonId=${anonId}`, {
        method: "DELETE",
      });
    } catch {
      // Fail silently
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="card animate-pulse p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-surface-3" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-surface-3" />
                <div className="h-3 w-2/3 rounded bg-surface-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (skills.length + mcpServers.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-5 w-5" />}
        title="Nothing installed yet"
        description="Install a skill or MCP server from the marketplace and it'll show up here."
        action={
          <ButtonLink href="/explore" variant="primary" size="md">
            Explore marketplace
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {skills.length > 0 && (
        <section>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {skills.map((skill) => (
              <InstalledCard
                key={skill.id}
                href={`/marketplace/${skill.id}`}
                icon={<Bot className="h-4 w-4" />}
                iconClass="border-success/30 bg-success-dim text-success"
                name={skill.name}
                description={skill.description}
                target={skill.install_target}
                installedAt={skill.installed_at}
                onUninstall={() => handleUninstallSkill(skill.id)}
              />
            ))}
          </div>
        </section>
      )}

      {mcpServers.length > 0 && (
        <section>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {mcpServers.map((server) => (
              <InstalledCard
                key={server.id}
                href={`/marketplace/mcp/${server.id}`}
                icon={<Package className="h-4 w-4" />}
                iconClass="border-info/30 bg-info-dim text-info"
                name={server.name}
                description={server.description}
                target={server.install_target}
                installedAt={server.installed_at}
                onUninstall={() => handleUninstallMcp(server.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function InstalledCard({
  href,
  icon,
  iconClass,
  name,
  description,
  target,
  installedAt,
  onUninstall,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass: string;
  name: string;
  description: string;
  target: string | null;
  installedAt: string | null;
  onUninstall: () => void;
}) {
  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start gap-3">
        <Link href={href} className="group flex min-w-0 flex-1 items-start gap-3">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
              iconClass
            )}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-content group-hover:text-white">
                {name}
              </h3>
              <Badge variant="success" className="shrink-0">
                Installed
              </Badge>
            </div>
            <span className="mt-0.5 block truncate text-xs text-subtle">
              {description}
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-2/50 p-3 text-xs">
        <div>
          <span className="block text-faint">Target</span>
          <span className="mt-0.5 block text-content">
            {TARGET_LABEL[target ?? "unknown"] ?? "Workspace"}
          </span>
        </div>
        <div>
          <span className="block text-faint">Installed</span>
          <span className="mt-0.5 block text-content">
            {installedAt ? timeAgo(installedAt) : "—"}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="mt-3 flex items-center gap-2">
        <ButtonLink href={href} variant="outline" size="sm" className="flex-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Re-install / view
        </ButtonLink>
        <Button
          variant="danger"
          size="icon"
          title="Remove from installed"
          onClick={onUninstall}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

function FavoritesSection({ isSeedCreator }: { isSeedCreator: boolean }) {
  const [skills, setSkills] = useState<
    {
      id: string;
      name: string;
      description: string;
      tags: string[];
      star_count: number;
      export_count: number;
      avg_rating: number;
      rating_count: number;
    }[]
  >([]);
  const [mcpServers, setMcpServers] = useState<
    {
      id: string;
      name: string;
      description: string;
      tags: string[];
      star_count: number;
      export_count: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch starred items from API
  useEffect(() => {
    async function load() {
      try {
        const { getAnonId } = await import("@/lib/anon-id");
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/starred?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          setSkills(data.skills ?? []);
          setMcpServers(data.mcpServers ?? []);
        }
      } catch {
        // Fail silently — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Unstar handlers
  const handleUnstarSkill = async (skillId: string) => {
    const { getAnonId } = await import("@/lib/anon-id");
    const anonId = getAnonId();
    // Optimistic remove
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    try {
      await fetch("/api/skills/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, anonId }),
      });
    } catch {
      // Fail silently
    }
  };

  const handleUnstarMcp = async (serverId: string) => {
    const { getAnonId } = await import("@/lib/anon-id");
    const anonId = getAnonId();
    // Optimistic remove
    setMcpServers((prev) => prev.filter((s) => s.id !== serverId));
    try {
      await fetch("/api/mcp/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId, anonId }),
      });
    } catch {
      // Fail silently
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card animate-pulse p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-surface-3" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-surface-3" />
                <div className="h-3 w-2/3 rounded bg-surface-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalCount = skills.length + mcpServers.length;

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<Star className="h-5 w-5" />}
        title="No favorites yet"
        description="Star packages from the marketplace to keep them here."
        action={
          <ButtonLink href="/explore" variant="primary" size="md">
            Explore marketplace
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      {skills.length > 0 && (
        <section>
          <div className="card divide-y divide-line">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
              >
                <Link
                  href={`/marketplace/${skill.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-line bg-brand-dim text-brand-muted">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content group-hover:text-white">
                      {skill.name}
                    </span>
                    <span className="block truncate text-xs text-subtle">
                      {skill.description}
                    </span>
                  </div>
                </Link>
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {formatCompact(skill.star_count)}
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Download className="h-3.5 w-3.5" />
                    {formatCompact(skill.export_count)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnstarSkill(skill.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-faint transition-colors hover:border-warning/40 hover:bg-warning/10 hover:text-warning"
                  title="Remove from favorites"
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Starred MCP Servers */}
      {mcpServers.length > 0 && (
        <section>
          <div className="card divide-y divide-line">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
              >
                <Link
                  href={`/marketplace/mcp/${server.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-info/30 bg-info-dim text-info">
                    <Package className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-content group-hover:text-white">
                      {server.name}
                    </span>
                    <span className="block truncate text-xs text-subtle">
                      {server.description}
                    </span>
                  </div>
                </Link>
                <div className="hidden items-center gap-3 sm:flex">
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {formatCompact(server.star_count)}
                  </span>
                  <span className="flex items-center gap-1 text-xs tabular-nums text-subtle">
                    <Download className="h-3.5 w-3.5" />
                    {formatCompact(server.export_count)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnstarMcp(server.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-faint transition-colors hover:border-warning/40 hover:bg-warning/10 hover:text-warning"
                  title="Remove from favorites"
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

function CollectionsSection({
  username,
  isSeedCreator,
}: {
  username: string;
  isSeedCreator: boolean;
}) {
  const curated = getCollectionsByCurator(username);
  // Followed collections: a couple curated by others (seed demo only).
  const followed = isSeedCreator
    ? collections.filter((c) => c.curatorUsername !== username).slice(0, 3)
    : [];

  const hasAny = curated.length > 0 || followed.length > 0;

  if (!hasAny) {
    return (
      <EmptyState
        icon={<FolderHeart className="h-5 w-5" />}
        title="No collections yet"
        description="Create a collection to group agents you love, or follow one."
        action={
          <ButtonLink href="/collections" variant="primary" size="md">
            Browse collections
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-brand-muted" />
            <h3 className="text-sm font-semibold text-content">Curated by you</h3>
            <span className="text-xs text-subtle">({curated.length})</span>
          </div>
        </div>
        {curated.length === 0 ? (
          <div className="card px-4 py-6 text-center text-sm text-subtle">
            You haven&apos;t curated any collections yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {curated.map((c) => (
              <CollectionCard key={c.slug} collection={c} />
            ))}
          </div>
        )}
      </section>

      {followed.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <FolderHeart className="h-4 w-4 text-info" />
            <h3 className="text-sm font-semibold text-content">Followed</h3>
            <span className="text-xs text-subtle">({followed.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followed.map((c) => (
              <CollectionCard key={c.slug} collection={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
