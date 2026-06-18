import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Bundles", href: "/collections" },
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
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-[1792px] px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted">
              The package registry for AI agents. Discover, install, and share
              agents, skills, MCP servers, and workflows.
            </p>
            <p className="mt-4 text-xs text-subtle">
              © 2026 Nuclexa. The package registry for AI agents.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-16 gap-y-8 sm:flex-nowrap">
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
        </div>
      </div>
    </footer>
  );
}
