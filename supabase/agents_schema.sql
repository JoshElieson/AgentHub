-- ══════════════════════════════════════════════════════════════════════════════
-- Agents as a Service — Supabase Schema
-- Tables for agent definitions, execution logs, and credits system.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Agents ──────────────────────────────────────────────────────────────────
-- Each row is a user-created agent with its prompt, tools, and config.

CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT DEFAULT '',
    icon TEXT DEFAULT '🤖',

    -- Creator
    creator_id TEXT NOT NULL,

    -- Agent brain
    system_prompt TEXT NOT NULL,
    model_preference TEXT DEFAULT 'auto',
    temperature NUMERIC(3,2) DEFAULT 0.5,
    max_tokens INT DEFAULT 4096,

    -- Tools (references to skills/MCP servers the agent can use)
    enabled_tools JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Built-in capabilities
    can_search_web BOOLEAN DEFAULT FALSE,
    can_scrape BOOLEAN DEFAULT FALSE,
    can_generate_files BOOLEAN DEFAULT FALSE,
    can_run_code BOOLEAN DEFAULT FALSE,
    can_generate_images BOOLEAN DEFAULT FALSE,

    -- I/O config
    interaction_mode TEXT DEFAULT 'chat',
    input_schema JSONB DEFAULT NULL,
    output_format TEXT DEFAULT 'markdown',
    enabled_destinations JSONB NOT NULL DEFAULT '["in-app", "download"]'::jsonb,

    -- Pricing
    creator_fee_credits INT DEFAULT 0,
    estimated_credits INT DEFAULT 5,

    -- Marketplace
    visibility TEXT DEFAULT 'public',
    category TEXT DEFAULT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],

    -- Engagement
    run_count BIGINT NOT NULL DEFAULT 0,
    unique_users INT NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0,
    star_count INT NOT NULL DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on active agents"
  ON public.agents FOR SELECT TO public
  USING (status = 'active' OR visibility = 'public');

CREATE POLICY "Allow authenticated insert on agents"
  ON public.agents FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Allow creator update on agents"
  ON public.agents FOR UPDATE TO public
  USING (true) WITH CHECK (true);

CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_agents_category ON public.agents(category);
CREATE INDEX idx_agents_creator ON public.agents(creator_id);
CREATE INDEX idx_agents_slug ON public.agents(slug);

CREATE OR REPLACE TRIGGER update_agents_timestamp
BEFORE UPDATE ON public.agents
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_timestamp();

-- ── Agent Runs ──────────────────────────────────────────────────────────────
-- Execution log for every agent invocation.

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,

    -- Execution
    input JSONB NOT NULL,
    output TEXT,
    output_format TEXT DEFAULT 'markdown',
    destinations JSONB DEFAULT '["in-app"]'::jsonb,

    -- Cost
    model_used TEXT NOT NULL DEFAULT 'auto',
    input_tokens INT NOT NULL DEFAULT 0,
    output_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    base_cost_credits INT NOT NULL DEFAULT 0,
    creator_fee_credits INT NOT NULL DEFAULT 0,
    total_credits INT NOT NULL DEFAULT 0,

    -- Timing
    duration_ms INT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    error TEXT DEFAULT NULL,

    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on own runs"
  ON public.agent_runs FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on runs"
  ON public.agent_runs FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update on runs"
  ON public.agent_runs FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_runs_user ON public.agent_runs(user_id, created_at DESC);
CREATE INDEX idx_agent_runs_agent ON public.agent_runs(agent_id, created_at DESC);

-- ── Credit Balances ─────────────────────────────────────────────────────────
-- User credit balance for pay-as-you-go agent usage.

CREATE TABLE IF NOT EXISTS public.credit_balances (
    user_id TEXT PRIMARY KEY,
    balance INT NOT NULL DEFAULT 0,
    lifetime_deposited INT NOT NULL DEFAULT 0,
    lifetime_spent INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on own balance"
  ON public.credit_balances FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on balance"
  ON public.credit_balances FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update on balance"
  ON public.credit_balances FOR UPDATE TO public USING (true) WITH CHECK (true);

-- ── Credit Transactions ─────────────────────────────────────────────────────
-- Audit log of every credit movement (deposits, spends, refunds).

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount INT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    agent_id UUID DEFAULT NULL,
    stripe_payment_id TEXT DEFAULT NULL,
    token_count INT DEFAULT NULL,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on own transactions"
  ON public.credit_transactions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on transactions"
  ON public.credit_transactions FOR INSERT TO public WITH CHECK (true);

CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

-- ── Creator Earnings ────────────────────────────────────────────────────────
-- Accumulated earnings from agent usage fees.

CREATE TABLE IF NOT EXISTS public.creator_earnings (
    user_id TEXT PRIMARY KEY,
    balance INT NOT NULL DEFAULT 0,
    lifetime_earned INT NOT NULL DEFAULT 0,
    last_payout_at TIMESTAMPTZ DEFAULT NULL,
    stripe_connect_id TEXT DEFAULT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on own earnings"
  ON public.creator_earnings FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on earnings"
  ON public.creator_earnings FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update on earnings"
  ON public.creator_earnings FOR UPDATE TO public USING (true) WITH CHECK (true);
