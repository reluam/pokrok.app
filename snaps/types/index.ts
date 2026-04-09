export type ModelCategory =
  | 'general_thinking'
  | 'physics'
  | 'psychology'
  | 'economics'
  | 'systems'
  | 'numeracy';

export type LessonType = 'intro' | 'scenario' | 'quiz' | 'application';

export type LessonStepType = 'text' | 'scenario' | 'key_insight' | 'quiz';

export interface LessonStepText {
  type: 'text';
  content: string;
}

export interface ScenarioOption {
  text: string;
  correct: boolean;
  explanation: string;
}

export interface LessonStepScenario {
  type: 'scenario';
  situation: string;
  question: string;
  options: ScenarioOption[];
}

export interface LessonStepKeyInsight {
  type: 'key_insight';
  content: string;
}

export interface LessonStepQuiz {
  type: 'quiz';
  question: string;
  options: ScenarioOption[];
}

export type LessonStep =
  | LessonStepText
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
  full_explanation: string;
  real_world_example: string;
  common_mistakes: string;
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
  subtitle: string;
  icon_name: string;
  color: string;
  nodes: CourseNode[];
  order: number;
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';
