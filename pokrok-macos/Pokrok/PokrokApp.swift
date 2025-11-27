import SwiftUI

@main
struct PokrokApp: App {
    @StateObject private var authManager = AuthManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .frame(minWidth: 900, minHeight: 600)
                .onOpenURL { url in
                    // Handle pokrok:// URL callback from browser
                    authManager.handleURL(url)
                }
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
        
        Settings {
            SettingsView()
                .environmentObject(authManager)
        }
    }
}
