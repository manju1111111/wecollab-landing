-- ============================================================
-- WeCollab Employee Authentication — Password Storage Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Ensure password_hash column exists on employees table for custom auth
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Ensure invitation_token column exists  
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS invitation_token TEXT;

-- Ensure status column exists with proper default
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited';

-- Ensure invited_at and invitation_expires_at columns exist
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;

-- Create index for fast email-based login lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Create index for active status checks (used by layout session validation)
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status) 
  WHERE status = 'active';

-- ============================================================
-- RLS Policy: Allow service-role full access, disable restrictive anon policies
-- NOTE: Employees use custom cookie-based auth, NOT Supabase Auth.
-- All employee data queries use createAdminClient() (service_role key).
-- ============================================================

-- Ensure RLS is enabled but with permissive service-role access
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (used by createAdminClient)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'service_role_full_access'
  ) THEN
    CREATE POLICY service_role_full_access ON public.employees
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
