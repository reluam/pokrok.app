-- Stores entire user progress as JSONB blobs.
-- The app bundles models/lessons locally with string IDs (e.g. 'les-01a'),
-- which don't map to the UUID-keyed mental_models/lessons tables.
-- A single JSONB column per concern keeps sync simple and schema-agnostic.

CREATE TABLE IF NOT EXISTS user_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  progress jsonb NOT NULL DEFAULT '{}',
  stats jsonb NOT NULL DEFAULT '{}',
  spaced_repetition jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own data" ON user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own data" ON user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own data" ON user_data FOR UPDATE USING (auth.uid() = user_id);
