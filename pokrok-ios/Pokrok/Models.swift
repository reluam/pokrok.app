import Foundation
import SwiftUI

// MARK: - Widget Type
enum WidgetType: String, CaseIterable {
    case todaySteps = "today_steps"
    case futureSteps = "future_steps"
    case todayHabits = "today_habits"
    case inspiration = "inspiration"
    
    var displayName: String {
        switch self {
        case .todaySteps:
            return "Dnešní kroky"
        case .futureSteps:
            return "Dnešní a budoucí"
        case .todayHabits:
            return "Dnešní návyky"
        case .inspiration:
            return "Inspirace"
        }
    }
    
    var description: String {
        switch self {
        case .todaySteps:
            return "Zobrazuje dnešní kroky a zpožděné úkoly"
        case .futureSteps:
            return "Zobrazuje dnešní i budoucí kroky"
        case .todayHabits:
            return "Zobrazuje dnešní návyky a jejich stav"
        case .inspiration:
            return "Zobrazuje náhodné inspirace a aktivity"
        }
    }
}

// MARK: - Request Models

struct CreateGoalRequest: Codable {
    let title: String
    let description: String?
    let targetDate: Date?
    let priority: String
    let icon: String?
    let aspirationId: String?
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

struct Goal: Codable, Identifiable {
    let id: String
    let title: String
    let description: String?
    let targetDate: Date?
    let priority: String
    let status: String
    let progressPercentage: Int
    let icon: String?
    let aspirationId: String?
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
        case aspirationId = "aspiration_id"
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
    let primaryColor: String? // Hex color code (e.g. "#E8871E")
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case dailyStepsCount = "daily_steps_count"
        case workflow
        case filters
        case primaryColor = "primary_color"
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

// MARK: - User Settings Manager
// Singleton ObservableObject pro sdílení UserSettings napříč aplikací

class UserSettingsManager: ObservableObject {
    static let shared = UserSettingsManager()
    
    @Published var settings: UserSettings?
    @Published var isLoading = false
    
    private let apiManager = APIManager.shared
    
    private init() {
        // Private initializer pro singleton
    }
    
    // Primary color z UserSettings nebo default
    var primaryColor: Color {
        if let colorHex = settings?.primaryColor {
            return Color(hex: colorHex)
        }
        return Color(hex: "#E8871E") // Default oranžová
    }
    
    // Primary color hex string
    var primaryColorHex: String {
        return settings?.primaryColor ?? "#E8871E"
    }
    
    // Načíst settings z API
    func loadSettings() {
        guard !isLoading else { return }
        
        isLoading = true
        Task {
            do {
                let fetchedSettings = try await apiManager.fetchUserSettings()
                await MainActor.run {
                    self.settings = fetchedSettings
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.isLoading = false
                    print("Error loading user settings: \(error)")
                }
            }
        }
    }
    
    // Aktualizovat settings
    func updateSettings(_ newSettings: UserSettings) {
        // @Published automaticky notifikuje změny při změně settings
        settings = newSettings
    }
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

// MARK: - Habit Model
struct Habit: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let description: String?
    let frequency: String // 'daily' | 'weekly' | 'monthly' | 'custom'
    let streak: Int
    let maxStreak: Int
    let category: String?
    let difficulty: String? // 'easy' | 'medium' | 'hard'
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

// MARK: - Aspiration Model
struct Aspiration: Codable, Identifiable {
    let id: String
    let userId: String
    let title: String
    let description: String?
    let color: String
    let icon: String?
    let createdAt: Date?
    let updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case color
        case icon
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Aspiration Balance Model
struct AspirationBalance: Codable {
    let aspirationId: String
    let totalXp: Int
    let recentXp: Int // Last 90 days
    let totalCompletedSteps: Int
    let recentCompletedSteps: Int
    let totalCompletedHabits: Int
    let recentCompletedHabits: Int
    let totalPlannedSteps: Int
    let recentPlannedSteps: Int
    let totalPlannedHabits: Int
    let recentPlannedHabits: Int
    let completionRateAllTime: Double // percentage
    let completionRateRecent: Double // percentage
    let trend: String // 'positive' | 'negative' | 'neutral'
    
    enum CodingKeys: String, CodingKey {
        case aspirationId = "aspiration_id"
        case totalXp = "total_xp"
        case recentXp = "recent_xp"
        case totalCompletedSteps = "total_completed_steps"
        case recentCompletedSteps = "recent_completed_steps"
        case totalCompletedHabits = "total_completed_habits"
        case recentCompletedHabits = "recent_completed_habits"
        case totalPlannedSteps = "total_planned_steps"
        case recentPlannedSteps = "recent_planned_steps"
        case totalPlannedHabits = "total_planned_habits"
        case recentPlannedHabits = "recent_planned_habits"
        case completionRateAllTime = "completion_rate_all_time"
        case completionRateRecent = "completion_rate_recent"
        case trend
    }
}

// MARK: - Create Aspiration Request
struct CreateAspirationRequest: Codable {
    let title: String
    let description: String?
    let color: String?
    let icon: String?
}

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
