-- ============================================================
-- WeCollab Creator Intelligence Engine - Creator Metrics Expansion
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Alter Table: creator_metrics (add expansion metrics)
ALTER TABLE public.creator_metrics 
  ADD COLUMN IF NOT EXISTS avg_reel_likes NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS avg_reel_comments NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS avg_reel_views NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS avg_post_likes NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS avg_post_comments NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS reel_engagement_rate NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS post_engagement_rate NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS image_engagement_rate NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS estimated_reach NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS avg_reach_multiple NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS recent_performance_score NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS growth_trend TEXT DEFAULT 'Stable',
  ADD COLUMN IF NOT EXISTS best_post_views NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS worst_post_views NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS creator_value_score NUMERIC DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS roi_potential_score NUMERIC DEFAULT 0.0;

-- 2. Alter Table: creator_scores (add authenticity_score_num)
ALTER TABLE public.creator_scores
  ADD COLUMN IF NOT EXISTS authenticity_score_num NUMERIC DEFAULT 0.0;
