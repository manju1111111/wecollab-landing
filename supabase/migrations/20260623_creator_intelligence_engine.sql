-- ============================================================
-- WeCollab Creator Intelligence Engine — Tables & Migration
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Create Table: creator_profiles
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT UNIQUE NOT NULL,
  full_name        TEXT,
  biography        TEXT,
  followers        INT DEFAULT 0,
  following        INT DEFAULT 0,
  posts_count      INT DEFAULT 0,
  profile_pic_url  TEXT,
  is_verified      BOOLEAN DEFAULT FALSE,
  external_url     TEXT,
  last_sync_at     TIMESTAMPTZ DEFAULT NOW(),
  raw_data         JSONB DEFAULT '{}'::jsonb
);

-- 2. Create Table: creator_posts
CREATE TABLE IF NOT EXISTS public.creator_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL REFERENCES public.creator_profiles(username) ON DELETE CASCADE,
  post_id       TEXT UNIQUE NOT NULL,
  shortcode     TEXT NOT NULL,
  caption       TEXT,
  likes         INT DEFAULT 0,
  comments      INT DEFAULT 0,
  views         INT DEFAULT 0,
  timestamp     TIMESTAMPTZ,
  is_video      BOOLEAN DEFAULT FALSE,
  post_type     TEXT, -- reel/image/carousel
  hashtags      TEXT[],
  url           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Table: creator_metrics
CREATE TABLE IF NOT EXISTS public.creator_metrics (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username                    TEXT UNIQUE NOT NULL REFERENCES public.creator_profiles(username) ON DELETE CASCADE,
  average_likes               NUMERIC DEFAULT 0.0,
  average_comments            NUMERIC DEFAULT 0.0,
  average_views               NUMERIC DEFAULT 0.0,
  engagement_rate             NUMERIC DEFAULT 0.0,
  engagement_by_views         NUMERIC DEFAULT 0.0,
  comment_rate                NUMERIC DEFAULT 0.0,
  like_rate                   NUMERIC DEFAULT 0.0,
  view_follower_ratio         NUMERIC DEFAULT 0.0,
  reach_efficiency            NUMERIC DEFAULT 0.0,
  reach_category              TEXT, -- viral/strong/average/weak
  avg_gap_days                NUMERIC DEFAULT 0.0,
  posts_per_week              NUMERIC DEFAULT 0.0,
  consistency_score           NUMERIC DEFAULT 0.0,
  best_performing_post_id     TEXT,
  worst_performing_post_id    TEXT,
  median_views                NUMERIC DEFAULT 0.0,
  median_likes                NUMERIC DEFAULT 0.0,
  median_comments             NUMERIC DEFAULT 0.0,
  viral_threshold             NUMERIC DEFAULT 0.0,
  viral_post_count            INT DEFAULT 0,
  viral_hit_rate              NUMERIC DEFAULT 0.0,
  virality_score              NUMERIC DEFAULT 0.0,
  comment_like_ratio          NUMERIC DEFAULT 0.0,
  authenticity_score          TEXT, -- High/Medium/Low
  bot_risk_indicators         TEXT[],
  follower_following_ratio    NUMERIC DEFAULT 0.0,
  account_activity_score      NUMERIC DEFAULT 0.0,
  last_10_posts_avg_views     NUMERIC DEFAULT 0.0,
  previous_10_posts_avg_views NUMERIC DEFAULT 0.0,
  momentum                    NUMERIC DEFAULT 0.0,
  momentum_score              TEXT, -- Growing/Stable/Declining
  most_used_hashtags          TEXT[],
  avg_caption_length          NUMERIC DEFAULT 0.0,
  hashtag_usage_rate          NUMERIC DEFAULT 0.0,
  content_type_distribution   JSONB DEFAULT '{}'::jsonb,
  last_calculated_at          TIMESTAMPTZ DEFAULT NOW(),
  raw_metrics                 JSONB DEFAULT '{}'::jsonb
);

-- 4. Create Table: creator_ai_scores
CREATE TABLE IF NOT EXISTS public.creator_ai_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username                TEXT UNIQUE NOT NULL REFERENCES public.creator_profiles(username) ON DELETE CASCADE,
  creator_quality_score   NUMERIC DEFAULT 0.0,
  reliability_score       NUMERIC DEFAULT 0.0,
  audience_trust_score    NUMERIC DEFAULT 0.0,
  influence_score         NUMERIC DEFAULT 0.0,
  discovery_ranking_score NUMERIC DEFAULT 0.0,
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Table: creator_sync_logs
CREATE TABLE IF NOT EXISTS public.creator_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL,
  status          TEXT NOT NULL, -- pending/running/success/failed
  steps_completed TEXT[],
  error_message   TEXT,
  duration_ms     INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Table: creator_metrics_history
CREATE TABLE IF NOT EXISTS public.creator_metrics_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username              TEXT NOT NULL REFERENCES public.creator_profiles(username) ON DELETE CASCADE,
  followers             INT DEFAULT 0,
  engagement_rate       NUMERIC DEFAULT 0.0,
  average_views         NUMERIC DEFAULT 0.0,
  creator_quality_score NUMERIC DEFAULT 0.0,
  recorded_at           TIMESTAMPTZ DEFAULT NOW(),
  raw_metrics           JSONB DEFAULT '{}'::jsonb
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_ai_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_metrics_history ENABLE ROW LEVEL SECURITY;

-- 8. Policies: Allow service_role full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_profiles' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_profiles
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_posts' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_posts
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_metrics' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_metrics
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_ai_scores' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_ai_scores
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_sync_logs' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_sync_logs
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_metrics_history' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_metrics_history
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
