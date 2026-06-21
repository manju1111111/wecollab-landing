-- ============================================================
-- WeCollab Brand Portal — Production Readiness Upgrades
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Upgrade the public.brands table for Password Reset and OAuth support
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ,
  ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Create the login_attempts table to support IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
