"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.CestaApiClient = void 0;
class CestaApiClient {
    constructor(baseUrl, authToken) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.authToken = authToken;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        // Add custom headers if provided
        if (options.headers) {
            Object.assign(headers, options.headers);
        }
        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }
        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status, errorData);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(error instanceof Error ? error.message : 'Unknown error', 0, error);
        }
    }
    // Goals API
    async getGoals() {
        const response = await this.request('/api/cesta/goals');
        return response.goals || [];
    }
    async createGoal(goalData) {
        const response = await this.request('/api/cesta/goals', {
            method: 'POST',
            body: JSON.stringify(goalData),
        });
        return response.goal;
    }
    async createGoalWithSteps(goalData) {
        const response = await this.request('/api/cesta/goals-with-steps', {
            method: 'POST',
            body: JSON.stringify(goalData),
        });
        return response.goal;
    }
    async updateGoal(goalId, goalData) {
        const response = await this.request(`/api/cesta/goals/${goalId}`, {
            method: 'PATCH',
            body: JSON.stringify(goalData),
        });
        return response.goal;
    }
    async deleteGoal(goalId) {
        await this.request(`/api/cesta/goals/${goalId}`, {
            method: 'DELETE',
        });
    }
    // Values API
    async getValues() {
        const response = await this.request('/api/cesta/values');
        return response.values || [];
    }
    async createValue(valueData) {
        const response = await this.request('/api/cesta/values', {
            method: 'POST',
            body: JSON.stringify(valueData),
        });
        return response.value;
    }
    async updateValue(valueId, valueData) {
        const response = await this.request(`/api/cesta/values/${valueId}`, {
            method: 'PATCH',
            body: JSON.stringify(valueData),
        });
        return response.value;
    }
    async deleteValue(valueId) {
        await this.request(`/api/cesta/values/${valueId}`, {
            method: 'DELETE',
        });
    }
    // Daily Steps API
    async getDailySteps() {
        const response = await this.request('/api/cesta/daily-steps');
        return response.steps || [];
    }
    async createDailyStep(stepData) {
        const response = await this.request('/api/cesta/daily-steps', {
            method: 'POST',
            body: JSON.stringify(stepData),
        });
        return response.step;
    }
    async updateDailyStep(stepId, stepData) {
        const response = await this.request(`/api/cesta/daily-steps/${stepId}`, {
            method: 'PATCH',
            body: JSON.stringify(stepData),
        });
        return response.step;
    }
    async toggleDailyStep(stepId) {
        const response = await this.request(`/api/cesta/daily-steps/${stepId}/toggle`, {
            method: 'PATCH',
        });
        return response.step;
    }
    async deleteDailyStep(stepId) {
        await this.request(`/api/cesta/daily-steps/${stepId}`, {
            method: 'DELETE',
        });
    }
    // Events API
    async getEvents() {
        const response = await this.request('/api/cesta/events');
        return response.events || [];
    }
    async createEvent(eventData) {
        const response = await this.request('/api/cesta/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
        return response.event;
    }
    async updateEvent(eventId, eventData) {
        const response = await this.request(`/api/cesta/events/${eventId}`, {
            method: 'PATCH',
            body: JSON.stringify(eventData),
        });
        return response.event;
    }
    async deleteEvent(eventId) {
        await this.request(`/api/cesta/events/${eventId}`, {
            method: 'DELETE',
        });
    }
    // Goal Metrics API
    async getGoalMetrics(goalId) {
        const response = await this.request(`/api/cesta/goals/${goalId}/metrics`);
        return response.metrics || [];
    }
    async createGoalMetric(goalId, metricData) {
        const response = await this.request(`/api/cesta/goals/${goalId}/metrics`, {
            method: 'POST',
            body: JSON.stringify(metricData),
        });
        return response.metric;
    }
    async updateGoalMetric(metricId, metricData) {
        const response = await this.request(`/api/cesta/goal-metrics/${metricId}`, {
            method: 'PATCH',
            body: JSON.stringify(metricData),
        });
        return response.metric;
    }
    async deleteGoalMetric(metricId) {
        await this.request(`/api/cesta/goal-metrics/${metricId}`, {
            method: 'DELETE',
        });
    }
    // User API
    async getUser() {
        const response = await this.request('/api/cesta/users');
        return response.user;
    }
    async updateUserOnboardingStatus(hasCompleted) {
        await this.request('/api/cesta/complete-onboarding', {
            method: 'POST',
            body: JSON.stringify({ hasCompletedOnboarding: hasCompleted }),
        });
    }
    // Settings API
    async getCategorySettings() {
        try {
            const response = await this.request('/api/cesta/category-settings');
            return response.settings;
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }
    async updateCategorySettings(settings) {
        const response = await this.request('/api/cesta/category-settings', {
            method: 'POST',
            body: JSON.stringify(settings),
        });
        return response.settings;
    }
    async getNeededStepsSettings() {
        try {
            const response = await this.request('/api/cesta/needed-steps-settings');
            return response.settings;
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }
    async updateNeededStepsSettings(settings) {
        const response = await this.request('/api/cesta/needed-steps-settings', {
            method: 'POST',
            body: JSON.stringify(settings),
        });
        return response.settings;
    }
    // Utility methods
    setAuthToken(token) {
        this.authToken = token;
    }
    clearAuthToken() {
        this.authToken = undefined;
    }
}
exports.CestaApiClient = CestaApiClient;
// Custom error class
class ApiError extends Error {
    constructor(message, status, details) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=index.js.map