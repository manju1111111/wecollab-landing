-- ============================================================
-- WeCollab Brand Portal — Pillar 1 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Table 1: Brand Accounts
CREATE TABLE IF NOT EXISTS public.brands (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  company_logo   TEXT,
  website        TEXT,
  phone          TEXT,
  industry       TEXT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Brand Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  budget           NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  target_followers INTEGER,
  niche            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Campaign Creator Proposals (For 1-click approvals)
CREATE TABLE IF NOT EXISTS public.campaign_creators (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id     UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  deal_status    TEXT NOT NULL DEFAULT 'proposed' CHECK (deal_status IN ('proposed', 'approved', 'declined')),
  price          NUMERIC(12,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_cc_campaign ON public.campaign_creators(campaign_id);
