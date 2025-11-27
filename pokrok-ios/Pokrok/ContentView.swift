import SwiftUI
import Clerk

struct ContentView: View {
    @Environment(\.clerk) private var clerk
    
    var body: some View {
        Group {
            if clerk.user != nil {
                // Main app content for authenticated users
                TabView {
                    DashboardView()
                        .tabItem {
                            Image(systemName: "house.fill")
                            Text("Domů")
                        }
                    
                    GoalsView()
                        .tabItem {
                            Image(systemName: "flag.fill")
                            Text("Cíle")
                        }
                    
                    StepsView()
                        .tabItem {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Kroky")
                        }
                    
                    HabitsView()
                        .tabItem {
                            Image(systemName: "repeat.circle.fill")
                            Text("Návyky")
                        }
                    
                    SettingsView()
                        .tabItem {
                            Image(systemName: "gear")
                            Text("Nastavení")
                        }
                }
                .accentColor(.orange)
            } else {
                // Authentication screen for unauthenticated users
                AuthView()
            }
        }
        .onAppear {
        }
    }
}