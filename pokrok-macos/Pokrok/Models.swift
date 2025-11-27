import Foundation

// MARK: - Game Types

enum GamePhase: String, Codable {
    case intro
    case playerSetup = "player-setup"
    case goalsSetup = "goals-setup"
    case habitsSetup = "habits-setup"
    case playing
    case menu
}

// MARK: - Player

struct Player: Codable, Identifiable {
    let id: String
    var name: String
    var gender: Gender
    var avatar: String
    var appearance: PlayerAppearance
    var level: Int
    var experience: Int
    var createdAt: Date
    
    enum Gender: String, Codable {
        case male, female, other
    }
}

struct PlayerAppearance: Codable {
    var hairColor: String
    var skinColor: String
    var eyeColor: String
}

// MARK: - Goal

struct Goal: Codable, Identifiable {
    let id: String
    var userId: String?
    var title: String
    var description: String?
    var targetDate: Date?
    var status: String
    var priority: String?
    var category: String?
    var color: String?
    var icon: String?
    var createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case targetDate = "target_date"
        case status
        case priority
        case category
        case color
        case icon
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Habit

struct Habit: Codable, Identifiable {
    let id: String
    var userId: String?
    var name: String
    var description: String?
    var frequency: String?
    var selectedDays: [String]?
    var streak: Int?
    var maxStreak: Int?
    var lastCompleted: Date?
    var category: String?
    var difficulty: String?
    var isCustom: Bool?
    var color: String?
    var icon: String?
    var completedToday: Bool?
    var habitCompletions: [String: Bool]?
    var createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case description
        case frequency
        case selectedDays = "selected_days"
        case streak
        case maxStreak = "max_streak"
        case lastCompleted = "last_completed"
        case category
        case difficulty
        case isCustom = "is_custom"
        case color
        case icon
        case completedToday = "completed_today"
        case habitCompletions = "habit_completions"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Daily Stats

struct DailyStats: Codable {
    var energy: Int
    var mood: Int
    var focus: Int
    var date: String
    var completedTasks: Int
    var habitsCompleted: Int
}

// MARK: - Enums

enum Priority: String, Codable {
    case low
    case medium
    case high
}

enum Frequency: String, Codable {
    case daily
    case weekly
    case custom
}

enum Difficulty: String, Codable {
    case easy
    case medium
    case hard
}

// MARK: - Game Task

struct GameTask: Codable, Identifiable {
    let id: String
    var title: String
    var description: String?
    var category: String?
    var priority: Priority?
    var energyCost: Int?
    var timeRequired: Int? // in minutes
    var experienceReward: Int?
    var completed: Bool
    var completedAt: Date?
    var createdAt: Date?
}

// MARK: - Achievement

struct Achievement: Codable, Identifiable {
    let id: String
    var title: String
    var description: String
    var icon: String
    var category: String
    var unlocked: Bool
    var unlockedAt: Date?
    var progress: Int
    var maxProgress: Int
}

// MARK: - Step (for goals)

struct ChecklistItem: Codable, Identifiable {
    let id: String
    var title: String
    var completed: Bool
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case completed
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        // Try both "completed" and handle potential type mismatches
        if let boolValue = try? container.decode(Bool.self, forKey: .completed) {
            completed = boolValue
        } else if let intValue = try? container.decode(Int.self, forKey: .completed) {
            completed = intValue != 0
        } else {
            completed = false
        }
    }
    
    init(id: String, title: String, completed: Bool) {
        self.id = id
        self.title = title
        self.completed = completed
    }
}

struct Step: Codable, Identifiable {
    let id: String
    var userId: String?
    var goalId: String?
    var title: String
    var description: String?
    var completed: Bool
    var completedAt: Date?
    var date: Date?
    var isImportant: Bool?
    var isUrgent: Bool?
    var createdAt: Date?
    var aspirationId: String?
    var deadline: Date?
    var metricId: String?
    var areaId: String?
    var estimatedTime: Int?
    var xpReward: Int?
    var checklist: [ChecklistItem]?
    
    var isCompleted: Bool { completed }
    var scheduledDate: Date? { date }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case goalId = "goal_id"
        case title
        case description
        case completed
        case completedAt = "completed_at"
        case date
        case isImportant = "is_important"
        case isUrgent = "is_urgent"
        case createdAt = "created_at"
        case aspirationId = "aspiration_id"
        case deadline
        case metricId = "metric_id"
        case areaId = "area_id"
        case estimatedTime = "estimated_time"
        case xpReward = "xp_reward"
        case checklist
    }
}

// MARK: - Habit Completion

struct HabitCompletion: Codable, Identifiable {
    let id: String
    var habitId: String
    var completedAt: Date
    var date: String
}

// MARK: - API Response Types

struct GameInitResponse: Codable {
    let user: UserData
    let player: Player?
    let goals: [Goal]
    let habits: [Habit]
    let steps: [Step]?
}

struct UserData: Codable {
    let id: String
    let clerkUserId: String
    let email: String
    let name: String?
    let hasCompletedOnboarding: Bool?
    let preferredLocale: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case clerkUserId = "clerk_user_id"
        case email
        case name
        case hasCompletedOnboarding = "has_completed_onboarding"
        case preferredLocale = "preferred_locale"
    }
}

// MARK: - User Settings

struct UserSettings: Codable {
    var soundEnabled: Bool
    var musicEnabled: Bool
    var notificationsEnabled: Bool
    var difficulty: String
    var language: String
}

