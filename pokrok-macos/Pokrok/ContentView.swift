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
    
    @State private var selectedTab: AppTab = .overview
    @State private var goals: [Goal] = []
    @State private var habits: [Habit] = []
    @State private var steps: [Step] = []
    @State private var isLoading = true
    
    enum AppTab: String, CaseIterable {
        case overview = "Overview"
        case goals = "Goals"
        case steps = "Steps"
        case habits = "Habits"
        
        var icon: String {
            switch self {
            case .overview: return "square.grid.2x2.fill"
            case .goals: return "target"
            case .steps: return "checkmark.circle.fill"
            case .habits: return "checkmark.square.fill"
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
                    case .overview:
                        WeekOverviewView(goals: $goals, habits: $habits, steps: $steps)
                    case .goals:
                        GoalsView(goals: $goals)
                    case .steps:
                        StepsView(goals: goals, steps: $steps)
                    case .habits:
                        HabitsView(habits: $habits)
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
                self.steps = gameData.steps ?? []
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
        Goal(id: "1", userId: nil, title: "Naučit se Swift", description: "Zvládnout základy SwiftUI", targetDate: Date().addingTimeInterval(86400 * 30), status: "active", priority: "high", category: "Vzdělání", color: nil, icon: nil, createdAt: Date(), updatedAt: nil),
        Goal(id: "2", userId: nil, title: "Cvičit pravidelně", description: "3x týdně", targetDate: nil, status: "active", priority: "medium", category: "Zdraví", color: nil, icon: nil, createdAt: Date(), updatedAt: nil),
        Goal(id: "3", userId: nil, title: "Přečíst 12 knih", description: "1 kniha měsíčně", targetDate: Date().addingTimeInterval(86400 * 365), status: "active", priority: "low", category: "Osobní rozvoj", color: nil, icon: nil, createdAt: Date(), updatedAt: nil)
    ]
    
    static let demoHabits: [Habit] = [
        Habit(id: "1", userId: nil, name: "Ranní meditace", description: "10 minut každé ráno", frequency: "daily", streak: 5, maxStreak: 14, lastCompleted: Date(), category: "Mindfulness", difficulty: "easy", isCustom: false, color: nil, icon: nil, completedToday: false, createdAt: Date(), updatedAt: nil),
        Habit(id: "2", userId: nil, name: "Čtení", description: "30 minut denně", frequency: "daily", streak: 3, maxStreak: 21, lastCompleted: Date(), category: "Vzdělání", difficulty: "medium", isCustom: true, color: nil, icon: nil, completedToday: false, createdAt: Date(), updatedAt: nil),
        Habit(id: "3", userId: nil, name: "Cvičení", description: "Alespoň 30 minut", frequency: "daily", streak: 2, maxStreak: 7, lastCompleted: Date(), category: "Zdraví", difficulty: "hard", isCustom: false, color: nil, icon: nil, completedToday: false, createdAt: Date(), updatedAt: nil)
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
