import type {
  AgentFile,
  AgentPackage,
  AgentVersion,
  Category,
  CompatibilityRow,
  Discussion,
  InstallCommand,
  Issue,
  IssueKind,
  IssueState,
  License,
  PackageType,
  Permissions,
  Platform,
  Pricing,
  Review,
} from "../types";
import {
  aggregateRisk,
  PLATFORM_LABELS,
  PLATFORM_META,
  platformCommand,
  platformPath,
} from "../taxonomy";
import { getCreator, GRADIENTS } from "./creators";
import { hashIndex } from "../utils";

// --- Resolve display name + avatar for any handle ---------------------------

const COMMUNITY: Record<string, string> = {
  jdoe: "Jordan Doe",
  ml_eng: "Mina Larsson",
  sre_kate: "Kate Bauer",
  refactor_guy: "Pavel Novak",
  cto_emma: "Emma Schultz",
  dataflow: "Ravi Menon",
  hacky: "Theo Brandt",
  nextjs_fan: "Yuki Sato",
  ops_diego: "Diego Romero",
  qa_lead: "Hana Ito",
  intern_max: "Max Whitfield",
  prod_lia: "Lia Petrov",
  staff_eng: "Omar Haddad",
  designer_jo: "Jo Kim",
  pentester: "Sasha Kuznetsov",
  founder_v: "Vera Castellanos",
};

const GRAD_LIST = Object.values(GRADIENTS);

export function resolveUser(username: string): { name: string; avatarColor: string } {
  const creator = getCreator(username);
  if (creator) return { name: creator.name, avatarColor: creator.avatarColor };
  const name =
    COMMUNITY[username] ??
    username
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  return { name, avatarColor: GRAD_LIST[hashIndex(username, GRAD_LIST.length)] };
}

// --- Seed shapes ------------------------------------------------------------

export interface VersionSeed {
  version: string;
  releasedAt: string;
  changelog: string[];
  downloads: number;
  size?: string;
  isPrerelease?: boolean;
}

export interface ReviewSeed {
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  helpful?: number;
  version?: string;
}

export interface IssueSeed {
  title: string;
  kind: IssueKind;
  state: IssueState;
  author: string;
  createdAt: string;
  comments: number;
  labels: string[];
}

export interface DiscussionSeed {
  title: string;
  category: Discussion["category"];
  author: string;
  createdAt: string;
  replies: number;
  upvotes: number;
  excerpt: string;
  isAnswered?: boolean;
}

export interface AgentSeed {
  slug: string;
  name: string;
  packageId: string;
  shortDescription: string;
  longDescription: string;
  type: PackageType;
  category: Category;
  platforms: Platform[];
  permissions: Permissions;
  license: License;
  pricing: Pricing;
  price?: string;

  creatorUsername: string;
  orgSlug?: string;

  tags: string[];
  sourceRepo?: string;
  website?: string;
  homepage?: string;

  installCount: number;
  weeklyInstalls: number;
  stars: number;
  ratingAvg: number;
  ratingCount: number;

  isVerified: boolean;
  isSecurityReviewed: boolean;
  isFeatured?: boolean;

  readme: string;
  exampleUsage?: string;
  requiredEnv?: string[];
  compatibility?: CompatibilityRow[];

  versions: VersionSeed[];
  reviews: ReviewSeed[];
  issues: IssueSeed[];
  discussions: DiscussionSeed[];

  createdAt: string;
  updatedAt: string;

  /** Optional custom files; otherwise a standard tree is generated. */
  files?: AgentFile[];
}

// --- File-tree generation ---------------------------------------------------

function permissionsJson(perms: Permissions): string {
  const core = {
    readFiles: perms.readFiles,
    writeFiles: perms.writeFiles,
    runCommands: perms.runCommands,
    network: perms.network,
    env: perms.env,
  };
  return JSON.stringify(core, null, 2);
}

function agentManifest(seed: AgentSeed): string {
  const manifest: Record<string, unknown> = {
    name: seed.packageId,
    displayName: seed.name,
    version: seed.versions[0]?.version ?? "1.0.0",
    type: seed.type,
    description: seed.shortDescription,
    platforms: seed.platforms,
    permissions: {
      readFiles: seed.permissions.readFiles,
      writeFiles: seed.permissions.writeFiles,
      runCommands: seed.permissions.runCommands,
      network: seed.permissions.network,
      env: seed.permissions.env,
    },
    entry: "instructions.md",
    license: seed.license,
  };
  return JSON.stringify(manifest, null, 2);
}

function fullPermissionsJson(seed: AgentSeed): string {
  return JSON.stringify(
    { permissions: seed.permissions, risk: aggregateRisk(seed.permissions) },
    null,
    2
  );
}

function defaultInstructions(seed: AgentSeed): string {
  return `# ${seed.name}

You are **${seed.name}**, ${seed.shortDescription.toLowerCase()}

## Role

${seed.longDescription.split("\n")[0]}

## Operating principles

1. Be precise and cite the exact files, lines, or sources you used.
2. Prefer the smallest correct change. Explain trade-offs briefly.
3. Never take a destructive action without confirming the target first.
4. Respect the declared permission scope — do not request access you do not need.

## Output

- Lead with the conclusion, then the supporting detail.
- Use code blocks for commands and patches.
- When uncertain, say so and propose how to verify.
`;
}

function buildFiles(seed: AgentSeed): AgentFile[] {
  if (seed.files) return seed.files;
  return [
    {
      path: "agent.json",
      type: "file",
      language: "json",
      size: "0.6 KB",
      content: agentManifest(seed),
    },
    {
      path: "README.md",
      type: "file",
      language: "markdown",
      size: `${Math.max(1, Math.round(seed.readme.length / 1024))}.0 KB`,
      content: seed.readme,
    },
    {
      path: "instructions.md",
      type: "file",
      language: "markdown",
      size: "1.4 KB",
      content: defaultInstructions(seed),
    },
    {
      path: "permissions.json",
      type: "file",
      language: "json",
      size: "0.4 KB",
      content: fullPermissionsJson(seed),
    },
    { path: "examples", type: "dir" },
    {
      path: "examples/basic.md",
      type: "file",
      language: "markdown",
      size: "0.9 KB",
      content:
        seed.exampleUsage ??
        `# Basic example\n\n\`\`\`bash\nnpx agentdock install ${seed.packageId}\n\`\`\`\n\nThen invoke ${seed.name} on your project and follow the prompts.`,
    },
    {
      path: "examples/advanced.md",
      type: "file",
      language: "markdown",
      size: "1.1 KB",
      content: `# Advanced usage\n\nConfigure ${seed.name} via \`agent.json\` and combine it with your existing workflow. See the README for the full option reference.`,
    },
  ];
}

// --- Materialize ------------------------------------------------------------

export function materialize(seed: AgentSeed): AgentPackage {
  const versions: AgentVersion[] = seed.versions.map((v, i) => ({
    version: v.version,
    releasedAt: v.releasedAt,
    isLatest: i === 0 && !v.isPrerelease,
    isPrerelease: v.isPrerelease,
    changelog: v.changelog,
    size: v.size ?? "42 KB",
    downloads: v.downloads,
  }));

  const latest = versions.find((v) => v.isLatest) ?? versions[0];

  const installCommands: InstallCommand[] = seed.platforms.map((platform) => ({
    platform,
    action: PLATFORM_META[platform].action,
    command: platformCommand(seed.slug, platform),
    targetPath: platformPath(seed.slug, platform),
  }));

  const supportedClients = seed.platforms.map((p) => PLATFORM_LABELS[p]);

  const reviews: Review[] = seed.reviews.map((r, i) => {
    const u = resolveUser(r.author);
    return {
      id: `${seed.slug}-rev-${i + 1}`,
      author: r.author,
      authorName: u.name,
      avatarColor: u.avatarColor,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      helpful: r.helpful ?? 0,
      version: r.version,
      verifiedInstall: true,
    };
  });

  const issues: Issue[] = seed.issues.map((it, i) => {
    const u = resolveUser(it.author);
    return {
      id: `${seed.slug}-iss-${i + 1}`,
      number: 100 - i,
      title: it.title,
      kind: it.kind,
      state: it.state,
      author: it.author,
      authorName: u.name,
      avatarColor: u.avatarColor,
      createdAt: it.createdAt,
      comments: it.comments,
      labels: it.labels,
    };
  });

  const discussions: Discussion[] = seed.discussions.map((d, i) => {
    const u = resolveUser(d.author);
    return {
      id: `${seed.slug}-dis-${i + 1}`,
      title: d.title,
      category: d.category,
      author: d.author,
      authorName: u.name,
      avatarColor: u.avatarColor,
      createdAt: d.createdAt,
      replies: d.replies,
      upvotes: d.upvotes,
      excerpt: d.excerpt,
      isAnswered: d.isAnswered,
    };
  });

  return {
    slug: seed.slug,
    name: seed.name,
    packageId: seed.packageId,
    shortDescription: seed.shortDescription,
    longDescription: seed.longDescription,
    type: seed.type,
    category: seed.category,
    platforms: seed.platforms,
    supportedClients,
    permissions: seed.permissions,
    license: seed.license,
    pricing: seed.pricing,
    price: seed.price,
    creatorUsername: seed.creatorUsername,
    orgSlug: seed.orgSlug,
    tags: seed.tags,
    sourceRepo: seed.sourceRepo,
    website: seed.website,
    homepage: seed.homepage,
    installCount: seed.installCount,
    weeklyInstalls: seed.weeklyInstalls,
    stars: seed.stars,
    ratingAvg: seed.ratingAvg,
    ratingCount: seed.ratingCount,
    isVerified: seed.isVerified,
    isSecurityReviewed: seed.isSecurityReviewed,
    isFeatured: seed.isFeatured,
    version: latest?.version ?? "1.0.0",
    versions,
    installCommands,
    readme: seed.readme,
    files: buildFiles(seed),
    exampleUsage: seed.exampleUsage,
    requiredEnv: seed.requiredEnv,
    compatibility: seed.compatibility,
    reviews,
    issues,
    discussions,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  };
}

/** Convenience: full all-permissions-false baseline to spread over. */
export const NO_PERMS: Permissions = {
  readFiles: false,
  writeFiles: false,
  runCommands: false,
  network: false,
  env: false,
  browser: false,
  gitHistory: false,
  secrets: false,
};
