-- Snaps Initial Schema

-- Mental Models
CREATE TABLE IF NOT EXISTS mental_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_cz text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('general_thinking', 'physics', 'psychology', 'economics', 'systems', 'numeracy')),
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  short_description text NOT NULL,
  full_explanation text NOT NULL,
  real_world_example text NOT NULL,
  common_mistakes text NOT NULL,
  related_models uuid[] DEFAULT '{}',
  icon_name text NOT NULL DEFAULT 'BookOpen',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES mental_models(id) ON DELETE CASCADE,
  lesson_type text NOT NULL CHECK (lesson_type IN ('intro', 'scenario', 'quiz', 'application')),
  order_index int NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{"steps": []}',
  xp_reward int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_model_id ON lessons(model_id);

-- User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES mental_models(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  score int NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  completed_at timestamptz,
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_model ON user_progress(user_id, model_id);

-- User Stats
CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp int NOT NULL DEFAULT 0,
  current_level int NOT NULL DEFAULT 1,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_activity_date date,
  models_mastered int NOT NULL DEFAULT 0
);

-- Spaced Repetition
CREATE TABLE IF NOT EXISTS spaced_repetition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES mental_models(id) ON DELETE CASCADE,
  ease_factor float NOT NULL DEFAULT 2.5,
  interval_days int NOT NULL DEFAULT 1,
  repetitions int NOT NULL DEFAULT 0,
  next_review_date date NOT NULL DEFAULT CURRENT_DATE + 1,
  last_review_date date,
  UNIQUE (user_id, model_id)
);

CREATE INDEX idx_spaced_repetition_user_due ON spaced_repetition(user_id, next_review_date);

-- Row Level Security
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users read own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own SR" ON spaced_repetition FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own SR" ON spaced_repetition FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own SR" ON spaced_repetition FOR UPDATE USING (auth.uid() = user_id);

-- Mental models and lessons are public read
ALTER TABLE mental_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read models" ON mental_models FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON lessons FOR SELECT USING (true);

-- Auto-create user_stats on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
