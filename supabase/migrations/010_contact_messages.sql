-- ============================================================
-- GORER MART — CONTACT MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for anyone to submit contact messages
CREATE POLICY "contact_messages_insert_public"
  ON contact_messages FOR INSERT
  WITH CHECK (true);
