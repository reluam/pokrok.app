import Foundation
import SwiftUI

// MARK: - Navigation Manager for handling deep links and notifications
class NavigationManager: ObservableObject {
    static let shared = NavigationManager()
    
    @Published var navigateToTab: Tab?
    
    private init() {}
    
    func navigateToFeed() {
        navigateToTab = .steps
    }
    
    func navigateToHabits() {
        navigateToTab = .habits
    }
    
    func navigateToGoals() {
        navigateToTab = .goals
    }
    
    func navigateToSettings() {
        navigateToTab = .settings
    }
}

