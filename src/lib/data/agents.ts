import type { AgentPackage } from "../types";
import { materialize, NO_PERMS, type AgentSeed } from "./builders";

// ---------------------------------------------------------------------------
// 15 seeded packages spanning every supported platform and capability type.
// Compact seeds are expanded by `materialize()` into full package objects
// (file trees, version metadata, resolved review authors, install commands).
// ---------------------------------------------------------------------------

const seeds: AgentSeed[] = [
  // 1 ----------------------------------------------------------------------
  {
    slug: "impeccable-ui-reviewer",
    name: "Impeccable UI Reviewer",
    packageId: "impeccable-ui-reviewer",
    shortDescription:
      "Reviews UI diffs for spacing, hierarchy, accessibility, and visual polish.",
    longDescription:
      "A design-engineering agent that reviews frontend changes the way a senior product designer would: it flags inconsistent spacing, weak visual hierarchy, contrast and accessibility failures, and motion that fights the user. It reads your component diffs and returns specific, line-level fixes — never a vague 'make it pop'.",
    type: "agent",
    category: "design",
    platforms: ["claude-code", "cursor", "windsurf", "gemini-cli"],
    permissions: { ...NO_PERMS, readFiles: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "lina-code",
    tags: ["design", "ui", "accessibility", "frontend", "design-review", "css"],
    sourceRepo: "https://github.com/lina-vogel/impeccable-ui-reviewer",
    installCount: 61240,
    weeklyInstalls: 5210,
    stars: 2980,
    ratingAvg: 4.8,
    ratingCount: 186,
    isVerified: true,
    isSecurityReviewed: true,
    isFeatured: true,
    exampleUsage:
      "# Review the current UI change\n\n```bash\nnpx agentdock install impeccable-ui-reviewer --target cursor\n```\n\nThen in Cursor:\n\n> Review this component for spacing, hierarchy, and accessibility.\n\nThe reviewer returns line-level notes grouped by severity — never a vague 'make it pop'.",
    readme: `# Impeccable UI Reviewer

A **read-only** design-engineering reviewer for frontend changes. It evaluates your UI the way a senior product designer would and returns specific, actionable fixes.

## What it checks

- **Spacing & rhythm** — inconsistent padding, magic numbers, broken vertical rhythm
- **Visual hierarchy** — type scale, weight, and emphasis that don't guide the eye
- **Accessibility** — contrast ratios, focus states, hit targets, semantics
- **Motion** — transitions that are too slow, janky, or distracting
- **Consistency** — drift from your design tokens and component patterns

## Why it's safe to run

Requests only \`readFiles\`. It cannot write to your files, run commands, or reach the network — every suggestion is yours to apply.

## Install

\`\`\`bash
npx agentdock install impeccable-ui-reviewer --target claude-code
\`\`\`
`,
    versions: [
      {
        version: "2.3.0",
        releasedAt: "2026-06-04T00:00:00.000Z",
        downloads: 21400,
        size: "44 KB",
        changelog: [
          "Add WCAG 2.2 contrast + focus-visible checks",
          "Detect motion that exceeds 200ms on interaction",
          "Gemini CLI support",
        ],
      },
      {
        version: "2.1.0",
        releasedAt: "2026-03-18T00:00:00.000Z",
        downloads: 24800,
        size: "41 KB",
        changelog: ["Design-token drift detection", "Windsurf support"],
      },
    ],
    reviews: [
      {
        author: "designer_jo",
        rating: 5,
        title: "Like a staff designer in code review",
        body: "It caught a 13px paddings-everywhere problem and an unreadable contrast ratio our team kept shipping. The notes are specific and kind.",
        createdAt: "2026-06-06T00:00:00.000Z",
        helpful: 41,
        version: "2.3.0",
      },
      {
        author: "nextjs_fan",
        rating: 4,
        title: "Great taste, occasionally picky",
        body: "Excellent accessibility coverage. Sometimes flags intentional spacing, but it explains the reasoning so it's easy to dismiss.",
        createdAt: "2026-04-22T00:00:00.000Z",
        helpful: 14,
        version: "2.1.0",
      },
    ],
    issues: [
      {
        title: "Support Tailwind v4 token resolution",
        kind: "feature",
        state: "open",
        author: "designer_jo",
        createdAt: "2026-06-01T00:00:00.000Z",
        comments: 4,
        labels: ["enhancement", "tailwind"],
      },
    ],
    discussions: [
      {
        title: "Wiring the reviewer into a PR template",
        category: "show-and-tell",
        author: "prod_lia",
        createdAt: "2026-05-10T00:00:00.000Z",
        replies: 8,
        upvotes: 33,
        excerpt: "I run it on every UI PR and paste the output into the description. Config inside…",
      },
    ],
    createdAt: "2025-10-02T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
  },

  // 2 ----------------------------------------------------------------------
  {
    slug: "security-review",
    name: "Security Review Agent",
    packageId: "security-review",
    shortDescription:
      "Reviews code for OWASP, auth, secrets, and AI-agent security risks.",
    longDescription:
      "A read-only security reviewer that audits diffs and full repositories for the OWASP Top 10, broken authentication, hardcoded secrets, injection, SSRF, and AI-agent-specific risks like prompt injection and over-broad tool permissions. Designed to run on every pull request.",
    type: "agent",
    category: "security",
    platforms: ["claude-code", "cursor", "openai-agents"],
    permissions: { ...NO_PERMS, readFiles: true, gitHistory: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "ana-li",
    tags: ["security", "owasp", "code-review", "secrets", "appsec", "pr-review"],
    sourceRepo: "https://github.com/ana-li/security-review",
    website: "https://anali.dev/security-review",
    installCount: 132480,
    weeklyInstalls: 9120,
    stars: 6240,
    ratingAvg: 4.9,
    ratingCount: 412,
    isVerified: true,
    isSecurityReviewed: true,
    isFeatured: true,
    compatibility: [
      { platform: "claude-code", status: "supported", installMethod: "CLI install" },
      { platform: "cursor", status: "supported", installMethod: "Cursor rule" },
      { platform: "openai-agents", status: "exportable", installMethod: "agent.json export", notes: "Exported as an Agents SDK definition." },
      { platform: "mcp", status: "unsupported", notes: "Planned for v2.2." },
    ],
    exampleUsage:
      "# Review the current branch\n\n```bash\nnpx agentdock install security-review --target claude-code\n```\n\nThen in Claude Code:\n\n> Run a security review on the pending changes.\n\nThe agent reads the diff, classifies findings by severity, and proposes fixes — without writing to your files.",
    readme: `# Security Review Agent

A **read-only** security reviewer for code and AI agents. It audits diffs and full repositories against the OWASP Top 10 and a catalog of AI-agent-specific risks, then reports findings ranked by severity with concrete remediation.

## What it checks

- **Injection** — SQL, command, template, and prompt injection
- **Broken auth & access control** — missing checks, IDOR, JWT misuse
- **Secrets** — hardcoded keys, tokens, and credentials in code or history
- **SSRF & unsafe fetch** — user-controlled URLs, metadata endpoints
- **AI-agent risks** — over-broad tool permissions, untrusted tool output, prompt-injection surface

## Why it's safe to run

This agent requests only \`readFiles\` and \`gitHistory\`. It **cannot** write to your files, run commands, or reach the network.

## Install

\`\`\`bash
npx agentdock install security-review --target claude-code
\`\`\`

## Example output

| Severity | Finding | Location |
| --- | --- | --- |
| High | Command injection via \`exec(userInput)\` | \`src/api/run.ts:42\` |
| Medium | JWT verified without expiry check | \`src/auth/verify.ts:18\` |
| Low | Verbose error leaks stack trace | \`src/server.ts:120\` |
`,
    versions: [
      {
        version: "2.1.0",
        releasedAt: "2026-05-28T00:00:00.000Z",
        downloads: 41200,
        size: "58 KB",
        changelog: [
          "Add AI-agent permission-scope analysis (flags over-broad tool grants)",
          "Detect prompt-injection sinks in tool outputs",
          "OpenAI Agents export target",
        ],
      },
      {
        version: "2.0.3",
        releasedAt: "2026-03-12T00:00:00.000Z",
        downloads: 52800,
        size: "55 KB",
        changelog: [
          "Fix false positive on parameterized queries using template tags",
          "Improve secret entropy heuristics",
        ],
      },
    ],
    reviews: [
      {
        author: "cto_emma",
        rating: 5,
        title: "Caught a real command-injection before prod",
        body: "We wired this into CI and it flagged an exec() sink on day one that our linters missed. The remediation snippets are accurate and it never touches our files.",
        createdAt: "2026-05-30T00:00:00.000Z",
        helpful: 64,
        version: "2.1.0",
      },
      {
        author: "pentester",
        rating: 5,
        title: "The agent-safety checks are unique",
        body: "Most scanners stop at OWASP. The over-broad-permission and prompt-injection-sink detection is exactly what agent codebases need.",
        createdAt: "2026-04-18T00:00:00.000Z",
        helpful: 41,
        version: "2.0.3",
      },
    ],
    issues: [
      {
        title: "False positive: parameterized query flagged as SQL injection",
        kind: "bug",
        state: "open",
        author: "dataflow",
        createdAt: "2026-06-02T00:00:00.000Z",
        comments: 4,
        labels: ["bug", "false-positive"],
      },
      {
        title: "Feature: SARIF output for GitHub code scanning",
        kind: "feature",
        state: "open",
        author: "sre_kate",
        createdAt: "2026-05-20T00:00:00.000Z",
        comments: 7,
        labels: ["enhancement", "ci"],
      },
    ],
    discussions: [
      {
        title: "How I use this in Claude Code on every PR",
        category: "show-and-tell",
        author: "staff_eng",
        createdAt: "2026-05-12T00:00:00.000Z",
        replies: 18,
        upvotes: 96,
        excerpt: "I added a hook so the review runs on every branch before I push. Here's the exact config and the prompt I use…",
      },
    ],
    createdAt: "2024-09-14T00:00:00.000Z",
    updatedAt: "2026-05-28T00:00:00.000Z",
  },

  // 3 ----------------------------------------------------------------------
  {
    slug: "owasp-audit",
    name: "OWASP Audit Skill",
    packageId: "owasp-audit",
    shortDescription:
      "Deep OWASP Top 10 audit with remediation playbooks and CWE references.",
    longDescription:
      "A focused Claude skill that performs a structured OWASP Top 10 audit of a codebase, mapping each finding to its OWASP category, CWE id, and a remediation playbook with code examples. Built to produce a compliance-ready report before a release.",
    type: "claude-skill",
    category: "security",
    platforms: ["claude-code", "claude-desktop"],
    permissions: { ...NO_PERMS, readFiles: true, gitHistory: true },
    license: "Apache-2.0",
    pricing: "open-source",
    creatorUsername: "ana-li",
    tags: ["owasp", "audit", "security", "cwe", "compliance", "claude-skill"],
    sourceRepo: "https://github.com/ana-li/owasp-audit",
    installCount: 48210,
    weeklyInstalls: 3110,
    stars: 2140,
    ratingAvg: 4.8,
    ratingCount: 168,
    isVerified: true,
    isSecurityReviewed: true,
    readme: `# OWASP Audit Skill

A structured **OWASP Top 10 (2021)** audit packaged as a Claude skill. Each finding is mapped to its OWASP category, CWE id, severity, and a remediation playbook.

## Coverage

A01 Broken Access Control · A02 Cryptographic Failures · A03 Injection · A04 Insecure Design · A05 Security Misconfiguration · A06 Vulnerable Components · A07 Auth Failures · A08 Integrity Failures · A09 Logging Failures · A10 SSRF

## How it works

The skill walks your repository, builds a category-by-category report, and produces a compliance-style summary you can attach to a release.

\`\`\`bash
npx agentdock install owasp-audit --target claude-code
\`\`\`

## Output

Each finding includes: **OWASP category · CWE · severity · evidence · fix**.
`,
    versions: [
      {
        version: "1.5.0",
        releasedAt: "2026-05-09T00:00:00.000Z",
        downloads: 14200,
        changelog: ["Map findings to CWE ids", "Add A04 Insecure Design heuristics"],
      },
      {
        version: "1.4.1",
        releasedAt: "2026-02-18T00:00:00.000Z",
        downloads: 18900,
        changelog: ["Refine SSRF detection", "Faster crypto-misuse checks"],
      },
    ],
    reviews: [
      {
        author: "sre_kate",
        rating: 5,
        title: "Our security sign-off is now one command",
        body: "The CWE mapping and compliance summary saved us hours per release. Auditors love the structured output.",
        createdAt: "2026-05-15T00:00:00.000Z",
        helpful: 33,
        version: "1.5.0",
      },
      {
        author: "hacky",
        rating: 5,
        title: "Pairs perfectly with Security Review Agent",
        body: "Use the agent on PRs, this skill for the full audit before release. Same author, consistent taxonomy.",
        createdAt: "2026-03-22T00:00:00.000Z",
        helpful: 19,
      },
    ],
    issues: [
      {
        title: "Add A05 misconfiguration checks for Next.js headers",
        kind: "feature",
        state: "open",
        author: "nextjs_fan",
        createdAt: "2026-05-25T00:00:00.000Z",
        comments: 2,
        labels: ["enhancement"],
      },
    ],
    discussions: [
      {
        title: "Using the audit output for SOC 2 evidence",
        category: "show-and-tell",
        author: "cto_emma",
        createdAt: "2026-04-14T00:00:00.000Z",
        replies: 9,
        upvotes: 37,
        excerpt: "We attach the compliance summary to our control evidence. Here's how we structure it…",
      },
    ],
    createdAt: "2025-11-20T00:00:00.000Z",
    updatedAt: "2026-05-09T00:00:00.000Z",
  },

  // 4 ----------------------------------------------------------------------
  {
    slug: "react-refactor-rules",
    name: "React Refactor Rules",
    packageId: "react-refactor-rules",
    shortDescription:
      "Cursor rules that steer React edits toward hooks, performance, and modern patterns.",
    longDescription:
      "An opinionated set of Cursor rules (.mdc) that shape how Cursor edits React code: prefer function components and hooks, extract reusable logic, avoid unnecessary re-renders, and adopt current React 19 patterns. Loaded into context so every suggestion follows the same playbook.",
    type: "cursor-rule",
    category: "development",
    platforms: ["cursor"],
    permissions: { ...NO_PERMS, readFiles: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "the-refactorer",
    tags: ["react", "cursor-rule", "refactoring", "hooks", "performance", "typescript"],
    sourceRepo: "https://github.com/samokafor/react-refactor-rules",
    installCount: 89320,
    weeklyInstalls: 6740,
    stars: 4120,
    ratingAvg: 4.6,
    ratingCount: 287,
    isVerified: true,
    isSecurityReviewed: false,
    isFeatured: true,
    readme: `# React Refactor Rules

A drop-in **Cursor rule pack** that makes Cursor edit React the way you'd want a senior engineer to. No agent to run — just rules loaded into Cursor's context.

## What the rules enforce

- Function components with hooks (never new class components)
- Extract custom hooks from tangled \`useEffect\` logic
- Avoid re-renders: stable callbacks, memoization where it pays off, context splitting
- React 19 patterns (\`use\`, Actions, \`useOptimistic\`)
- Strict prop types — no \`any\`

## Install

\`\`\`bash
npx agentdock install react-refactor-rules --target cursor
\`\`\`

Installs to \`.cursor/rules/react-refactor-rules.mdc\`. Open any React file and Cursor follows the rules automatically.
`,
    versions: [
      {
        version: "3.2.1",
        releasedAt: "2026-05-22T00:00:00.000Z",
        downloads: 28400,
        changelog: ["React 19 Actions guidance", "Better context-splitting rules"],
      },
      {
        version: "3.1.0",
        releasedAt: "2026-03-08T00:00:00.000Z",
        downloads: 31200,
        changelog: ["Custom-hook extraction rules", "Tighter re-render guidance"],
      },
    ],
    reviews: [
      {
        author: "nextjs_fan",
        rating: 5,
        title: "Cursor finally writes the React I want",
        body: "Dropped these in and suggestions immediately got cleaner — hooks, stable callbacks, no class components. Zero setup.",
        createdAt: "2026-05-25T00:00:00.000Z",
        helpful: 47,
        version: "3.2.1",
      },
      {
        author: "designer_jo",
        rating: 4,
        title: "Solid, occasionally over-memoizes",
        body: "Great defaults overall. Sometimes pushes useMemo where it isn't needed, but easy to override.",
        createdAt: "2026-04-03T00:00:00.000Z",
        helpful: 15,
        version: "3.1.0",
      },
    ],
    issues: [
      {
        title: "Rule conflicts with a custom forwardRef pattern",
        kind: "bug",
        state: "open",
        author: "staff_eng",
        createdAt: "2026-05-28T00:00:00.000Z",
        comments: 6,
        labels: ["bug", "typescript"],
      },
    ],
    discussions: [
      {
        title: "Combining these with a project rule for our design system",
        category: "q-and-a",
        author: "cto_emma",
        createdAt: "2026-04-22T00:00:00.000Z",
        replies: 14,
        upvotes: 52,
        excerpt: "How do you layer these on top of an existing .cursor/rules set without conflicts?",
        isAnswered: true,
      },
    ],
    createdAt: "2024-11-02T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z",
  },

  // 5 ----------------------------------------------------------------------
  {
    slug: "mcp-filesystem-server",
    name: "MCP Filesystem Server",
    packageId: "mcp-filesystem-server",
    shortDescription:
      "A secure Model Context Protocol server for scoped filesystem access.",
    longDescription:
      "A reference MCP server that exposes read and write filesystem tools to any MCP-compatible client, with path allow-lists, size limits, and audit logging. The safe way to give an agent file access without handing over your whole disk.",
    type: "mcp-server",
    category: "integrations",
    platforms: ["mcp", "claude-desktop", "cursor"],
    permissions: { ...NO_PERMS, readFiles: true, writeFiles: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "kenji",
    orgSlug: "anthropic",
    tags: ["mcp", "filesystem", "server", "tools", "protocol", "integrations"],
    sourceRepo: "https://github.com/anthropics/mcp-filesystem",
    homepage: "https://modelcontextprotocol.io",
    installCount: 104900,
    weeklyInstalls: 7210,
    stars: 5310,
    ratingAvg: 4.8,
    ratingCount: 304,
    isVerified: true,
    isSecurityReviewed: true,
    isFeatured: true,
    compatibility: [
      { platform: "mcp", status: "supported", installMethod: "MCP config" },
      { platform: "claude-desktop", status: "supported", installMethod: "Desktop install" },
      { platform: "cursor", status: "supported", installMethod: "MCP config" },
    ],
    readme: `# MCP Filesystem Server

A production-ready **Model Context Protocol** server that gives agents *scoped* filesystem access. Allow-list the directories, set size limits, and get an audit trail of every read and write.

## Tools exposed

- \`read_file(path)\`
- \`write_file(path, contents)\`
- \`list_dir(path)\`
- \`search(glob)\`

## Security model

- **Path allow-list** — access is denied outside configured roots
- **Size & rate limits** — prevents runaway reads/writes
- **Audit log** — every tool call is recorded

## Install

\`\`\`bash
npx agentdock install mcp-filesystem-server --target mcp
\`\`\`

Then add it to your MCP config and restart the client.
`,
    versions: [
      {
        version: "1.9.0",
        releasedAt: "2026-05-18T00:00:00.000Z",
        downloads: 33800,
        changelog: ["Glob search tool", "Per-root writable flags", "Structured audit log"],
      },
      {
        version: "1.7.2",
        releasedAt: "2026-02-28T00:00:00.000Z",
        downloads: 41200,
        changelog: ["Fix symlink escape outside allow-list", "Faster directory listing"],
      },
    ],
    reviews: [
      {
        author: "ops_diego",
        rating: 5,
        title: "The allow-list is exactly right",
        body: "I can finally give an agent file access without sweating. The symlink-escape fix in 1.7.2 was handled responsibly with a disclosure.",
        createdAt: "2026-05-20T00:00:00.000Z",
        helpful: 52,
        version: "1.9.0",
      },
      {
        author: "kenji",
        rating: 5,
        title: "Reference-quality MCP implementation",
        body: "I point people here when they ask how to build an MCP server. Clean code, good tests, sane defaults.",
        createdAt: "2026-03-15T00:00:00.000Z",
        helpful: 30,
      },
    ],
    issues: [
      {
        title: "Add Windows UNC path support",
        kind: "feature",
        state: "open",
        author: "intern_max",
        createdAt: "2026-06-01T00:00:00.000Z",
        comments: 4,
        labels: ["enhancement", "windows"],
      },
    ],
    discussions: [
      {
        title: "Sharing one server across multiple clients",
        category: "q-and-a",
        author: "dataflow",
        createdAt: "2026-04-30T00:00:00.000Z",
        replies: 8,
        upvotes: 35,
        excerpt: "Is it safe to run a single instance and connect Claude Desktop and Cursor at once?",
        isAnswered: true,
      },
    ],
    createdAt: "2025-09-01T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },

  // 6 ----------------------------------------------------------------------
  {
    slug: "browser-automation-agent",
    name: "Browser Automation Agent",
    packageId: "browser-automation-agent",
    shortDescription:
      "Drives a real browser to test flows, scrape data, and automate web tasks.",
    longDescription:
      "An agent that controls a headless or headed browser to complete web tasks end to end: log in, fill forms, extract structured data, and verify user flows. It plans the steps, executes them against a real page, and reports what it did with screenshots.",
    type: "agent",
    category: "browser-automation",
    platforms: ["claude-code", "openai-agents", "gemini-cli"],
    permissions: { ...NO_PERMS, readFiles: true, network: true, browser: true, runCommands: true },
    license: "Apache-2.0",
    pricing: "free",
    creatorUsername: "marcus-dev",
    tags: ["browser", "automation", "scraping", "playwright", "e2e", "testing"],
    sourceRepo: "https://github.com/marcus-reed/browser-automation-agent",
    installCount: 38900,
    weeklyInstalls: 4480,
    stars: 1920,
    ratingAvg: 4.5,
    ratingCount: 121,
    isVerified: true,
    isSecurityReviewed: false,
    isFeatured: true,
    readme: `# Browser Automation Agent

Give an agent a real browser. It plans and executes multi-step web tasks against a live page and reports back with screenshots.

## What it can do

- **Flow testing** — log in, navigate, fill forms, assert end states
- **Scraping** — extract structured data from rendered pages
- **Repetitive tasks** — anything you'd do by hand across many pages

## Permissions

Requests \`browser\`, \`network\`, and \`runCommands\` to launch and drive a browser in a sandbox. Review the scope before installing.

## Install

\`\`\`bash
npx agentdock install browser-automation-agent --target claude-code
\`\`\`
`,
    versions: [
      {
        version: "1.4.0",
        releasedAt: "2026-06-03T00:00:00.000Z",
        downloads: 12600,
        changelog: ["Screenshot-on-step", "Gemini CLI support", "Retry on flaky selectors"],
      },
      {
        version: "1.2.0",
        releasedAt: "2026-03-27T00:00:00.000Z",
        downloads: 15100,
        changelog: ["Structured-data extraction mode", "OpenAI Agents support"],
      },
    ],
    reviews: [
      {
        author: "qa_lead",
        rating: 5,
        title: "Replaced a pile of brittle scripts",
        body: "It adapts when selectors move and gives me screenshots per step. Our smoke suite is way less flaky now.",
        createdAt: "2026-06-05T00:00:00.000Z",
        helpful: 28,
        version: "1.4.0",
      },
      {
        author: "dataflow",
        rating: 4,
        title: "Great for scraping, watch the permissions",
        body: "Extraction is excellent. Just be deliberate — it runs commands and a browser, so I keep it sandboxed.",
        createdAt: "2026-04-12T00:00:00.000Z",
        helpful: 12,
        version: "1.2.0",
      },
    ],
    issues: [
      {
        title: "Headed mode hangs on Linux without a display",
        kind: "bug",
        state: "open",
        author: "ops_diego",
        createdAt: "2026-06-07T00:00:00.000Z",
        comments: 5,
        labels: ["bug", "linux"],
      },
    ],
    discussions: [
      {
        title: "Scheduling it as a nightly scrape",
        category: "show-and-tell",
        author: "dataflow",
        createdAt: "2026-05-18T00:00:00.000Z",
        replies: 7,
        upvotes: 26,
        excerpt: "I pair it with a cron automation to refresh a dataset every night. Setup in the thread…",
      },
    ],
    createdAt: "2025-12-04T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z",
  },

  // 7 ----------------------------------------------------------------------
  {
    slug: "prompt-injection-tester",
    name: "Prompt Injection Tester",
    packageId: "prompt-injection-tester",
    shortDescription:
      "Red-teams your agent's prompts and tools against injection attacks.",
    longDescription:
      "A red-teaming harness that throws a library of prompt-injection and jailbreak payloads at your agent, then reports which ones changed behavior, leaked context, or triggered unintended tool calls. Run it against your own agents before they ship.",
    type: "agent",
    category: "security",
    platforms: ["claude-code", "cursor", "openai-agents", "mcp"],
    permissions: { ...NO_PERMS, readFiles: true, network: true, runCommands: true },
    license: "MIT",
    pricing: "free",
    creatorUsername: "ana-li",
    tags: ["prompt-injection", "red-team", "security", "jailbreak", "evals", "agent-safety"],
    sourceRepo: "https://github.com/ana-li/prompt-injection-tester",
    installCount: 23800,
    weeklyInstalls: 3990,
    stars: 1510,
    ratingAvg: 4.8,
    ratingCount: 78,
    isVerified: true,
    isSecurityReviewed: true,
    isFeatured: true,
    readme: `# Prompt Injection Tester

A red-team harness for agents. It runs a curated library of injection and jailbreak payloads against your agent and reports what broke.

## Attack classes

- **Direct injection** — "ignore previous instructions" and friends
- **Indirect injection** — payloads hidden in tool output / fetched pages
- **Context exfiltration** — attempts to leak the system prompt or secrets
- **Tool misuse** — coaxing unintended \`runCommands\` / \`network\` calls

## Install

\`\`\`bash
npx agentdock install prompt-injection-tester --target claude-code
\`\`\`

> Requests \`network\` and \`runCommands\` to exercise your agent in a sandbox. Run it against **your own** agents only.

## Report

Each payload is scored: \`blocked\`, \`partial\`, or \`compromised\`, with the transcript and a hardening suggestion.
`,
    versions: [
      {
        version: "0.7.0",
        releasedAt: "2026-06-09T00:00:00.000Z",
        downloads: 7400,
        changelog: ["Indirect-injection payloads via tool output", "MCP target", "Severity scoring"],
      },
      {
        version: "0.5.0",
        releasedAt: "2026-04-15T00:00:00.000Z",
        downloads: 9200,
        changelog: ["Context-exfiltration suite", "OpenAI Agents target"],
      },
    ],
    reviews: [
      {
        author: "pentester",
        rating: 5,
        title: "Found an indirect-injection hole in our RAG agent",
        body: "A payload hidden in a fetched page got our agent to call a tool it shouldn't. Caught before launch. Invaluable.",
        createdAt: "2026-06-11T00:00:00.000Z",
        helpful: 26,
        version: "0.7.0",
      },
      {
        author: "ml_eng",
        rating: 4,
        title: "Strong payload library",
        body: "The indirect-injection cases are the standouts. Sandbox setup took a minute but the docs are clear.",
        createdAt: "2026-05-01T00:00:00.000Z",
        helpful: 11,
        version: "0.5.0",
      },
    ],
    issues: [
      {
        title: "CI mode that fails the build on 'compromised'",
        kind: "feature",
        state: "open",
        author: "sre_kate",
        createdAt: "2026-05-23T00:00:00.000Z",
        comments: 5,
        labels: ["enhancement", "ci"],
      },
    ],
    discussions: [
      {
        title: "Building an injection regression suite",
        category: "show-and-tell",
        author: "pentester",
        createdAt: "2026-05-06T00:00:00.000Z",
        replies: 9,
        upvotes: 34,
        excerpt: "I snapshot the report each release and fail CI if any previously-blocked payload regresses. Setup inside…",
      },
    ],
    createdAt: "2026-01-25T00:00:00.000Z",
    updatedAt: "2026-06-09T00:00:00.000Z",
  },

  // 8 ----------------------------------------------------------------------
  {
    slug: "github-copilot-review",
    name: "GitHub Copilot Review Instructions",
    packageId: "github-copilot-review",
    shortDescription:
      "A Copilot instructions pack that makes code review rigorous and consistent.",
    longDescription:
      "A prompt pack that exports to `.github/copilot-instructions.md`, steering GitHub Copilot's review and chat toward a consistent, senior-level standard: correctness first, then security, tests, and readability. Drop it in and every Copilot suggestion follows the same bar.",
    type: "prompt-pack",
    category: "development",
    platforms: ["github-copilot"],
    permissions: { ...NO_PERMS, readFiles: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "priya-sharma",
    orgSlug: "github",
    tags: ["copilot", "prompt-pack", "code-review", "instructions", "github"],
    sourceRepo: "https://github.com/priyawrites/copilot-review-instructions",
    installCount: 54300,
    weeklyInstalls: 4870,
    stars: 2410,
    ratingAvg: 4.6,
    ratingCount: 159,
    isVerified: true,
    isSecurityReviewed: false,
    readme: `# GitHub Copilot Review Instructions

A **prompt pack** that exports to \`.github/copilot-instructions.md\` so GitHub Copilot reviews and chats at a consistent, senior level.

## What it sets

- **Review priority** — correctness → security → tests → readability
- **House style** — naming, error handling, and comment conventions
- **What to flag** — missing tests, unhandled errors, risky dependencies
- **Tone** — specific and kind, with line references

## Install (export)

\`\`\`bash
npx agentdock export github-copilot-review --target copilot-instructions
\`\`\`

Writes \`.github/copilot-instructions.md\`. Commit it and Copilot picks it up across your repo.
`,
    versions: [
      {
        version: "1.3.0",
        releasedAt: "2026-05-27T00:00:00.000Z",
        downloads: 17800,
        changelog: ["Security-review section", "Test-coverage expectations"],
      },
      {
        version: "1.1.0",
        releasedAt: "2026-03-05T00:00:00.000Z",
        downloads: 19400,
        changelog: ["Tighter review-priority ordering", "House-style section"],
      },
    ],
    reviews: [
      {
        author: "staff_eng",
        rating: 5,
        title: "Copilot reviews got noticeably sharper",
        body: "Committed the file and our PR suggestions immediately leveled up — it actually flags missing tests now.",
        createdAt: "2026-05-29T00:00:00.000Z",
        helpful: 31,
        version: "1.3.0",
      },
      {
        author: "intern_max",
        rating: 4,
        title: "Great baseline to fork",
        body: "Used it as a starting point and tweaked a few rules for our stack. Saved me writing it from scratch.",
        createdAt: "2026-04-02T00:00:00.000Z",
        helpful: 9,
        version: "1.1.0",
      },
    ],
    issues: [
      {
        title: "Add a Python-specific instructions variant",
        kind: "feature",
        state: "open",
        author: "dataflow",
        createdAt: "2026-05-19T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement", "python"],
      },
    ],
    discussions: [
      {
        title: "Per-directory instructions for a monorepo",
        category: "q-and-a",
        author: "cto_emma",
        createdAt: "2026-04-26T00:00:00.000Z",
        replies: 6,
        upvotes: 22,
        excerpt: "Can I scope different instructions to packages/* vs apps/*? What's the convention?",
        isAnswered: true,
      },
    ],
    createdAt: "2025-12-12T00:00:00.000Z",
    updatedAt: "2026-05-27T00:00:00.000Z",
  },

  // 9 ----------------------------------------------------------------------
  {
    slug: "gemini-research-workflow",
    name: "Gemini Research Workflow",
    packageId: "gemini-research-workflow",
    shortDescription:
      "A multi-step Gemini CLI workflow that researches a topic and writes a cited brief.",
    longDescription:
      "A workflow for the Gemini CLI that decomposes a research question, runs parallel searches, reads and cross-checks sources, and synthesizes a cited brief. It separates claims from evidence and flags anything it couldn't verify.",
    type: "workflow",
    category: "research",
    platforms: ["gemini-cli"],
    permissions: { ...NO_PERMS, readFiles: true, writeFiles: true, network: true },
    license: "Apache-2.0",
    pricing: "free",
    creatorUsername: "nadia-q",
    orgSlug: "google",
    tags: ["research", "gemini", "workflow", "synthesis", "citations", "search"],
    sourceRepo: "https://github.com/nadia-quinn/gemini-research-workflow",
    installCount: 31200,
    weeklyInstalls: 3640,
    stars: 1480,
    ratingAvg: 4.7,
    ratingCount: 96,
    isVerified: true,
    isSecurityReviewed: false,
    isFeatured: true,
    readme: `# Gemini Research Workflow

A multi-step **Gemini CLI** workflow that turns a question into a cited brief.

## Steps

1. **Decompose** the question into sub-questions
2. **Search** each in parallel
3. **Read & verify** sources, cross-checking claims
4. **Synthesize** a brief that separates claim from evidence

## Output

A markdown brief with inline citations and a "couldn't verify" section so you know what to trust.

## Install

\`\`\`bash
npx agentdock install gemini-research-workflow --target gemini-cli
\`\`\`

> Requests \`network\` to fetch sources and \`writeFiles\` to save the brief.
`,
    versions: [
      {
        version: "1.2.0",
        releasedAt: "2026-06-01T00:00:00.000Z",
        downloads: 11200,
        changelog: ["Parallel search fan-out", "Couldn't-verify section"],
      },
      {
        version: "1.0.0",
        releasedAt: "2026-03-14T00:00:00.000Z",
        downloads: 13900,
        changelog: ["First stable release", "Inline citations"],
      },
    ],
    reviews: [
      {
        author: "ml_eng",
        rating: 5,
        title: "The verification step is the difference",
        body: "Most research tools confidently make things up. This one separates claims from evidence and tells me what it couldn't confirm.",
        createdAt: "2026-06-03T00:00:00.000Z",
        helpful: 24,
        version: "1.2.0",
      },
      {
        author: "prod_lia",
        rating: 4,
        title: "Great briefs, a little slow",
        body: "The parallel search helps, but deep topics still take a few minutes. Worth the wait for the quality.",
        createdAt: "2026-04-19T00:00:00.000Z",
        helpful: 8,
        version: "1.0.0",
      },
    ],
    issues: [
      {
        title: "Let me cap the number of sources read",
        kind: "feature",
        state: "open",
        author: "ml_eng",
        createdAt: "2026-05-22T00:00:00.000Z",
        comments: 2,
        labels: ["enhancement"],
      },
    ],
    discussions: [
      {
        title: "Using it for competitive analysis",
        category: "show-and-tell",
        author: "founder_v",
        createdAt: "2026-05-09T00:00:00.000Z",
        replies: 6,
        upvotes: 21,
        excerpt: "I feed it a competitor and get a cited landscape brief in minutes. Prompt in the thread…",
      },
    ],
    createdAt: "2026-02-20T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },

  // 10 ---------------------------------------------------------------------
  {
    slug: "replit-app-builder",
    name: "Replit App Builder Agent",
    packageId: "replit-app-builder",
    shortDescription:
      "An agent template that scaffolds and ships a full-stack app on Replit.",
    longDescription:
      "A starter agent template for the Replit Agent runtime. Fork it to scaffold a full-stack app — database, auth, API, and UI — wired for Replit's environment and one-click deploy. Includes sensible defaults you can customize per project.",
    type: "agent-template",
    category: "development",
    platforms: ["replit-agent", "openai-agents"],
    permissions: { ...NO_PERMS, readFiles: true, writeFiles: true, runCommands: true, network: true },
    license: "MIT",
    pricing: "free",
    creatorUsername: "marcus-dev",
    orgSlug: "replit",
    tags: ["replit", "agent-template", "full-stack", "scaffold", "deploy"],
    sourceRepo: "https://github.com/replit/app-builder-agent",
    installCount: 27600,
    weeklyInstalls: 3180,
    stars: 1340,
    ratingAvg: 4.4,
    ratingCount: 88,
    isVerified: true,
    isSecurityReviewed: false,
    readme: `# Replit App Builder Agent

An **agent template** for the Replit Agent runtime. Fork it and scaffold a full-stack app wired for Replit.

## What it scaffolds

- **Database** — schema + migrations
- **Auth** — sessions and protected routes
- **API** — typed endpoints with validation
- **UI** — a starting frontend with routing

## Use it as a template

\`\`\`bash
npx agentdock install replit-app-builder --target replit-agent
\`\`\`

Customize the defaults in \`agent.json\`, then let the Replit Agent build and deploy.
`,
    versions: [
      {
        version: "0.9.0",
        releasedAt: "2026-05-31T00:00:00.000Z",
        downloads: 10800,
        changelog: ["One-click deploy wiring", "Typed API scaffold"],
      },
      {
        version: "0.7.0",
        releasedAt: "2026-03-22T00:00:00.000Z",
        downloads: 12400,
        changelog: ["Auth scaffold", "Migration support"],
      },
    ],
    reviews: [
      {
        author: "founder_v",
        rating: 5,
        title: "Zero to deployed in an afternoon",
        body: "Forked the template, tweaked the schema, and had a working app live on Replit the same day. Great defaults.",
        createdAt: "2026-06-02T00:00:00.000Z",
        helpful: 22,
        version: "0.9.0",
      },
      {
        author: "intern_max",
        rating: 4,
        title: "Good starting point",
        body: "Saved me the boilerplate. Still early — a couple defaults I changed — but a solid base.",
        createdAt: "2026-04-08T00:00:00.000Z",
        helpful: 7,
        version: "0.7.0",
      },
    ],
    issues: [
      {
        title: "Template assumes Node — add a Python variant",
        kind: "feature",
        state: "open",
        author: "dataflow",
        createdAt: "2026-05-15T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement", "python"],
      },
    ],
    discussions: [
      {
        title: "Best way to customize the scaffold per project",
        category: "q-and-a",
        author: "founder_v",
        createdAt: "2026-05-01T00:00:00.000Z",
        replies: 5,
        upvotes: 18,
        excerpt: "Do you edit agent.json or fork the whole template? Looking for the recommended path…",
        isAnswered: true,
      },
    ],
    createdAt: "2026-01-30T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  },

  // 11 ---------------------------------------------------------------------
  {
    slug: "sql-optimizer-agent",
    name: "SQL Optimizer Agent",
    packageId: "sql-optimizer-agent",
    shortDescription:
      "Explains slow queries and rewrites them with the right indexes.",
    longDescription:
      "Paste a slow query and its EXPLAIN plan; the agent identifies the bottleneck, proposes indexes, and rewrites the query — with a before/after cost estimate. Supports Postgres, MySQL, and SQLite.",
    type: "agent",
    category: "data-science",
    platforms: ["claude-code", "cursor", "openai-agents"],
    permissions: { ...NO_PERMS, readFiles: true, network: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "tomas-r",
    orgSlug: "datadog",
    tags: ["sql", "postgres", "performance", "database", "indexes", "query-plan"],
    sourceRepo: "https://github.com/tomas-rivera/sql-optimizer-agent",
    installCount: 46300,
    weeklyInstalls: 3420,
    stars: 1740,
    ratingAvg: 4.7,
    ratingCount: 128,
    isVerified: false,
    isSecurityReviewed: false,
    readme: `# SQL Optimizer Agent

Make slow queries fast. Paste a query and its \`EXPLAIN (ANALYZE, BUFFERS)\` output and get a concrete plan.

## What it does

- Reads the query plan and finds the real bottleneck (seq scans, bad join order, spills)
- Recommends indexes with the exact \`CREATE INDEX\` statements
- Rewrites the query (CTEs, window functions, lateral joins) where it helps
- Estimates before/after cost

## Dialects

Postgres · MySQL · SQLite

## Install

\`\`\`bash
npx agentdock install sql-optimizer-agent --target claude-code
\`\`\`
`,
    versions: [
      {
        version: "1.7.0",
        releasedAt: "2026-05-19T00:00:00.000Z",
        downloads: 13900,
        changelog: ["MySQL 8 plan parsing", "Index bloat warnings"],
      },
      {
        version: "1.5.0",
        releasedAt: "2026-02-25T00:00:00.000Z",
        downloads: 16200,
        changelog: ["Lateral-join rewrites", "Buffers analysis"],
      },
    ],
    reviews: [
      {
        author: "dataflow",
        rating: 5,
        title: "Turned a 9s query into 80ms",
        body: "It spotted a missing composite index and rewrote a correlated subquery as a lateral join. Numbers don't lie.",
        createdAt: "2026-05-22T00:00:00.000Z",
        helpful: 41,
        version: "1.7.0",
      },
      {
        author: "sre_kate",
        rating: 4,
        title: "Excellent for Postgres",
        body: "MySQL support is newer and a little behind, but the Postgres analysis is top-tier.",
        createdAt: "2026-03-18T00:00:00.000Z",
        helpful: 12,
        version: "1.5.0",
      },
    ],
    issues: [
      {
        title: "Support SQL Server execution plans",
        kind: "feature",
        state: "open",
        author: "ops_diego",
        createdAt: "2026-05-24T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement", "mssql"],
      },
    ],
    discussions: [
      {
        title: "Indexing strategy for high-write tables",
        category: "q-and-a",
        author: "sre_kate",
        createdAt: "2026-04-21T00:00:00.000Z",
        replies: 8,
        upvotes: 33,
        excerpt: "The optimizer keeps recommending indexes, but we're write-heavy. How do you balance?",
        isAnswered: true,
      },
    ],
    createdAt: "2025-11-18T00:00:00.000Z",
    updatedAt: "2026-05-19T00:00:00.000Z",
  },

  // 12 ---------------------------------------------------------------------
  {
    slug: "docs-writer-pack",
    name: "Docs Writer Pack",
    packageId: "docs-writer-pack",
    shortDescription:
      "A prompt pack that writes and maintains docs from your code and types.",
    longDescription:
      "A portable prompt pack for generating README sections, API references, and usage guides from your code — and keeping them in sync as the code changes. Installs to Claude Code and Cursor, and exports to Copilot instructions so the same voice follows you everywhere.",
    type: "prompt-pack",
    category: "writing",
    platforms: ["claude-code", "cursor", "github-copilot"],
    permissions: { ...NO_PERMS, readFiles: true, writeFiles: true },
    license: "Apache-2.0",
    pricing: "open-source",
    creatorUsername: "grace-lin",
    orgSlug: "anthropic",
    tags: ["documentation", "prompt-pack", "readme", "api-docs", "technical-writing"],
    sourceRepo: "https://github.com/anthropics/docs-writer-pack",
    installCount: 49600,
    weeklyInstalls: 3760,
    stars: 1980,
    ratingAvg: 4.5,
    ratingCount: 137,
    isVerified: true,
    isSecurityReviewed: false,
    readme: `# Docs Writer Pack

Good docs, generated from the source of truth: your code. A prompt pack that installs to Claude Code and Cursor and exports to Copilot.

## What it writes

- **README** sections (install, usage, configuration, examples)
- **API reference** from types and signatures
- **Guides** and how-tos with runnable examples

## Stays in sync

Run it on a diff and it updates only the affected docs — no full rewrites, no drift.

## Install

\`\`\`bash
npx agentdock install docs-writer-pack --target claude-code
\`\`\`

Prefer Copilot? Export it:

\`\`\`bash
npx agentdock export docs-writer-pack --target copilot-instructions
\`\`\`
`,
    versions: [
      {
        version: "1.6.0",
        releasedAt: "2026-05-13T00:00:00.000Z",
        downloads: 13100,
        changelog: ["Copilot export target", "Diff-scoped updates to avoid drift"],
      },
      {
        version: "1.4.0",
        releasedAt: "2026-02-19T00:00:00.000Z",
        downloads: 15700,
        changelog: ["API reference from TS types", "Voice matching"],
      },
    ],
    reviews: [
      {
        author: "prod_lia",
        rating: 5,
        title: "Our docs finally match the code",
        body: "Diff-scoped updates mean docs stop drifting. It even matched our slightly quirky house style.",
        createdAt: "2026-05-16T00:00:00.000Z",
        helpful: 22,
        version: "1.6.0",
      },
      {
        author: "grace-lin",
        rating: 5,
        title: "Built this for my own sanity",
        body: "As a writer, I wanted automation that respects voice. This keeps the human in the loop where it matters.",
        createdAt: "2026-03-21T00:00:00.000Z",
        helpful: 18,
      },
    ],
    issues: [
      {
        title: "Generate OpenAPI-based endpoint docs",
        kind: "feature",
        state: "open",
        author: "staff_eng",
        createdAt: "2026-05-19T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement", "api"],
      },
    ],
    discussions: [
      {
        title: "Keeping docs in sync via a pre-commit hook",
        category: "show-and-tell",
        author: "prod_lia",
        createdAt: "2026-04-18T00:00:00.000Z",
        replies: 8,
        upvotes: 27,
        excerpt: "I run docs-writer-pack on staged files so docs update with the code. Hook config inside…",
      },
    ],
    createdAt: "2025-11-15T00:00:00.000Z",
    updatedAt: "2026-05-13T00:00:00.000Z",
  },

  // 13 ---------------------------------------------------------------------
  {
    slug: "devops-release-planner",
    name: "DevOps Release Planner",
    packageId: "devops-release-planner",
    shortDescription:
      "Plans releases, drafts changelogs, and assesses deploy risk from your git history.",
    longDescription:
      "A workflow that reads your commit history and CI status to draft a release plan: a categorized changelog, a risk assessment, a rollback plan, and a suggested version bump following semver. Works in Claude Code, exports to OpenAI Agents, and integrates over MCP.",
    type: "workflow",
    category: "devops",
    platforms: ["claude-code", "openai-agents", "mcp"],
    permissions: { ...NO_PERMS, readFiles: true, gitHistory: true, network: true },
    license: "Apache-2.0",
    pricing: "free",
    creatorUsername: "devon-ops",
    orgSlug: "datadog",
    tags: ["devops", "release", "changelog", "semver", "ci", "deployment"],
    sourceRepo: "https://github.com/datadog/release-planner",
    installCount: 41200,
    weeklyInstalls: 2980,
    stars: 1620,
    ratingAvg: 4.5,
    ratingCount: 112,
    isVerified: true,
    isSecurityReviewed: false,
    readme: `# DevOps Release Planner

Turn a pile of commits into a clean release. The workflow reads git history (and optionally CI status) to produce a plan you can ship.

## Outputs

- **Changelog** — grouped by feature / fix / breaking
- **Version bump** — semver recommendation with rationale
- **Risk assessment** — flags risky areas touched since the last tag
- **Rollback plan** — concrete revert steps

## Install

\`\`\`bash
npx agentdock install devops-release-planner --target claude-code
\`\`\`

> Requests \`network\` to read CI status from your provider (optional — works offline from git alone).
`,
    versions: [
      {
        version: "1.6.0",
        releasedAt: "2026-05-14T00:00:00.000Z",
        downloads: 12800,
        changelog: ["Risk assessment from changed-file heatmap", "MCP integration"],
      },
      {
        version: "1.4.0",
        releasedAt: "2026-02-22T00:00:00.000Z",
        downloads: 15100,
        changelog: ["Conventional-commits changelog grouping", "OpenAI Agents export"],
      },
    ],
    reviews: [
      {
        author: "sre_kate",
        rating: 5,
        title: "Our release notes write themselves now",
        body: "The risk heatmap is the killer feature — it correctly flagged the auth refactor as our highest-risk change.",
        createdAt: "2026-05-18T00:00:00.000Z",
        helpful: 24,
        version: "1.6.0",
      },
      {
        author: "ops_diego",
        rating: 4,
        title: "Good, wish it posted to Slack",
        body: "Solid changelogs. Would love a built-in step to post the plan to a channel.",
        createdAt: "2026-03-29T00:00:00.000Z",
        helpful: 11,
        version: "1.4.0",
      },
    ],
    issues: [
      {
        title: "CircleCI status integration",
        kind: "feature",
        state: "open",
        author: "ops_diego",
        createdAt: "2026-05-22T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement", "ci"],
      },
    ],
    discussions: [
      {
        title: "Wiring this into a GitHub Action",
        category: "show-and-tell",
        author: "ops_diego",
        createdAt: "2026-04-19T00:00:00.000Z",
        replies: 6,
        upvotes: 28,
        excerpt: "I run the planner on tag push and open a release PR automatically. Config in the thread…",
      },
    ],
    createdAt: "2025-11-10T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  },

  // 14 ---------------------------------------------------------------------
  {
    slug: "supabase-integration-mcp",
    name: "Supabase Integration MCP",
    packageId: "supabase-integration-mcp",
    shortDescription:
      "An MCP server that connects agents to Supabase Postgres, Auth, and Storage.",
    longDescription:
      "A Model Context Protocol server that exposes safe, scoped tools for Supabase: run parameterized SQL, manage rows, inspect schema, and read Storage — with row-level-security awareness and a read-only mode. Connect it to any MCP-compatible client.",
    type: "mcp-server",
    category: "integrations",
    platforms: ["mcp", "cursor", "claude-desktop"],
    permissions: { ...NO_PERMS, readFiles: true, network: true, env: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "kenji",
    orgSlug: "supabase",
    tags: ["supabase", "mcp", "postgres", "integrations", "database", "auth"],
    sourceRepo: "https://github.com/supabase/supabase-mcp",
    website: "https://supabase.com/docs",
    installCount: 58700,
    weeklyInstalls: 5340,
    stars: 2870,
    ratingAvg: 4.7,
    ratingCount: 174,
    isVerified: true,
    isSecurityReviewed: true,
    isFeatured: true,
    requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    readme: `# Supabase Integration MCP

A **Model Context Protocol** server that connects agents to your Supabase project — safely.

## Tools exposed

- \`sql(query, params)\` — parameterized queries only
- \`list_tables()\` / \`describe_table(name)\`
- \`select\` / \`insert\` / \`update\` with RLS awareness
- \`storage_list(bucket)\`

## Security model

- **Parameterized SQL only** — no string interpolation
- **Read-only mode** — opt-in write access per tool
- **RLS-aware** — respects row-level security policies
- Reads \`SUPABASE_SERVICE_ROLE_KEY\` from the environment — never logs it

## Install

\`\`\`bash
npx agentdock install supabase-integration-mcp --target mcp
\`\`\`

## Required environment

| Variable | Purpose |
| --- | --- |
| \`SUPABASE_URL\` | Project endpoint |
| \`SUPABASE_SERVICE_ROLE_KEY\` | Server-side access |
`,
    versions: [
      {
        version: "1.4.0",
        releasedAt: "2026-06-06T00:00:00.000Z",
        downloads: 18200,
        changelog: ["RLS-aware select/insert/update", "Storage tools", "Read-only mode"],
      },
      {
        version: "1.2.0",
        releasedAt: "2026-03-30T00:00:00.000Z",
        downloads: 21100,
        changelog: ["Parameterized SQL tool", "Schema introspection"],
      },
    ],
    reviews: [
      {
        author: "founder_v",
        rating: 5,
        title: "RLS awareness sold me",
        body: "It respects our row-level-security policies instead of bypassing them with the service role. That's the detail most integrations miss.",
        createdAt: "2026-06-08T00:00:00.000Z",
        helpful: 29,
        version: "1.4.0",
      },
      {
        author: "dataflow",
        rating: 4,
        title: "Great for Cursor + Claude Desktop",
        body: "Connected it to both over MCP and it just worked. Read-only mode is perfect for exploration.",
        createdAt: "2026-04-24T00:00:00.000Z",
        helpful: 13,
        version: "1.2.0",
      },
    ],
    issues: [
      {
        title: "Add a migration-preview tool",
        kind: "feature",
        state: "open",
        author: "staff_eng",
        createdAt: "2026-05-30T00:00:00.000Z",
        comments: 4,
        labels: ["enhancement"],
      },
    ],
    discussions: [
      {
        title: "Safe defaults for giving an agent DB access",
        category: "q-and-a",
        author: "sre_kate",
        createdAt: "2026-05-12T00:00:00.000Z",
        replies: 10,
        upvotes: 38,
        excerpt: "Do you start read-only and grant writes per-tool, or scope by RLS? What's worked for you?",
        isAnswered: true,
      },
    ],
    createdAt: "2025-12-01T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
  },

  // 15 ---------------------------------------------------------------------
  {
    slug: "test-generator-agent",
    name: "Test Generator Agent",
    packageId: "test-generator-agent",
    shortDescription:
      "Generates meaningful unit and integration tests, then runs them to green.",
    longDescription:
      "Generates tests that assert behavior, not implementation: edge cases, error paths, and integration flows. It runs the suite and iterates until it's green — across Vitest, Jest, Pytest, and Go test.",
    type: "agent",
    category: "development",
    platforms: ["claude-code", "cursor", "windsurf"],
    permissions: { ...NO_PERMS, readFiles: true, writeFiles: true, runCommands: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "marcus-dev",
    orgSlug: "openai",
    tags: ["testing", "unit-tests", "vitest", "jest", "pytest", "coverage"],
    sourceRepo: "https://github.com/openai/test-generator",
    installCount: 71200,
    weeklyInstalls: 5840,
    stars: 3340,
    ratingAvg: 4.6,
    ratingCount: 233,
    isVerified: true,
    isSecurityReviewed: false,
    isFeatured: true,
    readme: `# Test Generator Agent

Tests that catch real bugs. It reads your code, generates a suite that asserts behavior (including edge and error cases), runs it, and fixes failures until green.

## Frameworks

Vitest · Jest · Pytest · Go test

## What makes the tests good

- Covers edge cases and error paths, not just the happy path
- Asserts **behavior**, not internal implementation details
- Generates fixtures and mocks where needed
- Runs the suite and iterates to green

## Install

\`\`\`bash
npx agentdock install test-generator-agent --target claude-code
\`\`\`

> Requests \`runCommands\` to execute the test runner. Review the command allow-list in \`agent.json\`.
`,
    versions: [
      {
        version: "2.5.0",
        releasedAt: "2026-05-30T00:00:00.000Z",
        downloads: 24300,
        changelog: ["Go test support", "Smarter mock generation", "Coverage-gap targeting"],
      },
      {
        version: "2.2.0",
        releasedAt: "2026-03-11T00:00:00.000Z",
        downloads: 27800,
        changelog: ["Pytest support", "Iterate-to-green loop", "Windsurf support"],
      },
    ],
    reviews: [
      {
        author: "qa_lead",
        rating: 5,
        title: "Actually tests behavior",
        body: "Most generators write brittle implementation tests. These survived a refactor untouched, which is the whole point.",
        createdAt: "2026-06-02T00:00:00.000Z",
        helpful: 39,
        version: "2.5.0",
      },
      {
        author: "dataflow",
        rating: 4,
        title: "Big coverage boost",
        body: "Took us from 40% to 78% on a legacy module. Occasionally over-mocks, but easy to trim.",
        createdAt: "2026-04-08T00:00:00.000Z",
        helpful: 14,
        version: "2.2.0",
      },
    ],
    issues: [
      {
        title: "Respect existing test naming conventions",
        kind: "feature",
        state: "open",
        author: "qa_lead",
        createdAt: "2026-05-26T00:00:00.000Z",
        comments: 3,
        labels: ["enhancement"],
      },
    ],
    discussions: [
      {
        title: "Using coverage-gap targeting in CI",
        category: "show-and-tell",
        author: "qa_lead",
        createdAt: "2026-04-28T00:00:00.000Z",
        replies: 11,
        upvotes: 43,
        excerpt: "I run it only on files below the coverage threshold so CI stays fast. Config in the thread…",
      },
    ],
    createdAt: "2025-10-28T00:00:00.000Z",
    updatedAt: "2026-05-30T00:00:00.000Z",
  },
  // Marketing ----------------------------------------------------------------
  {
    slug: "copy-sharpener",
    name: "Copy Sharpener",
    packageId: "copy-sharpener",
    shortDescription:
      "Rewrites marketing copy to be clearer, punchier, and conversion-ready.",
    longDescription:
      "Copy Sharpener reviews your headlines, landing page sections, email subject lines, and ad copy against proven conversion principles. It flags weak verbs, buried benefits, and vague CTAs — and rewrites each with a concrete alternative. Works across B2B and B2C tones.",
    type: "agent",
    category: "marketing",
    platforms: ["claude-code", "claude-desktop", "cursor"],
    permissions: { ...NO_PERMS, readFiles: true },
    license: "MIT",
    pricing: "open-source",
    creatorUsername: "lina-code",
    tags: ["marketing", "copywriting", "conversion", "landing-page", "email", "ads"],
    sourceRepo: "https://github.com/lina-vogel/copy-sharpener",
    installCount: 28400,
    weeklyInstalls: 2100,
    stars: 1340,
    ratingAvg: 4.7,
    ratingCount: 98,
    isVerified: true,
    isSecurityReviewed: false,
    isFeatured: false,
    exampleUsage:
      "# Sharpen your landing page headline\n\n```bash\nnpx agentdock install copy-sharpener --target claude-code\n```\n\nThen:\n\n> Rewrite this headline for higher clarity and conversion:\n> \"We help teams do more with less.\"\n\nCopy Sharpener returns the original annotated with weaknesses plus three alternatives ranked by expected clarity.",
    readme: `# Copy Sharpener

**Read-only** marketing copy reviewer and rewriter. Paste in any copy — headline, email, ad, landing section — and get specific, conversion-focused rewrites.

## What it improves

- **Headlines** — buries the benefit? too clever? it rewrites for immediate clarity
- **CTAs** — vague "Learn more" buttons become action-specific
- **Email subjects** — flags curiosity gaps, length issues, and spam-trigger words
- **Feature lists** — translates features into buyer outcomes

## Install

\`\`\`bash
npx agentdock install copy-sharpener --target claude-code
\`\`\`
`,
    versions: [
      {
        version: "1.2.0",
        releasedAt: "2026-05-10T00:00:00.000Z",
        downloads: 12800,
        size: "28 KB",
        changelog: [
          "Add B2B tone profile",
          "Email subject line scoring",
          "Claude Desktop support",
        ],
      },
      {
        version: "1.0.0",
        releasedAt: "2026-02-14T00:00:00.000Z",
        downloads: 15600,
        size: "24 KB",
        changelog: ["Initial release — headline and landing copy rewrites"],
      },
    ],
    reviews: [
      {
        author: "growth_hacker",
        rating: 5,
        title: "Cut my rewrite cycles in half",
        body: "Used to go back and forth with a copywriter for days. Now I paste in a draft and get three strong alternatives in seconds. Conversion rate on our hero section went up 18%.",
        createdAt: "2026-05-22T00:00:00.000Z",
        helpful: 34,
        version: "1.2.0",
      },
      {
        author: "startup_founder",
        rating: 4,
        title: "Great for first drafts",
        body: "Excellent at stripping filler words and finding the buried lede. Occasionally over-punchy for enterprise audiences but easy to dial back.",
        createdAt: "2026-04-15T00:00:00.000Z",
        helpful: 21,
        version: "1.0.0",
      },
    ],
    issues: [],
    discussions: [
      {
        title: "B2C vs B2B tone guide",
        category: "q-and-a",
        author: "growth_hacker",
        createdAt: "2026-05-18T00:00:00.000Z",
        replies: 7,
        upvotes: 19,
        excerpt: "There's a tone_profile option in the config — set it to 'b2b' for more formal rewrites. Details in the thread.",
      },
    ],
    createdAt: "2026-02-14T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  },
];

export const agents: AgentPackage[] = seeds.map(materialize);
