"use client";

import { useState } from "react";
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
import { AgentGrid } from "@/components/agent-grid";
import { CollectionCard } from "@/components/cards";
import { StatCard } from "@/components/ui/stat-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Badge,
  RiskBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import {
  getCurrentUser,
  getCreatorStats,
  getMyAgents,
  getInstalledAgents,
  getFavoriteAgents,
  getCollectionsByCurator,
  collections,
  activityFeed,
  CURRENT_USERNAME,
  type ActivityItem,
} from "@/lib/data";
import { aggregateRisk, PLATFORM_META, RISK_LABELS } from "@/lib/taxonomy";
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
  Package,
  RotateCw,
  Settings2,
  Sparkles,
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
  authMode,
  initialSection = "overview",
}: {
  user: SessionUser;
  connectedProviders: string[];
  authMode: "oauth" | "mock";
  initialSection?: DashboardSection;
}) {
  const [active, setActive] = useState<DashboardSection>(initialSection);
  const meta = SECTION_META[active];

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
              {active === "overview" && <OverviewSection />}
              {active === "my-agents" && <MyAgentsSection />}
              {active === "installed" && <InstalledSection />}
              {active === "favorites" && <FavoritesSection />}
              {active === "collections" && <CollectionsSection />}
              {active === "settings" && (
                <ProfileSettings
                  user={user}
                  connectedProviders={connectedProviders}
                  authMode={authMode}
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

function OverviewSection() {
  const stats = getCreatorStats(CURRENT_USERNAME);
  const installed = getInstalledAgents();
  const published = getMyAgents();

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Installed"
          value={installed.length}
          icon={<Download className="h-4 w-4" />}
          hint="Across your AI tools"
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
          {activityFeed.map((item) => {
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
          })}
        </div>
      </section>

      {/* Installed preview */}
      <PreviewSection
        title="Installed"
        icon={<Download className="h-4 w-4 text-info" />}
        href="installed"
        empty="You haven't installed any agents yet."
        agents={installed.map((x) => x.agent)}
      />

      {/* Published preview */}
      <PreviewSection
        title="Published"
        icon={<Package className="h-4 w-4 text-brand-muted" />}
        href="published"
        empty="You haven't published any agents yet."
        agents={published}
      />
    </div>
  );
}

function PreviewSection({
  title,
  icon,
  empty,
  agents,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  empty: string;
  agents: AgentPackage[];
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
            <AgentRow key={a.slug} agent={a} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgentRow({ agent }: { agent: AgentPackage }) {
  const creator = getCurrentUser();
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-2"
    >
      <Avatar name={agent.name} color={creator.avatarColor} size="md" />
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

// ---------------------------------------------------------------------------
// My Agents
// ---------------------------------------------------------------------------

function MyAgentsSection() {
  const agents = getMyAgents();

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
              <Avatar name={a.name} color={getCurrentUser().avatarColor} size="md" />
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
// Installed
// ---------------------------------------------------------------------------

function InstalledSection() {
  const installed = getInstalledAgents();

  if (installed.length === 0) {
    return (
      <EmptyState
        icon={<Download className="h-5 w-5" />}
        title="Nothing installed yet"
        description="Browse the marketplace and install your first agent."
        action={
          <ButtonLink href="/explore" variant="primary" size="md">
            Explore marketplace
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {installed.map(({ install, agent }) => {
        const risk = aggregateRisk(agent.permissions);
        const platform = PLATFORM_META[install.target];
        return (
          <div key={install.slug} className="card flex flex-col p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/agents/${agent.slug}`}
                className="group flex min-w-0 items-start gap-3"
              >
                <Avatar
                  name={agent.name}
                  color={getCurrentUser().avatarColor}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold text-content group-hover:text-white">
                      {agent.name}
                    </h3>
                    {agent.isVerified && <VerifiedBadge />}
                  </div>
                  <span className="truncate font-mono text-xs text-subtle">
                    {agent.packageId}
                  </span>
                </div>
              </Link>
              <TypeBadge type={agent.type} className="shrink-0" />
            </div>

            {/* Install meta */}
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-2/50 p-3 text-xs">
              <div>
                <span className="block text-faint">Version</span>
                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-content">
                  v{install.installedVersion}
                  {install.hasUpdate ? (
                    <Badge variant="warning">
                      v{agent.version} available
                    </Badge>
                  ) : (
                    <Badge variant="success">Latest</Badge>
                  )}
                </span>
              </div>
              <div>
                <span className="block text-faint">Target</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-content">
                  <span className="grid h-4 w-4 place-items-center rounded bg-overlay font-mono text-[9px] font-semibold text-content/80">
                    {platform.glyph}
                  </span>
                  {platform.label}
                </span>
              </div>
              <div>
                <span className="block text-faint">Permissions</span>
                <span className="mt-1 block">
                  <RiskBadge risk={risk} />
                </span>
              </div>
              <div>
                <span className="block text-faint">Installed</span>
                <span className="mt-0.5 block text-content">
                  {timeAgo(install.installedAt)}
                </span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {install.hasUpdate ? (
                <Button variant="primary" size="sm" className="flex-1">
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  Update
                </Button>
              ) : (
                <Button
                  variant="subtle"
                  size="sm"
                  className="flex-1 cursor-default"
                  disabled
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Up to date
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings2 className="h-3.5 w-3.5" />
                Configure
              </Button>
              <Button variant="danger" size="icon" title="Uninstall">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

function FavoritesSection() {
  const favorites = getFavoriteAgents();

  if (favorites.length === 0) {
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

  return <AgentGrid agents={favorites} columns={3} />;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

function CollectionsSection() {
  const curated = getCollectionsByCurator(CURRENT_USERNAME);
  // Followed collections: a couple curated by others (mock).
  const followed = collections
    .filter((c) => c.curatorUsername !== CURRENT_USERNAME)
    .slice(0, 3);

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
            <Sparkles className="h-4 w-4 text-brand-muted" />
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
