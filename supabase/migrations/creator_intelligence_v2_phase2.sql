-- ============================================================
-- WeCollab Creator Intelligence Engine V2 — Phase 2 Migration
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Create Table: creator_enrichment_runs
CREATE TABLE IF NOT EXISTS public.creator_enrichment_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  trigger_run_id TEXT,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  started_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at  TIMESTAMPTZ,
  error         TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Table: ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  run_id        UUID REFERENCES public.creator_enrichment_runs(id) ON DELETE SET NULL,
  model_name    TEXT NOT NULL,
  prompt_type   TEXT NOT NULL,
  input_tokens  INT DEFAULT 0 NOT NULL,
  output_tokens INT DEFAULT 0 NOT NULL,
  pricing_version TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Create Table: ai_analysis_outputs
CREATE TABLE IF NOT EXISTS public.ai_analysis_outputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  run_id        UUID REFERENCES public.creator_enrichment_runs(id) ON DELETE SET NULL,
  agent_name    TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model_name    TEXT NOT NULL,
  input_summary TEXT,
  raw_response  JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_enrichment_runs_creator ON public.creator_enrichment_runs(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_runs ON public.ai_usage_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_creator ON public.ai_usage_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_outputs_creator ON public.ai_analysis_outputs(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_outputs_run ON public.ai_analysis_outputs(run_id);

-- 4. Enable RLS
ALTER TABLE public.creator_enrichment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_outputs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_enrichment_runs' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_enrichment_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage_logs' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.ai_usage_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_analysis_outputs' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.ai_analysis_outputs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. Rollback Path (Keep commented inside migration)
/*
DROP INDEX IF EXISTS public.idx_ai_analysis_outputs_run;
DROP INDEX IF EXISTS public.idx_ai_analysis_outputs_creator;
DROP INDEX IF EXISTS public.idx_ai_usage_creator;
DROP INDEX IF EXISTS public.idx_ai_usage_runs;
DROP INDEX IF EXISTS public.idx_enrichment_runs_creator;
DROP TABLE IF EXISTS public.ai_analysis_outputs;
DROP TABLE IF EXISTS public.ai_usage_logs;
DROP TABLE IF EXISTS public.creator_enrichment_runs;
*/

