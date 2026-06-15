// Migration script: add engagement columns to skills table
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://kfipwcusfyhobvwhovpx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmaXB3Y3VzZnlob2J2d2hvdnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODExMTEsImV4cCI6MjA5NzA1NzExMX0.KcngRcyvdy4ORuXXflGcuj-kNsLJ4V62ex32uhYcQRU"
);

async function migrate() {
  // We can't run DDL via anon key, so we'll check if columns exist
  // and if not, the app will gracefully handle nulls with ?? 0 defaults
  const { data, error } = await supabase
    .from("skills")
    .select("id, name")
    .limit(1);

  if (error) {
    console.error("Cannot connect:", error.message);
    process.exit(1);
  }

  console.log("Connection OK. Skills table accessible.");
  console.log("Sample row:", JSON.stringify(data?.[0]));

  // Test if columns already exist
  const { data: test, error: testErr } = await supabase
    .from("skills")
    .select("star_count")
    .limit(1);

  if (testErr && testErr.code === "42703") {
    console.log("\n⚠️  Engagement columns do NOT exist yet in the database.");
    console.log("   You need to run these SQL statements in the Supabase SQL Editor:\n");
    console.log(`ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS star_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS export_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS rating_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.skill_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (skill_id, anon_id)
);
ALTER TABLE public.skill_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on skill_ratings" ON public.skill_ratings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on skill_ratings" ON public.skill_ratings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on skill_ratings" ON public.skill_ratings FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.skill_stars (
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (skill_id, anon_id)
);
ALTER TABLE public.skill_stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on skill_stars" ON public.skill_stars FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on skill_stars" ON public.skill_stars FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public delete on skill_stars" ON public.skill_stars FOR DELETE TO public USING (true);
`);
  } else if (testErr) {
    console.error("Unexpected error:", testErr);
  } else {
    console.log("✅ Engagement columns already exist!", JSON.stringify(test));
  }
}

migrate();
