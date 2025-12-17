import SwiftUI
import Clerk
import WidgetKit

// MARK: - Combined Date Picker Component with Steps and Habits Progress
struct CombinedDatePicker: View {
    @ObservedObject private var dateManager = DateSelectionManager.shared
    var completedSteps: Int
    var totalSteps: Int
    var completedHabits: Int
    var totalHabits: Int
    
    private var selectedDate: Date {
        dateManager.selectedDate
    }
    
    private var combinedCompleted: Int {
        completedSteps + completedHabits
    }
    
    private var combinedTotal: Int {
        totalSteps + totalHabits
    }
    
    private var combinedProgress: Double {
        guard combinedTotal > 0 else { return 0 }
        return min(Double(combinedCompleted) / Double(combinedTotal), 1.0)
    }
    
    private let calendar = Calendar.current
    
    private var dayName: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "EEEE"
        return formatter.string(from: selectedDate).capitalized
    }
    
    private var monthName: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "MMMM"
        return formatter.string(from: selectedDate)
    }
    
    private var dayNumber: Int {
        calendar.component(.day, from: selectedDate)
    }
    
    private var isToday: Bool {
        calendar.isDate(selectedDate, inSameDayAs: Date())
    }
    
    private var isPast: Bool {
        let today = calendar.startOfDay(for: Date())
        let selectedDay = calendar.startOfDay(for: selectedDate)
        return selectedDay < today
    }
    
    private var isFuture: Bool {
        let today = calendar.startOfDay(for: Date())
        let selectedDay = calendar.startOfDay(for: selectedDate)
        return selectedDay > today
    }
    
    private var cardBackgroundColor: Color {
        if isToday {
            return DesignSystem.Colors.dynamicPrimaryLight
        } else {
            return DesignSystem.Colors.dynamicPrimaryLight
                .mix(with: DesignSystem.Colors.surface, by: 0.5)
        }
    }
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.xs) {
            // Custom card with better background color control for contrast
            HStack(alignment: .center, spacing: DesignSystem.Spacing.md) {
                // Left arrow button
                Button(action: {
                    if let prevDate = calendar.date(byAdding: .day, value: -1, to: selectedDate) {
                        dateManager.selectedDate = prevDate
                    }
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                        .frame(width: 24, height: 24)
                }
                
                // Two columns: Date info and Progress info
                HStack(alignment: .center, spacing: DesignSystem.Spacing.md) {
                    // Left column: Day name and day number
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        // Day name (e.g., "Pondělí")
                        Text(dayName)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        // Day number (e.g., "24")
                        Text("\(dayNumber)")
                            .font(DesignSystem.Typography.title1)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }
                    
                    Spacer()
                    
                    // Right column: Progress bar and percentage with steps and habits count
                    VStack(alignment: .trailing, spacing: DesignSystem.Spacing.xs) {
                        // Progress bar - using full primary color (same as border)
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                // Background
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(DesignSystem.Colors.surfaceSecondary)
                                    .frame(height: 6)
                                
                                // Progress - using full primary color
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(DesignSystem.Colors.dynamicPrimary)
                                    .frame(width: geometry.size.width * combinedProgress, height: 6)
                                    .animation(.easeInOut(duration: 0.3), value: combinedProgress)
                                
                                // Outline - using full primary color (same as fill)
                                RoundedRectangle(cornerRadius: 3)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                    .frame(height: 6)
                            }
                        }
                        .frame(height: 6)
                        
                        // Percentage and fraction with steps and habits breakdown
                        let percentage = Int(combinedProgress * 100)
                        Text("\(percentage)% (\(combinedCompleted)/\(combinedTotal))")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
                
                // Right arrow button
                Button(action: {
                    if let nextDate = calendar.date(byAdding: .day, value: 1, to: selectedDate) {
                        dateManager.selectedDate = nextDate
                    }
                }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                        .frame(width: 24, height: 24)
                }
            }
            .padding(DesignSystem.Spacing.sm)
            .background(cardBackgroundColor)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
            )
            .cornerRadius(DesignSystem.CornerRadius.lg)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                    .fill(DesignSystem.Shadows.card)
                    .offset(
                        x: DesignSystem.Shadows.cardOffsetX,
                        y: DesignSystem.Shadows.cardOffsetY
                    )
            )
            
            // "Přejít na dnešek" link (only if not today)
            if !isToday {
                Button(action: {
                    dateManager.selectedDate = Date()
                }) {
                    Text("Přejít na dnešek")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
    }
}

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
                    .transition(.opacity)
                    .animation(.easeInOut, value: isLoading)
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
        PlayfulCard(variant: .pink) {
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
                    
                    PlayfulButton(
                        variant: .pink,
                        size: .sm,
                        title: "Přidat cíl",
                        action: {
                        showAddGoalModal = true
                        }
                            )
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
                    PlayfulGoalCard(
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
    @ObservedObject private var dateManager = DateSelectionManager.shared
    @ObservedObject private var stepsDataProvider = StepsDataProvider.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    
    private var selectedDate: Date {
        dateManager.selectedDate
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám kroky...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Combined Date Picker with Steps and Habits Progress
                        CombinedDatePicker(
                            completedSteps: stepsForSelectedDate.filter { $0.completed }.count,
                            totalSteps: stepsForSelectedDate.count,
                            completedHabits: HabitsDataProvider.shared.getCompletedHabitsCount(for: selectedDate),
                            totalHabits: HabitsDataProvider.shared.getTotalHabitsCount(for: selectedDate)
                        )
                            .padding(.top, DesignSystem.Spacing.md)
                        
                        // Steps for selected date
                        stepsForSelectedDateSection
                        
                        // Overdue steps for selected date
                        overdueStepsSection
                        
                        // Empty State
                        if stepsForSelectedDate.isEmpty && overdueStepsForSelectedDate.isEmpty {
                            EmptyStateView(
                                icon: "calendar",
                                title: "Zatím nemáte žádné kroky pro tento den",
                                subtitle: "Přidejte svůj první krok",
                                actionTitle: "Přidat první krok"
                            ) {
                                showAddStepModal = true
                            }
                        }
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
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
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
        .onAppear {
            loadSteps()
        }
        .onChange(of: selectedDate) { _, _ in
            // Optional: reload if needed when date changes
        }
            .sheet(isPresented: $showAddStepModal) {
            AddStepModal(initialDate: selectedDate, onStepAdded: {
                    loadSteps()
                })
            }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Steps for Selected Date Section
    private var stepsForSelectedDateSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if !stepsForSelectedDate.isEmpty {
                Text("Kroky")
                    .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(sortedSteps(stepsForSelectedDate), id: \.id) { step in
                        let goal = goals.first { $0.id == step.goalId }
                        let calendar = Calendar.current
                        let today = calendar.startOfDay(for: Date())
                        let stepDate = calendar.startOfDay(for: step.date)
                        let isFuture = stepDate > today
                        
                        PlayfulStepCard(
                            step: step,
                            goalTitle: goal?.title,
                            isOverdue: false,
                            isFuture: isFuture,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                            )
                    }
                }
            }
        }
    }
    
    // MARK: - Overdue Steps Section
    private var overdueStepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if !overdueStepsForSelectedDate.isEmpty {
                Text("Zpožděné kroky")
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(sortedSteps(overdueStepsForSelectedDate), id: \.id) { step in
                        let goal = goals.first { $0.id == step.goalId }
                        
                        PlayfulStepCard(
                            step: step,
                            goalTitle: goal?.title,
                            isOverdue: true,
                            isFuture: false,
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
                    let goal = goals.first { $0.id == step.goalId }
                    PlayfulStepCard(
                        step: step,
                        goalTitle: goal?.title,
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
    
    private var progressPercentageValue: Double {
        let completedSteps = stepsForSelectedDate.filter { $0.completed }.count
        let totalSteps = stepsForSelectedDate.count
        guard totalSteps > 0 else { return 0 }
        return min(Double(completedSteps) / Double(totalSteps), 1.0)
    }
    
    private var stepsForSelectedDate: [DailyStep] {
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: selectedDate)
        
        return dailySteps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
    }
    
    private var overdueStepsForSelectedDate: [DailyStep] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let selectedStartOfDay = calendar.startOfDay(for: selectedDate)
        
        return dailySteps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            // Overdue steps are those that were due on or before selected date but not completed and before today
            return !step.completed && stepStartOfDay <= selectedStartOfDay && stepStartOfDay < today
        }
    }
    
    private func sortedSteps(_ steps: [DailyStep]) -> [DailyStep] {
        steps.sorted { $0.date < $1.date }
    }
    
    // MARK: - Data Loading
    private func loadSteps() {
        Task {
            do {
                // Calculate date range: last 30 days to next 30 days (optimized)
                let calendar = Calendar.current
                let today = Date()
                let startDate = calendar.date(byAdding: .day, value: -30, to: today) ?? today
                let endDate = calendar.date(byAdding: .day, value: 30, to: today) ?? today
                
                async let stepsTask = apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                async let goalsTask = apiManager.fetchGoals()
                
                let fetchedSteps = try await stepsTask
                let fetchedGoals = try await goalsTask
                
                await MainActor.run {
                    self.dailySteps = fetchedSteps
                    self.goals = fetchedGoals
                    self.isLoading = false
                    // Update shared data provider
                    StepsDataProvider.shared.dailySteps = fetchedSteps
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

// MARK: - Steps Data Provider
// Helper class to share steps data between StepsView and HabitsView for CombinedDatePicker
class StepsDataProvider: ObservableObject {
    static let shared = StepsDataProvider()
    
    @Published var dailySteps: [DailyStep] = []
    
    private init() {}
    
    func getCompletedStepsCount(for date: Date) -> Int {
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: date)
        
        let stepsForDate = dailySteps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
        
        return stepsForDate.filter { $0.completed }.count
    }
    
    func getTotalStepsCount(for date: Date) -> Int {
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: date)
        
        return dailySteps.filter { step in
            let stepStartOfDay = calendar.startOfDay(for: step.date)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }.count
    }
}

// MARK: - Habits Data Provider
// Helper class to share habits data between StepsView and HabitsView for CombinedDatePicker
class HabitsDataProvider: ObservableObject {
    static let shared = HabitsDataProvider()
    
    @Published var habits: [Habit] = []
    
    private init() {}
    
    func getCompletedHabitsCount(for date: Date) -> Int {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let dayCsName = csDayNames[weekday].lowercased()
        let dayEnName = enDayNames[weekday].lowercased()
        
        let dateStr = formatDateString(date)
        
        let habitsForDate = habits.filter { habit in
            if habit.alwaysShow {
                return true
            }
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(dayCsName) || normalizedSelectedDays.contains(dayEnName)
                }
                return false
            default:
                return false
            }
        }
        
        return habitsForDate.filter { habit in
            habit.habitCompletions?[dateStr] == true
        }.count
    }
    
    func getTotalHabitsCount(for date: Date) -> Int {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let dayCsName = csDayNames[weekday].lowercased()
        let dayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            if habit.alwaysShow {
                return true
            }
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(dayCsName) || normalizedSelectedDays.contains(dayEnName)
                }
                return false
            default:
                return false
            }
        }.count
    }
    
    private func formatDateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

// MARK: - Habits View
struct HabitsView: View {
    @StateObject private var apiManager = APIManager.shared
    @ObservedObject private var dateManager = DateSelectionManager.shared
    @ObservedObject private var habitsDataProvider = HabitsDataProvider.shared
    @State private var habits: [Habit] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var loadingHabits: Set<String> = []
    
    private var selectedDate: Date {
        dateManager.selectedDate
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám návyky...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Combined Date Picker with Steps and Habits Progress
                        CombinedDatePicker(
                            completedSteps: StepsDataProvider.shared.getCompletedStepsCount(for: selectedDate),
                            totalSteps: StepsDataProvider.shared.getTotalStepsCount(for: selectedDate),
                            completedHabits: completedHabitsForSelectedDate,
                            totalHabits: habitsForSelectedDate.count
                        )
                            .padding(.top, DesignSystem.Spacing.md)
                        
                        // Habits for selected date
                        habitsForSelectedDateSection
                        
                        // Empty State
                        if habitsForSelectedDate.isEmpty {
                            EmptyStateView(
                                icon: "repeat.circle",
                                title: "Zatím nemáte žádné návyky pro tento den",
                                subtitle: "Návyky vám pomohou budovat pravidelné rutiny",
                                actionTitle: nil
                            ) {}
                        }
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Návyky")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            loadHabits()
        }
        .onChange(of: selectedDate) { _, _ in
            // Optional: reload if needed when date changes
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Habits for Selected Date Section
    private var habitsForSelectedDateSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if !habitsForSelectedDate.isEmpty {
                Text("Návyky")
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(habitsForSelectedDate, id: \.id) { habit in
                        PlayfulHabitCard(
                            habit: habit,
                            isCompleted: isHabitCompleted(habit),
                            onToggle: {
                                if !loadingHabits.contains(habit.id) && !isSelectedDateFuture {
                                    toggleHabitCompletion(habit: habit)
                                }
                            }
                        )
                        .disabled(loadingHabits.contains(habit.id) || isSelectedDateFuture)
                    }
                }
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var isSelectedDateFuture: Bool {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let selectedDay = calendar.startOfDay(for: selectedDate)
        return selectedDay > today
    }
    
    private var completedHabitsForSelectedDate: Int {
        habitsForSelectedDate.filter { isHabitCompleted($0) }.count
    }
    
    private var habitsProgressPercentageValue: Double {
        let total = habitsForSelectedDate.count
        guard total > 0 else { return 0 }
        return min(Double(completedHabitsForSelectedDate) / Double(total), 1.0)
    }
    
    private var habitsForSelectedDate: [Habit] {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: selectedDate)
        // Convert weekday to day names in both formats
        // Calendar.component(.weekday) returns 1=Sunday, 2=Monday, etc.
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        let dayCsName = csDayNames[weekday].lowercased()
        let dayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            // Check if habit is scheduled for this day
            if habit.alwaysShow {
                return true
            }
            
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(dayCsName) || normalizedSelectedDays.contains(dayEnName)
                }
                return false
            default:
                return false
            }
        }
    }
    
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let dateStr = formatDateString(selectedDate)
        return habit.habitCompletions?[dateStr] == true
    }
    
    private func formatDateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    // MARK: - Actions
    private func toggleHabitCompletion(habit: Habit) {
        // Prevent completing habits for future dates
        guard !isSelectedDateFuture else {
            return
        }
        
        let dateStr = formatDateString(selectedDate)
        loadingHabits.insert(habit.id)
        
        Task {
            do {
                let updatedHabit = try await apiManager.toggleHabitCompletion(habitId: habit.id, date: dateStr)
                
                await MainActor.run {
                    if let index = habits.firstIndex(where: { $0.id == habit.id }) {
                        habits[index] = updatedHabit
                    }
                    loadingHabits.remove(habit.id)
                    // Update shared data provider
                    HabitsDataProvider.shared.habits = habits
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    loadingHabits.remove(habit.id)
                }
            }
        }
    }
    
    private func loadHabits() {
        Task {
            do {
                let fetchedHabits = try await apiManager.fetchHabits()
                
                await MainActor.run {
                    self.habits = fetchedHabits
                    self.isLoading = false
                    // Update shared data provider
                    HabitsDataProvider.shared.habits = fetchedHabits
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

// MARK: - Statistics Card Component
struct StatCard: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        PlayfulCard(variant: .pink) {
            HStack(spacing: DesignSystem.Spacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    .frame(width: 24, height: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    Text(value)
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
}

// MARK: - Habit Card View
struct HabitCardView: View {
    let habit: Habit
    
    var body: some View {
        PlayfulCard(variant: .purple) {
            HStack(spacing: DesignSystem.Spacing.md) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(habit.name)
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    HStack(spacing: DesignSystem.Spacing.sm) {
                        Text(frequencyText)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        if habit.streak > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "flame.fill")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(DesignSystem.Colors.Playful.yellow)
                                Text("\(habit.streak)")
                                .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)
                            }
                        }
                        
                        if habit.maxStreak > 0 {
                            HStack(spacing: 4) {
                                Image(systemName: "trophy.fill")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(DesignSystem.Colors.Playful.yellow)
                                Text("Max: \(habit.maxStreak)")
                                    .font(DesignSystem.Typography.caption2)
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                            }
                        }
                    }
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    private var frequencyText: String {
        switch habit.frequency {
        case "daily":
            return "Denně"
        case "weekly":
            return "Týdně"
        case "monthly":
            return "Měsíčně"
        case "custom":
            return "Vlastní"
        default:
            return habit.frequency
        }
    }
}

struct SettingsView: View {
    @Environment(\.clerk) private var clerk
    @StateObject private var apiManager = APIManager.shared
    @State private var showWidgetSettings = false
    @State private var userSettings: UserSettings?
    @State private var isLoadingSettings = true
    @State private var showColorSettings = false
    @State private var showAddAspirationModal = false
    @State private var showEditAspirationModal = false
    @State private var selectedAspiration: Aspiration?
    @State private var aspirations: [Aspiration] = []
    @State private var isLoadingAspirations = false
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
                    
                    // Areas Management Section
                    areasManagementSection
                    
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
        .task {
            await loadAspirations()
        }
        .onAppear {
            loadUserSettings()
        }
        .sheet(isPresented: $showWidgetSettings) {
            SimpleWidgetSettingsView()
        }
        .sheet(isPresented: $showColorSettings) {
            ColorSettingsView(
                userSettings: $userSettings,
                onSave: { settings in
                    saveUserSettings(settings)
                }
            )
        }
        .sheet(isPresented: $showAddAspirationModal) {
            AddAspirationModal(onAspirationAdded: {
                Task {
                    await loadAspirations()
                }
            })
        }
        .sheet(isPresented: $showEditAspirationModal) {
            if let aspiration = selectedAspiration {
                EditAspirationModal(
                    aspiration: aspiration,
                    onAspirationUpdated: {
                        Task {
                            await loadAspirations()
                        }
                    }
                )
            }
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
                icon: "paintpalette.fill",
                title: "Barva aplikace",
                subtitle: "Změnit primární barvu",
                action: {
                    showColorSettings = true
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
    
    // MARK: - Areas Management Section
    private var areasManagementSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            PlayfulCard(variant: .pink) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                    HStack {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Oblasti")
                                .font(DesignSystem.Typography.title3)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            Text("\(aspirations.count) oblastí")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            showAddAspirationModal = true
                        }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        }
                    }
                    
                    if isLoadingAspirations {
                        HStack {
                            Spacer()
                            ProgressView()
                                .padding(.vertical, DesignSystem.Spacing.md)
                            Spacer()
                        }
                    } else if aspirations.isEmpty {
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            Text("Zatím nemáte žádné oblasti")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                            
                            PlayfulButton(
                                variant: .pink,
                                title: "Přidat první oblast",
                                action: {
                                    showAddAspirationModal = true
                                }
                            )
                        }
                        .padding(.vertical, DesignSystem.Spacing.sm)
                    } else {
                        VStack(spacing: DesignSystem.Spacing.sm) {
                            ForEach(aspirations, id: \.id) { aspiration in
                                AreaSettingsRow(
                                    aspiration: aspiration,
                                    onEdit: {
                                        selectedAspiration = aspiration
                                        showEditAspirationModal = true
                                    },
                                    onDelete: {
                                        deleteAspiration(aspirationId: aspiration.id)
                                    }
                                )
                            }
                        }
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
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
                    filters: settings.filters,
                    primaryColor: settings.primaryColor
                )
                await MainActor.run {
                    self.userSettings = updatedSettings
                    // Aktualizovat singleton pro okamžité použití napříč aplikací
                    UserSettingsManager.shared.updateSettings(updatedSettings)
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
    
    private func loadAspirations() async {
        await MainActor.run {
            isLoadingAspirations = true
        }
        
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            await MainActor.run {
                self.aspirations = fetchedAspirations
                self.isLoadingAspirations = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.showError = true
                self.isLoadingAspirations = false
            }
        }
    }
    
    private func deleteAspiration(aspirationId: String) {
        Task {
            do {
                try await apiManager.deleteAspiration(aspirationId: aspirationId)
                await loadAspirations()
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
}

// MARK: - Area Settings Row Component
struct AreaSettingsRow: View {
    let aspiration: Aspiration
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            // Color indicator
            Circle()
                .fill(Color(hex: aspiration.color))
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                Text(aspiration.title)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                if let description = aspiration.description, !description.isEmpty {
                    Text(description)
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Edit button
            Button(action: onEdit) {
                Image(systemName: "pencil")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    .frame(width: 32, height: 32)
            }
            
            // Delete button
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(DesignSystem.Colors.error)
                    .frame(width: 32, height: 32)
            }
        }
        .padding(DesignSystem.Spacing.sm)
        .background(DesignSystem.Colors.surfaceSecondary)
        .cornerRadius(DesignSystem.CornerRadius.sm)
    }
}

// MARK: - Edit Aspiration Modal
struct EditAspirationModal: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    let aspiration: Aspiration
    let onAspirationUpdated: () -> Void
    
    @State private var aspirationTitle: String
    @State private var aspirationDescription: String
    @State private var selectedColor: String
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showDeleteConfirmation = false
    
    private let colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]
    
    init(aspiration: Aspiration, onAspirationUpdated: @escaping () -> Void) {
        self.aspiration = aspiration
        self.onAspirationUpdated = onAspirationUpdated
        _aspirationTitle = State(initialValue: aspiration.title)
        _aspirationDescription = State(initialValue: aspiration.description ?? "")
        _selectedColor = State(initialValue: aspiration.color)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    titleField
                    descriptionField
                    colorPicker
                    saveButton
                    deleteButton
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Upravit oblast")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            .alert("Smazat oblast?", isPresented: $showDeleteConfirmation) {
                Button("Zrušit", role: .cancel) { }
                Button("Smazat", role: .destructive) {
                    deleteAspiration()
                }
            } message: {
                Text("Opravdu chcete smazat tuto oblast? Tato akce je nevratná.")
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private var titleField: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            HStack {
                Text("Název aspirace")
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                Text("*")
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            }
            PlayfulInput(
                text: $aspirationTitle,
                placeholder: "Např. Být tím nejlepším člověkem, jakým můžu být"
            )
        }
    }
    
    private var descriptionField: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            Text("Popis (volitelné)")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            TextField("Popište svou aspiraci podrobněji...", text: $aspirationDescription, axis: .vertical)
                .font(DesignSystem.Typography.body)
                .padding(DesignSystem.Spacing.md)
                .frame(minHeight: 100, alignment: .top)
                .background(DesignSystem.Colors.surface)
                .cornerRadius(DesignSystem.CornerRadius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .lineLimit(4...8)
        }
    }
    
    private var colorPicker: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            Text("Barva")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            HStack(spacing: DesignSystem.Spacing.md) {
                ForEach(colors, id: \.self) { color in
                    Button(action: {
                        selectedColor = color
                    }) {
                        Circle()
                            .fill(Color(hex: color))
                            .frame(width: 40, height: 40)
                            .overlay(
                                Circle()
                                    .stroke(selectedColor == color ? DesignSystem.Colors.dynamicPrimary : Color.clear, lineWidth: 3)
                            )
                    }
                }
            }
        }
    }
    
    private var saveButton: some View {
        PlayfulButton(
            variant: .pink,
            title: "Uložit změny",
            isLoading: isLoading,
            action: {
                updateAspiration()
            }
        )
        .disabled(aspirationTitle.isEmpty || isLoading)
    }
    
    private var deleteButton: some View {
        Button(action: {
            showDeleteConfirmation = true
        }) {
            Text("Smazat oblast")
                .font(DesignSystem.Typography.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.error)
                .cornerRadius(DesignSystem.CornerRadius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.outline, lineWidth: 2)
                )
        }
    }
    
    private func updateAspiration() {
        isLoading = true
        
        Task {
            do {
                _ = try await apiManager.updateAspiration(
                    aspirationId: aspiration.id,
                    title: aspirationTitle,
                    description: aspirationDescription.isEmpty ? nil : aspirationDescription,
                    color: selectedColor,
                    icon: nil
                )
                
                await MainActor.run {
                    isLoading = false
                    onAspirationUpdated()
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
    
    private func deleteAspiration() {
        isLoading = true
        
        Task {
            do {
                try await apiManager.deleteAspiration(aspirationId: aspiration.id)
                
                await MainActor.run {
                    isLoading = false
                    onAspirationUpdated()
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
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Název cíle")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        PlayfulInput(
                            text: $goalTitle,
                            placeholder: "Např. Naučit se španělsky",
                            variant: .pink
                        )
                    }
                    
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Popis (volitelné)")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        TextField("Popište svůj cíl podrobněji...", text: $goalDescription, axis: .vertical)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.Playful.purpleLight)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.outline, lineWidth: 3)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
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
                    PlayfulButton(
                        variant: .pink,
                        size: .sm,
                        title: "Přidat",
                        isLoading: isLoading,
                        isDisabled: goalTitle.isEmpty,
                        action: {
                        addGoal()
                    }
                    )
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
        await MainActor.run {
            isLoadingAspirations = true
        }
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
                        PlayfulInput(
                            text: $stepTitle,
                            placeholder: "Např. Pravidelně šetřit",
                            variant: .purple
                            )
                    }
                    
                    // Description Field
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Popis (volitelné)")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        TextField("Popište krok podrobněji...", text: $stepDescription, axis: .vertical)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .padding(DesignSystem.Spacing.md)
                            .frame(minHeight: 100, alignment: .top)
                            .background(DesignSystem.Colors.Playful.yellowGreenLight)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.outline, lineWidth: 3)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
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
                    PlayfulButton(
                        variant: .purple,
                        size: .md,
                        title: "Přidat krok",
                        isLoading: isLoading,
                        isDisabled: stepTitle.isEmpty,
                        action: {
                        addStep()
                        }
                    )
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

// StepDetailView and GoalDetailView are now in separate files (StepDetailView.swift and GoalDetailView.swift)

#Preview {
        GoalsView()
}

// MARK: - Widget Settings
// WidgetType is now defined in Models.swift

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

// MARK: - Color Settings View
struct ColorSettingsView: View {
    @Binding var userSettings: UserSettings?
    let onSave: (UserSettings) -> Void
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    @State private var selectedColor: String = "#E8871E"
    @State private var isSaving = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    // Color palettes from web app (matching web app exactly)
    private let colorPalettes: [(name: String, value: String)] = [
        ("Oranžová sytá", "#E8871E"),
        ("Oranžová světlá", "#FFB366"),
        ("Fialová sytá", "#8B5CF6"),
        ("Fialová světlá", "#C4A5F5"),
        ("Růžová sytá", "#FF6B9D"),
        ("Růžová světlá", "#FFB3BA"),
        ("Teal sytá", "#14B8A6"),
        ("Teal světlá", "#7DD3C0")
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    Text("Vyberte primární barvu aplikace")
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .padding(.top, DesignSystem.Spacing.md)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: DesignSystem.Spacing.md) {
                        ForEach(colorPalettes, id: \.value) { palette in
                            ColorOptionView(
                                name: palette.name,
                                color: Color(hex: palette.value),
                                isSelected: selectedColor == palette.value,
                                onTap: {
                                    selectedColor = palette.value
                                }
                            )
                        }
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    
                    Spacer(minLength: 100)
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Barva aplikace")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    PlayfulButton(
                        variant: .pink,
                        size: .sm,
                        title: "Uložit",
                        isLoading: isSaving,
                        action: {
                            saveSettings()
                        }
                    )
                }
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onAppear {
            if let settings = userSettings {
                selectedColor = settings.primaryColor ?? "#E8871E"
            }
        }
    }
    
    private func saveSettings() {
        guard userSettings != nil else { return }
        
        isSaving = true
        
        Task {
            do {
                // Voláme API přímo z ColorSettingsView
                let updatedSettings = try await APIManager.shared.updateUserSettings(
                    dailyStepsCount: nil,
                    workflow: nil,
                    filters: nil,
                    primaryColor: selectedColor
                )
                
                await MainActor.run {
                    // Aktualizovat singleton pro okamžité použití napříč aplikací (musí být první, aby notifikoval změny)
                    UserSettingsManager.shared.updateSettings(updatedSettings)
                    // Aktualizovat local state
                    userSettings = updatedSettings
                    // Zavolat onSave callback
                    onSave(updatedSettings)
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Color Option View
struct ColorOptionView: View {
    let name: String
    let color: Color
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(spacing: DesignSystem.Spacing.sm) {
                Circle()
                    .fill(color)
                    .frame(width: 60, height: 60)
                    .overlay(
                        Circle()
                            .stroke(DesignSystem.Colors.outline, lineWidth: isSelected ? 4 : 2)
                    )
                    .overlay(
                        Group {
                            if isSelected {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 20, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                    )
                
                Text(name)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }
            .padding(DesignSystem.Spacing.sm)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
