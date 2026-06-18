-- ════════════════════════════════════════════════════════════════════════════
-- Saved items (bookmarks) — apply this to your existing AgentDock Supabase project.
--
-- Creates the two tables that power the bookmark "Save" action and the
-- Dashboard "Saved" tab:
--   • skill_saves   • mcp_saves
--
-- This is the per-user bookmark store. It is separate from the public
-- "thumbs up / like" counter (which lives in skill_stars / mcp_stars +
-- skills.star_count / mcp_servers.star_count) and from install tracking.
--
-- Safe + idempotent: uses CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS,
-- so re-running it does nothing harmful. It does NOT touch any existing table.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste all of this →
-- Run.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Skills ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_saves (
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (skill_id, anon_id)
);

ALTER TABLE public.skill_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on skill_saves" ON public.skill_saves;
CREATE POLICY "Allow public read on skill_saves"
  ON public.skill_saves FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on skill_saves" ON public.skill_saves;
CREATE POLICY "Allow public insert on skill_saves"
  ON public.skill_saves FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on skill_saves" ON public.skill_saves;
CREATE POLICY "Allow public delete on skill_saves"
  ON public.skill_saves FOR DELETE TO public USING (true);

-- ── MCP servers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcp_saves (
  server_id UUID NOT NULL REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (server_id, anon_id)
);

ALTER TABLE public.mcp_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on mcp_saves" ON public.mcp_saves;
CREATE POLICY "Allow public read on mcp_saves"
  ON public.mcp_saves FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on mcp_saves" ON public.mcp_saves;
CREATE POLICY "Allow public insert on mcp_saves"
  ON public.mcp_saves FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on mcp_saves" ON public.mcp_saves;
CREATE POLICY "Allow public delete on mcp_saves"
  ON public.mcp_saves FOR DELETE TO public USING (true);

-- Refresh PostgREST's schema cache so the app sees the new tables immediately.
NOTIFY pgrst, 'reload schema';
