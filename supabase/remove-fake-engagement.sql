-- ════════════════════════════════════════════════════════════════════════════
-- Remove ONLY the fake seeded engagement, keeping every real like/install.
--
-- Fake rows are tagged with the reserved anon_id prefix 'seed-fake-' by
-- scripts/seed-fake-engagement.mjs. Real likes/installs never use that prefix.
--
-- HOW TO RUN: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe + idempotent: running it when no fake rows exist is a no-op.
-- ════════════════════════════════════════════════════════════════════════════

-- ── LIKES ───────────────────────────────────────────────────────────────────
-- Delete fake like rows, then recompute star_count from the surviving REAL rows
-- (star_count is defined as COUNT(stars), so this restores the true count).
DELETE FROM public.skill_stars WHERE anon_id LIKE 'seed-fake-%';
UPDATE public.skills s
  SET star_count = COALESCE(
    (SELECT count(*) FROM public.skill_stars ss WHERE ss.skill_id = s.id), 0);

DELETE FROM public.mcp_stars WHERE anon_id LIKE 'seed-fake-%';
UPDATE public.mcp_servers m
  SET star_count = COALESCE(
    (SELECT count(*) FROM public.mcp_stars ms WHERE ms.server_id = m.id), 0);

-- ── INSTALLS ────────────────────────────────────────────────────────────────
-- Subtract the fake offset (stored in the ledger row's install_count) from
-- export_count, then delete the ledger rows. Real export_count history remains.
UPDATE public.skills s
  SET export_count = GREATEST(0, export_count - COALESCE(
    (SELECT install_count FROM public.skill_installs si
       WHERE si.skill_id = s.id AND si.anon_id = 'seed-fake-installs'), 0));
DELETE FROM public.skill_installs WHERE anon_id LIKE 'seed-fake-%';

UPDATE public.mcp_servers m
  SET export_count = GREATEST(0, export_count - COALESCE(
    (SELECT install_count FROM public.mcp_installs mi
       WHERE mi.server_id = m.id AND mi.anon_id = 'seed-fake-installs'), 0));
DELETE FROM public.mcp_installs WHERE anon_id LIKE 'seed-fake-%';

-- ── RATINGS ─────────────────────────────────────────────────────────────────
-- Skill ratings are row-backed: delete fake rows (tagged seed-fake-r-…), then
-- recompute avg_rating/rating_count from the surviving REAL ratings.
DELETE FROM public.skill_ratings WHERE anon_id LIKE 'seed-fake-%';
UPDATE public.skills s SET
  avg_rating = COALESCE(
    (SELECT round(avg(rating)::numeric, 2) FROM public.skill_ratings sr WHERE sr.skill_id = s.id), 0),
  rating_count = COALESCE(
    (SELECT count(*) FROM public.skill_ratings sr WHERE sr.skill_id = s.id), 0);

-- MCP ratings have NO ledger table and no rate route (no real MCP ratings ever
-- exist), so the fake column values are simply reset to zero.
UPDATE public.mcp_servers SET avg_rating = 0, rating_count = 0;

NOTIFY pgrst, 'reload schema';
