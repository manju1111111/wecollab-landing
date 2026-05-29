-- ============================================================
-- WeCollab Employee Dashboard — Phase 3 Migration
-- Run this in Supabase Dashboard → SQL Editor (after Phase 2)
-- ============================================================

-- Table 5: Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL, -- references employees.id or admin user.id
  user_type   TEXT NOT NULL CHECK (user_type IN ('admin', 'employee')),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;
