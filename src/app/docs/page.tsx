import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CommandBlock } from "@/components/ui/command-block";
import { Badge } from "@/components/ui/badge";
import { DocsShell } from "./docs-shell";
import { DOCS } from "./_content";
import { ArrowRight, BookOpen, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation — Nuclexa",
  description:
    "Learn the Nuclexa package format, manifest, permission model, publishing, installing, and CLI.",
};

export default function DocsIndexPage() {
  return (
    <AppShell fullWidth>
      <DocsShell>
        {/* Hero intro */}
        <section className="animate-fade-in">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-brand-line bg-brand-dim px-2.5 py-1 text-2xs font-semibold text-brand-muted">
            <BookOpen className="h-3 w-3" />
            Documentation
          </div>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
            Build, publish, and install AI agents.
          </h1>
          <p className="mt-3 max-w-2xl text-balance text-base text-muted">
            Everything you need to package an AI capability, declare its
            permissions, publish it to the registry, and install it to any
            platform. Start with the basics or jump straight to a reference.
          </p>

          {/* Quickstart */}
          <div className="mt-6 max-w-xl">
            <CommandBlock
              label="Quickstart — install your first package"
              command="npx nuclexa install security-review"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/what-is-nuclexa"
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand px-4 py-2 text-sm font-medium text-brand-fg shadow-sm shadow-brand/20 transition-colors hover:bg-brand/90"
            >
              <Compass className="h-4 w-4" />
              Start reading
            </Link>
            <Link
              href="/publish"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm font-medium text-content transition-colors hover:border-line-strong hover:bg-surface-3"
            >
              Publish an agent
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* All docs grid */}
        <section className="mt-12 border-t border-line pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
                All guides
              </h2>
              <p className="mt-1 text-sm text-muted">
                {DOCS.length} docs, in recommended reading order.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOCS.map((doc, i) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="card-interactive group flex flex-col p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="font-mono tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-faint transition-colors group-hover:text-brand-muted" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-content">
                  {doc.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {doc.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </DocsShell>
    </AppShell>
  );
}
