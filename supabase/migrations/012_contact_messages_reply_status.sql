-- ============================================================
-- GORER MART — CONTACT MESSAGES STATUS COLUMN
-- ============================================================

ALTER TABLE public.contact_messages 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not replied';
