import SwiftUI
import Clerk
import WidgetKit

import SwiftUI
import Clerk

struct GoalsView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddGoalModal = false
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám cíle...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header with Add Button
                        headerSection
                        
                        // Goals by Category
                        goalsByCategorySection
                        
                        // Empty State
                        if goals.isEmpty {
                            EmptyStateView(
                                icon: "flag",
                                title: "Zatím nemáte žádné cíle",
                                subtitle: "Přidejte svůj první cíl a začněte svou cestu",
                                actionTitle: "Přidat první cíl"
                            ) {
                                showAddGoalModal = true
                            }
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
            loadGoals()
        }
        .sheet(isPresented: $showAddGoalModal) {
            AddGoalModal(onGoalAdded: {
                loadGoals()
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
                        Text("Moje cíle")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("\(goals.count) cílů celkem")
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
    
    // MARK: - Goals by Category Section
    private var goalsByCategorySection: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            // Short-term Goals
            if !shortTermGoals.isEmpty {
                categorySection(
                    title: "Krátkodobé cíle",
                    icon: "⚡",
                    goals: shortTermGoals,
                    color: DesignSystem.Colors.shortTerm
                )
            }
            
            // Medium-term Goals
            if !mediumTermGoals.isEmpty {
                categorySection(
                    title: "Střednědobé cíle",
                    icon: "🎯",
                    goals: mediumTermGoals,
                    color: DesignSystem.Colors.mediumTerm
                )
            }
            
            // Long-term Goals
            if !longTermGoals.isEmpty {
                categorySection(
                    title: "Dlouhodobé cíle",
                    icon: "🏆",
                    goals: longTermGoals,
                    color: DesignSystem.Colors.longTerm
                )
            }
        }
    }
    
    // MARK: - Category Section
    private func categorySection(title: String, icon: String, goals: [Goal], color: Color) -> some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            CategoryHeader(
                title: title,
                icon: icon,
                count: goals.count,
                color: color
            )
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: DesignSystem.Spacing.md) {
                ForEach(sortedGoals(goals), id: \.id) { goal in
                    ModernGoalCard(
                        goal: goal,
                        onTap: {
                            // TODO: Navigate to goal detail
                        },
                        onEdit: {
                            // TODO: Edit goal
                        },
                        onDelete: {
                            // TODO: Delete goal
                        }
                    )
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    private var shortTermGoals: [Goal] {
        goals.filter { $0.priority == "short-term" || $0.priority == "meaningful" }
    }
    
    private var mediumTermGoals: [Goal] {
        goals.filter { $0.priority == "medium-term" || $0.priority == "nice-to-have" }
    }
    
    private var longTermGoals: [Goal] {
        goals.filter { $0.priority == "long-term" }
    }
    
    private func sortedGoals(_ goals: [Goal]) -> [Goal] {
        goals.sorted { goal1, goal2 in
            // If both have target dates, sort by target date
            if let date1 = goal1.targetDate, let date2 = goal2.targetDate {
                return date1 < date2
            }
            // If only one has target date, prioritize it
            if goal1.targetDate != nil && goal2.targetDate == nil {
                return true
            }
            if goal1.targetDate == nil && goal2.targetDate != nil {
                return false
            }
            // If neither has target date, sort by creation date
            if let created1 = goal1.createdAt, let created2 = goal2.createdAt {
                return created1 > created2
            }
            return false
        }
    }
    
    // MARK: - Data Loading
    private func loadGoals() {
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

struct StepsView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám kroky...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header with Add Button
                        headerSection
                        
                        // Future Steps Only
                        futureStepsSection
                        
                        // Empty State
                        if futureSteps.isEmpty {
                            EmptyStateView(
                                icon: "calendar",
                                title: "Zatím nemáte žádné budoucí kroky",
                                subtitle: "Přidejte svůj první budoucí krok",
                                actionTitle: "Přidat první krok"
                            ) {
                                showAddStepModal = true
                            }
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
        .navigationTitle("Kroky")
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
            loadSteps()
        }
            .sheet(isPresented: $showAddStepModal) {
                AddStepModal(onStepAdded: {
                    loadSteps()
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
                        Text("Budoucí kroky")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("\(futureSteps.count) budoucích kroků")
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
    
    // MARK: - Future Steps Section
    private var futureStepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if !futureSteps.isEmpty {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(sortedSteps(futureSteps), id: \.id) { step in
                        ModernStepCard(
                            step: step,
                            goalTitle: nil, // TODO: Get goal title
                            isOverdue: false,
                            isFuture: true,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                    }
                }
            }
        }
    }
    
    
    // MARK: - Status Section
    private func statusSection(title: String, icon: String, steps: [DailyStep], color: Color) -> some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            CategoryHeader(
                title: title,
                icon: icon,
                count: steps.count,
                color: color
            )
            
            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                ForEach(sortedSteps(steps), id: \.id) { step in
                    ModernStepCard(
                        step: step,
                        goalTitle: nil, // TODO: Get goal title
                        isOverdue: title == "Zpožděné kroky",
                        isFuture: title == "Budoucí kroky",
                        onToggle: {
                            toggleStepCompletion(stepId: step.id, completed: !step.completed)
                        }
                    )
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var futureSteps: [DailyStep] {
        let today = Calendar.current.startOfDay(for: Date())
        return dailySteps.filter { step in
            !step.completed && Calendar.current.startOfDay(for: step.date) > today
        }
    }
    
    
    private func sortedSteps(_ steps: [DailyStep]) -> [DailyStep] {
        steps.sorted { $0.date < $1.date }
    }
    
    // MARK: - Data Loading
    private func loadSteps() {
        Task {
            do {
                let fetchedSteps = try await apiManager.fetchSteps()
                
                await MainActor.run {
                    self.dailySteps = fetchedSteps
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
    
    // MARK: - Step Completion Toggle
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                // Find the current step to get its data
                guard let currentStep = dailySteps.first(where: { $0.id == stepId }) else {
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

struct SettingsView: View {
    @Environment(\.clerk) private var clerk
    @StateObject private var apiManager = APIManager.shared
    @State private var showWidgetSettings = false
    @State private var userSettings: UserSettings?
    @State private var isLoadingSettings = true
    @State private var showWorkflowSettings = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: DesignSystem.Spacing.lg) {
                    // User Profile Section
                    userProfileSection
                    
                    // Settings Options
                    settingsOptionsSection
                    
                    // Workflow Settings
                    workflowSettingsSection
                    
                    // Sign Out Section
                    if clerk.user != nil {
                        signOutSection
                    }
                    
                    // Bottom padding for tab bar
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle("Nastavení")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            loadUserSettings()
        }
        .sheet(isPresented: $showWidgetSettings) {
            SimpleWidgetSettingsView()
        }
        .sheet(isPresented: $showWorkflowSettings) {
            WorkflowSettingsView(
                userSettings: $userSettings,
                onSave: { settings in
                    saveUserSettings(settings)
                }
            )
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - User Profile Section
    private var userProfileSection: some View {
        ModernCard {
            VStack(spacing: DesignSystem.Spacing.md) {
                if let user = clerk.user {
                    // User Avatar
                    ModernIcon(
                        systemName: "person.circle.fill",
                        size: 60,
                        color: DesignSystem.Colors.primary,
                        backgroundColor: DesignSystem.Colors.primary.opacity(0.1)
                    )
                    
                    // User Info
                    VStack(spacing: DesignSystem.Spacing.xs) {
                        Text("Ahoj, \(user.firstName ?? "Uživateli")!")
                            .font(DesignSystem.Typography.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text(user.emailAddresses.first?.emailAddress ?? "N/A")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                } else {
                    // Not signed in state
                    ModernIcon(
                        systemName: "person.circle.fill",
                        size: 60,
                        color: DesignSystem.Colors.textTertiary,
                        backgroundColor: DesignSystem.Colors.surfaceSecondary
                    )
                    
                    Text("Nepřihlášen")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
            }
            .padding(DesignSystem.Spacing.lg)
        }
    }
    
    // MARK: - Settings Options Section
    private var settingsOptionsSection: some View {
        VStack(spacing: DesignSystem.Spacing.sm) {
            ModernSettingsRow(
                icon: "bell",
                title: "Notifikace",
                subtitle: "Správa oznámení",
                action: {}
            )
            
            ModernSettingsRow(
                icon: "moon",
                title: "Tmavý režim",
                subtitle: "Automatické přepínání",
                action: {}
            )
            
            ModernSettingsRow(
                icon: "questionmark.circle",
                title: "Nápověda",
                subtitle: "FAQ a podpora",
                action: {}
            )
            
            ModernSettingsRow(
                icon: "gear.badge",
                title: "Workflow",
                subtitle: userSettings?.workflow == "daily_planning" ? "Denní plánování" : "Všechny kroky",
                action: {
                    showWorkflowSettings = true
                }
            )
            
            ModernSettingsRow(
                icon: "envelope",
                title: "Kontakt",
                subtitle: "Napište nám",
                action: {}
            )
            
            ModernSettingsRow(
                icon: "square.grid.3x3",
                title: "Widget",
                subtitle: "Nastavení widgetu",
                action: {
                    showWidgetSettings = true
                }
            )
        }
    }
    
    // MARK: - Sign Out Section
    private var signOutSection: some View {
        ModernCard {
            Button(action: {
                Task {
                    try? await clerk.signOut()
                }
            }) {
                HStack {
                    ModernIcon(
                        systemName: "arrow.right.square",
                        size: 20,
                        color: DesignSystem.Colors.error
                    )
                    
                    Text("Odhlásit se")
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.error)
                    
                    Spacer()
                }
                .padding(DesignSystem.Spacing.md)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

// MARK: - Modern Settings Row Component
struct ModernSettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        ModernCard {
            Button(action: action) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    ModernIcon(
                        systemName: icon,
                        size: 20,
                        color: DesignSystem.Colors.primary,
                        backgroundColor: DesignSystem.Colors.primary.opacity(0.1)
                    )
                    
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text(title)
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text(subtitle)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
                    
                    ModernIcon(
                        systemName: "chevron.right",
                        size: 16,
                        color: DesignSystem.Colors.textTertiary
                    )
                }
                .padding(DesignSystem.Spacing.md)
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
}

// MARK: - Supporting Views

struct GoalCard: View {
    let goal: Goal
    let onToggleCompletion: () -> Void
    
    var body: some View {
        NavigationLink(destination: GoalDetailView(goal: goal)) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(goal.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .lineLimit(2)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
                
                if let description = goal.description {
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                ProgressView(value: Double(goal.progressPercentage) / 100)
                    .progressViewStyle(LinearProgressViewStyle(tint: .purple))
                
                Text("\(goal.progressPercentage)%")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let targetDate = goal.targetDate {
                    Text("Do: \(targetDate, style: .date)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct StepCard: View {
    let step: DailyStep
    let isOverdue: Bool
    let onToggleCompletion: (String, Bool) -> Void
    
    var body: some View {
        NavigationLink(destination: StepDetailView(step: step)) {
            HStack {
                Button(action: {
                    onToggleCompletion(step.id, !step.completed)
                }) {
                    Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(step.completed ? .green : (isOverdue ? .red : .gray))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(step.title)
                        .font(.subheadline)
                        .strikethrough(step.completed)
                        .foregroundColor(.primary)
                    
                    if let description = step.description, !description.isEmpty {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                    
                    Text(step.date, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Add Goal Modal

struct AddGoalModal: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var goalTitle = ""
    @State private var goalDescription = ""
    @State private var selectedDate = Date()
    @State private var hasTargetDate = false
    @State private var priority = "meaningful"
    @State private var aspirations: [Aspiration] = []
    @State private var selectedAspirationId: String? = nil
    @State private var isLoading = false
    @State private var isLoadingAspirations = false
    @State private var errorMessage = ""
    @State private var showError = false
    let onGoalAdded: () -> Void
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Název cíle")
                            .font(.headline)
                        TextField("Např. Naučit se španělsky", text: $goalTitle)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Popis (volitelné)")
                            .font(.headline)
                        TextField("Popište svůj cíl podrobněji...", text: $goalDescription, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .lineLimit(3...6)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Aspirace (volitelné)")
                            .font(.headline)
                        
                        if isLoadingAspirations {
                            ProgressView()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        } else if aspirations.isEmpty {
                            Text("Žádné aspirace")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.vertical, 8)
                        } else {
                            Picker("Aspirace", selection: $selectedAspirationId) {
                                Text("Bez aspirace").tag(nil as String?)
                                ForEach(aspirations, id: \.id) { aspiration in
                                    Text(aspiration.title).tag(aspiration.id as String?)
                                }
                            }
                            .pickerStyle(.menu)
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Priorita")
                            .font(.headline)
                        Picker("Priorita", selection: $priority) {
                            Text("Smysluplné").tag("meaningful")
                            Text("Příjemné").tag("nice-to-have")
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Toggle("Máte cílové datum?", isOn: $hasTargetDate)
                            .font(.headline)
                        
                        if hasTargetDate {
                            DatePicker("Cílové datum", selection: $selectedDate, displayedComponents: .date)
                                .datePickerStyle(CompactDatePickerStyle())
                        }
                    }
                    
                    Spacer(minLength: 20)
                }
                .padding()
            }
            .navigationTitle("Přidat cíl")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Přidat") {
                        addGoal()
                    }
                    .disabled(goalTitle.isEmpty || isLoading)
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .task {
                await loadAspirations()
            }
        }
    }
    
    private func loadAspirations() async {
        isLoadingAspirations = true
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            await MainActor.run {
                self.aspirations = fetchedAspirations
                self.isLoadingAspirations = false
            }
        } catch {
            await MainActor.run {
                self.isLoadingAspirations = false
            }
        }
    }
    
    private func addGoal() {
        isLoading = true
        
        Task {
            do {
                let goalRequest = CreateGoalRequest(
                    title: goalTitle,
                    description: goalDescription.isEmpty ? nil : goalDescription,
                    targetDate: hasTargetDate ? selectedDate : nil,
                    priority: priority,
                    icon: nil,
                    aspirationId: selectedAspirationId
                )
                
                _ = try await apiManager.createGoal(goalRequest)
                
                await MainActor.run {
                    isLoading = false
                    onGoalAdded()
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Add Step Modal

struct AddStepModal: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var stepTitle = ""
    @State private var stepDescription = ""
    @State private var selectedDate: Date
    @State private var selectedGoalId: String? = nil
    @State private var goals: [Goal] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    let onStepAdded: () -> Void
    
    init(initialDate: Date = Date(), onStepAdded: @escaping () -> Void) {
        _selectedDate = State(initialValue: initialDate)
        self.onStepAdded = onStepAdded
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Title Field
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        HStack {
                            Text("Název kroku")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            Text("*")
                                .foregroundColor(DesignSystem.Colors.primary)
                        }
                        TextField("Např. Pravidelně šetřit", text: $stepTitle)
                            .font(DesignSystem.Typography.body)
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.textTertiary.opacity(0.3), lineWidth: 1)
                            )
                    }
                    
                    // Description Field
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Popis (volitelné)")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        TextField("Popište krok podrobněji...", text: $stepDescription, axis: .vertical)
                            .font(DesignSystem.Typography.body)
                            .padding(DesignSystem.Spacing.md)
                            .frame(minHeight: 100, alignment: .top)
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.textTertiary.opacity(0.3), lineWidth: 1)
                            )
                            .lineLimit(4...8)
                    }
                    
                    // Date and Goal in two columns
                    HStack(spacing: DesignSystem.Spacing.md) {
                        // Date Field
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                            Text("Datum")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            DatePicker("", selection: $selectedDate, displayedComponents: .date)
                                .datePickerStyle(.compact)
                                .labelsHidden()
                                .padding(DesignSystem.Spacing.sm)
                                .background(DesignSystem.Colors.surface)
                                .cornerRadius(DesignSystem.CornerRadius.md)
                        }
                        
                        // Goal Field
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                            Text("Cíl (volitelné)")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            if goals.isEmpty {
                                Text("Žádné cíle")
                                    .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                    .padding(DesignSystem.Spacing.sm)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(DesignSystem.Colors.surfaceSecondary)
                                    .cornerRadius(DesignSystem.CornerRadius.md)
                            } else {
                                Picker("", selection: $selectedGoalId) {
                                    Text("Bez cíle").tag(nil as String?)
                                    ForEach(goals, id: \.id) { goal in
                                        Text(goal.title).tag(goal.id as String?)
                                    }
                                }
                                .pickerStyle(.menu)
                                .padding(DesignSystem.Spacing.sm)
                                .background(DesignSystem.Colors.surface)
                                .cornerRadius(DesignSystem.CornerRadius.md)
                            }
                        }
                    }
                    
                    // Add Button
                    Button(action: {
                        addStep()
                    }) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Přidat krok")
                                    .font(DesignSystem.Typography.headline)
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(DesignSystem.Spacing.md)
                        .background(stepTitle.isEmpty || isLoading ? DesignSystem.Colors.textTertiary : DesignSystem.Colors.primary)
                        .foregroundColor(.white)
                        .cornerRadius(DesignSystem.CornerRadius.md)
                    }
                    .disabled(stepTitle.isEmpty || isLoading)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Nový krok")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .onAppear {
                loadGoals()
            }
        }
    }
    
    private func loadGoals() {
        Task {
            do {
                let fetchedGoals = try await apiManager.fetchGoals()
                await MainActor.run {
                    self.goals = fetchedGoals
                }
            } catch {
            }
        }
    }
    
    private func addStep() {
        isLoading = true
        
        Task {
            do {
                let stepRequest = CreateStepRequest(
                    title: stepTitle,
                    description: stepDescription.isEmpty ? nil : stepDescription,
                    date: selectedDate,
                    goalId: selectedGoalId
                )
                
                _ = try await apiManager.createStep(stepRequest)
                
                await MainActor.run {
                    isLoading = false
                    onStepAdded()
                    dismiss()
                }
            } catch {
                print("❌ Error creating step: \(error.localizedDescription)")
                await MainActor.run {
                    isLoading = false
                    errorMessage = "Chyba při vytváření kroku: \(error.localizedDescription)"
                    showError = true
                }
            }
        }
    }
}

// MARK: - Detail Views

struct StepDetailView: View {
    let step: DailyStep
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Step Title
                    Text(step.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    // Step Description
                    if let description = step.description, !description.isEmpty {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                    }
                    
                    // Date Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Datum")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        Text(step.date, style: .date)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                    }
                    
                    // Status Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Status")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        HStack {
                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(step.completed ? .green : .gray)
                            
                            Text(step.completed ? "Dokončeno" : "Nedokončeno")
                                .font(.subheadline)
                                .foregroundColor(step.completed ? .green : .orange)
                        }
                        .padding(.horizontal)
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("Detail kroku")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zavřít") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(step.completed ? "Označit jako nedokončené" : "Označit jako dokončené") {
                        toggleCompletion()
                    }
                    .disabled(isLoading)
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func toggleCompletion() {
        isLoading = true
        
        Task {
            do {
                _ = try await apiManager.updateStepCompletion(stepId: step.id, completed: !step.completed, currentStep: step)
                
                await MainActor.run {
                    isLoading = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

struct GoalDetailView: View {
    let goal: Goal
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showEditAspiration = false
    @State private var aspirations: [Aspiration] = []
    @State private var selectedAspirationId: String? = nil
    @State private var isLoadingAspirations = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Goal Title
                    Text(goal.title)
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    // Goal Description
                    if let description = goal.description, !description.isEmpty {
                        Text(description)
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                    }
                    
                    // Aspiration Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Aspirace")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if showEditAspiration {
                            if isLoadingAspirations {
                                ProgressView()
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding()
                            } else if aspirations.isEmpty {
                                Text("Žádné aspirace")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal)
                            } else {
                                Picker("Aspirace", selection: $selectedAspirationId) {
                                    Text("Bez aspirace").tag(nil as String?)
                                    ForEach(aspirations, id: \.id) { aspiration in
                                        Text(aspiration.title).tag(aspiration.id as String?)
                                    }
                                }
                                .pickerStyle(.menu)
                                .padding(.horizontal)
                                
                                HStack {
                                    Button("Zrušit") {
                                        selectedAspirationId = goal.aspirationId
                                        showEditAspiration = false
                                    }
                                    .foregroundColor(.secondary)
                                    
                                    Spacer()
                                    
                                    Button("Uložit") {
                                        saveAspiration()
                                    }
                                    .foregroundColor(.blue)
                                    .disabled(isLoading)
                                }
                                .padding(.horizontal)
                            }
                        } else {
                            HStack {
                                if let aspirationId = goal.aspirationId,
                                   let aspiration = aspirations.first(where: { $0.id == aspirationId }) {
                                    HStack {
                                        Circle()
                                            .fill(colorFromHex(aspiration.color))
                                            .frame(width: 12, height: 12)
                                        Text(aspiration.title)
                                            .font(.subheadline)
                                    }
                                    .foregroundColor(.secondary)
                                } else {
                                    Text("Bez aspirace")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Button("Změnit") {
                                    selectedAspirationId = goal.aspirationId
                                    Task {
                                        await loadAspirations()
                                    }
                                    showEditAspiration = true
                                }
                                .font(.subheadline)
                                .foregroundColor(.blue)
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    // Progress Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Pokrok")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ProgressView(value: Double(goal.progressPercentage) / 100)
                            .progressViewStyle(LinearProgressViewStyle(tint: .purple))
                            .padding(.horizontal)
                        
                        Text("\(goal.progressPercentage)% dokončeno")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.horizontal)
                    }
                    
                    // Target Date
                    if let targetDate = goal.targetDate {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Cílové datum")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            Text(targetDate, style: .date)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        }
                    }
                    
                    // Status
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Status")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        Text(goal.status == "completed" ? "Dokončeno" : "V průběhu")
                            .font(.subheadline)
                            .foregroundColor(goal.status == "completed" ? .green : .orange)
                            .padding(.horizontal)
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("Detail cíle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zavřít") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    if goal.status != "completed" {
                        Button("Dokončit") {
                            completeGoal()
                        }
                        .disabled(isLoading)
                    }
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .task {
                await loadAspirations()
            }
        }
    }
    
    private func loadAspirations() async {
        isLoadingAspirations = true
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            await MainActor.run {
                self.aspirations = fetchedAspirations
                self.isLoadingAspirations = false
            }
        } catch {
            await MainActor.run {
                self.isLoadingAspirations = false
            }
        }
    }
    
    private func saveAspiration() {
        isLoading = true
        
        Task {
            do {
                _ = try await apiManager.updateGoal(
                    goalId: goal.id,
                    title: nil,
                    description: nil,
                    targetDate: nil,
                    aspirationId: selectedAspirationId
                )
                
                await MainActor.run {
                    isLoading = false
                    showEditAspiration = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func completeGoal() {
        isLoading = true
        
        Task {
            // TODO: Implement goal completion in APIManager
            
            await MainActor.run {
                isLoading = false
                dismiss()
            }
        }
    }
    
    private func colorFromHex(_ hex: String) -> Color {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        
        Scanner(string: hexSanitized).scanHexInt64(&rgb)
        
        let red = Double((rgb & 0xFF0000) >> 16) / 255.0
        let green = Double((rgb & 0x00FF00) >> 8) / 255.0
        let blue = Double(rgb & 0x0000FF) / 255.0
        
        return Color(red: red, green: green, blue: blue)
    }
}

#Preview {
        GoalsView()
}

// MARK: - Widget Settings
enum WidgetType: String, CaseIterable {
    case todaySteps = "today_steps"
    case futureSteps = "future_steps"
    case inspiration = "inspiration"
    
    var displayName: String {
        switch self {
        case .todaySteps:
            return "Dnešní kroky"
        case .futureSteps:
            return "Dnešní a budoucí"
        case .inspiration:
            return "Inspirace"
        }
    }
}

struct SimpleWidgetSettingsView: View {
    @State private var selectedWidgetType: WidgetType = .todaySteps
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Vyberte typ widgetu")
                    .font(.title2)
                    .fontWeight(.bold)
                    .padding(.top, 20)
                
                    VStack(spacing: 16) {
                        ForEach(WidgetType.allCases, id: \.self) { widgetType in
                            widgetTypeButton(widgetType)
                        }
                    }
                .padding(.horizontal, 16)
                
                Spacer()
            }
            .background(Color(.systemBackground))
        }
        .navigationTitle("Widget")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Hotovo") {
                    dismiss()
                }
            }
        }
        .onAppear {
            loadSettings()
        }
    }
    
    private func widgetTypeButton(_ widgetType: WidgetType) -> some View {
        Button(action: {
            selectedWidgetType = widgetType
            saveSettings()
        }) {
            HStack {
                Text(widgetType.displayName)
                    .font(.headline)
                    .foregroundColor(selectedWidgetType == widgetType ? .white : .primary)
                
                Spacer()
                
                if selectedWidgetType == widgetType {
                    Image(systemName: "checkmark")
                        .foregroundColor(.white)
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(selectedWidgetType == widgetType ? Color.orange : Color(.systemGray6))
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func loadSettings() {
        guard let userDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrok"),
              let rawValue = userDefaults.string(forKey: "selected_widget_type"),
              let widgetType = WidgetType(rawValue: rawValue) else {
            selectedWidgetType = .todaySteps
            return
        }
        selectedWidgetType = widgetType
    }
    
    private func saveSettings() {
        guard let userDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrok") else { return }
        
        userDefaults.set(selectedWidgetType.rawValue, forKey: "selected_widget_type")
        userDefaults.synchronize()
        
        
        // Refresh all widgets
        WidgetCenter.shared.reloadAllTimelines()
    }
}

// MARK: - Workflow Settings Section
extension SettingsView {
    private var workflowSettingsSection: some View {
        VStack(spacing: DesignSystem.Spacing.sm) {
            Text("Workflow nastavení")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ModernCard {
                VStack(spacing: DesignSystem.Spacing.md) {
                    HStack {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Aktuální workflow")
                                .font(DesignSystem.Typography.body)
                                .fontWeight(.medium)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            Text(userSettings?.workflow == "daily_planning" ? "Denní plánování" : "Všechny kroky")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            showWorkflowSettings = true
                        }) {
                            Text("Změnit")
                                .font(DesignSystem.Typography.caption)
                                .fontWeight(.medium)
                                .foregroundColor(DesignSystem.Colors.primary)
                        }
                    }
                    
                    if let settings = userSettings {
                        HStack {
                            Text("Denní kroky: \(settings.dailyStepsCount)")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                            
                            Spacer()
                        }
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
        }
    }
    
    // MARK: - Helper Methods
    private func loadUserSettings() {
        Task {
            do {
                let settings = try await apiManager.fetchUserSettings()
                await MainActor.run {
                    self.userSettings = settings
                    self.isLoadingSettings = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoadingSettings = false
                }
            }
        }
    }
    
    private func saveUserSettings(_ settings: UserSettings) {
        Task {
            do {
                let updatedSettings = try await apiManager.updateUserSettings(
                    dailyStepsCount: settings.dailyStepsCount,
                    workflow: settings.workflow,
                    filters: settings.filters
                )
                await MainActor.run {
                    self.userSettings = updatedSettings
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
}

// MARK: - Workflow Settings View
struct WorkflowSettingsView: View {
    @Binding var userSettings: UserSettings?
    let onSave: (UserSettings) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedWorkflow: String = "daily_planning"
    @State private var dailyStepsCount: Int = 3
    @State private var isSaving = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("Typ workflow") {
                    Picker("Workflow", selection: $selectedWorkflow) {
                        Text("Denní plánování").tag("daily_planning")
                        Text("Všechny kroky").tag("no_workflow")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
                
                if selectedWorkflow == "daily_planning" {
                    Section("Denní plánování") {
                        Stepper("Počet denních kroků: \(dailyStepsCount)", value: $dailyStepsCount, in: 1...10)
                    }
                }
                
                Section {
                    Text("Denní plánování zobrazuje pouze kroky naplánované na dnešní den s možností plánování.")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    Text("Všechny kroky zobrazuje všechny kroky s možností filtrování a řazení.")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            .navigationTitle("Workflow nastavení")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Uložit") {
                        saveSettings()
                    }
                    .disabled(isSaving)
                }
            }
        }
        .onAppear {
            if let settings = userSettings {
                selectedWorkflow = settings.workflow
                dailyStepsCount = settings.dailyStepsCount
            }
        }
    }
    
    private func saveSettings() {
        guard let currentSettings = userSettings else { return }
        
        isSaving = true
        
        let updatedSettings = UserSettings(
            id: currentSettings.id,
            userId: currentSettings.userId,
            dailyStepsCount: dailyStepsCount,
            workflow: selectedWorkflow,
            filters: currentSettings.filters,
            createdAt: currentSettings.createdAt,
            updatedAt: Date()
        )
        
        onSave(updatedSettings)
        dismiss()
    }
}
