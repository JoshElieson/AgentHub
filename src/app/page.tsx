import { AppShell, SectionHeader } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { SearchBar } from "@/components/search-bar";
import { InlineStat } from "@/components/ui/stat-card";
import { ButtonLink } from "@/components/ui/button";
import { CollectionCard } from "@/components/cards";
import {
  SITE_STATS,
  getTrending,
  getPopularForPlatform,
  getMcpServers,
  getByCategory,
  getDesignAndFrontend,
  getCategoryCounts,
  collections,
} from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/utils";
import { PLATFORMS } from "@/lib/taxonomy";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Boxes,
  GitBranch,
  TerminalSquare,
  Code2,
  Shield,
  Server,
  FlaskConical,
  Palette,
  PenLine,
  BarChart3,
  Zap,
  GraduationCap,
  Sparkles,
  MousePointerClick,
  Plug,
} from "lucide-react";
import type { Category } from "@/lib/types";

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  development: <Code2 className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  devops: <Server className="h-4 w-4" />,
  research: <FlaskConical className="h-4 w-4" />,
  design: <Palette className="h-4 w-4" />,
  writing: <PenLine className="h-4 w-4" />,
  "data-science": <BarChart3 className="h-4 w-4" />,
  productivity: <Zap className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  "browser-automation": <MousePointerClick className="h-4 w-4" />,
  integrations: <Plug className="h-4 w-4" />,
};

const WHY = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Trust by default",
    body: "Every package shows its permission scope, risk level, license, and source. Security-reviewed and verified badges tell you what's safe to run.",
  },
  {
    icon: <Boxes className="h-5 w-5" />,
    title: "Every platform, one registry",
    body: "Claude Code, Claude Desktop, Cursor, Windsurf, OpenAI Agents, Gemini CLI, GitHub Copilot, Replit, and any MCP client. Publish once, install anywhere.",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Versioned & reproducible",
    body: "Semver, changelogs, and pinned installs. Roll forward or back with a single command — no more copy-pasting prompts.",
  },
  {
    icon: <TerminalSquare className="h-5 w-5" />,
    title: "One command to install",
    body: "npx agentdock install <package> — to Claude, Cursor, Gemini, or an MCP client, or exported for Copilot and OpenAI Agents.",
  },
];

export default function HomePage() {
  const trending = getTrending(6);
  const popularClaudeCode = getPopularForPlatform("claude-code", 4);
  const popularCursor = getPopularForPlatform("cursor", 4);
  const mcpServers = getMcpServers(4);
  const security = getByCategory("security", 4);
  const designFrontend = getDesignAndFrontend(4);
  const categories = getCategoryCounts();
  const featuredCollections = collections.slice(0, 3);

  return (
    <AppShell fullWidth>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-brand-glow" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-grid" />
        <div className="relative mx-auto max-w-site px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link
              href="/docs/what-is-agentdock"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2/60 py-1 pl-1.5 pr-3 text-xs text-muted backdrop-blur transition-colors hover:border-line-strong hover:text-content"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-dim px-2 py-0.5 text-2xs font-semibold text-brand-muted">
                <Sparkles className="h-3 w-3" /> New
              </span>
              The package registry for AI agents and installable AI capabilities
              <ArrowRight className="h-3 w-3" />
            </Link>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-content sm:text-5xl md:text-6xl">
              Discover, install, and share{" "}
              <span className="text-gradient">AI agents.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-muted sm:text-lg">
              The open package registry for AI agents, skills, MCP servers,
              workflows, rules, and prompt packs.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <SearchBar
                variant="hero"
                placeholder="Search agents, skills, MCP servers, rules…"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/explore" variant="primary" size="lg">
                Explore packages
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/publish" variant="secondary" size="lg">
                Publish a package
              </ButtonLink>
            </div>

            {/* Platform strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-subtle">
              <span className="text-faint">Works with</span>
              {PLATFORMS.map((p) => (
                <span key={p.value} className="font-medium text-muted">
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-line pt-8">
            <InlineStat
              value={formatNumber(SITE_STATS.agents)}
              label="Packages"
              className="items-center text-center"
            />
            <InlineStat
              value={formatNumber(SITE_STATS.creators)}
              label="Creators"
              className="items-center text-center"
            />
            <InlineStat
              value={formatCompact(SITE_STATS.installs)}
              label="Installs"
              className="items-center text-center"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-site px-4 sm:px-6">
        {/* Trending across all platforms */}
        <section className="py-12">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-warning" /> Trending across all
                platforms
              </span>
            }
            description="The packages developers are installing right now."
            action={
              <Link
                href="/explore?sort=trending"
                className="hidden items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand sm:inline-flex"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <AgentGrid agents={trending} className="mt-6" columns={3} />
        </section>

        {/* Popular for Claude Code */}
        <Rail
          title="Popular for Claude Code"
          description="Agents and skills the Claude Code community relies on."
          href="/explore?platform=claude-code"
          agents={popularClaudeCode}
        />

        {/* Popular for Cursor */}
        <Rail
          title="Popular for Cursor"
          description="Rules and agents that level up your Cursor editor."
          href="/explore?platform=cursor"
          agents={popularCursor}
        />

        {/* MCP servers developers trust */}
        <Rail
          title="MCP servers developers trust"
          description="Connect any MCP-compatible client to the real world."
          href="/explore?platform=mcp"
          agents={mcpServers}
        />

        {/* Security agents */}
        <Rail
          title="Security agents"
          description="Audit code, scan agents, and red-team your prompts."
          href="/explore?category=security"
          agents={security}
        />

        {/* Design and frontend agents */}
        <Rail
          title="Design and frontend agents"
          description="Ship polished, accessible UI with reviewers and rules."
          href="/explore?category=design"
          agents={designFrontend}
        />

        {/* Popular categories */}
        <section className="py-6">
          <SectionHeader
            title="Popular categories"
            description="Browse by what you're trying to build."
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/explore?category=${c.category}`}
                className="card-interactive flex items-center gap-3 p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-brand-muted">
                  {CATEGORY_ICON[c.category]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-content">
                    {c.label}
                  </span>
                  <span className="block text-xs text-subtle">
                    {c.count} {c.count === 1 ? "package" : "packages"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured collections */}
        <section className="py-12">
          <SectionHeader
            title="Curated collections"
            description="Hand-picked stacks to get you productive fast."
            action={
              <Link
                href="/collections"
                className="hidden items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand sm:inline-flex"
              >
                All collections <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCollections.map((c) => (
              <CollectionCard key={c.slug} collection={c} />
            ))}
          </div>
        </section>

        {/* Why AgentDock */}
        <section className="py-6">
          <SectionHeader
            title="Why AgentDock exists"
            description="Installable AI capabilities deserve real infrastructure — not a pile of gists."
          />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="card p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line bg-brand-dim text-brand-muted">
                  {w.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-content">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-12">
          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-brand-glow opacity-70" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-content">
                  Ship your first package today.
                </h2>
                <p className="mt-2 max-w-lg text-muted">
                  Publish an agent, skill, MCP server, rule, or workflow in
                  minutes. Versioned, permission-scoped, and installable
                  everywhere.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <ButtonLink href="/publish" variant="primary" size="lg">
                  Publish a package
                </ButtonLink>
                <ButtonLink href="/docs" variant="secondary" size="lg">
                  Read the docs
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/** A single featured rail of up to four packages. */
function Rail({
  title,
  description,
  href,
  agents,
}: {
  title: string;
  description: string;
  href: string;
  agents: React.ComponentProps<typeof AgentGrid>["agents"];
}) {
  if (agents.length === 0) return null;
  return (
    <section className="py-6">
      <SectionHeader
        title={title}
        description={description}
        action={
          <Link
            href={href}
            className="hidden items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand sm:inline-flex"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <AgentGrid agents={agents} className="mt-6" columns={4} />
    </section>
  );
}
