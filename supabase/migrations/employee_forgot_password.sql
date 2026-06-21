-- ============================================================
-- WeCollab Employee Authentication — Password Reset Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add reset token columns to employees table
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Create index for fast reset token lookups
CREATE INDEX IF NOT EXISTS idx_employees_reset_token ON public.employees(reset_token) 
  WHERE reset_token IS NOT NULL;
