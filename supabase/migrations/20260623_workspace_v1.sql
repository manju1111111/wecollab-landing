-- ============================================================
-- WeCollab Plan Workspace V1 Migration
-- Run this in Supabase Dashboard → SQL Editor or via local migrations script
-- ============================================================

-- 1. Create Table: plan_lists
CREATE TABLE IF NOT EXISTS public.plan_lists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  color            TEXT,
  platform         TEXT DEFAULT 'Instagram',
  deliverables     JSONB DEFAULT '[]'::jsonb,
  cost_per_creator JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Table: plan_creators
CREATE TABLE IF NOT EXISTS public.plan_creators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES public.plan_lists(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, creator_id)
);

-- 3. Create Table: plan_column_preferences
CREATE TABLE IF NOT EXISTS public.plan_column_preferences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id          UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id          UUID, -- Can be null or reference auth.users if available
  selected_columns JSONB DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, user_id)
);

-- 4. Create Table: creator_scores
CREATE TABLE IF NOT EXISTS public.creator_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username                TEXT UNIQUE NOT NULL REFERENCES public.creator_profiles(username) ON DELETE CASCADE,
  creator_quality_score   NUMERIC DEFAULT 0.0,
  reliability_score       NUMERIC DEFAULT 0.0,
  audience_trust_score    NUMERIC DEFAULT 0.0,
  influence_score         NUMERIC DEFAULT 0.0,
  discovery_ranking_score NUMERIC DEFAULT 0.0,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Copy Data (if old tables exist)
DO $$
BEGIN
  -- Copy from public.lists to public.plan_lists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lists') THEN
    INSERT INTO public.plan_lists (id, plan_id, name, color, platform, deliverables, cost_per_creator, created_at)
    SELECT id, plan_id, name, color, platform, deliverables, cost_per_creator, created_at
    FROM public.lists
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Copy from public.list_creators to public.plan_creators
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'list_creators') THEN
    INSERT INTO public.plan_creators (id, list_id, creator_id, created_at)
    SELECT id, list_id, creator_id, created_at
    FROM public.list_creators
    ON CONFLICT (list_id, creator_id) DO NOTHING;
  END IF;

  -- Copy from public.creator_ai_scores to public.creator_scores
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'creator_ai_scores') THEN
    INSERT INTO public.creator_scores (id, username, creator_quality_score, reliability_score, audience_trust_score, influence_score, discovery_ranking_score, updated_at)
    SELECT id, username, creator_quality_score, reliability_score, audience_trust_score, influence_score, discovery_ranking_score, updated_at
    FROM public.creator_ai_scores
    ON CONFLICT (username) DO NOTHING;
  END IF;
END $$;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.plan_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_column_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_scores ENABLE ROW LEVEL SECURITY;

-- 7. Add Policies (Idempotent check inside DO blocks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_lists' AND policyname = 'service_role_full_access') THEN
    CREATE POLICY service_role_full_access ON public.plan_lists FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_creators' AND policyname = 'service_role_full_access') THEN
    CREATE POLICY service_role_full_access ON public.plan_creators FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_column_preferences' AND policyname = 'service_role_full_access') THEN
    CREATE POLICY service_role_full_access ON public.plan_column_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_scores' AND policyname = 'service_role_full_access') THEN
    CREATE POLICY service_role_full_access ON public.creator_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
