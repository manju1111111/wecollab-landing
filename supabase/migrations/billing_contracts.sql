-- ============================================================
-- WeCollab Billing & Smart Contracts — Pillar 3 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Table 1: Campaign Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id     UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  terms          TEXT NOT NULL,
  payout_amount  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
  signed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Client Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue')),
  due_date       DATE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_contracts_campaign ON public.contracts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator ON public.contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON public.invoices(contract_id);
