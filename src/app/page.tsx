import { createClient } from "@supabase/supabase-js";
import { AppShell } from "@/components/app-shell";
import { CATEGORIES } from "@/lib/taxonomy";
import { catalogCategoryCounts } from "@/lib/skill-classification";
import { HomeSpotlight } from "./home-spotlight";
import { TrendingNow, NewlyUploaded } from "./home-rows";
import { ButtonLink } from "@/components/ui/button";
import { TypewriterHero } from "@/components/typewriter-hero";
import Link from "next/link";
import {
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
  Megaphone,
  ArrowRight,
  Upload,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Category } from "@/lib/types";

const CATEGORY_ICON: Record<Category, ReactNode> = {
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
  marketing: <Megaphone className="h-4 w-4" />,
};

// Re-fetch at most hourly — category tiles don't need per-request freshness.
export const revalidate = 3600;

// Pull the real skill catalogue server-side so the category tiles reflect the
// full DB (classified via curated map → heuristic), not just the curated map.
// Falls back to the curated-map counts when Supabase isn't configured.
async function getCategoryCounts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return catalogCategoryCounts();

  try {
    const supabase = createClient(url, key);
    const rows: { name: string; description: string | null; tags: string[] }[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("skills")
        .select("name, description, tags")
        .range(from, from + PAGE - 1);
      if (error) break;
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    return rows.length ? catalogCategoryCounts(rows) : catalogCategoryCounts();
  } catch {
    return catalogCategoryCounts();
  }
}

export default async function HomePage() {
  // Counts reflect the real classified marketplace catalogue (skills + MCP
  // servers), so the tiles match what /explore?category=… actually shows.
  const countMap = await getCategoryCounts();
  const categories = CATEGORIES.map((c) => ({
    category: c.value,
    label: c.label,
    count: countMap[c.value] ?? 0,
  }));

  return (
    <AppShell fullWidth>
      {/* Typewriter hero — headline types itself in above everything else */}
      <section className="mx-auto w-full max-w-site px-4 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-32 lg:pt-36">
        <TypewriterHero />
      </section>

      {/* Featured spotlight — wider breakout (~1.4x the content width) */}
      <section className="mx-auto w-full max-w-[1792px] px-4 sm:px-6">
        <HomeSpotlight />
      </section>

      <div className="mx-auto w-full max-w-[1792px] px-4 sm:px-6">
        {/* Trending Now placeholder row */}
        <TrendingNow />

        {/* Popular categories */}
        <section className="py-12">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

        {/* Newly Uploaded placeholder row */}
        <NewlyUploaded />

        {/* Quick actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pb-16 pt-10">
          <ButtonLink
            href="/explore"
            variant="primary"
            size="lg"
            className="h-14 gap-2.5 px-8 text-base"
          >
            Explore more
            <ArrowRight className="h-5 w-5" />
          </ButtonLink>
          <ButtonLink
            href="/publish"
            variant="outline"
            size="lg"
            className="h-14 gap-2.5 px-8 text-base"
          >
            <Upload className="h-5 w-5" />
            Upload
          </ButtonLink>
          <ButtonLink
            href="/docs"
            variant="outline"
            size="lg"
            className="h-14 gap-2.5 px-8 text-base"
          >
            <BookOpen className="h-5 w-5" />
            Docs
          </ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
