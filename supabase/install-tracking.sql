-- ════════════════════════════════════════════════════════════════════════════
-- Install tracking — apply this to your existing AgentDock Supabase project.
--
-- Creates the two tables that power the "you've installed this before" badges,
-- the Dashboard Installed tab, and the profile "Installed" count:
--   • skill_installs   • mcp_installs
--
-- Safe + idempotent: uses CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS,
-- so re-running it does nothing harmful. It does NOT touch any existing table.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste all of this →
-- Run. (This is the full content of supabase/schema.sql's install section.)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Skills ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_installs (
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'unknown',
  install_count INT NOT NULL DEFAULT 1,
  first_installed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (skill_id, anon_id)
);

ALTER TABLE public.skill_installs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on skill_installs" ON public.skill_installs;
CREATE POLICY "Allow public read on skill_installs"
  ON public.skill_installs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on skill_installs" ON public.skill_installs;
CREATE POLICY "Allow public insert on skill_installs"
  ON public.skill_installs FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on skill_installs" ON public.skill_installs;
CREATE POLICY "Allow public update on skill_installs"
  ON public.skill_installs FOR UPDATE TO public USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on skill_installs" ON public.skill_installs;
CREATE POLICY "Allow public delete on skill_installs"
  ON public.skill_installs FOR DELETE TO public USING (true);

-- ── MCP servers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcp_installs (
  server_id UUID NOT NULL REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'unknown',
  install_count INT NOT NULL DEFAULT 1,
  first_installed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (server_id, anon_id)
);

ALTER TABLE public.mcp_installs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on mcp_installs" ON public.mcp_installs;
CREATE POLICY "Allow public read on mcp_installs"
  ON public.mcp_installs FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on mcp_installs" ON public.mcp_installs;
CREATE POLICY "Allow public insert on mcp_installs"
  ON public.mcp_installs FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on mcp_installs" ON public.mcp_installs;
CREATE POLICY "Allow public update on mcp_installs"
  ON public.mcp_installs FOR UPDATE TO public USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on mcp_installs" ON public.mcp_installs;
CREATE POLICY "Allow public delete on mcp_installs"
  ON public.mcp_installs FOR DELETE TO public USING (true);

-- Refresh PostgREST's schema cache so the app sees the new tables immediately.
NOTIFY pgrst, 'reload schema';
