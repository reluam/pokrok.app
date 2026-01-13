import Foundation

/// Manages local caching of app data to reduce API calls
class LocalCacheManager {
    static let shared = LocalCacheManager()
    
    private let cacheDirectory: URL
    private let fileManager = FileManager.default
    
    // JSON Decoder with same strategy as APIManager
    private lazy var jsonDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
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
    }()
    
    // JSON Encoder
    private lazy var jsonEncoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()
    
    // Cache file paths
    private var stepsCacheURL: URL { cacheDirectory.appendingPathComponent("steps.json") }
    private var habitsCacheURL: URL { cacheDirectory.appendingPathComponent("habits.json") }
    private var goalsCacheURL: URL { cacheDirectory.appendingPathComponent("goals.json") }
    private var aspirationsCacheURL: URL { cacheDirectory.appendingPathComponent("aspirations.json") }
    private var lastSyncURL: URL { cacheDirectory.appendingPathComponent("lastSync.json") }
    
    // In-memory cache for quick access
    private var cachedSteps: [DailyStep]?
    private var cachedHabits: [Habit]?
    private var cachedGoals: [Goal]?
    private var cachedAspirations: [Aspiration]?
    
    // Last sync timestamps
    private var lastSync: [String: Date] = [:]
    
    private init() {
        // Create cache directory in app's documents
        let documentsPath = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        cacheDirectory = documentsPath.appendingPathComponent("PokrokCache")
        
        // Create directory if it doesn't exist
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        }
        
        // Load last sync timestamps
        loadLastSync()
    }
    
    // MARK: - Last Sync Management
    
    private func loadLastSync() {
        guard let data = try? Data(contentsOf: lastSyncURL),
              let sync = try? jsonDecoder.decode([String: Date].self, from: data) else {
            lastSync = [:]
            return
        }
        lastSync = sync
    }
    
    private func saveLastSync() {
        guard let data = try? jsonEncoder.encode(lastSync) else { return }
        try? data.write(to: lastSyncURL)
    }
    
    func getLastSync(for key: String) -> Date? {
        return lastSync[key]
    }
    
    func updateLastSync(for key: String, date: Date = Date()) {
        lastSync[key] = date
        saveLastSync()
    }
    
    // MARK: - Steps Cache
    
    func saveSteps(_ steps: [DailyStep]) {
        cachedSteps = steps
        saveToFile(steps, url: stepsCacheURL)
        updateLastSync(for: "steps")
    }
    
    func loadSteps() -> [DailyStep]? {
        if let cached = cachedSteps {
            return cached
        }
        
        guard let data = try? Data(contentsOf: stepsCacheURL),
              let steps = try? jsonDecoder.decode([DailyStep].self, from: data) else {
            return nil
        }
        
        cachedSteps = steps
        return steps
    }
    
    func updateStep(_ step: DailyStep) {
        var steps = loadSteps() ?? []
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            steps[index] = step
        } else {
            steps.append(step)
        }
        saveSteps(steps)
    }
    
    func deleteStep(_ stepId: String) {
        var steps = loadSteps() ?? []
        steps.removeAll { $0.id == stepId }
        saveSteps(steps)
    }
    
    // MARK: - Habits Cache
    
    func saveHabits(_ habits: [Habit]) {
        cachedHabits = habits
        saveToFile(habits, url: habitsCacheURL)
        updateLastSync(for: "habits")
    }
    
    func loadHabits() -> [Habit]? {
        if let cached = cachedHabits {
            return cached
        }
        
        guard let data = try? Data(contentsOf: habitsCacheURL),
              let habits = try? jsonDecoder.decode([Habit].self, from: data) else {
            return nil
        }
        
        cachedHabits = habits
        return habits
    }
    
    func updateHabit(_ habit: Habit) {
        var habits = loadHabits() ?? []
        if let index = habits.firstIndex(where: { $0.id == habit.id }) {
            habits[index] = habit
        } else {
            habits.append(habit)
        }
        saveHabits(habits)
    }
    
    func deleteHabit(_ habitId: String) {
        var habits = loadHabits() ?? []
        habits.removeAll { $0.id == habitId }
        saveHabits(habits)
    }
    
    // MARK: - Goals Cache
    
    func saveGoals(_ goals: [Goal]) {
        cachedGoals = goals
        saveToFile(goals, url: goalsCacheURL)
        updateLastSync(for: "goals")
    }
    
    func loadGoals() -> [Goal]? {
        if let cached = cachedGoals {
            return cached
        }
        
        guard let data = try? Data(contentsOf: goalsCacheURL),
              let goals = try? jsonDecoder.decode([Goal].self, from: data) else {
            return nil
        }
        
        cachedGoals = goals
        return goals
    }
    
    func updateGoal(_ goal: Goal) {
        var goals = loadGoals() ?? []
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            goals[index] = goal
        } else {
            goals.append(goal)
        }
        saveGoals(goals)
    }
    
    func deleteGoal(_ goalId: String) {
        var goals = loadGoals() ?? []
        goals.removeAll { $0.id == goalId }
        saveGoals(goals)
    }
    
    // MARK: - Aspirations Cache
    
    func saveAspirations(_ aspirations: [Aspiration]) {
        cachedAspirations = aspirations
        saveToFile(aspirations, url: aspirationsCacheURL)
        updateLastSync(for: "aspirations")
    }
    
    func loadAspirations() -> [Aspiration]? {
        if let cached = cachedAspirations {
            return cached
        }
        
        guard let data = try? Data(contentsOf: aspirationsCacheURL),
              let aspirations = try? jsonDecoder.decode([Aspiration].self, from: data) else {
            return nil
        }
        
        cachedAspirations = aspirations
        return aspirations
    }
    
    func updateAspiration(_ aspiration: Aspiration) {
        var aspirations = loadAspirations() ?? []
        if let index = aspirations.firstIndex(where: { $0.id == aspiration.id }) {
            aspirations[index] = aspiration
        } else {
            aspirations.append(aspiration)
        }
        saveAspirations(aspirations)
    }
    
    func deleteAspiration(_ aspirationId: String) {
        var aspirations = loadAspirations() ?? []
        aspirations.removeAll { $0.id == aspirationId }
        saveAspirations(aspirations)
    }
    
    // MARK: - Helper Methods
    
    private func saveToFile<T: Codable>(_ items: T, url: URL) {
        guard let data = try? jsonEncoder.encode(items) else { return }
        try? data.write(to: url)
    }
    
    // MARK: - Cache Invalidation
    
    func clearCache() {
        cachedSteps = nil
        cachedHabits = nil
        cachedGoals = nil
        cachedAspirations = nil
        lastSync = [:]
        
        try? fileManager.removeItem(at: stepsCacheURL)
        try? fileManager.removeItem(at: habitsCacheURL)
        try? fileManager.removeItem(at: goalsCacheURL)
        try? fileManager.removeItem(at: aspirationsCacheURL)
        try? fileManager.removeItem(at: lastSyncURL)
    }
    
    func clearCache(for key: String) {
        switch key {
        case "steps":
            cachedSteps = nil
            try? fileManager.removeItem(at: stepsCacheURL)
        case "habits":
            cachedHabits = nil
            try? fileManager.removeItem(at: habitsCacheURL)
        case "goals":
            cachedGoals = nil
            try? fileManager.removeItem(at: goalsCacheURL)
        case "aspirations":
            cachedAspirations = nil
            try? fileManager.removeItem(at: aspirationsCacheURL)
        default:
            break
        }
    }
}

