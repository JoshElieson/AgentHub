-- ══════════════════════════════════════════════════════════════════════════════
-- MCP Servers
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    github_url TEXT DEFAULT NULL,
    command TEXT NOT NULL,
    args TEXT[] NOT NULL DEFAULT '{}'::text[],
    env_vars JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    star_count INT NOT NULL DEFAULT 0,
    export_count INT NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0
);

ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on mcp_servers" ON public.mcp_servers;
CREATE POLICY "Allow public read access on mcp_servers" 
ON public.mcp_servers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert on mcp_servers" ON public.mcp_servers;
CREATE POLICY "Allow public insert on mcp_servers" 
ON public.mcp_servers FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on mcp_servers" ON public.mcp_servers;
CREATE POLICY "Allow public update on mcp_servers" 
ON public.mcp_servers FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE OR REPLACE TRIGGER update_mcp_servers_timestamp
BEFORE UPDATE ON public.mcp_servers
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.mcp_servers ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_embedding
ON public.mcp_servers USING hnsw (embedding vector_cosine_ops);
