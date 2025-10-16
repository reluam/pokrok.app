import SwiftUI

struct GoalDetailView: View {
    let goal: Goal
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var steps: [DailyStep] = []
    @State private var isLoading = true
    @State private var showError = false
    @State private var errorMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    // Header Card
                    ModernCard {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                            HStack {
                                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                    Text(goal.title)
                                        .font(DesignSystem.Typography.title2)
                                        .foregroundColor(DesignSystem.Colors.textPrimary)
                                    
                                    if let description = goal.description, !description.isEmpty {
                                        Text(description)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }
                                }
                                
                                Spacer()
                                
                                StatusBadge(
                                    text: "\(goal.progressPercentage)%",
                                    color: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary,
                                    backgroundColor: goal.status == "completed" ? DesignSystem.Colors.success.opacity(0.1) : DesignSystem.Colors.primary.opacity(0.1)
                                )
                            }
                            
                            // Progress Bar
                            ModernProgressBar(
                                progress: Double(goal.progressPercentage) / 100,
                                height: 12,
                                foregroundColor: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary
                            )
                            
                            // Target Date
                            if let targetDate = goal.targetDate {
                                HStack {
                                    ModernIcon(
                                        systemName: "calendar",
                                        size: 16,
                                        color: DesignSystem.Colors.textTertiary
                                    )
                                    Text("Cíl do: \(targetDate, style: .date)")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                    
                                    Spacer()
                                    
                                    StatusBadge(
                                        text: goal.status == "completed" ? "Dokončeno" : "Aktivní",
                                        color: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary,
                                        backgroundColor: goal.status == "completed" ? DesignSystem.Colors.success.opacity(0.1) : DesignSystem.Colors.primary.opacity(0.1)
                                    )
                                }
                            }
                        }
                        .padding(DesignSystem.Spacing.md)
                    }
                    
                    // Steps Section
                    if !steps.isEmpty {
                        ModernCard {
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                                Text("Kroky k cíli")
                                    .font(DesignSystem.Typography.headline)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)
                                
                                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                                    ForEach(steps.prefix(10), id: \.id) { step in
                                        HStack {
                                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                                .font(.system(size: 16))
                                                .foregroundColor(step.completed ? DesignSystem.Colors.success : DesignSystem.Colors.textTertiary)
                                            
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(step.title)
                                                    .font(DesignSystem.Typography.caption)
                                                    .foregroundColor(step.completed ? DesignSystem.Colors.textTertiary : DesignSystem.Colors.textPrimary)
                                                    .strikethrough(step.completed)
                                                
                                                Text(step.date, style: .date)
                                                    .font(DesignSystem.Typography.caption2)
                                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                            }
                                            
                                            Spacer()
                                        }
                                        .padding(.vertical, DesignSystem.Spacing.xs)
                                    }
                                    
                                    if steps.count > 10 {
                                        Text("... a \(steps.count - 10) dalších kroků")
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                            .padding(.top, DesignSystem.Spacing.xs)
                                    }
                                }
                            }
                            .padding(DesignSystem.Spacing.md)
                        }
                    }
                    
                    // Metadata Card
                    ModernCard {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                            Text("Informace")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                HStack {
                                    Text("Vytvořeno:")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                    Spacer()
                                    if let createdAt = goal.createdAt {
                                        Text(createdAt, style: .date)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }
                                }
                                
                                HStack {
                                    Text("Aktualizováno:")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                    Spacer()
                                    if let updatedAt = goal.updatedAt {
                                        Text(updatedAt, style: .date)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }
                                }
                                
                                HStack {
                                    Text("Celkem kroků:")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                    Spacer()
                                    Text("\(steps.count)")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                }
                                
                                HStack {
                                    Text("Dokončené kroky:")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                    Spacer()
                                    Text("\(steps.filter { $0.completed }.count)")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                }
                            }
                        }
                        .padding(DesignSystem.Spacing.md)
                    }
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle("Detail cíle")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Hotovo") {
                    dismiss()
                }
            }
        }
        .onAppear {
            loadSteps()
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func loadSteps() {
        Task {
            do {
                let allSteps = try await apiManager.fetchSteps()
                let goalSteps = allSteps.filter { $0.goalId == goal.id }
                
                await MainActor.run {
                    self.steps = goalSteps.sorted { $0.date < $1.date }
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
    GoalDetailView(
        goal: Goal(
            id: "1",
            title: "Příklad cíle",
            description: "Toto je popis příkladového cíle",
            status: "active",
            progressPercentage: 75,
            targetDate: Calendar.current.date(byAdding: .day, value: 30, to: Date()),
            createdAt: Date(),
            updatedAt: Date()
        )
    )
}
