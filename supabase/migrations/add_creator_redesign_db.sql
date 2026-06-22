-- ============================================================
-- WeCollab Creator Intelligence Engine V2 — AI Onboarding Redesign
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Create Table: creator_filter_assignments
CREATE TABLE IF NOT EXISTS public.creator_filter_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  run_id                UUID REFERENCES public.creator_enrichment_runs(id) ON DELETE SET NULL,
  filter_id             TEXT NOT NULL, -- Matched to filters.json
  filter_name           TEXT NOT NULL,
  filter_group          TEXT NOT NULL,
  confidence            NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0.00 AND confidence <= 1.00),
  reasoning             TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(creator_id, filter_id)
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_filter_assignments_lookup ON public.creator_filter_assignments(filter_id);
CREATE INDEX IF NOT EXISTS idx_filter_assignments_creator ON public.creator_filter_assignments(creator_id);

-- 3. Enable RLS
ALTER TABLE public.creator_filter_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_filter_assignments' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_filter_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Rollback Path (Keep commented inside migration)
/*
DROP INDEX IF EXISTS public.idx_filter_assignments_creator;
DROP INDEX IF EXISTS public.idx_filter_assignments_lookup;
DROP TABLE IF EXISTS public.creator_filter_assignments;
*/
