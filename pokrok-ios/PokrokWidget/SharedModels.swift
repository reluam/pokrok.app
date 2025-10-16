import Foundation

// MARK: - Shared Models for Widget

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

// MARK: - API Manager for Widget

class APIManager {
    static let shared = APIManager()
    
    private let baseURL = PokrokWidgetConfiguration.shared.baseURL
    private let session = URLSession.shared
    
    private init() {}
    
    func fetchSteps() async throws -> [DailyStep] {
        guard let url = URL(string: "\(baseURL)/daily-steps") else {
            print("Widget API: Invalid URL")
            throw APIError.invalidURL
        }
        
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            // Add authentication token if available
            if let token = getAuthToken() {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
                print("Widget API: Using auth token")
                print("Widget API: Request headers: \(request.allHTTPHeaderFields ?? [:])")
            } else {
                print("Widget API: No auth token found")
            }
            
            print("Widget API: Making request to \(url)")
            print("Widget API: Request method: \(request.httpMethod ?? "nil")")
            print("Widget API: Request headers: \(request.allHTTPHeaderFields ?? [:])")
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("Widget API: Invalid response")
            throw APIError.requestFailed
        }
        
        print("Widget API: Response status: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            print("Widget API: Request failed with status \(httpResponse.statusCode)")
            throw APIError.requestFailed
        }
        
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let stepsResponse = try decoder.decode(StepsResponse.self, from: data)
            print("Widget API: Successfully decoded \(stepsResponse.steps.count) steps")
            return stepsResponse.steps
        } catch {
            print("Widget API: Decoding failed: \(error)")
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
    
        private func getAuthToken() -> String? {
            // Try to get auth token from shared UserDefaults
            let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults()
            print("Widget API: UserDefaults accessible: \(userDefaults != nil ? "YES" : "NO")")
            
            if let userDefaults = userDefaults {
                // Force synchronize to get latest data
                userDefaults.synchronize()
                
                let allKeys = userDefaults.dictionaryRepresentation().keys
                print("Widget API: Available keys: \(Array(allKeys))")
                
                let token = userDefaults.string(forKey: "auth_token")
                print("Widget API: Auth token found: \(token != nil ? "YES" : "NO")")
                if let token = token {
                    print("Widget API: Token preview: \(token.prefix(20))...")
                    print("Widget API: Token length: \(token.count)")
                    print("Widget API: Token starts with: \(token.prefix(50))")
                    
                    // Check if token is expired
                    if isTokenExpired(token) {
                        print("⚠️ Widget API: Token is expired!")
                        
                        // Try to get a fresh token from main app
                        if let freshToken = userDefaults.string(forKey: "fresh_auth_token") {
                            print("🔄 Widget API: Found fresh token, using it")
                            // Move fresh token to main position
                            userDefaults.set(freshToken, forKey: "auth_token")
                            userDefaults.removeObject(forKey: "fresh_auth_token")
                            userDefaults.synchronize()
                            return freshToken
                        }
                        
                        // If no fresh token, wait a bit and try again
                        print("⏳ Widget API: No fresh token, waiting for main app to refresh...")
                        return nil
                    } else {
                        print("✅ Widget API: Token is valid")
                    }
                } else {
                    print("Widget API: Token is nil - checking if key exists...")
                    let hasKey = userDefaults.object(forKey: "auth_token") != nil
                    print("Widget API: Key 'auth_token' exists: \(hasKey)")
                }
                return token
            }
            
            print("Widget API: No UserDefaults access")
            return nil
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
            let now = Date()
            let isExpired = now >= expirationDate
            
            print("🕐 Widget: Token expires: \(expirationDate)")
            print("🕐 Widget: Current time: \(now)")
            print("🕐 Widget: Token expired: \(isExpired)")
            
            return isExpired
        }
}

// MARK: - API Response Models

struct StepsResponse: Codable {
    let steps: [DailyStep]
}

struct GoalsResponse: Codable {
    let goals: [Goal]
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
