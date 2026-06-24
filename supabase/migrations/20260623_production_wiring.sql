-- ============================================================
-- WeCollab Creator Intelligence Engine - Production Wiring Map Columns
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Alter Table: creator_metrics (add reach & suggested price fields)
ALTER TABLE public.creator_metrics 
  ADD COLUMN IF NOT EXISTS estimated_reel_reach INT,
  ADD COLUMN IF NOT EXISTS estimated_story_reach INT,
  ADD COLUMN IF NOT EXISTS estimated_campaign_reach INT,
  ADD COLUMN IF NOT EXISTS suggested_reel_price INT,
  ADD COLUMN IF NOT EXISTS suggested_story_price INT,
  ADD COLUMN IF NOT EXISTS suggested_campaign_price INT;

-- 1.5. Alter Table: creator_profiles (add category & location fields to match profile wiring map)
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- 2. Alter Table: creator_scores (add rank, authenticity, and virality fields to match wiring map)
ALTER TABLE public.creator_scores
  ADD COLUMN IF NOT EXISTS discovery_rank INT,
  ADD COLUMN IF NOT EXISTS authenticity_score TEXT,
  ADD COLUMN IF NOT EXISTS virality_score NUMERIC DEFAULT 0.0;
