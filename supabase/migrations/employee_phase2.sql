-- ============================================================
-- WeCollab Employee Dashboard — Phase 2 Migration
-- Run this in Supabase Dashboard → SQL Editor (after Phase 1)
-- ============================================================

-- Table 3: Employee work log (daily hours tracker)
CREATE TABLE IF NOT EXISTS public.employee_work_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  hours         NUMERIC(4,1) NOT NULL CHECK (hours > 0 AND hours <= 24),
  category      TEXT NOT NULL DEFAULT 'Admin / Other',
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ewl_employee ON public.employee_work_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_ewl_date     ON public.employee_work_log(date);

-- Table 4: Employee activity log (auto-generated timeline events)
CREATE TABLE IF NOT EXISTS public.employee_activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  description   TEXT NOT NULL,
  meta          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eal_employee ON public.employee_activity_log(employee_id);
