-- ============================================================
-- GORER MART — NEWSLETTER SUBSCRIBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for anyone to subscribe
CREATE POLICY "newsletter_subscribers_insert_public"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);
