-- ============================================================
-- WeCollab Employee Live Activity Tracking System
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_activity (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE UNIQUE,
  status             TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away', 'break')),
  session_start      TIMESTAMPTZ DEFAULT NOW(),
  last_active        TIMESTAMPTZ DEFAULT NOW(),
  current_activity   TEXT, -- e.g., "Viewing Creators", "Drafting campaign"
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid status queries & sorting
CREATE INDEX IF NOT EXISTS idx_emp_act_emp ON public.employee_activity(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_act_status ON public.employee_activity(status);
