-- ============================================================
-- WeCollab Analytics Page — Real Product Schema Upgrade
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add new columns to creators table for real API data
ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS profile_pic_url        TEXT,
  ADD COLUMN IF NOT EXISTS following              INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posts                  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_url            TEXT,
  ADD COLUMN IF NOT EXISTS niche                  TEXT,
  ADD COLUMN IF NOT EXISTS audience               TEXT,
  ADD COLUMN IF NOT EXISTS audience_demographics  JSONB,
  ADD COLUMN IF NOT EXISTS last_fetched_at        TIMESTAMPTZ;

-- Add IP address tracking to search_logs for rate limiting
ALTER TABLE public.search_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Index for rate limit checks (IP + recent time range)
CREATE INDEX IF NOT EXISTS idx_search_logs_ip_created 
  ON public.search_logs(ip_address, created_at);

-- Index for upsert conflict resolution on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_creators_username_unique 
  ON public.creators(username);

-- ============================================================
-- Notes:
-- 1. `last_fetched_at` is used to determine if cached data needs refresh (7-day TTL)
-- 2. `ip_address` is used to enforce 10 searches per hour per IP for rate limiting
-- 3. The unique index on username enables ON CONFLICT upsert in actions.ts
-- ============================================================
