import Foundation

// WidgetType is now defined in Models.swift

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
