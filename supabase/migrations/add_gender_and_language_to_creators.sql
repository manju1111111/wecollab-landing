-- ============================================================
-- Add gender and language columns to public.creators
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.creators
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
