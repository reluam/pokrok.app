import { User, Goal, Value, DailyStep, Event, GoalMetric, CategorySettings, NeededStepsSettings, DailyPlanning, CreateGoalRequest, CreateValueRequest, UpdateGoalRequest, UpdateDailyStepRequest, UpdateValueRequest, CreateGoalMetricRequest } from '../types';
export declare class CestaApiClient {
    private baseUrl;
    private authToken?;
    constructor(baseUrl: string, authToken?: string);
    private request;
    getGoals(): Promise<Goal[]>;
    createGoal(goalData: CreateGoalRequest): Promise<Goal>;
    createGoalWithSteps(goalData: CreateGoalRequest): Promise<Goal>;
    updateGoal(goalId: string, goalData: UpdateGoalRequest): Promise<Goal>;
    deleteGoal(goalId: string): Promise<void>;
    getValues(): Promise<Value[]>;
    createValue(valueData: CreateValueRequest): Promise<Value>;
    updateValue(valueId: string, valueData: UpdateValueRequest): Promise<Value>;
    deleteValue(valueId: string): Promise<void>;
    getDailySteps(): Promise<DailyStep[]>;
    createDailyStep(stepData: Partial<DailyStep>): Promise<DailyStep>;
    updateDailyStep(stepId: string, stepData: UpdateDailyStepRequest): Promise<DailyStep>;
    toggleDailyStep(stepId: string): Promise<DailyStep>;
    deleteDailyStep(stepId: string): Promise<void>;
    getEvents(): Promise<Event[]>;
    createEvent(eventData: Partial<Event>): Promise<Event>;
    updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event>;
    deleteEvent(eventId: string): Promise<void>;
    getGoalMetrics(goalId: string): Promise<GoalMetric[]>;
    createGoalMetric(goalId: string, metricData: CreateGoalMetricRequest): Promise<GoalMetric>;
    updateGoalMetric(metricId: string, metricData: Partial<GoalMetric>): Promise<GoalMetric>;
    deleteGoalMetric(metricId: string): Promise<void>;
    getUser(): Promise<User>;
    updateUserOnboardingStatus(hasCompleted: boolean): Promise<void>;
    getDailyPlanning(date: string): Promise<DailyPlanning | null>;
    createOrUpdateDailyPlanning(date: string, plannedSteps: string[]): Promise<DailyPlanning>;
    markStepAsCompleted(date: string, stepId: string): Promise<DailyPlanning>;
    updateDailyPlanningOrder(date: string, plannedSteps: string[]): Promise<DailyPlanning>;
    getCategorySettings(): Promise<CategorySettings | null>;
    updateCategorySettings(settings: Partial<CategorySettings>): Promise<CategorySettings>;
    getNeededStepsSettings(): Promise<NeededStepsSettings | null>;
    updateNeededStepsSettings(settings: Partial<NeededStepsSettings>): Promise<NeededStepsSettings>;
    setAuthToken(token: string): void;
    clearAuthToken(): void;
}
export declare class ApiError extends Error {
    status?: number;
    details?: any;
    constructor(message: string, status?: number, details?: any);
}
//# sourceMappingURL=index.d.ts.map