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
    @State private var showingHelp = false
    @State private var showingSettings = false
    
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
            VStack(spacing: 0) {
                // Orange header bar
                AppHeaderBar(
                    onHelpClick: { showingHelp = true },
                    onSettingsClick: { showingSettings = true }
                )
                
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
                            GoalsView(goals: $goals, steps: $steps)
                        case .steps:
                            StepsView(goals: goals, steps: $steps)
                        case .habits:
                            HabitsView(habits: $habits)
                        }
                    }
                }
            }
        }
        .task {
            await loadData()
        }
        .sheet(isPresented: $showingHelp) {
            HelpView(goals: $goals, habits: $habits, steps: $steps)
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
                .environmentObject(authManager)
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

struct AppHeaderBar: View {
    // #ea580c
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    let onHelpClick: () -> Void
    let onSettingsClick: () -> Void
    
    var body: some View {
        HStack {
            // Left - Main Panel
            HStack(spacing: 6) {
                Image(systemName: "house.fill")
                    .font(.system(size: 13))
                Text("Main Panel")
                    .font(.system(size: 13, weight: .semibold))
            }
            .foregroundColor(.white)
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(Color.white.opacity(0.2))
            .cornerRadius(16)
            
            Spacer()
            
            // Right - Stats and buttons
            HStack(spacing: 20) {
                // XP
                HStack(spacing: 5) {
                    Image(systemName: "star.circle.fill")
                        .font(.system(size: 14))
                    Text("79")
                        .font(.system(size: 14, weight: .bold))
                    Text("XP")
                        .font(.system(size: 12))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                
                // Streak
                HStack(spacing: 5) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14))
                    Text("4")
                        .font(.system(size: 14, weight: .bold))
                    Text("Streak")
                        .font(.system(size: 12))
                        .opacity(0.8)
                }
                .foregroundColor(.white)
                
                // Help
                Button(action: onHelpClick) {
                    HStack(spacing: 5) {
                        Image(systemName: "questionmark.circle")
                            .font(.system(size: 14))
                        Text("Help")
                            .font(.system(size: 13))
                    }
                    .foregroundColor(.white)
                }
                .buttonStyle(.plain)
                
                // Settings
                Button(action: onSettingsClick) {
                    HStack(spacing: 5) {
                        Image(systemName: "gearshape")
                            .font(.system(size: 14))
                        Text("Settings")
                            .font(.system(size: 13))
                    }
                    .foregroundColor(.white)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
        .background(primaryOrange)
    }
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
