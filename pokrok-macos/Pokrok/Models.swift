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
    var title: String
    var description: String?
    var deadline: Date?
    var category: String
    var priority: Priority
    var status: GoalStatus
    var createdAt: Date
    var completedAt: Date?
    
    enum Priority: String, Codable {
        case low, medium, high
    }
    
    enum GoalStatus: String, Codable {
        case active, completed, paused
    }
}

// MARK: - Habit

struct Habit: Codable, Identifiable {
    let id: String
    var name: String
    var description: String
    var frequency: Frequency
    var streak: Int
    var maxStreak: Int
    var lastCompleted: Date?
    var category: String
    var difficulty: Difficulty
    var isCustom: Bool
    var createdAt: Date
    
    enum Frequency: String, Codable {
        case daily, weekly, monthly
    }
    
    enum Difficulty: String, Codable {
        case easy, medium, hard
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

// MARK: - Game Task

struct GameTask: Codable, Identifiable {
    let id: String
    var title: String
    var description: String
    var category: String
    var priority: Goal.Priority
    var energyCost: Int
    var timeRequired: Int // in minutes
    var experienceReward: Int
    var completed: Bool
    var completedAt: Date?
    var createdAt: Date
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

struct Step: Codable, Identifiable {
    let id: String
    var goalId: String
    var title: String
    var description: String?
    var isCompleted: Bool
    var order: Int
    var dueDate: Date?
    var scheduledDate: Date?
    var createdAt: Date
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
}

struct UserData: Codable {
    let id: String
    let clerkId: String
    let email: String
    let firstName: String?
    let lastName: String?
}

// MARK: - User Settings

struct UserSettings: Codable {
    var soundEnabled: Bool
    var musicEnabled: Bool
    var notificationsEnabled: Bool
    var difficulty: String
    var language: String
}

