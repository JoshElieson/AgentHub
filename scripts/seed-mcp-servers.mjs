import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MCP_SERVERS = [
  {
    name: "github",
    description: "Manage repositories, issues, and PRs via the official GitHub MCP server.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/github",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env_vars: {
      GITHUB_PERSONAL_ACCESS_TOKEN: "<YOUR_GITHUB_PAT>"
    },
    tags: ["github", "git", "source-control", "official"]
  },
  {
    name: "postgres",
    description: "Connect to and query PostgreSQL databases directly from Claude.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:password@localhost:5432/dbname"],
    env_vars: {},
    tags: ["database", "postgres", "sql", "official"]
  },
  {
    name: "sqlite",
    description: "Query and inspect local SQLite databases.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite",
    command: "uvx",
    args: ["mcp-server-sqlite", "--db-path", "/path/to/database.db"],
    env_vars: {},
    tags: ["database", "sqlite", "sql", "local", "official"]
  },
  {
    name: "filesystem",
    description: "Provide LLMs with access to local files and directories securely.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"],
    env_vars: {},
    tags: ["filesystem", "local", "files", "official"]
  },
  {
    name: "memory",
    description: "A knowledge graph memory server that allows AI to remember context across sessions.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    env_vars: {},
    tags: ["memory", "knowledge-graph", "context", "official"]
  },
  {
    name: "fetch",
    description: "Allow LLMs to fetch and parse web content into clean markdown.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
    command: "uvx",
    args: ["mcp-server-fetch"],
    env_vars: {},
    tags: ["web", "fetch", "scraping", "official"]
  },
  {
    name: "puppeteer",
    description: "Browser automation for web scraping and interaction using Puppeteer.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-puppeteer"],
    env_vars: {},
    tags: ["browser", "automation", "puppeteer", "scraping", "official"]
  },
  {
    name: "brave-search",
    description: "Perform web searches using the Brave Search API.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env_vars: {
      BRAVE_API_KEY: "<YOUR_BRAVE_API_KEY>"
    },
    tags: ["search", "web", "brave", "official"]
  },
  {
    name: "slack",
    description: "Interact with Slack channels, read messages, and post updates.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env_vars: {
      SLACK_BOT_TOKEN: "<YOUR_SLACK_BOT_TOKEN>",
      SLACK_TEAM_ID: "<YOUR_SLACK_TEAM_ID>"
    },
    tags: ["slack", "chat", "communication", "official"]
  },
  {
    name: "gdrive",
    description: "Read, search, and manage Google Drive files.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gdrive"],
    env_vars: {},
    tags: ["google-drive", "files", "cloud", "official"]
  },
  {
    name: "sequential-thinking",
    description: "A dynamic thinking process server for LLMs to think through complex problems step-by-step.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
    env_vars: {},
    tags: ["logic", "reasoning", "thinking", "official"]
  },
  {
    name: "google-maps",
    description: "Access Google Maps data, routes, and places directly via Claude.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-google-maps"],
    env_vars: {
      GOOGLE_MAPS_API_KEY: "<YOUR_GOOGLE_MAPS_API_KEY>"
    },
    tags: ["maps", "location", "google", "official"]
  },
  {
    name: "gitlab",
    description: "Manage GitLab repositories, pipelines, issues, and MRs.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gitlab"],
    env_vars: {
      GITLAB_PERSONAL_ACCESS_TOKEN: "<YOUR_GITLAB_PAT>",
      GITLAB_API_URL: "https://gitlab.com/api/v4"
    },
    tags: ["gitlab", "git", "source-control", "official"]
  },
  {
    name: "sentry",
    description: "Analyze and query Sentry errors and performance issues.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/sentry",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-sentry"],
    env_vars: {
      SENTRY_AUTH_TOKEN: "<YOUR_SENTRY_TOKEN>"
    },
    tags: ["sentry", "monitoring", "errors", "official"]
  },
  {
    name: "notion",
    description: "Read, write, and search Notion pages and databases.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/notion",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-notion"],
    env_vars: {
      NOTION_API_KEY: "<YOUR_NOTION_API_KEY>"
    },
    tags: ["notion", "productivity", "docs", "official"]
  },
  {
    name: "linear",
    description: "Create and manage issues, projects, and cycles in Linear.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/linear",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-linear"],
    env_vars: {
      LINEAR_API_KEY: "<YOUR_LINEAR_API_KEY>"
    },
    tags: ["linear", "project-management", "issues", "official"]
  },
  {
    name: "time",
    description: "A simple server to give the LLM access to the current time, date, and timezone conversions.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-time"],
    env_vars: {},
    tags: ["time", "utility", "official"]
  },
  {
    name: "aws-kb",
    description: "Search and retrieve documents from AWS Knowledge Bases for Amazon Bedrock.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/aws-kb",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-aws-kb"],
    env_vars: {
      AWS_ACCESS_KEY_ID: "<YOUR_AWS_ACCESS_KEY>",
      AWS_SECRET_ACCESS_KEY: "<YOUR_AWS_SECRET_KEY>",
      AWS_REGION: "us-east-1"
    },
    tags: ["aws", "cloud", "knowledge-base", "official"]
  },
  {
    name: "supabase",
    description: "Interact with Supabase projects, tables, edge functions, and run SQL queries.",
    github_url: "https://github.com/supabase/mcp-server",
    command: "npx",
    args: ["-y", "supabase-mcp-server"],
    env_vars: {
      SUPABASE_ACCESS_TOKEN: "<YOUR_SUPABASE_ACCESS_TOKEN>"
    },
    tags: ["supabase", "database", "sql", "postgres"]
  },
  {
    name: "docker",
    description: "Control, inspect, and manage local Docker containers and images.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/docker",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-docker"],
    env_vars: {},
    tags: ["docker", "containers", "devops"]
  },
  {
    name: "kubernetes",
    description: "Interact with Kubernetes clusters, read pods, logs, and manage deployments.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/kubernetes",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-kubernetes"],
    env_vars: {
      KUBECONFIG: "~/.kube/config"
    },
    tags: ["kubernetes", "k8s", "devops"]
  },
  {
    name: "obsidian",
    description: "Read, search, and update Obsidian markdown vaults.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/obsidian",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-obsidian", "/path/to/obsidian/vault"],
    env_vars: {},
    tags: ["obsidian", "notes", "markdown"]
  },
  {
    name: "jira",
    description: "Create, read, and manage Jira tickets and agile boards.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/jira",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-jira"],
    env_vars: {
      JIRA_API_TOKEN: "<YOUR_JIRA_API_TOKEN>",
      JIRA_EMAIL: "<YOUR_JIRA_EMAIL>",
      JIRA_DOMAIN: "<YOUR_JIRA_DOMAIN>.atlassian.net"
    },
    tags: ["jira", "atlassian", "project-management", "tickets"]
  },
  {
    name: "confluence",
    description: "Search, read, and update Confluence documentation spaces.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/confluence",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-confluence"],
    env_vars: {
      CONFLUENCE_API_TOKEN: "<YOUR_CONFLUENCE_API_TOKEN>",
      CONFLUENCE_EMAIL: "<YOUR_CONFLUENCE_EMAIL>",
      CONFLUENCE_DOMAIN: "<YOUR_CONFLUENCE_DOMAIN>.atlassian.net"
    },
    tags: ["confluence", "atlassian", "docs", "wiki"]
  },
  {
    name: "tavily",
    description: "Perform deep, AI-optimized web searches using the Tavily API.",
    github_url: "https://github.com/tavily-ai/tavily-mcp",
    command: "npx",
    args: ["-y", "@tavily/mcp-server"],
    env_vars: {
      TAVILY_API_KEY: "<YOUR_TAVILY_API_KEY>"
    },
    tags: ["search", "web", "ai", "tavily"]
  },
  {
    name: "stripe",
    description: "Read Stripe customers, subscriptions, and invoices safely.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/stripe",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-stripe"],
    env_vars: {
      STRIPE_SECRET_KEY: "<YOUR_STRIPE_SECRET_KEY>"
    },
    tags: ["stripe", "payments", "finance", "api"]
  },
  {
    name: "cloudflare",
    description: "Manage Cloudflare DNS, Workers, and caching rules.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/cloudflare",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-cloudflare"],
    env_vars: {
      CLOUDFLARE_API_TOKEN: "<YOUR_CF_API_TOKEN>"
    },
    tags: ["cloudflare", "dns", "cdn", "cloud"]
  },
  {
    name: "npm",
    description: "Search npm packages, fetch metadata, and read package.json files.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/npm",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-npm"],
    env_vars: {},
    tags: ["npm", "javascript", "packages", "dev"]
  },
  {
    name: "figma",
    description: "Extract data, layers, and components from Figma designs.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/figma",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-figma"],
    env_vars: {
      FIGMA_PERSONAL_ACCESS_TOKEN: "<YOUR_FIGMA_PAT>"
    },
    tags: ["figma", "design", "ui", "api"]
  },
  {
    name: "vercel",
    description: "Deploy to Vercel, read build logs, and manage project environments.",
    github_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/vercel",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-vercel"],
    env_vars: {
      VERCEL_TOKEN: "<YOUR_VERCEL_TOKEN>"
    },
    tags: ["vercel", "deployment", "cloud", "nextjs"]
  },
  {
    name: "asana",
    description: "Create tasks, manage projects, and update statuses in Asana.",
    github_url: "https://github.com/example/mcp-server-asana",
    command: "npx",
    args: ["-y", "mcp-server-asana"],
    env_vars: { ASANA_ACCESS_TOKEN: "<YOUR_ASANA_TOKEN>" },
    tags: ["asana", "project-management", "tasks"]
  },
  {
    name: "trello",
    description: "Manage Trello boards, lists, and cards.",
    github_url: "https://github.com/example/mcp-server-trello",
    command: "npx",
    args: ["-y", "mcp-server-trello"],
    env_vars: { TRELLO_API_KEY: "<YOUR_TRELLO_KEY>", TRELLO_API_TOKEN: "<YOUR_TRELLO_TOKEN>" },
    tags: ["trello", "project-management", "kanban"]
  },
  {
    name: "mongodb",
    description: "Connect to and query MongoDB databases.",
    github_url: "https://github.com/example/mcp-server-mongodb",
    command: "npx",
    args: ["-y", "mcp-server-mongodb", "mongodb://localhost:27017"],
    env_vars: {},
    tags: ["database", "mongodb", "nosql"]
  },
  {
    name: "mysql",
    description: "Run SQL queries against MySQL or MariaDB databases.",
    github_url: "https://github.com/example/mcp-server-mysql",
    command: "npx",
    args: ["-y", "mcp-server-mysql", "mysql://user:password@localhost:3306/db"],
    env_vars: {},
    tags: ["database", "mysql", "sql"]
  },
  {
    name: "redis",
    description: "Inspect and manage Redis cache stores.",
    github_url: "https://github.com/example/mcp-server-redis",
    command: "npx",
    args: ["-y", "mcp-server-redis", "redis://localhost:6379"],
    env_vars: {},
    tags: ["database", "redis", "cache"]
  },
  {
    name: "aws-s3",
    description: "List, read, and write files to Amazon S3 buckets.",
    github_url: "https://github.com/example/mcp-server-aws-s3",
    command: "npx",
    args: ["-y", "mcp-server-aws-s3"],
    env_vars: { AWS_ACCESS_KEY_ID: "<YOUR_KEY>", AWS_SECRET_ACCESS_KEY: "<YOUR_SECRET>" },
    tags: ["aws", "s3", "storage", "cloud"]
  },
  {
    name: "google-docs",
    description: "Read and write Google Docs documents directly.",
    github_url: "https://github.com/example/mcp-server-google-docs",
    command: "npx",
    args: ["-y", "mcp-server-google-docs"],
    env_vars: { GOOGLE_SERVICE_ACCOUNT: "<JSON_CREDENTIALS>" },
    tags: ["google", "docs", "productivity"]
  },
  {
    name: "google-sheets",
    description: "Query and update Google Sheets spreadsheets.",
    github_url: "https://github.com/example/mcp-server-google-sheets",
    command: "npx",
    args: ["-y", "mcp-server-google-sheets"],
    env_vars: { GOOGLE_SERVICE_ACCOUNT: "<JSON_CREDENTIALS>" },
    tags: ["google", "sheets", "spreadsheet"]
  },
  {
    name: "google-calendar",
    description: "Manage events and check availability on Google Calendar.",
    github_url: "https://github.com/example/mcp-server-google-calendar",
    command: "npx",
    args: ["-y", "mcp-server-google-calendar"],
    env_vars: { GOOGLE_SERVICE_ACCOUNT: "<JSON_CREDENTIALS>" },
    tags: ["google", "calendar", "scheduling"]
  },
  {
    name: "zendesk",
    description: "Read, reply to, and manage Zendesk support tickets.",
    github_url: "https://github.com/example/mcp-server-zendesk",
    command: "npx",
    args: ["-y", "mcp-server-zendesk"],
    env_vars: { ZENDESK_SUBDOMAIN: "subdomain", ZENDESK_EMAIL: "email@domain", ZENDESK_TOKEN: "<TOKEN>" },
    tags: ["zendesk", "support", "tickets", "crm"]
  },
  {
    name: "hubspot",
    description: "Query contacts, companies, and deals from HubSpot CRM.",
    github_url: "https://github.com/example/mcp-server-hubspot",
    command: "npx",
    args: ["-y", "mcp-server-hubspot"],
    env_vars: { HUBSPOT_ACCESS_TOKEN: "<YOUR_HUBSPOT_TOKEN>" },
    tags: ["hubspot", "crm", "sales"]
  },
  {
    name: "salesforce",
    description: "Execute SOQL queries and update Salesforce records.",
    github_url: "https://github.com/example/mcp-server-salesforce",
    command: "npx",
    args: ["-y", "mcp-server-salesforce"],
    env_vars: { SF_USERNAME: "<USER>", SF_PASSWORD: "<PASS>", SF_TOKEN: "<TOKEN>" },
    tags: ["salesforce", "crm", "enterprise"]
  },
  {
    name: "shopify",
    description: "Manage Shopify products, orders, and inventory.",
    github_url: "https://github.com/example/mcp-server-shopify",
    command: "npx",
    args: ["-y", "mcp-server-shopify"],
    env_vars: { SHOPIFY_SHOP_NAME: "<NAME>", SHOPIFY_ACCESS_TOKEN: "<TOKEN>" },
    tags: ["shopify", "ecommerce", "store"]
  },
  {
    name: "airtable",
    description: "Read and write records to Airtable bases.",
    github_url: "https://github.com/example/mcp-server-airtable",
    command: "npx",
    args: ["-y", "mcp-server-airtable"],
    env_vars: { AIRTABLE_PERSONAL_ACCESS_TOKEN: "<YOUR_TOKEN>" },
    tags: ["airtable", "database", "no-code"]
  },
  {
    name: "datadog",
    description: "Query Datadog metrics, logs, and monitors.",
    github_url: "https://github.com/example/mcp-server-datadog",
    command: "npx",
    args: ["-y", "mcp-server-datadog"],
    env_vars: { DD_API_KEY: "<API_KEY>", DD_APP_KEY: "<APP_KEY>" },
    tags: ["datadog", "monitoring", "observability"]
  },
  {
    name: "grafana",
    description: "Access Grafana dashboards, panels, and data sources.",
    github_url: "https://github.com/example/mcp-server-grafana",
    command: "npx",
    args: ["-y", "mcp-server-grafana"],
    env_vars: { GRAFANA_URL: "<URL>", GRAFANA_API_KEY: "<API_KEY>" },
    tags: ["grafana", "monitoring", "dashboards"]
  },
  {
    name: "elasticsearch",
    description: "Run complex searches against Elasticsearch clusters.",
    github_url: "https://github.com/example/mcp-server-elasticsearch",
    command: "npx",
    args: ["-y", "mcp-server-elasticsearch"],
    env_vars: { ES_URL: "http://localhost:9200" },
    tags: ["elasticsearch", "search", "database"]
  },
  {
    name: "pinecone",
    description: "Query and manage Pinecone vector databases.",
    github_url: "https://github.com/example/mcp-server-pinecone",
    command: "npx",
    args: ["-y", "mcp-server-pinecone"],
    env_vars: { PINECONE_API_KEY: "<YOUR_PINECONE_KEY>" },
    tags: ["pinecone", "vector-db", "ai", "search"]
  },
  {
    name: "qdrant",
    description: "Interact with Qdrant vector search engine.",
    github_url: "https://github.com/example/mcp-server-qdrant",
    command: "npx",
    args: ["-y", "mcp-server-qdrant"],
    env_vars: { QDRANT_URL: "<URL>", QDRANT_API_KEY: "<KEY>" },
    tags: ["qdrant", "vector-db", "ai"]
  },
  {
    name: "chroma",
    description: "Manage collections and embeddings in Chroma DB.",
    github_url: "https://github.com/example/mcp-server-chroma",
    command: "npx",
    args: ["-y", "mcp-server-chroma"],
    env_vars: { CHROMA_SERVER_HOST: "localhost", CHROMA_SERVER_PORT: "8000" },
    tags: ["chroma", "vector-db", "ai", "local"]
  },
  {
    name: "huggingface",
    description: "Run inference and download models from Hugging Face.",
    github_url: "https://github.com/example/mcp-server-huggingface",
    command: "npx",
    args: ["-y", "mcp-server-huggingface"],
    env_vars: { HUGGINGFACE_API_KEY: "<YOUR_HF_TOKEN>" },
    tags: ["huggingface", "ai", "models", "ml"]
  },
  {
    name: "discord",
    description: "Read messages and post to Discord channels via bot.",
    github_url: "https://github.com/example/mcp-server-discord",
    command: "npx",
    args: ["-y", "mcp-server-discord"],
    env_vars: { DISCORD_BOT_TOKEN: "<YOUR_DISCORD_TOKEN>" },
    tags: ["discord", "chat", "community"]
  },
  {
    name: "zoom",
    description: "Schedule and manage Zoom meetings.",
    github_url: "https://github.com/example/mcp-server-zoom",
    command: "npx",
    args: ["-y", "mcp-server-zoom"],
    env_vars: { ZOOM_ACCOUNT_ID: "<ID>", ZOOM_CLIENT_ID: "<CLIENT>", ZOOM_CLIENT_SECRET: "<SECRET>" },
    tags: ["zoom", "video", "meetings", "communication"]
  },
  {
    name: "intercom",
    description: "Manage customer conversations and articles in Intercom.",
    github_url: "https://github.com/example/mcp-server-intercom",
    command: "npx",
    args: ["-y", "mcp-server-intercom"],
    env_vars: { INTERCOM_ACCESS_TOKEN: "<YOUR_INTERCOM_TOKEN>" },
    tags: ["intercom", "support", "chat", "crm"]
  },
  {
    name: "reddit",
    description: "Read subreddits, posts, and comments from Reddit.",
    github_url: "https://github.com/example/mcp-server-reddit",
    command: "npx",
    args: ["-y", "mcp-server-reddit"],
    env_vars: { REDDIT_CLIENT_ID: "<ID>", REDDIT_CLIENT_SECRET: "<SECRET>" },
    tags: ["reddit", "social", "community"]
  },
  {
    name: "twitter",
    description: "Post tweets and read timelines via Twitter/X API.",
    github_url: "https://github.com/example/mcp-server-twitter",
    command: "npx",
    args: ["-y", "mcp-server-twitter"],
    env_vars: { TWITTER_API_KEY: "<KEY>", TWITTER_API_SECRET: "<SECRET>", TWITTER_ACCESS_TOKEN: "<TOKEN>" },
    tags: ["twitter", "social", "marketing"]
  },
  {
    name: "stripe-billing",
    description: "Advanced Stripe integration for managing recurring billing and usage.",
    github_url: "https://github.com/example/mcp-server-stripe-billing",
    command: "npx",
    args: ["-y", "mcp-server-stripe-billing"],
    env_vars: { STRIPE_SECRET_KEY: "<YOUR_STRIPE_SECRET_KEY>" },
    tags: ["stripe", "billing", "finance"]
  },
  {
    name: "sendgrid",
    description: "Send transactional emails via SendGrid.",
    github_url: "https://github.com/example/mcp-server-sendgrid",
    command: "npx",
    args: ["-y", "mcp-server-sendgrid"],
    env_vars: { SENDGRID_API_KEY: "<YOUR_SENDGRID_KEY>" },
    tags: ["sendgrid", "email", "communication"]
  },
  {
    name: "twilio",
    description: "Send SMS and WhatsApp messages via Twilio.",
    github_url: "https://github.com/example/mcp-server-twilio",
    command: "npx",
    args: ["-y", "mcp-server-twilio"],
    env_vars: { TWILIO_ACCOUNT_SID: "<SID>", TWILIO_AUTH_TOKEN: "<TOKEN>" },
    tags: ["twilio", "sms", "communication"]
  },
  {
    name: "aws-lambda",
    description: "Invoke and manage AWS Lambda functions.",
    github_url: "https://github.com/example/mcp-server-aws-lambda",
    command: "npx",
    args: ["-y", "mcp-server-aws-lambda"],
    env_vars: { AWS_ACCESS_KEY_ID: "<KEY>", AWS_SECRET_ACCESS_KEY: "<SECRET>", AWS_REGION: "us-east-1" },
    tags: ["aws", "lambda", "serverless", "cloud"]
  }
];

async function seed() {
  console.log("Seeding MCP Servers...");
  let successCount = 0;
  
  for (const server of MCP_SERVERS) {
    try {
      const { data, error } = await supabase
        .from("mcp_servers")
        .upsert(server, { onConflict: "name" })
        .select();

      if (error) {
        console.error(`Failed to upsert ${server.name}:`, error.message);
      } else {
        console.log(`✅ Upserted ${server.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`Error processing ${server.name}:`, err);
    }
  }
  
  console.log(`\nSeed completed! Successfully seeded ${successCount} out of ${MCP_SERVERS.length} servers.`);
}

seed();
