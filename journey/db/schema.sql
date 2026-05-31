-- Journey content storage (Neon Postgres)
--
-- The whole content tree (areas → chapters → sections, bilingual, with intros)
-- is kept as a single JSONB document. This matches how the admin saves
-- (it PUTs the entire { areas } payload) and keeps every write atomic.
--
-- The app creates this table automatically on first read (see lib/db.ts) and
-- seeds it from data/areas.json, so running this migration by hand is optional.

CREATE TABLE IF NOT EXISTS content (
  id         INT PRIMARY KEY DEFAULT 1,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_single_row CHECK (id = 1)
);

-- Optional manual seed (the app does this automatically otherwise):
-- INSERT INTO content (id, data) VALUES (1, '{"areas": []}'::jsonb)
--   ON CONFLICT (id) DO NOTHING;
