"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronDown } from "lucide-react";
import { DOCS } from "./_content";

/**
 * Two-column docs layout: a sticky left sidebar listing all docs (with active
 * state derived from the current path) and a content column on the right.
 * Client component so it can highlight the active link via usePathname().
 */
export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 sm:py-10">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-20">
            <Link
              href="/docs"
              className={cn(
                "mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                pathname === "/docs"
                  ? "border-brand-line bg-brand-dim text-brand-muted"
                  : "border-line text-content hover:border-line-strong hover:bg-surface-2"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </Link>

            <nav aria-label="Docs navigation">
              <details open className="[&[open]>summary_.docs-nav-chevron]:rotate-180">
                <summary className="flex cursor-pointer list-none items-center justify-between px-3 pb-2 pt-3 text-2xs font-semibold uppercase tracking-wide text-faint lg:pointer-events-none [&::-webkit-details-marker]:hidden lg:[&>.docs-nav-chevron]:hidden">
                  Guides
                  <ChevronDown className="docs-nav-chevron h-3.5 w-3.5 transition-transform lg:hidden" />
                </summary>
                <ul className="space-y-0.5">
                {DOCS.map((doc, i) => {
                  const href = `/docs/${doc.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={doc.slug}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-surface-2 font-medium text-content"
                            : "text-muted hover:bg-surface-2/60 hover:text-content"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded font-mono text-2xs tabular-nums",
                            active
                              ? "bg-brand-dim text-brand-muted"
                              : "bg-surface-2 text-subtle"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    </li>
                  );
                })}
                </ul>
              </details>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
