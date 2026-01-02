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
    @State private var aspirations: [Aspiration] = []
    @State private var dailySteps: [DailyStep] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddGoalModal = false
    
    // Group goals by aspiration
    private var goalsByAspiration: [(aspiration: Aspiration?, goals: [Goal])] {
        var grouped: [String?: [Goal]] = [:]
        
        // Group goals by aspirationId
        for goal in goals {
            let key = goal.aspirationId
            if grouped[key] == nil {
                grouped[key] = []
            }
            grouped[key]?.append(goal)
        }
        
        // Convert to array of tuples, sorted by aspiration title
        var result: [(aspiration: Aspiration?, goals: [Goal])] = []
        
        // Goals with aspirations first
        for aspiration in aspirations.sorted(by: { $0.title < $1.title }) {
            if let goalsForAspiration = grouped[aspiration.id], !goalsForAspiration.isEmpty {
                result.append((aspiration: aspiration, goals: sortedGoals(goalsForAspiration)))
            }
        }
        
        // Goals without aspiration at the end
        if let goalsWithoutAspiration = grouped[nil], !goalsWithoutAspiration.isEmpty {
            result.append((aspiration: nil, goals: sortedGoals(goalsWithoutAspiration)))
        }
        
        return result
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám pokrok...")
                    .transition(.opacity)
                    .animation(.easeInOut, value: isLoading)
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.md) {
                        if goals.isEmpty {
                            EmptyStateView(
                                icon: "chart.bar",
                                title: "Zatím nemáte žádné cíle",
                                subtitle: "Přidejte svůj první cíl a začněte sledovat pokrok",
                                actionTitle: "Přidat první cíl"
                            ) {
                                showAddGoalModal = true
                            }
                            .padding(.top, DesignSystem.Spacing.xl)
                        } else {
                            ForEach(Array(goalsByAspiration.enumerated()), id: \.offset) { index, group in
                                AspirationProgressSection(
                                    aspiration: group.aspiration,
                                    goals: group.goals,
                                    dailySteps: dailySteps
                                )
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
        .navigationTitle("Pokrok")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddGoalModal = true
                }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
        .onAppear {
            loadData()
        }
        .sheet(isPresented: $showAddGoalModal) {
            NavigationView {
                GoalDetailView(onGoalAdded: {
                    loadData()
            })
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Goals Sorting
    private func sortedGoals(_ goals: [Goal]) -> [Goal] {
        goals.sorted { goal1, goal2 in
            // Sort by progress percentage (higher first)
            if goal1.progressPercentage != goal2.progressPercentage {
                return goal1.progressPercentage > goal2.progressPercentage
            }
            // If same progress, sort by target date
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
    private func loadData() {
        Task {
            isLoading = true
            
            // Load goals and aspirations separately to handle errors independently
            var goalsResult: [Goal] = []
            var aspirationsResult: [Aspiration] = []
            var errorOccurred = false
            var errorMessages: [String] = []
            
            // Load goals
            do {
                goalsResult = try await apiManager.fetchGoals()
                // Filter only active goals
                goalsResult = goalsResult.filter { $0.status == "active" }
            } catch {
                errorOccurred = true
                let errorDesc = error.localizedDescription.isEmpty ? "Neznámá chyba" : error.localizedDescription
                errorMessages.append("Nepodařilo se načíst cíle: \(errorDesc)")
                print("Error loading goals: \(error)")
            }
            
            // Load aspirations
            do {
                aspirationsResult = try await apiManager.fetchAspirations()
            } catch {
                errorOccurred = true
                let errorDesc = error.localizedDescription.isEmpty ? "Neznámá chyba" : error.localizedDescription
                errorMessages.append("Nepodařilo se načíst oblasti: \(errorDesc)")
                print("Error loading aspirations: \(error)")
            }
            
            // Load steps for indicator calculation
            var stepsResult: [DailyStep] = []
            do {
                let calendar = Calendar.current
                let today = Date()
                let startDate = calendar.date(byAdding: .day, value: -90, to: today) ?? today
                let endDate = calendar.date(byAdding: .day, value: 30, to: today) ?? today
                stepsResult = try await apiManager.fetchSteps(startDate: startDate, endDate: endDate)
            } catch {
                print("Error loading steps for indicators: \(error)")
            }
            
            await MainActor.run {
                self.goals = goalsResult
                self.aspirations = aspirationsResult
                self.dailySteps = stepsResult
                self.isLoading = false
                
                // Show error only if both failed, or if goals failed (since goals are essential)
                if errorOccurred {
                    if goalsResult.isEmpty && aspirationsResult.isEmpty {
                        // Both failed - show error
                        self.errorMessage = errorMessages.joined(separator: "\n")
                        self.showError = true
                    } else if goalsResult.isEmpty {
                        // Goals failed but aspirations succeeded - show error
                        self.errorMessage = errorMessages.first ?? "Nepodařilo se načíst data"
                        self.showError = true
                    }
                    // If only aspirations failed, we can still show goals, so no error needed
                }
            }
        }
    }
}

// MARK: - Aspiration Progress Section Component
struct AspirationProgressSection: View {
    let aspiration: Aspiration?
    let goals: [Goal]
    let dailySteps: [DailyStep]
    
    @State private var isExpanded: Bool = false
    
    private var sectionTitle: String {
        if let aspiration = aspiration {
            return aspiration.title
        }
        return "Bez oblasti"
    }
    
    private var sectionIcon: String? {
        aspiration?.icon
    }
    
    private var sectionColor: Color {
        if let aspiration = aspiration {
            return Color(hex: aspiration.color)
        }
        return DesignSystem.Colors.textSecondary
    }
    
    // Calculate step statistics for this aspiration
    private var stepStats: (overdue: Int, completed: Int, indicatorColor: Color, indicatorIcon: String) {
        guard let aspiration = aspiration else {
            return (0, 0, DesignSystem.Colors.textSecondary, "minus")
        }
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Filter steps for this aspiration
        let aspirationSteps = dailySteps.filter { step in
            step.aspirationId == aspiration.id || step.areaId == aspiration.id
        }
        
        // Count overdue (not completed, date < today)
        let overdue = aspirationSteps.filter { step in
            guard !step.completed, let stepDate = step.date else { return false }
            return calendar.startOfDay(for: stepDate) < today
        }.count
        
        // Count completed
        let completed = aspirationSteps.filter { $0.completed }.count
        
        // Determine indicator - use darker colors for better visibility
        if overdue > completed {
            return (overdue, completed, DesignSystem.Colors.redFull, "arrow.down.right")
        } else if completed > overdue {
            return (overdue, completed, DesignSystem.Colors.greenFull, "arrow.up.right")
        } else {
            return (overdue, completed, DesignSystem.Colors.textSecondary, "minus")
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Section header with colored accent - clickable to expand/collapse
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    isExpanded.toggle()
                }
            }) {
                HStack(spacing: DesignSystem.Spacing.sm) {
                    // Colored indicator
                    RoundedRectangle(cornerRadius: 2)
                        .fill(sectionColor)
                        .frame(width: 3, height: 18)
                    
                    if let iconName = sectionIcon {
                        LucideIcon(iconName, size: 16, color: DesignSystem.Colors.textPrimary)
                    }
                    
                    Text(sectionTitle)
                        .font(DesignSystem.Typography.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Spacer()
                    
                    // Step indicator (stock market style)
                    stepIndicatorView
                    
                    // Goals count
                    Text("\(goals.count)")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            Capsule()
                                .fill(DesignSystem.Colors.surfaceSecondary)
                        )
                    
                    // Expand/collapse icon
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .rotationEffect(.degrees(isExpanded ? 0 : 0))
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.vertical, DesignSystem.Spacing.sm)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Goals list - shown when expanded
            if isExpanded {
                VStack(spacing: DesignSystem.Spacing.xs) {
                    ForEach(goals, id: \.id) { goal in
                        NavigationLink(destination: GoalDetailView(goal: goal)) {
                            CompactGoalProgressRow(goal: goal, dailySteps: dailySteps)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.leading, DesignSystem.Spacing.md)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }
    
    // MARK: - Step Indicator View (Stock Market Style)
    @ViewBuilder
    private var stepIndicatorView: some View {
        let stats = stepStats
        
        HStack(spacing: 5) {
            Image(systemName: stats.indicatorIcon)
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(stats.indicatorColor)
            
            if stats.overdue > 0 || stats.completed > 0 {
                Text("\(stats.completed)/\(stats.overdue + stats.completed)")
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(stats.indicatorColor)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 5)
                .fill(stats.indicatorColor.opacity(0.2))
                .overlay(
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(stats.indicatorColor.opacity(0.4), lineWidth: 1)
                )
        )
    }
}

// MARK: - Compact Goal Progress Row Component
struct CompactGoalProgressRow: View {
    let goal: Goal
    let dailySteps: [DailyStep]
    
    private var progressValue: Double {
        Double(goal.progressPercentage) / 100.0
    }
    
    // Count remaining (incomplete) steps for this goal
    private var remainingStepsCount: Int {
        dailySteps.filter { step in
            step.goalId == goal.id && !step.completed
        }.count
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            // Top row: Icon, title, and percentage
            HStack(spacing: DesignSystem.Spacing.md) {
                // Goal icon - use LucideIcon if icon name is provided
                if let iconName = goal.icon {
                    LucideIcon(iconName, size: 20, color: DesignSystem.Colors.dynamicPrimary)
                        .frame(width: 28, height: 28)
                } else {
                    Circle()
                        .fill(DesignSystem.Colors.dynamicPrimary.opacity(0.15))
                        .frame(width: 28, height: 28)
                }
                
                // Goal title - can be 2 lines
                Text(goal.title)
                    .font(DesignSystem.Typography.body)
                    .fontWeight(.medium)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                
                Spacer()
                
                // Progress percentage
                Text("\(goal.progressPercentage)%")
                    .font(DesignSystem.Typography.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            }
            
            // Second row: Description (if available) and progress bar
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                // Description if available
                if let description = goal.description, !description.isEmpty {
                    Text(description)
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }
                
                // Progress bar
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // Background
                        RoundedRectangle(cornerRadius: 4)
                            .fill(DesignSystem.Colors.surfaceSecondary)
                            .frame(height: 8)
                        
                        // Progress
                        RoundedRectangle(cornerRadius: 4)
                            .fill(DesignSystem.Colors.dynamicPrimary)
                            .frame(width: geometry.size.width * progressValue, height: 8)
                            .animation(.easeInOut(duration: 0.3), value: progressValue)
                        
                        // Outline
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            .frame(height: 8)
                    }
                }
                .frame(height: 8)
                
                // Remaining steps count
                if remainingStepsCount > 0 {
                    Text("Zbývá \(remainingStepsCount) \(remainingStepsCount == 1 ? "krok" : remainingStepsCount < 5 ? "kroky" : "kroků")")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
        }
        .padding(DesignSystem.Spacing.md)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(DesignSystem.Colors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(DesignSystem.Colors.grayBorder, lineWidth: 2)
                )
        )
    }
}

struct StepsView: View {
    @StateObject private var apiManager = APIManager.shared
    @ObservedObject private var dateManager = DateSelectionManager.shared
    @ObservedObject private var stepsDataProvider = StepsDataProvider.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var goals: [Goal] = []
    @State private var aspirations: [Aspiration] = []
    @State private var isLoading = true
    @State private var isLoadingMore = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    @State private var loadedEndDate: Date = Date()
    
    private var selectedDate: Date {
        dateManager.selectedDate
    }
    
    // All steps sorted: overdue → today → future (completed steps excluded)
    private var sortedAllSteps: [DailyStep] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let oneMonthFromNow = calendar.date(byAdding: .day, value: 30, to: today) ?? today
        
        // Filter: exclude completed, only past + today + future (max 1 month)
        let filteredSteps = dailySteps.filter { step in
            // Exclude completed steps
            guard !step.completed else { return false }
            // Exclude steps without date (recurring steps without instance)
            guard let stepDate = step.date else { return false }
            
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return stepStartOfDay <= oneMonthFromNow
        }
        
        return filteredSteps.sorted { step1, step2 in
            // Handle optional dates - steps without date go to the end
            guard let date1Value = step1.date, let date2Value = step2.date else {
                if step1.date == nil && step2.date == nil { return false }
                return step1.date != nil // Steps with date come first
            }
            
            let date1 = calendar.startOfDay(for: date1Value)
            let date2 = calendar.startOfDay(for: date2Value)
            
            // Check if overdue (not completed and date < today)
            let isOverdue1 = date1 < today
            let isOverdue2 = date2 < today
            
            // Check if today
            let isToday1 = calendar.isDate(date1, inSameDayAs: today)
            let isToday2 = calendar.isDate(date2, inSameDayAs: today)
            
            // Check if future
            let isFuture1 = date1 > today
            let isFuture2 = date2 > today
            
            // Sorting priority:
            // 1. Overdue (by date - earlier first)
            // 2. Today (by date)
            // 3. Future (by date - earlier first)
            
            // Overdue first
            if isOverdue1 && !isOverdue2 { return true }
            if isOverdue2 && !isOverdue1 { return false }
            if isOverdue1 && isOverdue2 {
                return date1 < date2 // Earlier overdue first
            }
            
            // Today second
            if isToday1 && !isToday2 { return true }
            if isToday2 && !isToday1 { return false }
            
            // Future third (by date - earlier first)
            if isFuture1 && isFuture2 {
                return date1 < date2
            }
            
            // Default: by date
            return date1 < date2
        }
    }
    
    // Helper to determine if step is important
    private func isStepImportant(_ step: DailyStep) -> Bool {
        // Check isImportant field first
        if let isImportant = step.isImportant {
            return isImportant
        }
        
        // Fallback to Goal priority
        if let goalId = step.goalId,
           let goal = goals.first(where: { $0.id == goalId }) {
            return goal.priority == "short-term" || goal.priority == "meaningful"
        }
        
        return false
    }
    
    // Check if there are any overdue or today's steps (completed excluded)
    private var hasOverdueOrTodaySteps: Bool {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        return sortedAllSteps.contains { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            let isOverdue = stepStartOfDay < today
            let isToday = calendar.isDate(stepStartOfDay, inSameDayAs: today)
            return isOverdue || isToday
        }
    }
    
    // Get only future steps
    private var futureSteps: [DailyStep] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        return sortedAllSteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return stepStartOfDay > today
        }
    }
    
    // Get overdue and today steps (for separation from future)
    private var overdueAndTodaySteps: [DailyStep] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        return sortedAllSteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            let isOverdue = stepStartOfDay < today
            let isToday = calendar.isDate(stepStartOfDay, inSameDayAs: today)
            return isOverdue || isToday
        }
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám kroky...")
            } else {
                VStack(spacing: 0) {
                    // Fixed Date Picker at top
                    CombinedDatePicker(
                        completedSteps: stepsForSelectedDate.filter { $0.completed }.count,
                        totalSteps: stepsForSelectedDate.count,
                        completedHabits: HabitsDataProvider.shared.getCompletedHabitsCount(for: selectedDate),
                        totalHabits: HabitsDataProvider.shared.getTotalHabitsCount(for: selectedDate)
                    )
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                    .background(DesignSystem.Colors.background)
                    
                    // Scrollable steps content
                    ScrollView {
                        LazyVStack(spacing: DesignSystem.Spacing.md) {
                            // Single feed of all steps
                            if sortedAllSteps.isEmpty {
                            EmptyStateView(
                                    icon: "checkmark.circle",
                                    title: "Zatím nemáte žádné kroky",
                                    subtitle: "Přidejte svůj první krok",
                                actionTitle: "Přidat první krok"
                            ) {
                                showAddStepModal = true
                            }
                                .padding(.top, DesignSystem.Spacing.lg)
                            } else {
                                stepsContent
                            }
                            
                            // Loading indicator for more steps
                            if isLoadingMore {
                                HStack {
                                    Spacer()
                                    ProgressView()
                                        .padding()
                                    Spacer()
                                }
                            }
                            
                            // Bottom padding for infinite scroll
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    }
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showAddStepModal) {
            NavigationView {
                StepDetailView(initialDate: selectedDate, onStepAdded: {
            loadSteps()
                })
            }
        }
        .sheet(item: $selectedStep) { step in
            NavigationView {
                StepDetailView(step: step, onStepAdded: {
                    loadSteps()
                })
            }
            }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onAppear {
            if dailySteps.isEmpty {
                loadSteps()
            }
        }
        .onChange(of: selectedDate) { _, _ in
            loadSteps()
        }
    }
    
    // MARK: - Steps Content View
    private var stepsContent: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            // Show completion message if no overdue or today's steps
            if !hasOverdueOrTodaySteps && !futureSteps.isEmpty {
                completionMessageCard
            }
            
            // Steps feed - overdue and today first
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                ForEach(overdueAndTodaySteps.filter { $0.date != nil }, id: \.id) { step in
                        let goal = goals.first { $0.id == step.goalId }
                    let aspiration = aspirations.first { $0.id == (step.areaId ?? step.aspirationId) }
                    let calendar = Calendar.current
                    let today = calendar.startOfDay(for: Date())
                    if let stepDateValue = step.date {
                        let stepDate = calendar.startOfDay(for: stepDateValue)
                        let isOverdue = !step.completed && stepDate < today
                        let isFuture = stepDate > today
                        
                        PlayfulStepCard(
                            step: step,
                            goalTitle: goal?.title,
                            goal: goal,
                            aspiration: aspiration,
                            isOverdue: isOverdue,
                            isFuture: isFuture,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                        .onAppear {
                            // Load more when approaching end
                            if step.id == sortedAllSteps.filter({ $0.date != nil }).last?.id {
                                loadMoreStepsIfNeeded()
                    }
                }
            }
        }
    }
    
            // Future steps section with header (only if there are future steps)
            if !futureSteps.isEmpty {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    Text("Budoucí")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        .padding(.top, DesignSystem.Spacing.md)
            
            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                        ForEach(futureSteps.filter { $0.date != nil }, id: \.id) { step in
                    let goal = goals.first { $0.id == step.goalId }
                            let aspiration = aspirations.first { $0.id == (step.areaId ?? step.aspirationId) }
                            let calendar = Calendar.current
                            let today = calendar.startOfDay(for: Date())
                            if let stepDateValue = step.date {
                                let stepDate = calendar.startOfDay(for: stepDateValue)
                                let isOverdue = !step.completed && stepDate < today
                                let isFuture = stepDate > today
                                
                    PlayfulStepCard(
                        step: step,
                        goalTitle: goal?.title,
                                    goal: goal,
                                    aspiration: aspiration,
                                    isOverdue: isOverdue,
                                    isFuture: isFuture,
                        onToggle: {
                            toggleStepCompletion(stepId: step.id, completed: !step.completed)
                        }
                    )
                                .onAppear {
                                    // Load more when approaching end
                                    if step.id == sortedAllSteps.filter({ $0.date != nil }).last?.id {
                                        loadMoreStepsIfNeeded()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(.top, DesignSystem.Spacing.md)
    }
    
    // MARK: - Completion Message Card
    private var completionMessageCard: some View {
        VStack(spacing: DesignSystem.Spacing.sm) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary.opacity(0.7))
                
                Text("Pro dnešek je vše hotovo!")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }
            
            if !futureSteps.isEmpty {
                Text("Níže jsou kroky, které ještě mohou odpočívat chvíli")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary.opacity(0.7))
            }
        }
        .padding(DesignSystem.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(DesignSystem.Colors.dynamicPrimary.opacity(0.05))
        .cornerRadius(DesignSystem.CornerRadius.md)
    }
    
    // MARK: - Computed Properties
    
    private var stepsForSelectedDate: [DailyStep] {
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: selectedDate)
        
        return dailySteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
    }
    
    // MARK: - Data Loading
    private func loadSteps() {
        Task {
            do {
                // Initial load: last 30 days to next 30 days
                let calendar = Calendar.current
                let today = Date()
                let startDate = calendar.date(byAdding: .day, value: -30, to: today) ?? today
                let endDate = calendar.date(byAdding: .day, value: 30, to: today) ?? today
                
                async let stepsTask = apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                async let goalsTask = apiManager.fetchGoals()
                async let aspirationsTask = apiManager.fetchAspirations()
                
                let fetchedSteps = try await stepsTask
                let fetchedGoals = try await goalsTask
                let fetchedAspirations = try await aspirationsTask
                
                await MainActor.run {
                    self.dailySteps = fetchedSteps
                    self.goals = fetchedGoals
                    self.aspirations = fetchedAspirations
                    self.isLoading = false
                    self.loadedEndDate = endDate
                    // Update shared data provider
                    StepsDataProvider.shared.dailySteps = fetchedSteps
                    // Update steps notifications with count
                    updateStepsNotifications(steps: fetchedSteps)
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
    
    // MARK: - Lazy Loading
    private func loadMoreStepsIfNeeded() {
        guard !isLoadingMore else { return }
        
        let calendar = Calendar.current
        let today = Date()
        let oneMonthFromNow = calendar.date(byAdding: .day, value: 30, to: today) ?? today
        
        // Check if we need to load more future steps
        if loadedEndDate < oneMonthFromNow {
            isLoadingMore = true
            
            Task {
                do {
                    let newEndDate = calendar.date(byAdding: .day, value: 30, to: loadedEndDate) ?? loadedEndDate
                    let startDate = calendar.date(byAdding: .day, value: 1, to: loadedEndDate) ?? loadedEndDate
                    
                    let fetchedSteps = try await apiManager.fetchSteps(startDate: startDate, endDate: newEndDate)
                    
                    await MainActor.run {
                        // Merge with existing steps (avoid duplicates)
                        let existingIds = Set(dailySteps.map { $0.id })
                        let newSteps = fetchedSteps.filter { !existingIds.contains($0.id) }
                        self.dailySteps.append(contentsOf: newSteps)
                        self.loadedEndDate = newEndDate
                        self.isLoadingMore = false
                        // Update shared data provider
                        StepsDataProvider.shared.dailySteps = self.dailySteps
                    }
                } catch {
                    await MainActor.run {
                        self.isLoadingMore = false
                        // Don't show error for lazy loading failures
                        print("Error loading more steps: \(error)")
                    }
                }
            }
        }
    }
    
    // MARK: - Notifications
    private func updateStepsNotifications(steps: [DailyStep]) {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Group steps by date (filter out steps without date)
        let stepsWithDate = steps.filter { $0.date != nil }
        let stepsByDate = Dictionary(grouping: stepsWithDate) { step in
            calendar.startOfDay(for: step.date!)
        }
        
        // Update notifications for next 30 days
        for dayOffset in 0..<30 {
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: today) else { continue }
            let dayStart = calendar.startOfDay(for: date)
            let isToday = calendar.isDate(dayStart, inSameDayAs: today)
            
            var incompleteSteps: [DailyStep] = []
            var firstStepTitle: String?
            
            if isToday {
                // For today: count overdue + today incomplete steps
                let overdueSteps = steps.filter { step in
                    guard let stepDate = step.date else { return false }
                    let stepStartOfDay = calendar.startOfDay(for: stepDate)
                    return stepStartOfDay < today && !step.completed
                }
                let todaySteps = stepsByDate[dayStart] ?? []
                let todayIncompleteSteps = todaySteps.filter { !$0.completed }
                
                incompleteSteps = overdueSteps + todayIncompleteSteps
                
                // Get first step (overdue first, then today)
                let allSteps = incompleteSteps.compactMap { step -> (step: DailyStep, date: Date)? in
                    guard let stepDate = step.date else { return nil }
                    return (step: step, date: calendar.startOfDay(for: stepDate))
                }.sorted { step1, step2 in
                    let date1 = step1.date
                    let date2 = step2.date
                    let isOverdue1 = date1 < today
                    let isOverdue2 = date2 < today
                    
                    // Overdue first
                    if isOverdue1 && !isOverdue2 { return true }
                    if !isOverdue1 && isOverdue2 { return false }
                    
                    // Then by date
                    return date1 < date2
                }.map { $0.step }
                firstStepTitle = allSteps.first?.title
            } else {
                // For future days: count only steps for that day
                let daySteps = stepsByDate[dayStart] ?? []
                incompleteSteps = daySteps.filter { !$0.completed }
                
                // Get first incomplete step title
                firstStepTitle = incompleteSteps
                    .compactMap { step -> (step: DailyStep, date: Date)? in
                        guard let stepDate = step.date else { return nil }
                        return (step: step, date: stepDate)
                    }
                    .sorted { $0.date < $1.date }
                    .first?.step.title
            }
            
            NotificationManager.shared.updateStepsNotificationContent(
                stepsCount: incompleteSteps.count,
                firstStepTitle: firstStepTitle,
                for: date
            )
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
                        // Update shared data provider
                        StepsDataProvider.shared.dailySteps = dailySteps
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
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
        
        return stepsForDate.filter { $0.completed }.count
    }
    
    func getTotalStepsCount(for date: Date) -> Int {
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: date)
        
        return dailySteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
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
                    // Schedule habit notifications
                    NotificationManager.shared.scheduleAllHabitNotifications(habits: fetchedHabits)
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
    @State private var showHelpView = false
    @State private var showAddAspirationModal = false
    @State private var showEditAspirationModal = false
    @State private var selectedAspiration: Aspiration?
    @State private var aspirations: [Aspiration] = []
    @State private var isLoadingAspirations = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showNotificationSettings = false
    @State private var showDarkModeSettings = false
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
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
                    // Update local state to reflect color change
                    userSettings = settings
                }
            )
        }
        .onChange(of: settingsManager.settings?.primaryColor) { _, _ in
            // Update local state when settings change
            if let settings = settingsManager.settings {
                userSettings = settings
            }
        }
        .sheet(isPresented: $showNotificationSettings) {
            NotificationSettingsView()
        }
        .sheet(isPresented: $showHelpView) {
            HelpView()
        }
        .sheet(isPresented: $showDarkModeSettings) {
            DarkModeSettingsView()
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
                        color: DesignSystem.Colors.dynamicPrimary,
                        backgroundColor: DesignSystem.Colors.dynamicPrimary.opacity(0.1)
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
                action: {
                    showNotificationSettings = true
                }
            )
            
            ModernSettingsRow(
                icon: "moon",
                title: "Tmavý režim",
                subtitle: "Automatické přepínání",
                action: {
                    showDarkModeSettings = true
                }
            )
            
            ModernSettingsRow(
                icon: "questionmark.circle",
                title: "Nápověda",
                subtitle: "FAQ a podpora",
                action: {
                    showHelpView = true
                }
            )
            
            ModernSettingsRow(
                icon: "paintpalette.fill",
                title: "Barva aplikace",
                subtitle: settingsManager.primaryColorHex,
                action: {
                    showColorSettings = true
                },
                trailing: {
                    // Show current color as indicator
                    Circle()
                        .fill(settingsManager.primaryColor)
                        .frame(width: 24, height: 24)
                        .overlay(
                            Circle()
                                .stroke(DesignSystem.Colors.outline, lineWidth: 1)
                        )
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
            // Icon or color indicator
            if let iconName = aspiration.icon {
                LucideIcon(iconName, size: 20, color: DesignSystem.Colors.textPrimary)
                    .frame(width: 24, height: 24)
            } else {
                Circle()
                    .fill(Color(hex: aspiration.color))
                    .frame(width: 12, height: 12)
            }
            
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
    @State private var selectedIcon: String?
    @State private var showIconPicker = false
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
        _selectedIcon = State(initialValue: aspiration.icon)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    titleField
                    descriptionField
                    iconPicker
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
            .sheet(isPresented: $showIconPicker) {
                IconPickerView(selectedIcon: $selectedIcon)
            }
        }
    }
    
    private var titleField: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            HStack {
                Text("Název oblasti")
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
            TextField("Popište svou oblast podrobněji...", text: $aspirationDescription, axis: .vertical)
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
    
    private var iconPicker: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
            Text("Ikona (volitelné)")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Button(action: {
                showIconPicker = true
            }) {
                HStack {
                    if let iconName = selectedIcon {
                        LucideIcon(iconName, size: 24, color: DesignSystem.Colors.dynamicPrimary)
                    } else {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Text(selectedIcon != nil ? IconUtils.availableIcons.first(where: { $0.name == selectedIcon })?.label ?? "Ikona" : "Vyberte ikonu")
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.grayBorder, lineWidth: 2)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
            }
            .buttonStyle(PlainButtonStyle())
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
                    icon: selectedIcon
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
struct ModernSettingsRow<Trailing: View>: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    let trailing: Trailing?
    
    // Initializer without trailing
    init(icon: String, title: String, subtitle: String, action: @escaping () -> Void) where Trailing == EmptyView {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.action = action
        self.trailing = nil
    }
    
    // Initializer with trailing
    init(icon: String, title: String, subtitle: String, action: @escaping () -> Void, @ViewBuilder trailing: () -> Trailing) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.action = action
        self.trailing = trailing()
    }
    
    var body: some View {
        ModernCard {
            Button(action: action) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    ModernIcon(
                        systemName: icon,
                        size: 20,
                        color: DesignSystem.Colors.dynamicPrimary,
                        backgroundColor: DesignSystem.Colors.dynamicPrimary.opacity(0.1)
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
                    
                    if let trailing = trailing {
                        trailing
                    }
                    
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
                    
                    if let stepDate = step.date {
                        Text(stepDate, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
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
    @State private var selectedIcon: String? = nil
    @State private var showIconPicker = false
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
                        Text("Ikona (volitelné)")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Button(action: {
                            showIconPicker = true
                        }) {
                            HStack {
                                if let iconName = selectedIcon {
                                    LucideIcon(iconName, size: 24, color: DesignSystem.Colors.dynamicPrimary)
                                } else {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.system(size: 24))
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                }
                                
                                Text(selectedIcon != nil ? IconUtils.availableIcons.first(where: { $0.name == selectedIcon })?.label ?? "Ikona" : "Vyberte ikonu")
                                    .font(DesignSystem.Typography.body)
                                    .foregroundColor(DesignSystem.Colors.textPrimary)
                                
                                Spacer()
                                
                                Image(systemName: "chevron.right")
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                            }
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.surface)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.grayBorder, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.md)
                        }
                        .buttonStyle(PlainButtonStyle())
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
                        Text("Oblast (volitelné)")
                            .font(.headline)
                        
                        if isLoadingAspirations {
                            ProgressView()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        } else if aspirations.isEmpty {
                            Text("Žádné oblasti")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.vertical, 8)
                        } else {
                            Picker("Oblast", selection: $selectedAspirationId) {
                                Text("Bez oblasti").tag(nil as String?)
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
            .sheet(isPresented: $showIconPicker) {
                IconPickerView(selectedIcon: $selectedIcon)
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
                    icon: selectedIcon,
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
                    goalId: selectedGoalId,
                    areaId: nil,
                    isRepeating: nil,
                    frequency: nil,
                    selectedDays: nil,
                    recurringStartDate: nil,
                    recurringEndDate: nil,
                    recurringDisplayMode: nil
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

// MARK: - Dark Mode Settings View
struct DarkModeSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("appearanceMode") private var appearanceMode: String = "system"
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    Text("Vyberte vzhled aplikace")
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .padding(.top, DesignSystem.Spacing.md)
                    
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        AppearanceOptionView(
                            title: "Automaticky",
                            subtitle: "Použít nastavení systému",
                            icon: "circle.lefthalf.filled",
                            isSelected: appearanceMode == "system",
                            onTap: {
                                appearanceMode = "system"
                            }
                        )
                        
                        AppearanceOptionView(
                            title: "Světlý",
                            subtitle: "Vždy použít světlý režim",
                            icon: "sun.max.fill",
                            isSelected: appearanceMode == "light",
                            onTap: {
                                appearanceMode = "light"
                            }
                        )
                        
                        AppearanceOptionView(
                            title: "Tmavý",
                            subtitle: "Vždy použít tmavý režim",
                            icon: "moon.fill",
                            isSelected: appearanceMode == "dark",
                            onTap: {
                                appearanceMode = "dark"
                            }
                        )
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    
                    Spacer(minLength: 100)
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Tmavý režim")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Hotovo") {
                        dismiss()
                    }
                }
            }
        }
        .preferredColorScheme(appearanceMode == "system" ? nil : (appearanceMode == "dark" ? .dark : .light))
    }
}

// MARK: - Appearance Option View
struct AppearanceOptionView: View {
    let title: String
    let subtitle: String
    let icon: String
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        ModernCard {
            Button(action: onTap) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    ModernIcon(
                        systemName: icon,
                        size: 24,
                        color: DesignSystem.Colors.dynamicPrimary,
                        backgroundColor: DesignSystem.Colors.dynamicPrimary.opacity(0.1)
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
                    
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 24))
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
            .buttonStyle(PlainButtonStyle())
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
