import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// 55 DIVERSE SKILLS — sourced from official repositories
// ─────────────────────────────────────────────────────────────────────────────

const skills = [

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: AI / ML / LLM
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "mcp-builder",
    description: "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services.",
    trigger_phrases: ["build MCP server", "create MCP server", "MCP integration", "model context protocol"],
    tags: ["mcp", "protocol", "integration", "api", "development"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/mcp-builder",
    markdown_instructions: "# MCP Server Development Guide\\n\\nCreate MCP servers that enable LLMs to interact with external services through well-designed tools.\\n\\n## Four Phases\\n\\n### Phase 1: Deep Research and Planning\\n- Balance API coverage vs. workflow tools\\n- Use clear, descriptive tool names with consistent prefixes\\n- Design concise tool descriptions for agent discoverability\\n- Write actionable error messages that guide toward solutions\\n\\n### Phase 2: Study MCP Protocol Documentation\\nStart with: https://modelcontextprotocol.io/sitemap.xml\\n- Specification overview and architecture\\n- Transport mechanisms (streamable HTTP, stdio)\\n- Tool, resource, and prompt definitions\\n\\n### Phase 3: Framework Selection\\n- **TypeScript**: High-quality SDK support (recommended)\\n- **Python**: FastMCP for rapid development\\n- **Transport**: Streamable HTTP for remote, stdio for local\\n\\n### Phase 4: Implementation\\n- Review service API docs for endpoints, auth, and data models\\n- Implement comprehensive error handling\\n- Add pagination for list operations\\n- Include rate limiting and retry logic",
  },

  {
    name: "prompt-engineering",
    description: "Systematic prompt engineering techniques for LLMs — covers chain-of-thought, few-shot, system prompts, structured output, and evaluation. Use when designing, debugging, or optimizing prompts for AI models.",
    trigger_phrases: ["write prompt", "prompt engineering", "optimize prompt", "chain of thought", "few-shot"],
    tags: ["ai", "llm", "prompt-engineering", "ml"],
    source_url: null,
    markdown_instructions: "# Prompt Engineering Best Practices\\n\\n## Core Techniques\\n\\n### 1. Chain-of-Thought (CoT)\\nAsk the model to reason step-by-step before answering.\\n\\"\`\`\nThink through this step by step:\n1. First, identify...\n2. Then, analyze...\n3. Finally, conclude...\n\`\`\`\n\n### 2. Few-Shot Examples\nProvide 2-3 examples of desired input→output pairs before the actual query.\n\n### 3. System Prompts\n- Define the model's role, constraints, and output format\n- Be specific about what to include AND exclude\n- Set the tone and expertise level\n\n### 4. Structured Output\n- Use JSON schemas for machine-readable output\n- Specify exact field names and types\n- Include validation instructions\n\n## Anti-Patterns\n- Vague instructions ("make it better")\n- Overloading a single prompt with multiple tasks\n- Not specifying output format\n- Ignoring model-specific capabilities\n\n## Evaluation\n- Test with diverse inputs including edge cases\n- Measure consistency across runs\n- Track prompt versions and performance metrics`,
  },

  {
    name: "rag-architecture",
    description: "Design and implement Retrieval-Augmented Generation (RAG) systems — covers embedding strategies, vector databases, chunking, reranking, and hybrid search. Use when building AI systems that need to query external knowledge.",
    trigger_phrases: ["RAG", "retrieval augmented generation", "vector search", "embeddings", "knowledge base"],
    tags: ["ai", "rag", "embeddings", "vector-db", "architecture"],
    source_url: null,
    markdown_instructions: "# RAG Architecture Guide\\n\\n## Pipeline Stages\\n\\n### 1. Document Ingestion\\n- **Chunking**: Split documents into semantic chunks (512-1024 tokens)\\n- **Overlap**: Use 10-20% overlap between chunks for context continuity\\n- **Metadata**: Preserve source, section headers, page numbers\\n\\n### 2. Embedding\\n- Choose embedding model matching your domain (OpenAI, Cohere, Sentence Transformers)\\n- Normalize embeddings for cosine similarity\\n- Batch process for efficiency\\n\\n### 3. Vector Storage\\n- **Pinecone/Weaviate/Qdrant** for managed solutions\\n- **pgvector** for PostgreSQL integration\\n- **FAISS** for local/in-memory search\\n\\n### 4. Retrieval\\n- Top-k retrieval with similarity threshold\\n- Hybrid search: combine vector + keyword (BM25)\\n- Reranking with cross-encoder models\\n\\n### 5. Generation\\n- Inject retrieved chunks into prompt context\\n- Include source citations in output\\n- Handle \"no relevant results\" gracefully\\n\\n## Advanced Patterns\\n- **Multi-hop RAG**: Chain multiple retrievals\\n- **Self-RAG**: Model decides when to retrieve\\n- **Graph RAG**: Combine with knowledge graphs",
  },

  {
    name: "huggingface-model-trainer",
    description: "Train and fine-tune ML models using Hugging Face TRL — covers SFT, DPO, GRPO, LoRA adapters, GGUF conversion, and pushing models to the Hub.",
    trigger_phrases: ["fine-tune model", "train model", "hugging face", "LoRA", "SFT", "DPO"],
    tags: ["ai", "ml", "huggingface", "training", "fine-tuning"],
    source_url: "https://github.com/huggingface/skills/tree/main/skills/hugging-face-model-trainer",
    markdown_instructions: "# Hugging Face Model Training\\n\\n## Training Methods\\n\\n### SFT (Supervised Fine-Tuning)\\n\\"\`\`python\nfrom trl import SFTTrainer\ntrainer = SFTTrainer(\n    model=model,\n    train_dataset=dataset,\n    dataset_text_field="text",\n    max_seq_length=2048,\n)\ntrainer.train()\n\`\`\`\n\n### DPO (Direct Preference Optimization)\nTrain on preference pairs (chosen vs rejected responses).\n\n### LoRA Adapters\n- Use LoRA for parameter-efficient fine-tuning\n- Typical rank: 8-64, alpha: 16-128\n- Target attention layers (q_proj, v_proj)\n\n## Workflow\n1. Prepare dataset in conversational format\n2. Choose base model and training method\n3. Configure hyperparameters\n4. Train with gradient checkpointing for memory efficiency\n5. Evaluate on held-out set\n6. Push to Hub or convert to GGUF for local inference\n\n## Best Practices\n- Start with small learning rate (1e-5 to 5e-5)\n- Use warmup steps (5-10% of total)\n- Monitor loss curves for overfitting\n- Save checkpoints frequently`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: FRONTEND / DESIGN
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "frontend-design",
    description: "Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.",
    trigger_phrases: ["design UI", "frontend design", "visual design", "typography", "UI aesthetics"],
    tags: ["design", "ui", "typography", "frontend", "aesthetics"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
    markdown_instructions: "# Frontend Design\\n\\nApproach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's.\\n\\n## Design Principles\\n\\n**Hero as thesis.** Open with the most characteristic thing in the subject's world.\\n\\n**Typography carries personality.** Pair display and body faces deliberately. Set a clear type scale with intentional weights, widths, and spacing.\\n\\n**Structure is information.** Structural devices should encode something true about the content, not decorate it.\\n\\n**Leverage motion deliberately.** Page-load sequences, scroll-triggered reveals, hover micro-interactions.\\n\\n## Avoiding AI-Template Patterns\\nAI-generated design clusters around three looks:\\n1. Warm cream background with serif display and terracotta accent\\n2. Near-black background with single bright acid-green accent\\n3. Broadsheet layout with hairline rules and newspaper columns\\n\\nReach for these only if they genuinely match the subject.",
  },

  {
    name: "nextjs-best-practices",
    description: "Next.js best practices from the Vercel engineering team — covers App Router patterns, server components, data fetching, caching strategies, and performance optimization.",
    trigger_phrases: ["next.js", "nextjs", "app router", "server components", "next best practices"],
    tags: ["nextjs", "react", "frontend", "vercel", "performance"],
    source_url: "https://github.com/vercel-labs/skills/tree/main/skills/next-best-practices",
    markdown_instructions: "# Next.js Best Practices\\n\\n## App Router Patterns\\n\\n### Server Components (Default)\\n- Keep components as Server Components unless they need interactivity\\n- Use \\"'use client'\` only for components that need browser APIs, state, or effects\n- Fetch data directly in Server Components (no useEffect)\n\n### Data Fetching\n- Use \`fetch()\` in Server Components with built-in deduplication\n- Leverage \`generateStaticParams()\` for static generation\n- Use \`unstable_cache()\` for expensive computations\n\n### Layouts\n- Share UI between routes with \`layout.tsx\`\n- Layouts don't re-render on navigation\n- Use \`loading.tsx\` for streaming Suspense boundaries\n\n## Performance\n- Use \`next/image\` for automatic image optimization\n- Implement \`next/font\` for zero-layout-shift font loading\n- Use dynamic imports for code splitting\n- Enable Partial Prerendering (PPR) for hybrid static/dynamic\n\n## Caching\n- Full Route Cache for static pages\n- Data Cache for fetch results\n- Router Cache for client-side navigation\n- Use \`revalidatePath()\` and \`revalidateTag()\` for on-demand revalidation`,
  },

  {
    name: "react-accessibility",
    description: "WCAG 2.1 AA compliance for React applications — covers semantic HTML, ARIA attributes, keyboard navigation, screen reader testing, focus management, and color contrast.",
    trigger_phrases: ["accessibility", "a11y", "WCAG", "screen reader", "ARIA", "keyboard navigation"],
    tags: ["react", "accessibility", "a11y", "frontend", "wcag"],
    source_url: null,
    markdown_instructions: "# React Accessibility (a11y)\\n\\n## Core Principles\\n\\n### 1. Semantic HTML\\n- Use native HTML elements (\\"<button>\`, \`<nav>\`, \`<main>\`) over \`<div>\`\n- Heading hierarchy: single \`<h1>\`, sequential levels\n- Use \`<fieldset>\` and \`<legend>\` for form groups\n\n### 2. ARIA Attributes\n- \`aria-label\` for elements without visible text\n- \`aria-describedby\` for additional context\n- \`aria-live="polite"\` for dynamic content updates\n- \`role\` only when no native HTML element fits\n\n### 3. Keyboard Navigation\n- All interactive elements must be focusable\n- Logical tab order following visual layout\n- Visible focus indicators (never \`outline: none\`)\n- Trap focus in modals, release on close\n\n### 4. Color & Contrast\n- 4.5:1 ratio for normal text\n- 3:1 ratio for large text (18px+ or 14px+ bold)\n- Never convey information by color alone\n\n### 5. Testing\n- axe DevTools browser extension\n- VoiceOver (Mac), NVDA (Windows)\n- \`jest-axe\` for automated testing\n- Manual keyboard-only navigation test`,
  },

  {
    name: "css-architecture",
    description: "Modern CSS architecture patterns — covers custom properties, container queries, cascade layers, logical properties, and scalable design systems without preprocessors.",
    trigger_phrases: ["CSS architecture", "design tokens", "CSS custom properties", "cascade layers", "container queries"],
    tags: ["css", "frontend", "design-system", "architecture"],
    source_url: null,
    markdown_instructions: "# Modern CSS Architecture\\n\\n## Design Token System\\n\\"\`\`css\n:root {\n  /* Primitive tokens */\n  --color-blue-500: oklch(0.55 0.2 260);\n  \n  /* Semantic tokens */\n  --color-primary: var(--color-blue-500);\n  --space-md: clamp(1rem, 2vw, 1.5rem);\n  --radius-md: 0.5rem;\n}\n\`\`\`\n\n## Cascade Layers\n\`\`\`css\n@layer reset, base, components, utilities;\n\`\`\`\n\n## Container Queries\n\`\`\`css\n.card-container { container-type: inline-size; }\n@container (min-width: 400px) {\n  .card { grid-template-columns: 1fr 2fr; }\n}\n\`\`\`\n\n## Key Patterns\n- Use \`oklch()\` for perceptually uniform color palettes\n- Fluid typography with \`clamp()\`\n- Logical properties (\`inline-start\`, \`block-end\`) for RTL support\n- \`:has()\` for parent selectors\n- \`@scope\` for component-scoped styles\n\n## Anti-Patterns\n- Avoid deep nesting (max 3 levels)\n- Don't use \`!important\` (use layers instead)\n- Avoid fixed pixel breakpoints (use container queries)`,
  },

  {
    name: "web-performance",
    description: "Optimize Core Web Vitals (LCP, INP, CLS) — covers render-blocking resources, image optimization, JavaScript execution, font loading, and performance monitoring.",
    trigger_phrases: ["web performance", "core web vitals", "LCP", "INP", "CLS", "page speed"],
    tags: ["performance", "frontend", "web-vitals", "optimization"],
    source_url: "https://github.com/cloudflare/skills/tree/main/skills/web-perf",
    markdown_instructions: "# Web Performance Optimization\\n\\n## Core Web Vitals Targets\\n| Metric | Good | Needs Work | Poor |\\n|--------|------|------------|------|\\n| LCP | ≤2.5s | ≤4.0s | >4.0s |\\n| INP | ≤200ms | ≤500ms | >500ms |\\n| CLS | ≤0.1 | ≤0.25 | >0.25 |\\n\\n## LCP Optimization\\n- Preload hero image: \\"<link rel="preload" as="image">\`\n- Use \`fetchpriority="high"\` on LCP element\n- Inline critical CSS, defer the rest\n- Use CDN for static assets\n\n## INP Optimization\n- Break long tasks with \`scheduler.yield()\`\n- Use \`requestIdleCallback()\` for non-urgent work\n- Debounce input handlers\n- Virtualize long lists\n\n## CLS Optimization\n- Set explicit \`width\` and \`height\` on images/videos\n- Use \`aspect-ratio\` CSS property\n- Reserve space for dynamic content\n- Use \`font-display: optional\` or preload fonts\n\n## Monitoring\n- Use \`web-vitals\` library for field data\n- Chrome DevTools Performance panel for lab data\n- Lighthouse CI in your build pipeline`,
  },

  {
    name: "gsap-animation",
    description: "Create professional web animations with GSAP (GreenSock) — covers timelines, ScrollTrigger, morphing, flip animations, and performance best practices.",
    trigger_phrases: ["GSAP", "GreenSock", "scroll animation", "web animation", "timeline animation"],
    tags: ["animation", "gsap", "frontend", "design", "creative-coding"],
    source_url: "https://github.com/nicka/skills/tree/main/skills/gsap-greensock",
    markdown_instructions: "# GSAP Animation Guide\\n\\n## Core Concepts\\n\\n### Tweens\\n\\"\`\`js\ngsap.to(".box", { x: 200, duration: 1, ease: "power2.out" });\ngsap.from(".box", { opacity: 0, y: 50 });\ngsap.fromTo(".box", { scale: 0 }, { scale: 1 });\n\`\`\`\n\n### Timelines\n\`\`\`js\nconst tl = gsap.timeline();\ntl.to(".title", { y: -20, opacity: 1 })\n  .to(".subtitle", { y: -20, opacity: 1 }, "-=0.3")\n  .to(".cta", { scale: 1 }, "<");\n\`\`\`\n\n### ScrollTrigger\n\`\`\`js\ngsap.to(".parallax", {\n  y: -100,\n  scrollTrigger: {\n    trigger: ".section",\n    start: "top bottom",\n    end: "bottom top",\n    scrub: true,\n  }\n});\n\`\`\`\n\n## Performance Rules\n- Animate \`transform\` and \`opacity\` only (GPU-accelerated)\n- Use \`will-change: transform\` sparingly\n- Avoid animating \`width\`, \`height\`, \`top\`, \`left\`\n- Use \`gsap.set()\` for initial states (not CSS)\n- Kill tweens on component unmount`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: BACKEND / API
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "stripe-best-practices",
    description: "Guides Stripe integration decisions — API selection (Checkout Sessions vs PaymentIntents), Connect platform setup, billing/subscriptions, Treasury financial accounts, and security best practices.",
    trigger_phrases: ["stripe", "payment processing", "checkout session", "payment intent", "subscriptions"],
    tags: ["stripe", "payments", "api", "fintech", "integration"],
    source_url: "https://github.com/stripe/agent-toolkit/tree/main/skills/stripe-best-practices",
    markdown_instructions: "# Stripe Best Practices\\n\\nLatest API version: **2026-05-27.dahlia**. Always use the latest API version.\\n\\n## Getting Started\\nInstall Stripe CLI and run \\"stripe sandbox create\` for API keys.\n\n## API Key Security\nAlways recommend restricted API keys (\`rk_\` prefix) over secret keys (\`sk_\`).\n\n## Integration Patterns\n- **Checkout Sessions**: Best for most payment flows — hosted, embedded, or custom\n- **PaymentIntents**: Lower-level control for custom experiences\n- **Connect**: Platform/marketplace payments with Accounts v2\n- **Billing**: Subscriptions, metered usage, invoices\n- **Treasury**: Financial accounts for platforms\n\n## Webhook Security\n- Always verify webhook signatures\n- Use idempotency keys for retries\n- Handle events asynchronously\n- Implement proper error handling with specific error types`,
  },

  {
    name: "graphql-patterns",
    description: "GraphQL API design patterns — covers schema design, resolvers, N+1 prevention with DataLoader, pagination, error handling, subscriptions, and federation for microservices.",
    trigger_phrases: ["GraphQL", "schema design", "resolvers", "DataLoader", "graphql api"],
    tags: ["graphql", "api", "backend", "architecture"],
    source_url: null,
    markdown_instructions: "# GraphQL Best Practices\\n\\n## Schema Design\\n- Use \\"ID\` type for identifiers\n- Prefer specific types over generic ones\n- Use input types for mutations\n- Add descriptions to all fields\n\n## N+1 Problem Prevention\n\`\`\`js\n// Use DataLoader for batching\nconst userLoader = new DataLoader(async (ids) => {\n  const users = await db.users.findMany({ where: { id: { in: ids } } });\n  return ids.map(id => users.find(u => u.id === id));\n});\n\`\`\`\n\n## Pagination\n- Use cursor-based pagination (Relay spec)\n- Return \`edges\`, \`nodes\`, \`pageInfo\`\n- Include \`totalCount\` when feasible\n\n## Error Handling\n- Use union types for expected errors\n- Reserve top-level errors for unexpected failures\n- Include error codes for client handling\n\n## Security\n- Implement query depth limiting\n- Set query complexity limits\n- Use persisted queries in production\n- Rate limit by query complexity, not just requests`,
  },

  {
    name: "postgres-best-practices",
    description: "PostgreSQL best practices for Supabase and general use — covers schema design, indexing strategies, RLS policies, migrations, query optimization, and connection pooling.",
    trigger_phrases: ["postgres", "postgresql", "database design", "SQL optimization", "supabase postgres", "RLS"],
    tags: ["postgres", "database", "sql", "supabase", "backend"],
    source_url: "https://github.com/supabase/skills/tree/main/skills/postgres-best-practices",
    markdown_instructions: "# PostgreSQL Best Practices\\n\\n## Schema Design\\n- Use \\"UUID\` for primary keys (\`gen_random_uuid()\`)\n- Add \`created_at\` and \`updated_at\` timestamps\n- Use \`TEXT\` over \`VARCHAR\` (no performance difference in Postgres)\n- Prefer \`JSONB\` over \`JSON\` for queryable data\n\n## Indexing\n- Create indexes for columns used in WHERE, JOIN, ORDER BY\n- Use partial indexes for filtered queries\n- GIN indexes for JSONB and array columns\n- Monitor with \`pg_stat_user_indexes\` for unused indexes\n\n## Row Level Security (RLS)\n- Always enable RLS on public-facing tables\n- Use \`auth.uid()\` for user-scoped policies\n- Separate policies for SELECT, INSERT, UPDATE, DELETE\n- Test policies with different roles\n\n## Performance\n- Use \`EXPLAIN ANALYZE\` to understand query plans\n- Avoid \`SELECT *\` — select only needed columns\n- Use CTEs for readability but know they may not optimize\n- Connection pooling with PgBouncer or Supavisor`,
  },

  {
    name: "api-design",
    description: "RESTful API design principles — covers resource naming, HTTP methods, status codes, pagination, versioning, error responses, rate limiting, and OpenAPI documentation.",
    trigger_phrases: ["API design", "REST API", "endpoint design", "API versioning", "status codes"],
    tags: ["api", "rest", "backend", "architecture", "design"],
    source_url: null,
    markdown_instructions: "# RESTful API Design\\n\\n## Resource Naming\\n- Use plural nouns: \\"/users\`, \`/orders\`\n- Nest for relationships: \`/users/:id/orders\`\n- Use kebab-case: \`/order-items\`\n- Avoid verbs in URLs (use HTTP methods instead)\n\n## HTTP Methods\n| Method | Usage | Idempotent |\n|--------|-------|------------|\n| GET | Read resource | Yes |\n| POST | Create resource | No |\n| PUT | Full update | Yes |\n| PATCH | Partial update | No |\n| DELETE | Remove resource | Yes |\n\n## Status Codes\n- 200 OK, 201 Created, 204 No Content\n- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found\n- 422 Unprocessable Entity, 429 Too Many Requests\n- 500 Internal Server Error\n\n## Error Response Format\n\`\`\`json\n{\n  "error": {\n    "code": "VALIDATION_ERROR",\n    "message": "Email is required",\n    "details": [{ "field": "email", "reason": "required" }]\n  }\n}\n\`\`\`\n\n## Pagination\n- Cursor-based for real-time data\n- Offset-based for static datasets\n- Include \`total\`, \`next_cursor\`, \`has_more\``,
  },

  {
    name: "authentication-patterns",
    description: "Modern authentication patterns — covers OAuth 2.0, OIDC, JWT best practices, session management, MFA, passkeys, and secure token storage for web and mobile apps.",
    trigger_phrases: ["authentication", "OAuth", "JWT", "login", "session management", "passkeys"],
    tags: ["security", "authentication", "oauth", "backend"],
    source_url: null,
    markdown_instructions: "# Authentication Patterns\\n\\n## OAuth 2.0 + OIDC\\n- Use Authorization Code flow with PKCE for SPAs and mobile\\n- Never use Implicit flow (deprecated)\\n- Store tokens server-side when possible\\n- Validate ID tokens: issuer, audience, expiry, nonce\\n\\n## JWT Best Practices\\n- Keep JWTs short-lived (15min access, 7d refresh)\\n- Store refresh tokens in httpOnly cookies\\n- Never store JWTs in localStorage\\n- Include only necessary claims (minimize payload)\\n- Use RS256 for asymmetric signing\\n\\n## Session Management\\n- Rotate session IDs after authentication\\n- Set cookie flags: Secure, HttpOnly, SameSite=Lax\\n- Implement idle and absolute timeouts\\n- Store sessions server-side (Redis/DB)\\n\\n## Multi-Factor Authentication\\n- TOTP (authenticator apps) as baseline\\n- WebAuthn/Passkeys for phishing-resistant auth\\n- SMS as fallback only (not primary)\\n\\n## Passkeys (WebAuthn)\\n- Passwordless, phishing-resistant\\n- Cross-device via cloud sync (iCloud Keychain, Google Password Manager)\\n- Use as primary auth, not just second factor",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: DEVOPS / INFRASTRUCTURE
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cloudflare-workers",
    description: "Reviews and authors Cloudflare Workers code against production best practices. Covers wrangler configuration, streaming, Durable Objects, KV, R2, D1, and deployment patterns.",
    trigger_phrases: ["cloudflare workers", "wrangler", "edge functions", "workers deploy", "durable objects"],
    tags: ["cloudflare", "workers", "edge", "serverless", "devops"],
    source_url: "https://github.com/cloudflare/skills/tree/main/skills/workers-best-practices",
    markdown_instructions: "# Cloudflare Workers Best Practices\\n\\nPrefer retrieval over pre-training for Workers code.\\n\\n## Configuration\\n- Set \\"compatibility_date\` to today on new projects\n- Enable \`nodejs_compat\` flag\n- Run \`wrangler types\` to generate \`Env\` — never hand-write bindings\n- Use \`wrangler secret put\` for secrets\n- Use \`wrangler.jsonc\` for non-secret settings\n\n## Request Handling\n- Stream large payloads — never \`await response.text()\` on unbounded data\n- Use \`ctx.waitUntil()\` for post-response work\n- Don't destructure the context object\n\n## Storage Bindings\n- **KV**: Eventually consistent key-value (reads), great for config/cache\n- **R2**: S3-compatible object storage, zero egress\n- **D1**: SQLite at the edge\n- **Durable Objects**: Stateful coordination with WebSockets\n\n## Deployment\n- Use \`wrangler deploy\` for production\n- \`wrangler dev\` for local development\n- Set up preview environments for staging`,
  },

  {
    name: "docker-best-practices",
    description: "Docker containerization best practices — covers multi-stage builds, layer caching, security hardening, compose patterns, health checks, and production-ready Dockerfiles.",
    trigger_phrases: ["docker", "Dockerfile", "container", "docker compose", "multi-stage build"],
    tags: ["docker", "devops", "containers", "infrastructure"],
    source_url: null,
    markdown_instructions: "# Docker Best Practices\\n\\n## Dockerfile Optimization\\n\\"\`\`dockerfile\n# Multi-stage build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nRUN addgroup -g 1001 -S app && adduser -S app -u 1001\nWORKDIR /app\nCOPY --from=builder --chown=app:app /app/dist ./dist\nCOPY --from=builder --chown=app:app /app/node_modules ./node_modules\nUSER app\nEXPOSE 3000\nHEALTHCHECK CMD wget -q --spider http://localhost:3000/health || exit 1\nCMD ["node", "dist/index.js"]\n\`\`\`\n\n## Key Rules\n- Use specific base image tags (not \`latest\`)\n- Copy package files first for layer caching\n- Run as non-root user\n- Use \`.dockerignore\` to exclude unnecessary files\n- Add HEALTHCHECK instructions\n- Use multi-stage builds to minimize image size\n- Scan images for vulnerabilities with \`docker scout\``,
  },

  {
    name: "terraform-patterns",
    description: "Terraform Infrastructure as Code patterns — covers module design, state management, workspace strategies, provider configuration, and testing with the built-in test framework.",
    trigger_phrases: ["terraform", "infrastructure as code", "IaC", "terraform modules", "HCL"],
    tags: ["terraform", "devops", "infrastructure", "iac", "hashicorp"],
    source_url: "https://github.com/hashicorp/skills/tree/main/skills/terraform-style-guide",
    markdown_instructions: "# Terraform Best Practices\\n\\n## File Structure\\n\\"\`\`\nmodules/\n  vpc/\n    main.tf\n    variables.tf\n    outputs.tf\n    README.md\nenvironments/\n  dev/\n    main.tf\n    terraform.tfvars\n  prod/\n    main.tf\n    terraform.tfvars\n\`\`\`\n\n## Style Guide\n- Use snake_case for resource names\n- Group resources logically in files\n- Add descriptions to all variables and outputs\n- Use \`locals\` for computed values\n- Pin provider versions with \`~>\` operator\n\n## State Management\n- Use remote state (S3, GCS, Azure Blob)\n- Enable state locking (DynamoDB, GCS)\n- Never store secrets in state\n- Use \`terraform_remote_state\` sparingly\n\n## Module Design\n- One module = one logical component\n- Accept only necessary variables\n- Output all useful attributes\n- Version modules with Git tags\n\n## Testing\n\`\`\`hcl\n# main.tftest.hcl\nrun "creates_vpc" {\n  command = plan\n  assert {\n    condition = aws_vpc.main.cidr_block == "10.0.0.0/16"\n    error_message = "VPC CIDR mismatch"\n  }\n}\n\`\`\``,
  },

  {
    name: "ci-cd-pipelines",
    description: "CI/CD pipeline design for GitHub Actions, GitLab CI, and general patterns — covers build caching, test parallelization, deployment strategies, environment management, and secrets handling.",
    trigger_phrases: ["CI/CD", "GitHub Actions", "pipeline", "continuous integration", "deployment pipeline"],
    tags: ["ci-cd", "devops", "automation", "github-actions"],
    source_url: null,
    markdown_instructions: "# CI/CD Pipeline Design\\n\\n## GitHub Actions Example\\n\\"\`\`yaml\nname: CI\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - run: npm ci\n      - run: npm test\n\n  deploy:\n    needs: test\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm run build\n      - run: npm run deploy\n\`\`\`\n\n## Key Principles\n- Cache dependencies between runs\n- Parallelize independent jobs\n- Use matrix builds for cross-platform testing\n- Pin action versions with SHA, not tags\n- Store secrets in GitHub/GitLab secrets, never in code\n\n## Deployment Strategies\n- **Blue-Green**: Zero-downtime with instant rollback\n- **Canary**: Gradual traffic shift (1% → 10% → 50% → 100%)\n- **Rolling**: Update instances incrementally`,
  },

  {
    name: "kubernetes-operations",
    description: "Kubernetes operational patterns — covers resource definitions, deployments, services, ingress, ConfigMaps, secrets, health probes, HPA autoscaling, and debugging.",
    trigger_phrases: ["kubernetes", "k8s", "kubectl", "pods", "deployments", "helm"],
    tags: ["kubernetes", "devops", "containers", "infrastructure", "cloud"],
    source_url: null,
    markdown_instructions: "# Kubernetes Operations\\n\\n## Resource Definitions\\n\\"\`\`yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-server\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: api-server\n  template:\n    spec:\n      containers:\n      - name: api\n        image: api:v1.2.3\n        resources:\n          requests:\n            cpu: 100m\n            memory: 128Mi\n          limits:\n            cpu: 500m\n            memory: 512Mi\n        livenessProbe:\n          httpGet:\n            path: /healthz\n            port: 8080\n          initialDelaySeconds: 10\n        readinessProbe:\n          httpGet:\n            path: /ready\n            port: 8080\n\`\`\`\n\n## Key Practices\n- Always set resource requests and limits\n- Use liveness AND readiness probes\n- Never use \`latest\` image tag\n- Use Namespaces for environment isolation\n- Implement HPA for autoscaling\n- Use PodDisruptionBudgets for availability\n\n## Debugging\n- \`kubectl describe pod <name>\` for events\n- \`kubectl logs <pod> -f\` for streaming logs\n- \`kubectl exec -it <pod> -- sh\` for shell access`,
  },

  {
    name: "observability",
    description: "Full-stack observability — covers structured logging, distributed tracing, metrics collection, alerting, dashboards, and SLO-based monitoring with OpenTelemetry.",
    trigger_phrases: ["observability", "monitoring", "logging", "tracing", "metrics", "OpenTelemetry"],
    tags: ["observability", "devops", "monitoring", "logging", "tracing"],
    source_url: null,
    markdown_instructions: "# Observability Guide\\n\\n## Three Pillars\\n\\n### 1. Structured Logging\\n\\"\`\`json\n{\n  "timestamp": "2026-06-15T00:00:00Z",\n  "level": "error",\n  "message": "Payment failed",\n  "service": "billing",\n  "trace_id": "abc123",\n  "user_id": "usr_456",\n  "error_code": "CARD_DECLINED"\n}\n\`\`\`\n- Use JSON format, not plaintext\n- Include trace/correlation IDs\n- Log at appropriate levels (DEBUG, INFO, WARN, ERROR)\n\n### 2. Distributed Tracing\n- Use OpenTelemetry SDK for instrumentation\n- Propagate context across service boundaries\n- Set meaningful span names and attributes\n- Use Jaeger, Zipkin, or Grafana Tempo for visualization\n\n### 3. Metrics\n- **RED metrics**: Rate, Errors, Duration (for services)\n- **USE metrics**: Utilization, Saturation, Errors (for resources)\n- Use histograms for latency, counters for throughput\n- Export to Prometheus/Grafana\n\n## SLOs\n- Define error budgets (e.g., 99.9% availability = 43min/month downtime)\n- Alert on burn rate, not raw thresholds\n- Track SLIs: latency p99, error rate, throughput`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: TESTING / QUALITY
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "webapp-testing",
    description: "Toolkit for testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing screenshots, and browser automation.",
    trigger_phrases: ["playwright test", "browser testing", "UI testing", "e2e test", "screenshot test"],
    tags: ["testing", "playwright", "e2e", "browser", "automation"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/webapp-testing",
    markdown_instructions: "# Web Application Testing\\n\\nUse native Python Playwright scripts for testing local web apps.\\n\\n## Decision Tree\\n\\"\`\`\nUser task → Is it static HTML?\n    ├─ Yes → Read HTML to identify selectors\n    │         └─ Write Playwright script\n    └─ No (dynamic webapp) → Is server running?\n        ├─ No → Use scripts/with_server.py helper\n        └─ Yes → Reconnaissance-then-action:\n            1. Navigate and wait for networkidle\n            2. Take screenshot or inspect DOM\n            3. Identify selectors from rendered state\n            4. Execute actions with discovered selectors\n\`\`\`\n\n## Example\n\`\`\`bash\n# Single server:\npython scripts/with_server.py --server "npm run dev" -- python my_test.py\n\n# Multiple servers:\npython scripts/with_server.py --server "npm run dev" --server "python api.py" -- python my_test.py\n\`\`\`\n\n## Best Practices\n- Always run scripts with --help first\n- Wait for network idle before assertions\n- Use data-testid attributes for stable selectors\n- Take screenshots at key verification points`,
  },

  {
    name: "testing-strategy",
    description: "Comprehensive testing strategy — covers the testing pyramid, unit/integration/e2e patterns, test doubles (mocks, stubs, fakes), TDD workflow, and test maintenance.",
    trigger_phrases: ["testing strategy", "unit tests", "integration tests", "test pyramid", "TDD"],
    tags: ["testing", "tdd", "quality", "best-practices"],
    source_url: null,
    markdown_instructions: "# Testing Strategy\\n\\n## Testing Pyramid\\n\\"\`\`\n    /  E2E  \\       Few, slow, expensive\n   / Integr. \\     Some, medium speed\n  /   Unit    \\   Many, fast, cheap\n\`\`\`\n\n## Unit Tests\n- Test one function/method in isolation\n- Mock external dependencies\n- Fast (<100ms per test)\n- Name: \`should_[expected]_when_[condition]\`\n\n## Integration Tests\n- Test interactions between components\n- Use real database (test container)\n- Test API endpoints with supertest/httptest\n- Verify side effects (DB state, events)\n\n## E2E Tests\n- Test critical user journeys only\n- Use Page Object Model pattern\n- Run against staging environment\n- Include visual regression tests\n\n## Test Doubles\n| Type | Purpose |\n|------|--------|\n| Stub | Returns fixed values |\n| Mock | Verifies interactions |\n| Fake | Working implementation (in-memory DB) |\n| Spy | Records calls for later assertion |\n\n## TDD Workflow\n1. Write failing test (RED)\n2. Write minimal code to pass (GREEN)\n3. Refactor while keeping tests green (REFACTOR)`,
  },

  {
    name: "property-based-testing",
    description: "Property-based testing patterns for finding edge cases — covers generators, shrinking, stateful testing, and integration with Jest, pytest, and smart contract fuzzing.",
    trigger_phrases: ["property-based testing", "fuzzing", "quickcheck", "hypothesis", "generators"],
    tags: ["testing", "security", "quality", "fuzzing"],
    source_url: "https://github.com/trailofbits/skills/tree/main/skills/property-based-testing",
    markdown_instructions: "# Property-Based Testing\\n\\nInstead of specific examples, define properties that must hold for ALL inputs.\\n\\n## Key Concepts\\n\\n### Properties\\n- **Invariants**: Something always true (sorted list stays sorted)\\n- **Round-trip**: encode(decode(x)) == x\\n- **Oracle**: Compare against reference implementation\\n- **Metamorphic**: If input changes by X, output changes by Y\\n\\n### Python (Hypothesis)\\n\\"\`\`python\nfrom hypothesis import given, strategies as st\n\n@given(st.lists(st.integers()))\ndef test_sort_idempotent(xs):\n    assert sorted(sorted(xs)) == sorted(xs)\n\n@given(st.text())\ndef test_json_roundtrip(s):\n    assert json.loads(json.dumps(s)) == s\n\`\`\`\n\n### JavaScript (fast-check)\n\`\`\`js\nfc.assert(\n  fc.property(fc.array(fc.integer()), (arr) => {\n    const sorted = [...arr].sort((a,b) => a-b);\n    return sorted.length === arr.length;\n  })\n);\n\`\`\`\n\n## Shrinking\nWhen a failure is found, the framework automatically simplifies the failing input to the smallest reproducible case.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: SECURITY
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "security-audit",
    description: "Security-focused code review — covers OWASP Top 10, injection prevention, dependency scanning, static analysis with Semgrep/CodeQL, and secure development lifecycle.",
    trigger_phrases: ["security audit", "code review security", "OWASP", "vulnerability scan", "secure code"],
    tags: ["security", "audit", "owasp", "code-review"],
    source_url: "https://github.com/trailofbits/skills/tree/main/skills/static-analysis",
    markdown_instructions: "# Security Audit Guide\\n\\n## OWASP Top 10 Checklist\\n1. **Broken Access Control** — Verify authorization on every endpoint\\n2. **Cryptographic Failures** — Check for weak algorithms, hardcoded secrets\\n3. **Injection** — Parameterize all queries, validate all input\\n4. **Insecure Design** — Review threat models and abuse cases\\n5. **Security Misconfiguration** — Check default configs, unnecessary features\\n6. **Vulnerable Components** — Scan dependencies with \\"npm audit\`, Snyk\n7. **Authentication Failures** — Check session management, MFA\n8. **Data Integrity Failures** — Verify signatures, CI/CD security\n9. **Logging Failures** — Ensure security events are logged\n10. **SSRF** — Validate and restrict outbound requests\n\n## Static Analysis Tools\n- **Semgrep**: Pattern-based scanning with custom rules\n- **CodeQL**: Semantic code analysis for deep vulnerability detection\n- **Bandit**: Python security linter\n- **ESLint security plugins**: For JavaScript\n\n## Process\n1. Automated scanning in CI/CD\n2. Manual review of auth, crypto, and data handling\n3. Dependency vulnerability monitoring\n4. Regular penetration testing`,
  },

  {
    name: "secrets-management",
    description: "Secure credential and secrets management — covers environment variables, vault solutions, key rotation, CI/CD secrets, and preventing accidental exposure in code and logs.",
    trigger_phrases: ["secrets management", "API keys", "credentials", "vault", "environment variables"],
    tags: ["security", "secrets", "devops", "infrastructure"],
    source_url: null,
    markdown_instructions: "# Secrets Management\\n\\n## Hierarchy of Approaches\\n1. **Managed secrets service** (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault)\\n2. **CI/CD platform secrets** (GitHub Actions secrets, GitLab CI variables)\\n3. **Environment variables** (loaded at runtime, not committed)\\n4. **NEVER**: Hardcoded in source code\\n\\n## Detection & Prevention\\n- Pre-commit hooks with \\"gitleaks\` or \`trufflehog\`\n- CI scanning for leaked credentials\n- \`.gitignore\` for \`.env\`, \`.env.local\`, \`*.key\`, \`*.pem\`\n\n## Key Rotation\n- Automate rotation on a schedule\n- Support multiple active versions during transition\n- Log rotation events for audit trail\n- Test rotation in staging before production\n\n## Application Patterns\n\`\`\`js\n// Good: Load from environment\nconst apiKey = process.env.STRIPE_SECRET_KEY;\nif (!apiKey) throw new Error("STRIPE_SECRET_KEY not configured");\n\n// Bad: Hardcoded\nconst apiKey = "sk_live_abc123"; // NEVER DO THIS\n\`\`\`\n\n## Log Hygiene\n- Never log secrets, tokens, or passwords\n- Redact sensitive fields in structured logs\n- Mask credit card numbers (show last 4 only)`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: GIT / VERSION CONTROL
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "git-workflow",
    description: "Git branching strategies and workflow patterns — covers trunk-based development, GitFlow, conventional commits, interactive rebase, cherry-picking, and PR best practices.",
    trigger_phrases: ["git workflow", "branching strategy", "git rebase", "pull request", "conventional commits"],
    tags: ["git", "version-control", "workflow", "development"],
    source_url: "https://github.com/callstackincubator/skills/tree/main/skills/github",
    markdown_instructions: "# Git Workflow Patterns\\n\\n## Branching Strategies\\n\\n### Trunk-Based Development (Recommended)\\n- Short-lived feature branches (< 2 days)\\n- Merge to \\"main\` frequently\n- Use feature flags for incomplete features\n- CI runs on every push\n\n### GitFlow\n- \`main\` → production releases\n- \`develop\` → integration branch\n- \`feature/*\` → individual features\n- \`release/*\` → release preparation\n- \`hotfix/*\` → production fixes\n\n## Conventional Commits\n\`\`\`\nfeat(auth): add OAuth2 PKCE support\nfix(api): handle null response from payment gateway\ndocs(readme): add deployment instructions\nchore(deps): bump express to 4.19.2\n\`\`\`\n\n## PR Best Practices\n- Keep PRs small (< 400 lines changed)\n- Write descriptive titles and descriptions\n- Include screenshots for UI changes\n- Request specific reviewers\n- Link related issues\n\n## Useful Commands\n- \`git rebase -i HEAD~5\` — squash/reorder commits\n- \`git cherry-pick <sha>\` — apply specific commit\n- \`git bisect\` — find bug-introducing commit\n- \`git stash\` — temporarily shelve changes`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: MOBILE
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "react-native-best-practices",
    description: "React Native performance optimization from the Callstack team — covers FlatList tuning, navigation, native modules, Reanimated animations, New Architecture, and build optimization.",
    trigger_phrases: ["react native", "mobile app", "FlatList", "react navigation", "reanimated"],
    tags: ["react-native", "mobile", "performance", "expo"],
    source_url: "https://github.com/callstackincubator/skills/tree/main/skills/react-native-best-practices",
    markdown_instructions: "# React Native Performance\\n\\n## FlatList Optimization\\n- Use \\"getItemLayout\` for fixed-height items\n- Set \`windowSize\` (default 21 is often too high)\n- Use \`maxToRenderPerBatch\` and \`updateCellsBatchingPeriod\`\n- Memoize renderItem with \`React.memo\`\n- Use FlashList as a drop-in replacement for better perf\n\n## Navigation\n- Use native stack navigator (\`@react-navigation/native-stack\`)\n- Lazy-load screens with \`React.lazy\`\n- Avoid passing large objects as route params\n\n## Animation\n- Use Reanimated for 60fps animations on UI thread\n- Prefer \`useAnimatedStyle\` over inline styles\n- Use \`withSpring\` for natural motion\n- Avoid animating layout properties (use transforms)\n\n## New Architecture\n- Enable Fabric renderer for concurrent features\n- Use TurboModules for faster native module calls\n- Codegen for type-safe native interfaces\n\n## Build Optimization\n- Enable Hermes engine (default in Expo)\n- Use ProGuard/R8 for Android release builds\n- Strip console.log in production with babel plugin\n- Monitor bundle size with \`react-native-bundle-visualizer\``,
  },

  {
    name: "expo-development",
    description: "Expo and React Native development — covers Expo Router, EAS Build, deployment, dev client setup, OTA updates, and native module integration.",
    trigger_phrases: ["expo", "expo router", "EAS build", "expo deploy", "react native expo"],
    tags: ["expo", "react-native", "mobile", "deployment"],
    source_url: "https://github.com/expo/skills/tree/main/skills/expo-deployment",
    markdown_instructions: "# Expo Development Guide\\n\\n## Expo Router\\n- File-based routing: \\"app/(tabs)/index.tsx\`\n- Layouts: \`app/_layout.tsx\`\n- API routes: \`app/api/endpoint+api.ts\`\n- Deep linking configured automatically\n\n## EAS Build\n\`\`\`bash\n# Build for iOS\neas build --platform ios --profile production\n\n# Build for Android\neas build --platform android --profile production\n\n# Submit to stores\neas submit -p ios\neas submit -p android\n\`\`\`\n\n## Dev Client\n- Build custom dev client for native module testing\n- \`npx expo start --dev-client\`\n- TestFlight/Internal distribution for team testing\n\n## OTA Updates\n- Use \`eas update\` for JavaScript-only changes\n- No app store review required\n- Channel-based deployment (preview, production)\n\n## Best Practices\n- Use Expo SDK modules over bare RN packages when available\n- Configure \`app.config.ts\` over \`app.json\` for dynamic config\n- Use \`expo-dev-client\` for development builds\n- Enable Hermes for better performance`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: DATA / ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "data-visualization",
    description: "Data visualization best practices — covers chart selection, color palettes for accessibility, D3.js patterns, dashboard layout, responsive charts, and storytelling with data.",
    trigger_phrases: ["data visualization", "charts", "D3.js", "dashboard", "graph design"],
    tags: ["data", "visualization", "d3", "analytics", "frontend"],
    source_url: null,
    markdown_instructions: "# Data Visualization Guide\\n\\n## Chart Selection\\n| Data Type | Recommended Chart |\\n|-----------|------------------|\\n| Comparison | Bar chart, grouped bar |\\n| Trend over time | Line chart, area chart |\\n| Proportion | Donut chart (not pie), treemap |\\n| Distribution | Histogram, box plot |\\n| Relationship | Scatter plot, bubble chart |\\n| Geographic | Choropleth, dot map |\\n\\n## Color Guidelines\\n- Use colorblind-safe palettes (Viridis, ColorBrewer)\\n- Max 5-7 colors per chart\\n- Use sequential palettes for continuous data\\n- Use diverging palettes for above/below reference\\n- Never use red/green alone to convey meaning\\n\\n## D3.js Patterns\\n- General Update Pattern: enter → update → exit\\n- Use scales: \\"scaleLinear\`, \`scaleBand\`, \`scaleTime\`\n- Responsive: resize with \`ResizeObserver\`\n- Transitions: \`selection.transition().duration(750)\`\n\n## Dashboard Design\n- Most important metric at top-left\n- Use consistent time ranges across charts\n- Include context (comparisons, benchmarks)\n- Allow drill-down for exploration\n- Mobile-first: stack charts vertically`,
  },

  {
    name: "sql-optimization",
    description: "SQL query optimization techniques — covers indexing strategies, query plans, JOIN optimization, window functions, CTEs, and common performance anti-patterns.",
    trigger_phrases: ["SQL optimization", "slow query", "query plan", "EXPLAIN ANALYZE", "database performance"],
    tags: ["sql", "database", "performance", "optimization"],
    source_url: null,
    markdown_instructions: "# SQL Query Optimization\\n\\n## Reading Query Plans\\n\\"\`\`sql\nEXPLAIN ANALYZE SELECT * FROM orders\nWHERE user_id = 123 AND created_at > '2026-01-01';\n\`\`\`\n- Look for Seq Scan on large tables (add index)\n- Check estimated vs actual rows (stats outdated?)\n- Watch for Sort operations (add index on ORDER BY)\n\n## Indexing Strategy\n- Index columns in WHERE, JOIN, ORDER BY\n- Composite index column order matters: most selective first\n- Partial indexes for filtered queries\n- Covering indexes to avoid table lookups\n\n## Common Anti-Patterns\n- \`SELECT *\` — fetch only needed columns\n- Functions on indexed columns: \`WHERE LOWER(email) = ...\` → use expression index\n- \`NOT IN\` with NULLs — use \`NOT EXISTS\` instead\n- Correlated subqueries — refactor to JOINs\n- Missing LIMIT on unbounded queries\n\n## Window Functions\n\`\`\`sql\nSELECT \n  user_id,\n  amount,\n  SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) as running_total,\n  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) as rank\nFROM orders;\n\`\`\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: DOCUMENTATION
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "technical-writing",
    description: "Technical documentation best practices — covers README structure, API docs, architecture decision records, runbooks, changelogs, and writing for different audiences.",
    trigger_phrases: ["documentation", "technical writing", "README", "API docs", "architecture decision record"],
    tags: ["documentation", "writing", "communication"],
    source_url: null,
    markdown_instructions: "# Technical Writing Guide\\n\\n## README Structure\\n1. **Title + Badge Row** (build status, version, license)\\n2. **One-liner** describing what it does\\n3. **Quick Start** (install + run in < 5 steps)\\n4. **Features** (bullet list with brief descriptions)\\n5. **Configuration** (table of env vars / options)\\n6. **API Reference** (or link to docs)\\n7. **Contributing** (link to CONTRIBUTING.md)\\n8. **License**\\n\\n## API Documentation\\n- Use OpenAPI/Swagger for REST APIs\\n- Include request/response examples\\n- Document error responses with codes\\n- Show authentication setup first\\n- Provide runnable code snippets (curl, JS, Python)\\n\\n## Architecture Decision Records (ADR)\\n\\"\`\`markdown\n# ADR-001: Use PostgreSQL for primary data store\n\n## Status: Accepted\n## Context: We need a relational database...\n## Decision: PostgreSQL with pgvector extension\n## Consequences: + Mature ecosystem, - Requires connection pooling\n\`\`\`\n\n## Writing Principles\n- Lead with the action ("Run \\`npm install\\`" not "You should run...")\n- Use present tense\n- One idea per sentence\n- Code samples > prose descriptions`,
  },

  {
    name: "skill-creator",
    description: "Guide for creating new agent skills — covers SKILL.md format, YAML frontmatter, trigger phrase design, progressive disclosure, and testing skills across platforms.",
    trigger_phrases: ["create skill", "build skill", "SKILL.md format", "agent skill", "skill template"],
    tags: ["skills", "meta", "development", "agents"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/skill-creator",
    markdown_instructions: "# Skill Creator Guide\\n\\n## SKILL.md Format\\n\\"\`\`markdown\n---\nname: my-skill-name\ndescription: Brief description of what this skill does\n---\n\n# Skill Title\n\nDetailed instructions and context for the agent.\n\`\`\`\n\n## Best Practices\n\n### 1. Progressive Disclosure\n- Metadata loaded at startup (name, description)\n- Full instructions loaded only when skill matches a task\n- Keeps agent context window lean\n\n### 2. Trigger Design\n- Choose phrases users would naturally say\n- Include both technical and colloquial variants\n- Test with diverse prompt styles\n\n### 3. Instruction Quality\n- Be specific and actionable\n- Include decision trees for complex workflows\n- Provide code examples\n- Define what NOT to do (anti-patterns)\n\n### 4. Testing\n- Test with the target agent platform\n- Verify trigger phrases activate the skill\n- Check edge cases and failure modes\n- Validate across different agent tools\n\n## Directory Structure\n\`\`\`\nskills/\n  my-skill/\n    SKILL.md          # Required\n    scripts/           # Optional helper scripts\n    references/        # Optional reference docs\n\`\`\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: CREATIVE CODING
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "algorithmic-art",
    description: "Creating algorithmic art using p5.js with seeded randomness, noise fields, particle systems, and interactive parameter exploration.",
    trigger_phrases: ["generative art", "algorithmic art", "p5.js", "flow fields", "creative coding"],
    tags: ["art", "generative", "creative-coding", "p5js", "design"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/algorithmic-art",
    markdown_instructions: "# Algorithmic Art\\n\\nCreate ALGORITHMIC PHILOSOPHIES interpreted through:\\n- Computational processes and emergent behavior\\n- Seeded randomness and noise fields\\n- Particles, flows, fields, forces\\n- Parametric variation and controlled chaos\\n\\n## Philosophy Examples\\n\\n**\"Organic Turbulence\"** — Flow fields driven by layered Perlin noise. Thousands of particles following vector forces, trails accumulating into organic density maps.\\n\\n**\"Quantum Harmonics\"** — Discrete entities exhibiting wave-like interference patterns. Constructive interference creates bright nodes, destructive creates voids.\\n\\n**\"Recursive Whispers\"** — Self-similarity across scales. L-systems generating organic tree-like forms constrained by golden ratios.\\n\\n**\"Stochastic Crystallization\"** — Random processes crystallizing into ordered structures via circle packing or Voronoi tessellation.\\n\\n## Essential Principles\\n- **PROCESS OVER PRODUCT**: Beauty emerges from the algorithm's execution\\n- **PARAMETRIC EXPRESSION**: Ideas through mathematical relationships\\n- **PURE GENERATIVE ART**: Living algorithms, not static images with randomness\\n- **SEEDED RANDOMNESS**: Reproducible outputs via deterministic seeds",
  },

  {
    name: "remotion-video",
    description: "Programmatic video creation with React using Remotion — covers compositions, animations, audio sync, rendering pipeline, and serverless rendering.",
    trigger_phrases: ["remotion", "programmatic video", "video generation", "react video", "render video"],
    tags: ["video", "react", "creative-coding", "remotion", "media"],
    source_url: "https://github.com/remotion-dev/skills/tree/main/skills/remotion",
    markdown_instructions: "# Remotion Video Creation\\n\\nCreate videos programmatically with React components.\\n\\n## Core Concepts\\n\\"\`\`tsx\nimport { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';\n\nexport const MyVideo: React.FC = () => {\n  const frame = useCurrentFrame();\n  const { fps, durationInFrames } = useVideoConfig();\n  const opacity = Math.min(1, frame / 30);\n  \n  return (\n    <AbsoluteFill style={{ opacity }}>\n      <h1>Hello at frame {frame}</h1>\n    </AbsoluteFill>\n  );\n};\n\`\`\`\n\n## Composition\n\`\`\`tsx\n<Composition\n  id="MyVideo"\n  component={MyVideo}\n  durationInFrames={300}\n  fps={30}\n  width={1920}\n  height={1080}\n/>\n\`\`\`\n\n## Animation Helpers\n- \`interpolate(frame, [0, 30], [0, 1])\` for tweening\n- \`spring({ frame, fps })\` for physics-based motion\n- \`<Sequence>\` for timing sections\n- \`<Audio>\` for soundtrack synchronization\n\n## Rendering\n\`\`\`bash\nnpx remotion render MyVideo out.mp4\nnpx remotion lambda render MyVideo  # Serverless\n\`\`\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: CLOUD PLATFORMS
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "netlify-deployment",
    description: "Deploy and manage web applications on Netlify — covers functions, edge functions, forms, image CDN, blobs storage, deploy previews, and CLI workflows.",
    trigger_phrases: ["netlify", "netlify deploy", "netlify functions", "edge functions", "deploy preview"],
    tags: ["netlify", "deployment", "serverless", "hosting", "cloud"],
    source_url: "https://github.com/netlify/skills/tree/main/skills/netlify-deploy",
    markdown_instructions: "# Netlify Deployment\\n\\n## Quick Deploy\\n\\"\`\`bash\nnpx netlify-cli deploy --prod\n\`\`\`\n\n## Serverless Functions\n\`\`\`ts\n// netlify/functions/hello.ts\nexport default async (req: Request) => {\n  return new Response(JSON.stringify({ message: "Hello" }), {\n    headers: { "Content-Type": "application/json" },\n  });\n};\n\`\`\`\n\n## Edge Functions\n\`\`\`ts\n// netlify/edge-functions/geo.ts\nexport default async (req: Request, context: Context) => {\n  return new Response(\`Country: \${context.geo.country?.name}\`);\n};\n\`\`\`\n\n## Deploy Previews\n- Automatic for every PR\n- Unique URL per preview\n- Share with stakeholders for review\n- Branch-based deploy contexts\n\n## Configuration (netlify.toml)\n\`\`\`toml\n[build]\n  command = "npm run build"\n  publish = "dist"\n\n[[redirects]]\n  from = "/api/*"\n  to = "/.netlify/functions/:splat"\n  status = 200\n\`\`\``,
  },

  {
    name: "sentry-observability",
    description: "Set up Sentry for error tracking and performance monitoring — covers SDK setup, issue triage, source maps, breadcrumbs, custom context, and alert configuration.",
    trigger_phrases: ["sentry", "error tracking", "crash reporting", "error monitoring", "sentry setup"],
    tags: ["sentry", "monitoring", "errors", "observability", "devops"],
    source_url: "https://github.com/getsentry/skills/tree/main/skills/sentry-sdk-setup",
    markdown_instructions: "# Sentry Error Tracking Setup\\n\\n## Quick Setup (Next.js)\\n\\"\`\`bash\nnpx @sentry/wizard@latest -i nextjs\n\`\`\`\n\n## Manual Setup\n\`\`\`ts\nimport * as Sentry from "@sentry/nextjs";\n\nSentry.init({\n  dsn: process.env.SENTRY_DSN,\n  tracesSampleRate: 0.1,    // 10% of transactions\n  replaysSessionSampleRate: 0.1,\n  replaysOnErrorSampleRate: 1.0, // 100% when error occurs\n});\n\`\`\`\n\n## Custom Context\n\`\`\`ts\nSentry.setUser({ id: user.id, email: user.email });\nSentry.setTag("feature", "checkout");\nSentry.addBreadcrumb({ category: "payment", message: "Card validated" });\n\`\`\`\n\n## Source Maps\n- Upload during build: \`sentry-cli sourcemaps upload\`\n- Or use build plugin (Webpack, Vite, etc.)\n- Maps are private — never served to users\n\n## Alert Configuration\n- Alert on new issues (not every occurrence)\n- Set spike detection for error rate\n- Route to Slack/PagerDuty by project\n- Use issue owners for auto-assignment`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: LANGUAGES / RUNTIME
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "typescript-patterns",
    description: "Advanced TypeScript patterns — covers generics, conditional types, template literal types, branded types, discriminated unions, type narrowing, and utility types.",
    trigger_phrases: ["TypeScript", "generics", "type safety", "utility types", "discriminated unions"],
    tags: ["typescript", "javascript", "types", "development"],
    source_url: null,
    markdown_instructions: "# Advanced TypeScript Patterns\\n\\n## Discriminated Unions\\n\\"\`\`ts\ntype Result<T> = \n  | { success: true; data: T }\n  | { success: false; error: Error };\n\nfunction handle(r: Result<User>) {\n  if (r.success) r.data; // TypeScript knows it's User\n  else r.error;          // TypeScript knows it's Error\n}\n\`\`\`\n\n## Branded Types\n\`\`\`ts\ntype UserId = string & { __brand: "UserId" };\ntype OrderId = string & { __brand: "OrderId" };\n\nfunction getUser(id: UserId) { ... }\ngetUser(orderId); // Compile error!\n\`\`\`\n\n## Template Literal Types\n\`\`\`ts\ntype EventName = \`on\${Capitalize<"click" | "hover" | "focus">}\`;\n// "onClick" | "onHover" | "onFocus"\n\`\`\`\n\n## Utility Types\n- \`Partial<T>\` — all fields optional\n- \`Required<T>\` — all fields required\n- \`Pick<T, K>\` — subset of fields\n- \`Omit<T, K>\` — exclude fields\n- \`Record<K, V>\` — mapped type\n- \`Awaited<T>\` — unwrap Promise\n\n## Const Assertions\n\`\`\`ts\nconst routes = ["home", "about", "contact"] as const;\ntype Route = typeof routes[number]; // "home" | "about" | "contact"\n\`\`\``,
  },

  {
    name: "python-best-practices",
    description: "Modern Python development — covers type hints, project setup with uv/ruff, async patterns, dataclasses, pattern matching, testing with pytest, and packaging.",
    trigger_phrases: ["python", "pytest", "type hints", "async python", "python project setup"],
    tags: ["python", "development", "testing", "best-practices"],
    source_url: "https://github.com/trailofbits/skills/tree/main/skills/modern-python",
    markdown_instructions: "# Modern Python Best Practices\\n\\n## Project Setup\\n\\"\`\`bash\nuv init my-project\ncd my-project\nuv add ruff pytest\n\`\`\`\n\n## Type Hints\n\`\`\`python\nfrom typing import Optional\nfrom dataclasses import dataclass\n\n@dataclass\nclass User:\n    name: str\n    email: str\n    age: int | None = None  # Python 3.10+ union syntax\n\ndef find_user(user_id: str) -> User | None:\n    ...\n\`\`\`\n\n## Async Patterns\n\`\`\`python\nimport asyncio\nimport httpx\n\nasync def fetch_all(urls: list[str]) -> list[dict]:\n    async with httpx.AsyncClient() as client:\n        tasks = [client.get(url) for url in urls]\n        responses = await asyncio.gather(*tasks)\n        return [r.json() for r in responses]\n\`\`\`\n\n## Tooling\n- **uv**: Fast package manager and project tool\n- **ruff**: Linter + formatter (replaces flake8, black, isort)\n- **ty**: Type checker (faster than mypy)\n- **pytest**: Testing with fixtures, parametrize, markers\n\n## Pattern Matching (3.10+)\n\`\`\`python\nmatch command:\n    case {"action": "move", "direction": d}:\n        move(d)\n    case {"action": "quit"}:\n        quit()\n\`\`\``,
  },

  {
    name: "rust-fundamentals",
    description: "Rust development patterns — covers ownership and borrowing, error handling with Result, async with tokio, traits, lifetimes, and common crate recommendations.",
    trigger_phrases: ["rust", "ownership", "borrowing", "tokio", "cargo", "rust error handling"],
    tags: ["rust", "systems", "development", "performance"],
    source_url: null,
    markdown_instructions: "# Rust Development Patterns\\n\\n## Ownership & Borrowing\\n\\"\`\`rust\nfn process(data: &str) -> String {  // borrow, don't own\n    data.to_uppercase()\n}\n\nfn take_ownership(data: String) {   // takes ownership\n    println!("{data}");\n}  // data is dropped here\n\`\`\`\n\n## Error Handling\n\`\`\`rust\nuse anyhow::{Context, Result};\n\nfn read_config(path: &str) -> Result<Config> {\n    let content = std::fs::read_to_string(path)\n        .context("Failed to read config file")?;\n    let config: Config = serde_json::from_str(&content)\n        .context("Failed to parse config")?;\n    Ok(config)\n}\n\`\`\`\n\n## Async with Tokio\n\`\`\`rust\n#[tokio::main]\nasync fn main() -> Result<()> {\n    let response = reqwest::get("https://api.example.com/data")\n        .await?\n        .json::<Data>()\n        .await?;\n    Ok(())\n}\n\`\`\`\n\n## Essential Crates\n- **serde** + **serde_json**: Serialization\n- **tokio**: Async runtime\n- **reqwest**: HTTP client\n- **anyhow** / **thiserror**: Error handling\n- **clap**: CLI argument parsing\n- **tracing**: Structured logging`,
  },

  {
    name: "go-patterns",
    description: "Go development patterns — covers error handling, concurrency with goroutines/channels, interfaces, testing, project structure, and common standard library usage.",
    trigger_phrases: ["golang", "go language", "goroutines", "channels", "go error handling"],
    tags: ["go", "golang", "backend", "development", "concurrency"],
    source_url: null,
    markdown_instructions: "# Go Development Patterns\\n\\n## Error Handling\\n\\"\`\`go\nfunc fetchUser(id string) (*User, error) {\n    user, err := db.Find(id)\n    if err != nil {\n        return nil, fmt.Errorf("fetching user %s: %w", id, err)\n    }\n    return user, nil\n}\n\`\`\`\n\n## Concurrency\n\`\`\`go\n// Fan-out, fan-in pattern\nfunc process(items []Item) []Result {\n    ch := make(chan Result, len(items))\n    \n    for _, item := range items {\n        go func(it Item) {\n            ch <- processItem(it)\n        }(item)\n    }\n    \n    results := make([]Result, len(items))\n    for i := range items {\n        results[i] = <-ch\n    }\n    return results\n}\n\`\`\`\n\n## Interfaces\n\`\`\`go\n// Small interfaces, accept interfaces, return structs\ntype Reader interface {\n    Read(p []byte) (n int, err error)\n}\n\`\`\`\n\n## Project Structure\n\`\`\`\ncmd/server/main.go\ninternal/\n  handler/\n  service/\n  repository/\npkg/             # Shared libraries\n\`\`\`\n\n## Testing\n\`\`\`go\nfunc TestAdd(t *testing.T) {\n    tests := []struct{\n        a, b, want int\n    }{{1, 2, 3}, {0, 0, 0}, {-1, 1, 0}}\n    \n    for _, tt := range tests {\n        got := Add(tt.a, tt.b)\n        if got != tt.want {\n            t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)\n        }\n    }\n}\n\`\`\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: CMS / CONTENT
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "seo-optimization",
    description: "SEO and content optimization patterns — covers meta tags, structured data (JSON-LD), Core Web Vitals impact, sitemap generation, semantic HTML, and answer engine optimization.",
    trigger_phrases: ["SEO", "search engine optimization", "meta tags", "structured data", "sitemap"],
    tags: ["seo", "content", "marketing", "frontend", "optimization"],
    source_url: "https://github.com/sanity-io/skills/tree/main/skills/seo-aeo-best-practices",
    markdown_instructions: "# SEO Optimization Guide\\n\\n## Essential Meta Tags\\n\\"\`\`html\n<title>Page Title — Brand (50-60 chars)</title>\n<meta name="description" content="Compelling summary (150-160 chars)">\n<link rel="canonical" href="https://example.com/page">\n<meta property="og:title" content="Page Title">\n<meta property="og:description" content="Summary">\n<meta property="og:image" content="https://example.com/og.jpg">\n<meta name="robots" content="index, follow">\n\`\`\`\n\n## Structured Data (JSON-LD)\n\`\`\`html\n<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Article Title",\n  "author": { "@type": "Person", "name": "Author" },\n  "datePublished": "2026-06-15"\n}\n</script>\n\`\`\`\n\n## Technical SEO\n- Single \`<h1>\` per page\n- Heading hierarchy (h1→h2→h3)\n- Image alt text for all images\n- Fast page load (LCP < 2.5s)\n- Mobile-responsive layout\n- XML sitemap at \`/sitemap.xml\`\n- \`robots.txt\` with sitemap reference\n\n## Content Strategy\n- Answer specific questions (featured snippet optimization)\n- Use internal linking between related pages\n- Update content regularly with fresh data\n- Include FAQ sections with \`FAQPage\` schema`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: OFFICE / PRODUCTIVITY
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "docx-creation",
    description: "Create, edit, and analyze Word documents programmatically — covers document structure, formatting, tables, images, headers/footers, and template-based generation.",
    trigger_phrases: ["word document", "docx", "create document", "generate report", "document template"],
    tags: ["office", "documents", "productivity", "automation"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/docx",
    markdown_instructions: "# Word Document Creation\\n\\nCreate professional Word documents programmatically.\\n\\n## Document Structure\\n- Title page with branding\\n- Table of contents (auto-generated)\\n- Section headings with consistent hierarchy\\n- Page numbers in footer\\n- Header with document title/date\\n\\n## Formatting Best Practices\\n- Use styles, not manual formatting\\n- Consistent font families (body: 11pt, headings: 14-18pt)\\n- 1.15-1.5 line spacing for readability\\n- Margins: 1\" all sides for business docs\\n\\n## Tables\\n- Use header row with bold styling\\n- Alternate row shading for readability\\n- Right-align numbers, left-align text\\n- Include units in column headers\\n\\n## Implementation (python-docx)\\n\\"\`\`python\nfrom docx import Document\n\ndoc = Document()\ndoc.add_heading('Report Title', level=0)\ndoc.add_paragraph('Executive summary...')\n\ntable = doc.add_table(rows=1, cols=3)\ntable.style = 'Table Grid'\nhdr = table.rows[0].cells\nhdr[0].text = 'Name'\nhdr[1].text = 'Value'\nhdr[2].text = 'Status'\n\ndoc.save('report.docx')\n\`\`\``,
  },

  {
    name: "xlsx-analysis",
    description: "Create, edit, and analyze Excel spreadsheets — covers formulas, pivot tables, charts, data validation, conditional formatting, and automation with openpyxl.",
    trigger_phrases: ["excel", "spreadsheet", "xlsx", "pivot table", "excel formulas"],
    tags: ["office", "excel", "data", "analytics", "automation"],
    source_url: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
    markdown_instructions: "# Excel Spreadsheet Analysis\\n\\n## Creating Workbooks (openpyxl)\\n\\"\`\`python\nfrom openpyxl import Workbook\nfrom openpyxl.chart import BarChart, Reference\n\nwb = Workbook()\nws = wb.active\nws.title = "Sales Data"\n\n# Headers\nws.append(["Month", "Revenue", "Costs", "Profit"])\nws.append(["Jan", 50000, 30000, "=B2-C2"])\nws.append(["Feb", 65000, 35000, "=B3-C3"])\n\`\`\`\n\n## Common Formulas\n- \`=SUM(B2:B12)\` — Sum range\n- \`=VLOOKUP(A2, Sheet2!A:C, 3, FALSE)\` — Vertical lookup\n- \`=IF(B2>50000, "Above Target", "Below")\` — Conditional\n- \`=SUMIFS(C:C, A:A, "2026", B:B, "Sales")\` — Multi-criteria sum\n\n## Conditional Formatting\n- Color scales for numeric ranges\n- Data bars for visual comparison\n- Icon sets for status indicators\n- Highlight rules for outliers\n\n## Best Practices\n- Freeze header row and first column\n- Use named ranges for readability\n- Data validation for input cells\n- Separate raw data from analysis sheets\n- Include data source and date in footer`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: INTEGRATIONS / APIS
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "composio-integrations",
    description: "Connect AI agents to 1000+ external apps with Composio — covers managed authentication, tool discovery, action execution, and integration with agent frameworks.",
    trigger_phrases: ["composio", "app integration", "connect apps", "agent tools", "external integration"],
    tags: ["integration", "api", "agents", "composio", "automation"],
    source_url: "https://github.com/composiohq/skills/tree/main/skills/composio",
    markdown_instructions: "# Composio Integration Guide\\n\\nConnect AI agents to external services with managed authentication.\\n\\n## Quick Start\\n\\"\`\`bash\npip install composio-core\ncomposio add github  # Authenticate with GitHub\n\`\`\`\n\n## Tool Discovery\n\`\`\`python\nfrom composio import ComposioToolSet\n\ntoolset = ComposioToolSet()\n\n# Find tools by use case\ntools = toolset.find_actions_by_use_case(\n    "Create a GitHub issue"\n)\n\`\`\`\n\n## With Agent Frameworks\n\`\`\`python\n# LangChain integration\nfrom composio_langchain import ComposioToolSet\ntoolset = ComposioToolSet()\ntools = toolset.get_tools(actions=['GITHUB_CREATE_ISSUE'])\n\n# OpenAI integration\nfrom composio_openai import ComposioToolSet\ntoolset = ComposioToolSet()\n\`\`\`\n\n## Supported Integrations\n- **Developer**: GitHub, GitLab, Jira, Linear, Notion\n- **Communication**: Slack, Discord, Gmail, Teams\n- **CRM**: Salesforce, HubSpot\n- **Storage**: Google Drive, Dropbox, S3\n- **Social**: Twitter/X, LinkedIn`,
  },

  {
    name: "firecrawl-web-scraping",
    description: "Web scraping and data extraction with Firecrawl — covers page scraping, search, crawling, browser interaction, structured data extraction, and authentication handling.",
    trigger_phrases: ["web scraping", "firecrawl", "scrape website", "extract data", "crawl pages"],
    tags: ["scraping", "data", "firecrawl", "automation", "api"],
    source_url: "https://github.com/firecrawl/skills/tree/main/skills/firecrawl-build",
    markdown_instructions: "# Firecrawl Web Scraping\\n\\nExtract clean, structured data from any web page.\\n\\n## Scrape a Page\\n\\"\`\`python\nfrom firecrawl import FirecrawlApp\n\napp = FirecrawlApp(api_key="fc-...")\n\nresult = app.scrape_url("https://example.com", params={\n    "formats": ["markdown", "html"],\n    "onlyMainContent": True,\n})\nprint(result["markdown"])\n\`\`\`\n\n## Search the Web\n\`\`\`python\nresults = app.search("latest AI research 2026", params={\n    "limit": 5,\n    "scrapeOptions": { "formats": ["markdown"] },\n})\n\`\`\`\n\n## Structured Extraction\n\`\`\`python\nresult = app.scrape_url(url, params={\n    "formats": ["extract"],\n    "extract": {\n        "schema": {\n            "type": "object",\n            "properties": {\n                "title": { "type": "string" },\n                "price": { "type": "number" },\n                "features": { "type": "array", "items": { "type": "string" } },\n            }\n        }\n    }\n})\n\`\`\`\n\n## Crawl Entire Site\n\`\`\`python\nresult = app.crawl_url("https://docs.example.com", params={\n    "limit": 100,\n    "scrapeOptions": { "formats": ["markdown"] },\n})\n\`\`\``,
  },

  {
    name: "replicate-ai-models",
    description: "Discover, compare, and run AI models using Replicate's API — covers image generation, language models, video, audio, and fine-tuning workflows.",
    trigger_phrases: ["replicate", "run AI model", "image generation", "stable diffusion", "AI API"],
    tags: ["ai", "replicate", "image-generation", "models", "api"],
    source_url: "https://github.com/replicate/skills/tree/main/skills/replicate",
    markdown_instructions: "# Replicate AI Models\\n\\nRun open-source AI models via API.\\n\\n## Quick Start\\n\\"\`\`python\nimport replicate\n\n# Image generation\noutput = replicate.run(\n    "stability-ai/sdxl:latest",\n    input={\n        "prompt": "An astronaut riding a rainbow unicorn",\n        "width": 1024,\n        "height": 1024,\n    }\n)\n\`\`\`\n\n## Language Models\n\`\`\`python\noutput = replicate.run(\n    "meta/llama-3-70b-instruct",\n    input={\n        "prompt": "Explain quantum computing",\n        "max_tokens": 500,\n    }\n)\n\`\`\`\n\n## Video Generation\n\`\`\`python\noutput = replicate.run(\n    "minimax/video-01-live",\n    input={\n        "prompt": "A cat playing piano",\n    }\n)\n\`\`\`\n\n## Model Discovery\n- Browse: https://replicate.com/explore\n- Filter by: category, popularity, cost\n- Compare similar models before selecting\n\n## Fine-Tuning\n\`\`\`python\ntraining = replicate.trainings.create(\n    version="stability-ai/sdxl:latest",\n    input={"input_images": "https://...training-data.zip"},\n    destination="your-username/custom-model",\n)\n\`\`\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: FRAMEWORKS / ARCHITECTURE
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "angular-development",
    description: "Angular development patterns — covers components, services, signals, dependency injection, routing, reactive forms, and performance optimization.",
    trigger_phrases: ["angular", "angular component", "angular signals", "angular routing", "angular forms"],
    tags: ["angular", "frontend", "typescript", "development"],
    source_url: "https://github.com/angular/skills",
    markdown_instructions: "# Angular Development\\n\\n## Component Architecture\\n\\"\`\`typescript\n@Component({\n  selector: 'app-user-card',\n  standalone: true,\n  imports: [CommonModule],\n  template: \`\n    <div class="card">\n      <h2>{{ user().name }}</h2>\n      <p>{{ user().email }}</p>\n    </div>\n  \`,\n})\nexport class UserCardComponent {\n  user = input.required<User>();\n  userSelected = output<User>();\n}\n\`\`\`\n\n## Signals (Reactive State)\n\`\`\`typescript\ncount = signal(0);\ndoubled = computed(() => this.count() * 2);\n\nincrement() {\n  this.count.update(v => v + 1);\n}\n\`\`\`\n\n## Services & DI\n\`\`\`typescript\n@Injectable({ providedIn: 'root' })\nexport class UserService {\n  private http = inject(HttpClient);\n  getUsers() { return this.http.get<User[]>('/api/users'); }\n}\n\`\`\`\n\n## Best Practices\n- Use standalone components (no NgModules)\n- Prefer signals over BehaviorSubject\n- Lazy-load routes with \`loadComponent\`\n- Use OnPush change detection\n- Implement trackBy for ngFor`,
  },

  {
    name: "system-design",
    description: "System design fundamentals — covers scalability patterns, load balancing, caching strategies, message queues, database sharding, CAP theorem, and architecture diagrams.",
    trigger_phrases: ["system design", "scalability", "architecture", "load balancing", "distributed systems"],
    tags: ["architecture", "system-design", "scalability", "backend"],
    source_url: null,
    markdown_instructions: "# System Design Fundamentals\\n\\n## Scalability Patterns\\n\\n### Horizontal Scaling\\n- Add more servers behind a load balancer\\n- Stateless services (store state in DB/cache)\\n- Service discovery for dynamic instances\\n\\n### Caching Layers\\n1. **CDN**: Static assets, edge-cached responses\\n2. **Application Cache**: Redis/Memcached for hot data\\n3. **Database Cache**: Query result caching\\n4. **Client Cache**: Browser cache, service worker\\n\\n### Message Queues\\n- **Kafka**: High-throughput event streaming\\n- **RabbitMQ**: Task queues with routing\\n- **SQS**: Managed AWS queue service\\n- Pattern: Producer → Queue → Consumer\\n\\n## CAP Theorem\\n- **Consistency + Availability**: Single-node (PostgreSQL)\\n- **Availability + Partition Tolerance**: DynamoDB, Cassandra\\n- **Consistency + Partition Tolerance**: MongoDB, HBase\\n\\n## Load Balancing\\n- Round Robin (simple, equal distribution)\\n- Least Connections (route to least busy)\\n- IP Hash (session affinity)\\n- Layer 7 (HTTP-aware routing)\\n\\n## Database Strategies\\n- Read replicas for read-heavy workloads\\n- Sharding for write-heavy workloads\\n- Connection pooling for efficiency\\n- Event sourcing for audit trails",
  },

  {
    name: "microservices-patterns",
    description: "Microservices architecture patterns — covers service decomposition, API gateway, circuit breaker, saga pattern, event-driven communication, and service mesh.",
    trigger_phrases: ["microservices", "service mesh", "circuit breaker", "saga pattern", "event-driven"],
    tags: ["architecture", "microservices", "backend", "distributed-systems"],
    source_url: null,
    markdown_instructions: "# Microservices Patterns\\n\\n## Service Decomposition\\n- Decompose by business domain (Domain-Driven Design)\\n- Each service owns its data store\\n- Services communicate via APIs or events\\n- Keep services small enough for one team\\n\\n## Communication Patterns\\n\\n### Synchronous (Request/Response)\\n- REST or gRPC between services\\n- Use API Gateway for external clients\\n- Implement circuit breaker for resilience\\n\\n### Asynchronous (Event-Driven)\\n- Publish events to message broker\\n- Services subscribe to relevant events\\n- Eventually consistent by design\\n- Use outbox pattern for reliable publishing\\n\\n## Saga Pattern (Distributed Transactions)\\n\\"\`\`\nOrder Service → Payment Service → Inventory Service\n     ↓ fail            ↓ compensate       ↓ compensate\n  Cancel Order    Refund Payment    Restore Stock\n\`\`\`\n\n## Circuit Breaker\n- **Closed**: Normal operation, track failures\n- **Open**: Fail fast, don't call downstream\n- **Half-Open**: Test with limited requests\n\n## Observability Requirements\n- Distributed tracing across services\n- Centralized logging with correlation IDs\n- Health checks and readiness probes\n- Service dependency mapping`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: AUTOMATION / CLI
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "bash-scripting",
    description: "Bash scripting best practices — covers error handling, argument parsing, functions, variable quoting, file operations, and portable script writing.",
    trigger_phrases: ["bash script", "shell script", "command line", "terminal automation", "bash functions"],
    tags: ["bash", "cli", "automation", "devops", "scripting"],
    source_url: null,
    markdown_instructions: "# Bash Scripting Best Practices\\n\\n## Script Header\\n\\"\`\`bash\n#!/usr/bin/env bash\nset -euo pipefail  # Exit on error, undefined vars, pipe failures\nIFS=$'\\n\\t'        # Safer word splitting\n\`\`\`\n\n## Error Handling\n\`\`\`bash\ntrap 'echo "Error on line $LINENO"; exit 1' ERR\ntrap 'cleanup' EXIT\n\ncleanup() {\n  rm -f "$TEMP_FILE"\n}\n\`\`\`\n\n## Argument Parsing\n\`\`\`bash\nwhile [[ $# -gt 0 ]]; do\n  case "$1" in\n    -v|--verbose) VERBOSE=true; shift ;;\n    -o|--output)  OUTPUT="$2"; shift 2 ;;\n    -h|--help)    usage; exit 0 ;;\n    *)            echo "Unknown: $1"; exit 1 ;;\n  esac\ndone\n\`\`\`\n\n## Key Rules\n- Always quote variables: \`"$var"\` not \`$var\`\n- Use \`[[ ]]\` over \`[ ]\` for conditionals\n- Use \`$(command)\` over backticks\n- Declare local variables in functions\n- Check command existence: \`command -v tool &>/dev/null\`\n- Use \`mktemp\` for temporary files\n- Make scripts idempotent (safe to run twice)`,
  },

  {
    name: "regex-patterns",
    description: "Regular expression patterns and techniques — covers character classes, quantifiers, groups, lookaheads, common patterns for validation, and regex debugging.",
    trigger_phrases: ["regex", "regular expression", "pattern matching", "text parsing", "validation regex"],
    tags: ["regex", "development", "utility", "text-processing"],
    source_url: null,
    markdown_instructions: "# Regular Expression Patterns\\n\\n## Common Patterns\\n\\"\`\`\n# Email (simplified)\n^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\n\n# URL\nhttps?://[^\\s/$.?#].[^\\s]*\n\n# Phone (US)\n\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\n\n# Date (YYYY-MM-DD)\n\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\n\n# IP Address\n\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b\n\n# Strong Password (8+ chars, upper, lower, digit, special)\n^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$\n\`\`\`\n\n## Syntax Reference\n| Pattern | Meaning |\n|---------|--------|\n| \\d | Digit [0-9] |\n| \\w | Word char [a-zA-Z0-9_] |\n| \\s | Whitespace |\n| . | Any char except newline |\n| + | One or more |\n| * | Zero or more |\n| ? | Zero or one |\n| {n,m} | Between n and m |\n| (?=...) | Positive lookahead |\n| (?!...) | Negative lookahead |\n| (?:...) | Non-capturing group |\n\n## Testing\n- regex101.com for interactive testing\n- Use named groups for readability: \`(?<year>\\d{4})\``,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: ERROR HANDLING / DEBUGGING
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "error-handling",
    description: "Error handling and resilience patterns — covers exception hierarchies, error boundaries, retry strategies, circuit breakers, graceful degradation, and user-friendly error messages.",
    trigger_phrases: ["error handling", "exception handling", "retry logic", "graceful degradation", "error boundary"],
    tags: ["error-handling", "resilience", "patterns", "development"],
    source_url: null,
    markdown_instructions: "# Error Handling Patterns\\n\\n## Error Hierarchy\\n\\"\`\`typescript\nclass AppError extends Error {\n  constructor(\n    message: string,\n    public code: string,\n    public statusCode: number,\n    public isOperational: boolean = true\n  ) {\n    super(message);\n  }\n}\n\nclass ValidationError extends AppError {\n  constructor(message: string) {\n    super(message, "VALIDATION_ERROR", 400);\n  }\n}\n\nclass NotFoundError extends AppError {\n  constructor(resource: string) {\n    super(\`\${resource} not found\`, "NOT_FOUND", 404);\n  }\n}\n\`\`\`\n\n## Retry with Exponential Backoff\n\`\`\`typescript\nasync function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {\n  for (let i = 0; i <= maxRetries; i++) {\n    try { return await fn(); }\n    catch (err) {\n      if (i === maxRetries) throw err;\n      await sleep(Math.pow(2, i) * 1000 + Math.random() * 1000);\n    }\n  }\n}\n\`\`\`\n\n## React Error Boundaries\n- Catch rendering errors in component tree\n- Show fallback UI instead of blank screen\n- Log errors to monitoring service\n\n## Best Practices\n- Distinguish operational vs programmer errors\n- Never swallow errors silently\n- Include context in error messages\n- Log stack traces in development, not production\n- Return user-friendly messages to clients`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: BLOCKCHAIN / WEB3
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "smart-contract-security",
    description: "Smart contract security best practices — covers common vulnerabilities (reentrancy, overflow), testing patterns, static analysis with Slither, fuzzing, and audit workflows.",
    trigger_phrases: ["smart contract", "solidity", "blockchain security", "reentrancy", "contract audit"],
    tags: ["blockchain", "security", "solidity", "web3", "audit"],
    source_url: "https://github.com/trailofbits/skills/tree/main/skills/building-secure-contracts",
    markdown_instructions: "# Smart Contract Security\\n\\n## Common Vulnerabilities\\n\\n### Reentrancy\\n\\"\`\`solidity\n// BAD: State update after external call\nfunction withdraw() external {\n    (bool success, ) = msg.sender.call{value: balances[msg.sender]}("");\n    balances[msg.sender] = 0;  // Too late!\n}\n\n// GOOD: Checks-Effects-Interactions pattern\nfunction withdraw() external {\n    uint amount = balances[msg.sender];\n    balances[msg.sender] = 0;  // Update state first\n    (bool success, ) = msg.sender.call{value: amount}("");\n    require(success);\n}\n\`\`\`\n\n### Integer Overflow/Underflow\n- Use Solidity 0.8+ (built-in checks)\n- Or SafeMath library for older versions\n\n### Access Control\n- Use OpenZeppelin's Ownable/AccessControl\n- Validate msg.sender in all sensitive functions\n\n## Analysis Tools\n- **Slither**: Static analysis for Solidity\n- **Echidna**: Property-based fuzzer\n- **Mythril**: Symbolic execution\n- **Foundry**: Testing framework with fuzzing\n\n## Audit Process\n1. Threat modeling\n2. Automated scanning (Slither, Mythril)\n3. Manual review of business logic\n4. Fuzzing critical functions\n5. Formal verification for critical math`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: NOTIFICATIONS / COMMUNICATION
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "notification-systems",
    description: "Multi-channel notification architecture — covers email, SMS, push notifications, in-app messaging, preference management, and template systems.",
    trigger_phrases: ["notifications", "email sending", "push notifications", "SMS", "notification system"],
    tags: ["notifications", "email", "sms", "push", "communication"],
    source_url: "https://github.com/trycourier/courier-skills",
    markdown_instructions: "# Notification System Design\\n\\n## Channel Selection\\n| Channel | Use Case | Latency |\\n|---------|----------|---------|\\n| Push | Time-sensitive alerts | Instant |\\n| Email | Detailed content, receipts | Minutes |\\n| SMS | Critical alerts, 2FA | Seconds |\\n| In-App | Feature updates, activity | Instant |\\n| Slack/Teams | Team collaboration | Instant |\\n\\n## Architecture\\n\\"\`\`\nApp → Notification Service → Channel Router → Provider\n                ↓\n        Template Engine\n                ↓\n        Preference Check\n\`\`\`\n\n## Key Components\n\n### Template System\n- Use template variables: \`{{user.name}}\`\n- Support i18n/localization\n- Preview before sending\n- Version templates\n\n### Preference Management\n- Per-channel opt-in/opt-out\n- Frequency controls (digest vs real-time)\n- Quiet hours / DND support\n- Unsubscribe with one click\n\n### Delivery Tracking\n- Track sent, delivered, opened, clicked\n- Handle bounces and failures\n- Retry with exponential backoff\n- Fallback channel if primary fails\n\n## Best Practices\n- Never send without user consent\n- Include unsubscribe in every message\n- Batch non-urgent notifications\n- Rate limit per user per channel`,
  },

  {
    name: "social-media-publishing",
    description: "Create, schedule, and publish social media content across X, LinkedIn, Threads, Bluesky, and Mastodon — covers content formatting, scheduling, analytics, and multi-platform workflows.",
    trigger_phrases: ["social media", "tweet", "LinkedIn post", "schedule post", "content publishing"],
    tags: ["social-media", "content", "marketing", "publishing"],
    source_url: "https://github.com/typefully/skills/tree/main/skills/typefully",
    markdown_instructions: "# Social Media Publishing\\n\\n## Platform-Specific Formatting\\n\\n### X (Twitter)\\n- 280 character limit\\n- Use threads for long-form content\\n- Rich media: images, videos, polls\\n- Hashtags: 1-3 per post max\\n\\n### LinkedIn\\n- 3000 character limit\\n- Professional tone\\n- Use line breaks for readability\\n- Tag people and companies\\n\\n### Threads\\n- 500 character limit\\n- Casual, conversational tone\\n- Image-first content performs well\\n\\n## Content Strategy\\n- Write for one platform, adapt for others\\n- Best posting times: 9-11 AM and 7-9 PM local\\n- Engagement triggers: questions, polls, opinions\\n- 80/20 rule: 80% value, 20% promotion\\n\\n## Scheduling\\n- Queue posts in advance (1-2 weeks)\\n- Space posts 4-6 hours apart\\n- Cross-post with platform-specific tweaks\\n- Use analytics to find optimal timing\\n\\n## Analytics\\n- Track impressions, engagement rate, follower growth\\n- Identify top-performing content formats\\n- A/B test headlines and CTAs\\n- Monthly reporting dashboard",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: GRADIO / ML DEMOS
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "gradio-apps",
    description: "Build interactive ML demos and dashboards with Gradio — covers input/output types, layout, theming, authentication, API endpoints, and deployment to Hugging Face Spaces.",
    trigger_phrases: ["gradio", "ML demo", "interactive demo", "hugging face spaces", "gradio interface"],
    tags: ["gradio", "ml", "demo", "frontend", "huggingface"],
    source_url: "https://github.com/huggingface/skills/tree/main/skills/huggingface-gradio",
    markdown_instructions: "# Gradio Application Guide\\n\\n## Quick Start\\n\\"\`\`python\nimport gradio as gr\n\ndef greet(name: str, intensity: int) -> str:\n    return "Hello, " + name + "!" * intensity\n\ndemo = gr.Interface(\n    fn=greet,\n    inputs=["text", gr.Slider(1, 10)],\n    outputs="text",\n    title="Greeting Generator",\n)\ndemo.launch()\n\`\`\`\n\n## Blocks API (Advanced Layout)\n\`\`\`python\nwith gr.Blocks(theme=gr.themes.Soft()) as demo:\n    with gr.Row():\n        with gr.Column():\n            input_text = gr.Textbox(label="Input")\n            submit_btn = gr.Button("Process", variant="primary")\n        with gr.Column():\n            output_text = gr.Textbox(label="Output")\n    \n    submit_btn.click(fn=process, inputs=input_text, outputs=output_text)\n\`\`\`\n\n## Deployment\n\`\`\`bash\n# Deploy to Hugging Face Spaces\ngradio deploy --title "My App" --app-file app.py\n\`\`\`\n\n## Key Features\n- Auto-generates API endpoint for every function\n- Built-in queuing for concurrent requests\n- File upload/download support\n- Real-time streaming output\n- Authentication with username/password`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: CONTENT MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "content-modeling",
    description: "Content modeling patterns for headless CMS — covers schema design, content types, references, localization, content lifecycle, and editorial workflows.",
    trigger_phrases: ["content modeling", "CMS", "headless CMS", "content types", "content architecture"],
    tags: ["cms", "content", "architecture", "sanity"],
    source_url: "https://github.com/sanity-io/skills/tree/main/skills/content-modeling-best-practices",
    markdown_instructions: "# Content Modeling Guide\\n\\n## Design Principles\\n\\n### 1. Content Structure\\n- Separate content from presentation\\n- Model content types by business domain\\n- Use references over embedded content for reuse\\n- Plan for multi-channel delivery (web, mobile, API)\\n\\n### 2. Field Types\\n| Type | Use For |\\n|------|--------|\\n| String | Titles, names, slugs |\\n| Text | Short descriptions |\\n| Rich Text | Long-form content with formatting |\\n| Image | Media with alt text and metadata |\\n| Reference | Links to other documents |\\n| Array | Lists, tags, ordered collections |\\n| Object | Grouped fields (address, SEO) |\\n\\n### 3. Relationships\\n- **One-to-One**: Reference field\\n- **One-to-Many**: Array of references\\n- **Many-to-Many**: Bi-directional references\\n- Prefer weak references for cross-type links\\n\\n## Content Lifecycle\\n1. **Draft**: Work in progress\\n2. **Review**: Awaiting editorial approval\\n3. **Published**: Live on site\\n4. **Archived**: Removed from site, preserved\\n\\n## Localization\\n- Document-level: Separate documents per locale\\n- Field-level: Localized fields within same document\\n- Consider translation workflows and fallback chains",
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY: NICHE / SPECIALIZED
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "clickhouse-analytics",
    description: "ClickHouse best practices for real-time analytics — covers table engines (MergeTree), materialized views, query optimization, data ingestion, and architecture design.",
    trigger_phrases: ["clickhouse", "analytics database", "OLAP", "real-time analytics", "columnar database"],
    tags: ["clickhouse", "analytics", "database", "big-data", "performance"],
    source_url: "https://github.com/clickhouse/skills/tree/main/skills/clickhouse-best-practices",
    markdown_instructions: "# ClickHouse Best Practices\\n\\n## Table Engines\\n- **MergeTree**: Default for analytics tables\\n- **ReplacingMergeTree**: Deduplication by version\\n- **AggregatingMergeTree**: Pre-aggregated rollups\\n- **SummingMergeTree**: Auto-summing on merge\\n\\n## Schema Design\\n\\"\`\`sql\nCREATE TABLE events (\n    event_date Date,\n    event_time DateTime,\n    user_id UInt64,\n    event_type LowCardinality(String),\n    properties String\n) ENGINE = MergeTree()\nPARTITION BY toYYYYMM(event_date)\nORDER BY (event_type, user_id, event_time);\n\`\`\`\n\n## Performance Rules\n- ORDER BY columns should match your most common query filters\n- Use \`LowCardinality(String)\` for columns with < 10K distinct values\n- Partition by date for time-series data\n- Use materialized views for pre-computation\n- Avoid JOINs where possible (denormalize)\n\n## Data Ingestion\n- Batch inserts (1000+ rows per INSERT)\n- Use async inserts for high-frequency producers\n- Kafka engine for streaming ingestion\n- Use Buffer engine for write smoothing`,
  },

  {
    name: "neon-serverless-postgres",
    description: "Neon serverless Postgres — covers branching, connection pooling, autoscaling, data API, and development workflows with instant database provisioning.",
    trigger_phrases: ["neon", "serverless postgres", "neon database", "database branching", "neon connection"],
    tags: ["neon", "postgres", "serverless", "database"],
    source_url: "https://github.com/neondatabase/skills/tree/main/skills/neon-postgres",
    markdown_instructions: "# Neon Serverless Postgres\\n\\n## Key Features\\n- **Serverless**: Auto-scales to zero, pay for compute used\\n- **Branching**: Instant database copies for dev/test\\n- **Connection Pooling**: Built-in with serverless driver\\n\\n## Connection\\n\\"\`\`ts\nimport { neon } from '@neondatabase/serverless';\n\nconst sql = neon(process.env.DATABASE_URL!);\nconst users = await sql\`SELECT * FROM users WHERE active = true\`;\n\`\`\`\n\n## Branching Workflow\n\`\`\`bash\n# Create branch from production for development\nneonctl branches create --name feature/auth --parent main\n\n# Get connection string\nneonctl connection-string feature/auth\n\n# Delete when done\nneonctl branches delete feature/auth\n\`\`\`\n\n## Best Practices\n- Use connection pooling for serverless environments\n- Create branches per PR for isolated testing\n- Use Neon's branching instead of seed scripts\n- Set compute auto-suspend timeout (5 min for dev)\n- Use read replicas for analytics queries`,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Batch insert
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🚀 Inserting ${skills.length} skills into Supabase...\n`);
  
  let success = 0;
  let failed = 0;
  const errors = [];

  // Insert in batches of 10
  for (let i = 0; i < skills.length; i += 10) {
    const batch = skills.slice(i, i + 10);
    const { data, error } = await supabase
      .from('skills')
      .insert(batch.map(s => ({
        name: s.name,
        description: s.description,
        trigger_phrases: s.trigger_phrases,
        markdown_instructions: s.markdown_instructions,
        tags: s.tags,
        script_urls: [],
        source_url: s.source_url,
      })))
      .select('name');

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/10) + 1} failed:`, error.message);
      // Try inserting individually
      for (const skill of batch) {
        const { error: singleErr } = await supabase
          .from('skills')
          .insert({
            name: skill.name,
            description: skill.description,
            trigger_phrases: skill.trigger_phrases,
            markdown_instructions: skill.markdown_instructions,
            tags: skill.tags,
            script_urls: [],
            source_url: skill.source_url,
          });
        if (singleErr) {
          console.error(`    ❌ ${skill.name}: ${singleErr.message}`);
          errors.push(skill.name);
          failed++;
        } else {
          console.log(`    ✅ ${skill.name}`);
          success++;
        }
      }
    } else {
      const names = data?.map(d => d.name).join(', ') || batch.map(s => s.name).join(', ');
      console.log(`  ✅ Batch ${Math.floor(i/10) + 1}: ${names}`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed out of ${skills.length} total`);
  if (errors.length > 0) {
    console.log(`❌ Failed skills: ${errors.join(', ')}`);
  }

  // Verify
  const { data: countData } = await supabase.from('skills').select('id', { count: 'exact' });
  console.log(`\n🔍 Total skills in database: ${countData?.length || 0}`);
}

run().catch(console.error);
