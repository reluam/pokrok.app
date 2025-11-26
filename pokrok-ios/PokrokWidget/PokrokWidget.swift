import WidgetKit
import SwiftUI
import AppIntents

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
}

struct Provider: AppIntentTimelineProvider {
    typealias Entry = SimpleEntry
    typealias Intent = SelectWidgetTypeIntent
    
    // Cache pro data
    private static var cachedSteps: [DailyStep] = []
    private static var cachedHabits: [Habit] = []
    private static var lastCacheUpdate: Date = Date.distantPast
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            widgetType: .todaySteps,
            todaySteps: [],
            futureSteps: [],
            todayHabits: [],
            stepStats: (completed: 0, total: 0),
            habitStats: (completed: 0, total: 0),
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
    }

    func snapshot(for configuration: SelectWidgetTypeIntent, in context: Context) async -> SimpleEntry {
        let widgetType = configuration.widgetType.toWidgetType
        return SimpleEntry(
            date: Date(),
            widgetType: widgetType,
            todaySteps: [],
            futureSteps: [],
            todayHabits: [],
            stepStats: (completed: 0, total: 0),
            habitStats: (completed: 0, total: 0),
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
    }

    func timeline(for configuration: SelectWidgetTypeIntent, in context: Context) async -> Timeline<Entry> {
        let widgetType = configuration.widgetType.toWidgetType
        
        // First, try to load data from UserDefaults (saved by main app)
        if let (savedSteps, savedHabits, timestamp) = loadDataFromUserDefaults() {
            let dataAge = Date().timeIntervalSince(timestamp)
            // Use saved data if it's less than 24 hours old
            if dataAge < 86400 {
                Provider.cachedSteps = savedSteps
                Provider.cachedHabits = savedHabits
                Provider.lastCacheUpdate = timestamp
                return createTimelineEntry(with: savedSteps, widgetType: widgetType)
            }
        }
        
        // Use in-memory cached data if available and not too old
        let cacheAge = Date().timeIntervalSince(Provider.lastCacheUpdate)
        let shouldUseCache = (!Provider.cachedSteps.isEmpty || !Provider.cachedHabits.isEmpty) && 
                            (cacheAge < PokrokWidgetConfiguration.shared.updateInterval)
        
        if shouldUseCache {
            return createTimelineEntry(with: Provider.cachedSteps, widgetType: widgetType)
        }
        
        // Try to fetch fresh data from API
        let calendar = Calendar.current
        let today = Date()
        let startDate = calendar.date(byAdding: .day, value: -7, to: today) ?? today
        let endDate = calendar.date(byAdding: .day, value: 14, to: today) ?? today
        
        // Fetch steps and habits independently - if one fails, use cached or empty array
        async let stepsTask = APIManager.shared.fetchSteps(startDate: startDate, endDate: endDate)
        async let habitsTask = APIManager.shared.fetchHabits()
        
        var steps: [DailyStep] = Provider.cachedSteps
        var habits: [Habit] = Provider.cachedHabits
        
        // Try to fetch steps
        if let fetchedSteps = try? await stepsTask {
            steps = fetchedSteps
        } else {
            // If fetch failed, keep using cached steps (or empty if no cache)
            print("⚠️ Widget: Failed to fetch steps, using cached data")
        }
        
        // Try to fetch habits
        if let fetchedHabits = try? await habitsTask {
            habits = fetchedHabits
        } else {
            // If fetch failed, keep using cached habits (or empty if no cache)
            print("⚠️ Widget: Failed to fetch habits, using cached data")
        }
        
        // Update cache only if we got new data
        if !steps.isEmpty || !habits.isEmpty {
            Provider.cachedSteps = steps
            Provider.cachedHabits = habits
            Provider.lastCacheUpdate = Date()
        }
        
        return createTimelineEntry(with: steps, widgetType: widgetType)
    }
    
    /// Loads steps and habits from UserDefaults (saved by main app)
    private func loadDataFromUserDefaults() -> ([DailyStep], [Habit], Date)? {
        guard let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults() else {
            return nil
        }
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        // Load steps
        var steps: [DailyStep] = []
        if let stepsData = userDefaults.data(forKey: "cached_widget_steps"),
           let decodedSteps = try? decoder.decode([DailyStep].self, from: stepsData) {
            steps = decodedSteps
        }
        
        // Load habits
        var habits: [Habit] = []
        if let habitsData = userDefaults.data(forKey: "cached_widget_habits"),
           let decodedHabits = try? decoder.decode([Habit].self, from: habitsData) {
            habits = decodedHabits
        }
        
        // Load timestamp
        guard let timestamp = userDefaults.object(forKey: "cached_widget_data_timestamp") as? Date else {
            return nil
        }
        
        // Return data only if we have at least steps or habits
        if !steps.isEmpty || !habits.isEmpty {
            return (steps, habits, timestamp)
        }
        
        return nil
    }
    
    private func createTimelineEntry(with steps: [DailyStep], widgetType: WidgetType) -> Timeline<Entry> {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Filter today's steps - normalize both dates to start of day for comparison
        let todaySteps = steps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            return calendar.isDate(stepStartOfDay, inSameDayAs: today)
        }
        
        // Filter future steps
        let futureSteps = steps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            return stepStartOfDay > today && !step.completed
        }
        
        // Calculate step stats
        let stepStats = (
            completed: todaySteps.filter { $0.completed }.count,
            total: todaySteps.count
        )
        
        // Use cached habits
        let todayHabits = filterTodayHabits(Provider.cachedHabits)
        // For progress calculation, only count habits scheduled for today (not always_show unless scheduled)
        let habitsForProgress = filterHabitsForProgress(Provider.cachedHabits)
        let habitStats = (
            completed: habitsForProgress.filter { isHabitCompleted($0) }.count,
            total: habitsForProgress.count
        )
        
        let entry = SimpleEntry(
            date: Date(),
            widgetType: widgetType,
            todaySteps: todaySteps,
            futureSteps: futureSteps,
            todayHabits: todayHabits,
            stepStats: stepStats,
            habitStats: habitStats,
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
    
    private func filterTodayHabits(_ habits: [Habit]) -> [Habit] {
        let weekday = Calendar.current.component(.weekday, from: Date())
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        let todayCsName = csDayNames[weekday].lowercased()
        let todayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            if habit.alwaysShow {
                return true
            }
            
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(todayCsName) || normalizedSelectedDays.contains(todayEnName)
                }
                return false
            default:
                return false
            }
        }
    }
    
    // Filter habits for progress calculation - only habits actually scheduled for today
    // Always_show habits are only counted if they are also scheduled for today
    private func filterHabitsForProgress(_ habits: [Habit]) -> [Habit] {
        let weekday = Calendar.current.component(.weekday, from: Date())
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        let todayCsName = csDayNames[weekday].lowercased()
        let todayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            // Check if scheduled for today
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(todayCsName) || normalizedSelectedDays.contains(todayEnName)
                }
                return false
            default:
                return false
            }
            // Always_show habits are NOT counted unless they are also scheduled for today
        }
    }
    
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        return habit.habitCompletions?[todayStr] == true
    }
    
    private func getWidgetTypeFromUserDefaults() -> WidgetType {
        guard let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults(),
              let widgetTypeString = userDefaults.string(forKey: "selected_widget_type") else {
            return .todaySteps
        }
        
        return WidgetType(rawValue: widgetTypeString) ?? .todaySteps
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let widgetType: WidgetType
    let todaySteps: [DailyStep]
    let futureSteps: [DailyStep]
    let todayHabits: [Habit]
    let stepStats: (completed: Int, total: Int)
    let habitStats: (completed: Int, total: Int)
    let inspiration: (String, String, String)
}

struct PokrokWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        // For systemLarge, always show overview
        if family == .systemLarge {
            OverviewWidgetView(entry: entry, family: family)
        } else if family == .systemMedium {
            // For systemMedium, only show steps or habits
            switch entry.widgetType {
            case .todaySteps, .futureSteps:
                TodayStepsWidgetView(entry: entry, family: family)
            case .todayHabits:
                TodayHabitsWidgetView(entry: entry, family: family)
            case .inspiration:
                // For medium, default to steps if inspiration is selected
                TodayStepsWidgetView(entry: entry, family: family)
            }
        } else {
            // For systemSmall, use the configured widget type
            switch entry.widgetType {
            case .todaySteps:
                TodayStepsWidgetView(entry: entry, family: family)
            case .todayHabits:
                TodayHabitsWidgetView(entry: entry, family: family)
            case .futureSteps:
                FutureStepsWidgetView(entry: entry, family: family)
            case .inspiration:
                InspirationWidgetView(entry: entry, family: family)
            }
        }
    }
}

struct PokrokWidget: Widget {
    let kind: String = "PokrokWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SelectWidgetTypeIntent.self, provider: Provider()) { entry in
            PokrokWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Pokrok")
        .description("Sledujte své kroky, návyky a najděte inspiraci")
        .supportedFamilies([.systemLarge, .systemMedium, .systemSmall])
    }
}

#Preview(as: .systemSmall) {
    PokrokWidget()
} timeline: {
    SimpleEntry(
        date: Date(),
        widgetType: .todaySteps,
        todaySteps: [
            DailyStep(id: "1", title: "Ukol 1", description: nil, date: Date(), completed: false, goalId: nil, createdAt: nil, updatedAt: nil),
            DailyStep(id: "2", title: "Ukol 2", description: nil, date: Date(), completed: false, goalId: nil, createdAt: nil, updatedAt: nil)
        ],
        futureSteps: [],
        todayHabits: [],
        stepStats: (completed: 0, total: 2),
        habitStats: (completed: 0, total: 0),
        inspiration: ("☕", "Dejte si kávu", "Relaxace")
    )
}