import Foundation
import Clerk

class APIManager: ObservableObject {
    static let shared = APIManager()
    
    private let baseURL = "https://www.pokrok.app/api"
    
    private init() {}
    
    // MARK: - JSON Decoder Helper
    
    private func createJSONDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
        formatter.timeZone = TimeZone(abbreviation: "UTC")
        decoder.dateDecodingStrategy = .formatted(formatter)
        return decoder
    }
    
    // MARK: - Goals API
    
    func fetchGoals() async throws -> [Goal] {
        guard let url = URL(string: "\(baseURL)/cesta/goals") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Debug: Print raw response
        if let responseString = String(data: data, encoding: .utf8) {
            print("✅ Raw API response: \(responseString)")
        }
        
        // Parse response - API returns { goals: [...] }
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let goalsResponse = try decoder.decode(GoalsResponse.self, from: data)
        return goalsResponse.goals
    }
    
    func createGoal(_ goal: CreateGoalRequest) async throws -> Goal {
        guard let url = URL(string: "\(baseURL)/cesta/goals") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let jsonData = try encoder.encode(goal)
        request.httpBody = jsonData
        
        // Debugging: Print request body
        if let requestBody = String(data: jsonData, encoding: .utf8) {
            print("✅ Request body for create goal: \(requestBody)")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        print("✅ API response status for create goal: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Debugging: Print raw API response
        if let rawResponse = String(data: data, encoding: .utf8) {
            print("✅ Raw API response for create goal: \(rawResponse)")
        }
        
        // Parse response - API returns { goal: ... }
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let goalResponse = try decoder.decode(GoalResponse.self, from: data)
        return goalResponse.goal
    }
    
    // MARK: - Steps API
    
    func fetchSteps() async throws -> [DailyStep] {
        print("🔍 Main App: fetchSteps called")
        guard let url = URL(string: "\(baseURL)/cesta/daily-steps") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("🔍 Main App: Using auth token for API call")
        } else {
            print("🔍 Main App: No auth token available")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Debug: Print raw response
        if let responseString = String(data: data, encoding: .utf8) {
            print("✅ Raw API response: \(responseString)")
        }
        
        // Parse response - API returns { steps: [...] }
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let stepsResponse = try decoder.decode(StepsResponse.self, from: data)
        return stepsResponse.steps
    }
    
    func createStep(_ step: CreateStepRequest) async throws -> DailyStep {
        guard let url = URL(string: "\(baseURL)/cesta/daily-steps") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let jsonData = try encoder.encode(step)
        request.httpBody = jsonData
        
        // Debugging: Print request body
        if let requestBody = String(data: jsonData, encoding: .utf8) {
            print("✅ Request body for create step: \(requestBody)")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        print("✅ API response status for create step: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Debugging: Print raw API response
        if let rawResponse = String(data: data, encoding: .utf8) {
            print("✅ Raw API response for create step: \(rawResponse)")
        }
        
        // Parse response - API returns { step: ... }
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let stepResponse = try decoder.decode(StepResponse.self, from: data)
        return stepResponse.step
    }
    
    func updateStepCompletion(stepId: String, completed: Bool, currentStep: DailyStep) async throws -> DailyStep {
        guard let url = URL(string: "\(baseURL)/cesta/daily-steps/\(stepId)/toggle") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Send only the completed status - the backend will toggle it
        let updateData: [String: Any] = [
            "completed": completed
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: updateData)
        request.httpBody = jsonData
        
        // Debug: Print request body
        if let requestBody = String(data: jsonData, encoding: .utf8) {
            print("✅ Request body for toggle step completion: \(requestBody)")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        print("✅ API response status for toggle step completion: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Debug: Print raw response
        if let rawResponse = String(data: data, encoding: .utf8) {
            print("✅ Raw API response for toggle step completion: \(rawResponse)")
        }
        
        // Parse response - API returns { step: ... }
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let stepResponse = try decoder.decode(StepResponse.self, from: data)
        return stepResponse.step
    }
    
    // MARK: - User API
    
    func fetchUser() async throws -> User {
        guard let url = URL(string: "\(baseURL)/cesta/user") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        let user = try createJSONDecoder().decode(User.self, from: data)
        return user
    }
    
    // MARK: - Notes API
    
    func fetchNotes(goalId: String? = nil, standalone: Bool = false) async throws -> [Note] {
        var urlString = "\(baseURL)/cesta/notes"
        var queryItems: [URLQueryItem] = []
        
        if let goalId = goalId {
            queryItems.append(URLQueryItem(name: "goalId", value: goalId))
        }
        
        if standalone {
            queryItems.append(URLQueryItem(name: "standalone", value: "true"))
        }
        
        if !queryItems.isEmpty {
            var components = URLComponents(string: urlString)
            components?.queryItems = queryItems
            urlString = components?.url?.absoluteString ?? urlString
        }
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ Notes API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let notesResponse = try decoder.decode(NotesResponse.self, from: data)
        return notesResponse.notes
    }
    
    func createNote(title: String, content: String, goalId: String? = nil) async throws -> Note {
        guard let url = URL(string: "\(baseURL)/cesta/notes") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var requestData: [String: Any] = [
            "title": title,
            "content": content
        ]
        
        if let goalId = goalId {
            requestData["goalId"] = goalId
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestData)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 201 else {
            print("❌ Create note API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let noteResponse = try decoder.decode(NoteResponse.self, from: data)
        return noteResponse.note
    }
    
    func updateNote(noteId: String, title: String, content: String) async throws -> Note {
        guard let url = URL(string: "\(baseURL)/cesta/notes/\(noteId)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let requestData = [
            "title": title,
            "content": content
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestData)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ Update note API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let noteResponse = try decoder.decode(NoteResponse.self, from: data)
        return noteResponse.note
    }
    
    func deleteNote(noteId: String) async throws {
        guard let url = URL(string: "\(baseURL)/cesta/notes/\(noteId)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            print("❌ Delete note API request failed with status: \(httpResponse.statusCode)")
            throw APIError.requestFailed
        }
    }
    
    // MARK: - User Settings API
    
    func fetchUserSettings() async throws -> UserSettings {
        guard let url = URL(string: "\(baseURL)/cesta/user-settings") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let userSettingsResponse = try createJSONDecoder().decode(UserSettingsResponse.self, from: data)
        return userSettingsResponse.settings
    }
    
    func updateUserSettings(dailyStepsCount: Int? = nil, workflow: String? = nil, filters: FilterSettings? = nil) async throws -> UserSettings {
        guard let url = URL(string: "\(baseURL)/cesta/user-settings") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var requestBody: [String: Any] = [:]
        if let dailyStepsCount = dailyStepsCount {
            requestBody["daily_steps_count"] = dailyStepsCount
        }
        if let workflow = workflow {
            requestBody["workflow"] = workflow
        }
        if let filters = filters {
            requestBody["filters"] = [
                "showToday": filters.showToday,
                "showOverdue": filters.showOverdue,
                "showFuture": filters.showFuture,
                "showWithGoal": filters.showWithGoal,
                "showWithoutGoal": filters.showWithoutGoal,
                "sortBy": filters.sortBy
            ]
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let userSettingsResponse = try createJSONDecoder().decode(UserSettingsResponse.self, from: data)
        return userSettingsResponse.settings
    }
    
    // MARK: - Helper Methods
    
    private func getClerkToken() async -> String? {
        print("🔍 Main App: getClerkToken called")
        do {
            guard let session = await MainActor.run(body: { Clerk.shared.session }) else {
                print("❌ No active Clerk session")
                return nil
            }
            
            print("🔍 Main App: Clerk session found")
            let tokenResource = try await session.getToken()
            guard let token = tokenResource else {
                print("❌ Failed to get token resource")
                return nil
            }
            
            // Get the actual JWT token from TokenResource
            let jwtToken = token.jwt
            print("✅ Got Clerk token: \(jwtToken.prefix(20))...")
            
            // Save token to App Group for widget access
            saveTokenToAppGroup(jwtToken)
            
            return jwtToken
        } catch {
            print("❌ Failed to get Clerk token: \(error)")
            return nil
        }
    }
    
    // MARK: - Token Management for Widget
    
    func refreshTokenForWidget() async {
        print("🔄 Main App: Refreshing token for widget...")
        let startTime = Date()
        if let token = await getClerkToken() {
            let endTime = Date()
            let duration = endTime.timeIntervalSince(startTime)
            print("✅ Token refreshed for widget: \(token.prefix(20))... (took \(String(format: "%.2f", duration))s)")
            
            // Check token expiration
            if isTokenExpired(token) {
                print("⚠️ WARNING: Refreshed token is already expired!")
            } else {
                let expirationDate = getTokenExpirationDate(token)
                let timeUntilExpiry = expirationDate.timeIntervalSince(Date())
                print("⏰ Token expires in \(String(format: "%.1f", timeUntilExpiry)) seconds")
            }
        } else {
            print("❌ Failed to refresh token for widget")
        }
    }
    
    func isTokenExpired(_ token: String) -> Bool {
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
        
        print("🕐 Token expires: \(expirationDate)")
        print("🕐 Current time: \(now)")
        print("🕐 Token expired: \(isExpired)")
        
        return isExpired
    }
    
    private func getTokenExpirationDate(_ token: String) -> Date {
        let parts = token.components(separatedBy: ".")
        guard parts.count == 3 else { return Date.distantPast }
        
        let payload = parts[1]
        let paddedPayload = payload.padding(toLength: ((payload.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        
        guard let data = Data(base64Encoded: paddedPayload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let exp = json["exp"] as? TimeInterval else {
            return Date.distantPast
        }
        
        return Date(timeIntervalSince1970: exp)
    }
    
    private func saveTokenToAppGroup(_ token: String) {
        print("🔍 Main App: saveTokenToAppGroup called with token: \(token.prefix(20))...")
        
        if let userDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrok") {
            print("🔍 Main App: App Group UserDefaults accessible: YES")
            
            // Save as fresh token first, then move to main position
            userDefaults.set(token, forKey: "fresh_auth_token")
            userDefaults.set(token, forKey: "auth_token")
            print("✅ Token saved to App Group")
            print("✅ Token preview: \(token.prefix(20))...")
            
            // Verify it was saved
            let savedToken = userDefaults.string(forKey: "auth_token")
            print("✅ Token verification: \(savedToken != nil ? "SUCCESS" : "FAILED")")
            
            // Debug: List all available keys
            let allKeys = userDefaults.dictionaryRepresentation().keys
            print("🔍 Main App: All keys in App Group: \(Array(allKeys))")
            
            // Force synchronize
            userDefaults.synchronize()
            print("🔍 Main App: UserDefaults synchronized")
        } else {
            print("❌ Failed to access App Group UserDefaults")
        }
    }
    
    // MARK: - Daily Planning API
    
    func fetchDailyPlanning(date: Date) async throws -> DailyPlanning? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        
        guard let url = URL(string: "\(baseURL)/cesta/daily-planning?date=\(dateString)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            if httpResponse.statusCode == 404 {
                // No planning found for this date
                return nil
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let dailyPlanningResponse = try createJSONDecoder().decode(DailyPlanningResponse.self, from: data)
        return dailyPlanningResponse.planning
    }
    
    func saveDailyPlanning(date: Date, plannedSteps: [String]) async throws -> DailyPlanning {
        guard let url = URL(string: "\(baseURL)/cesta/daily-planning") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        
        let requestBody: [String: Any] = [
            "date": dateString,
            "planned_steps": plannedSteps
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        // Debug: Print request body
        if let requestBodyString = String(data: request.httpBody!, encoding: .utf8) {
            print("✅ Request body for daily planning: \(requestBodyString)")
        }
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        print("✅ API response status for daily planning: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            print("❌ API request failed with status: \(httpResponse.statusCode)")
            if let errorData = String(data: data, encoding: .utf8) {
                print("❌ Error response: \(errorData)")
            }
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        // Debug: Print raw response
        if let rawResponse = String(data: data, encoding: .utf8) {
            print("✅ Raw API response for daily planning: \(rawResponse)")
        }
        
        let dailyPlanningResponse = try createJSONDecoder().decode(DailyPlanningResponse.self, from: data)
        return dailyPlanningResponse.planning
    }
}
