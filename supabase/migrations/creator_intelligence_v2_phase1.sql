-- ============================================================
-- WeCollab Creator Intelligence Engine V2 — Phase 1 Migration
-- Safe to run multiple times (idempotent)
-- ============================================================

-- 1. Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Table: creator_dna
CREATE TABLE IF NOT EXISTS public.creator_dna (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID UNIQUE NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  intelligence_version  TEXT NOT NULL DEFAULT 'v1',
  content_dna           JSONB DEFAULT '{}'::jsonb,
  visual_dna            JSONB DEFAULT '{}'::jsonb,
  personality_dna       JSONB DEFAULT '{}'::jsonb,
  brand_affinity        JSONB DEFAULT '{}'::jsonb,
  trust_metrics         JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Table: creator_media_nodes
CREATE TABLE IF NOT EXISTS public.creator_media_nodes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  media_id              TEXT NOT NULL,
  media_type            TEXT DEFAULT 'image',
  original_url          TEXT,
  cached_thumbnail_url  TEXT,
  video_views           BIGINT DEFAULT 0,
  likes                 INT DEFAULT 0,
  comments_count        INT DEFAULT 0,
  caption               TEXT,
  posted_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Table: creator_embeddings
CREATE TABLE IF NOT EXISTS public.creator_embeddings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  intelligence_version  TEXT NOT NULL DEFAULT 'v1',
  embedding_type        TEXT NOT NULL CHECK (embedding_type IN ('profile', 'content', 'visual', 'audience', 'brand', 'personality')),
  embedding             VECTOR(768) NOT NULL,
  combined_text_source  TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, embedding_type, intelligence_version)
);

-- 5. Create Table: creator_snapshots
CREATE TABLE IF NOT EXISTS public.creator_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id            UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  snapshot_date         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  followers             INTEGER DEFAULT 0 NOT NULL,
  engagement_rate       NUMERIC DEFAULT 0.0 NOT NULL,
  avg_views             NUMERIC DEFAULT 0.0 NOT NULL,
  creator_score         NUMERIC DEFAULT 0.0 NOT NULL,
  intelligence_version  TEXT NOT NULL DEFAULT 'v1',
  content_dna           JSONB DEFAULT '{}'::jsonb,
  visual_dna            JSONB DEFAULT '{}'::jsonb,
  personality_dna       JSONB DEFAULT '{}'::jsonb,
  brand_affinity        JSONB DEFAULT '{}'::jsonb,
  trust_metrics         JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_dna_creator_version 
  ON public.creator_dna(creator_id, intelligence_version);

CREATE INDEX IF NOT EXISTS idx_creator_snapshots_lookup 
  ON public.creator_snapshots(creator_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_media_nodes_lookup 
  ON public.creator_media_nodes(creator_id, posted_at DESC);

-- HNSW Vector Index (Optimized for 1M+ embeddings and cosine similarity search)
CREATE INDEX IF NOT EXISTS idx_creator_embeddings_vector 
  ON public.creator_embeddings USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);

-- 7. Create similarity match RPC function
CREATE OR REPLACE FUNCTION public.match_creators (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  type_filter text DEFAULT NULL
)
RETURNS TABLE (
  creator_id uuid,
  name text,
  username text,
  profile_image text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS creator_id,
    c.name,
    c.username,
    c.profile_image,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM public.creator_embeddings ce
  JOIN public.creators c ON ce.creator_id = c.id
  WHERE (1 - (ce.embedding <=> query_embedding)) > match_threshold
    AND (type_filter IS NULL OR ce.embedding_type = type_filter)
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS Configuration (Safe fallback/default policies)
ALTER TABLE public.creator_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_media_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_dna' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_dna FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_media_nodes' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_media_nodes FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_embeddings' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_snapshots' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON public.creator_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 8. Rollback Path (Keep commented inside migration)
/*
DROP FUNCTION IF EXISTS public.match_creators(vector(768), float, int, text);
DROP INDEX IF EXISTS public.idx_creator_embeddings_vector;
DROP INDEX IF EXISTS public.idx_media_nodes_lookup;
DROP INDEX IF EXISTS public.idx_creator_snapshots_lookup;
DROP INDEX IF EXISTS public.idx_creator_dna_creator_version;
DROP TABLE IF EXISTS public.creator_snapshots;
DROP TABLE IF EXISTS public.creator_embeddings;
DROP TABLE IF EXISTS public.creator_media_nodes;
DROP TABLE IF EXISTS public.creator_dna;
*/
