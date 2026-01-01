import SwiftUI

struct WeekView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var dailySteps: [DailyStep] = []
    @State private var habits: [Habit] = []
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var weekStartDate = Date()
    @State private var selectedDay: Date? = nil // Selected day for detail view
    @State private var loadingHabits: Set<String> = []
    
    private var weekDays: [Date] {
        let calendar = Calendar.current
        guard let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: weekStartDate)) else {
            return []
        }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: startOfWeek) }
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám týdenní přehled...")
            } else {
                Group {
                    if let selectedDay = selectedDay {
                        // Show detail view for selected day
                        dayDetailView(for: selectedDay)
                    } else {
                        // Show week overview
                        weekOverviewView
                    }
                }
                .background(DesignSystem.Colors.background)
            }
        }
        .navigationTitle("Týden")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            loadData()
        }
        .onChange(of: weekStartDate) {
            loadData()
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Week Overview View
    private var weekOverviewView: some View {
        ScrollView {
            VStack(spacing: DesignSystem.Spacing.lg) {
                // Week navigation header
                weekHeader
                
                // Week grid with clickable days - using LazyVGrid for full width
                LazyVGrid(columns: [GridItem(.flexible(), spacing: DesignSystem.Spacing.sm)], spacing: DesignSystem.Spacing.sm) {
                    ForEach(weekDays, id: \.self) { day in
                        dayCard(for: day)
                            .onTapGesture {
                                // Toggle day selection
                                if let selected = selectedDay, Calendar.current.isDate(selected, inSameDayAs: day) {
                                    self.selectedDay = nil
                                } else {
                                    self.selectedDay = day
                                }
                            }
                    }
                }
                
                // Bottom padding
                Spacer(minLength: 100)
            }
            .padding(.horizontal, DesignSystem.Spacing.md)
            .padding(.top, DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Day Detail View
    private func dayDetailView(for date: Date) -> some View {
        let daySteps = stepsForDay(date)
        let dayHabits = habitsForDay(date)
        let calendar = Calendar.current
        let isToday = calendar.isDate(date, inSameDayAs: Date())
        let dayNumber = calendar.component(.day, from: date)
        
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "MMMM"
        let monthName = formatter.string(from: date)
        
        formatter.dateFormat = "EEEE"
        let dayName = formatter.string(from: date).capitalized
        
        let completedSteps = daySteps.filter { $0.completed }.count
        let completedHabits = dayHabits.filter { isHabitCompleted($0, for: date) }.count
        let totalTasks = daySteps.count + dayHabits.count
        let completedTasks = completedSteps + completedHabits
        let progress = totalTasks > 0 ? Double(completedTasks) / Double(totalTasks) : 0.0
        
        return ScrollView {
            LazyVStack(spacing: DesignSystem.Spacing.lg) {
                // Back button
                Button(action: {
                    selectedDay = nil
                }) {
                    HStack {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .semibold))
                        Text("Zpět na týden")
                            .font(DesignSystem.Typography.body)
                    }
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.sm)
                
                // Header Section with Date Navigation and Progress Bar (similar to DailyPlanningView)
                PlayfulCard(variant: isToday ? .pink : .purple) {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        // Date row with navigation arrows
                        HStack(alignment: .center, spacing: DesignSystem.Spacing.sm) {
                            // Left arrow button
                            Button(action: {
                                if let prevDay = calendar.date(byAdding: .day, value: -1, to: date) {
                                    selectedDay = prevDay
                                }
                            }) {
                                Image(systemName: "chevron.left")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                                    .frame(width: 24, height: 24)
                            }
                            
                            // Date and day info
                            HStack(alignment: .bottom, spacing: DesignSystem.Spacing.xs) {
                                Text("\(dayNumber)")
                                    .font(DesignSystem.Typography.title1)
                                    .fontWeight(.bold)
                                    .foregroundColor(isToday ? DesignSystem.Colors.textPrimary : DesignSystem.Colors.textSecondary)
                                
                                Text(monthName)
                                    .font(DesignSystem.Typography.body)
                                    .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                                
                                Text(dayName)
                                    .font(DesignSystem.Typography.body)
                                    .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                            }
                            
                            Spacer()
                            
                            // Right arrow button
                            Button(action: {
                                if let nextDay = calendar.date(byAdding: .day, value: 1, to: date) {
                                    selectedDay = nextDay
                                }
                            }) {
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                                    .frame(width: 24, height: 24)
                            }
                        }
                        
                        // Progress bar (without percentage)
                        PlayfulProgressBar(
                            progress: progress,
                            variant: .yellowGreen
                        )
                    }
                    .padding(DesignSystem.Spacing.sm)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                
                // Steps Section
                stepsSection(for: date)
                
                // Habits Section
                habitsSection(for: date)
                
                // Bottom padding
                Spacer(minLength: 100)
            }
            .padding(.top, DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Steps Section for Day
    private func stepsSection(for date: Date) -> some View {
        let daySteps = stepsForDay(date)
        
        return VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Kroky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .padding(.horizontal, DesignSystem.Spacing.md)
            
            if daySteps.isEmpty {
                Text("Žádné kroky")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.vertical, DesignSystem.Spacing.sm)
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(daySteps.filter { $0.date != nil }, id: \.id) { step in
                        let goal = goals.first { $0.id == step.goalId }
                        let calendar = Calendar.current
                        let today = calendar.startOfDay(for: Date())
                        if let stepDateValue = step.date {
                            let stepDate = calendar.startOfDay(for: stepDateValue)
                        let isOverdue = stepDate < today && !step.completed
                        let isFuture = stepDate > today
                        
                        PlayfulStepCard(
                            step: step,
                            goalTitle: goal?.title,
                            isOverdue: isOverdue,
                            isFuture: isFuture,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Habits Section for Day
    private func habitsSection(for date: Date) -> some View {
        let dayHabits = habitsForDay(date)
        
        return VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Návyky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
                .padding(.horizontal, DesignSystem.Spacing.md)
            
            if dayHabits.isEmpty {
                Text("Žádné návyky")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.vertical, DesignSystem.Spacing.sm)
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(dayHabits, id: \.id) { habit in
                        PlayfulHabitCard(
                            habit: habit,
                            isCompleted: isHabitCompleted(habit, for: date),
                            onToggle: {
                                if !loadingHabits.contains(habit.id) {
                                    toggleHabitCompletion(habit: habit, for: date)
                                }
                            }
                        )
                        .disabled(loadingHabits.contains(habit.id))
                        .padding(.horizontal, DesignSystem.Spacing.md)
                    }
                }
            }
        }
    }
    
    // MARK: - Week Header
    private var weekHeader: some View {
        PlayfulCard(variant: .pink) {
            HStack(spacing: DesignSystem.Spacing.md) {
                Button(action: {
                    weekStartDate = Calendar.current.date(byAdding: .weekOfYear, value: -1, to: weekStartDate) ?? weekStartDate
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        .frame(width: 32, height: 32)
                }
                
                Spacer()
                
                Text(weekRangeText)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Spacer()
                
                Button(action: {
                    weekStartDate = Calendar.current.date(byAdding: .weekOfYear, value: 1, to: weekStartDate) ?? weekStartDate
                }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        .frame(width: 32, height: 32)
                }
            }
            .padding(DesignSystem.Spacing.sm)
        }
    }
    
    private var weekRangeText: String {
        guard let firstDay = weekDays.first, let lastDay = weekDays.last else {
            return ""
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "d.M."
        
        if Calendar.current.isDate(firstDay, equalTo: lastDay, toGranularity: .month) {
            // Same month
            return "\(formatter.string(from: firstDay)) - \(formatter.string(from: lastDay))"
        } else {
            // Different months
            formatter.dateFormat = "d.M."
            return "\(formatter.string(from: firstDay)) - \(formatter.string(from: lastDay))"
        }
    }
    
    // MARK: - Day Card
    private func dayCard(for date: Date) -> some View {
        let calendar = Calendar.current
        let daySteps = stepsForDay(date)
        let dayHabits = habitsForDay(date)
        let completedSteps = daySteps.filter { $0.completed }.count
        let completedHabits = dayHabits.filter { isHabitCompleted($0, for: date) }.count
        let totalTasks = daySteps.count + dayHabits.count
        let completedTasks = completedSteps + completedHabits
        let progress = totalTasks > 0 ? Double(completedTasks) / Double(totalTasks) : 0.0
        let isToday = calendar.isDate(date, inSameDayAs: Date())
        
        return PlayfulCard(variant: .pink) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                // Date and statistics in one row
                HStack(alignment: .center, spacing: DesignSystem.Spacing.sm) {
                    // Date info
                    VStack(alignment: .leading, spacing: 1) {
                        Text(dayName(for: date))
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text(dayNumber(for: date))
                            .font(DesignSystem.Typography.caption2)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
                    
                    // Statistics inline
                    HStack(spacing: DesignSystem.Spacing.xs) {
                        // Steps statistics
                        HStack(spacing: 3) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 9))
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            Text("\(completedSteps)/\(daySteps.count)")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                        }
                        
                        // Habits statistics
                        HStack(spacing: 3) {
                            Image(systemName: "repeat.circle.fill")
                                .font(.system(size: 9))
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            Text("\(completedHabits)/\(dayHabits.count)")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                        }
                    }
                    
                    // Today indicator - smaller
                    if isToday {
                        Text("DNES")
                            .font(DesignSystem.Typography.caption2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            .padding(.horizontal, 3)
                            .padding(.vertical, 1)
                            .background(
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
                            )
                    }
                }
                
                // Progress bar - smaller
                if totalTasks > 0 {
                    PlayfulProgressBar(
                        progress: progress,
                        height: 4,
                        variant: .yellowGreen
                    )
                }
            }
            .padding(.horizontal, DesignSystem.Spacing.sm)
            .padding(.vertical, DesignSystem.Spacing.xs)
            .overlay(
                // Extra border for today
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(isToday ? DesignSystem.Colors.dynamicPrimary : Color.clear, lineWidth: 2)
            )
        }
    }
    
    private func dayName(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date).capitalized
    }
    
    private func dayNumber(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "d.M."
        return formatter.string(from: date)
    }
    
    // MARK: - Helper Functions
    private func stepsForDay(_ date: Date) -> [DailyStep] {
        let calendar = Calendar.current
        let dateStartOfDay = calendar.startOfDay(for: date)
        
        return dailySteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return calendar.isDate(stepStartOfDay, inSameDayAs: dateStartOfDay)
        }
    }
    
    private func habitsForDay(_ date: Date) -> [Habit] {
        let calendar = Calendar.current
        let weekday = calendar.component(.weekday, from: date)
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
    
    private func isHabitCompleted(_ habit: Habit, for date: Date) -> Bool {
        let dateStr = formatDateString(date)
        return habit.habitCompletions?[dateStr] == true
    }
    
    private func formatDateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    // MARK: - Actions
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                guard let currentStep = dailySteps.first(where: { $0.id == stepId }) else {
                    return
                }
                
                let updatedStep = try await apiManager.updateStepCompletion(stepId: stepId, completed: completed, currentStep: currentStep)
                
                await MainActor.run {
                    // Update local state
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
    
    private func toggleHabitCompletion(habit: Habit, for date: Date) {
        let dateStr = formatDateString(date)
        
        loadingHabits.insert(habit.id)
        
        Task {
            do {
                let updatedHabit = try await apiManager.toggleHabitCompletion(habitId: habit.id, date: dateStr)
                
                await MainActor.run {
                    if let index = habits.firstIndex(where: { $0.id == habit.id }) {
                        habits[index] = updatedHabit
                    }
                    loadingHabits.remove(habit.id)
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
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                let calendar = Calendar.current
                guard let weekStart = weekDays.first, let weekEnd = weekDays.last else {
                    return
                }
                
                // Load data for entire week plus some buffer for selected day detail
                let startDate = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: weekStart)) ?? weekStart
                let endDate = calendar.date(byAdding: .day, value: 1, to: weekEnd) ?? weekEnd
                
                async let stepsTask = apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                async let goalsTask = apiManager.fetchGoals()
                async let habitsTask = apiManager.fetchHabits()
                
                let allSteps = (try? await stepsTask) ?? []
                let goals = (try? await goalsTask) ?? []
                let habits = (try? await habitsTask) ?? []
                
                await MainActor.run {
                    self.dailySteps = allSteps
                    self.goals = goals
                    self.habits = habits
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
