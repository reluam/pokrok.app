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
                    
                    AspirationsOverviewView()
                        .tabItem {
                            Image(systemName: "chart.bar.fill")
                            Text("Přehled")
                        }
                    
                    StepsView()
                        .tabItem {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Kroky")
                        }
                    
                    NotesView()
                        .tabItem {
                            Image(systemName: "note.text")
                            Text("Poznámky")
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