import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import {
  LicenseBadge,
  RiskBadge,
  SecurityReviewedBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { InstallButton } from "@/components/install-modal";
import { LikeButton } from "@/components/like-button";
import { SaveButton } from "@/components/save-button";
import { PackageTree } from "@/components/package-tree";
import { VersionList } from "@/components/version-list";
import { ReviewCard, RatingBreakdown } from "@/components/review-card";
import { IssueList } from "@/components/issue-list";
import { DiscussionList } from "@/components/discussion-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, type TabDef } from "@/components/ui/tabs";

import {
  agents,
  getAgent,
  getCreator,
  getOrganization,
} from "@/lib/data";
import { aggregateRisk, PRICING_LABELS } from "@/lib/taxonomy";
import { formatCompact, formatNumber, timeAgo } from "@/lib/utils";

import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Folder,
  GitBranch,
  Globe,
  Info,
  MessageSquare,
  MessagesSquare,
  Package,
  Star,
  Tag,
  ThumbsUp,
} from "lucide-react";

import { OverviewTab } from "./overview-tab";

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) {
    return { title: "Package not found · AgentDock" };
  }
  return {
    title: `${agent.name} · AgentDock`,
    description: agent.shortDescription,
  };
}

// ---------------------------------------------------------------------------
// Sidebar metadata row helper
// ---------------------------------------------------------------------------

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-xs text-subtle">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-right text-xs font-medium text-content">
        {children}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  const creator = getCreator(agent.creatorUsername);
  const org = agent.orgSlug ? getOrganization(agent.orgSlug) : undefined;
  const risk = aggregateRisk(agent.permissions);

  const fileCount = agent.files.filter((f) => f.type === "file").length;
  const openIssues = agent.issues.filter((i) => i.state === "open").length;
  const latest =
    agent.versions.find((v) => v.isLatest) ?? agent.versions[0];

  // --- Tab definitions ------------------------------------------------------
  const tabs: TabDef[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <BookOpen className="h-4 w-4" />,
      content: <OverviewTab agent={agent} />,
    },
    {
      id: "files",
      label: "Files",
      icon: <Folder className="h-4 w-4" />,
      count: fileCount,
      content:
        agent.files.length > 0 ? (
          <PackageTree files={agent.files} />
        ) : (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="No files published"
            description="This package has not published a browsable file tree yet."
          />
        ),
    },
    {
      id: "versions",
      label: "Versions",
      icon: <Tag className="h-4 w-4" />,
      count: agent.versions.length,
      content: (
        <VersionList versions={agent.versions} packageId={agent.packageId} />
      ),
    },
    {
      id: "details",
      label: "Details",
      icon: <Info className="h-4 w-4" />,
      content: (
        <div className="card max-w-xl p-4">
          <h3 className="text-sm font-semibold text-content">Details</h3>
          <div className="mt-1 divide-y divide-line">
            <MetaRow
              icon={<Tag className="h-3.5 w-3.5" />}
              label="Latest version"
            >
              <span className="font-mono text-brand-muted">
                v{latest?.version ?? agent.version}
              </span>
            </MetaRow>
            <MetaRow
              icon={<FileText className="h-3.5 w-3.5" />}
              label="License"
            >
              {agent.license === "Unknown" ? "No license" : agent.license}
            </MetaRow>
            <MetaRow
              icon={<Package className="h-3.5 w-3.5" />}
              label="Package"
            >
              <span className="font-mono">{agent.packageId}</span>
            </MetaRow>
            {agent.sourceRepo && (
              <MetaRow
                icon={<GitBranch className="h-3.5 w-3.5" />}
                label="Source"
              >
                <a
                  href={agent.sourceRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-muted hover:text-brand"
                >
                  Repository
                  <ExternalLink className="h-3 w-3" />
                </a>
              </MetaRow>
            )}
            {(agent.website || agent.homepage) && (
              <MetaRow
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Homepage"
              >
                <a
                  href={agent.homepage ?? agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-muted hover:text-brand"
                >
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </MetaRow>
            )}
            <MetaRow
              icon={<Download className="h-3.5 w-3.5" />}
              label="Weekly installs"
            >
              <span className="tabular-nums">
                {formatNumber(agent.weeklyInstalls)}
              </span>
            </MetaRow>
            <MetaRow
              icon={<Star className="h-3.5 w-3.5" />}
              label="Updated"
            >
              {timeAgo(agent.updatedAt)}
            </MetaRow>
          </div>
        </div>
      ),
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="h-4 w-4" />,
      count: agent.ratingCount,
      content: (
        <div className="space-y-4">
          <RatingBreakdown
            ratingAvg={agent.ratingAvg}
            ratingCount={agent.ratingCount}
          />
          {agent.reviews.length > 0 ? (
            <div className="space-y-3">
              {agent.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star className="h-5 w-5" />}
              title="No written reviews yet"
              description="Be the first to share how this package worked for you."
            />
          )}
        </div>
      ),
    },
    {
      id: "issues",
      label: "Issues",
      icon: <MessageSquare className="h-4 w-4" />,
      count: openIssues,
      content:
        agent.issues.length > 0 ? (
          <IssueList issues={agent.issues} />
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No open issues"
            description="There are no reported issues for this package."
          />
        ),
    },
    {
      id: "discussions",
      label: "Discussions",
      icon: <MessagesSquare className="h-4 w-4" />,
      count: agent.discussions.length,
      content:
        agent.discussions.length > 0 ? (
          <DiscussionList discussions={agent.discussions} />
        ) : (
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title="No discussions yet"
            description="Start a conversation about how you use this package."
          />
        ),
    },
  ];

  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 pt-6 text-xs text-subtle">
        <Link href="/explore" className="hover:text-content">
          Explore
        </Link>
        <span className="text-faint">/</span>
        <span className="font-mono text-muted">{agent.packageId}</span>
      </nav>

      {/* ---- Header ---------------------------------------------------- */}
      <header className="mt-4 flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar
            name={agent.name}
            color={creator?.avatarColor}
            size="xl"
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
                {agent.name}
              </h1>
              {agent.isVerified && <VerifiedBadge />}
              <TypeBadge type={agent.type} />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>by</span>
              <Link
                href={`/u/${agent.creatorUsername}`}
                className="font-medium text-content hover:text-brand-muted"
              >
                {creator?.name ?? agent.creatorUsername}
              </Link>
              {org && (
                <>
                  <span className="text-faint">·</span>
                  <Link
                    href={`/org/${org.slug}`}
                    className="inline-flex items-center gap-1 font-medium text-content hover:text-brand-muted"
                  >
                    <Avatar
                      name={org.name}
                      color={org.avatarColor}
                      size="xs"
                    />
                    {org.name}
                  </Link>
                </>
              )}
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {agent.shortDescription}
            </p>

            {/* Inline stats */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-subtle">
              <RatingStars
                rating={agent.ratingAvg}
                size="sm"
                showValue
                count={agent.ratingCount}
              />
              <span className="flex items-center gap-1 tabular-nums" title="Installs">
                <Download className="h-3.5 w-3.5" />
                {formatCompact(agent.installCount)} installs
              </span>
              <span className="flex items-center gap-1 tabular-nums" title="Likes">
                <ThumbsUp className="h-3.5 w-3.5" />
                {formatCompact(agent.stars)} likes
              </span>
              <span className="hidden sm:inline">
                Updated {timeAgo(agent.updatedAt)}
              </span>
            </div>

            {/* Trust / meta badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <RiskBadge risk={risk} />
              <LicenseBadge license={agent.license} />
              {agent.isSecurityReviewed && <SecurityReviewedBadge />}
              <Badge variant={agent.pricing === "paid" ? "warning" : "outline"}>
                {agent.pricing === "paid" && agent.price
                  ? agent.price
                  : PRICING_LABELS[agent.pricing]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
          <InstallButton agent={agent} size="lg" className="lg:w-44" />
          <LikeButton count={agent.stars} initial className="lg:h-11" />
          <SaveButton className="lg:h-11" />
        </div>
      </header>

      {/* ---- Body ------------------------------------------------------ */}
      <div className="min-w-0 py-8">
        <Tabs tabs={tabs} />
      </div>
    </AppShell>
  );
}
