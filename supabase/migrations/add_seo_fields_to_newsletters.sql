-- Add SEO metadata fields to newsletters table
ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT;
