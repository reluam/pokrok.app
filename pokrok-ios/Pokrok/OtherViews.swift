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

struct SettingsView: View {
    @Environment(\.clerk) private var clerk
    @State private var showWidgetSettings = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: DesignSystem.Spacing.lg) {
                    // User Profile Section
                    userProfileSection
                    
                    // Settings Options
                    settingsOptionsSection
                    
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
        .sheet(isPresented: $showWidgetSettings) {
            SimpleWidgetSettingsView()
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
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    let onGoalAdded: () -> Void
    
    var body: some View {
        NavigationView {
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
                
                Spacer()
            }
                    .padding()
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
                    icon: nil
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
    @State private var selectedDate = Date()
    @State private var selectedGoalId: String? = nil
    @State private var goals: [Goal] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    let onStepAdded: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Název kroku")
                        .font(.headline)
                    TextField("Např. Pravidelně šetřit", text: $stepTitle)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Popis (volitelné)")
                        .font(.headline)
                    TextField("Popište krok podrobněji...", text: $stepDescription, axis: .vertical)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .lineLimit(3...6)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Datum")
                        .font(.headline)
                    DatePicker("Vyberte datum", selection: $selectedDate, displayedComponents: .date)
                        .datePickerStyle(CompactDatePickerStyle())
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Cíl (volitelné)")
                        .font(.headline)
                    
                    if goals.isEmpty {
                        Text("Žádné cíle nejsou k dispozici")
                            .foregroundColor(.secondary)
                            .font(.caption)
                    } else {
                        Picker("Vyberte cíl", selection: $selectedGoalId) {
                            Text("Bez cíle").tag(nil as String?)
                            ForEach(goals, id: \.id) { goal in
                                Text(goal.title).tag(goal.id as String?)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                    }
                }
                
                Spacer()
        }
        .padding()
            .navigationTitle("Přidat krok")
        .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Přidat") {
                        addStep()
                    }
                    .disabled(stepTitle.isEmpty || isLoading)
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
                print("❌ Failed to load goals: \(error)")
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
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
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
        }
    }
    
    private func completeGoal() {
        isLoading = true
        
        Task {
            // TODO: Implement goal completion in APIManager
            print("Completing goal: \(goal.title)")
            
            await MainActor.run {
                isLoading = false
                dismiss()
            }
        }
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
        
        print("🔧 Widget Settings: Saved widget type: \(selectedWidgetType.rawValue)")
        
        // Refresh all widgets
        WidgetCenter.shared.reloadAllTimelines()
    }
}
