-- ============================================================
-- WeCollab Newsletter Tables Migration
-- ============================================================

-- Create newsletters table
CREATE TABLE IF NOT EXISTS public.newsletters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  summary       TEXT NOT NULL,
  content       TEXT NOT NULL,
  cover_image   TEXT,
  category      TEXT NOT NULL DEFAULT 'Creator Economy',
  tags          TEXT[] DEFAULT '{}',
  author_name   TEXT DEFAULT 'WeCollab Team',
  author_avatar TEXT DEFAULT '/assets/logo.jpg',
  is_published  BOOLEAN DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Create newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_newsletters_slug ON public.newsletters(slug);
CREATE INDEX IF NOT EXISTS idx_newsletters_published ON public.newsletters(published_at) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.newsletter_subscribers(email);
