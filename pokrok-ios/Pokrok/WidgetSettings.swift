import Foundation

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
    
    var description: String {
        switch self {
        case .todaySteps:
            return "Zobrazuje dnešní kroky a zpožděné úkoly"
        case .futureSteps:
            return "Zobrazuje dnešní a budoucí kroky"
        case .inspiration:
            return "Zobrazuje náhodné inspirace a aktivity"
        }
    }
}

class WidgetSettingsManager: ObservableObject {
    @Published var selectedWidgetType: WidgetType = .todaySteps
    
    private let userDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrokWidget")
    
    init() {
        loadSettings()
    }
    
    func loadSettings() {
        guard let userDefaults = userDefaults,
              let rawValue = userDefaults.string(forKey: "widget_type"),
              let widgetType = WidgetType(rawValue: rawValue) else {
            selectedWidgetType = .todaySteps
            return
        }
        selectedWidgetType = widgetType
    }
    
    func saveSettings() {
        userDefaults?.set(selectedWidgetType.rawValue, forKey: "widget_type")
    }
}
