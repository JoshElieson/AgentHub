import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Insert the "featured 100" skills that were missing from AgentDock's catalog.
// These are real, individually-attributed Agent Skills (SKILL.md packages) drawn
// from their publishers' repos (Anthropic, Microsoft Azure, Lark/Feishu, Firebase,
// Trail of Bits, Superpowers, vendor tools, and community design/workflow skills).
//
// Idempotent: paginates existing `name`s and inserts only the ones not present.
// Category/model are NOT stored here — they live in src/lib/skill-classification.ts
// (curated map keyed by name) and are applied at normalize-time. Each entry below
// still carries category/model/author/displayName as a record for that map.
//
//   node scripts/insert-featured-skills.mjs
// ─────────────────────────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const MS_AZURE = 'https://github.com/microsoft/azure-skills';
const LARK = 'https://github.com/larksuite/cli';
const ANTHROPIC = 'https://github.com/anthropics/skills';
const FIREBASE = 'https://firebase.google.com/docs/ai-assistance/agent-skills';

export const FEATURED = [
  // ── Anthropic official (anthropics/skills) ────────────────────────────────
  {
    name: 'artifacts-builder',
    displayName: 'Artifacts Builder',
    author: 'Anthropic',
    category: 'development',
    model: ['anthropic'],
    description: "Builds complex, self-contained HTML/React artifacts that run inside Claude.ai's artifact sandbox — multi-file mini-apps, dashboards, and interactive tools wired up with state, storage, and component libraries. Use when a single inline component isn't enough.",
    trigger_phrases: ['build an interactive artifact', 'make a Claude artifact app', 'create a React dashboard artifact', 'build a multi-component HTML tool', 'turn this into an artifact'],
    tags: ['artifacts', 'react', 'html', 'frontend', 'claude', 'interactive'],
    source_url: ANTHROPIC,
    markdown_instructions: "# Artifacts Builder\n\nProduce rich, self-contained artifacts that run in Claude's artifact runtime: interactive tools, dashboards, simulations, and small single-page apps.\n\n## When to use\nReach for this when a request needs more than a static snippet — multiple components, client-side state, persisted data, charts, or a real UI. For one trivial component, write it inline instead.\n\n## Conventions\n- Ship a single self-contained file. Inline everything; do not rely on a build step.\n- Use React with hooks for stateful UIs; keep components small and composed.\n- Allowed libraries only (the ones whitelisted in the artifact runtime): React, Tailwind utility classes, lucide-react icons, recharts for charts, and the standard browser APIs.\n- For persistence use the artifact storage API (window.claude / localStorage-style) rather than a backend.\n- No network calls to arbitrary origins — the sandbox blocks them.\n\n## Workflow\n1. Sketch the component tree and the state it needs.\n2. Build the smallest working version, then layer features.\n3. Mind responsive layout and empty/loading/error states.\n4. Self-review: would this render and run with zero external setup?\n\nKeep the aesthetic intentional — real spacing, hierarchy, and color, never default-gray boilerplate.",
  },
  {
    name: 'internal-communications',
    displayName: 'Internal Communications',
    author: 'Anthropic',
    category: 'writing',
    model: ['anthropic'],
    description: 'Drafts clear, on-tone internal company communications — announcements, leadership updates, FAQs, incident notes, and change-management messaging — structured for skimmability and the right audience. Mirrors Anthropic\'s internal-comms skill.',
    trigger_phrases: ['write a company announcement', 'draft an internal update', 'announce this change to the team', 'write an all-hands recap', 'draft an incident comms message'],
    tags: ['writing', 'communications', 'announcement', 'internal', 'change-management'],
    source_url: ANTHROPIC,
    markdown_instructions: "# Internal Communications\n\nWrite internal-facing messages that land: announcements, org/leadership updates, policy or process changes, FAQs, and incident notes.\n\n## Principles\n- Lead with the takeaway. The first two sentences should answer 'what changed and what do I need to do?'\n- Match audience and channel: an all-company email reads differently than a team Slack post.\n- Be concrete about impact, timing, and the ask. Vague comms generate more questions than they answer.\n- Anticipate the obvious questions and fold a short FAQ in.\n\n## Structure\n1. Headline / subject — specific, not clever.\n2. The news in one short paragraph.\n3. Why it matters / context (brief).\n4. What's changing and when (dates, owners).\n5. What the reader should do next.\n6. Where to ask questions.\n\n## Tone\nDirect, warm, and honest. Acknowledge uncertainty rather than papering over it. Avoid corporate filler ('synergy', 'leverage', 'going forward'). Keep paragraphs short and use bold sparingly to guide the eye.",
  },

  // ── Superpowers (obra/superpowers) ────────────────────────────────────────
  {
    name: 'writing-plans',
    displayName: 'Writing Plans',
    author: 'Superpowers',
    category: 'development',
    model: ['anthropic'],
    description: 'Turns a fuzzy feature request into a concrete, reviewable implementation plan with phased steps, file-level changes, and explicit checkpoints — the planning half of the Superpowers brainstorm → plan → execute loop.',
    trigger_phrases: ['write an implementation plan', 'plan this feature', 'break this work into phases', 'draft a build plan', 'create a step-by-step plan'],
    tags: ['planning', 'workflow', 'implementation', 'superpowers', 'development'],
    source_url: 'https://github.com/obra/superpowers',
    markdown_instructions: "# Writing Plans\n\nProduce an implementation plan precise enough that another engineer (or agent) could execute it without re-deriving your decisions.\n\n## When to use\nAfter the problem is understood (brainstorming done) and before writing code. Especially for multi-file or multi-step work.\n\n## A good plan has\n- A one-paragraph statement of the goal and the done-condition.\n- Phases, each independently shippable and verifiable.\n- Per-phase: the files to touch, the change in each, and how to confirm it works.\n- Explicit checkpoints where you stop and verify before continuing.\n- Called-out risks, unknowns, and the questions that would change the approach.\n\n## Discipline\n- Plan in terms of behavior and tests, not just code edits.\n- Keep steps small enough to verify; if a step can't be checked, split it.\n- Prefer the simplest plan that satisfies the requirement — don't design for hypothetical futures.\n- Write the plan to a file so it can be reviewed and executed later (pairs with executing-plans).",
  },

  // ── Microsoft / Azure (microsoft/azure-skills) ────────────────────────────
  {
    name: 'microsoft-foundry',
    displayName: 'Microsoft Foundry',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Works with Microsoft Foundry (Azure AI Foundry): model discovery and deployment, the full agent dev lifecycle, evaluation workflows, and troubleshooting — including building/pushing container images, creating hosted agents, and RBAC. From Microsoft\'s official Azure Skills plugin.',
    trigger_phrases: ['deploy an agent to Microsoft Foundry', 'discover models in Azure AI Foundry', 'run a Foundry evaluation', 'set up a hosted agent on Foundry', 'troubleshoot my Foundry deployment'],
    tags: ['azure', 'foundry', 'ai', 'deployment', 'agents', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Microsoft Foundry\n\nHelp developers build, deploy, evaluate, and operate AI agents and models on Microsoft Foundry (Azure AI Foundry).\n\n## Capabilities\n- Model discovery and deployment from the Foundry catalog.\n- Full agent lifecycle: scaffold, build a container image, push to Azure Container Registry, create a hosted agent.\n- Batch evaluation runs and prompt optimization driven by the evaluation results.\n- Troubleshooting and RBAC / role assignment for Foundry resources.\n\n## Workspace standard\nEnforce a '.foundry/agent-metadata.yaml' file describing the agent (name, model, eval set, deployment target) so runs are reproducible.\n\n## Workflow\n1. Confirm the target Foundry project and resource group.\n2. Pick or deploy the model; record it in agent-metadata.yaml.\n3. Build and push the agent image to ACR.\n4. Create / update the hosted agent.\n5. Run the evaluation set, read the metrics, and iterate on the prompt.\n\nPrefer az CLI + the Foundry MCP server when available; never hard-code secrets — use managed identity / Key Vault references.",
  },
  {
    name: 'azure-ai',
    displayName: 'Azure AI',
    author: 'Microsoft',
    category: 'development',
    model: ['universal'],
    description: 'Builds applications on Azure AI services — Azure OpenAI, AI Search (RAG), Document Intelligence, Vision, and Speech — with current SDK usage, auth via managed identity, and grounded retrieval patterns. Part of Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['call Azure OpenAI from my app', 'set up Azure AI Search RAG', 'use Document Intelligence to parse PDFs', 'add Azure speech-to-text', 'authenticate to Azure AI with managed identity'],
    tags: ['azure', 'ai', 'openai', 'rag', 'ai-search', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure AI\n\nBuild on the Azure AI platform with correct, current SDK patterns.\n\n## Services covered\n- **Azure OpenAI** — chat/completions, embeddings, function calling; deployment names vs model names.\n- **Azure AI Search** — vector + hybrid search for RAG; index schema, semantic ranking, and the retrieve-then-generate loop.\n- **Document Intelligence** — extract structure/tables from PDFs and forms.\n- **Vision / Speech** — image analysis, OCR, speech-to-text and TTS.\n\n## Auth\nPrefer DefaultAzureCredential / managed identity over API keys. Keep keys in Key Vault when keys are unavoidable.\n\n## RAG pattern\n1. Chunk and embed content; upsert into an AI Search index with a vector field.\n2. At query time, embed the question, run a hybrid (keyword + vector) query, take top-k.\n3. Ground the model on retrieved passages and cite them.\n\n## Notes\n- Reference a deployment name, not the raw model id, when calling Azure OpenAI.\n- Watch token and rate limits; back off on 429s.",
  },
  {
    name: 'azure-hosted-copilot-sdk',
    displayName: 'Azure-Hosted Copilot SDK',
    author: 'Microsoft',
    category: 'development',
    model: ['universal'],
    description: 'Scaffolds and ships custom copilots/agents with the Azure-hosted Copilot SDK — wiring tools, orchestration, and hosting on Azure with the recommended project layout. From Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['build a copilot with the Azure SDK', 'scaffold an Azure-hosted agent', 'add a tool to my Azure copilot', 'host my agent on Azure', 'set up the Copilot SDK project'],
    tags: ['azure', 'copilot', 'sdk', 'agents', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure-Hosted Copilot SDK\n\nScaffold, extend, and deploy custom copilots/agents using the Azure-hosted Copilot SDK.\n\n## What it helps with\n- Project scaffolding with the recommended structure and config.\n- Registering tools/functions the copilot can call and validating their schemas.\n- Orchestration: turn-taking, tool routing, and grounding.\n- Hosting and deployment onto Azure (identity, scaling, logging).\n\n## Workflow\n1. Initialize the SDK project; confirm runtime + region.\n2. Define the copilot's instructions and the tool surface.\n3. Implement tools with typed inputs/outputs; test each in isolation.\n4. Wire orchestration and add observability (traces + logs).\n5. Deploy to the Azure host and smoke-test the live endpoint.\n\n## Notes\nUse managed identity for downstream Azure calls. Keep the system prompt and tool list in source control so behavior is reviewable.",
  },
  {
    name: 'azure-compute',
    displayName: 'Azure Compute',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Provisions and operates Azure compute — VMs, VM Scale Sets, App Service, Container Apps, and Functions — choosing the right service for the workload and applying sizing, networking, and identity best practices. Part of Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['provision an Azure VM', 'deploy to Azure App Service', 'set up Azure Container Apps', 'pick the right Azure compute service', 'scale my Azure workload'],
    tags: ['azure', 'compute', 'vm', 'app-service', 'container-apps', 'devops'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Compute\n\nChoose and operate the right Azure compute service for a workload, then provision it cleanly.\n\n## Service selection\n- **App Service** — managed web apps/APIs; easiest path for standard HTTP workloads.\n- **Container Apps** — serverless containers with scale-to-zero and KEDA-based autoscaling.\n- **Functions** — event-driven, short-lived work.\n- **VM / VM Scale Sets** — full control or lift-and-shift; size by CPU/mem/IO and use scale sets for HA.\n- **AKS** — when you need Kubernetes (see the azure-kubernetes skill).\n\n## Provisioning\n1. Decide the service from the workload shape (HTTP vs event vs batch vs full-OS).\n2. Right-size; start small and autoscale rather than over-provisioning.\n3. Put it in a VNet where needed; use private endpoints for data services.\n4. Use managed identity for downstream access; no embedded credentials.\n5. Express infra as Bicep/Terraform so it's repeatable.\n\n## Notes\nTag resources (owner, env, cost-center) and set autoscale rules with sane min/max.",
  },
  {
    name: 'azure-kubernetes',
    displayName: 'Azure Kubernetes (AKS)',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Stands up and operates Azure Kubernetes Service (AKS) — cluster setup, node pools, ingress, autoscaling, identity (workload identity), and safe rollouts — with production-grade defaults. From Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['create an AKS cluster', 'deploy to Azure Kubernetes', 'set up ingress on AKS', 'configure AKS autoscaling', 'use workload identity on AKS'],
    tags: ['azure', 'kubernetes', 'aks', 'containers', 'devops', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Kubernetes (AKS)\n\nProvision and operate AKS clusters with production defaults.\n\n## Cluster setup\n- Separate system and user node pools; size pools to workloads and enable the cluster autoscaler.\n- Use Azure CNI networking; plan the subnet/IP space up front.\n- Turn on managed identity + workload identity so pods get Azure access without secrets.\n\n## Workloads\n1. Containerize, push to ACR, and reference images by digest.\n2. Set requests/limits and liveness/readiness probes on every deployment.\n3. Expose via an ingress controller (e.g. NGINX / Application Gateway) with TLS.\n4. Roll out with surge/maxUnavailable settings; watch rollout status before declaring success.\n\n## Operations\n- Scale with HPA (and KEDA for event-driven scaling).\n- Ship logs/metrics to Azure Monitor / Container Insights.\n- Keep the cluster on a supported Kubernetes version (pairs with azure-upgrade).\n\n## Notes\nUse namespaces + RBAC + network policies to isolate workloads.",
  },
  {
    name: 'azure-cloud-migrate',
    displayName: 'Azure Cloud Migrate',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Plans and executes migrations to Azure — assessment, the right rehost/refactor/replatform strategy per workload, landing-zone setup, and cutover/validation steps. Part of Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['plan a migration to Azure', 'assess my app for Azure', 'rehost this server on Azure', 'design an Azure landing zone', 'plan the cutover to Azure'],
    tags: ['azure', 'migration', 'landing-zone', 'cloud', 'devops', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Cloud Migrate\n\nMove existing workloads to Azure with a clear strategy and a safe cutover.\n\n## Assess first\n- Inventory the app: dependencies, data stores, integrations, SLAs, and compliance needs.\n- Classify each workload by the right '5 Rs' move: rehost (lift-and-shift), replatform, refactor, repurchase, or retire.\n\n## Target landing zone\n- Establish the subscription/management-group structure, networking (hub-spoke), identity, and policy guardrails before moving anything.\n\n## Migration\n1. Pick the migration tooling (Azure Migrate for servers/DBs).\n2. Replicate data and stand up the target environment in parallel.\n3. Validate functionality and performance against the source.\n4. Cut over during a planned window; keep a rollback path.\n5. Decommission the source once stable.\n\n## Notes\nDon't refactor and migrate in the same step unless necessary — move first, modernize after, to isolate failures.",
  },
  {
    name: 'azure-quotas',
    displayName: 'Azure Quotas',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Diagnoses Azure quota and capacity limits, reads current vs. allowed usage per region/SKU, and drafts well-justified quota-increase requests so deployments stop failing on limits. From Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['check my Azure quota', 'why is my Azure deployment hitting a limit', 'request an Azure quota increase', 'find available capacity for this SKU', 'azure vCPU quota error'],
    tags: ['azure', 'quotas', 'capacity', 'limits', 'devops', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Quotas\n\nResolve quota and capacity failures and request increases.\n\n## When deployments fail on limits\n1. Identify the exact quota: subscription, region, resource provider, and SKU/family (e.g. a VM vCPU family, Azure OpenAI TPM, public IPs).\n2. Read current usage vs. limit for that scope.\n3. Decide: request an increase, switch region, or pick an alternative SKU with headroom.\n\n## Requesting an increase\n- File against the precise scope (region + family), not a vague global ask.\n- Justify with the target capacity and a short business reason — well-scoped requests are approved faster.\n- For constrained SKUs, propose a fallback region/SKU in parallel.\n\n## Common cases\n- Compute vCPU family caps blocking VM/AKS scale-out.\n- Azure OpenAI tokens-per-minute / requests-per-minute limits.\n- Public IP and network resource caps.\n\n## Notes\nQuotas are per-region and per-subscription — a limit in one region says nothing about another.",
  },
  {
    name: 'azure-upgrade',
    displayName: 'Azure Upgrade',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Plans and runs safe Azure upgrades — service/API versions, AKS Kubernetes versions, runtime stacks, and deprecations — with compatibility checks and staged rollouts. Part of Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['upgrade my AKS version', 'handle this Azure deprecation', 'bump the runtime on App Service', 'plan a safe Azure upgrade', 'check Azure API version compatibility'],
    tags: ['azure', 'upgrade', 'deprecation', 'aks', 'devops', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Upgrade\n\nPlan and execute upgrades on Azure without breaking running workloads.\n\n## Scope the upgrade\n- Identify what's moving: AKS Kubernetes version, App Service / Functions runtime, SDK/API versions, or a retiring service.\n- Read the release/deprecation notes for breaking changes and removed APIs.\n\n## Plan\n1. Map current versions against the target and list incompatibilities.\n2. Upgrade non-prod first; run the full test suite there.\n3. For AKS, upgrade the control plane, then node pools one at a time (surge nodes; respect PodDisruptionBudgets).\n4. Stage prod with a rollback plan and a health gate.\n\n## Deprecations\nWhen a service/API is retiring, find the replacement, port usage, and set a deadline ahead of the retirement date.\n\n## Notes\nNever skip multiple AKS minor versions at once — upgrade sequentially. Validate add-ons/ingress controllers against the new version before cutting prod.",
  },
  {
    name: 'azure-cost-optimization',
    displayName: 'Azure Cost Optimization',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Finds and cuts Azure spend — idle/over-provisioned resources, right-sizing, reservations/savings plans, autoscale, and storage tiering — with concrete, prioritized actions. From Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['reduce my Azure bill', 'find idle Azure resources', 'right-size my Azure VMs', 'should I buy Azure reservations', 'optimize Azure storage costs'],
    tags: ['azure', 'cost', 'finops', 'optimization', 'devops', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Cost Optimization\n\nReduce Azure spend with prioritized, low-risk actions.\n\n## Find the waste\n- Idle/orphaned resources: unattached disks, unused public IPs, stopped-but-allocated VMs, empty App Service plans.\n- Over-provisioned compute: VMs/plans sized far above actual utilization.\n- Expensive storage tiers for cold data.\n\n## Optimize\n1. Right-size compute from real CPU/mem/IO metrics; enable autoscale with sane min/max.\n2. Commit predictable baseline load to Reservations or Savings Plans (1/3-year) for big discounts.\n3. Move cold blobs to Cool/Archive tiers; set lifecycle policies.\n4. Scale non-prod to zero off-hours.\n5. Consolidate under-utilized App Service plans.\n\n## Reporting\nUse Cost Management + tags (owner/env/cost-center) to attribute spend, and set budgets with alerts.\n\n## Notes\nLead with the biggest line items. Quantify each recommendation's monthly saving and its risk.",
  },
  {
    name: 'azure-enterprise-infra-planner',
    displayName: 'Azure Enterprise Infra Planner',
    author: 'Microsoft',
    category: 'devops',
    model: ['universal'],
    description: 'Designs enterprise-grade Azure foundations — landing zones, management-group hierarchy, networking topology, identity, policy/governance, and security baselines — aligned to the Cloud Adoption Framework. Part of Microsoft\'s Azure Skills plugin.',
    trigger_phrases: ['design an Azure landing zone', 'plan our Azure management group structure', 'architect enterprise Azure networking', 'set up Azure governance and policy', 'plan a CAF-aligned Azure foundation'],
    tags: ['azure', 'landing-zone', 'governance', 'architecture', 'enterprise', 'microsoft'],
    source_url: MS_AZURE,
    markdown_instructions: "# Azure Enterprise Infra Planner\n\nDesign a scalable, governed Azure foundation before workloads land on it.\n\n## Foundations (Cloud Adoption Framework)\n- **Management groups + subscriptions** — a hierarchy that separates platform, landing zones, and sandbox; subscriptions as units of scale and billing.\n- **Identity** — Entra ID, RBAC model, PIM for privileged roles.\n- **Networking** — hub-and-spoke (or vWAN), private endpoints, DNS, firewall/egress control.\n- **Governance** — Azure Policy for guardrails (allowed regions/SKUs, required tags, encryption), plus Defender for Cloud baselines.\n- **Observability** — central Log Analytics + diagnostic settings by policy.\n\n## Process\n1. Capture requirements: scale, compliance, regions, connectivity to on-prem.\n2. Draft the management-group/subscription topology.\n3. Define the network and identity model.\n4. Encode guardrails as policy assignments.\n5. Express the whole thing as IaC (Bicep/Terraform) so it's reproducible.\n\n## Notes\nGuardrails as policy beat manual review. Design for least privilege from day one.",
  },

  // ── Lark / Feishu (larksuite/cli) ─────────────────────────────────────────
  {
    name: 'lark-doc',
    displayName: 'Lark Docs',
    author: 'Lark',
    category: 'writing',
    model: ['universal'],
    description: 'Creates and edits Lark/Feishu Docs programmatically via the official Lark CLI — generate documents, insert structured blocks, and sync content from an agent workflow. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['create a Lark doc', 'write to a Feishu document', 'generate a Lark Docs report', 'update a Lark doc from my data', 'export this into Lark Docs'],
    tags: ['lark', 'feishu', 'docs', 'integrations', 'writing', 'cli'],
    source_url: LARK,
    markdown_instructions: "# Lark Docs\n\nCreate and edit Lark/Feishu Docs from an agent workflow using the official Lark CLI.\n\n## Capabilities\n- Create new documents and write structured content (headings, lists, tables, callouts).\n- Read/update existing docs by token.\n- Move generated content (reports, summaries, meeting notes) straight into Lark Docs.\n\n## Workflow\n1. Authenticate the Lark CLI (tenant/app credentials with the docs scope).\n2. Create or locate the target document; capture its token.\n3. Build the content as document blocks and apply them.\n4. Parse the CLI's JSON output to confirm success and capture the doc URL.\n\n## Notes\n- Ensure the app has the document read/write OAuth scopes.\n- Prefer block-structured writes over dumping raw text so formatting survives.\n- The CLI returns structured JSON — read it to verify each step rather than assuming success.",
  },
  {
    name: 'lark-base',
    displayName: 'Lark Base',
    author: 'Lark',
    category: 'data-science',
    model: ['universal'],
    description: 'Manages Lark/Feishu Base (Bitable) — multi-dimensional tables: create tables and fields, and perform record CRUD and queries via the official Lark CLI. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['add records to Lark Base', 'query a Feishu Bitable', 'create a Lark Base table', 'sync data into Lark Base', 'update Bitable records'],
    tags: ['lark', 'feishu', 'bitable', 'base', 'database', 'integrations'],
    source_url: LARK,
    markdown_instructions: "# Lark Base (Bitable)\n\nRead and write Lark/Feishu Base — Bitable multi-dimensional tables — via the Lark CLI.\n\n## Capabilities\n- Create tables and define fields (text, number, single/multi-select, date, link).\n- Full record CRUD: create, read, update, delete.\n- Filtered queries and batch operations for syncing data in and out.\n\n## Workflow\n1. Authenticate with the bitable scope.\n2. Resolve the app_token (the Base) and table_id.\n3. For writes, shape records to match field types; batch where possible.\n4. For reads, apply filters/sorts server-side rather than pulling everything.\n5. Confirm from the CLI's JSON result.\n\n## Notes\n- Field types are strict — match them or the write is rejected.\n- Use batch endpoints for large syncs to stay within rate limits.\n- Great as a lightweight database backend for agent-driven workflows.",
  },
  {
    name: 'lark-im',
    displayName: 'Lark Messenger',
    author: 'Lark',
    category: 'integrations',
    model: ['universal'],
    description: 'Sends Lark/Feishu Messenger messages — text, rich interactive cards, and notifications to users or groups — via the official Lark CLI. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['send a Lark message', 'post a Feishu card to a group', 'notify the team on Lark', 'send an interactive Lark card', 'message a user on Feishu'],
    tags: ['lark', 'feishu', 'messaging', 'notifications', 'cards', 'integrations'],
    source_url: LARK,
    markdown_instructions: "# Lark Messenger (IM)\n\nSend messages and interactive cards in Lark/Feishu via the Lark CLI.\n\n## Capabilities\n- Plain text and rich-text messages to a user, chat, or group.\n- Interactive message cards (buttons, fields, columns) for approvals, alerts, and dashboards.\n- Notifications triggered from an agent workflow.\n\n## Workflow\n1. Authenticate with the im scope.\n2. Resolve the receiver: open_id / user_id / chat_id.\n3. Build the message — for cards, construct the card JSON (header, elements, actions).\n4. Send and read the returned message_id to confirm.\n\n## Notes\n- Cards beat walls of text for anything actionable; keep them scannable.\n- Respect rate limits when fanning out notifications.\n- Use the CLI's structured output to verify delivery rather than assuming it.",
  },
  {
    name: 'lark-calendar',
    displayName: 'Lark Calendar',
    author: 'Lark',
    category: 'productivity',
    model: ['universal'],
    description: 'Manages Lark/Feishu Calendar — create and update events, invite attendees, and check availability — via the official Lark CLI. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['schedule a Lark meeting', 'create a Feishu calendar event', 'check availability on Lark', 'invite people to a Lark event', 'update a calendar event in Feishu'],
    tags: ['lark', 'feishu', 'calendar', 'scheduling', 'productivity', 'integrations'],
    source_url: LARK,
    markdown_instructions: "# Lark Calendar\n\nCreate and manage Lark/Feishu calendar events from an agent workflow via the Lark CLI.\n\n## Capabilities\n- Create, update, and delete events.\n- Add attendees and set reminders.\n- Query free/busy to find a workable slot.\n\n## Workflow\n1. Authenticate with the calendar scope.\n2. Resolve the calendar_id (primary or shared).\n3. For scheduling, check attendee availability first, then create the event at a slot that works.\n4. Add attendees, location, and reminders; confirm from the returned event_id.\n\n## Notes\n- Always set the correct timezone on event times.\n- Check availability before booking to avoid conflicts.\n- Use recurrence rules for repeating events rather than creating many singles.",
  },
  {
    name: 'lark-approval',
    displayName: 'Lark Approval',
    author: 'Lark',
    category: 'productivity',
    model: ['universal'],
    description: 'Drives Lark/Feishu Approval workflows — submit approval instances, advance/approve/reject, and query status — via the official Lark CLI. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['submit a Lark approval', 'check approval status in Feishu', 'approve a Lark request', 'kick off an approval workflow on Lark', 'query Feishu approval instances'],
    tags: ['lark', 'feishu', 'approval', 'workflow', 'productivity', 'integrations'],
    source_url: LARK,
    markdown_instructions: "# Lark Approval\n\nCreate and manage Lark/Feishu Approval instances via the Lark CLI.\n\n## Capabilities\n- Submit a new approval instance against a defined approval template.\n- Approve / reject / transfer tasks.\n- Query the status and history of instances.\n\n## Workflow\n1. Authenticate with the approval scope.\n2. Identify the approval_code (template) and assemble the form field values.\n3. Create the instance; capture the instance_code.\n4. To act on a task, resolve the task_id and submit the decision with a comment.\n5. Poll status to confirm progression.\n\n## Notes\n- Form fields must match the template's widget definitions.\n- Pair with lark-im to notify approvers via an interactive card.\n- Read the CLI JSON to confirm each transition.",
  },
  {
    name: 'lark-slides',
    displayName: 'Lark Slides',
    author: 'Lark',
    category: 'productivity',
    model: ['universal'],
    description: 'Creates and edits Lark/Feishu Slides presentations programmatically via the official Lark CLI — generate decks and populate slides from an agent workflow. One of the larksuite/cli Agent Skills.',
    trigger_phrases: ['create a Lark slides deck', 'generate a Feishu presentation', 'build slides in Lark', 'populate a Lark deck from data', 'make a Feishu Slides presentation'],
    tags: ['lark', 'feishu', 'slides', 'presentation', 'productivity', 'integrations'],
    source_url: LARK,
    markdown_instructions: "# Lark Slides\n\nGenerate and edit Lark/Feishu Slides decks via the Lark CLI.\n\n## Capabilities\n- Create a new presentation and add slides.\n- Populate slides with titles, text, images, and shapes.\n- Update existing decks from data produced earlier in a workflow.\n\n## Workflow\n1. Authenticate with the slides/docs scope.\n2. Create the presentation; capture its token.\n3. Add slides and apply content blocks per slide.\n4. Confirm via the CLI's JSON output and capture the share URL.\n\n## Notes\n- Plan a consistent layout/theme across slides rather than ad-hoc per slide.\n- Keep one idea per slide; lead with the takeaway in the title.\n- Pair with a content/outline step to draft the deck structure before generating.",
  },

  // ── Firebase (firebase.google.com agent skills) ───────────────────────────
  {
    name: 'firebase-basics',
    displayName: 'Firebase Basics',
    author: 'Firebase',
    category: 'development',
    model: ['universal'],
    description: 'Core Firebase fundamentals for AI assistants — project setup, the CLI, SDK initialization, and how the products fit together — so agents work with Firebase accurately and at lower token cost. Official Firebase agent skill.',
    trigger_phrases: ['set up a Firebase project', 'initialize the Firebase SDK', 'how do Firebase products fit together', 'configure firebase.json', 'get started with Firebase'],
    tags: ['firebase', 'google', 'setup', 'cli', 'development'],
    source_url: FIREBASE,
    markdown_instructions: "# Firebase Basics\n\nGround agents in Firebase fundamentals so they set projects up correctly.\n\n## Covers\n- Project + app creation and the Firebase console model.\n- The Firebase CLI: login, init, the firebase.json config, emulators, and deploy.\n- SDK initialization for web/mobile/server and how to keep config out of source.\n- How the products relate: Auth, Firestore, Hosting, App Hosting, Functions, Storage.\n\n## Workflow\n1. Confirm or create the project and register the app.\n2. Install + authenticate the CLI; run 'firebase init' selecting only the needed products.\n3. Initialize the SDK with the app config; use the Local Emulator Suite for development.\n4. Wire environment-specific config (dev vs prod) cleanly.\n\n## Notes\n- Prefer the emulators during development to avoid touching prod data.\n- Keep service-account keys server-side only; never ship them to clients.\n- Branch into the focused skills (auth, hosting, app-hosting) for each product.",
  },
  {
    name: 'firebase-auth-basics',
    displayName: 'Firebase Auth Basics',
    author: 'Firebase',
    category: 'security',
    model: ['universal'],
    description: 'Implements Firebase Authentication — secure sign-in across providers, managing users, and protecting data with auth-based Security Rules. Official Firebase agent skill.',
    trigger_phrases: ['add Firebase authentication', 'set up Google sign-in with Firebase', 'protect Firestore with auth rules', 'manage Firebase users', 'add email/password auth'],
    tags: ['firebase', 'auth', 'authentication', 'security', 'google'],
    source_url: FIREBASE,
    markdown_instructions: "# Firebase Auth Basics\n\nImplement secure authentication with Firebase Auth and tie it to your data rules.\n\n## Capabilities\n- Sign-in methods: email/password, Google and other OAuth providers, anonymous, phone.\n- User management: create, look up, set custom claims, disable/delete.\n- Security Rules that gate Firestore/Storage on request.auth.\n\n## Workflow\n1. Enable the needed providers in the Firebase console.\n2. Wire client sign-in with the SDK; handle the auth state listener.\n3. For roles/permissions, set custom claims server-side (Admin SDK).\n4. Write Security Rules that check request.auth.uid and claims so data is protected at the source.\n5. Verify with the emulator's auth + rules testing.\n\n## Notes\n- Never trust the client — enforce access in Security Rules / server code, not just the UI.\n- Keep the Admin SDK and any service-account credentials server-side only.\n- Use custom claims for roles rather than storing trust state in client-writable docs.",
  },
  {
    name: 'firebase-hosting-basics',
    displayName: 'Firebase Hosting Basics',
    author: 'Firebase',
    category: 'devops',
    model: ['universal'],
    description: 'Deploys static sites, SPAs, and simple microservices to Firebase Hosting — config, rewrites/redirects, custom domains, and CDN delivery. Official Firebase agent skill.',
    trigger_phrases: ['deploy to Firebase Hosting', 'host a static site on Firebase', 'set up SPA rewrites on Firebase', 'add a custom domain to Firebase Hosting', 'configure Firebase Hosting'],
    tags: ['firebase', 'hosting', 'deployment', 'static-site', 'devops', 'google'],
    source_url: FIREBASE,
    markdown_instructions: "# Firebase Hosting Basics\n\nShip static sites, SPAs, and lightweight services on Firebase Hosting.\n\n## Capabilities\n- Fast global CDN delivery with automatic HTTPS.\n- Single-page-app rewrites (all routes → index.html) and custom redirects/headers.\n- Rewrites to Cloud Functions / Cloud Run for dynamic endpoints.\n- Preview channels for review before going live.\n\n## Workflow\n1. 'firebase init hosting' — set the public/build directory.\n2. Configure rewrites (SPA fallback), redirects, and cache headers in firebase.json.\n3. Build the app, then 'firebase hosting:channel:deploy' a preview, verify, and promote.\n4. Add and verify a custom domain.\n\n## Notes\n- Set long cache lifetimes on fingerprinted assets and short ones on index.html.\n- Use preview channels instead of deploying straight to live.\n- For server-rendered apps prefer App Hosting (see firebase-app-hosting-basics).",
  },
  {
    name: 'firebase-app-hosting-basics',
    displayName: 'Firebase App Hosting Basics',
    author: 'Firebase',
    category: 'devops',
    model: ['universal'],
    description: 'Deploys full-stack, server-rendered web apps (Next.js, Angular, and other frameworks) with Firebase App Hosting — git-based builds, backends, and managed runtime. Official Firebase agent skill.',
    trigger_phrases: ['deploy Next.js to Firebase App Hosting', 'set up Firebase App Hosting', 'host a server-rendered app on Firebase', 'configure App Hosting backend', 'git-based deploy with Firebase'],
    tags: ['firebase', 'app-hosting', 'ssr', 'nextjs', 'deployment', 'devops'],
    source_url: FIREBASE,
    markdown_instructions: "# Firebase App Hosting Basics\n\nDeploy full-stack, server-rendered apps with Firebase App Hosting.\n\n## When to use\nFor framework apps that need a server (SSR/streaming/API routes) — Next.js, Angular Universal, Astro SSR — rather than purely static output (which Hosting handles).\n\n## Capabilities\n- Git-connected, build-on-push backends with a managed runtime (built on Cloud Run).\n- Environment variables and secrets via the apphosting.yaml config.\n- Rollouts and rollbacks per backend.\n\n## Workflow\n1. Create an App Hosting backend and connect the GitHub repo/branch.\n2. Configure apphosting.yaml: runtime settings, env vars, and secret references.\n3. Push to the branch — App Hosting builds and rolls out automatically.\n4. Verify the live URL; roll back if a release regresses.\n\n## Notes\n- Store secrets in Secret Manager and reference them; don't inline them.\n- Pin the framework adapter/runtime versions for reproducible builds.\n- Use separate backends (or branches) for staging vs production.",
  },

  // ── Trail of Bits (trailofbits/skills) ────────────────────────────────────
  {
    name: 'Trail of Bits security skills',
    displayName: 'Trail of Bits Security Skills',
    author: 'Trail of Bits',
    category: 'security',
    model: ['anthropic'],
    description: "Trail of Bits' security skill suite for Claude Code: static analysis with Semgrep/CodeQL, differential (diff) security review, variant analysis, fix-commit verification, and deep audit-context building for vulnerability research and code audits.",
    trigger_phrases: ['run a security review on this diff', 'scan this codebase with Semgrep', 'find variants of this vulnerability', 'verify this fix commit', 'do a security audit of this code'],
    tags: ['security', 'audit', 'semgrep', 'codeql', 'vulnerability', 'trail-of-bits'],
    source_url: 'https://github.com/trailofbits/skills',
    markdown_instructions: "# Trail of Bits Security Skills\n\nA suite of security-research skills (from Trail of Bits) for vulnerability detection, code audit, and review workflows in Claude Code.\n\n## What's in the suite\n- **Static analysis** — run Semgrep (and CodeQL) scans, including parallel subagents and Semgrep Pro cross-file taint analysis when available; modes for full ruleset vs high-confidence security findings only.\n- **Semgrep rule creator** — author custom rules for project-specific patterns.\n- **Differential review** — security-focused review of just the changes in a diff/PR.\n- **Variant analysis** — given one finding, hunt the codebase for the same bug class elsewhere.\n- **Fix verification** — confirm a fix commit actually addresses the finding without introducing new bugs.\n- **Audit context** — build deep architectural context before a manual audit.\n\n## Workflow\n1. Establish context (architecture, trust boundaries, entry points).\n2. Run static analysis; triage findings (validate, don't trust blindly).\n3. For each real finding, run variant analysis to catch siblings.\n4. Propose fixes, then verify the fix commits.\n\n## Notes\nTreat tool output as leads, not verdicts — confirm exploitability before reporting. Prefer high-confidence modes for signal, full modes for coverage.",
  },

  // ── Google other ──────────────────────────────────────────────────────────
  {
    name: 'agentspace',
    displayName: 'Google Agentspace',
    author: 'Google',
    category: 'research',
    model: ['universal'],
    description: 'Builds on Google Agentspace — enterprise search and agents over your organization\'s data: connecting data sources, grounding agents in enterprise knowledge, and wiring assistant/agent experiences.',
    trigger_phrases: ['set up Google Agentspace', 'build an enterprise search agent', 'connect data sources to Agentspace', 'ground an agent in company knowledge', 'create an Agentspace assistant'],
    tags: ['google', 'agentspace', 'enterprise-search', 'agents', 'rag', 'research'],
    source_url: 'https://cloud.google.com/agentspace',
    markdown_instructions: "# Google Agentspace\n\nBuild enterprise search + agent experiences over organizational data with Google Agentspace.\n\n## Capabilities\n- Connect enterprise data sources (Drive, Confluence, Jira, SharePoint, databases) into a unified search corpus.\n- Ground agents/assistants in that corpus so answers cite real internal sources.\n- Compose multi-step agent workflows with access controls inherited from the source systems.\n\n## Workflow\n1. Define the data sources and connect them; confirm permission propagation (users only see what they're allowed to).\n2. Build/refresh the search index over the connected content.\n3. Configure the assistant: instructions, grounding, and the actions it can take.\n4. Evaluate answer quality and citation accuracy on a representative question set.\n\n## Notes\n- Respect source-system ACLs — grounding must not leak documents a user can't access.\n- Favor grounded, cited answers over free generation for enterprise trust.\n- Keep an eval set to catch regressions as the corpus changes.",
  },

  // ── Vendor tools ──────────────────────────────────────────────────────────
  {
    name: 'sentry-cli',
    displayName: 'Sentry CLI',
    author: 'Sentry',
    category: 'devops',
    model: ['universal'],
    description: 'Drives the Sentry CLI for release health and error monitoring — creating releases, associating commits, uploading source maps/debug files, and finalizing deploys so stack traces are readable and regressions are attributable.',
    trigger_phrases: ['upload source maps to Sentry', 'create a Sentry release', 'associate commits with a Sentry release', 'set up sentry-cli in CI', 'finalize a Sentry deploy'],
    tags: ['sentry', 'observability', 'releases', 'source-maps', 'devops', 'cli'],
    source_url: 'https://github.com/getsentry/sentry-cli',
    markdown_instructions: "# Sentry CLI\n\nUse sentry-cli to manage releases and make production errors debuggable.\n\n## Core tasks\n- Create a release keyed to your version/commit SHA.\n- Associate commits so Sentry can attribute regressions and suggest suspect commits.\n- Upload source maps (JS) or debug files (native/mobile) so stack traces de-minify/symbolicate.\n- Finalize the release and mark deploys per environment.\n\n## CI workflow\n1. Set SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT in the environment.\n2. 'sentry-cli releases new VERSION'.\n3. 'sentry-cli releases set-commits VERSION --auto'.\n4. Build with source maps, then 'sentry-cli sourcemaps upload' (and 'sourcemaps inject' first for reliable matching).\n5. 'sentry-cli releases finalize VERSION' and record the deploy.\n\n## Notes\n- Use the same VERSION string the app reports at runtime, or events won't match the release.\n- Don't ship source maps to end users — upload them to Sentry and strip from the public bundle.\n- Wire this into CI so every deploy is tracked automatically.",
  },
  {
    name: 'Firecrawl',
    displayName: 'Firecrawl',
    author: 'Firecrawl',
    category: 'browser-automation',
    model: ['universal'],
    description: 'Turns websites into clean, LLM-ready data with Firecrawl — scrape a single URL to markdown, crawl an entire site, map links, and run structured extraction. Handles JS rendering, pagination, and anti-bot so you get content, not HTML soup.',
    trigger_phrases: ['scrape this website to markdown', 'crawl this whole site', 'extract structured data from these pages', 'get clean content from a URL', 'map all the links on this site'],
    tags: ['firecrawl', 'scraping', 'crawling', 'web', 'browser-automation', 'extraction'],
    source_url: 'https://github.com/firecrawl/firecrawl',
    markdown_instructions: "# Firecrawl\n\nConvert web pages into clean, structured, LLM-ready data with Firecrawl.\n\n## Modes\n- **Scrape** — one URL → markdown/HTML/structured JSON; renders JS and strips boilerplate.\n- **Crawl** — follow links across a whole site/section and return every page's content.\n- **Map** — quickly enumerate all URLs on a site (great for scoping before a crawl).\n- **Extract** — pull specific fields across pages against a schema/prompt.\n\n## Workflow\n1. Pick the mode: single page (scrape), whole site (crawl), URL discovery (map), or fields (extract).\n2. For crawls, set include/exclude path patterns and a sane page limit.\n3. Request markdown for prose; request the structured/extract format when you need typed fields.\n4. Handle async crawl jobs by polling the job id to completion.\n\n## Notes\n- Respect robots/ToS and rate limits; keep an API key in the environment.\n- Prefer extract with a schema over regexing raw HTML when you need specific data.\n- Cap crawl breadth/depth so you don't pull thousands of irrelevant pages.",
  },

  // ── Browser / scraping (community) ────────────────────────────────────────
  {
    name: 'agent-browser',
    displayName: 'Agent Browser',
    author: 'Community',
    category: 'browser-automation',
    model: ['universal'],
    description: 'Gives an agent its own headless browser to navigate, click, type, and read live pages — for tasks that need a real rendered DOM: logins, multi-step flows, scraping JS-heavy sites, and verifying web UIs.',
    trigger_phrases: ['browse this site for me', 'click through this web flow', 'log in and grab the data', 'automate this browser task', 'read this JavaScript-rendered page'],
    tags: ['browser', 'automation', 'headless', 'playwright', 'scraping', 'browser-automation'],
    source_url: null,
    markdown_instructions: "# Agent Browser\n\nDrive a real (headless) browser so the agent can act on live, JavaScript-rendered pages.\n\n## When to use\n- The content only exists after JS runs (SPAs, infinite scroll).\n- The task is a flow: log in, fill a form, paginate, download.\n- You need to verify what a page actually renders.\n\n## Workflow\n1. Launch the browser and navigate to the start URL.\n2. Wait for the relevant elements/network to settle before acting.\n3. Interact via stable selectors (roles/text/test-ids), not brittle xpath.\n4. Extract the DOM/text you need; for multi-page flows, loop with explicit waits.\n5. Capture a screenshot when you need to confirm visual state.\n\n## Notes\n- Prefer accessibility roles and visible text for selectors — they survive markup churn.\n- Handle cookie banners/consent and auth up front.\n- Be a good citizen: honor rate limits and site terms.",
  },
  {
    name: 'use-my-browser',
    displayName: 'Use My Browser',
    author: 'Community',
    category: 'browser-automation',
    model: ['universal'],
    description: 'Lets the agent drive your actual logged-in browser session (your profile/cookies) so it can act on sites you\'re already authenticated to — without you re-sharing credentials. For personal automations behind a login.',
    trigger_phrases: ['use my logged-in browser', 'do this in my browser session', 'act on a site I\'m signed into', 'automate this behind my login', 'control my real browser'],
    tags: ['browser', 'automation', 'session', 'authenticated', 'personal', 'browser-automation'],
    source_url: null,
    markdown_instructions: "# Use My Browser\n\nAutomate tasks in the user's own authenticated browser session, reusing their existing logins instead of handling credentials.\n\n## When to use\nTasks that live behind a login the user already has — their email, dashboards, internal tools — where re-authenticating would be awkward or unsafe to script.\n\n## Workflow\n1. Connect to the user's running browser (or a profile with their cookies/session).\n2. Navigate to the target and confirm you're operating as the intended account.\n3. Perform the actions with explicit waits and stable selectors.\n4. Summarize exactly what you did, on which account, and what changed.\n\n## Safety\n- Treat the session as privileged: never exfiltrate cookies, tokens, or page contents beyond the task.\n- Confirm before any irreversible or outward-facing action (sending, paying, deleting, posting).\n- Stay strictly within the requested task — an authenticated session is powerful, so act narrowly.",
  },
  {
    name: 'just-scrape',
    displayName: 'Just Scrape',
    author: 'Community',
    category: 'browser-automation',
    model: ['universal'],
    description: 'A no-friction "give me the content" scraper — point it at a URL and get clean text/markdown back, picking the lightest method that works (plain fetch vs. headless render) without ceremony.',
    trigger_phrases: ['just scrape this page', 'get the text from this URL', 'grab this article content', 'pull the data off this page', 'scrape this quickly'],
    tags: ['scraping', 'web', 'markdown', 'extraction', 'browser-automation'],
    source_url: null,
    markdown_instructions: "# Just Scrape\n\nGet clean content from a URL with the least machinery that works.\n\n## Approach (cheapest first)\n1. Try a plain HTTP fetch and parse the HTML to text/markdown — fastest, no browser.\n2. If the page is JS-rendered or returns little content, escalate to a headless browser render, then extract.\n3. Strip nav/ads/boilerplate; keep the main content (article/body) and any tables.\n\n## Output\n- Default to markdown for prose so it's readable and LLM-friendly.\n- Return structured rows when the target is clearly tabular.\n- Include the source URL and fetch time.\n\n## Notes\n- Don't reach for a full browser when a fetch suffices — it's slower and heavier.\n- Respect robots/ToS and rate limits.\n- For multi-page or whole-site jobs, switch to a real crawler (e.g. Firecrawl) instead of looping here.",
  },

  // ── Workflow / agentic (Matt Pocock & community) ──────────────────────────
  {
    name: 'find-skills',
    displayName: 'Find Skills',
    author: 'Community',
    category: 'productivity',
    model: ['anthropic'],
    description: 'Discovers which installed Agent Skills are relevant to the current task by scanning available SKILL.md files and matching intent — so you reuse an existing skill instead of reinventing it.',
    trigger_phrases: ['find a skill for this', 'which skill should I use', 'is there a skill that does this', 'search my installed skills', 'what skills do I have for this'],
    tags: ['skills', 'discovery', 'meta', 'productivity', 'workflow'],
    source_url: null,
    markdown_instructions: "# Find Skills\n\nFind the right installed skill for a task instead of guessing or rebuilding.\n\n## When to use\nAt the start of a task, or any time you're unsure whether a capability already exists as a skill.\n\n## Workflow\n1. Extract the task's core intent (e.g. 'edit a PDF', 'deploy to Azure', 'write a PRD').\n2. Scan the skills directories (.claude/skills and .agents/skills) and read each SKILL.md's name + description + trigger phrases.\n3. Rank candidates by how well their description/triggers match the intent.\n4. Surface the top matches with a one-line reason each, then invoke the best fit.\n\n## Notes\n- Prefer an existing skill over re-implementing its behavior.\n- If nothing matches, say so plainly and proceed — or use write-a-skill to create one.\n- Re-check after the task shifts; the relevant skill can change mid-task.",
  },
  {
    name: 'write-a-skill',
    displayName: 'Write a Skill',
    author: 'Matt Pocock',
    category: 'development',
    model: ['anthropic'],
    description: 'Authors a new Agent Skill the right way — a tight SKILL.md with a sharp description and trigger conditions, progressive disclosure for details, and supporting files only when needed. Turns a repeated workflow into a reusable skill.',
    trigger_phrases: ['write a new skill', 'turn this workflow into a skill', 'create a SKILL.md', 'package this as an agent skill', 'author a Claude skill'],
    tags: ['skills', 'authoring', 'skill-md', 'meta', 'development'],
    source_url: 'https://github.com/mattpocock/skills',
    markdown_instructions: "# Write a Skill\n\nPackage a repeated workflow into a clean, reusable Agent Skill.\n\n## A good skill\n- **Name** — short, kebab-case, action-oriented.\n- **Description** — what it does AND when to use it; this is what the agent matches on, so make it specific and trigger-rich.\n- **Body** — concise, imperative instructions. Lead with when-to-use, then the workflow, then notes/pitfalls.\n- **Progressive disclosure** — keep SKILL.md lean; push deep reference, examples, or scripts into separate files the agent opens only when needed.\n\n## Process\n1. Capture the workflow as you actually do it — the decisions, not just the steps.\n2. Write the description first; if you can't state when to trigger it, the skill is too vague.\n3. Draft the body; cut anything the model already knows.\n4. Add only the supporting files that earn their place (scripts, schemas, long references).\n5. Test it on a real task and tighten the triggers.\n\n## Notes\nOne skill = one job. If it sprawls, split it. Avoid restating general model knowledge — encode the specific, non-obvious how.",
  },
  {
    name: 'grill-me',
    displayName: 'Grill Me',
    author: 'Community',
    category: 'productivity',
    model: ['anthropic'],
    description: 'Relentlessly interrogates a plan, design, or decision — asking pointed questions down every branch of the decision tree until ambiguities and unstated assumptions are resolved. Pressure-tests your thinking before you build.',
    trigger_phrases: ['grill me on this plan', 'poke holes in this design', 'interrogate my approach', 'pressure-test this decision', 'ask me the hard questions'],
    tags: ['planning', 'review', 'questioning', 'decision-making', 'productivity'],
    source_url: null,
    markdown_instructions: "# Grill Me\n\nInterrogate a plan/design/decision until it's actually sound — not until it sounds nice.\n\n## How it works\nAsk sharp, specific questions and follow each answer down its branch. Don't accept hand-waving; surface the assumption underneath. Keep going until every meaningful fork in the decision tree has a deliberate answer.\n\n## Focus the questions on\n- Unstated assumptions and the conditions under which they break.\n- Edge cases, failure modes, and the rollback/recovery story.\n- Scope: what's explicitly out, and why.\n- Alternatives considered and the reason this one wins.\n- The riskiest unknown — what would change the whole approach if false.\n\n## Style\nOne or a few questions at a time, building on the answers. Be direct and a little adversarial — the point is to find the weak spot now, cheaply, instead of in production. Stop when the plan can survive its own hardest question.",
  },
  {
    name: 'grill-with-docs',
    displayName: 'Grill With Docs',
    author: 'Community',
    category: 'productivity',
    model: ['anthropic'],
    description: 'The grill-me interrogation, but it captures the outcome: as decisions get resolved, it writes them into a CONTEXT.md and records architecture decisions (ADRs) so the reasoning is durable, not lost in chat.',
    trigger_phrases: ['grill me and write it down', 'interrogate this and record decisions', 'capture our decisions in an ADR', 'update CONTEXT.md as we decide', 'document this design discussion'],
    tags: ['planning', 'documentation', 'adr', 'context', 'decision-making', 'productivity'],
    source_url: null,
    markdown_instructions: "# Grill With Docs\n\nPressure-test a plan AND capture the decisions so they survive the conversation.\n\n## How it works\n1. Interrogate the plan/design with pointed questions down each branch (see grill-me).\n2. As each fork resolves, write the decision and its rationale into a CONTEXT.md.\n3. For consequential, hard-to-reverse choices, record an ADR: context, decision, alternatives, consequences.\n\n## CONTEXT.md should hold\n- The current understanding of the problem and constraints.\n- Resolved decisions with one-line rationale.\n- Open questions still to settle.\n\n## ADRs should hold\n- The decision, the forces behind it, the options weighed, and what it commits you to.\n\n## Notes\nWrite as you go, not at the end — the value is a durable trail another person (or agent) can pick up. Keep it terse; link out for detail rather than bloating the doc.",
  },
  {
    name: 'caveman',
    displayName: 'Caveman',
    author: 'Matt Pocock',
    category: 'productivity',
    model: ['anthropic'],
    description: 'A terse communication mode that strips filler words to cut token usage (~75%) while keeping full technical accuracy — blunt, telegraphic responses for when you want signal, not prose.',
    trigger_phrases: ['answer in caveman mode', 'be terse, cut the filler', 'caveman style', 'minimal words max signal', 'stop being verbose'],
    tags: ['communication', 'concise', 'tokens', 'style', 'productivity'],
    source_url: 'https://github.com/mattpocock/skills',
    markdown_instructions: "# Caveman\n\nCommunicate in a stripped-down, telegraphic register that preserves technical accuracy while cutting filler.\n\n## Rules\n- Drop articles, pleasantries, and hedging. Keep nouns, verbs, identifiers, numbers.\n- One idea per line. Bullet over paragraph.\n- Never sacrifice a technical fact, file path, command, or caveat for brevity — cut words, not meaning.\n- Keep exact names: functions, files, flags, error strings stay verbatim.\n\n## Example\nInstead of: 'I think we should probably consider updating the configuration file so that it points to the new endpoint.'\nWrite: 'Update config → new endpoint.'\n\n## When NOT to use\n- User-facing copy, docs, or anything another person reads as prose.\n- Subtle reasoning where the connective tissue matters.\n\n## Notes\nThe goal is density, not rudeness. Stay correct and complete; just lose the padding.",
  },
  {
    name: 'handoff',
    displayName: 'Handoff',
    author: 'Community',
    category: 'productivity',
    model: ['universal'],
    description: 'Produces a deliberate handoff document at a natural stopping point — what was done, current state, decisions made, and the precise next step — so work resumes cleanly in a new session or a different agent (e.g. plan in Claude, build in Codex).',
    trigger_phrases: ['write a handoff doc', 'hand this off to another session', 'create a handoff for Codex', 'summarize state for the next agent', 'prepare a clean stopping point'],
    tags: ['handoff', 'context', 'continuity', 'cross-agent', 'productivity'],
    source_url: null,
    markdown_instructions: "# Handoff\n\nWrite a purposeful handoff so work continues without re-deriving context — more deliberate than an automatic compaction summary, and portable across agents.\n\n## Include\n1. **Goal** — what we're ultimately trying to achieve.\n2. **Done so far** — what's complete and verified, with file paths.\n3. **Current state** — what's in progress, what's broken, what's untested.\n4. **Decisions** — choices made and why (so they're not re-litigated).\n5. **Next step** — the single concrete action to take next, specific enough to start immediately.\n6. **Watch out for** — landmines, gotchas, and constraints.\n\n## Notes\n- Write it to a file (HANDOFF.md) so any session/agent can pick it up.\n- Be concrete: reference exact files, commands, and line ranges over vague description.\n- Optimize for a cold reader — assume zero memory of this conversation.\n- Great for planning in one tool and implementing in another.",
  },
  {
    name: 'context-mode',
    displayName: 'Context Mode',
    author: 'Community',
    category: 'productivity',
    model: ['anthropic'],
    description: 'Deliberately builds and maintains the working context for a task before acting — reading the right files, mapping the system, and recording what matters — so the agent operates from grounded understanding instead of guesses.',
    trigger_phrases: ['build context first', 'get up to speed on this codebase', 'map the system before changing it', 'load the right context', 'understand before acting'],
    tags: ['context', 'understanding', 'codebase', 'planning', 'productivity'],
    source_url: null,
    markdown_instructions: "# Context Mode\n\nFront-load understanding so changes are grounded, not guessed.\n\n## When to use\nBefore non-trivial work in an unfamiliar area — and any time you catch yourself assuming how something works.\n\n## Workflow\n1. Frame the task and what you'd need to know to do it safely.\n2. Locate and read the relevant files/modules — entry points, the code you'll touch, and its tests.\n3. Map the data flow and the boundaries (what calls this, what it depends on).\n4. Record the essentials: key files, invariants, and the constraints that shape the solution.\n5. Only then plan/act.\n\n## Discipline\n- Read before writing. A few minutes of context saves a wrong rewrite.\n- Verify assumptions against the code, not memory.\n- Keep the captured context tight — the facts that change decisions, not a file dump.\n\n## Notes\nPairs naturally with writing-plans (context → plan → execute) and handoff (persist the context for later).",
  },
  {
    name: 'to-prd',
    displayName: 'To PRD',
    author: 'Community',
    category: 'writing',
    model: ['universal'],
    description: 'Turns a rough idea or conversation into a structured Product Requirements Document — problem, goals, users, scope, requirements, success metrics, and open questions — ready to share and build from.',
    trigger_phrases: ['turn this into a PRD', 'write a product requirements doc', 'draft a PRD for this feature', 'formalize this idea into a spec', 'create a product spec'],
    tags: ['prd', 'product', 'spec', 'requirements', 'writing'],
    source_url: null,
    markdown_instructions: "# To PRD\n\nConvert a rough idea or discussion into a clear Product Requirements Document.\n\n## Structure\n1. **Problem** — the user problem and why it matters now.\n2. **Goals / non-goals** — what success means; what's explicitly out of scope.\n3. **Users & use cases** — who this is for and the jobs they're doing.\n4. **Requirements** — functional requirements as testable statements; note priority (must/should/could).\n5. **UX / flows** — the key flows at a high level.\n6. **Success metrics** — how you'll know it worked.\n7. **Risks & open questions** — unknowns and decisions still needed.\n\n## Discipline\n- Write requirements as outcomes, not implementations — leave room for engineering.\n- Make every requirement verifiable; vague asks become arguments later.\n- Keep non-goals explicit; scope creep starts where they're missing.\n\n## Notes\nLead with the problem, not the solution. Mark assumptions clearly so reviewers can challenge them.",
  },
  {
    name: 'to-issues',
    displayName: 'To Issues',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'Breaks a plan, PRD, or feature into well-formed, independently-actionable tracker issues — clear title, context, acceptance criteria, and scope — with sensible sizing and dependencies.',
    trigger_phrases: ['break this into issues', 'create GitHub issues from this plan', 'turn this PRD into tickets', 'generate tasks for this feature', 'split this into actionable issues'],
    tags: ['issues', 'tickets', 'planning', 'github', 'project-management', 'development'],
    source_url: null,
    markdown_instructions: "# To Issues\n\nDecompose a plan/PRD/feature into clean, actionable issues.\n\n## Each issue should have\n- **Title** — specific and outcome-oriented.\n- **Context** — why this exists and what it connects to (link the plan/PRD).\n- **Scope** — what's included and explicitly excluded.\n- **Acceptance criteria** — testable conditions for 'done'.\n- **Size** — small enough to finish in one focused sitting; split if not.\n\n## Process\n1. Read the source and identify the natural units of work.\n2. Draft one issue per unit; keep them independently shippable where possible.\n3. Note dependencies (blocks / blocked-by) and a rough order.\n4. Add labels/area and a priority.\n\n## Notes\n- Prefer many small issues over a few sprawling ones — they're easier to estimate, review, and parallelize.\n- Acceptance criteria are the contract; if you can't write them, the issue isn't ready.\n- Don't encode implementation detail that belongs to the implementer.",
  },
  {
    name: 'diagnose',
    displayName: 'Diagnose',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'A disciplined diagnostic routine for bugs and failures — reproduce, gather evidence, form and test hypotheses, and isolate root cause before proposing a fix. Stops guess-and-check debugging.',
    trigger_phrases: ['diagnose this bug', 'figure out why this is failing', 'find the root cause', 'debug this systematically', 'why does this error happen'],
    tags: ['debugging', 'diagnosis', 'root-cause', 'troubleshooting', 'development'],
    source_url: null,
    markdown_instructions: "# Diagnose\n\nFind the real cause of a failure before changing anything.\n\n## Routine\n1. **Reproduce** — get a reliable, minimal repro. If you can't reproduce it, you can't confirm a fix.\n2. **Gather evidence** — exact error text, stack trace, logs, recent diffs, and the inputs that trigger it.\n3. **Hypothesize** — list plausible causes ranked by likelihood given the evidence.\n4. **Test cheaply** — design the smallest check that confirms or kills each hypothesis (a log line, a unit probe, a bisect). Change one variable at a time.\n5. **Isolate** — narrow to the specific line/condition responsible.\n6. **Then fix** — and verify against the original repro.\n\n## Discipline\n- Follow the evidence, not a hunch. Let data eliminate hypotheses.\n- Don't fix symptoms; trace to the cause.\n- Note what you ruled out, so you don't loop.\n\n## Notes\nIf the cause is genuinely unclear, add instrumentation and reproduce again rather than shotgun-editing.",
  },
  {
    name: 'triage',
    displayName: 'Triage',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'Rapidly sorts a pile of bugs, issues, or alerts by severity and urgency, deduplicates, assigns priority, and recommends the next action for each — so attention goes to what matters first.',
    trigger_phrases: ['triage these issues', 'prioritize this bug backlog', 'sort these alerts by severity', 'what should I fix first', 'triage my inbox of tickets'],
    tags: ['triage', 'prioritization', 'issues', 'incident', 'project-management', 'development'],
    source_url: null,
    markdown_instructions: "# Triage\n\nTurn a noisy pile of issues/alerts into a prioritized, de-duplicated action list.\n\n## For each item assess\n- **Severity** — blast radius if real (data loss > broken core flow > cosmetic).\n- **Urgency** — is it actively hurting users now?\n- **Confidence** — is it reproducible/verified, or a vague report?\n- **Duplicate?** — fold into an existing issue if so.\n\n## Assign\n- A priority (P0 incident → P3 backlog) from severity × urgency.\n- A next action: fix now, schedule, needs-info, won't-fix, or merge-as-dup.\n- An owner/area when known.\n\n## Process\n1. Skim everything once to spot clusters and dupes.\n2. Rank by priority; pull P0/P1 to the top with a recommended immediate step.\n3. Flag anything missing the info needed to act.\n\n## Notes\nBe decisive — a rough-but-fast ordering beats a perfect-but-late one. Call out the single most important thing to do next.",
  },
  {
    name: 'prototype',
    displayName: 'Prototype',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'Builds a fast, throwaway-quality prototype to test an idea or de-risk an unknown — optimizing for learning speed over polish, with the riskiest assumption validated first.',
    trigger_phrases: ['prototype this idea', 'build a quick proof of concept', 'spike this approach', 'throw together a rough version', 'test if this is feasible'],
    tags: ['prototype', 'poc', 'spike', 'mvp', 'development'],
    source_url: null,
    markdown_instructions: "# Prototype\n\nBuild the smallest thing that answers the open question, fast.\n\n## Mindset\nA prototype exists to learn, not to ship. Optimize for speed of validation; accept hardcoding, missing edge cases, and ugly code.\n\n## Workflow\n1. State the question the prototype must answer ('can we X?', 'is Y fast enough?', 'does this UX feel right?').\n2. Identify the riskiest assumption and target it first — don't build the easy parts.\n3. Cut every corner that doesn't affect the answer: stub data, skip auth, ignore error paths.\n4. Get to a runnable result, then evaluate against the question.\n5. Decide: pursue, pivot, or drop — and capture what you learned.\n\n## Notes\n- Label it clearly as a prototype; don't let throwaway code drift into production.\n- If it proves out, plan a real implementation rather than hardening the spike.\n- Timebox it — the value is the answer, not the artifact.",
  },
  {
    name: 'improve-codebase-architecture',
    displayName: 'Improve Codebase Architecture',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'Assesses a codebase\'s structure and proposes concrete, incremental architecture improvements — module boundaries, coupling/cohesion, layering, and dependency direction — with safe refactoring steps that keep behavior intact.',
    trigger_phrases: ['improve this codebase architecture', 'reduce coupling in this code', 'suggest a refactor for structure', 'fix the module boundaries', 'clean up the architecture'],
    tags: ['architecture', 'refactoring', 'design', 'coupling', 'development'],
    source_url: null,
    markdown_instructions: "# Improve Codebase Architecture\n\nMake structural improvements that pay down complexity without changing behavior.\n\n## Assess\n- Map modules and their dependencies; look for cycles, god-modules, and leaky boundaries.\n- Check cohesion (does each module do one thing?) and coupling (how much do they know about each other?).\n- Note where business logic mixes with I/O, and where the dependency direction points the wrong way.\n\n## Propose (incremental)\n1. Identify the highest-leverage boundary to fix first.\n2. Define the target structure (clear layers/seams, dependencies pointing inward).\n3. Sequence small, behavior-preserving refactors — extract, invert a dependency, introduce an interface — each independently verifiable.\n4. Lean on tests as a safety net; add characterization tests before risky moves.\n\n## Discipline\n- Refactor in small steps with green tests between each — never a big-bang rewrite.\n- Separate 'change structure' commits from 'change behavior' commits.\n- Justify each change by the complexity or risk it removes, not aesthetics.",
  },
  {
    name: 'tdd',
    displayName: 'TDD',
    author: 'Community',
    category: 'development',
    model: ['universal'],
    description: 'Drives implementation with strict test-driven development — red, green, refactor — writing a failing test first, the minimum code to pass, then cleaning up, so behavior is specified and regressions are caught.',
    trigger_phrases: ['do this with TDD', 'write the test first', 'red green refactor this', 'test-drive this feature', 'add tests before the code'],
    tags: ['tdd', 'testing', 'red-green-refactor', 'tests', 'development'],
    source_url: null,
    markdown_instructions: "# TDD\n\nImplement with the test-driven loop so behavior is specified before it's coded.\n\n## The loop\n1. **Red** — write one small failing test that states the next bit of desired behavior. Run it; watch it fail for the right reason.\n2. **Green** — write the minimum code to make it pass. Resist gold-plating.\n3. **Refactor** — clean up code and tests with the suite green.\nRepeat in tight cycles.\n\n## Discipline\n- One behavior per test; clear arrange/act/assert.\n- Don't write production code without a failing test demanding it.\n- Keep cycles small — minutes, not hours.\n- Test behavior and contracts, not implementation details, so refactors don't break tests.\n\n## Notes\n- A failing test that fails for the wrong reason is a false signal — confirm the failure mode.\n- Bug fixes start with a test that reproduces the bug, then the fix turns it green.\n- Fast, deterministic tests keep the loop usable.",
  },

  // ── Design (impeccable vocabulary + community design skills) ───────────────
  {
    name: 'impeccable',
    displayName: 'Impeccable',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Installs a shared design vocabulary so you can steer UI with single words — polish, audit, critique, distill, animate, bolder, quieter — instead of long descriptions. A compact command language for taste-driven frontend work.',
    trigger_phrases: ['make this impeccable', 'polish this UI', 'critique this design', 'make it bolder', 'make it quieter', 'distill this interface'],
    tags: ['design', 'ui', 'vocabulary', 'polish', 'frontend', 'taste'],
    source_url: null,
    markdown_instructions: "# Impeccable\n\nA shared design vocabulary: steer UI with one word instead of a paragraph. Each command is a precise, repeatable design move.\n\n## Vocabulary\n- **polish** — tighten spacing, alignment, and consistency; fix the small stuff that reads as 'unfinished'.\n- **audit** — review against design principles and list concrete issues (hierarchy, contrast, rhythm, states).\n- **critique** — honest, specific design feedback with the reasoning, not vibes.\n- **distill** — remove until only what's essential remains; reduce visual noise.\n- **animate** — add purposeful motion (enter/exit, feedback) that aids comprehension.\n- **bolder** — push contrast, scale, and confidence; commit to a stronger statement.\n- **quieter** — dial down; let whitespace and restraint carry it.\n\n## How to use\nState the command on a target ('polish the card', 'make the hero bolder'). Apply the specific move, then show the before/after intent.\n\n## Notes\nThe value is a consistent, fast feedback language. Keep each move surgical — one intent at a time — and ground changes in design principles, not personal preference.",
  },
  {
    name: 'polish',
    displayName: 'Polish',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Takes a working-but-rough UI to finished quality — fixing spacing, alignment, typographic rhythm, contrast, consistency, and missing states — the fine-grained refinement pass that separates "demo" from "shipped".',
    trigger_phrases: ['polish this interface', 'make this UI feel finished', 'tighten up the design', 'clean up spacing and alignment', 'final design pass'],
    tags: ['design', 'ui', 'refinement', 'spacing', 'frontend', 'polish'],
    source_url: null,
    markdown_instructions: "# Polish\n\nTake a UI from 'works' to 'finished'. Polish is the accumulation of small corrections that make something feel intentional.\n\n## Checklist\n- **Spacing** — consistent scale; even padding; related things close, unrelated things apart.\n- **Alignment** — everything on a grid; no 1px drift; optical alignment where math lies.\n- **Typography** — clear hierarchy, sensible line-height/measure, no orphaned headings.\n- **Color & contrast** — accessible contrast; restrained palette; consistent semantic colors.\n- **States** — hover/focus/active/disabled, plus empty/loading/error — not just the happy path.\n- **Consistency** — components, radii, shadows, and icon sizes match across the surface.\n- **Detail** — transitions feel smooth; focus rings visible; nothing overflows or clips.\n\n## Process\n1. View the real rendered UI (screenshot it).\n2. Note every small wrongness against the checklist.\n3. Fix in a pass, then re-view to confirm.\n\n## Notes\nPolish is additive correctness, not redesign — preserve the intent, sharpen the execution.",
  },
  {
    name: 'critique',
    displayName: 'Critique',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Gives honest, specific design critique — what works, what doesn\'t, and why — grounded in design principles (hierarchy, contrast, rhythm, consistency) with actionable directions rather than vague praise.',
    trigger_phrases: ['critique this design', 'give me honest design feedback', 'what\'s wrong with this UI', 'review this layout critically', 'design review this screen'],
    tags: ['design', 'critique', 'feedback', 'review', 'ui'],
    source_url: null,
    markdown_instructions: "# Critique\n\nDeliver design feedback that's honest, specific, and actionable.\n\n## Evaluate against principles\n- **Hierarchy** — does your eye land on the most important thing first?\n- **Contrast & legibility** — is text readable; do important elements stand out?\n- **Spacing & rhythm** — is there a consistent system, or arbitrary gaps?\n- **Consistency** — do components, type, and color follow one language?\n- **Intent** — does the design make a confident choice, or read as a default template?\n- **States & edge cases** — empty/loading/error/overflow handled?\n\n## How to deliver\n1. Lead with what genuinely works (and why).\n2. Name the highest-impact problems specifically — element, issue, and the principle it violates.\n3. Give a direction for each, not just a verdict ('increase the title's size/weight to establish hierarchy').\n4. Separate must-fix from nitpick.\n\n## Notes\nBe candid — vague praise helps no one. Critique the work, ground every point in a principle, and make each note something the maker can act on.",
  },
  {
    name: 'brandkit',
    displayName: 'Brandkit',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Generates a cohesive brand identity kit — logo concepts, color system, typography, and mockups — from a brief or an existing website, giving you a consistent visual foundation to design against.',
    trigger_phrases: ['create a brand kit', 'generate a brand identity', 'make a color and type system', 'build a brandkit from my website', 'design a logo and palette'],
    tags: ['brand', 'identity', 'logo', 'colors', 'typography', 'design'],
    source_url: null,
    markdown_instructions: "# Brandkit\n\nProduce a cohesive brand identity kit to design against.\n\n## Deliverables\n- **Logo concepts** — a primary mark plus variants (wordmark, icon, lockups).\n- **Color system** — primary/secondary/accent with semantic roles and accessible pairings (include hex + usage).\n- **Typography** — a type pairing (display + body) with a clear scale.\n- **Mockups** — the system applied to a few real surfaces so it reads as a brand, not swatches.\n\n## Workflow\n1. Gather the brief: audience, personality (3-5 adjectives), and any constraints. If pointed at a URL, read the existing site and extract its current brand.\n2. Establish the palette and type first — they carry the most identity.\n3. Develop logo directions consistent with that personality.\n4. Apply everything to mockups to validate cohesion.\n5. Output an organized kit (tokens + assets) ready to reuse.\n\n## Notes\nCommit to a point of view — distinctive beats safe. Keep the system small enough to apply consistently.",
  },
  {
    name: 'extract-design-system',
    displayName: 'Extract Design System',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Reverse-engineers a design system from an existing site or screenshots — pulling colors, typography, spacing scale, radii, shadows, and components into reusable design tokens you can build with.',
    trigger_phrases: ['extract a design system from this site', 'pull design tokens from this URL', 'reverse-engineer these styles', 'get the color and type system from this page', 'turn this site into design tokens'],
    tags: ['design-system', 'tokens', 'extraction', 'css', 'design', 'branding'],
    source_url: null,
    markdown_instructions: "# Extract Design System\n\nTurn an existing site (or screenshots) into a reusable design system.\n\n## What to extract\n- **Color** — the real palette in use (primary, neutrals, semantic) with hex values and roles.\n- **Typography** — font families, the size/weight scale, and line-heights.\n- **Spacing** — the underlying spacing unit and scale.\n- **Shape** — border radii, border widths, shadow elevations.\n- **Components** — recurring patterns (buttons, cards, inputs) and their variants/states.\n\n## Workflow\n1. Point at the URL (read the rendered DOM/CSS) or analyze the provided screenshots.\n2. Sample computed styles for representative elements rather than guessing.\n3. Normalize into a token set (e.g. color-, space-, font-, radius- scales) — collapse near-duplicates into one scale.\n4. Output tokens in a usable format (CSS variables / JSON) plus a short component inventory.\n\n## Notes\nPrefer a small, consistent scale over capturing every one-off value. Flag inconsistencies in the source rather than faithfully reproducing them.",
  },
  {
    name: 'image-to-code',
    displayName: 'Image to Code',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Converts a screenshot or design mockup into clean, responsive front-end code — matching layout, spacing, type, and color — producing components that look like the image and are maintainable.',
    trigger_phrases: ['turn this screenshot into code', 'build this mockup as a component', 'convert this design to HTML/CSS', 'recreate this UI from an image', 'image to React component'],
    tags: ['image-to-code', 'frontend', 'ui', 'screenshot', 'design', 'html'],
    source_url: null,
    markdown_instructions: "# Image to Code\n\nRecreate a screenshot/mockup as clean, responsive front-end code.\n\n## Workflow\n1. Read the image carefully: layout structure, spacing rhythm, type scale, colors, and component boundaries.\n2. Decide the layout primitives (flex/grid) and the component breakdown before writing markup.\n3. Build semantic, accessible markup; style with a consistent scale (not magic pixel values copied blindly).\n4. Make it responsive — infer sensible breakpoints; don't hardcode the screenshot's width.\n5. Compare the render against the image and correct spacing/type/color drift.\n\n## Quality bar\n- Match visual hierarchy and spacing, not just rough placement.\n- Use real tokens (consistent colors, type scale, spacing) rather than one-off values.\n- Cover interactive states (hover/focus) even if the static image doesn't show them.\n\n## Notes\nReproduce intent, not artifacts — clean up obvious inconsistencies in the source. Prefer reusable components over a single wall of markup.",
  },
  {
    name: 'sleek-design-mobile-apps',
    displayName: 'Sleek Mobile App Design',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Design guidance for modern, sleek mobile app UIs — native-feeling layouts, touch ergonomics, motion, and platform conventions (iOS/Android) that produce polished, premium-feeling screens.',
    trigger_phrases: ['design a sleek mobile app screen', 'make this mobile UI feel premium', 'mobile app design guidance', 'improve this app screen design', 'native-feeling mobile layout'],
    tags: ['mobile', 'design', 'ios', 'android', 'ui', 'app'],
    source_url: null,
    markdown_instructions: "# Sleek Mobile App Design\n\nDesign mobile screens that feel native, modern, and premium.\n\n## Principles\n- **Touch ergonomics** — comfortable hit targets (~44pt+), primary actions in thumb reach, generous spacing.\n- **Hierarchy** — one clear focus per screen; let content lead, chrome recede.\n- **Platform fit** — respect iOS/Android conventions (navigation, system gestures, safe areas, dynamic type).\n- **Motion** — purposeful transitions and feedback; springy, quick, never gratuitous.\n- **Depth & restraint** — subtle elevation, soft shadows, and whitespace over heavy borders.\n\n## Workflow\n1. Define the screen's single job and primary action.\n2. Lay out with a consistent spacing/type scale; honor safe areas and notches.\n3. Choose a restrained palette with one confident accent.\n4. Add motion for state changes and navigation.\n5. Check states (empty/loading/error) and both light/dark.\n\n## Notes\nPremium reads as consistency + restraint + the small details. Avoid cramming; whitespace is a feature on mobile.",
  },

  // ── Generative media ──────────────────────────────────────────────────────
  {
    name: 'ai-image-generation',
    displayName: 'AI Image Generation',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Generates images from text with modern image models — crafting effective prompts (subject, style, composition, lighting), choosing aspect ratios, and iterating toward a target look for assets, mockups, and illustrations.',
    trigger_phrases: ['generate an image of', 'create an illustration with AI', 'make a hero image', 'text to image', 'generate art for this'],
    tags: ['image-generation', 'ai', 'prompting', 'art', 'design', 'assets'],
    source_url: null,
    markdown_instructions: "# AI Image Generation\n\nProduce images from text with current image-generation models.\n\n## Prompt structure\nDescribe, in order: subject → action/context → style/medium → composition/framing → lighting/mood → color → quality/aspect. Specific beats verbose.\n\n## Practices\n- Pick the aspect ratio for the use (16:9 hero, 1:1 avatar, 9:16 mobile).\n- Add style anchors ('flat vector', 'cinematic photo', 'isometric 3D') to control the look.\n- Use negative prompts / constraints to exclude unwanted elements when supported.\n- Iterate: generate, critique against the target, adjust one variable, regenerate.\n\n## Workflow\n1. Clarify the intended use and visual target.\n2. Draft a precise prompt; choose model + aspect ratio.\n3. Generate a small batch; pick the closest and refine.\n4. Upscale / finalize the chosen image.\n\n## Notes\n- Don't imitate a living artist's signature style or produce trademarked characters.\n- For text-in-image, keep it short — models still struggle with long strings.\n- Keep prompts as reusable recipes for consistent series.",
  },
  {
    name: 'ai-video-generation',
    displayName: 'AI Video Generation',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Generates short video clips from text or images with modern video models — shaping prompts for motion, camera, and pacing, choosing duration/aspect, and stitching shots into a coherent sequence.',
    trigger_phrases: ['generate a video clip', 'text to video', 'animate this image', 'create a short AI video', 'make a video from this prompt'],
    tags: ['video-generation', 'ai', 'motion', 'prompting', 'design', 'media'],
    source_url: null,
    markdown_instructions: "# AI Video Generation\n\nCreate short video clips with text/image-to-video models.\n\n## Prompting for video\nBeyond the still-image details, specify: motion (what moves, how), camera (static / pan / dolly / orbit), pacing/speed, and the start/end state. Image-to-video gives more control over the look — animate a chosen still.\n\n## Practices\n- Keep each generation a single shot/idea; clips are short (seconds).\n- Choose aspect + duration for the platform (16:9, 9:16 vertical, 1:1).\n- Maintain continuity across shots with consistent subject/style descriptions (and seed/reference frames where supported).\n- Iterate one variable at a time — motion is harder to steer than stills.\n\n## Workflow\n1. Storyboard the shots and the motion in each.\n2. Generate shot by shot (text-to-video, or image-to-video from a generated still).\n3. Review for artifacts/morphing; regenerate weak shots.\n4. Stitch shots, add audio/edits in a video editor.\n\n## Notes\nExpect to generate several takes per shot. Avoid imitating real people or copyrighted footage.",
  },
  {
    name: 'video-edit',
    displayName: 'Video Edit',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Programmatic video editing with ffmpeg-style operations — trim, cut, concatenate, crop/scale, overlay text/captions/watermarks, extract audio/frames, change format, and compress — driven from a script or agent.',
    trigger_phrases: ['trim this video', 'add captions to a video', 'concatenate these clips', 'compress this video', 'extract audio from a video'],
    tags: ['video', 'ffmpeg', 'editing', 'media', 'design', 'cli'],
    source_url: null,
    markdown_instructions: "# Video Edit\n\nEdit video programmatically (primarily via ffmpeg) for repeatable, scriptable operations.\n\n## Common operations\n- **Trim / cut** — extract a segment by start + duration.\n- **Concatenate** — join clips (re-encode, or stream-copy when codecs match).\n- **Resize / crop** — scale to a target resolution or crop to an aspect.\n- **Overlay** — burn in captions/subtitles, text, watermark, or a logo.\n- **Audio** — extract, replace, mix, or mute the track.\n- **Frames** — pull stills / make a thumbnail or contact sheet.\n- **Transcode / compress** — change container/codec; tune bitrate/CRF for size vs quality.\n\n## Workflow\n1. Inspect the input first (ffprobe): codec, resolution, fps, duration.\n2. Choose stream-copy (fast, lossless) when only cutting/remuxing; re-encode only when needed.\n3. Build the ffmpeg command; verify the output plays and matches intent.\n\n## Notes\n- Prefer CRF-based encoding (e.g. x264) for a good size/quality balance.\n- Keep the source; write to a new file.\n- For complex multi-track edits, use a filtergraph rather than chained passes.",
  },
  {
    name: 'colorize',
    displayName: 'Colorize',
    author: 'Community',
    category: 'design',
    model: ['universal'],
    description: 'Adds color to black-and-white or grayscale images — restoring old photos or stylizing line art — with natural, consistent palettes and control over mood, then cleans up artifacts.',
    trigger_phrases: ['colorize this black and white photo', 'add color to this image', 'restore color to an old photo', 'colorize this line art', 'make this grayscale image color'],
    tags: ['colorize', 'image', 'restoration', 'photo', 'design', 'ai'],
    source_url: null,
    markdown_instructions: "# Colorize\n\nAdd believable, consistent color to grayscale or black-and-white images.\n\n## Use cases\n- Restoring old/historical photos with period-plausible color.\n- Coloring line art / sketches with a chosen palette.\n- Re-coloring or stylizing existing imagery for a mood.\n\n## Workflow\n1. Assess the source: subject, era, lighting, and what 'correct' color means here (realistic restoration vs stylized).\n2. Establish a target palette/mood before generating.\n3. Colorize, keeping skin tones, skies, and known objects natural and consistent across the image.\n4. Inspect for artifacts — color bleed across edges, desaturated patches, inconsistent tones — and correct.\n\n## Notes\n- For restorations, aim for plausible, not invented-vivid; subtlety reads as real.\n- Keep colors consistent for the same object across a set of images.\n- Preserve the original; output a new file and note that it's a colorized reconstruction.",
  },

  // ── Content / marketing ───────────────────────────────────────────────────
  {
    name: 'content-research-writer',
    displayName: 'Content Research Writer',
    author: 'Community',
    category: 'writing',
    model: ['universal'],
    description: 'Researches a topic across sources and writes well-structured, accurate long-form content — blog posts, guides, articles — grounding claims in cited sources and shaping it for the target reader and intent.',
    trigger_phrases: ['research and write an article about', 'write a researched blog post', 'create a long-form guide on', 'write a deeply-researched piece', 'draft an article with sources'],
    tags: ['writing', 'research', 'content', 'blog', 'long-form', 'seo'],
    source_url: null,
    markdown_instructions: "# Content Research Writer\n\nResearch a topic and turn it into accurate, well-structured long-form content.\n\n## Process\n1. **Scope** — clarify the audience, intent (inform / persuade / rank), angle, and length.\n2. **Research** — gather from multiple credible sources; note facts with their source. Look for consensus and disagreement, not just the first hit.\n3. **Outline** — structure around the reader's questions: a clear arc with descriptive headings.\n4. **Draft** — write in the target voice; lead with value, support claims with the researched facts, and cite where it matters.\n5. **Verify** — check every factual claim against a source; cut anything you can't support.\n6. **Polish** — tighten, vary sentence rhythm, and ensure each section earns its place.\n\n## Quality\n- Ground claims in sources; don't assert from thin air.\n- Specific > generic — examples, numbers, and concrete detail.\n- Structure for skimming (headings, short paragraphs) without sacrificing depth.\n\n## Notes\nMatch search intent if it's for SEO, but write for humans first. Disclose uncertainty rather than overstating.",
  },
  {
    name: 'competitive-analysis',
    displayName: 'Competitive Analysis',
    author: 'Community',
    category: 'marketing',
    model: ['universal'],
    description: 'Researches and structures a competitive landscape — identifying competitors, comparing features/pricing/positioning/strengths and gaps — into a clear matrix and an actionable summary of where you can win.',
    trigger_phrases: ['do a competitive analysis', 'compare us to competitors', 'analyze the competitive landscape', 'build a competitor comparison matrix', 'find gaps vs competitors'],
    tags: ['competitive-analysis', 'market-research', 'strategy', 'positioning', 'marketing'],
    source_url: null,
    markdown_instructions: "# Competitive Analysis\n\nMap a competitive landscape and surface where to compete.\n\n## Workflow\n1. **Identify competitors** — direct, indirect, and emerging; pick the relevant set, not everyone.\n2. **Gather data per competitor** — positioning/value prop, target segment, key features, pricing/packaging, GTM/channels, and visible strengths and weaknesses. Use their site, docs, pricing, reviews, and public coverage.\n3. **Build a comparison matrix** — competitors as rows, dimensions as columns, so differences are scannable.\n4. **Analyze** — find the gaps and clusters: where everyone is strong (table stakes), where they're weak (opportunity), and where you're differentiated.\n5. **Recommend** — a short, honest read on where you can win and the risks.\n\n## Quality\n- Be objective — note competitors' real strengths, not just weaknesses.\n- Cite sources for non-obvious claims; flag assumptions.\n- Turn findings into positioning/roadmap implications, not just a table.\n\n## Notes\nUse only public information. Keep the matrix tight — the dimensions that actually drive buyer choice.",
  },

  // ── Dev / devops misc ─────────────────────────────────────────────────────
  {
    name: 'secure-linux-web-hosting',
    displayName: 'Secure Linux Web Hosting',
    author: 'Community',
    category: 'security',
    model: ['universal'],
    description: 'Hardens a Linux server for hosting web apps — SSH lockdown, firewall, least-privilege users, TLS, reverse proxy, automatic updates, and sane service isolation — turning a fresh box into a defensible host.',
    trigger_phrases: ['harden my Linux web server', 'secure this VPS for hosting', 'set up a secure nginx host', 'lock down SSH and firewall', 'production-secure my Linux server'],
    tags: ['security', 'linux', 'hosting', 'hardening', 'nginx', 'devops'],
    source_url: null,
    markdown_instructions: "# Secure Linux Web Hosting\n\nHarden a Linux host so it can serve web apps safely.\n\n## Baseline\n- **Access** — key-only SSH, disable root login and password auth, change/limit exposure, add fail2ban.\n- **Users** — a non-root deploy user with least privilege; sudo only where needed.\n- **Firewall** — default-deny inbound; open only 22 (restricted), 80, 443. Use ufw/nftables.\n- **Updates** — enable unattended security updates.\n- **TLS** — terminate HTTPS at a reverse proxy (nginx/Caddy) with auto-renewing certs (Let's Encrypt); redirect HTTP→HTTPS; modern ciphers + HSTS.\n- **App isolation** — run services as their own users, behind the proxy, bound to localhost; use systemd sandboxing or containers.\n- **Secrets** — never in the repo or world-readable; tight file permissions.\n\n## Process\n1. Patch, create the deploy user, lock down SSH, enable the firewall.\n2. Install the reverse proxy + TLS; proxy to the app on localhost.\n3. Harden services and set log/monitoring.\n4. Verify externally (open ports, TLS grade) and confirm only intended surface is exposed.\n\n## Notes\nMinimize attack surface first — every open port/service is a liability. Re-check after each change.",
  },
  {
    name: 'github-actions-docs',
    displayName: 'GitHub Actions Docs',
    author: 'Community',
    category: 'devops',
    model: ['universal'],
    description: 'Authoritative reference + authoring help for GitHub Actions — workflow syntax, triggers, jobs/steps, matrix builds, caching, secrets/OIDC, reusable workflows, and common CI/CD recipes — so pipelines are correct and secure.',
    trigger_phrases: ['write a GitHub Actions workflow', 'fix my GitHub Actions YAML', 'set up CI with GitHub Actions', 'add caching to my Actions workflow', 'use OIDC in GitHub Actions'],
    tags: ['github-actions', 'ci-cd', 'workflows', 'automation', 'devops', 'yaml'],
    source_url: null,
    markdown_instructions: "# GitHub Actions Docs\n\nAuthor and debug GitHub Actions workflows correctly.\n\n## Core model\n- **Triggers (on:)** — push, pull_request, schedule, workflow_dispatch, etc. Scope with branches/paths.\n- **Jobs** run in parallel by default on a runner; **steps** run sequentially. Use needs: for ordering.\n- **Matrix** — fan out across versions/OSes; set fail-fast and max-parallel deliberately.\n- **Caching** — actions/cache (or setup-* built-in caching) keyed on lockfiles to speed installs.\n- **Artifacts** — pass build outputs between jobs.\n- **Reusable workflows / composite actions** — DRY shared logic.\n\n## Security\n- Prefer OIDC to cloud providers over long-lived secrets.\n- Pin third-party actions to a commit SHA; set least-privilege permissions: on GITHUB_TOKEN.\n- Be careful with pull_request_target and untrusted input (script injection).\n\n## Workflow\n1. Define triggers and the job graph.\n2. Add setup + cache, then build/test/deploy steps.\n3. Wire secrets/OIDC and minimal permissions.\n4. Validate on a branch; read logs and iterate.\n\n## Notes\nKeep workflows readable; factor shared steps into reusable/composite actions.",
  },
];

async function run() {
  console.log(`\n📦 Featured set: ${FEATURED.length} skills to ensure present.\n`);

  // Fetch existing names (paginate past the 1000-row default cap).
  const existing = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('skills').select('name').range(from, from + PAGE - 1);
    if (error) { console.error('❌ read failed:', error.message); process.exit(1); }
    for (const r of data ?? []) existing.add(r.name);
    if (!data || data.length < PAGE) break;
  }
  console.log(`🔍 ${existing.size} skills already in the database.`);

  const toInsert = FEATURED.filter((s) => !existing.has(s.name));
  const skipped = FEATURED.filter((s) => existing.has(s.name)).map((s) => s.name);
  if (skipped.length) console.log(`⏭️  Skipping ${skipped.length} already present: ${skipped.join(', ')}`);
  console.log(`\n🚀 Inserting ${toInsert.length} new skills...\n`);

  let success = 0, failed = 0;
  const errors = [];
  for (let i = 0; i < toInsert.length; i += 10) {
    const batch = toInsert.slice(i, i + 10);
    const rows = batch.map((s) => ({
      name: s.name,
      description: s.description,
      trigger_phrases: s.trigger_phrases ?? [],
      markdown_instructions: s.markdown_instructions ?? '',
      tags: s.tags ?? [],
      script_urls: [],
      source_url: s.source_url ?? null,
    }));
    const { data, error } = await supabase.from('skills').insert(rows).select('name');
    if (error) {
      console.error(`  ⚠️  Batch ${Math.floor(i / 10) + 1} failed (${error.message}); retrying individually...`);
      for (const row of rows) {
        const { error: e } = await supabase.from('skills').insert(row);
        if (e) { console.error(`    ❌ ${row.name}: ${e.message}`); errors.push(row.name); failed++; }
        else { console.log(`    ✅ ${row.name}`); success++; }
      }
    } else {
      console.log(`  ✅ Batch ${Math.floor(i / 10) + 1}: ${data.map((d) => d.name).join(', ')}`);
      success += batch.length;
    }
  }

  console.log(`\n📊 Results: ${success} inserted, ${failed} failed, ${skipped.length} skipped.`);
  if (errors.length) console.log(`❌ Failed: ${errors.join(', ')}`);

  const { count } = await supabase.from('skills').select('id', { count: 'exact', head: true });
  console.log(`\nTotal skills in database now: ${count ?? 'unknown'}`);
}

// Allow importing FEATURED without running (e.g. to sync classifications).
if (process.argv[1] && process.argv[1].endsWith('insert-featured-skills.mjs')) {
  run().catch((e) => { console.error(e); process.exit(1); });
}
