-- ============================================================
-- WeCollab Free Creator Analytics — Schema Extensions
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add detailed analytics and scorecard statistics to public.creators
ALTER TABLE public.creators 
  ADD COLUMN IF NOT EXISTS avg_likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_comments INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS posting_frequency TEXT,
  ADD COLUMN IF NOT EXISTS brand_safety_score INTEGER DEFAULT 95,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS estimated_rates JSONB,
  ADD COLUMN IF NOT EXISTS creator_score INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS recent_content JSONB;

-- Create search logs table for tracking search volumes and viral metrics
CREATE TABLE IF NOT EXISTS public.search_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT NOT NULL,
  platform    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index search logs for telemetry reports
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON public.search_logs(created_at);
