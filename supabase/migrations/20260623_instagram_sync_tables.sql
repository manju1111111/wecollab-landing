-- ============================================================
-- WeCollab Creator Intelligence Engine — Instagram Sync Tables
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Create Table: instagram_profiles
CREATE TABLE IF NOT EXISTS public.instagram_profiles (
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

-- 2. Create Table: instagram_posts
CREATE TABLE IF NOT EXISTS public.instagram_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT NOT NULL REFERENCES public.instagram_profiles(username) ON DELETE CASCADE,
  post_id       TEXT UNIQUE NOT NULL,
  shortcode     TEXT NOT NULL,
  caption       TEXT,
  likes         INT DEFAULT 0,
  comments      INT DEFAULT 0,
  views         INT DEFAULT 0,
  timestamp     TIMESTAMPTZ,
  is_video      BOOLEAN DEFAULT FALSE,
  url           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Table: creator_metrics
CREATE TABLE IF NOT EXISTS public.creator_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username              TEXT UNIQUE NOT NULL,
  average_likes         NUMERIC DEFAULT 0.0,
  average_comments      NUMERIC DEFAULT 0.0,
  average_views         NUMERIC DEFAULT 0.0,
  engagement_rate       NUMERIC DEFAULT 0.0,
  view_follower_ratio   NUMERIC DEFAULT 0.0,
  comment_rate          NUMERIC DEFAULT 0.0,
  posting_frequency     TEXT,
  consistency_score     NUMERIC DEFAULT 0.0,
  viral_hit_rate        NUMERIC DEFAULT 0.0,
  creator_quality_score NUMERIC DEFAULT 0.0,
  last_calculated_at    TIMESTAMPTZ DEFAULT NOW(),
  raw_metrics           JSONB DEFAULT '{}'::jsonb
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.instagram_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_metrics ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Allow service_role full access (for backend operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'instagram_profiles' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.instagram_profiles
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'instagram_posts' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.instagram_posts
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'creator_metrics' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.creator_metrics
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
