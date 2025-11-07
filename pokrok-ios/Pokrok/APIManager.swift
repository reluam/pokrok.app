import Foundation
import Clerk

class APIManager: ObservableObject {
    static let shared = APIManager()
    
    private let baseURL = "https://www.pokrok.app/api"
    
    private init() {}
    
    // MARK: - JSON Decoder Helper
    
    private func createJSONDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        
        // Custom date decoding strategy that handles both ISO8601 and YYYY-MM-DD formats
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 format first (with time)
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
            
            // Try YYYY-MM-DD format (date only)
            let dateOnlyFormatter = DateFormatter()
            dateOnlyFormatter.dateFormat = "yyyy-MM-dd"
            dateOnlyFormatter.timeZone = TimeZone(abbreviation: "UTC")
            if let date = dateOnlyFormatter.date(from: dateString) {
                return date
            }
            
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Expected date string to be ISO8601 or YYYY-MM-DD formatted, but got: \(dateString)")
        }
        
        return decoder
    }
    
    // MARK: - Goals API
    
    func fetchGoals() async throws -> [Goal] {
        // First, get userId from user endpoint
        let user = try await fetchUser()
        
        guard var urlComponents = URLComponents(string: "\(baseURL)/goals") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "userId", value: user.id)
        ]
        
        guard let url = urlComponents.url else {
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
            throw APIError.requestFailed
        }
        
        // Parse response - API returns array directly, not wrapped
        let decoder = createJSONDecoder()
        let goals = try decoder.decode([Goal].self, from: data)
        return goals
    }
    
    func createGoal(_ goal: CreateGoalRequest) async throws -> Goal {
        // First, get userId from user endpoint
        let user = try await fetchUser()
        
        guard let url = URL(string: "\(baseURL)/goals") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create request body with userId
        var requestBody: [String: Any] = [
            "userId": user.id,
            "title": goal.title,
            "priority": goal.priority
        ]
        
        if let description = goal.description {
            requestBody["description"] = description
        }
        
        if let targetDate = goal.targetDate {
            requestBody["targetDate"] = ISO8601DateFormatter().string(from: targetDate)
        }
        
        if let icon = goal.icon {
            requestBody["icon"] = icon
        }
        
        if let aspirationId = goal.aspirationId {
            requestBody["aspirationId"] = aspirationId
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns goal directly, not wrapped
        let decoder = createJSONDecoder()
        let createdGoal = try decoder.decode(Goal.self, from: data)
        return createdGoal
    }
    
    func updateGoal(goalId: String, title: String?, description: String?, targetDate: Date?, aspirationId: String?) async throws -> Goal {
        guard let url = URL(string: "\(baseURL)/goals") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create request body
        var requestBody: [String: Any] = [
            "goalId": goalId
        ]
        
        if let title = title {
            requestBody["title"] = title
        }
        
        if let description = description {
            requestBody["description"] = description
        }
        
        if let targetDate = targetDate {
            requestBody["target_date"] = ISO8601DateFormatter().string(from: targetDate)
        }
        
        if let aspirationId = aspirationId {
            requestBody["aspirationId"] = aspirationId
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns goal directly, not wrapped
        let decoder = createJSONDecoder()
        let updatedGoal = try decoder.decode(Goal.self, from: data)
        return updatedGoal
    }
    
    // MARK: - Steps API
    
    func fetchSteps() async throws -> [DailyStep] {
        // First, get userId from user endpoint
        let user = try await fetchUser()
        
        guard var urlComponents = URLComponents(string: "\(baseURL)/daily-steps") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "userId", value: user.id)
        ]
        
        guard let url = urlComponents.url else {
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
            throw APIError.requestFailed
        }
        
        // Parse response - API returns array directly, not wrapped
        let decoder = createJSONDecoder()
        let steps = try decoder.decode([DailyStep].self, from: data)
        return steps
    }
    
    func fetchStepsForDate(date: Date) async throws -> [DailyStep] {
        // First, get userId from user endpoint
        let user = try await fetchUser()
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: date)
        
        guard var urlComponents = URLComponents(string: "\(baseURL)/daily-steps") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "userId", value: user.id),
            URLQueryItem(name: "date", value: dateString)
        ]
        
        guard let url = urlComponents.url else {
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
            throw APIError.requestFailed
        }
        
        // Check if data is empty
        if data.isEmpty {
            return []
        }
        
        // Parse response - API returns array directly, not wrapped
        let decoder = createJSONDecoder()
        
        do {
            let steps = try decoder.decode([DailyStep].self, from: data)
            return steps
        } catch {
            // Try to decode as error response
            if let errorResponse = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            }
            throw error
        }
    }
    
    func createStep(_ step: CreateStepRequest) async throws -> DailyStep {
        // First, get userId from user endpoint
        let user = try await fetchUser()
        
        guard let url = URL(string: "\(baseURL)/daily-steps") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Format date as YYYY-MM-DD string (API expects this format)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: step.date)
        
        // Create request body with userId
        var requestBody: [String: Any] = [
            "userId": user.id,
            "title": step.title,
            "date": dateString
        ]
        
        if let description = step.description {
            requestBody["description"] = description
        }
        
        if let goalId = step.goalId {
            requestBody["goalId"] = goalId
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        print("📤 createStep: Sending request with body: \(String(data: jsonData, encoding: .utf8) ?? "nil")")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ createStep failed with status \(httpResponse.statusCode): \(errorMessage)")
            if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                print("❌ Error details: \(errorData)")
            }
            throw APIError.requestFailed
        }
        
        // Check if data is empty
        if data.isEmpty {
            print("❌ createStep: Empty response from API")
            throw APIError.requestFailed
        }
        
        // Log raw response for debugging
        if let responseString = String(data: data, encoding: .utf8) {
            print("📥 createStep: Raw response: \(responseString.prefix(500))")
        }
        
        // Parse response - API returns step directly, not wrapped
        let decoder = createJSONDecoder()
        
        do {
            let createdStep = try decoder.decode(DailyStep.self, from: data)
            print("✅ createStep: Successfully created step with id: \(createdStep.id)")
            return createdStep
        } catch {
            print("❌ createStep: Failed to decode response: \(error.localizedDescription)")
            if let errorResponse = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                print("❌ Error response: \(errorResponse)")
            }
            throw error
        }
    }
    
    func updateStepCompletion(stepId: String, completed: Bool, currentStep: DailyStep) async throws -> DailyStep {
        guard let url = URL(string: "\(baseURL)/daily-steps") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Send stepId and completed status
        let updateData: [String: Any] = [
            "stepId": stepId,
            "completed": completed
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: updateData)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns step directly, not wrapped
        let decoder = createJSONDecoder()
        let updatedStep = try decoder.decode(DailyStep.self, from: data)
        return updatedStep
    }
    
    // MARK: - User API
    
    func fetchUser() async throws -> User {
        // Get Clerk user ID from session
        guard let session = await MainActor.run(body: { Clerk.shared.session }) else {
            throw APIError.requestFailed
        }
        
        guard let clerkUserId = session.user?.id else {
            throw APIError.requestFailed
        }
        
        guard var urlComponents = URLComponents(string: "\(baseURL)/user") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "clerkId", value: clerkUserId)
        ]
        
        guard let url = urlComponents.url else {
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
            throw APIError.requestFailed
        }
        
        let user = try createJSONDecoder().decode(User.self, from: data)
        return user
    }
    
    // MARK: - Habits API
    
    func fetchHabits() async throws -> [Habit] {
        guard let url = URL(string: "\(baseURL)/habits") else {
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
            throw APIError.requestFailed
        }
        
        // Try direct decoding first (PostgreSQL returns JSONB as object, not string)
        let decoder = createJSONDecoder()
        
        do {
            // Try direct decoding - PostgreSQL JSONB should decode directly
            let habits = try decoder.decode([Habit].self, from: data)
            return habits
        } catch let decodingError {
            // If direct decoding fails, try manual parsing
            // Handle habit_completions as JSON dictionary
            guard let habitsArray = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
                // If parsing fails completely, throw the original decoding error
                throw decodingError
            }
            
            var decodedHabits: [Habit] = []
            for habitDict in habitsArray {
                var mutableHabitDict = habitDict
                
                // Parse habit_completions - could be string, dict, or nil
                if let completionsString = mutableHabitDict["habit_completions"] as? String,
                   let completionsData = completionsString.data(using: .utf8),
                   let completionsDict = try? JSONSerialization.jsonObject(with: completionsData) as? [String: Bool] {
                    mutableHabitDict["habit_completions"] = completionsDict
                } else if let completionsDict = mutableHabitDict["habit_completions"] as? [String: Bool] {
                    // Already a dictionary, keep it
                    mutableHabitDict["habit_completions"] = completionsDict
                } else if let completionsDict = mutableHabitDict["habit_completions"] as? [String: Any] {
                    // Could be [String: Any] with mixed types, convert to [String: Bool]
                    let boolDict = completionsDict.compactMapValues { value in
                        if let boolValue = value as? Bool {
                            return boolValue
                        } else if let intValue = value as? Int {
                            return intValue != 0
                        }
                        return nil
                    }
                    mutableHabitDict["habit_completions"] = boolDict
                } else if mutableHabitDict["habit_completions"] == nil || mutableHabitDict["habit_completions"] is NSNull {
                    // Set to empty dictionary if nil or NSNull
                    mutableHabitDict["habit_completions"] = [String: Bool]()
                }
                
                // Re-encode to Data for proper decoding
                do {
                    let habitData = try JSONSerialization.data(withJSONObject: mutableHabitDict)
                    let habit = try decoder.decode(Habit.self, from: habitData)
                    decodedHabits.append(habit)
                } catch {
                    // Skip this habit if it can't be decoded
                    continue
                }
            }
            return decodedHabits
        }
    }
    
    func toggleHabitCompletion(habitId: String, date: String) async throws -> Habit {
        guard let url = URL(string: "\(baseURL)/habits/toggle") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let requestData: [String: Any] = [
            "habitId": habitId,
            "date": date
        ]
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestData)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        // Handle habit_completions similar to fetchHabits
        let decoder = createJSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        if let habitDict = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
            var mutableHabitDict = habitDict
            // Parse habit_completions if it's a string (JSON)
            if let completionsString = mutableHabitDict["habit_completions"] as? String,
               let completionsData = completionsString.data(using: .utf8),
               let completionsDict = try? JSONSerialization.jsonObject(with: completionsData) as? [String: Bool] {
                mutableHabitDict["habit_completions"] = completionsDict
            } else if let completionsDict = mutableHabitDict["habit_completions"] as? [String: Bool] {
                // Already a dictionary, keep it
                mutableHabitDict["habit_completions"] = completionsDict
            } else if mutableHabitDict["habit_completions"] == nil {
                // Set to empty dictionary if nil
                mutableHabitDict["habit_completions"] = [String: Bool]()
            }
            // Re-encode to Data for proper decoding
            let habitData = try JSONSerialization.data(withJSONObject: mutableHabitDict)
            let habit = try decoder.decode(Habit.self, from: habitData)
            return habit
        } else {
            // Fallback to direct decoding
            let habit = try decoder.decode(Habit.self, from: data)
            return habit
        }
    }
    
    // MARK: - Aspirations API
    
    func fetchAspirations() async throws -> [Aspiration] {
        guard let url = URL(string: "\(baseURL)/aspirations") else {
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
            if let errorData = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMessage = errorData["error"] as? String {
                print("❌ Error fetching aspirations: \(errorMessage)")
            } else {
                print("❌ Error fetching aspirations: HTTP \(httpResponse.statusCode)")
            }
            throw APIError.requestFailed
        }
        
        // Parse response - API returns array directly, not wrapped
        let decoder = createJSONDecoder()
        let aspirations = try decoder.decode([Aspiration].self, from: data)
        return aspirations
    }
    
    func createAspiration(_ aspiration: CreateAspirationRequest) async throws -> Aspiration {
        guard let url = URL(string: "\(baseURL)/aspirations") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create request body
        var requestBody: [String: Any] = [
            "title": aspiration.title
        ]
        
        if let description = aspiration.description {
            requestBody["description"] = description
        }
        
        if let color = aspiration.color {
            requestBody["color"] = color
        }
        
        if let icon = aspiration.icon {
            requestBody["icon"] = icon
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns aspiration directly, not wrapped
        let decoder = createJSONDecoder()
        let createdAspiration = try decoder.decode(Aspiration.self, from: data)
        return createdAspiration
    }
    
    func updateAspiration(aspirationId: String, title: String?, description: String?, color: String?, icon: String?) async throws -> Aspiration {
        guard let url = URL(string: "\(baseURL)/aspirations") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create request body
        var requestBody: [String: Any] = [
            "aspirationId": aspirationId
        ]
        
        if let title = title {
            requestBody["title"] = title
        }
        
        if let description = description {
            requestBody["description"] = description
        }
        
        if let color = color {
            requestBody["color"] = color
        }
        
        if let icon = icon {
            requestBody["icon"] = icon
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns aspiration directly, not wrapped
        let decoder = createJSONDecoder()
        let updatedAspiration = try decoder.decode(Aspiration.self, from: data)
        return updatedAspiration
    }
    
    func deleteAspiration(aspirationId: String) async throws {
        guard var urlComponents = URLComponents(string: "\(baseURL)/aspirations") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "aspirationId", value: aspirationId)
        ]
        
        guard let url = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
            throw APIError.requestFailed
        }
    }
    
    func fetchAspirationBalance(aspirationId: String) async throws -> AspirationBalance {
        guard var urlComponents = URLComponents(string: "\(baseURL)/aspirations/balance") else {
            throw APIError.invalidURL
        }
        
        urlComponents.queryItems = [
            URLQueryItem(name: "aspirationId", value: aspirationId)
        ]
        
        guard let url = urlComponents.url else {
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
            throw APIError.requestFailed
        }
        
        // Parse response - API returns balance directly, not wrapped
        let decoder = createJSONDecoder()
        let balance = try decoder.decode(AspirationBalance.self, from: data)
        return balance
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
        do {
            guard let session = await MainActor.run(body: { Clerk.shared.session }) else {
                return nil
            }
            
            let tokenResource = try await session.getToken()
            guard let token = tokenResource else {
                return nil
            }
            
            // Get the actual JWT token from TokenResource
            let jwtToken = token.jwt
            
            // Save token to App Group for widget access
            saveTokenToAppGroup(jwtToken)
            
            return jwtToken
        } catch {
            return nil
        }
    }
    
    // MARK: - Token Management for Widget
    
    func refreshTokenForWidget() async {
        _ = await getClerkToken()
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
        if let userDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrok") {
            // Save as fresh token first, then move to main position
            userDefaults.set(token, forKey: "fresh_auth_token")
            userDefaults.set(token, forKey: "auth_token")
            userDefaults.synchronize()
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
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.serverError(httpResponse.statusCode)
        }
        
        let dailyPlanningResponse = try createJSONDecoder().decode(DailyPlanningResponse.self, from: data)
        return dailyPlanningResponse.planning
    }
    
    func updateHabit(habitId: String, name: String?, description: String?, frequency: String?, reminderTime: String?, selectedDays: [String]?, alwaysShow: Bool?, xpReward: Int?, aspirationId: String?) async throws -> Habit {
        guard let url = URL(string: "\(baseURL)/habits") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add Clerk token if available
        if let token = await getClerkToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Create request body
        var requestBody: [String: Any] = [
            "habitId": habitId
        ]
        
        if let name = name {
            requestBody["name"] = name
        }
        
        if let description = description {
            requestBody["description"] = description
        }
        
        if let frequency = frequency {
            requestBody["frequency"] = frequency
        }
        
        if let reminderTime = reminderTime {
            requestBody["reminderTime"] = reminderTime
        }
        
        if let selectedDays = selectedDays {
            requestBody["selectedDays"] = selectedDays
        }
        
        if let alwaysShow = alwaysShow {
            requestBody["alwaysShow"] = alwaysShow
        }
        
        if let xpReward = xpReward {
            requestBody["xpReward"] = xpReward
        }
        
        if let aspirationId = aspirationId {
            requestBody["aspirationId"] = aspirationId
        }
        
        let jsonData = try JSONSerialization.data(withJSONObject: requestBody)
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.requestFailed
        }
        
        guard httpResponse.statusCode == 200 else {
            throw APIError.requestFailed
        }
        
        // Parse response - API returns habit directly, not wrapped
        let decoder = createJSONDecoder()
        
        // Handle habit_completions similar to fetchHabits
        if let habitDict = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
            var mutableHabitDict = habitDict
            // Parse habit_completions if it's a string (JSON)
            if let completionsString = mutableHabitDict["habit_completions"] as? String,
               let completionsData = completionsString.data(using: .utf8),
               let completionsDict = try? JSONSerialization.jsonObject(with: completionsData) as? [String: Bool] {
                mutableHabitDict["habit_completions"] = completionsDict
            } else if let completionsDict = mutableHabitDict["habit_completions"] as? [String: Bool] {
                // Already a dictionary, keep it
                mutableHabitDict["habit_completions"] = completionsDict
            } else if mutableHabitDict["habit_completions"] == nil {
                // Set to empty dictionary if nil
                mutableHabitDict["habit_completions"] = [String: Bool]()
            }
            
            let updatedData = try JSONSerialization.data(withJSONObject: mutableHabitDict)
            let updatedHabit = try decoder.decode(Habit.self, from: updatedData)
            return updatedHabit
        } else {
            let updatedHabit = try decoder.decode(Habit.self, from: data)
            return updatedHabit
        }
    }
}
