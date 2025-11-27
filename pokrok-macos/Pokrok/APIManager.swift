import Foundation
import Combine

class APIManager: ObservableObject {
    static let shared = APIManager()
    
    @Published var isLoading = false
    @Published var error: String?
    
    private var baseURL: String {
        // Use environment variable or default to localhost for development
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000"
    }
    
    private var authToken: String?
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    // MARK: - Game Init
    
    func fetchGameData() async throws -> GameInitResponse {
        let url = URL(string: "\(baseURL)/api/game/init")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        addAuthHeaders(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 404 {
            throw APIError.userNotFound
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(GameInitResponse.self, from: data)
    }
    
    // MARK: - Goals
    
    func fetchGoals(userId: String) async throws -> [Goal] {
        let url = URL(string: "\(baseURL)/api/goals?userId=\(userId)")!
        var request = URLRequest(url: url)
        addAuthHeaders(to: &request)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([Goal].self, from: data)
    }
    
    func createGoal(_ goal: Goal, userId: String) async throws -> Goal {
        let url = URL(string: "\(baseURL)/api/goals")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let body: [String: Any] = [
            "userId": userId,
            "title": goal.title,
            "description": goal.description ?? "",
            "category": goal.category,
            "priority": goal.priority.rawValue,
            "status": goal.status.rawValue
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Goal.self, from: data)
    }
    
    func updateGoal(_ goal: Goal) async throws -> Goal {
        let url = URL(string: "\(baseURL)/api/goals/\(goal.id)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(goal)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Goal.self, from: data)
    }
    
    func deleteGoal(_ goalId: String) async throws {
        let url = URL(string: "\(baseURL)/api/goals/\(goalId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeaders(to: &request)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.deleteFailed
        }
    }
    
    // MARK: - Habits
    
    func fetchHabits(userId: String) async throws -> [Habit] {
        let url = URL(string: "\(baseURL)/api/habits?userId=\(userId)")!
        var request = URLRequest(url: url)
        addAuthHeaders(to: &request)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([Habit].self, from: data)
    }
    
    func createHabit(_ habit: Habit, userId: String) async throws -> Habit {
        let url = URL(string: "\(baseURL)/api/habits")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let body: [String: Any] = [
            "userId": userId,
            "name": habit.name,
            "description": habit.description,
            "frequency": habit.frequency.rawValue,
            "category": habit.category,
            "difficulty": habit.difficulty.rawValue,
            "isCustom": habit.isCustom
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Habit.self, from: data)
    }
    
    func completeHabit(_ habitId: String, date: String) async throws {
        let url = URL(string: "\(baseURL)/api/habits/\(habitId)/complete")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let body = ["date": date]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, _) = try await URLSession.shared.data(for: request)
    }
    
    func deleteHabit(_ habitId: String) async throws {
        let url = URL(string: "\(baseURL)/api/habits/\(habitId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeaders(to: &request)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.deleteFailed
        }
    }
    
    // MARK: - Steps
    
    func fetchSteps(goalId: String) async throws -> [Step] {
        let url = URL(string: "\(baseURL)/api/steps?goalId=\(goalId)")!
        var request = URLRequest(url: url)
        addAuthHeaders(to: &request)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([Step].self, from: data)
    }
    
    func createStep(_ step: Step) async throws -> Step {
        let url = URL(string: "\(baseURL)/api/steps")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        request.httpBody = try encoder.encode(step)
        
        let (data, _) = try await URLSession.shared.data(for: request)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Step.self, from: data)
    }
    
    func toggleStepCompletion(_ stepId: String, completed: Bool) async throws {
        let url = URL(string: "\(baseURL)/api/steps/\(stepId)")!
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let body = ["isCompleted": completed]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, _) = try await URLSession.shared.data(for: request)
    }
    
    // MARK: - Helpers
    
    private func addAuthHeaders(to request: inout URLRequest) {
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }
}

// MARK: - API Errors

enum APIError: LocalizedError {
    case invalidResponse
    case userNotFound
    case serverError(Int)
    case deleteFailed
    case encodingFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .userNotFound:
            return "User not found"
        case .serverError(let code):
            return "Server error: \(code)"
        case .deleteFailed:
            return "Failed to delete"
        case .encodingFailed:
            return "Failed to encode data"
        }
    }
}

