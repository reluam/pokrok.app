import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainAppView()
            } else {
                AuthView()
            }
        }
        .preferredColorScheme(.light)
    }
}

struct MainAppView: View {
    @EnvironmentObject var authManager: AuthManager
    
    @State private var selectedTab: AppTab = .dashboard
    @State private var goals: [Goal] = []
    @State private var habits: [Habit] = []
    @State private var isLoading = true
    
    enum AppTab: String, CaseIterable {
        case dashboard = "Dashboard"
        case goals = "Cíle"
        case habits = "Návyky"
        case planning = "Plánování"
        case statistics = "Statistiky"
        
        var icon: String {
            switch self {
            case .dashboard: return "house.fill"
            case .goals: return "target"
            case .habits: return "repeat.circle.fill"
            case .planning: return "calendar"
            case .statistics: return "chart.bar.fill"
            }
        }
    }
    
    var body: some View {
        NavigationSplitView {
            // Sidebar
            List(AppTab.allCases, id: \.self, selection: $selectedTab) { tab in
                Label(tab.rawValue, systemImage: tab.icon)
                    .tag(tab)
            }
            .listStyle(.sidebar)
            .frame(minWidth: 180)
            .toolbar {
                ToolbarItem(placement: .automatic) {
                    Button(action: {}) {
                        Image(systemName: "sidebar.left")
                    }
                }
            }
        } detail: {
            // Main content
            ZStack {
                LinearGradient(
                    colors: [Color.orange.opacity(0.05), Color.white, Color.orange.opacity(0.03)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                if isLoading {
                    LoadingView()
                } else {
                    switch selectedTab {
                    case .dashboard:
                        DashboardView(goals: $goals, habits: $habits)
                    case .goals:
                        GoalsView(goals: $goals)
                    case .habits:
                        HabitsView(habits: $habits)
                    case .planning:
                        DayPlanView(goals: goals, habits: habits)
                    case .statistics:
                        StatisticsView(goals: goals, habits: habits)
                    }
                }
            }
        }
        .task {
            await loadData()
        }
    }
    
    private func loadData() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let gameData = try await APIManager.shared.fetchGameData()
            await MainActor.run {
                self.goals = gameData.goals
                self.habits = gameData.habits
            }
        } catch {
            print("Error loading data: \(error)")
            // Use demo data for development
            await MainActor.run {
                self.goals = Self.demoGoals
                self.habits = Self.demoHabits
            }
        }
    }
    
    // Demo data for development
    static let demoGoals: [Goal] = [
        Goal(id: "1", title: "Naučit se Swift", description: "Zvládnout základy SwiftUI", deadline: Date().addingTimeInterval(86400 * 30), category: "Vzdělání", priority: .high, status: .active, createdAt: Date(), completedAt: nil),
        Goal(id: "2", title: "Cvičit pravidelně", description: "3x týdně", deadline: nil, category: "Zdraví", priority: .medium, status: .active, createdAt: Date(), completedAt: nil),
        Goal(id: "3", title: "Přečíst 12 knih", description: "1 kniha měsíčně", deadline: Date().addingTimeInterval(86400 * 365), category: "Osobní rozvoj", priority: .low, status: .active, createdAt: Date(), completedAt: nil)
    ]
    
    static let demoHabits: [Habit] = [
        Habit(id: "1", name: "Ranní meditace", description: "10 minut každé ráno", frequency: .daily, streak: 5, maxStreak: 14, lastCompleted: Date(), category: "Mindfulness", difficulty: .easy, isCustom: false, createdAt: Date()),
        Habit(id: "2", name: "Čtení", description: "30 minut denně", frequency: .daily, streak: 3, maxStreak: 21, lastCompleted: Date(), category: "Vzdělání", difficulty: .medium, isCustom: true, createdAt: Date()),
        Habit(id: "3", name: "Cvičení", description: "Alespoň 30 minut", frequency: .daily, streak: 2, maxStreak: 7, lastCompleted: Date(), category: "Zdraví", difficulty: .hard, isCustom: false, createdAt: Date())
    ]
}

struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Načítání...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
}
