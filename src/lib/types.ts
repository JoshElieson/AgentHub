// ---------------------------------------------------------------------------
// AgentDock domain types
// These mirror the Prisma schema (prisma/schema.prisma) so that mock data can
// later be swapped for real DB queries with minimal churn.
// ---------------------------------------------------------------------------

export type PackageType =
  | "agent"
  | "claude-skill"
  | "cursor-rule"
  | "mcp-server"
  | "workflow"
  | "prompt-pack"
  | "custom-mode"
  | "tool-adapter"
  | "agent-template"
  | "automation";

// Platforms / runtimes / clients an installable capability can target.
// `mcp` represents any MCP-compatible client.
export type Platform =
  | "claude-code"
  | "claude-desktop"
  | "cursor"
  | "windsurf"
  | "openai-agents"
  | "gemini-cli"
  | "github-copilot"
  | "replit-agent"
  | "mcp";

export type Category =
  | "development"
  | "security"
  | "devops"
  | "research"
  | "design"
  | "writing"
  | "data-science"
  | "productivity"
  | "education"
  | "browser-automation"
  | "integrations"
  | "marketing";

// AI provider / model ecosystem a package is built for or compatible with.
// `universal` means model-agnostic (works with any assistant).
export type SkillModel =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "mistral"
  | "universal";

export type License =
  | "MIT"
  | "Apache-2.0"
  | "GPL-3.0"
  | "Proprietary"
  | "Unknown";

export type Pricing = "free" | "paid" | "open-source";

export type RiskLevel = "low" | "medium" | "high";

export type PermissionKey =
  | "readFiles"
  | "writeFiles"
  | "runCommands"
  | "network"
  | "env"
  | "browser"
  | "gitHistory"
  | "secrets";

export type Permissions = Record<PermissionKey, boolean>;

export interface Creator {
  username: string;
  name: string;
  bio: string;
  avatarColor: string; // gradient seed / accent
  website?: string;
  github?: string;
  twitter?: string;
  location?: string;
  isVerified: boolean;
  followers: number;
  following: number;
  joinedAt: string; // ISO
  /** Present when this "creator" is actually an organization. */
  isOrganization?: boolean;
  orgSlug?: string;
}

export interface Organization {
  slug: string;
  name: string;
  description: string;
  avatarColor: string;
  website?: string;
  github?: string;
  location?: string;
  isVerified: boolean;
  members: number;
  followers: number;
  joinedAt: string;
}

export interface AgentFile {
  path: string; // e.g. "examples/basic.md"
  type: "file" | "dir";
  language?: string; // for syntax hint: "json" | "markdown" | "typescript" | ...
  size?: string; // "1.2 KB"
  /** Preview contents (mock). Directories have no contents. */
  content?: string;
}

export interface AgentVersion {
  version: string; // "2.1.0"
  releasedAt: string; // ISO
  isLatest?: boolean;
  isPrerelease?: boolean;
  changelog: string[]; // bullet points
  size: string; // "42 KB"
  downloads: number;
}

export interface Review {
  id: string;
  author: string; // username
  authorName: string;
  avatarColor: string;
  rating: number; // 1-5
  title: string;
  body: string;
  createdAt: string;
  helpful: number;
  version?: string; // version reviewed
  verifiedInstall?: boolean;
}

export type IssueKind = "bug" | "feature" | "compatibility" | "question";
export type IssueState = "open" | "closed";

export interface Issue {
  id: string;
  number: number;
  title: string;
  kind: IssueKind;
  state: IssueState;
  author: string;
  authorName: string;
  avatarColor: string;
  createdAt: string;
  comments: number;
  labels: string[];
}

export interface Discussion {
  id: string;
  title: string;
  category: "show-and-tell" | "q-and-a" | "ideas" | "general";
  author: string;
  authorName: string;
  avatarColor: string;
  createdAt: string;
  replies: number;
  upvotes: number;
  excerpt: string;
  isAnswered?: boolean;
}

export interface AgentPackage {
  slug: string;
  name: string; // display name
  packageId: string; // install id used by the CLI; equals slug
  shortDescription: string; // one-line summary
  longDescription: string; // long description (markdown)
  type: PackageType;
  category: Category;
  platforms: Platform[]; // AI tools / runtimes / clients this works with
  supportedClients: string[]; // human-readable client names (mirrors platforms)
  permissions: Permissions;
  license: License;
  pricing: Pricing;
  price?: string; // "$9/mo" when paid

  creatorUsername: string;
  orgSlug?: string;

  tags: string[];
  sourceRepo?: string;
  website?: string;
  homepage?: string;

  // Stats
  installCount: number;
  weeklyInstalls: number;
  stars: number;
  ratingAvg: number; // 0-5
  ratingCount: number;

  // Trust signals
  isVerified: boolean;
  isSecurityReviewed: boolean;
  isFeatured?: boolean;

  // Versioning
  version: string; // latest published version
  versions: AgentVersion[];

  // Install
  installCommands: InstallCommand[]; // per-platform install/export commands

  // Content
  readme: string; // markdown
  files: AgentFile[];
  exampleUsage?: string;
  requiredEnv?: string[];
  compatibility?: CompatibilityRow[];

  // Activity
  reviews: Review[];
  issues: Issue[];
  discussions: Discussion[];

  createdAt: string;
  updatedAt: string;
}

/** A resolved install/export command for a single platform. */
export interface InstallCommand {
  platform: Platform;
  /** Whether the CLI installs in place or exports to another format. */
  action: "install" | "export";
  command: string;
  /** Where the package lands, when applicable. */
  targetPath?: string;
}

export interface CompatibilityRow {
  platform: Platform;
  status: "supported" | "partial" | "exportable" | "unsupported";
  /** Short human label for how the package is installed on this platform. */
  installMethod?: string;
  notes?: string;
}

export interface Collection {
  slug: string;
  name: string;
  description: string;
  coverColor: string;
  curatorUsername: string;
  agentSlugs: string[];
  followers: number;
  isOfficial?: boolean;
  updatedAt: string;
}

// --- Install target metadata ------------------------------------------------

export type InstallTarget =
  | "claude-code"
  | "claude-desktop"
  | "cursor"
  | "windsurf"
  | "openai-agents"
  | "gemini-cli"
  | "copilot-instructions"
  | "mcp"
  | "zip";

export interface InstalledAgent {
  slug: string;
  installedVersion: string;
  target: Platform;
  installedAt: string;
  hasUpdate: boolean;
}
