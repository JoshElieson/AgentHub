---
name: nextjs-best-practices
description: Next.js best practices from the Vercel engineering team — covers App Router patterns, server components, data fetching, caching strategies, and performance optimization.
metadata:
  author: Nuclexa
  version: "1.0.0"
---

# Nextjs Best Practices

Next.js best practices from the Vercel engineering team — covers App Router patterns, server components, data fetching, caching strategies, and performance optimization.

# Next.js Best Practices

## App Router Patterns

### Server Components (Default)
- Keep components as Server Components unless they need interactivity
- Use 'use client' only for components that need browser APIs, state, or effects
- Fetch data directly in Server Components (no useEffect)

### Data Fetching
- Use fetch() in Server Components with built-in deduplication
- Leverage generateStaticParams() for static generation
- Use unstable_cache() for expensive computations

### Layouts
- Share UI between routes with layout.tsx
- Layouts don't re-render on navigation
- Use loading.tsx for streaming Suspense boundaries

## Performance
- Use next/image for automatic image optimization
- Implement next/font for zero-layout-shift font loading
- Use dynamic imports for code splitting
- Enable Partial Prerendering (PPR) for hybrid static/dynamic

## Caching
- Full Route Cache for static pages
- Data Cache for fetch results
- Router Cache for client-side navigation
- Use revalidatePath() and revalidateTag() for on-demand revalidation