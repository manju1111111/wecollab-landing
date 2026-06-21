-- ============================================================
-- WeCollab Creator Categorization Logs Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.creator_categorization_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  status       TEXT NOT NULL, -- 'success', 'failed'
  provider     TEXT NOT NULL, -- 'instaloader', 'apify', etc.
  raw_data     JSONB,          -- Raw scraped Instagram data
  ai_output    JSONB,          -- Raw Gemini output
  mapped_tags  TEXT[],         -- Tags mapped by the engine
  error        TEXT,           -- Error message if failed
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_logs_creator ON public.creator_categorization_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_cat_logs_created ON public.creator_categorization_logs(created_at);
