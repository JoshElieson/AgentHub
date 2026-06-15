import { AppShell, SectionHeader } from "@/components/app-shell";
import { AgentGrid } from "@/components/agent-grid";
import { ButtonLink } from "@/components/ui/button";
import { CollectionCard } from "@/components/cards";
import {
  getTrending,
  getPopularForPlatform,
  getMcpServers,
  getByCategory,
  getDesignAndFrontend,
  getCategoryCounts,
  collections,
} from "@/lib/data";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Shield,
  Server,
  FlaskConical,
  Palette,
  PenLine,
  BarChart3,
  Zap,
  GraduationCap,
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
      <div className="mx-auto max-w-site px-4 sm:px-6">
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
