-- ============================================================
-- WeCollab Employee Authentication Hardening Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add invitation timestamping and expiration tracking to employees
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours';

-- Add index on invitation token lookup for fast verification checks
CREATE INDEX IF NOT EXISTS idx_employees_invitation_token ON public.employees(invitation_token) 
  WHERE invitation_token IS NOT NULL;
