-- Content as DB source of truth with draft/publish flow.
--
-- Each track / course / mental_model / lesson lives as a row with:
--   draft     — work-in-progress, edited by admin
--   published — what the app reads; NULL means not yet published or soft-deleted
--
-- "Publish" copies draft → published. App reads only WHERE published IS NOT NULL.

CREATE TABLE IF NOT EXISTS content_items (
  id            text PRIMARY KEY,
  kind          text NOT NULL CHECK (kind IN ('track', 'course', 'model', 'lesson')),
  parent_id     text,
  sort_order    int  NOT NULL DEFAULT 0,
  draft         jsonb NOT NULL DEFAULT '{}'::jsonb,
  published     jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_content_items_kind         ON content_items(kind);
CREATE INDEX IF NOT EXISTS idx_content_items_parent       ON content_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_items_kind_sort    ON content_items(kind, sort_order);
CREATE INDEX IF NOT EXISTS idx_content_items_parent_sort  ON content_items(parent_id, sort_order);

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- App (anon + authenticated) reads published content only.
DROP POLICY IF EXISTS "Public read published content" ON content_items;
CREATE POLICY "Public read published content"
  ON content_items FOR SELECT
  USING (published IS NOT NULL);

-- Auto-bump updated_at on every row update.
CREATE OR REPLACE FUNCTION content_items_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_items_updated_at ON content_items;
CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION content_items_set_updated_at();

-- Audit trail for admin actions. RLS left enabled with no policies,
-- so only service-role (admin API routes) can read/write.
CREATE TABLE IF NOT EXISTS content_audit (
  id           bigserial PRIMARY KEY,
  actor_email  text NOT NULL,
  action       text NOT NULL CHECK (action IN ('create', 'update', 'publish', 'unpublish', 'delete', 'seed')),
  item_id      text,
  item_kind    text,
  diff         jsonb,
  at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_audit_at       ON content_audit(at DESC);
CREATE INDEX IF NOT EXISTS idx_content_audit_item     ON content_audit(item_id);

ALTER TABLE content_audit ENABLE ROW LEVEL SECURITY;
