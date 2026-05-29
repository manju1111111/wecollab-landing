-- ============================================================
-- WeCollab Deal Pipeline History & Audit Telemetry
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Create database audit logging table for deal status updates
CREATE TABLE IF NOT EXISTS public.pipeline_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  creator_id   UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  changed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast historical queries
CREATE INDEX IF NOT EXISTS idx_ph_employee ON public.pipeline_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_ph_creator ON public.pipeline_history(creator_id);
CREATE INDEX IF NOT EXISTS idx_ph_changed_at ON public.pipeline_history(changed_at);

-- Trigger function to capture and record stage transitions transactionally
CREATE OR REPLACE FUNCTION public.log_deal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log if it's a new note containing status or if status has changed
  IF (TG_OP = 'INSERT') OR (OLD.deal_status IS DISTINCT FROM NEW.deal_status) THEN
    INSERT INTO public.pipeline_history (employee_id, creator_id, from_status, to_status)
    VALUES (
      NEW.employee_id,
      NEW.creator_id,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.deal_status ELSE NULL END,
      NEW.deal_status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to public.employee_creator_notes
DROP TRIGGER IF EXISTS trigger_log_deal_status_change ON public.employee_creator_notes;
CREATE TRIGGER trigger_log_deal_status_change
  AFTER INSERT OR UPDATE ON public.employee_creator_notes
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_status_change();
