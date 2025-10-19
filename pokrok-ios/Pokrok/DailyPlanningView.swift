import SwiftUI

struct DailyPlanningView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var userSettings: UserSettings?
    @State private var dailySteps: [DailyStep] = []
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    @State private var isPlanningMode = false
    @State private var tempPlannedSteps: [String] = []
    @State private var isSavingPlan = false
    @State private var currentInspiration = ""
    @State private var dailyPlanning: DailyPlanning?
    
    // Stats
    @State private var stepStats = (completed: 0, total: 0)
    
    private let inspirations = [
        "🚶‍♂️ Jdi na procházku a načerpej energii z přírody",
        "🧘‍♀️ Medituj 10 minut a zklidni mysl",
        "☕ Dej si dobrý čaj a odpočiň si",
        "📚 Přečti si kapitolu z oblíbené knihy",
        "🎵 Poslouchej hudbu, která tě inspiruje",
        "✍️ Napiš si deník nebo myšlenky",
        "🌱 Zalij květiny nebo se starej o rostliny",
        "🎨 Nakresli něco nebo se věnuj kreativitě",
        "💆‍♀️ Udělej si masáž nebo relaxační cvičení",
        "🍳 Uvař si něco dobrého a užij si jídlo",
        "📞 Zavolej někomu blízkému",
        "🌟 Poděkuj za dnešní úspěchy"
    ]
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám denní plán...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header Section
                        headerSection
                        
                        // Stats Section
                        statsSection
                        
                        // Planning Mode Toggle
                        planningModeSection
                        
                        // Steps Section
                        if isPlanningMode {
                            planningStepsSection
                        } else {
                            todayStepsSection
                        }
                        
                        // Inspiration Section (when all steps completed)
                        if allTodayStepsCompleted {
                            inspirationSection
                        }
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Denní plán")
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
            setRandomInspiration()
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
    
    // MARK: - Header Section
    private var headerSection: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Dnešní plán")
                            .font(DesignSystem.Typography.title2)
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
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Stats Section
    private var statsSection: some View {
        ModernCard {
            HStack(spacing: DesignSystem.Spacing.lg) {
                // Completed Steps
                VStack(spacing: DesignSystem.Spacing.xs) {
                    Text("\(stepStats.completed)")
                        .font(DesignSystem.Typography.title2)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.success)
                    
                    Text("Hotové")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                
                Spacer()
                
                // Progress Bar
                VStack(spacing: DesignSystem.Spacing.xs) {
                    ProgressView(value: stepStats.total > 0 ? Double(stepStats.completed) / Double(stepStats.total) : 0)
                        .progressViewStyle(LinearProgressViewStyle(tint: DesignSystem.Colors.primary))
                        .frame(height: 8)
                    
                    Text("\(stepStats.completed) z \(stepStats.total)")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .frame(maxWidth: 120)
                
                Spacer()
                
                // Total Steps
                VStack(spacing: DesignSystem.Spacing.xs) {
                    Text("\(stepStats.total)")
                        .font(DesignSystem.Typography.title2)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text("Celkem")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Planning Mode Section
    private var planningModeSection: some View {
        ModernCard {
            HStack {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Režim plánování")
                        .font(DesignSystem.Typography.body)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text(isPlanningMode ? "Vyberte kroky pro dnešní den" : "Zobrazit všechny kroky k plánování")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                
                Spacer()
                
                Toggle("", isOn: $isPlanningMode)
                    .toggleStyle(SwitchToggleStyle(tint: DesignSystem.Colors.primary))
                    .onChange(of: isPlanningMode) { _, newValue in
                        if newValue {
                            // Enter planning mode - copy current planned steps
                            tempPlannedSteps = todayStepIds
                        } else {
                            // Exit planning mode - save changes
                            savePlanningChanges()
                        }
                    }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Planning Steps Section
    private var planningStepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Vyberte kroky pro dnešní den")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                ForEach(availableSteps, id: \.id) { step in
                    PlanningStepRow(
                        step: step,
                        isSelected: tempPlannedSteps.contains(step.id),
                        onToggle: {
                            toggleStepSelection(stepId: step.id)
                        }
                    )
                }
            }
            
            if isSavingPlan {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Ukládám plán...")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .padding(.top, DesignSystem.Spacing.sm)
            }
        }
    }
    
    // MARK: - Today Steps Section
    private var todayStepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Dnešní kroky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            if todaySteps.isEmpty {
                EmptyStateView(
                    icon: "calendar.badge.plus",
                    title: "Žádné kroky na dnes",
                    subtitle: "Přidejte kroky nebo přepněte do režimu plánování",
                    actionTitle: "Přidat krok"
                ) {
                    showAddStepModal = true
                }
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(todaySteps, id: \.id) { step in
                        NoWorkflowStepRow(
                            step: step,
                            goalTitle: getGoalTitle(for: step.goalId),
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Inspiration Section
    private var inspirationSection: some View {
        ModernCard {
            VStack(spacing: DesignSystem.Spacing.lg) {
                VStack(spacing: DesignSystem.Spacing.md) {
                    Image(systemName: "party.popper.fill")
                        .font(.system(size: 48))
                        .foregroundColor(DesignSystem.Colors.success)
                        .symbolEffect(.bounce, value: true)
                    
                    Text("Všechny úkoly hotové!")
                        .font(DesignSystem.Typography.title2)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .multilineTextAlignment(.center)
                }
                
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Text("✨ Inspirace pro volný čas")
                        .font(DesignSystem.Typography.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text(currentInspiration)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, DesignSystem.Spacing.md)
                }
            }
            .padding(DesignSystem.Spacing.lg)
        }
    }
    
    // MARK: - Computed Properties
    private var todayStepIds: [String] {
        // Return planned steps from daily planning, or empty array if no planning
        return dailyPlanning?.plannedSteps ?? []
    }
    
    private var todaySteps: [DailyStep] {
        // Return steps that are in today's planning
        let plannedStepIds = dailyPlanning?.plannedSteps ?? []
        return dailySteps.filter { step in
            plannedStepIds.contains(step.id)
        }
    }
    
    private var availableSteps: [DailyStep] {
        // In planning mode: show all incomplete steps
        // In normal mode: show only planned steps
        if isPlanningMode {
            let today = Calendar.current.startOfDay(for: Date())
            return dailySteps.filter { step in
                !step.completed && Calendar.current.startOfDay(for: step.date) <= today
            }
        } else {
            return todaySteps
        }
    }
    
    private var allTodayStepsCompleted: Bool {
        let today = Calendar.current.startOfDay(for: Date())
        let todaySteps = dailySteps.filter { step in
            Calendar.current.startOfDay(for: step.date) == today
        }
        return !todaySteps.isEmpty && todaySteps.allSatisfy { $0.completed }
    }
    
    private func getGoalTitle(for goalId: String?) -> String? {
        guard let goalId = goalId else { return nil }
        return goals.first { $0.id == goalId }?.title
    }
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                async let settingsTask = apiManager.fetchUserSettings()
                async let stepsTask = apiManager.fetchSteps()
                async let goalsTask = apiManager.fetchGoals()
                async let planningTask = apiManager.fetchDailyPlanning(date: Date())
                
                let (settings, steps, goals, planning) = try await (settingsTask, stepsTask, goalsTask, planningTask)
                
                await MainActor.run {
                    self.userSettings = settings
                    self.dailySteps = steps
                    self.goals = goals
                    self.dailyPlanning = planning
                    self.isLoading = false
                    self.updateStepStats()
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
    
    private func updateStepStats() {
        // Use planned steps from daily planning
        let plannedStepIds = dailyPlanning?.plannedSteps ?? []
        let plannedSteps = dailySteps.filter { step in
            plannedStepIds.contains(step.id)
        }
        
        stepStats = (
            completed: plannedSteps.filter { $0.completed }.count,
            total: plannedSteps.count
        )
    }
    
    private func setRandomInspiration() {
        currentInspiration = inspirations.randomElement() ?? inspirations[0]
    }
    
    private func toggleStepSelection(stepId: String) {
        if tempPlannedSteps.contains(stepId) {
            tempPlannedSteps.removeAll { $0 == stepId }
        } else {
            tempPlannedSteps.append(stepId)
        }
    }
    
    private func savePlanningChanges() {
        isSavingPlan = true
        
        Task {
            do {
                let today = Date()
                let savedPlanning = try await apiManager.saveDailyPlanning(date: today, plannedSteps: tempPlannedSteps)
                
                await MainActor.run {
                    // Update daily planning with saved data
                    self.dailyPlanning = savedPlanning
                    isSavingPlan = false
                    isPlanningMode = false
                    tempPlannedSteps = []
                    
                    // Update stats
                    self.updateStepStats()
                }
            } catch {
                await MainActor.run {
                    isSavingPlan = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                guard let currentStep = dailySteps.first(where: { $0.id == stepId }) else {
                    return
                }
                
                let updatedStep = try await apiManager.updateStepCompletion(stepId: stepId, completed: completed, currentStep: currentStep)
                
                await MainActor.run {
                    if let index = dailySteps.firstIndex(where: { $0.id == stepId }) {
                        dailySteps[index] = updatedStep
                        updateStepStats()
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

// MARK: - Planning Step Row Component
struct PlanningStepRow: View {
    let step: DailyStep
    let isSelected: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                // Planning indicator
                Image(systemName: isSelected ? "star.fill" : "star")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.textTertiary)
                
                // Content
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(step.title)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .multilineTextAlignment(.leading)
                    
                    if let goalId = step.goalId {
                        Text("Cíl: \(goalId)") // You might want to show actual goal title
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(isSelected ? DesignSystem.Colors.primary.opacity(0.1) : DesignSystem.Colors.surfaceSecondary)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.textTertiary, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    DailyPlanningView()
}
