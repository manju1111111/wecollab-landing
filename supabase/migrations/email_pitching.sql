-- ============================================================
-- WeCollab Creator Pitching System — Pillar 4 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employee_pitches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  creator_id   UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('initial_outreach', 'pricing_offer', 'campaign_brief')),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'replied')),
  sent_at      TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_pitches_employee ON public.employee_pitches(employee_id);
CREATE INDEX IF NOT EXISTS idx_pitches_creator ON public.employee_pitches(creator_id);
