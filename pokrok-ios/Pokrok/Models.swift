import Foundation

// MARK: - Request Models

struct CreateGoalRequest: Codable {
    let title: String
    let description: String?
    let targetDate: Date?
    let priority: String
    let icon: String?
}

struct CreateStepRequest: Codable {
    let title: String
    let description: String?
    let date: Date
    let goalId: String?
}

// MARK: - Response Models

struct User: Codable {
    let id: String
    let email: String
    let firstName: String?
    let lastName: String?
    let onboardingCompleted: Bool
}

struct Goal: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let targetDate: Date?
    let priority: String
    let status: String
    let progressPercentage: Int
    let icon: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case targetDate = "target_date"
        case priority
        case status
        case progressPercentage = "progress_percentage"
        case icon
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct DailyStep: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let date: Date
    let completed: Bool
    let goalId: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case date
        case completed
        case goalId = "goal_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - API Response Models

struct GoalsResponse: Codable {
    let goals: [Goal]
}

struct StepsResponse: Codable {
    let steps: [DailyStep]
}

struct StepResponse: Codable {
    let step: DailyStep
}

struct GoalResponse: Codable {
    let goal: Goal
}

// MARK: - Note Model
struct Note: Codable, Identifiable {
    let id: String
    let userId: String
    let goalId: String?
    let title: String
    let content: String
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case goalId = "goal_id"
        case title
        case content
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Note API Response Models
struct NotesResponse: Codable {
    let notes: [Note]
}

struct NoteResponse: Codable {
    let note: Note
}

// MARK: - User Settings Model
struct UserSettings: Codable {
    let id: String
    let userId: String
    let dailyStepsCount: Int
    let workflow: String // 'daily_planning' or 'no_workflow'
    let filters: FilterSettings?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case dailyStepsCount = "daily_steps_count"
        case workflow
        case filters
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Filter Settings Model
struct FilterSettings: Codable {
    var showToday: Bool
    var showOverdue: Bool
    var showFuture: Bool
    var showWithGoal: Bool
    var showWithoutGoal: Bool
    var sortBy: String // 'date', 'priority', 'title'

    enum CodingKeys: String, CodingKey {
        case showToday = "showToday"
        case showOverdue = "showOverdue"
        case showFuture = "showFuture"
        case showWithGoal = "showWithGoal"
        case showWithoutGoal = "showWithoutGoal"
        case sortBy = "sortBy"
    }
}

// MARK: - User Settings API Response Models
struct UserSettingsResponse: Codable {
    let settings: UserSettings
}

// MARK: - Daily Planning Model
struct DailyPlanning: Codable {
    let id: String
    let userId: String
    let date: Date
    let plannedSteps: [String]
    let completedSteps: [String]
    let createdAt: Date?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case plannedSteps = "planned_steps"
        case completedSteps = "completed_steps"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Daily Planning API Response Models
struct DailyPlanningResponse: Codable {
    let planning: DailyPlanning
}

// MARK: - API Errors

enum APIError: Error, LocalizedError {
    case invalidURL
    case requestFailed
    case decodingFailed
    case invalidResponse
    case serverError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Neplatná URL adresa"
        case .requestFailed:
            return "Požadavek selhal"
        case .decodingFailed:
            return "Chyba při dekódování dat"
        case .invalidResponse:
            return "Neplatná odpověď ze serveru"
        case .serverError(let code):
            return "Chyba serveru: \(code)"
        }
    }
}
