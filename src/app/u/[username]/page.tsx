import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  creators,
  getAgentsByCreator,
  getCollectionsByCurator,
  getCreatorStats,
} from "@/lib/data";
import type { Review } from "@/lib/types";
import {
  getProfileByUsername,
  isFollowing,
  type PublicProfile,
} from "@/lib/profile";
import { getSessionUser, AUTH_MODE } from "@/lib/session";
import { formatCompact, formatDate } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { CollectionCard } from "@/components/cards";
import { ReviewCard } from "@/components/review-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs } from "@/components/ui/tabs";
import {
  Boxes,
  Download,
  Folder,
  Github,
  Globe,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Star,
  Users,
} from "lucide-react";
import { FollowButton } from "./follow-button";
import { ActivityTimeline } from "./activity-timeline";

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
    return { title: "Creator not found · AgentDock" };
  }
  return {
    title: `${creator.name} (@${creator.username}) · AgentDock`,
    description: creator.bio,
  };
}

// --- Reviews received -------------------------------------------------------

interface ReceivedReview {
  review: Review;
  agentName: string;
  agentSlug: string;
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

  const agents = getAgentsByCreator(username);
  const collections = getCollectionsByCurator(username);
  const stats = getCreatorStats(username);

  // Flatten reviews received across all of this creator's packages.
  const receivedReviews: ReceivedReview[] = agents
    .flatMap((a) =>
      a.reviews.map((review) => ({
        review,
        agentName: a.name,
        agentSlug: a.slug,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.review.createdAt).getTime() -
        new Date(a.review.createdAt).getTime()
    );

  const statRow = [
    {
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
      label: "Agents",
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
      id: "collections",
      label: "Collections",
      count: collections.length,
      icon: <Layers className="h-4 w-4" />,
      content:
        collections.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <CollectionCard key={c.slug} collection={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Folder className="h-5 w-5" />}
            title="No collections yet"
            description={`${creator.name} hasn't curated any collections yet.`}
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
    {
      id: "reviews",
      label: "Reviews",
      count: receivedReviews.length,
      icon: <MessageSquare className="h-4 w-4" />,
      content:
        receivedReviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {receivedReviews.map(({ review, agentName, agentSlug }) => (
              <div key={review.id} className="flex flex-col gap-2">
                <Link
                  href={`/agents/${agentSlug}`}
                  className="inline-flex w-fit items-center gap-1.5 text-2xs font-medium text-subtle transition-colors hover:text-content"
                >
                  <Package className="h-3 w-3" />
                  on {agentName}
                </Link>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No reviews yet"
            description={`No one has reviewed ${creator.name}'s packages yet.`}
          />
        ),
    },
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
}: {
  creator: PublicProfile;
  statRow: { label: string; value: string; icon: React.ReactNode }[];
  totalStars: number;
  avgRating: number;
  isOwner: boolean;
  following: boolean;
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
              followers={creator.followers}
              initialFollowing={following}
              canFollow={creator.isDbUser && AUTH_MODE === "oauth"}
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
        {statRow.map((s) => (
          <div key={s.label} className="bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">{s.label}</span>
              <span className="text-subtle">{s.icon}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-content tabular-nums">
                {s.value}
              </span>
              {s.label === "Avg rating" && avgRating > 0 && (
                <RatingStars rating={avgRating} size="sm" />
              )}
              {s.label === "Installs" && (
                <span className="text-2xs text-faint tabular-nums">
                  {formatCompact(totalStars)} stars
                </span>
              )}
            </div>
          </div>
        ))}
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
