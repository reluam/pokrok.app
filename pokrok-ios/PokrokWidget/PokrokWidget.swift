import WidgetKit
import SwiftUI
import AppIntents

enum WidgetType: String, CaseIterable {
    case todaySteps = "today_steps"
    case futureSteps = "future_steps"
    case inspiration = "inspiration"
    
    var displayName: String {
        switch self {
        case .todaySteps:
            return "Dnešní kroky"
        case .futureSteps:
            return "Dnešní a budoucí"
        case .inspiration:
            return "Inspirace"
        }
    }
}

struct Provider: TimelineProvider {
    typealias Entry = SimpleEntry
    
    // Cache pro data
    private static var cachedSteps: [DailyStep] = []
    private static var lastCacheUpdate: Date = Date.distantPast
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            widgetType: .todaySteps,
            todaySteps: [],
            futureSteps: [],
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        print("🚀 Widget: getSnapshot() called")
        let widgetType = getWidgetTypeFromUserDefaults()
        print("🚀 Widget: Snapshot widget type: \(widgetType)")
        let entry = SimpleEntry(
            date: Date(),
            widgetType: widgetType,
            todaySteps: [],
            futureSteps: [],
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        print("🚀 Widget: getTimeline() called - START")
        print("🚀 Widget: Starting timeline generation...")
        
        let widgetType = getWidgetTypeFromUserDefaults()
        print("🚀 Widget: Widget type from UserDefaults: \(widgetType)")
        
        // Test App Group access
        let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults()
        print("🚀 Widget: App Group accessible: \(userDefaults != nil ? "YES" : "NO")")
        
        // Use cached data if available
        if !Provider.cachedSteps.isEmpty {
            print("🔄 Widget: Using cached data (\(Provider.cachedSteps.count) steps)")
            let timeline = createTimelineEntry(with: Provider.cachedSteps, widgetType: widgetType)
            completion(timeline)
            return
        }
        
        // If no cached data, try to fetch
        Task {
            do {
                print("🚀 Widget: Fetching steps from API...")
                let steps = try await APIManager.shared.fetchSteps()
                print("🚀 Widget: Fetched \(steps.count) steps")
                
                // Update cache
                Provider.cachedSteps = steps
                Provider.lastCacheUpdate = Date()
                print("🔄 Widget: Updated cache with \(steps.count) steps")
                
                // Refresh widget with new data
                WidgetCenter.shared.reloadAllTimelines()
            } catch {
                print("Widget: Error fetching steps: \(error)")
            }
        }
        
        // Return empty timeline for now, will be updated when data is fetched
        let entry = SimpleEntry(
            date: Date(),
            widgetType: widgetType,
            todaySteps: [],
            futureSteps: [],
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func createTimelineEntry(with steps: [DailyStep], widgetType: WidgetType) -> Timeline<Entry> {
        let today = Calendar.current.startOfDay(for: Date())
        
        print("Widget: Today date: \(today)")
        print("Widget: Total steps: \(steps.count)")
        for step in steps.prefix(3) {
            print("Widget: Step '\(step.title)' - Date: \(step.date), Completed: \(step.completed)")
        }
        
        let todaySteps = steps.filter { Calendar.current.isDate($0.date, inSameDayAs: today) && !$0.completed }
        let futureSteps = steps.filter { $0.date > today && !$0.completed }
        
        print("Widget: Today steps: \(todaySteps.count), Future steps: \(futureSteps.count)")
        print("Widget: Using widget type: \(widgetType.rawValue)")
        
        let entry = SimpleEntry(
            date: Date(),
            widgetType: widgetType,
            todaySteps: todaySteps,
            futureSteps: futureSteps,
            inspiration: PokrokWidgetConfiguration.shared.getRandomInspiration()
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
    
    private func getWidgetTypeFromUserDefaults() -> WidgetType {
        guard let userDefaults = PokrokWidgetConfiguration.shared.getSharedUserDefaults(),
              let widgetTypeString = userDefaults.string(forKey: "selected_widget_type") else {
            print("🚀 Widget: No widget type in UserDefaults, defaulting to todaySteps")
            return .todaySteps
        }
        
        let widgetType = WidgetType(rawValue: widgetTypeString) ?? .todaySteps
        print("🚀 Widget: Found widget type in UserDefaults: \(widgetType)")
        return widgetType
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let widgetType: WidgetType
    let todaySteps: [DailyStep]
    let futureSteps: [DailyStep]
    let inspiration: (String, String, String)
}

struct PokrokWidgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        let _ = print("🎨 Widget EntryView: Rendering widget type: \(entry.widgetType.rawValue)")
        let _ = print("🎨 Widget EntryView: Today steps: \(entry.todaySteps.count), Future steps: \(entry.futureSteps.count)")
        
        switch entry.widgetType {
        case .todaySteps:
            let _ = print("🎨 Widget EntryView: Using TodayStepsWidgetView")
            TodayStepsWidgetView(entry: entry, family: family)
        case .futureSteps:
            let _ = print("🎨 Widget EntryView: Using FutureStepsWidgetView")
            FutureStepsWidgetView(entry: entry, family: family)
        case .inspiration:
            let _ = print("🎨 Widget EntryView: Using InspirationWidgetView")
            InspirationWidgetView(entry: entry, family: family)
        }
    }
}

struct PokrokWidget: Widget {
    let kind: String = "PokrokWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PokrokWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Pokrok")
        .description("Sledujte své kroky a najděte inspiraci")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
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
        inspiration: ("☕", "Dejte si kávu", "Relaxace")
    )
}