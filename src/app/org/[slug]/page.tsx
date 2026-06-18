import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  organizations,
  getOrganization,
  getAgentsByOrg,
  getOrgStats,
} from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";

import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCompact, formatDate, formatNumber } from "@/lib/utils";
import { ActivityTimeline } from "./activity-timeline";
import {
  CalendarDays,
  Download,
  Github,
  Globe,
  Layers,
  MapPin,
  Package,
  Star,
  Users,
} from "lucide-react";

export function generateStaticParams() {
  return organizations.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = getOrganization(slug);
  if (!org) return { title: "Organization not found · Nuclexa" };
  return {
    title: `${org.name} · Nuclexa`,
    description: org.description,
  };
}

export default async function OrgProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = getOrganization(slug);
  if (!org) notFound();

  const agents = getAgentsByOrg(slug);
  const stats = getOrgStats(slug);


  const tabs = [
    {
      id: "agents",
      label: "Agents",
      count: agents.length,
      icon: <Package className="h-4 w-4" />,
      content:
        agents.length > 0 ? (
          <AgentGrid agents={agents} columns={3} />
        ) : (
          <EmptyState
            icon={<Package className="h-5 w-5" />}
            title="No packages yet"
            description={`${org.name} hasn't published any agents to Nuclexa yet.`}
          />
        ),
    },

    {
      id: "activity",
      label: "Activity",
      icon: <CalendarDays className="h-4 w-4" />,
      content: (
        <ActivityTimeline
          agents={agents}
          orgName={org.name}
          orgColor={org.avatarColor}
        />
      ),
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="relative overflow-hidden border-b border-line">
        <div className="relative py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={org.name} color={org.avatarColor} size="2xl" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
                  {org.name}
                </h1>
                {org.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-info/30 bg-info-dim px-2 py-0.5 text-2xs font-medium text-info">
                    <VerifiedBadge label="Verified organization" />
                    Verified org
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                {org.description}
              </p>

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-content"
                  >
                    <Globe className="h-4 w-4" />
                    {org.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {org.github && (
                  <a
                    href={`https://github.com/${org.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-content"
                  >
                    <Github className="h-4 w-4" />
                    {org.github}
                  </a>
                )}
                {org.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {org.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {formatNumber(org.members)} members
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Star className="h-4 w-4" />
                  {formatCompact(org.followers)} followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Joined {formatDate(org.joinedAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              <ButtonLink href="/organizations" variant="outline" size="md">
                All orgs
              </ButtonLink>
              {org.website && (
                <ButtonLink href={org.website} variant="primary" size="md">
                  Visit site
                </ButtonLink>
              )}
            </div>
          </div>

          {/* Stat row */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Packages"
              value={formatNumber(stats.totalAgents)}
              icon={<Package className="h-4 w-4" />}
            />
            <StatCard
              label="Total installs"
              value={formatCompact(stats.totalInstalls)}
              icon={<Download className="h-4 w-4" />}
            />
            <StatCard
              label="Followers"
              value={formatCompact(org.followers)}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="Avg rating"
              value={
                stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"
              }
              icon={<Star className="h-4 w-4" />}
              hint={
                stats.avgRating > 0 ? (
                  <RatingStars rating={stats.avgRating} size="sm" />
                ) : (
                  "No ratings yet"
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="py-8 sm:py-10">
        <Tabs tabs={tabs} defaultTab="agents" />
      </div>

      {/* Footer note */}
      <p className="pb-10 text-xs text-subtle">
        Looking for individual maintainers?{" "}
        <Link
          href="/organizations"
          className="font-medium text-brand-muted hover:text-brand"
        >
          Browse all organizations
        </Link>
        .
      </p>
    </AppShell>
  );
}
