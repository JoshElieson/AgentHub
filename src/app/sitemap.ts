import type { MetadataRoute } from "next";
import { agents, creators, organizations } from "@/lib/data";

const BASE = "https://nuclexa.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/explore",
    "/collections",
    "/publish",
    "/docs",
    "/dashboard",
    "/login",
  ].map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  const agentRoutes = agents.map((a) => ({
    url: `${BASE}/agents/${a.slug}`,
    lastModified: new Date(a.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const creatorRoutes = creators.map((c) => ({
    url: `${BASE}/u/${c.username}`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  const orgRoutes = organizations.map((o) => ({
    url: `${BASE}/org/${o.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));


  return [...staticRoutes, ...agentRoutes, ...creatorRoutes, ...orgRoutes];
}
