import Foundation
import Combine

class APIManager: ObservableObject {
    static let shared = APIManager()
    
    @Published var isLoading = false
    @Published var error: String?
    
    private let baseURL = "https://www.pokrok.app"
    
    private var authToken: String?
    private var userId: String?
    
    // URLSession with cookies support
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        return URLSession(configuration: config)
    }()
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    func setUserId(_ userId: String?) {
        self.userId = userId
    }
    
    // MARK: - Game Init
    
    func fetchGameData() async throws -> GameInitResponse {
        guard authToken != nil else {
            throw APIError.userNotFound
        }
        
        let url = URL(string: "\(baseURL)/api/game/init-native")!
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        addAuthHeaders(to: &request)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 404 {
            throw APIError.userNotFound
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        // Debug: print response
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📦 API Response: \(jsonString.prefix(500))...")
            // Debug checklist specifically
            if jsonString.contains("checklist") {
                if let stepsRange = jsonString.range(of: "\"steps\"") {
                    let stepsSubstring = jsonString[stepsRange.lowerBound...]
                    print("📋 Steps with checklist: \(stepsSubstring.prefix(1000))...")
                }
            }
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 with fractional seconds
            let iso8601Formatter = ISO8601DateFormatter()
            iso8601Formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            // Try ISO8601 without fractional seconds
            iso8601Formatter.formatOptions = [.withInternetDateTime]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            // Try simple date format
            let simpleFormatter = DateFormatter()
            simpleFormatter.dateFormat = "yyyy-MM-dd"
            if let date = simpleFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
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
            "category": goal.category ?? "",
            "priority": goal.priority ?? "medium",
            "status": goal.status
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
            "description": habit.description ?? "",
            "frequency": habit.frequency ?? "daily",
            "category": habit.category ?? "",
            "difficulty": habit.difficulty ?? "medium",
            "isCustom": habit.isCustom ?? false
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
    
    func toggleStepCompletion(stepId: String, completed: Bool, completedAt: Date?) async throws -> Step {
        let url = URL(string: "\(baseURL)/api/daily-steps")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        var body: [String: Any] = [
            "stepId": stepId,
            "completed": completed
        ]
        
        if let completedAt = completedAt {
            let iso8601Formatter = ISO8601DateFormatter()
            body["completedAt"] = iso8601Formatter.string(from: completedAt)
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        print("📤 Toggling step completion: \(stepId) to \(completed)")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            if let errorStr = String(data: data, encoding: .utf8) {
                print("❌ Toggle step error: \(errorStr)")
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        print("✅ Step completion toggled successfully")
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            if let date = dateFormatter.date(from: dateString) {
                return date
            }
            
            let iso8601Formatter = ISO8601DateFormatter()
            iso8601Formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            iso8601Formatter.formatOptions = [.withInternetDateTime]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date")
        }
        
        return try decoder.decode(Step.self, from: data)
    }
    
    func updateStep(_ step: Step) async throws -> Step {
        let url = URL(string: "\(baseURL)/api/daily-steps")!
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeaders(to: &request)
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        var body: [String: Any] = [
            "stepId": step.id,
            "title": step.title,
            "description": step.description ?? "",
            "completed": step.completed,
            "isImportant": step.isImportant ?? false,
            "isUrgent": step.isUrgent ?? false,
            "estimatedTime": step.estimatedTime ?? 30
        ]
        
        if let completedAt = step.completedAt {
            let iso8601Formatter = ISO8601DateFormatter()
            body["completedAt"] = iso8601Formatter.string(from: completedAt)
        }
        
        if let date = step.date {
            body["date"] = dateFormatter.string(from: date)
        }
        
        if let goalId = step.goalId {
            body["goalId"] = goalId
        }
        
        if let checklist = step.checklist {
            let checklistData = checklist.map { item in
                ["id": item.id, "title": item.title, "completed": item.completed] as [String: Any]
            }
            body["checklist"] = checklistData
            print("📤 Checklist data being sent: \(checklistData)")
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        if let bodyString = String(data: request.httpBody!, encoding: .utf8) {
            print("📤 Full request body: \(bodyString)")
        }
        
        print("📤 Updating step: \(step.id) with checklist: \(step.checklist?.count ?? 0) items")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            if let errorStr = String(data: data, encoding: .utf8) {
                print("❌ Update step error: \(errorStr)")
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        print("✅ Step updated successfully")
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            if let date = dateFormatter.date(from: dateString) {
                return date
            }
            
            let iso8601Formatter = ISO8601DateFormatter()
            iso8601Formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            iso8601Formatter.formatOptions = [.withInternetDateTime]
            if let date = iso8601Formatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date")
        }
        
        return try decoder.decode(Step.self, from: data)
    }
    
    // MARK: - Helpers
    
    private func addAuthHeaders(to request: inout URLRequest) {
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("🔐 Adding auth token: \(token.prefix(50))...")
        } else {
            print("⚠️ No auth token available")
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

