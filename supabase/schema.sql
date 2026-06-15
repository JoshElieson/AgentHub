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
