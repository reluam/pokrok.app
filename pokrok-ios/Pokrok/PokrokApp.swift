import SwiftUI
import Clerk
import BackgroundTasks

@main
struct PokrokApp: App {
    @State private var clerk = Clerk.shared
    @State private var refreshTimer: Timer?
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.clerk, clerk)
                .environmentObject(UserSettingsManager.shared)
                .task {
                    clerk.configure(publishableKey: "pk_live_Y2xlcmsucG9rcm9rLmFwcCQ")
                    try? await clerk.load()
                    
                    // Load user settings for primary color
                    UserSettingsManager.shared.loadSettings()
                    
                    // Setup notifications
                    NotificationManager.shared.setupNotificationCategories()
                    _ = NotificationDelegate.shared // Initialize delegate
                    
                    // Schedule initial steps notifications
                    NotificationManager.shared.scheduleStepsNotifications()
                    
                    // Start automatic token refresh
                    startTokenRefreshTimer()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                    // Refresh token when app becomes active
                    Task {
                        await APIManager.shared.refreshTokenForWidget()
                    }
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
                    // Stop timer when app goes to background
                    stopTokenRefreshTimer()
                }
                .onReceive(NotificationCenter.default.publisher(for: UIApplication.willTerminateNotification)) { _ in
                    // App is about to terminate - ensure widget data is saved
                    // This is a fallback, data should already be saved after each update
                }
        }
    }
    
    private func startTokenRefreshTimer() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { _ in
            Task {
                await APIManager.shared.refreshTokenForWidget()
            }
        }
    }
    
    private func stopTokenRefreshTimer() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
}