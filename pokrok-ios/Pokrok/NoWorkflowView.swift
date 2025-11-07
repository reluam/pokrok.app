import SwiftUI

struct NoWorkflowView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    @State private var showFilters = false
    @State private var searchText = ""
    
    // Filter settings
    @State private var filters = FilterSettings(
        showToday: true,
        showOverdue: true,
        showFuture: false,
        showWithGoal: true,
        showWithoutGoal: true,
        sortBy: "date"
    )
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám všechny kroky...")
            } else {
                VStack(spacing: 0) {
                    // Search bar
                    SearchBar(text: $searchText)
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        .padding(.top, DesignSystem.Spacing.sm)
                    
                    // Filter bar
                    filterBar
                    
                    // Steps list
                    if filteredSteps.isEmpty {
                        emptyStateView
                    } else {
                        ScrollView {
                            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                                ForEach(filteredSteps, id: \.id) { step in
                                    NoWorkflowStepRow(
                                        step: step,
                                        goalTitle: getGoalTitle(for: step.goalId),
                                        onToggle: {
                                            toggleStepCompletion(stepId: step.id, completed: !step.completed)
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, DesignSystem.Spacing.md)
                            .padding(.top, DesignSystem.Spacing.md)
                        }
                    }
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Všechny kroky")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack {
                    Button(action: {
                        showFilters.toggle()
                    }) {
                        ModernIcon(
                            systemName: "line.3.horizontal.decrease.circle",
                            size: 18,
                            color: DesignSystem.Colors.primary
                        )
                    }
                    
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
        }
        .onAppear {
            loadData()
        }
        .sheet(isPresented: $showAddStepModal) {
            AddStepModal(onStepAdded: {
                loadData()
            })
        }
        .sheet(isPresented: $showFilters) {
            FilterSettingsView(filters: $filters)
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Filter Bar
    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                FilterChip(
                    title: "Dnešní",
                    isSelected: filters.showToday,
                    action: { filters.showToday.toggle() }
                )
                
                FilterChip(
                    title: "Zpožděné",
                    isSelected: filters.showOverdue,
                    action: { filters.showOverdue.toggle() }
                )
                
                FilterChip(
                    title: "Budoucí",
                    isSelected: filters.showFuture,
                    action: { filters.showFuture.toggle() }
                )
                
                FilterChip(
                    title: "S cílem",
                    isSelected: filters.showWithGoal,
                    action: { filters.showWithGoal.toggle() }
                )
                
                FilterChip(
                    title: "Bez cíle",
                    isSelected: filters.showWithoutGoal,
                    action: { filters.showWithoutGoal.toggle() }
                )
            }
            .padding(.horizontal, DesignSystem.Spacing.md)
        }
        .padding(.vertical, DesignSystem.Spacing.sm)
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: DesignSystem.Spacing.xl) {
            Spacer()
            
            Image(systemName: "list.bullet")
                .font(.system(size: 64))
                .foregroundColor(DesignSystem.Colors.textTertiary)
            
            VStack(spacing: DesignSystem.Spacing.sm) {
                Text("Žádné kroky")
                    .font(DesignSystem.Typography.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text("Přidejte svůj první krok nebo upravte filtry")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: {
                showAddStepModal = true
            }) {
                Text("Přidat krok")
                    .font(DesignSystem.Typography.body)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .padding(.horizontal, DesignSystem.Spacing.lg)
                    .padding(.vertical, DesignSystem.Spacing.md)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .fill(DesignSystem.Colors.primary)
                    )
            }
            
            Spacer()
        }
        .padding(.horizontal, DesignSystem.Spacing.lg)
    }
    
    // MARK: - Computed Properties
    private var filteredSteps: [DailyStep] {
        let today = Calendar.current.startOfDay(for: Date())
        var steps = dailySteps.filter { step in
            // Search filter
            if !searchText.isEmpty {
                if !step.title.localizedCaseInsensitiveContains(searchText) {
                    return false
                }
            }
            
            // Date filters
            let stepDate = Calendar.current.startOfDay(for: step.date)
            let isToday = stepDate == today
            let isOverdue = stepDate < today
            let isFuture = stepDate > today
            
            if isToday && !filters.showToday { return false }
            if isOverdue && !filters.showOverdue { return false }
            if isFuture && !filters.showFuture { return false }
            
            // Goal filters
            let hasGoal = step.goalId != nil
            if hasGoal && !filters.showWithGoal { return false }
            if !hasGoal && !filters.showWithoutGoal { return false }
            
            return true
        }
        
        // Sort
        switch filters.sortBy {
        case "priority":
            steps.sort { step1, step2 in
                // You might want to add priority field to DailyStep
                return step1.title < step2.title
            }
        case "title":
            steps.sort { $0.title < $1.title }
        default: // "date"
            steps.sort { $0.date < $1.date }
        }
        
        return steps
    }
    
    private func getGoalTitle(for goalId: String?) -> String? {
        guard let goalId = goalId else { return nil }
        return goals.first { $0.id == goalId }?.title
    }
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                // Calculate date range: last 30 days to next 30 days (optimized)
                let calendar = Calendar.current
                let today = Date()
                let startDate = calendar.date(byAdding: .day, value: -30, to: today) ?? today
                let endDate = calendar.date(byAdding: .day, value: 30, to: today) ?? today
                
                async let stepsTask = apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                async let goalsTask = apiManager.fetchGoals()
                
                let (steps, goals) = try await (stepsTask, goalsTask)
                
                await MainActor.run {
                    self.dailySteps = steps
                    self.goals = goals
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

// MARK: - Filter Chip Component
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(DesignSystem.Typography.caption)
                .fontWeight(.medium)
                .foregroundColor(isSelected ? .white : DesignSystem.Colors.primary)
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.vertical, DesignSystem.Spacing.sm)
                .background(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                        .fill(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.primary.opacity(0.1))
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - No Workflow Step Row Component
struct NoWorkflowStepRow: View {
    let step: DailyStep
    let goalTitle: String?
    let onToggle: () -> Void
    
    @State private var isAnimating = false
    
    private var statusInfo: (text: String, color: Color) {
        let today = Calendar.current.startOfDay(for: Date())
        let stepDate = Calendar.current.startOfDay(for: step.date)
        
        if stepDate < today {
            return ("Zpožděno", DesignSystem.Colors.error)
        } else if stepDate == today {
            return ("Dnešní", DesignSystem.Colors.primary)
        } else {
            return ("Budoucí", DesignSystem.Colors.textSecondary)
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
                    
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        isAnimating = false
                    }
                    
                    onToggle()
                }) {
                    Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 20))
                        .foregroundColor(step.completed ? DesignSystem.Colors.success : statusInfo.color)
                        .scaleEffect(isAnimating ? 1.3 : 1.0)
                        .background(
                            Circle()
                                .fill(isAnimating ? (step.completed ? DesignSystem.Colors.success.opacity(0.2) : statusInfo.color.opacity(0.2)) : Color.clear)
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
                        .multilineTextAlignment(.leading)
                    
                    HStack {
                        if let goalTitle = goalTitle {
                            Text(goalTitle)
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                        
                        Spacer()
                        
                        Text(formatDate(step.date))
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
                
                Spacer()
                
                // Status indicator
                Text(statusInfo.text)
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.medium)
                    .foregroundColor(statusInfo.color)
                    .padding(.horizontal, DesignSystem.Spacing.sm)
                    .padding(.vertical, DesignSystem.Spacing.xs)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .fill(statusInfo.color.opacity(0.1))
                    )
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(step.completed ? DesignSystem.Colors.surfaceSecondary : DesignSystem.Colors.background)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(statusInfo.color.opacity(0.2), lineWidth: 0.5)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

// MARK: - Filter Settings View
struct FilterSettingsView: View {
    @Binding var filters: FilterSettings
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            List {
                Section("Zobrazit kroky") {
                    Toggle("Dnešní", isOn: $filters.showToday)
                    Toggle("Zpožděné", isOn: $filters.showOverdue)
                    Toggle("Budoucí", isOn: $filters.showFuture)
                }
                
                Section("Typ kroků") {
                    Toggle("S cílem", isOn: $filters.showWithGoal)
                    Toggle("Bez cíle", isOn: $filters.showWithoutGoal)
                }
                
                Section("Řazení") {
                    Picker("Řadit podle", selection: $filters.sortBy) {
                        Text("Datum").tag("date")
                        Text("Priorita").tag("priority")
                        Text("Název").tag("title")
                    }
                    .pickerStyle(SegmentedPickerStyle())
                }
            }
            .navigationTitle("Filtry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Hotovo") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NoWorkflowView()
}
