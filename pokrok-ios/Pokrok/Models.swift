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

// MARK: - API Errors

enum APIError: Error, LocalizedError {
    case invalidURL
    case requestFailed
    case decodingFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Neplatná URL adresa"
        case .requestFailed:
            return "Požadavek selhal"
        case .decodingFailed:
            return "Chyba při dekódování dat"
        }
    }
}
