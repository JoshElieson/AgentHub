-- ══════════════════════════════════════════════════════════════════════════════
-- User-created Collections
-- Curated groups of skills or MCP servers that users assemble and share.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  kind TEXT NOT NULL CHECK (kind IN ('skills', 'mcps')),
  cover_color TEXT DEFAULT 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  anon_id TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on collections" ON public.collections;
CREATE POLICY "Allow public read on collections"
  ON public.collections FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on collections" ON public.collections;
CREATE POLICY "Allow public insert on collections"
  ON public.collections FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on collections" ON public.collections;
CREATE POLICY "Allow public update on collections"
  ON public.collections FOR UPDATE TO public USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on collections" ON public.collections;
CREATE POLICY "Allow public delete on collections"
  ON public.collections FOR DELETE TO public USING (true);

-- Auto-update updated_at on modification
CREATE OR REPLACE TRIGGER update_collections_timestamp
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_timestamp();

-- ══════════════════════════════════════════════════════════════════════════════
-- Collection Items — join table linking collections to skills or MCP servers
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('skill', 'mcp')),
  position INT NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (collection_id, item_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on collection_items" ON public.collection_items;
CREATE POLICY "Allow public read on collection_items"
  ON public.collection_items FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Allow public insert on collection_items" ON public.collection_items;
CREATE POLICY "Allow public insert on collection_items"
  ON public.collection_items FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on collection_items" ON public.collection_items;
CREATE POLICY "Allow public update on collection_items"
  ON public.collection_items FOR UPDATE TO public USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on collection_items" ON public.collection_items;
CREATE POLICY "Allow public delete on collection_items"
  ON public.collection_items FOR DELETE TO public USING (true);
