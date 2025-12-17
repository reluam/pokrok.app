import SwiftUI
import Combine

// MARK: - Date Selection Manager
// Shared state manager for selected date across Steps and Habits views
class DateSelectionManager: ObservableObject {
    static let shared = DateSelectionManager()
    
    @Published var selectedDate: Date = Date()
    
    private init() {}
}

