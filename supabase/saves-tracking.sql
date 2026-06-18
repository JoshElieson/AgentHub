-- ════════════════════════════════════════════════════════════════════════════
-- Saved items (bookmarks) — apply this to your existing Nuclexa Supabase project.
--
-- Creates the three tables that power the bookmark "Save" action and the
-- Dashboard "Saved" tab:
--   • skill_saves   • mcp_saves   • collection_saves
--
-- This is the per-user bookmark store. It is separate from the public
-- "thumbs up / like" counter (which lives in skill_stars / mcp_stars +
-- skills.star_count / mcp_servers.star_count) and from install tracking.
--
-- Safe + idempotent: uses CREATE TABLE IF NOT EXISTS and DROP POLICY IF EXISTS,
-- so re-running it does nothing harmful. It does NOT touch any existing table.
--
-- The foreign keys to skills(id) / mcp_servers(id) are added ONLY if those base
-- tables exist (so this runs even on a project where schema.sql hasn't been
-- applied yet). If you see your marketplace data is missing, run schema.sql
-- (which creates skills + mcp_servers) first, then re-run this — the FKs will
-- be added on the second run.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste all of this →
-- Run.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Skills ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_saves (
  skill_id UUID NOT NULL,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (skill_id, anon_id)
);

-- Attach the FK to skills(id) only if that table exists and we haven't already.
DO $$
BEGIN
  IF to_regclass('public.skills') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'skill_saves_skill_id_fkey'
     )
  THEN
    ALTER TABLE public.skill_saves
      ADD CONSTRAINT skill_saves_skill_id_fkey
      FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;
  END IF;
END $$;

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
  server_id UUID NOT NULL,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (server_id, anon_id)
);

-- Attach the FK to mcp_servers(id) only if that table exists and we haven't already.
DO $$
BEGIN
  IF to_regclass('public.mcp_servers') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'mcp_saves_server_id_fkey'
     )
  THEN
    ALTER TABLE public.mcp_saves
      ADD CONSTRAINT mcp_saves_server_id_fkey
      FOREIGN KEY (server_id) REFERENCES public.mcp_servers(id) ON DELETE CASCADE;
  END IF;
END $$;

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

-- ── Bundles (collections) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collection_saves (
  collection_id UUID NOT NULL,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (collection_id, anon_id)
);

-- Attach the FK to collections(id) only if that table exists and we haven't already.
DO $$
BEGIN
  IF to_regclass('public.collections') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'collection_saves_collection_id_fkey'
     )
  THEN
    ALTER TABLE public.collection_saves
      ADD CONSTRAINT collection_saves_collection_id_fkey
      FOREIGN KEY (collection_id) REFERENCES public.collections(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.collection_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on collection_saves" ON public.collection_saves;
CREATE POLICY "Allow public read on collection_saves"
  ON public.collection_saves FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on collection_saves" ON public.collection_saves;
CREATE POLICY "Allow public insert on collection_saves"
  ON public.collection_saves FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on collection_saves" ON public.collection_saves;
CREATE POLICY "Allow public delete on collection_saves"
  ON public.collection_saves FOR DELETE TO public USING (true);

-- Refresh PostgREST's schema cache so the app sees the new tables immediately.
NOTIFY pgrst, 'reload schema';
