# AgentDock

**The package registry for AI agents.** Discover, install, publish, version, and review AI
agents, Claude skills, MCP servers, Cursor rules, workflows, and prompt packs — across every
platform (Claude Code, Claude Desktop, Cursor, Windsurf, FORGE, OpenAI Agents, MCP).

Think **GitHub + npm + VS Code Marketplace + Hugging Face**, focused on installable AI
capabilities. Dark-first, premium, infrastructure-grade.

> This is an MVP foundation: a fully navigable product skeleton with a polished design system
> and high-quality seeded mock data. It runs with **zero secrets** out of the box.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

No environment variables are required — the app falls back to **mock auth / dev mode** and
seeded mock data. To enable real OAuth or a database, copy `.env.example` to `.env` and fill it in.

---

## Tech stack

- **Next.js 15** (App Router, RSC) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** with a custom dark design system
- **Prisma** schema (PostgreSQL-ready; SQLite-friendly) — `prisma/schema.prisma`
- **Auth.js / NextAuth** architecture with GitHub + Google placeholders (mock-mode fallback)
- **Zod** for validation
- **lucide-react** icons
- Zero runtime DB dependency — pages read from a typed mock-data layer (`src/lib/data`)

---

## Routes

| Route | Description |
| --- | --- |
| `/` | Homepage — hero, search, stats, trending, top security, new releases, categories, collections |
| `/explore` | Marketplace — live client-side search, filters (type/platform/category/license/pricing), sort |
| `/agents/[slug]` | Package detail — Overview, Files, Versions, Reviews, Issues, Discussions tabs |
| `/u/[username]` | Creator profile — Agents, Collections, Activity, Reviews |
| `/organizations` | Verified organizations index |
| `/org/[slug]` | Organization profile |
| `/collections` | Curated collections index |
| `/collections/[slug]` | Collection detail |
| `/dashboard` | Overview, My Agents, Installed, Favorites, Collections, Settings |
| `/publish` | 5-step publish wizard (type → import → metadata → permissions → preview) |
| `/docs`, `/docs/[slug]` | Docs incl. the `agent.json` package standard, permissions model, CLI reference |
| `/login` | Sign in with GitHub / Google (mock-mode aware) |
| `/api/auth/[...nextauth]` | NextAuth route handler |

---

## Project structure

```
src/
  app/                 # routes (App Router)
  components/          # reusable UI — AppShell, Navbar, AgentCard, InstallModal, Tabs, …
    ui/                # primitives — Button, Badge, Avatar, RatingStars, CommandBlock, Tabs, …
  lib/
    types.ts           # domain types (mirror the Prisma schema)
    taxonomy.ts        # labels, options, permission/risk metadata
    utils.ts           # cn, formatting, time helpers
    auth.ts / session.ts  # NextAuth options + mock-session fallback
    data/              # seeded mock data + the query layer (getAgent, filterAgents, …)
prisma/
  schema.prisma        # production data model
```

The UI talks to **one query layer** (`src/lib/data`). Swapping mock data for real Prisma
queries means re-implementing those functions — the components don't change.

---

## Data model

`prisma/schema.prisma` defines: `User`, `Organization`, `OrganizationMember`, `AgentPackage`,
`AgentVersion`, `AgentFile`, `Review`, `Issue`, `Discussion`, `Collection`, `CollectionItem`,
`Install`, `Favorite`, `Category`, `Tag`. It's PostgreSQL-ready; for local SQLite, switch the
datasource `provider` and adapt the enum/array fields (notes in the schema header).

```bash
# when you wire up a database:
npx prisma generate
npx prisma db push
```

---

## The package standard (`agent.json`)

```json
{
  "name": "security-review",
  "displayName": "Security Review Agent",
  "version": "1.0.0",
  "type": "agent",
  "description": "Reviews code for OWASP, auth, secrets, and AI-agent security risks.",
  "platforms": ["claude-code", "cursor", "forge"],
  "permissions": {
    "readFiles": true,
    "writeFiles": false,
    "runCommands": false,
    "network": false,
    "env": false
  },
  "entry": "instructions.md",
  "license": "MIT"
}
```

Install targets (mock CLI concept):

```bash
npx agentdock install security-review --target claude    # -> .claude/skills/[agent]
npx agentdock install security-review --target cursor    # -> .cursor/rules/[agent].mdc
npx agentdock install security-review --target forge      # -> .forge/agents/[agent]
npx agentdock install security-review                     # -> .agentdock/[agent]
```

See `/docs` for the full package format, permissions model, and CLI reference.

---

## Auth & profiles

Sign-in is real NextAuth (`src/lib/auth.ts`) with **GitHub + Google** providers and a Prisma
adapter. Providers and the database **only activate when their env vars are present**; with no
secrets the app stays in mock dev mode (a deterministic demo user keeps every surface
navigable). Once configured you get: OAuth sign-in/out, database-backed sessions, auto-created
profiles (unique username + avatar generated on first sign-in, GitHub bio/links imported),
editable profiles, connected-accounts management, follow/unfollow, and account deletion.

### Turn on real sign-in (local)

1. **Database** — point `DATABASE_URL` at a Postgres instance, then:
   ```bash
   npm run db:push     # create the tables (Account, Session, User, Follow, …)
   npm run db:seed     # optional: turn the mock creators into editable DB users
   ```
2. **GitHub OAuth App** — <https://github.com/settings/developers> → *New OAuth App*
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy the Client ID/secret into `GITHUB_ID` / `GITHUB_SECRET`.
3. **Google OAuth client** — <https://console.cloud.google.com/apis/credentials> → *Create
   credentials → OAuth client ID → Web application*
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. A `NEXTAUTH_SECRET` is pre-generated in `.env.local`. Restart `npm run dev`.

Env vars: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `DATABASE_URL`. A ready-to-fill `.env.local` is included.

How it degrades: OAuth keys but no `DATABASE_URL` → sign-in works on stateless JWT sessions
(profiles aren't persisted). No keys → mock dev mode.

---

## Scripts

| Script | Action |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js lint |
| `npm run db:push` | Push the Prisma schema (needs `DATABASE_URL`) |
| `npm run db:seed` | Seed mock creators as editable DB users |
| `npm run db:studio` | Open Prisma Studio |

---

## Assumptions & notes

- **Brand** `AgentDock` is a placeholder. The accent is a restrained violet; the type stack is
  system fonts (premium and offline-safe — like GitHub).
- **Mock data** is intentionally realistic (15 agents, 10 creators, 5 orgs, 6 collections) so
  the product is demoable. Headline homepage stats (17,842 agents, etc.) are illustrative.
- All "actions" (install, follow, publish, configure, uninstall) are **mock interactions** —
  no backend writes yet. The structure is in place to wire them up.

## Remaining TODOs

- Replace the `src/lib/data` query layer with real Prisma queries.
- Implement the real `agentdock` CLI and install targets.
- Persist installs/favorites/reviews/issues/discussions.
- Real file upload + GitHub import in the publish wizard.
- Payments for paid packages; the "Security reviewed" review pipeline.
```
