import SwiftUI

struct OverviewView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddGoalModal = false
    @State private var selectedGoal: Goal?
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám přehled...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header
                        headerSection
                        
                        // Progress Charts
                        progressChartsSection
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Cíle")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddGoalModal = true
                }) {
                    ModernIcon(
                        systemName: "plus",
                        size: 18,
                        color: DesignSystem.Colors.primary
                    )
                }
            }
        }
        .onAppear {
            loadData()
        }
        .sheet(isPresented: $showAddGoalModal) {
            AddGoalModal(onGoalAdded: {
                loadData()
            })
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Cíle")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Sledujte pokrok svých cílů")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        showAddGoalModal = true
                    }) {
                        Text("Přidat cíl")
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.medium)
                            .foregroundColor(DesignSystem.Colors.primary)
                            .padding(.horizontal, DesignSystem.Spacing.md)
                            .padding(.vertical, DesignSystem.Spacing.sm)
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .fill(DesignSystem.Colors.primary.opacity(0.1))
                            )
                    }
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Progress Charts Section
    private var progressChartsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if goals.isEmpty {
                EmptyStateView(
                    icon: "chart.bar",
                    title: "Žádné cíle k zobrazení",
                    subtitle: "Přidejte svůj první cíl pro sledování pokroku"
                )
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.md) {
                    ForEach(goals.prefix(5), id: \.id) { goal in
                        goalProgressCard(goal)
                    }
                }
            }
        }
    }
    
    // MARK: - Goal Progress Card
    private func goalProgressCard(_ goal: Goal) -> some View {
        NavigationLink(destination: GoalDetailView(goal: goal)) {
            ModernCard {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    HStack {
                        Text(goal.title)
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        StatusBadge(
                            text: "\(goal.progressPercentage)%",
                            color: DesignSystem.Colors.primary,
                            backgroundColor: DesignSystem.Colors.primary.opacity(0.1)
                        )
                    }
                    
                    ModernProgressBar(
                        progress: Double(goal.progressPercentage) / 100,
                        height: 8,
                        foregroundColor: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary
                    )
                    
                    if let targetDate = goal.targetDate {
                        HStack {
                            ModernIcon(
                                systemName: "calendar",
                                size: 12,
                                color: DesignSystem.Colors.textTertiary
                            )
                            Text("Do: \(targetDate, style: .date)")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                let fetchedGoals = try await apiManager.fetchGoals()
                
                await MainActor.run {
                    self.goals = fetchedGoals
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
}

#Preview {
    OverviewView()
}
