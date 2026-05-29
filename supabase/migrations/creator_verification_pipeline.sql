-- ============================================================
-- WeCollab Creator Verification & Approval Curation Pipeline
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Equip creators with verification status and visibility controls
ALTER TABLE public.creators 
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'Pending Verification' 
    CHECK (verification_status IN ('Pending Verification', 'Ready for Review', 'Verified', 'Rejected')),
  ADD COLUMN IF NOT EXISTS visibility_status BOOLEAN NOT NULL DEFAULT false;

-- Indices for performance-optimized search filtering
CREATE INDEX IF NOT EXISTS idx_creators_verif ON public.creators(verification_status);
CREATE INDEX IF NOT EXISTS idx_creators_visib ON public.creators(visibility_status);
