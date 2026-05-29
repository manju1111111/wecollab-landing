-- ============================================================
-- WeCollab Employee Dashboard — Phase 1 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Table 1: Employee notes & deal status per creator
CREATE TABLE IF NOT EXISTS public.employee_creator_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  creator_id    UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  note_text     TEXT DEFAULT '',
  deal_status   TEXT DEFAULT 'new' CHECK (deal_status IN ('new','contacted','negotiating','deal_closed','not_interested')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, creator_id)
);

-- Table 2: Employee tasks per creator
CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  creator_id    UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  due_date      DATE,
  completed_at  TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ecn_employee ON public.employee_creator_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_ecn_creator  ON public.employee_creator_notes(creator_id);
CREATE INDEX IF NOT EXISTS idx_et_employee  ON public.employee_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_et_creator   ON public.employee_tasks(creator_id);

-- Auto-update updated_at on notes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ecn_updated_at ON public.employee_creator_notes;
CREATE TRIGGER set_ecn_updated_at
  BEFORE UPDATE ON public.employee_creator_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
