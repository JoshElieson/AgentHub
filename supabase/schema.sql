-- Supabase Schema for Agent Skills Marketplace
-- Normalized source of truth for installable agent skills.

-- Create the skills table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    trigger_phrases JSONB NOT NULL DEFAULT '[]'::jsonb,
    markdown_instructions TEXT NOT NULL,
    script_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    source_url TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access on skills
CREATE POLICY "Allow public read access on skills" 
ON public.skills 
FOR SELECT 
TO public 
USING (true);

-- Create policies to allow public insert/update access on skills (useful for client-side ingestion in sandbox)
CREATE POLICY "Allow public insert on skills" 
ON public.skills 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow public update on skills" 
ON public.skills 
FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

-- Create policy to allow admin/authenticated users service role access
CREATE POLICY "Allow authenticated service role full access" 
ON public.skills 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_skills_timestamp
BEFORE UPDATE ON public.skills
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_timestamp();

-- ══════════════════════════════════════════════════════════════════════════════
-- pgvector Semantic Search
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Enable the vector extension (must be enabled in Supabase Dashboard first)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column (768 dimensions for Google gemini-embedding-001)
ALTER TABLE public.skills
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. HNSW index for fast approximate nearest neighbor cosine search
CREATE INDEX IF NOT EXISTS idx_skills_embedding
ON public.skills
USING hnsw (embedding vector_cosine_ops);

-- 4. RPC function: find semantically similar skills
CREATE OR REPLACE FUNCTION match_skills(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 25
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  tags text[],
  trigger_phrases jsonb,
  source_url text,
  script_urls text[],
  created_at timestamptz,
  star_count int,
  export_count int,
  avg_rating numeric,
  rating_count int,
  similarity float
) LANGUAGE sql STABLE AS $$
  SELECT
    s.id,
    s.name,
    s.description,
    s.tags,
    s.trigger_phrases,
    s.source_url,
    s.script_urls,
    s.created_at,
    s.star_count,
    s.export_count,
    s.avg_rating,
    s.rating_count,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.skills s
  WHERE s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- Community Engagement: Ratings, Stars, Export Counts
-- ══════════════════════════════════════════════════════════════════════════════

-- Denormalized aggregate counters on the skills table for fast reads
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS star_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════════════════════════════════════
-- Classification: landing-page category + target model(s)
-- One of the 12 categories (development, security, devops, …) and the AI model
-- ecosystem(s) the skill targets ('universal' = model-agnostic). The app also
-- derives these client-side from the package name (see
-- src/lib/skill-classification.ts), so these columns are optional — they let the
-- marks be persisted/queried directly when present.
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS model TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Individual ratings (one per anonymous user per skill)
CREATE TABLE IF NOT EXISTS public.skill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (skill_id, anon_id)
);

ALTER TABLE public.skill_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on skill_ratings"
  ON public.skill_ratings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on skill_ratings"
  ON public.skill_ratings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on skill_ratings"
  ON public.skill_ratings FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Stars / favorites (toggle per anonymous user per skill)
CREATE TABLE IF NOT EXISTS public.skill_stars (
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (skill_id, anon_id)
);

ALTER TABLE public.skill_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on skill_stars"
  ON public.skill_stars FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on skill_stars"
  ON public.skill_stars FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public delete on skill_stars"
  ON public.skill_stars FOR DELETE TO public USING (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- Installs — durable "this user installed this skill" records
-- Unlike export_count (a global counter), this captures per-user install state
-- so we can show "you've installed this before" and a personal Installed list.
-- An install is recorded the moment a skill is exported into a workspace
-- (.claude/skills or .agents/skills). One row per anonymous user per skill;
-- re-installing updates installed_at / target and bumps install_count.
-- ══════════════════════════════════════════════════════════════════════════════
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

CREATE POLICY "Allow public read on skill_installs"
  ON public.skill_installs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on skill_installs"
  ON public.skill_installs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on skill_installs"
  ON public.skill_installs FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on skill_installs"
  ON public.skill_installs FOR DELETE TO public USING (true);

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
    rating_count INT NOT NULL DEFAULT 0,
    category TEXT DEFAULT NULL,
    model TEXT[] NOT NULL DEFAULT '{}'::text[]
);

-- Keep classification columns present on pre-existing mcp_servers tables too.
ALTER TABLE public.mcp_servers
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS model TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on mcp_servers" 
ON public.mcp_servers FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on mcp_servers" 
ON public.mcp_servers FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update on mcp_servers" 
ON public.mcp_servers FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE OR REPLACE TRIGGER update_mcp_servers_timestamp
BEFORE UPDATE ON public.mcp_servers
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_timestamp();

ALTER TABLE public.mcp_servers ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_embedding
ON public.mcp_servers USING hnsw (embedding vector_cosine_ops);

-- Stars / favorites for MCP servers (toggle per anonymous user per server)
CREATE TABLE IF NOT EXISTS public.mcp_stars (
  server_id UUID NOT NULL REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (server_id, anon_id)
);

ALTER TABLE public.mcp_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on mcp_stars"
  ON public.mcp_stars FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on mcp_stars"
  ON public.mcp_stars FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public delete on mcp_stars"
  ON public.mcp_stars FOR DELETE TO public USING (true);

-- Installs for MCP servers (see skill_installs). An MCP "install" is recorded
-- when the user copies/exports the server's configuration snippet.
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

CREATE POLICY "Allow public read on mcp_installs"
  ON public.mcp_installs FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on mcp_installs"
  ON public.mcp_installs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on mcp_installs"
  ON public.mcp_installs FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on mcp_installs"
  ON public.mcp_installs FOR DELETE TO public USING (true);

 
 