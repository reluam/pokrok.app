import SwiftUI

struct StepDetailView: View {
    let step: DailyStep
    let goalTitle: String?
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var isCompleted: Bool
    @State private var showError = false
    @State private var errorMessage = ""
    
    init(step: DailyStep, goalTitle: String? = nil) {
        self.step = step
        self.goalTitle = goalTitle
        self._isCompleted = State(initialValue: step.completed)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    // Header Card
                    ModernCard {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                            HStack {
                                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                    Text(step.title)
                                        .font(DesignSystem.Typography.title2)
                                        .foregroundColor(DesignSystem.Colors.textPrimary)
                                        .strikethrough(isCompleted)
                                    
                                    if let goalTitle = goalTitle {
                                        Text(goalTitle)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }
                                }
                                
                                Spacer()
                                
                                Button(action: {
                                    toggleCompletion()
                                }) {
                                    Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 24))
                                        .foregroundColor(isCompleted ? DesignSystem.Colors.success : DesignSystem.Colors.primary)
                                }
                            }
                            
                            // Date and Status
                            HStack {
                                ModernIcon(
                                    systemName: "calendar",
                                    size: 16,
                                    color: DesignSystem.Colors.textTertiary
                                )
                                Text(step.date, style: .date)
                                    .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                
                                Spacer()
                                
                                StatusBadge(
                                    text: isCompleted ? "Dokončeno" : "Aktivní",
                                    color: isCompleted ? DesignSystem.Colors.success : DesignSystem.Colors.primary,
                                    backgroundColor: isCompleted ? DesignSystem.Colors.success.opacity(0.1) : DesignSystem.Colors.primary.opacity(0.1)
                                )
                            }
                        }
                        .padding(DesignSystem.Spacing.md)
                    }
                    
                    // Description Card
                    if let description = step.description, !description.isEmpty {
                        ModernCard {
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                                Text("Popis")
                                    .font(DesignSystem.Typography.headline)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)
                                
                                Text(description)
                                    .font(DesignSystem.Typography.body)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
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
                                    if let createdAt = step.createdAt {
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
                                    if let updatedAt = step.updatedAt {
                                        Text(updatedAt, style: .date)
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(DesignSystem.Colors.textSecondary)
                                    }
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
        .navigationTitle("Detail kroku")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Hotovo") {
                    dismiss()
                }
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func toggleCompletion() {
        Task {
            do {
                let updatedStep = try await apiManager.updateStepCompletion(
                    stepId: step.id,
                    completed: !isCompleted,
                    currentStep: step
                )
                
                await MainActor.run {
                    isCompleted = updatedStep.completed
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

#Preview {
    StepDetailView(
        step: DailyStep(
            id: "1",
            title: "Příklad kroku",
            description: "Toto je popis příkladového kroku",
            date: Date(),
            completed: false,
            goalId: "goal1",
            createdAt: Date(),
            updatedAt: Date()
        ),
        goalTitle: "Příklad cíle"
    )
}
