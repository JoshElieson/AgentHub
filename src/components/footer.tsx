import Link from "next/link";
import { Logo } from "./logo";
import { Github, Twitter } from "lucide-react";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Collections", href: "/collections" },
      { label: "Organizations", href: "/organizations" },
      { label: "Publish", href: "/publish" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Package format", href: "/docs/package-format" },
      { label: "agent.json", href: "/docs/agent-json" },
      { label: "CLI reference", href: "/docs/cli-reference" },
      { label: "Permissions model", href: "/docs/permissions-model" },
    ],
  },
  {
    title: "Trust & safety",
    links: [
      { label: "Security review", href: "/docs/security-review" },
      { label: "Permissions", href: "/docs/permissions-model" },
      { label: "Compatibility", href: "/docs/platform-compatibility" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { label: "Claude Code", href: "/explore?platform=claude-code" },
      { label: "Cursor", href: "/explore?platform=cursor" },
      { label: "Gemini CLI", href: "/explore?platform=gemini-cli" },
      { label: "GitHub Copilot", href: "/explore?platform=github-copilot" },
      { label: "MCP-compatible", href: "/explore?platform=mcp" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-site px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">
              The package registry for AI agents. Discover, install, and share
              agents, skills, MCP servers, and workflows.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface-2 text-muted transition-colors hover:border-line-strong hover:text-content"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface-2 text-muted transition-colors hover:border-line-strong hover:text-content"
                aria-label="Twitter / X"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-subtle">
                {col.title}
              </h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted transition-colors hover:text-content"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-subtle sm:flex-row sm:items-center">
          <p>© 2026 AgentDock. The package registry for AI agents.</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
