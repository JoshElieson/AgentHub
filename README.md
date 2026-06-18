# Nuclexa

**A cross-platform registry and marketplace for installable AI agent capabilities.**

Nuclexa is a full-stack marketplace for discovering, publishing, versioning, reviewing, and installing:

* AI agents
* Claude skills
* MCP servers
* Cursor and Windsurf rules
* Agent workflows
* Prompt packs

The platform is designed as a combination of **npm, GitHub, the VS Code Marketplace, and Hugging Face**, built specifically for reusable AI-agent tooling across Claude Code, Claude Desktop, Cursor, Windsurf, OpenAI Agents, MCP, and other agent platforms.

> **Current status:** Nuclexa is a polished MVP with a complete product architecture, responsive marketplace interface, production-ready data model, authentication infrastructure, and realistic seeded data. It runs locally without external services or credentials.

---

## Project highlights

* Built a multi-platform package marketplace using **Next.js 15, React 19, and strict TypeScript**
* Designed a normalized **Prisma/PostgreSQL schema** for packages, versions, files, reviews, installations, organizations, and collections
* Created a unified `agent.json` package format for representing installable AI capabilities across different platforms
* Implemented marketplace search, filtering, sorting, package pages, creator profiles, organizations, collections, and publishing workflows
* Architected the frontend around a replaceable typed query layer, allowing mock data to be exchanged for Prisma queries without modifying UI components
* Added GitHub and Google authentication infrastructure with graceful fallback to a deterministic local development session
* Designed a permission and risk model for packages requesting filesystem, command execution, network, or environment access
* Built a responsive, dark-first design system with reusable components and consistent marketplace interaction patterns

---

## Screens and functionality

### Marketplace discovery

The marketplace supports:

* Full-text package search
* Filtering by package type, platform, category, license, and pricing
* Sorting by popularity, rating, recency, and installation count
* Trending packages and new releases
* Curated collections
* Security-focused package discovery
* Verified organizations and creator profiles

### Package pages

Each package includes dedicated sections for:

* Overview and documentation
* Package files
* Version history
* Reviews and ratings
* Issues
* Community discussions
* Supported platforms
* Requested permissions
* Installation commands

### Publishing workflow

Nuclexa includes a five-step publishing flow:

1. Select a package type
2. Import files or a repository
3. Configure metadata and supported platforms
4. Declare permissions and security requirements
5. Preview and publish the package

### User features

The application includes interfaces for:

* OAuth authentication
* User and organization profiles
* Following creators
* Package installation history
* Favorites
* Collections
* Package management
* Profile and account settings

---

## Technology stack

| Area           | Technology                                          |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 15 App Router                               |
| Frontend       | React 19                                            |
| Language       | TypeScript with strict type checking                |
| Styling        | Tailwind CSS 3                                      |
| Database       | Prisma ORM with PostgreSQL                          |
| Authentication | Auth.js / NextAuth                                  |
| Validation     | Zod                                                 |
| Icons          | Lucide React                                        |
| Architecture   | React Server Components and typed data-access layer |

---

## Architecture

```text
src/
├── app/                    # Next.js routes and server components
├── components/
│   ├── ui/                 # Reusable design-system primitives
│   └── ...                 # Marketplace and application components
├── lib/
│   ├── auth.ts             # Authentication configuration
│   ├── session.ts          # Development-session fallback
│   ├── types.ts            # Shared domain types
│   ├── taxonomy.ts         # Package and permission metadata
│   ├── utils.ts            # Formatting and utility functions
│   └── data/               # Typed data-access and query layer
└── prisma/
    └── schema.prisma       # Production relational data model
```

The UI communicates with a single typed query layer located in `src/lib/data`.

```text
UI components
      ↓
Typed query interface
      ↓
Mock data or Prisma/PostgreSQL
```

This separation keeps components independent of the persistence implementation. Moving from seeded mock data to a production database requires replacing the query implementations rather than rewriting the interface.

---

## Data model

The Prisma schema models the primary entities required by a production package registry:

* Users and authentication accounts
* Organizations and organization membership
* Agent packages
* Semantic package versions
* Package files
* Reviews and ratings
* Issues and discussions
* Collections
* Installations
* Favorites
* Categories and tags
* Creator follows

The schema is designed for PostgreSQL and can be adapted for SQLite during lightweight local development.

---

## Cross-platform package standard

Nuclexa defines an `agent.json` manifest for describing reusable AI capabilities consistently across agent platforms.

```json
{
  "name": "security-review",
  "displayName": "Security Review Agent",
  "version": "1.0.0",
  "type": "agent",
  "description": "Reviews code for OWASP, authentication, secret-management, and AI-agent security risks.",
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

The manifest records:

* Package identity and semantic version
* Capability type
* Supported platforms
* Entry point
* License
* Filesystem access
* Command-execution access
* Network access
* Environment-variable access

This allows the registry to display security information before installation and gives a future CLI enough metadata to install packages into platform-specific locations.

---

## CLI design

The planned Nuclexa CLI uses one installation command across supported platforms:

```bash
npx nuclexa install security-review --target claude
npx nuclexa install security-review --target cursor
npx nuclexa install security-review --target forge
```

Target-specific installations would resolve to the appropriate platform directory:

```text
Claude Code  → .claude/skills/security-review
Cursor       → .cursor/rules/security-review.mdc
FORGE        → .forge/agents/security-review
Generic      → .nuclexa/security-review
```

The marketplace already presents these installation commands and models the metadata required for the CLI.

---

## Authentication

Nuclexa includes an Auth.js architecture supporting GitHub and Google OAuth.

Authentication behavior degrades gracefully depending on the available configuration:

| Configuration                  | Behavior                                           |
| ------------------------------ | -------------------------------------------------- |
| Database and OAuth credentials | Persistent users, accounts, sessions, and profiles |
| OAuth credentials only         | Stateless JWT authentication                       |
| No environment variables       | Deterministic mock development session             |

This makes the complete interface navigable immediately while preserving a direct path to production authentication.

With a configured database, the architecture supports:

* OAuth sign-in and sign-out
* Persistent sessions
* Automatically generated usernames
* Imported GitHub profile information
* Editable user profiles
* Connected-account management
* Follow and unfollow relationships
* Account deletion

---

## Routes

| Route                 | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `/`                   | Homepage, marketplace statistics, trending packages, releases, and collections |
| `/explore`            | Searchable and filterable package marketplace                                  |
| `/agents/[slug]`      | Package details, files, versions, reviews, issues, and discussions             |
| `/u/[username]`       | Creator profile and published work                                             |
| `/organizations`      | Verified organization directory                                                |
| `/org/[slug]`         | Organization profile                                                           |
| `/collections`        | Curated package collections                                                    |
| `/collections/[slug]` | Collection details                                                             |
| `/dashboard`          | User packages, installations, favorites, collections, and settings             |
| `/publish`            | Multi-step publishing workflow                                                 |
| `/docs`               | Package standard, permission model, and CLI documentation                      |
| `/login`              | GitHub and Google authentication                                               |

---

## Local development

### Requirements

* Node.js 20 or newer
* npm

### Run the application

```bash
git clone https://github.com/JoshElieson/Nuclexa.git
cd Nuclexa
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

No environment variables are required. Nuclexa automatically uses seeded data and mock authentication when external services are unavailable.

### Production build

```bash
npm run build
npm start
```

### Optional database setup

```bash
npx prisma generate
npm run db:push
npm run db:seed
```

---

## Available scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the local development server   |
| `npm run build`     | Create an optimized production build |
| `npm start`         | Run the production server            |
| `npm run typecheck` | Run TypeScript validation            |
| `npm run lint`      | Run linting                          |
| `npm run db:push`   | Apply the Prisma schema              |
| `npm run db:seed`   | Seed development data                |
| `npm run db:studio` | Open Prisma Studio                   |

---

## Current implementation status

The current MVP includes:

* Complete responsive marketplace interface
* Search, filtering, and sorting
* Package, profile, organization, and collection pages
* Package publishing workflow
* Dashboard and account-management interfaces
* Reusable component and design systems
* Typed domain and data-access layers
* Production-oriented Prisma schema
* OAuth and development authentication architecture
* Package manifest and permission standards
* Realistic seeded marketplace content

The following capabilities are represented in the architecture and UI but still require production backend integration:

* Persistent installations, favorites, reviews, and discussions
* Package file storage and GitHub repository importing
* Production Nuclexa CLI
* Automated package security analysis
* Paid package processing
* Production search infrastructure

---

## Engineering focus

Nuclexa explores the infrastructure required to distribute AI-agent capabilities safely across fragmented platforms.

The project focuses on three central engineering problems:

1. **Portability**
   Representing Claude skills, MCP servers, editor rules, prompts, and agents through a common package model.

2. **Security**
   Making requested filesystem, command, network, and environment permissions visible before installation.

3. **Extensibility**
   Separating UI, domain types, data access, authentication, and persistence so individual systems can evolve independently.

---

## Future development

Planned next steps include:

* Connect the typed query layer to PostgreSQL through Prisma
* Publish the `nuclexa` npm CLI
* Add package archive storage and GitHub importing
* Persist reviews, discussions, installations, and favorites
* Implement automated package permission analysis
* Add package signing and publisher verification
* Introduce download analytics and package dependency tracking
* Support paid packages and organization billing
