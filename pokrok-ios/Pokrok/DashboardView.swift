import SwiftUI

struct DashboardView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var isLoading = true
    @State private var showAddStepModal = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var selectedStep: DailyStep?
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám vaši cestu...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Welcome Header
                        welcomeHeader
                        
                        // Steps Section
                        stepsSection
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Co je potřeba?")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddStepModal = true
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
            // Refresh token for widget every time app becomes active
            Task {
                await apiManager.refreshTokenForWidget()
            }
        }
        .sheet(isPresented: $showAddStepModal) {
            AddStepModal(onStepAdded: {
                loadData()
            })
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Welcome Header
    private var welcomeHeader: some View {
        ModernCard {
            HStack {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Dnešní plán")
                        .font(DesignSystem.Typography.title3)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text("Co je dnes potřeba udělat?")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                
                Spacer()
                
                Button(action: {
                    showAddStepModal = true
                }) {
                    Text("Přidat krok")
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
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    
    // MARK: - Steps Section
    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            VStack(spacing: DesignSystem.Spacing.sm) {
                if todaySteps.isEmpty && overdueSteps.isEmpty {
                    inspirationView
                } else {
                    // Overdue Steps
                    ForEach(overdueSteps, id: \.id) { step in
                        SimpleStepRow(
                            step: step,
                            goalTitle: getGoalTitle(for: step.goalId),
                            isOverdue: true,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                    }
                    
                    // Today Steps
                    ForEach(todaySteps, id: \.id) { step in
                        SimpleStepRow(
                            step: step,
                            goalTitle: getGoalTitle(for: step.goalId),
                            isOverdue: false,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    private var overdueSteps: [DailyStep] {
        let today = Calendar.current.startOfDay(for: Date())
        return dailySteps.filter { step in
            !step.completed && Calendar.current.startOfDay(for: step.date) < today
        }
    }
    
    private var todaySteps: [DailyStep] {
        let today = Calendar.current.startOfDay(for: Date())
        return dailySteps.filter { step in
            !step.completed && Calendar.current.startOfDay(for: step.date) == today
        }
    }
    
    private func getGoalTitle(for goalId: String?) -> String? {
        // Goals are no longer loaded in DashboardView
        return nil
    }
    
    // MARK: - Data Loading
    private func loadData() {
        print("🔍 Main App: loadData called")
        Task {
            do {
                print("🔍 Main App: Starting API call for steps...")
                let fetchedSteps = try await apiManager.fetchSteps()
                
                print("🔍 Main App: API call completed - Steps: \(fetchedSteps.count)")
                
                await MainActor.run {
                    self.dailySteps = fetchedSteps
                    self.isLoading = false
                }
            } catch {
                print("🔍 Main App: API call failed: \(error)")
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
    
    // MARK: - Step Completion Toggle
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                // Find the current step to get its data
                guard let currentStep = dailySteps.first(where: { $0.id == stepId }) else {
                    print("❌ Step not found with ID: \(stepId)")
                    return
                }
                
                let updatedStep = try await apiManager.updateStepCompletion(stepId: stepId, completed: completed, currentStep: currentStep)
                
                await MainActor.run {
                    if let index = dailySteps.firstIndex(where: { $0.id == stepId }) {
                        dailySteps[index] = updatedStep
                    }
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

// MARK: - Inspiration View
    private var inspirationView: some View {
        VStack(spacing: DesignSystem.Spacing.xl) {
            // Celebration section - outside the box
            VStack(spacing: DesignSystem.Spacing.md) {
                Image(systemName: "party.popper.fill")
                    .font(.system(size: 56))
                    .foregroundColor(DesignSystem.Colors.success)
                    .symbolEffect(.bounce, value: true)
                
                Text("Všechny úkoly hotové!")
                    .font(DesignSystem.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .multilineTextAlignment(.center)
            }
            
            // Single modern inspiration box
            let activities = [
                ("☕", "Dejte si kávu a odpočiňte si", "Relaxace"),
                ("📚", "Přečtěte si kapitolu z knihy", "Vzdělávání"),
                ("🚶‍♂️", "Jděte se projít na čerstvý vzduch", "Pohyb"),
                ("🧘‍♀️", "Zameditujte 10 minut", "Mindfulness"),
                ("👥", "Zkontaktujte někoho blízkého", "Sociální"),
                ("🎵", "Poslechněte si oblíbenou hudbu", "Zábava"),
                ("🌱", "Zalijte pokojové rostliny", "Péče"),
                ("✍️", "Napište si deník", "Reflexe"),
                ("🎨", "Nakreslete nebo vybarvěte", "Kreativita"),
                ("🍃", "Udělate si čaj a relaxujte", "Pohoda"),
                ("📱", "Odpojte se od technologií", "Digitální detox"),
                ("🏃‍♂️", "Jděte si zaběhat", "Sport"),
                ("🍳", "Uvařte si něco dobrého", "Vaření"),
                ("📖", "Přečtěte si článek", "Čtení"),
                ("🎯", "Naplánujte zítřejší den", "Plánování")
            ]
            
            let randomActivity = activities.randomElement() ?? activities[0]
            
            VStack(spacing: DesignSystem.Spacing.xl) {
                // Header
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Text("✨ Inspirace pro volný čas")
                        .font(DesignSystem.Typography.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text("Co můžete dělat teď?")
                        .font(DesignSystem.Typography.subheadline)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                
                // Activity suggestion
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Activity icon
                    Text(randomActivity.0)
                        .font(.system(size: 64))
                        .padding(.bottom, DesignSystem.Spacing.sm)
                    
                    // Activity text
                    VStack(spacing: DesignSystem.Spacing.md) {
                        Text(randomActivity.1)
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .multilineTextAlignment(.center)
                        
                        Text(randomActivity.2)
                            .font(DesignSystem.Typography.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(DesignSystem.Colors.primary)
                            .padding(.horizontal, DesignSystem.Spacing.lg)
                            .padding(.vertical, DesignSystem.Spacing.sm)
                            .background(
                                Capsule()
                                    .fill(DesignSystem.Colors.primary.opacity(0.15))
                            )
                    }
                }
                
                // Motivational message
                Text("Máte čas na sebe! 🕐")
                    .font(DesignSystem.Typography.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .multilineTextAlignment(.center)
                    .italic()
            }
            .padding(DesignSystem.Spacing.xl)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.xl)
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                DesignSystem.AdaptiveColors.surfacePrimary,
                                DesignSystem.Colors.primary.opacity(0.02)
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.xl)
                            .stroke(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        DesignSystem.Colors.primary.opacity(0.1),
                                        DesignSystem.Colors.primary.opacity(0.05)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .shadow(
                        color: DesignSystem.Colors.textPrimary.opacity(0.08),
                        radius: 24,
                        x: 0,
                        y: 12
                    )
            )
            .padding(.horizontal, DesignSystem.Spacing.lg)
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

// MARK: - Simple Step Row Component
struct SimpleStepRow: View {
    let step: DailyStep
    let goalTitle: String?
    let isOverdue: Bool
    let onToggle: () -> Void
    
    @State private var isAnimating = false
    
    private var borderColor: Color {
        if isOverdue {
            return DesignSystem.Colors.error.opacity(0.2)
        } else {
            return DesignSystem.Colors.primary.opacity(0.2)
        }
    }
    
    private var backgroundColor: Color {
        if isOverdue {
            return DesignSystem.Colors.error.opacity(0.08)
        } else {
            return DesignSystem.Colors.primary.opacity(0.08)
        }
    }
    
    private var statusText: String {
        if isOverdue {
            return "Zpožděno"
        } else {
            return "Dnešní"
        }
    }
    
    private var statusColor: Color {
        if isOverdue {
            return DesignSystem.Colors.error
        } else {
            return DesignSystem.Colors.primary
        }
    }
    
    var body: some View {
        NavigationLink(destination: StepDetailView(step: step)) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                // Checkbox
                Button(action: {
                    withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                        isAnimating = true
                    }
                    
                    // Reset animation after completion
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        isAnimating = false
                    }
                    
                    onToggle()
                }) {
                    Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 20))
                        .foregroundColor(step.completed ? DesignSystem.Colors.success : borderColor)
                        .scaleEffect(isAnimating ? 1.3 : 1.0)
                        .background(
                            Circle()
                                .fill(isAnimating ? (step.completed ? DesignSystem.Colors.success.opacity(0.2) : statusColor.opacity(0.2)) : Color.clear)
                                .scaleEffect(isAnimating ? 1.5 : 1.0)
                                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isAnimating)
                        )
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isAnimating)
                }
                .buttonStyle(PlainButtonStyle())
                
                // Content
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(step.title)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(step.completed ? DesignSystem.Colors.textTertiary : DesignSystem.Colors.textPrimary)
                        .strikethrough(step.completed)
                    
                    if let goalTitle = goalTitle {
                        Text(goalTitle)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
                
                Spacer()
                
                // Status indicator
                Text(statusText)
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.medium)
                    .foregroundColor(statusColor)
                    .padding(.horizontal, DesignSystem.Spacing.sm)
                    .padding(.vertical, DesignSystem.Spacing.xs)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .fill(statusColor.opacity(0.1))
                    )
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(backgroundColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(borderColor, lineWidth: 0.5)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    DashboardView()
}
