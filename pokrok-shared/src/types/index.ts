// Core data types for the Cesta application

export interface User {
  id: string
  clerk_user_id: string
  email: string
  name: string
  has_completed_onboarding: boolean
  created_at: Date
  updated_at: Date
}

export interface Value {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  is_custom: boolean
  level: number
  experience: number
  created_at: Date
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  target_date?: string | Date
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  priority: 'meaningful' | 'nice-to-have'
  category: 'short-term' | 'medium-term' | 'long-term'
  goal_type: 'process' | 'outcome'
  progress_percentage: number
  progress_type: 'percentage' | 'count' | 'amount' | 'steps'
  progress_target?: number
  progress_current?: number
  progress_unit?: string
  icon?: string
  created_at: string | Date
  updated_at: string | Date
}

export interface DailyStep {
  id: string
  user_id: string
  goal_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  date: Date
  is_important: boolean
  is_urgent: boolean
  created_at: Date
  step_type: 'update' | 'revision' | 'custom'
  custom_type_name?: string
  deadline?: Date
  metric_id?: string
}

export interface Metric {
  id: string
  user_id: string
  step_id: string
  name: string
  description?: string
  target_value: number
  current_value: number
  unit: string
  created_at: Date
  updated_at: Date
}

export interface GoalMetric {
  id: string
  user_id: string
  goal_id: string
  name: string
  description?: string
  type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'custom'
  unit: string
  target_value: number
  current_value: number
  created_at: Date
  updated_at: Date
}

export interface Event {
  id: string
  user_id: string
  goal_id: string
  automation_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: Date
  date: Date
  is_important: boolean
  is_urgent: boolean
  created_at: Date
  event_type: 'metric_update' | 'step_reminder'
  target_metric_id?: string
  target_step_id?: string
  update_value?: number
  update_unit?: string
}

export interface EventInteraction {
  id: string
  user_id: string
  automation_id: string
  date: Date
  status: 'completed' | 'postponed' | 'pending'
  postponed_to?: Date
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Automation {
  id: string
  user_id: string
  name: string
  description?: string
  type: 'metric' | 'step'
  target_id: string
  frequency_type: 'one-time' | 'recurring'
  frequency_time?: string
  scheduled_date?: Date
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface CategorySettings {
  id: string
  user_id: string
  short_term_days: number
  long_term_days: number
  created_at: Date
  updated_at: Date
}

export interface NeededStepsSettings {
  id: string
  user_id: string
  enabled: boolean
  days_of_week: number[]
  time_hour: number
  time_minute: number
  created_at: Date
  updated_at: Date
}

// API Request/Response types
export interface CreateGoalRequest {
  title: string
  description?: string
  targetDate?: string
  priority?: 'meaningful' | 'nice-to-have'
  progressType?: 'percentage' | 'count' | 'amount' | 'steps'
  progressTarget?: number
  progressCurrent?: number
  progressUnit?: string
  goalType?: 'process' | 'outcome'
  icon?: string
  metrics?: CreateGoalMetricRequest[]
  steps?: CreateStepRequest[]
}

export interface CreateGoalMetricRequest {
  name: string
  description?: string
  type: 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'custom'
  unit: string
  target_value: number
  current_value?: number
}

export interface CreateStepRequest {
  title: string
  description?: string
  date?: string
  is_important?: boolean
  is_urgent?: boolean
  deadline?: string
}

export interface CreateValueRequest {
  name: string
  description: string
  color: string
  icon: string
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  targetDate?: string
  priority?: 'meaningful' | 'nice-to-have'
  progressType?: 'percentage' | 'count' | 'amount' | 'steps'
  progressTarget?: number
  progressCurrent?: number
  progressUnit?: string
  goalType?: 'process' | 'outcome'
  icon?: string
}

export interface UpdateDailyStepRequest {
  title?: string
  description?: string
  completed?: boolean
  date?: string
  is_important?: boolean
  is_urgent?: boolean
}

export interface UpdateValueRequest {
  name?: string
  description?: string
  color?: string
  icon?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface GoalsResponse {
  goals: Goal[]
}

export interface ValuesResponse {
  values: Value[]
}

export interface DailyStepsResponse {
  steps: DailyStep[]
}

export interface EventsResponse {
  events: Event[]
}

export interface GoalMetricsResponse {
  metrics: GoalMetric[]
}

// Error types
export interface ApiError {
  error: string
  status?: number
  details?: any
}
