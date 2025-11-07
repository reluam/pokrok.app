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
                .task {
                    clerk.configure(publishableKey: "pk_live_Y2xlcmsucG9rcm9rLmFwcCQ")
                    try? await clerk.load()
                    
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