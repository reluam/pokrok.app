import {
  User,
  Goal,
  Value,
  DailyStep,
  Event,
  GoalMetric,
  Automation,
  CategorySettings,
  NeededStepsSettings,
  CreateGoalRequest,
  CreateValueRequest,
  UpdateGoalRequest,
  UpdateDailyStepRequest,
  UpdateValueRequest,
  CreateGoalMetricRequest,
  CreateStepRequest,
  ApiResponse,
  GoalsResponse,
  ValuesResponse,
  DailyStepsResponse,
  EventsResponse,
  GoalMetricsResponse
} from '../types'

export class CestaApiClient {
  private baseUrl: string
  private authToken?: string

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.authToken = authToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Add custom headers if provided
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      return await response.json() as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        error
      )
    }
  }

  // Goals API
  async getGoals(): Promise<Goal[]> {
    const response = await this.request<GoalsResponse>('/api/cesta/goals')
    return response.goals || []
  }

  async createGoal(goalData: CreateGoalRequest): Promise<Goal> {
    const response = await this.request<{ goal: Goal }>('/api/cesta/goals', {
      method: 'POST',
      body: JSON.stringify(goalData),
    })
    return response.goal
  }

  async createGoalWithSteps(goalData: CreateGoalRequest): Promise<Goal> {
    const response = await this.request<{ goal: Goal }>('/api/cesta/goals-with-steps', {
      method: 'POST',
      body: JSON.stringify(goalData),
    })
    return response.goal
  }

  async updateGoal(goalId: string, goalData: UpdateGoalRequest): Promise<Goal> {
    const response = await this.request<{ goal: Goal }>(`/api/cesta/goals/${goalId}`, {
      method: 'PATCH',
      body: JSON.stringify(goalData),
    })
    return response.goal
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.request(`/api/cesta/goals/${goalId}`, {
      method: 'DELETE',
    })
  }

  // Values API
  async getValues(): Promise<Value[]> {
    const response = await this.request<ValuesResponse>('/api/cesta/values')
    return response.values || []
  }

  async createValue(valueData: CreateValueRequest): Promise<Value> {
    const response = await this.request<{ value: Value }>('/api/cesta/values', {
      method: 'POST',
      body: JSON.stringify(valueData),
    })
    return response.value
  }

  async updateValue(valueId: string, valueData: UpdateValueRequest): Promise<Value> {
    const response = await this.request<{ value: Value }>(`/api/cesta/values/${valueId}`, {
      method: 'PATCH',
      body: JSON.stringify(valueData),
    })
    return response.value
  }

  async deleteValue(valueId: string): Promise<void> {
    await this.request(`/api/cesta/values/${valueId}`, {
      method: 'DELETE',
    })
  }

  // Daily Steps API
  async getDailySteps(): Promise<DailyStep[]> {
    const response = await this.request<DailyStepsResponse>('/api/cesta/daily-steps')
    return response.steps || []
  }

  async createDailyStep(stepData: Partial<DailyStep>): Promise<DailyStep> {
    const response = await this.request<{ step: DailyStep }>('/api/cesta/daily-steps', {
      method: 'POST',
      body: JSON.stringify(stepData),
    })
    return response.step
  }

  async updateDailyStep(stepId: string, stepData: UpdateDailyStepRequest): Promise<DailyStep> {
    const response = await this.request<{ step: DailyStep }>(`/api/cesta/daily-steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(stepData),
    })
    return response.step
  }

  async toggleDailyStep(stepId: string): Promise<DailyStep> {
    const response = await this.request<{ step: DailyStep }>(`/api/cesta/daily-steps/${stepId}/toggle`, {
      method: 'PATCH',
    })
    return response.step
  }

  async deleteDailyStep(stepId: string): Promise<void> {
    await this.request(`/api/cesta/daily-steps/${stepId}`, {
      method: 'DELETE',
    })
  }

  // Events API
  async getEvents(): Promise<Event[]> {
    const response = await this.request<EventsResponse>('/api/cesta/events')
    return response.events || []
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const response = await this.request<{ event: Event }>('/api/cesta/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
    return response.event
  }

  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    const response = await this.request<{ event: Event }>(`/api/cesta/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    })
    return response.event
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request(`/api/cesta/events/${eventId}`, {
      method: 'DELETE',
    })
  }

  // Goal Metrics API
  async getGoalMetrics(goalId: string): Promise<GoalMetric[]> {
    const response = await this.request<GoalMetricsResponse>(`/api/cesta/goals/${goalId}/metrics`)
    return response.metrics || []
  }

  async createGoalMetric(goalId: string, metricData: CreateGoalMetricRequest): Promise<GoalMetric> {
    const response = await this.request<{ metric: GoalMetric }>(`/api/cesta/goals/${goalId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metricData),
    })
    return response.metric
  }

  async updateGoalMetric(metricId: string, metricData: Partial<GoalMetric>): Promise<GoalMetric> {
    const response = await this.request<{ metric: GoalMetric }>(`/api/cesta/goal-metrics/${metricId}`, {
      method: 'PATCH',
      body: JSON.stringify(metricData),
    })
    return response.metric
  }

  async deleteGoalMetric(metricId: string): Promise<void> {
    await this.request(`/api/cesta/goal-metrics/${metricId}`, {
      method: 'DELETE',
    })
  }

  // User API
  async getUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/api/cesta/users')
    return response.user
  }

  async updateUserOnboardingStatus(hasCompleted: boolean): Promise<void> {
    await this.request('/api/cesta/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify({ hasCompletedOnboarding: hasCompleted }),
    })
  }

  // Settings API
  async getCategorySettings(): Promise<CategorySettings | null> {
    try {
      const response = await this.request<{ settings: CategorySettings }>('/api/cesta/category-settings')
      return response.settings
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  }

  async updateCategorySettings(settings: Partial<CategorySettings>): Promise<CategorySettings> {
    const response = await this.request<{ settings: CategorySettings }>('/api/cesta/category-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
    return response.settings
  }

  async getNeededStepsSettings(): Promise<NeededStepsSettings | null> {
    try {
      const response = await this.request<{ settings: NeededStepsSettings }>('/api/cesta/needed-steps-settings')
      return response.settings
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  }

  async updateNeededStepsSettings(settings: Partial<NeededStepsSettings>): Promise<NeededStepsSettings> {
    const response = await this.request<{ settings: NeededStepsSettings }>('/api/cesta/needed-steps-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    })
    return response.settings
  }

  // Utility methods
  setAuthToken(token: string): void {
    this.authToken = token
  }

  clearAuthToken(): void {
    this.authToken = undefined
  }
}

// Custom error class
export class ApiError extends Error {
  public status?: number
  public details?: any

  constructor(
    message: string,
    status?: number,
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}
