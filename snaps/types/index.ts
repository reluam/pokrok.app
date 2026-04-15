export type ModelCategory =
  | 'general_thinking'
  | 'physics'
  | 'psychology'
  | 'economics'
  | 'systems'
  | 'numeracy'
  | 'cognitive_foundations'
  | 'decision_biases'
  | 'social_biases'
  | 'information_biases'
  | 'probability_biases'
  | 'memory_biases'
  | 'self_perception_biases'
  | 'perception_biases'
  | 'human_body'
  | 'human_brain'
  | 'human_society'
  | 'health_fitness'
  | 'mindfulness'
  | 'productivity'
  | 'mindsets'
  | 'performance';

export type LessonType = 'intro' | 'scenario' | 'quiz' | 'application' | 'deep_dive' | 'comparison';

export type LessonStepType =
  | 'lesson_intro'
  | 'text'
  | 'engagement'
  | 'scenario'
  | 'key_insight'
  | 'quiz';

/**
 * First step of a lesson — a "splash" screen with title, short description,
 * and a big icon. Sets the stage for what the user is about to learn. Not
 * scored, no answer required.
 */
export interface LessonStepLessonIntro {
  type: 'lesson_intro';
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  /** Optional lucide icon name (e.g. 'Apple', 'Moon'). Defaults to 'Sparkles'. */
  icon?: string;
}

export interface LessonStepText {
  type: 'text';
  content: string;
  content_en?: string;
}

export interface ScenarioOption {
  text: string;
  text_en?: string;
  correct: boolean;
  explanation: string;
  explanation_en?: string;
}

export interface LessonStepScenario {
  type: 'scenario';
  situation: string;
  situation_en?: string;
  question: string;
  question_en?: string;
  options: ScenarioOption[];
}

export interface LessonStepKeyInsight {
  type: 'key_insight';
  content: string;
  content_en?: string;
}

export interface LessonStepQuiz {
  type: 'quiz';
  /** Optional situation framing before the question (same semantics as scenario). */
  situation?: string;
  situation_en?: string;
  question: string;
  question_en?: string;
  options: ScenarioOption[];
}

/**
 * Engagement step — a question asked DURING the theory section to make the
 * user think and predict. Has the same structure as a quiz, but does NOT
 * affect the lesson score. Used to keep users active and surface their
 * intuitions before the right answer is explained.
 */
export interface LessonStepEngagement {
  type: 'engagement';
  question: string;
  question_en?: string;
  options: ScenarioOption[];
}

export type LessonStep =
  | LessonStepLessonIntro
  | LessonStepText
  | LessonStepEngagement
  | LessonStepScenario
  | LessonStepKeyInsight
  | LessonStepQuiz;

export interface LessonContent {
  steps: LessonStep[];
}

export interface MentalModel {
  id: string;
  name: string;
  name_cz: string;
  slug: string;
  category: ModelCategory;
  difficulty: number;
  short_description: string;
  short_description_en?: string;
  full_explanation: string;
  full_explanation_en?: string;
  real_world_example: string;
  real_world_example_en?: string;
  common_mistakes: string;
  common_mistakes_en?: string;
  related_models: string[];
  icon_name: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  model_id: string;
  lesson_type: LessonType;
  order_index: number;
  content: LessonContent;
  xp_reward: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  model_id: string;
  lesson_id: string;
  completed: boolean;
  score: number;
  completed_at: string | null;
}

export interface UserStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  models_mastered: number;
}

export interface SpacedRepetitionCard {
  id: string;
  user_id: string;
  model_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_review_date: string | null;
}

export type LevelTitle = 'Začátečník' | 'Myslitel' | 'Stratég' | 'Filozof' | 'Master';

export interface LevelInfo {
  level: number;
  title: LevelTitle;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
}

export interface DailyReviewItem {
  model: MentalModel;
  card: SpacedRepetitionCard;
  lesson: Lesson;
}

// Course map types
export interface CourseNode {
  modelId: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  icon_name: string;
  color: string;
  nodes: CourseNode[];
  order: number;
  trackId?: string;
}

export interface Track {
  id: string;
  title: string;
  title_en?: string;
  subtitle: string;
  subtitle_en?: string;
  icon_name: string;
  color: string;
  courseIds: string[];
  order: number;
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';
