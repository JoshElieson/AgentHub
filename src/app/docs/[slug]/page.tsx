import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MarkdownPanel } from "@/components/markdown-panel";
import { DocsShell } from "../docs-shell";
import { DOCS, getDoc, getDocNeighbors } from "../_content";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return DOCS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) {
    return { title: "Not found — AgentDock Docs" };
  }
  return {
    title: `${doc.title} — AgentDock Docs`,
    description: doc.description,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const { prev, next } = getDocNeighbors(slug);

  return (
    <AppShell fullWidth>
      <DocsShell>
        <article className="animate-fade-in">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-subtle">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1 transition-colors hover:text-content"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </Link>
            <span className="text-faint">/</span>
            <span className="text-muted">{doc.title}</span>
          </nav>

          {/* Title block */}
          <header className="mt-3 border-b border-line pb-6">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-content sm:text-4xl">
              {doc.title}
            </h1>
            <p className="mt-2 max-w-2xl text-balance text-base text-muted">
              {doc.description}
            </p>
          </header>

          {/* Body */}
          <MarkdownPanel content={doc.body} className="mt-6" />

          {/* Prev / next navigation */}
          <nav className="mt-12 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/docs/${prev.slug}`}
                className="card-interactive group flex flex-col p-4 sm:items-start"
              >
                <span className="inline-flex items-center gap-1 text-xs text-subtle">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </span>
                <span className="mt-1 text-sm font-medium text-content transition-colors group-hover:text-brand-muted">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}

            {next && (
              <Link
                href={`/docs/${next.slug}`}
                className="card-interactive group flex flex-col p-4 sm:items-end sm:text-right"
              >
                <span className="inline-flex items-center gap-1 text-xs text-subtle">
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 text-sm font-medium text-content transition-colors group-hover:text-brand-muted">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        </article>
      </DocsShell>
    </AppShell>
  );
}
