-- ============================================================
-- WeCollab Delete Employee Feature — Soft Delete Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index to quickly query non-deleted employees
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at 
  ON public.employees(deleted_at) 
  WHERE deleted_at IS NULL;
