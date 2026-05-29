-- ============================================================
-- WeCollab Master Plans Blueprint — Hardening Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Equip plans with campaign budgets, cbf weighting configurations, and archiving status
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2) DEFAULT 1000000.00,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  ADD COLUMN IF NOT EXISTS cbf_weights JSONB DEFAULT '{"followers": 25, "er": 25, "cost": 25, "feasibility": 25}';

-- 2. Equip lists with negotiated creator payout ledgers
ALTER TABLE public.lists 
  ADD COLUMN IF NOT EXISTS cost_per_creator JSONB DEFAULT '{}';

-- 3. Create relational join table for list creators
CREATE TABLE IF NOT EXISTS public.list_creators (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, creator_id)
);

-- Indices for rapid indexing
CREATE INDEX IF NOT EXISTS idx_lc_list ON public.list_creators(list_id);
CREATE INDEX IF NOT EXISTS idx_lc_creator ON public.list_creators(creator_id);
