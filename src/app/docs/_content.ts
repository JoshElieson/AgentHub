// Docs content module. Underscore-prefixed so it is NOT treated as a route.
// `body` is a Markdown string rendered by <MarkdownPanel>.

export type Doc = {
  slug: string;
  title: string;
  description: string;
  body: string;
};

export const DOCS: Doc[] = [
  // 1 ─────────────────────────────────────────────────────────────────────
  {
    slug: "what-is-nuclexa",
    title: "What is Nuclexa?",
    description:
      "The package registry for AI agents and installable AI capabilities, across every major AI tool.",
    body: `# What is Nuclexa?

**Nuclexa is the package registry for AI agents and installable AI capabilities.** If npm is where you get JavaScript packages and the VS Code Marketplace is where you get editor extensions, Nuclexa is where you get the installable building blocks that make AI assistants useful inside real projects — agents, skills, MCP servers, rules, workflows, prompt packs, and more.

Today these capabilities live scattered across gists, blog posts, private Notion pages, and copy-pasted system prompts. There is no shared format, no versioning, no permission model, and no way to know whether something you found online is safe to run against your codebase. Nuclexa fixes that with a **standard package format**, a **registry to publish and discover packages**, and a **CLI to install them into any AI tool**.

## What you can do

- **Discover** trusted packages across every major platform — Claude Code, Claude Desktop, Cursor, Windsurf, OpenAI Agents, Gemini CLI, GitHub Copilot, Replit Agent, and any MCP-compatible client.
- **Install** any package with a single command into the tool of your choice — or export it to a tool's native format.
- **Publish** your own capabilities with semver versioning, changelogs, and a declared permission scope.
- **Audit** exactly what a package can do before you run it: every package surfaces its permissions, risk level, license, and source.

## Core principles

1. **Trust by default.** Every package declares the permissions it needs. We compute a risk level from that declaration and surface it everywhere — search results, package pages, and the install dialog.
2. **Portable, not platform-locked.** A package is a directory of plain files, not a vendor blob. The same package installs to Claude Code, Cursor, or Gemini, and exports to Copilot or OpenAI Agents.
3. **Versioned and reproducible.** Packages use semver. Pin a version, read its changelog, and roll forward or back deterministically.
4. **Open format.** The package format is documented, simple, and yours. There is no proprietary runtime you are forced to adopt.

## A package in one minute

A package is just a directory with a manifest and some content:

\`\`\`text
security-review/
  agent.json         # manifest: name, version, type, platforms, permissions
  README.md          # human-facing overview
  instructions.md    # the actual entry point loaded by the tool
  permissions.json   # declared permission scope (optional override)
  examples/          # example prompts and transcripts
\`\`\`

Install it from the registry with the CLI:

\`\`\`bash
npx nuclexa install security-review --target claude-code
\`\`\`

> New here? Read [Installable AI capabilities](/docs/installable-capabilities) next, then the [agent.json manifest](/docs/agent-json) reference.`,
  },

  // 2 ─────────────────────────────────────────────────────────────────────
  {
    slug: "installable-capabilities",
    title: "Installable AI capabilities",
    description:
      "What an installable AI capability is, and the package types Nuclexa supports.",
    body: `# Installable AI capabilities

An **installable AI capability** is any reusable unit of behavior you can add to an AI tool: an agent that reviews code, a skill that audits for vulnerabilities, an MCP server that connects to your database, a rule that shapes how your editor writes code, a workflow that ships a release. Nuclexa packages every one of these in the same standard format so it can be discovered, versioned, permission-scoped, and installed anywhere.

The unifying idea: a capability is **content plus a manifest**. The content is what the tool runs (instructions, a server, a set of rules). The manifest declares what it is, which platforms it targets, and what it is allowed to do.

## Supported package types

Nuclexa supports ten capability types. The \`type\` field in [agent.json](/docs/agent-json) determines how a package is categorized and installed.

| Type | \`type\` value | What it is |
| --- | --- | --- |
| Agent | \`agent\` | An autonomous, multi-step agent with tools and instructions. |
| Claude Skill | \`claude-skill\` | A packaged Claude skill (SKILL.md + resources). |
| Cursor Rule | \`cursor-rule\` | Project rules and context for Cursor (\`.mdc\`). |
| MCP Server | \`mcp-server\` | A Model Context Protocol server exposing tools & resources. |
| Workflow | \`workflow\` | A multi-step or multi-agent orchestration. |
| Prompt Pack | \`prompt-pack\` | A curated, versioned collection of prompts and instructions. |
| Custom Mode | \`custom-mode\` | A reusable editor/assistant mode with its own behavior. |
| Tool Adapter | \`tool-adapter\` | A connector that wires an agent to an external tool or API. |
| Agent Template | \`agent-template\` | A starter scaffold for building a new agent. |
| Automation | \`automation\` | A triggered or scheduled task that runs without a human in the loop. |

## Choosing a type

Pick the type that matches how the capability is *consumed*, not just what it does:

- If it runs autonomously and decides its own steps → **Agent**.
- If it's a Claude-specific skill bundle → **Claude Skill**.
- If it only shapes an editor's suggestions → **Cursor Rule** or **Custom Mode**.
- If it exposes tools over a protocol → **MCP Server** or **Tool Adapter**.
- If it's a fixed sequence of steps → **Workflow** or **Automation**.
- If it's a set of prompts, or a scaffold to fork → **Prompt Pack** or **Agent Template**.

> Next: see which tools each type can install to in [Platform compatibility](/docs/platform-compatibility).`,
  },

  // 3 ─────────────────────────────────────────────────────────────────────
  {
    slug: "package-format",
    title: "Package format",
    description:
      "The standard file layout every Nuclexa package follows, file by file.",
    body: `# Package format

Every Nuclexa package is a directory of plain files. There is no build step, no proprietary container, and no runtime you must adopt — a package is just text on disk that any platform can read. This keeps packages portable, diffable in git, and easy to review before you run them.

## The standard layout

\`\`\`text
my-agent/
  agent.json          # required — the manifest
  README.md           # required — human-facing overview
  instructions.md     # required — the entry point
  permissions.json    # optional — explicit permission scope
  examples/           # optional — example prompts & transcripts
    basic.md
    advanced.md
  assets/             # optional — images, schemas, reference files
\`\`\`

Only three files are strictly required: \`agent.json\`, \`README.md\`, and the entry file referenced by the manifest (\`instructions.md\` by convention).

## File reference

### agent.json

The **manifest** — the single source of truth for the package's identity, version, type, supported platforms, and declared permissions. The [agent.json manifest](/docs/agent-json) doc documents every field.

### README.md

The **human-facing overview**, rendered on your package page. Explain what it does, who it's for, how to use it, and any setup it needs. Standard Markdown is supported.

### instructions.md

The **entry point** — the content loaded into the tool. For an agent this is the system prompt; for a skill it is the skill definition; for a rule it is the rule body; for a prompt pack it is the prompts. The \`entry\` field in \`agent.json\` points here.

### permissions.json

An **optional explicit permission scope**. Permissions can be declared inline in \`agent.json\`, but a separate file is useful when you want to document each grant with a justification. When both are present, \`permissions.json\` is authoritative. See the [Permissions model](/docs/permissions-model).

### examples/

A directory of **example prompts and transcripts** — the single most effective thing you can add to drive installs.

## File summary

| File | Required | Purpose |
| --- | --- | --- |
| \`agent.json\` | Yes | Manifest — identity, version, type, platforms, permissions |
| \`README.md\` | Yes | Human-facing overview |
| \`instructions.md\` | Yes | Entry point loaded by the tool |
| \`permissions.json\` | No | Explicit, documented permission scope |
| \`examples/\` | No | Example prompts and transcripts |
| \`assets/\` | No | Images, schemas, and reference files |

> Next: the [agent.json manifest](/docs/agent-json) reference.`,
  },

  // 4 ─────────────────────────────────────────────────────────────────────
  {
    slug: "agent-json",
    title: "agent.json manifest",
    description:
      "The manifest that defines a package's identity, version, type, platforms, and permissions.",
    body: `# agent.json manifest

The \`agent.json\` manifest is the single source of truth for a package. The registry and CLI parse only this file to understand what your package is, what version it is, which platforms it targets, and what it is allowed to do.

## A complete example

\`\`\`json
{
  "name": "security-review",
  "displayName": "Security Review Agent",
  "version": "1.0.0",
  "type": "agent",
  "description": "Reviews code for OWASP, auth, secrets, and AI-agent security risks.",
  "platforms": [
    "claude-code",
    "cursor",
    "openai-agents",
    "mcp"
  ],
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
\`\`\`

## Field reference

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| \`name\` | string | Yes | Unique registry slug. Lowercase, hyphenated (e.g. \`security-review\`). This is what users install. |
| \`displayName\` | string | No | Human-readable title. Falls back to \`name\`. |
| \`version\` | string | Yes | Semver version (\`MAJOR.MINOR.PATCH\`). Each publish must bump this. |
| \`type\` | enum | Yes | One of \`agent\`, \`claude-skill\`, \`cursor-rule\`, \`mcp-server\`, \`workflow\`, \`prompt-pack\`, \`custom-mode\`, \`tool-adapter\`, \`agent-template\`, \`automation\`. See [Installable AI capabilities](/docs/installable-capabilities). |
| \`description\` | string | Yes | One-line summary shown in search results. Keep it under ~120 characters. |
| \`platforms\` | string[] | Yes | Target platforms: \`claude-code\`, \`claude-desktop\`, \`cursor\`, \`windsurf\`, \`openai-agents\`, \`gemini-cli\`, \`github-copilot\`, \`replit-agent\`, \`mcp\`. Drives compatibility badges and install targets. |
| \`permissions\` | object | Yes | Declared permission scope. Each key is a boolean. Used to compute the risk level. See [Permissions model](/docs/permissions-model). |
| \`entry\` | string | No | Path to the entry file loaded by the tool. Defaults to \`instructions.md\`. |
| \`license\` | enum | No | \`MIT\`, \`Apache-2.0\`, \`GPL-3.0\`, \`Proprietary\`, or \`Unknown\`. Defaults to \`Unknown\`. |

## Notes on individual fields

### platforms

List every platform your package genuinely supports — not aspirational ones. The marketplace renders a compatibility table from this field, and the CLI uses it to decide which install and export targets are valid. See [Platform compatibility](/docs/platform-compatibility).

### permissions

The \`permissions\` object is the heart of Nuclexa's trust model. Declare only what you truly need: fewer, lower-risk permissions earn a lower risk badge and more installs. Any key you omit defaults to \`false\`.

> Next: the [Permissions model](/docs/permissions-model) explains each permission and how risk is computed.`,
  },

  // 5 ─────────────────────────────────────────────────────────────────────
  {
    slug: "platform-compatibility",
    title: "Platform compatibility",
    description:
      "The platforms Nuclexa supports and how each one installs or exports a package.",
    body: `# Platform compatibility

Nuclexa packages target one open format, but each platform consumes them slightly differently — some **install** in place, others **export** to a tool's native file. A package declares its supported platforms in the \`platforms\` field of [agent.json](/docs/agent-json), which drives the compatibility table shown on its page.

## Supported platforms

| Platform | How it's consumed | Lands at | Method |
| --- | --- | --- | --- |
| Claude Code | Skill / agent | \`.claude/skills/[slug]\` | install |
| Claude Desktop | Desktop skill / MCP server | per-OS path (detected by CLI) | install |
| Cursor | Rule file | \`.cursor/rules/[slug].mdc\` | install |
| Windsurf | Rule / workflow | \`.windsurf/rules/[slug].md\` | install |
| OpenAI Agents | Agents SDK definition | \`agent.json\` | export |
| Gemini CLI | CLI extension | \`~/.gemini/extensions/[slug]\` | install |
| GitHub Copilot | Instructions file | \`.github/copilot-instructions.md\` | export |
| Replit Agent | Agent template | \`.replit/agents/[slug]\` | install |
| MCP-compatible | MCP server | MCP client config | install |

## Install vs. export

- **Install** copies the package into a tool's local directory so the tool loads it directly.
- **Export** translates the package into a tool's native format (an \`agent.json\` for OpenAI Agents, a \`copilot-instructions.md\` for GitHub Copilot). Use it when the target tool doesn't read Nuclexa packages natively.

## Reading the compatibility table

On every package page, the **Compatibility** table shows a row per platform with its status (Supported / Exportable / Partial) and install method. A package only lists platforms it has been built and tested against — if a platform is missing, assume it is unsupported rather than untested.

> Choosing where to install? See [Installation targets](/docs/installing-agents) for the exact commands per platform.`,
  },

  // 6 ─────────────────────────────────────────────────────────────────────
  {
    slug: "permissions-model",
    title: "Permissions model",
    description:
      "The eight permissions a package can request and how they map to a Low / Medium / High risk level.",
    body: `# Permissions model

Every Nuclexa package declares, up front, exactly what it is allowed to do. There are eight permissions. A package's overall **risk level** is the highest risk of any single granted permission. This lets you decide whether something is safe to run before it ever touches your machine.

## The eight permissions

Permissions are declared as a flat object of booleans in \`agent.json\` (or in \`permissions.json\`). Any key you omit defaults to \`false\`.

\`\`\`json
{
  "permissions": {
    "readFiles": true,
    "writeFiles": false,
    "runCommands": false,
    "network": false,
    "env": false,
    "browser": false,
    "gitHistory": false,
    "secrets": false
  }
}
\`\`\`

| Permission | Risk | What it allows |
| --- | --- | --- |
| \`readFiles\` | Low | Read files in the workspace. |
| \`gitHistory\` | Low | Read commit history and diffs. |
| \`writeFiles\` | Medium | Create or modify files in the workspace. |
| \`network\` | Medium | Make outbound network requests. |
| \`browser\` | Medium | Control a browser session. |
| \`runCommands\` | High | Execute commands in your shell. |
| \`env\` | High | Read process environment variables. |
| \`secrets\` | High | Read configured secrets and tokens. |

## Risk levels

- **Low** — read-only or otherwise inert. Safe to try.
- **Medium** — can modify files, reach the network, or drive a browser. Reversible but consequential.
- **High** — can run shell commands or read environment variables and secrets. Treat like running an arbitrary script; install only from sources you trust.

## How risk is computed

\`\`\`text
risk(package) = max( risk(p) for each permission p that is granted )
\`\`\`

So a package requesting only \`readFiles\` (Low) is **Low risk**. Add \`writeFiles\` (Medium) and it becomes **Medium**. Add \`runCommands\` (High) and it becomes **High** — regardless of how many low-risk permissions it also has.

## Designing for trust

1. Start from zero and add only the permissions your package actually exercises.
2. Prefer \`readFiles\` over \`writeFiles\` when you only need to analyze.
3. Avoid \`runCommands\`, \`env\`, and \`secrets\` unless they're genuinely core.
4. Document non-obvious grants in \`permissions.json\` with a \`reason\`.

> A clean, minimal permission scope is the biggest factor in earning the [Security reviewed](/docs/security-review) badge.`,
  },

  // 7 ─────────────────────────────────────────────────────────────────────
  {
    slug: "installing-agents",
    title: "Installation targets",
    description:
      "Install or export any package to Claude Code, Cursor, Gemini, Copilot, MCP, and more.",
    body: `# Installation targets

Installing a package is a single command. The CLI fetches the package from the registry, shows you its permission scope, and writes it to the platform you choose — or exports it to that platform's native format. You can also use the **Install** button on any package page.

## Basic install

\`\`\`bash
npx nuclexa install security-review --target claude-code
\`\`\`

## Targets

Pass \`--target\` to control where the package goes. Use \`install\` for tools that read Nuclexa packages natively, and \`export\` for tools that need their own format.

\`\`\`bash
# Claude Code → .claude/skills/[slug]
npx nuclexa install security-review --target claude-code

# Claude Desktop → per-OS path, detected by the CLI
npx nuclexa install security-review --target claude-desktop

# Cursor → .cursor/rules/[slug].mdc
npx nuclexa install security-review --target cursor

# Windsurf
npx nuclexa install security-review --target windsurf

# OpenAI Agents → agent.json (export)
npx nuclexa export security-review --target openai-agents

# Gemini CLI
npx nuclexa install security-review --target gemini-cli

# GitHub Copilot → .github/copilot-instructions.md (export)
npx nuclexa export security-review --target copilot-instructions

# Replit Agent
npx nuclexa install security-review --target replit-agent

# Any MCP-compatible client
npx nuclexa install security-review --target mcp
\`\`\`

## Where files land

| Target | Path | Method |
| --- | --- | --- |
| Claude Code | \`.claude/skills/[slug]\` | install |
| Claude Desktop | \`~/Library/Application Support/Claude/skills/[slug]\` (detected per-OS) | install |
| Cursor | \`.cursor/rules/[slug].mdc\` | install |
| Windsurf | \`.windsurf/rules/[slug].md\` | install |
| OpenAI Agents | \`agent.json\` | export |
| Gemini CLI | \`~/.gemini/extensions/[slug]\` | install |
| GitHub Copilot | \`.github/copilot-instructions.md\` | export |
| Replit Agent | \`.replit/agents/[slug]\` | install |
| MCP-compatible | MCP client config | install |

Here \`[slug]\` is the package's \`name\`. Installing \`security-review\` to Claude Code writes to \`.claude/skills/security-review\`.

## Reviewing permissions before install

Before writing anything, the CLI prints the package's declared permissions and computed risk level and asks you to confirm. For a high-risk package it requires explicit confirmation. Skip the prompt in trusted automation with \`--yes\`.

## Pinning a version

\`\`\`bash
npx nuclexa install security-review@1.0.0 --target claude-code
\`\`\`

> See the full flag reference in the [CLI reference](/docs/cli-reference).`,
  },

  // 8 ─────────────────────────────────────────────────────────────────────
  {
    slug: "publishing-guide",
    title: "Publishing guide",
    description:
      "Step-by-step: prepare, validate, and publish your package to the Nuclexa registry.",
    body: `# Publishing guide

Publishing to Nuclexa takes minutes. You can publish from the web at [/publish](/publish) or from the CLI.

## 1. Scaffold the package

\`\`\`bash
npx nuclexa init my-agent
\`\`\`

This generates \`agent.json\`, \`README.md\`, \`instructions.md\`, and an \`examples/\` directory. See the [Package format](/docs/package-format).

## 2. Fill in the manifest

Edit \`agent.json\` with your identity, type, target platforms, and permission scope — see the [agent.json manifest](/docs/agent-json).

\`\`\`json
{
  "name": "my-agent",
  "displayName": "My Agent",
  "version": "0.1.0",
  "type": "agent",
  "description": "One line describing what this does.",
  "platforms": ["claude-code", "cursor"],
  "permissions": { "readFiles": true },
  "entry": "instructions.md",
  "license": "MIT"
}
\`\`\`

## 3. Write the content

- **\`instructions.md\`** — the content the tool loads. Keep it focused and self-contained.
- **\`README.md\`** — the overview shown on your package page.
- **\`examples/\`** — at least one realistic example prompt. Packages with examples convert far better.

## 4. Validate locally

\`\`\`bash
npx nuclexa validate
\`\`\`

This checks the manifest schema, confirms the entry file exists, and reports the computed risk level.

## 5. Publish

\`\`\`bash
npx nuclexa login
npx nuclexa publish
\`\`\`

The registry rejects the publish if \`version\` is not greater than the latest published version, so bump it on every release.

## 6. Iterate with versions

| Change | Bump |
| --- | --- |
| Bug fix, no behavior change | patch — \`1.0.0 → 1.0.1\` |
| Backward-compatible addition | minor — \`1.0.0 → 1.1.0\` |
| Breaking change to behavior or permissions | major — \`1.0.0 → 2.0.0\` |

## Checklist before you ship

- [x] \`agent.json\` validates and declares the minimal permission scope
- [x] \`README.md\` clearly explains the package
- [x] At least one example in \`examples/\`
- [x] \`version\` bumped from the last release
- [x] License set appropriately

> Ready? Head to [/publish](/publish), or run \`npx nuclexa publish\`. Want the trust badge? See [Security review](/docs/security-review).`,
  },

  // 9 ─────────────────────────────────────────────────────────────────────
  {
    slug: "security-review",
    title: "Security review",
    description:
      "What the Security reviewed badge checks, and how to request a review for your package.",
    body: `# Security review

The **Security reviewed** badge signals that a package has passed Nuclexa's manual security review. It is one of the strongest trust signals in the marketplace.

## What the badge means

A package with the badge has been read end to end by a reviewer who confirmed that:

- The package does only what its description and \`README.md\` claim.
- Its **declared permissions match its actual behavior** — nothing over-requested, nothing out of scope.
- It contains no obfuscated instructions, prompt-injection traps, or attempts to exfiltrate files, environment variables, or secrets.
- Any network calls go to documented, expected destinations.
- Its examples are honest and reproducible.

The badge is tied to a **specific version**. A new major or minor release re-enters the review queue.

## What the review checks

| Check | What it verifies |
| --- | --- |
| Manifest accuracy | \`agent.json\` is valid and matches behavior |
| Permission minimalism | Every granted permission is actually used |
| Instruction integrity | No hidden, obfuscated, or injection-style instructions |
| Data handling | No unexpected exfiltration of files, \`env\`, or \`secrets\` |
| Network destinations | Outbound calls match what the package documents |
| Examples | Examples are accurate and don't hide risky behavior |

## How to request a review

1. Make sure your package validates and uses the **minimal** permission scope — see the [Permissions model](/docs/permissions-model).
2. Publish the version you want reviewed.
3. Request it from the CLI:

\`\`\`bash
npx nuclexa review request security-review@1.0.0
\`\`\`

4. Address any findings, publish a fixed version, and re-request if needed.

> A clean, minimal package usually clears review on the first pass. Start from the [Publishing guide](/docs/publishing-guide) if you haven't shipped yet.`,
  },

  // 10 ────────────────────────────────────────────────────────────────────
  {
    slug: "cli-reference",
    title: "CLI reference",
    description:
      "Every nuclexa CLI command, its flags, and worked examples.",
    body: `# CLI reference

The \`nuclexa\` CLI is the primary way to install, export, search, publish, and manage packages. Run it without installing anything via \`npx\`:

\`\`\`bash
npx nuclexa <command> [args] [flags]
\`\`\`

## Commands

| Command | Description |
| --- | --- |
| \`install <package>\` | Install a package to a target. Accepts \`name\` or \`name@version\`. |
| \`export <package>\` | Export a package to a tool's native format (OpenAI Agents, Copilot, …). |
| \`search <query>\` | Search the registry and print matching packages. |
| \`publish\` | Publish the package in the current directory. |
| \`list\` | List packages installed in the current project. |
| \`uninstall <package>\` | Remove an installed package from a target. |
| \`update [package]\` | Update one package, or all packages if omitted. |

## Flags

| Flag | Applies to | Description |
| --- | --- | --- |
| \`--target <t>\` | install, export, uninstall, update, list | Platform target: \`claude-code\`, \`claude-desktop\`, \`cursor\`, \`windsurf\`, \`openai-agents\`, \`gemini-cli\`, \`copilot-instructions\`, \`replit-agent\`, \`mcp\`. |
| \`--yes\`, \`-y\` | install, uninstall, update | Skip the permission confirmation prompt. |
| \`--version <v>\` | install | Install a specific version (alternative to \`name@version\`). |
| \`--limit <n>\` | search | Limit the number of search results. |
| \`--json\` | all | Print machine-readable JSON. |
| \`--dry-run\` | install, publish, update | Show what would happen without writing anything. |
| \`--global\`, \`-g\` | install, list | Operate on the global Nuclexa directory. |

## Examples

\`\`\`bash
# Install the latest version into Claude Code
npx nuclexa install security-review --target claude-code

# Install a pinned version into Cursor, skipping the prompt
npx nuclexa install react-refactor-rules@3.2.1 --target cursor --yes

# Export a package as Copilot instructions
npx nuclexa export github-copilot-review --target copilot-instructions

# Find MCP servers
npx nuclexa search mcp --limit 5 --json

# Publish the package in the current directory
npx nuclexa publish
\`\`\`

## Exit codes

| Code | Meaning |
| --- | --- |
| \`0\` | Success |
| \`1\` | Generic error (validation, network, etc.) |
| \`2\` | Package not found |
| \`3\` | Permission confirmation declined |

> See [Installation targets](/docs/installing-agents) for per-platform paths, and the [Publishing guide](/docs/publishing-guide) for the full publish workflow.`,
  },
];

// --- Lookups & helpers ------------------------------------------------------

const bySlug = new Map(DOCS.map((d) => [d.slug, d]));

export function getDoc(slug: string): Doc | undefined {
  return bySlug.get(slug);
}

/** Returns the previous and next docs (in DOCS order) for navigation. */
export function getDocNeighbors(slug: string): { prev?: Doc; next?: Doc } {
  const idx = DOCS.findIndex((d) => d.slug === slug);
  if (idx === -1) return {};
  return {
    prev: idx > 0 ? DOCS[idx - 1] : undefined,
    next: idx < DOCS.length - 1 ? DOCS[idx + 1] : undefined,
  };
}
