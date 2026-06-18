import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  creators,
  getAgentsByCreator,
  getCreatorStats,
} from "@/lib/data";
import {
  getProfileByUsername,
  isFollowing,
  type PublicProfile,
} from "@/lib/profile";
import { getSessionUser } from "@/lib/session";
import { formatCompact, formatDate } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";

import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs } from "@/components/ui/tabs";
import {
  Boxes,
  Download,
  Github,
  Globe,
  Layers,
  MapPin,
  Package,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import { FollowButton } from "./follow-button";
import { ActivityTimeline } from "./activity-timeline";
import { InstalledCountValue } from "./installed-count";
import { InstalledTab } from "./profile-collections";

interface PageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return creators.map((c) => ({ username: c.username }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getProfileByUsername(username);
  if (!creator) {
    return { title: "Creator not found · Nuclexa" };
  }
  return {
    title: `${creator.name} (@${creator.username}) · Nuclexa`,
    description: creator.bio,
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { username } = await params;
  const creator = await getProfileByUsername(username);
  if (!creator) notFound();

  const viewer = await getSessionUser();
  const isOwner = viewer?.isAuthenticated === true && viewer.username === creator.username;
  const following =
    !isOwner && creator.isDbUser && creator.id
      ? await isFollowing(creator.id)
      : false;
  // Following persists only for real DB users; viewer must be signed in.
  const canFollow =
    Boolean(viewer?.isAuthenticated) && !isOwner && creator.isDbUser;

  const agents = getAgentsByCreator(username);
  const stats = getCreatorStats(username);

  const statRow = [
    // On your own profile, "Installed" reflects the packages you've actually
    // installed (real per-user tracking). For visitors we keep the creator's
    // published-install popularity, which is the meaningful public number.
    isOwner
      ? {
          label: "Installed",
          value: "—",
          icon: <Download className="h-4 w-4" />,
          ownerInstalled: true,
        }
      : {
          label: "Installs",
          value: formatCompact(stats.totalInstalls),
          icon: <Download className="h-4 w-4" />,
        },
    {
      label: "Packages",
      value: formatCompact(stats.totalAgents),
      icon: <Package className="h-4 w-4" />,
    },
    {
      label: "Followers",
      value: formatCompact(creator.followers),
      icon: <Users className="h-4 w-4" />,
      href: `/u/${creator.username}/followers`,
    },
    {
      label: "Avg rating",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—",
      icon: <Star className="h-4 w-4" />,
    },
  ];

  const tabs = [
    {
      id: "agents",
      label: "Published",
      count: agents.length,
      icon: <Boxes className="h-4 w-4" />,
      content:
        agents.length > 0 ? (
          <AgentGrid agents={agents} columns={3} />
        ) : (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="No packages yet"
            description={`${creator.name} hasn't published any agents, skills, or servers yet.`}
          />
        ),
    },

    {
      id: "activity",
      label: "Activity",
      icon: <Layers className="h-4 w-4" />,
      content: (
        <ActivityTimeline
          agents={agents}
          creatorName={creator.name}
          avatarColor={creator.avatarColor}
        />
      ),
    },
    // Installed reflects the viewer's own per-user data, so it's only shown on
    // your own profile. Published and Activity stay public.
    ...(isOwner
      ? [
          {
            id: "installed",
            label: "Installed",
            icon: <Download className="h-4 w-4" />,
            content: <InstalledTab />,
          },
        ]
      : []),
  ];

  return (
    <AppShell>
      <div className="py-8 sm:py-10">
        {/* Profile header */}
        <ProfileHeader
          creator={creator}
          statRow={statRow}
          totalStars={stats.totalStars}
          avgRating={stats.avgRating}
          isOwner={isOwner}
          following={following}
          canFollow={canFollow}
        />

        {/* Tabs */}
        <ProfileTabs tabs={tabs} />
      </div>
    </AppShell>
  );
}

// --- Header (server-rendered) ----------------------------------------------

function ProfileHeader({
  creator,
  statRow,
  totalStars,
  avgRating,
  isOwner,
  following,
  canFollow,
}: {
  creator: PublicProfile;
  statRow: {
    label: string;
    value: string;
    icon: React.ReactNode;
    ownerInstalled?: boolean;
  }[];
  totalStars: number;
  avgRating: number;
  isOwner: boolean;
  following: boolean;
  canFollow: boolean;
}) {
  return (
    <header className="card relative overflow-hidden p-5 sm:p-7">
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
        <Avatar
          name={creator.name}
          color={creator.avatarColor}
          image={creator.image}
          size="2xl"
          className="ring-2 ring-line"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-content">
              {creator.name}
            </h1>
            {creator.isVerified && <VerifiedBadge />}
          </div>
          <div className="mt-0.5 font-mono text-sm text-subtle">
            @{creator.username}
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            {creator.bio}
          </p>

          {/* Meta row: location, links, joined */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-subtle">
            {creator.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {creator.location}
              </span>
            )}
            {creator.website && (
              <a
                href={creator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-brand-muted transition-colors hover:text-brand"
              >
                <Globe className="h-3.5 w-3.5" />
                {creator.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {creator.github && (
              <a
                href={`https://github.com/${creator.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-content"
              >
                <Github className="h-3.5 w-3.5" />
                {creator.github}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              Joined {formatDate(creator.joinedAt)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          {isOwner ? (
            <ButtonLink
              href="/dashboard?section=settings"
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </ButtonLink>
          ) : (
            <FollowButton
              username={creator.username}
              initialFollowing={following}
              canFollow={canFollow}
            />
          )}
          {creator.website && (
            <ButtonLink
              href={creator.website}
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
            >
              <Globe className="h-4 w-4" />
              Visit website
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Stat row */}
      <div className="relative mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
        {statRow.map((s) => {
          const href = "href" in s ? s.href : undefined;
          const inner = (
            <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted group-hover:text-content">
                {s.label}
              </span>
              <span className="text-subtle">{s.icon}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-content tabular-nums">
                {s.ownerInstalled ? <InstalledCountValue /> : s.value}
              </span>
              {s.label === "Avg rating" && avgRating > 0 && (
                <RatingStars rating={avgRating} size="sm" />
              )}
              {s.label === "Installs" && (
                <span className="text-2xs text-faint tabular-nums">
                  {formatCompact(totalStars)} likes
                </span>
              )}
              {s.ownerInstalled && (
                <span className="text-2xs text-faint">skills & servers</span>
              )}
            </div>
            </>
          );
          return href ? (
            <Link
              key={s.label}
              href={href}
              className="group bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="bg-surface p-4">
              {inner}
            </div>
          );
        })}
      </div>
    </header>
  );
}

// --- Tabs wrapper -----------------------------------------------------------
// Tabs is a client component; this server module passes server-built ReactNode
// `content` into it, which Next renders fine.

function ProfileTabs({
  tabs,
}: {
  tabs: React.ComponentProps<typeof Tabs>["tabs"];
}) {
  return <Tabs tabs={tabs} className="mt-8" />;
}
