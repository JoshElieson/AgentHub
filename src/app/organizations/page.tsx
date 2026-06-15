import type { Metadata } from "next";
import { AppShell, SectionHeader } from "@/components/app-shell";
import { OrgCard } from "@/components/cards";
import { organizations, getOrgStats, SITE_STATS } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/utils";
import { InlineStat } from "@/components/ui/stat-card";
import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Organizations · AgentDock",
  description:
    "Verified publishers shipping trusted agents, skills, and MCP servers on AgentDock.",
};

export default function OrganizationsPage() {
  const orgs = [...organizations].sort(
    (a, b) => getOrgStats(b.slug).totalInstalls - getOrgStats(a.slug).totalInstalls
  );

  const totalPackages = orgs.reduce(
    (sum, o) => sum + getOrgStats(o.slug).totalAgents,
    0
  );
  const totalInstalls = orgs.reduce(
    (sum, o) => sum + getOrgStats(o.slug).totalInstalls,
    0
  );

  return (
    <AppShell>
      <div className="py-8 sm:py-10">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-muted" /> Organizations
            </span>
          }
          description="Verified publishers shipping trusted agents."
        />

        {/* Intro */}
        <div className="mt-5 flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            <span className="inline-flex items-center gap-1 align-middle font-medium text-info">
              <BadgeCheck className="h-4 w-4" strokeWidth={2.25} /> Verified
            </span>{" "}
            organizations are publishers with confirmed ownership of their domain
            and source. Their packages are signed, security-reviewed, and
            maintained by the teams behind them — the safest place to start.
          </p>
          <div className="flex shrink-0 items-center gap-6 border-line sm:border-l sm:pl-6">
            <InlineStat
              value={formatNumber(totalPackages)}
              label="Packages"
            />
            <InlineStat
              value={formatCompact(totalInstalls)}
              label="Installs"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {orgs.map((org) => (
            <OrgCard key={org.slug} org={org} />
          ))}
        </div>

        {/* Footnote */}
        <p className="mt-8 flex items-center gap-2 text-xs text-subtle">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Want to publish as an organization? Verified status requires domain and
          source confirmation. {formatCompact(SITE_STATS.installs)}+ installs trust
          AgentDock.
        </p>
      </div>
    </AppShell>
  );
}
