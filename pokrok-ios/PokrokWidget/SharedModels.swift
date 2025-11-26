import Foundation

// MARK: - Shared Models for Widget

struct User: Codable {
    let id: String
    let email: String
    let name: String?
    let firstName: String?
    let lastName: String?
    let onboardingCompleted: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case name
        case firstName = "first_name"
        case lastName = "last_name"
        case onboardingCompleted = "has_completed_onboarding"
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

struct Habit: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let description: String?
    let frequency: String
    let streak: Int
    let maxStreak: Int
    let category: String?
    let difficulty: String?
    let isCustom: Bool
    let reminderTime: String?
    let selectedDays: [String]?
    let habitCompletions: [String: Bool]?
    let alwaysShow: Bool
    let xpReward: Int
    let aspirationId: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case description
        case frequency
        case streak
        case maxStreak = "max_streak"
        case category
        case difficulty
        case isCustom = "is_custom"
        case reminderTime = "reminder_time"
        case selectedDays = "selected_days"
        case habitCompletions = "habit_completions"
        case alwaysShow = "always_show"
        case xpReward = "xp_reward"
        case aspirationId = "aspiration_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - API Manager for Widget

class APIManager {
    static let shared = APIManager()
    
    private let baseURL = PokrokWidgetConfiguration.shared.baseURL
    private let session = URLSession.shared
    
    private init() {}
    
    func fetchUser() async throws -> User {
        // Try to get userId from UserDefaults first (cached)
        if let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults(),
           let userId = userDefaults.string(forKey: "cached_user_id"),
           !userId.isEmpty {
            return User(id: userId, email: "", name: nil, firstName: nil, lastName: nil, onboardingCompleted: false)
        }
        
        // Try to extract userId from JWT token (even if expired - we just need the userId)
        let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults()
        let token = userDefaults?.string(forKey: "auth_token") ?? userDefaults?.string(forKey: "fresh_auth_token")
        
        if let token = token {
            // Try to extract "sub" from token (Clerk user ID)
            let parts = token.components(separatedBy: ".")
            if parts.count == 3 {
                let payload = parts[1]
                let paddedPayload = payload.padding(toLength: ((payload.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
                
                if let data = Data(base64Encoded: paddedPayload),
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    
                    // Try "sub" first (Clerk user ID)
                    if let sub = json["sub"] as? String {
                        // Cache it
                        if let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults() {
                            userDefaults.set(sub, forKey: "cached_user_id")
                            userDefaults.synchronize()
                        }
                        return User(id: sub, email: "", name: nil, firstName: nil, lastName: nil, onboardingCompleted: false)
                    }
                    
                    // Try other possible keys
                    if let userId = json["userId"] as? String {
                        if let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults() {
                            userDefaults.set(userId, forKey: "cached_user_id")
                            userDefaults.synchronize()
                        }
                        return User(id: userId, email: "", name: nil, firstName: nil, lastName: nil, onboardingCompleted: false)
                    }
                    
                    if let userId = json["user_id"] as? String {
                        if let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults() {
                            userDefaults.set(userId, forKey: "cached_user_id")
                            userDefaults.synchronize()
                        }
                        return User(id: userId, email: "", name: nil, firstName: nil, lastName: nil, onboardingCompleted: false)
                    }
                }
            }
        }
        
        throw APIError.requestFailed
    }
    
    private func extractUserIdFromToken(_ token: String) -> String? {
        // Decode JWT token to extract userId
        let parts = token.components(separatedBy: ".")
        guard parts.count == 3 else { return nil }
        
        // Decode payload (base64url)
        let payload = parts[1]
        let paddedPayload = payload.padding(toLength: ((payload.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        
        guard let data = Data(base64Encoded: paddedPayload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        
        // Try different possible keys for userId (Clerk uses "sub")
        return json["sub"] as? String ?? json["userId"] as? String ?? json["user_id"] as? String
    }
    
    func fetchSteps(startDate: Date? = nil, endDate: Date? = nil) async throws -> [DailyStep] {
        // First, get userId from user endpoint (same as main app)
        let user = try await fetchUser()
        
        guard var urlComponents = URLComponents(string: "\(baseURL)/daily-steps") else {
            throw APIError.invalidURL
        }
        
        // Add userId and date range query parameters
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "userId", value: user.id)
        ]
        
        if let startDate = startDate, let endDate = endDate {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            queryItems.append(URLQueryItem(name: "startDate", value: formatter.string(from: startDate)))
            queryItems.append(URLQueryItem(name: "endDate", value: formatter.string(from: endDate)))
        }
        
        urlComponents.queryItems = queryItems
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication token if available
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 401 {
                print("⚠️ Widget API: Unauthorized (401) - token may be expired")
            } else if httpResponse.statusCode == 404 {
                print("⚠️ Widget API: Not found (404)")
            }
            throw APIError.requestFailed
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            // API returns array directly
            return try decoder.decode([DailyStep].self, from: data)
        } catch {
            // Try wrapped format as fallback
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            if let stepsResponse = try? decoder.decode(StepsResponse.self, from: data) {
                return stepsResponse.steps
            }
            throw APIError.decodingFailed
        }
    }
    
    func fetchGoals() async throws -> [Goal] {
        guard let url = URL(string: "\(baseURL)/api/goals") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication token if available
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let goalsResponse = try decoder.decode(GoalsResponse.self, from: data)
            return goalsResponse.goals
        } catch {
            throw APIError.decodingFailed
        }
    }
    
    func fetchHabits() async throws -> [Habit] {
        guard let url = URL(string: "\(baseURL)/habits") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication token if available
        if let token = getAuthToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 401 {
                print("⚠️ Widget API: Habits unauthorized (401) - token may be expired")
            } else if httpResponse.statusCode == 404 {
                print("⚠️ Widget API: Habits endpoint not found (404)")
            }
            throw APIError.requestFailed
        }
        
        // Handle habit_completions similar to main app
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        // Try direct decoding first (PostgreSQL returns JSONB as object, not string)
        do {
            let habits = try decoder.decode([Habit].self, from: data)
            return habits
        } catch {
            // Fallback: manual parsing for habit_completions
            guard let habitsArray = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                throw APIError.decodingFailed
            }
            
            var processedHabits: [Habit] = []
            
            for var habitDict in habitsArray {
                // Parse habit_completions if it's a string (JSON)
                if let completionsString = habitDict["habit_completions"] as? String,
                   let completionsData = completionsString.data(using: .utf8),
                   let completionsDict = try? JSONSerialization.jsonObject(with: completionsData) as? [String: Bool] {
                    habitDict["habit_completions"] = completionsDict
                } else if habitDict["habit_completions"] is [String: Bool] {
                    // Already a dictionary, keep it
                } else if habitDict["habit_completions"] == nil || habitDict["habit_completions"] is NSNull {
                    habitDict["habit_completions"] = [String: Bool]()
                }
                
                if let updatedData = try? JSONSerialization.data(withJSONObject: habitDict),
                   let habit = try? decoder.decode(Habit.self, from: updatedData) {
                    processedHabits.append(habit)
                }
            }
            
            return processedHabits
        }
    }
    
        private func getAuthToken() -> String? {
            let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults()
            guard let userDefaults = userDefaults else {
                return nil
            }
            
            userDefaults.synchronize()
            
            // First, try to get a fresh token
            if let freshToken = userDefaults.string(forKey: "fresh_auth_token") {
                // Move fresh token to main position
                userDefaults.set(freshToken, forKey: "auth_token")
                userDefaults.removeObject(forKey: "fresh_auth_token")
                userDefaults.synchronize()
                return freshToken
            }
            
            // If no fresh token, try the regular token (even if expired)
            return userDefaults.string(forKey: "auth_token")
        }
        
        private func isTokenExpired(_ token: String) -> Bool {
            // Decode JWT token to check expiration
            let parts = token.components(separatedBy: ".")
            guard parts.count == 3 else { return true }
            
            // Decode payload (base64url)
            let payload = parts[1]
            let paddedPayload = payload.padding(toLength: ((payload.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
            
            guard let data = Data(base64Encoded: paddedPayload),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let exp = json["exp"] as? TimeInterval else {
                return true
            }
            
            let expirationDate = Date(timeIntervalSince1970: exp)
            return Date() >= expirationDate
        }
}

// MARK: - API Response Models

struct StepsResponse: Codable {
    let steps: [DailyStep]
}

struct GoalsResponse: Codable {
    let goals: [Goal]
}

struct HabitsResponse: Codable {
    let habits: [Habit]
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
