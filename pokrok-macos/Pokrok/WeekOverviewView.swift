import SwiftUI

struct WeekOverviewView: View {
    @Binding var goals: [Goal]
    @Binding var habits: [Habit]
    @Binding var steps: [Step]
    @StateObject private var localizationManager = LocalizationManager.shared
    @State private var currentWeekStart: Date = Date().startOfWeek
    @State private var selectedDay: Date? = nil
    @State private var editingStep: Step? = nil
    @State private var showingAddStep = false
    
    private var weekDays: [Date] {
        (0..<7).map { currentWeekStart.addingTimeInterval(Double($0) * 86400) }
    }
    
    private var today: Date {
        Calendar.current.startOfDay(for: Date())
    }
    
    private var headerText: String {
        let localeCode = localizationManager.currentLocale == .cs ? "cs_CZ" : "en_US"
        if let selected = selectedDay {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE, d. MMMM yyyy"
            formatter.locale = Foundation.Locale(identifier: localeCode)
            return formatter.string(from: selected)
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "d"
            let startDay = formatter.string(from: currentWeekStart)
            let endDay = formatter.string(from: weekDays[6])
            formatter.dateFormat = "MMMM yyyy"
            formatter.locale = Foundation.Locale(identifier: localeCode)
            let monthYear = formatter.string(from: weekDays[6])
            return "\(startDay). - \(endDay). \(monthYear)"
        }
    }
    
    private var weekStats: WeekStats {
        var totalTasks = 0
        var completedTasks = 0
        
        for day in weekDays {
            let dayStats = getDayStats(for: day)
            totalTasks += dayStats.total
            completedTasks += dayStats.completed
        }
        
        let progress = totalTasks > 0 ? Double(completedTasks) / Double(totalTasks) : 0
        return WeekStats(progress: progress, completed: completedTasks, total: totalTasks)
    }
    
    private var isWeekView: Bool {
        selectedDay == nil
    }
    
    private var displayStats: WeekStats {
        if let selected = selectedDay {
            let dayStats = getDayStats(for: selected)
            let progress = dayStats.total > 0 ? Double(dayStats.completed) / Double(dayStats.total) : 0
            return WeekStats(progress: progress, completed: dayStats.completed, total: dayStats.total)
        }
        return weekStats
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                Text(headerText.capitalized)
                    .font(.title.bold())
                    .foregroundColor(.primary)
                
                // Week Timeline
                WeekTimelineView(
                    weekDays: weekDays,
                    today: today,
                    selectedDay: $selectedDay,
                    getDayStats: getDayStats,
                    onPrevWeek: { 
                        currentWeekStart = currentWeekStart.addingTimeInterval(-7 * 86400)
                        selectedDay = nil
                    },
                    onNextWeek: { 
                        currentWeekStart = currentWeekStart.addingTimeInterval(7 * 86400)
                        selectedDay = nil
                    }
                )
                
                // Stats Bar
                StatsBarView(stats: displayStats)
                
                // Weekly Focus or Daily Focus based on selection
                if isWeekView {
                    VStack(spacing: 20) {
                        WeeklyFocusView(
                            habits: habits,
                            steps: steps,
                            weekDays: weekDays,
                            selectedDay: selectedDay,
                            onHabitToggle: toggleHabit,
                            onStepToggle: toggleStep,
                            onStepEdit: { step in editingStep = step }
                        )
                        
                        // Other Steps (Overdue and Future)
                        OtherStepsView(
                            steps: steps,
                            weekDays: weekDays,
                            goals: goals,
                            onStepToggle: toggleStep,
                            onStepEdit: { step in editingStep = step },
                            onAddStep: { showingAddStep = true }
                        )
                    }
                } else if let selected = selectedDay {
                    DailyFocusView(
                        habits: habits,
                        steps: steps,
                        selectedDay: selected,
                        onHabitToggle: toggleHabit,
                        onStepToggle: toggleStep,
                        onStepEdit: { step in editingStep = step }
                    )
                }
            }
            .padding(24)
        }
        .background(Color.orange.opacity(0.03))
        .sheet(item: $editingStep) { step in
            StepEditModal(step: step, goals: goals, steps: $steps, onDismiss: {
                editingStep = nil
            })
        }
        .sheet(isPresented: $showingAddStep) {
            StepEditModal(step: nil, goals: goals, steps: $steps, onDismiss: {
                showingAddStep = false
            })
        }
    }
    
    private func getDayStats(for date: Date) -> DayStats {
        let dayOfWeek = Calendar.current.component(.weekday, from: date)
        let dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let dayName = dayNames[dayOfWeek - 1]
        let dateStr = dateString(from: date)
        
        // Count habits for this day (daily or custom with this day selected)
        let dayHabits = habits.filter { habit in
            if habit.frequency == "daily" { return true }
            if habit.frequency == "custom", let selectedDays = habit.selectedDays {
                return selectedDays.contains(dayName)
            }
            return false
        }
        
        // Check completions using habitCompletions dictionary
        let completedHabits = dayHabits.filter { habit in
            if let completions = habit.habitCompletions {
                return completions[dateStr] == true
            }
            return false
        }.count
        
        // Count steps for this day
        let daySteps = steps.filter { step in
            guard let stepDate = step.date else { return false }
            return Calendar.current.isDate(stepDate, inSameDayAs: date)
        }
        let completedSteps = daySteps.filter { $0.completed }.count
        
        let total = dayHabits.count + daySteps.count
        let completed = completedHabits + completedSteps
        
        return DayStats(total: total, completed: completed)
    }
    
    private func dateString(from date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private func toggleHabit(_ habit: Habit, date: Date) {
        // TODO: Implement habit toggle via API for specific date
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        print("Toggle habit \(habit.name) for date \(dateStr)")
    }
    
    private func toggleStep(_ step: Step) {
        print("🔄 Toggling step: \(step.title), current state: \(step.completed)")
        
        // Optimistically update UI first
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            var optimisticStep = steps[index]
            optimisticStep.completed = !optimisticStep.completed
            optimisticStep.completedAt = optimisticStep.completed ? Date() : nil
            steps[index] = optimisticStep
            print("✅ Optimistically updated step to: \(optimisticStep.completed)")
        }
        
        // Then sync with API - send only completion fields for toggle
        Task {
            do {
                let newCompleted = !step.completed
                let completedAt = newCompleted ? Date() : nil
                
                print("📤 Sending API request to toggle step (completion only)...")
                let savedStep = try await APIManager.shared.toggleStepCompletion(stepId: step.id, completed: newCompleted, completedAt: completedAt)
                
                await MainActor.run {
                    if let index = steps.firstIndex(where: { $0.id == step.id }) {
                        steps[index] = savedStep
                        print("✅ Step '\(step.title)' synced with API: \(savedStep.completed)")
                    }
                }
            } catch {
                print("❌ Error toggling step: \(error)")
                // Revert optimistic update on error
                await MainActor.run {
                    if let index = steps.firstIndex(where: { $0.id == step.id }) {
                        steps[index] = step
                        print("🔄 Reverted step to original state")
                    }
                }
            }
        }
    }
}

// MARK: - Supporting Types

struct DayStats {
    let total: Int
    let completed: Int
    
    var isComplete: Bool {
        total > 0 && completed == total
    }
}

struct WeekStats {
    let progress: Double
    let completed: Int
    let total: Int
    
    var progressPercent: Int {
        Int(progress * 100)
    }
}

// MARK: - Week Timeline

struct WeekTimelineView: View {
    let weekDays: [Date]
    let today: Date
    @Binding var selectedDay: Date?
    let getDayStats: (Date) -> DayStats
    let onPrevWeek: () -> Void
    let onNextWeek: () -> Void
    
    private let dayNames = ["NE", "PO", "ÚT", "ST", "ČT", "PÁ", "SO"]
    
    var body: some View {
        HStack(spacing: 0) {
            // Prev button
            Button(action: onPrevWeek) {
                Image(systemName: "chevron.left")
                    .font(.title3)
                    .foregroundColor(.gray)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            
            // Days
            HStack(spacing: 8) {
                ForEach(weekDays, id: \.self) { day in
                    DayButton(
                        day: day,
                        today: today,
                        isSelected: selectedDay.map { Calendar.current.isDate($0, inSameDayAs: day) } ?? false,
                        stats: getDayStats(day),
                        dayName: dayNames[Calendar.current.component(.weekday, from: day) - 1]
                    ) {
                        if let selected = selectedDay, Calendar.current.isDate(selected, inSameDayAs: day) {
                            selectedDay = nil
                        } else {
                            selectedDay = day
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity)
            
            // Next button
            Button(action: onNextWeek) {
                Image(systemName: "chevron.right")
                    .font(.title3)
                    .foregroundColor(.gray)
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        )
    }
}

struct DayButton: View {
    let day: Date
    let today: Date
    let isSelected: Bool
    let stats: DayStats
    let dayName: String
    let action: () -> Void
    
    // Define brand colors
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047) // #ea580c
    private let successGreen = Color(red: 0.13, green: 0.77, blue: 0.37)  // #22C55E
    
    private var isToday: Bool {
        Calendar.current.isDate(day, inSameDayAs: today)
    }
    
    private var isPast: Bool {
        day < today
    }
    
    private var isFuture: Bool {
        day > today
    }
    
    private var dotColor: Color {
        if stats.isComplete && (isPast || isToday) {
            return successGreen
        } else if isToday {
            return primaryOrange
        } else if isSelected {
            return primaryOrange
        } else if isPast && stats.total > 0 {
            return Color.gray.opacity(0.4)
        }
        return Color.gray.opacity(0.25)
    }
    
    private var textColor: Color {
        if stats.isComplete && (isPast || isToday) {
            return successGreen
        } else if isToday {
            return primaryOrange
        } else if isSelected {
            return primaryOrange
        } else if isFuture {
            return Color.gray.opacity(0.6)
        }
        return Color(white: 0.3)
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 3) {
                // Dot
                ZStack {
                    Circle()
                        .fill(dotColor)
                        .frame(width: 26, height: 26)
                    
                    if stats.isComplete && (isPast || isToday) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                .overlay(
                    Circle()
                        .stroke(isSelected ? dotColor.opacity(0.4) : .clear, lineWidth: 3)
                        .frame(width: 34, height: 34)
                )
                
                // Day name
                Text(dayName)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(textColor)
                
                // Day number
                Text("\(Calendar.current.component(.day, from: day))")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(textColor)
                
                // Stats
                Text("\(stats.completed)/\(stats.total)")
                    .font(.system(size: 9))
                    .foregroundColor(stats.isComplete && stats.total > 0 ? successGreen : Color.gray.opacity(0.5))
            }
        }
        .buttonStyle(.plain)
        .frame(width: 50)
    }
}

// MARK: - Stats Bar

struct StatsBarView: View {
    let stats: WeekStats
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        HStack(spacing: 50) {
            // Progress
            VStack(spacing: 3) {
                HStack(spacing: 10) {
                    Text("\(stats.progressPercent)%")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(primaryOrange)
                    
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 3)
                                .fill(primaryOrange.opacity(0.15))
                            
                            RoundedRectangle(cornerRadius: 3)
                                .fill(
                                    LinearGradient(
                                        colors: [primaryOrange, primaryOrange.opacity(0.8)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: geo.size.width * stats.progress)
                        }
                    }
                    .frame(width: 120, height: 6)
                }
                
                Text(t("progress.title"))
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
            
            // Completed
            VStack(spacing: 3) {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundColor(primaryOrange)
                    Text("\(stats.completed)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                    Text("/\(stats.total)")
                        .font(.system(size: 13))
                        .foregroundColor(.gray)
                }
                
                Text(t("progress.completed"))
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Weekly Focus

struct WeeklyFocusView: View {
    let habits: [Habit]
    let steps: [Step]
    let weekDays: [Date]
    let selectedDay: Date?
    let onHabitToggle: (Habit, Date) -> Void
    let onStepToggle: (Step) -> Void
    let onStepEdit: (Step) -> Void
    
    private let dayNamesShort = ["PO", "ÚT", "ST", "ČT", "PÁ", "SO", "NE"]
    private let dayNamesLong = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    
    // Filter habits that should show this week
    private var weekHabits: [Habit] {
        habits.filter { habit in
            if habit.frequency == "daily" { return true }
            if habit.frequency == "custom", let selectedDays = habit.selectedDays {
                // Check if any day of the week is in selectedDays
                return weekDays.contains { day in
                    let dayOfWeek = Calendar.current.component(.weekday, from: day)
                    let dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
                    let dayName = dayNames[dayOfWeek - 1]
                    return selectedDays.contains(dayName)
                }
            }
            return false
        }
    }
    
    // Filter steps for this week
    private var weekSteps: [Step] {
        guard let weekStart = weekDays.first, let weekEnd = weekDays.last else { return [] }
        
        return steps.filter { step in
            guard let stepDate = step.date else { return false }
            return stepDate >= weekStart && stepDate <= Calendar.current.date(byAdding: .day, value: 1, to: weekEnd)!
        }.sorted { a, b in
            // Completed steps go to bottom
            if a.completed != b.completed {
                return !a.completed
            }
            // Sort by date
            guard let dateA = a.date, let dateB = b.date else { return false }
            return dateA < dateB
        }
    }
    
    private var totalMinutes: Int {
        weekSteps.reduce(0) { $0 + ($1.estimatedTime ?? 30) }
    }
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "target")
                        .font(.system(size: 16))
                        .foregroundColor(primaryOrange)
                    Text(t("focus.weeklyFocus"))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(primaryOrange)
                }
                
                Spacer()
                
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                            .font(.system(size: 11, weight: .semibold))
                        Text(t("focus.addStep"))
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundColor(primaryOrange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(primaryOrange.opacity(0.4), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
            
            HStack(alignment: .top, spacing: 20) {
                // Habits Table
                VStack(alignment: .leading, spacing: 10) {
                    Text(t("sections.habits"))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.gray)
                        .tracking(0.5)
                    
                    if weekHabits.isEmpty {
                        Text(t("habits.noHabits"))
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                            .padding(.vertical, 20)
                    } else {
                        HabitsTableView(
                            habits: weekHabits,
                            weekDays: weekDays,
                            onToggle: onHabitToggle
                        )
                    }
                }
                .frame(minWidth: 280)
                
                Divider()
                    .padding(.vertical, 4)
                
                // Steps List
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        HStack(spacing: 6) {
                            Text(t("focus.stepsThisWeek"))
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundColor(.gray)
                                .tracking(0.5)
                            
                            Text("\(weekSteps.filter { !$0.completed }.count)/\(weekSteps.count)")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                        
                        Text("\(totalMinutes) min")
                            .font(.system(size: 10))
                            .foregroundColor(.gray)
                    }
                    
                    if weekSteps.isEmpty {
                        Text(t("focus.noStepsThisWeek"))
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                            .padding(.vertical, 20)
                    } else {
                        StepsListView(steps: weekSteps, weekDays: weekDays, onToggle: onStepToggle, onEdit: onStepEdit)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Daily Focus View

struct DailyFocusView: View {
    let habits: [Habit]
    let steps: [Step]
    let selectedDay: Date
    let onHabitToggle: (Habit, Date) -> Void
    let onStepToggle: (Step) -> Void
    let onStepEdit: (Step) -> Void
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047) // #ea580c
    
    // Filter habits for selected day
    private var dayHabits: [Habit] {
        let dayOfWeek = Calendar.current.component(.weekday, from: selectedDay)
        let dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let dayName = dayNames[dayOfWeek - 1]
        
        return habits.filter { habit in
            if habit.frequency == "daily" { return true }
            if habit.frequency == "custom", let selectedDays = habit.selectedDays {
                return selectedDays.contains(dayName)
            }
            return false
        }
    }
    
    // Filter steps for selected day
    private var daySteps: [Step] {
        let dayStart = Calendar.current.startOfDay(for: selectedDay)
        let dayEnd = Calendar.current.date(byAdding: .day, value: 1, to: dayStart)!
        
        return steps.filter { step in
            guard let stepDate = step.date else { return false }
            return stepDate >= dayStart && stepDate < dayEnd
        }.sorted { a, b in
            if a.completed != b.completed {
                return !a.completed
            }
            return false
        }
    }
    
    private func isHabitCompletedForDay(_ habit: Habit) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDay)
        
        if let completions = habit.habitCompletions {
            return completions[dateStr] == true
        }
        return false
    }
    
    private var totalMinutes: Int {
        daySteps.reduce(0) { $0 + ($1.estimatedTime ?? 30) }
    }
    
    private var dayLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: selectedDay).capitalized
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "target")
                    .foregroundColor(primaryOrange)
                Text(t("focus.dailyFocus"))
                    .font(.title3.bold())
                
                Spacer()
                
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text(t("focus.addStep"))
                    }
                    .font(.subheadline)
                    .foregroundColor(primaryOrange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(primaryOrange, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
            
            HStack(alignment: .top, spacing: 24) {
                // Habits List
                VStack(alignment: .leading, spacing: 12) {
                    Text(t("sections.habits"))
                        .font(.caption.bold())
                        .foregroundColor(.secondary)
                    
                    if dayHabits.isEmpty {
                        Text(t("habits.noHabits"))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding()
                    } else {
                        VStack(spacing: 8) {
                            ForEach(dayHabits) { habit in
                                DayHabitRow(
                                    habit: habit,
                                    isCompleted: isHabitCompletedForDay(habit),
                                    onToggle: { onHabitToggle(habit, selectedDay) }
                                )
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                Divider()
                
                // Steps List
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text(t("sections.steps"))
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                        
                        Text("\(daySteps.filter { $0.completed }.count)/\(daySteps.count)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("\(totalMinutes) min")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    DayStepsListView(
                        steps: daySteps,
                        dayLabel: dayLabel,
                        onToggle: onStepToggle,
                        onEdit: onStepEdit
                    )
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
        )
    }
}

struct DayHabitRow: View {
    let habit: Habit
    let isCompleted: Bool
    let onToggle: () -> Void
    @State private var isHovering = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047) // #ea580c
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                RoundedRectangle(cornerRadius: 6)
                    .fill(isCompleted ? primaryOrange : Color.gray.opacity(0.1))
                    .frame(width: 28, height: 28)
                    .overlay(
                        isCompleted ?
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                        : nil
                    )
            }
            .buttonStyle(.plain)
            
            Text(habit.name)
                .font(.subheadline)
                .foregroundColor(isCompleted ? .secondary : .primary)
                .strikethrough(isCompleted)
            
            Spacer()
            
            if let streak = habit.streak, streak > 0 {
                HStack(spacing: 2) {
                    Image(systemName: "flame.fill")
                        .font(.caption)
                    Text("\(streak)")
                        .font(.caption)
                }
                .foregroundColor(.orange)
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.08 : 0.03), radius: isHovering ? 4 : 2, x: 0, y: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.orange.opacity(0.15), lineWidth: 1)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}

struct DayStepsListView: View {
    let steps: [Step]
    let dayLabel: String
    let onToggle: (Step) -> Void
    let onEdit: (Step) -> Void
    
    @State private var showCompleted = false
    
    private var incompleteSteps: [Step] {
        steps.filter { !$0.completed }
    }
    
    private var completedSteps: [Step] {
        steps.filter { $0.completed }
    }
    
    var body: some View {
        VStack(spacing: 8) {
            if steps.isEmpty {
                Text(t("focus.noStepsToday"))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                // Incomplete steps
                ForEach(incompleteSteps) { step in
                    DayStepRow(step: step, onToggle: { onToggle(step) }, onEdit: { onEdit(step) })
                }
                
                // Completed steps toggle
                if !completedSteps.isEmpty {
                    Button(action: { withAnimation { showCompleted.toggle() } }) {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark")
                                .font(.caption)
                            Text("\(completedSteps.count) \(t("progress.completed"))")
                                .font(.caption)
                            Image(systemName: showCompleted ? "chevron.up" : "chevron.down")
                                .font(.caption2)
                        }
                        .foregroundColor(.gray)
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                    
                    if showCompleted {
                        ForEach(completedSteps) { step in
                            DayStepRow(step: step, onToggle: { onToggle(step) }, onEdit: { onEdit(step) })
                        }
                    }
                }
            }
        }
    }
}

struct DayStepRow: View {
    let step: Step
    let onToggle: () -> Void
    let onEdit: () -> Void
    @State private var isHovering = false
    @State private var isAnimating = false
    @State private var previousCompleted: Bool = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    private let successGreen = Color(red: 0.13, green: 0.77, blue: 0.37)
    private let overdueRed = Color(red: 0.94, green: 0.27, blue: 0.27)
    
    private var isOverdue: Bool {
        guard let stepDate = step.date, !step.completed else { return false }
        return stepDate < Calendar.current.startOfDay(for: Date())
    }
    
    private var isToday: Bool {
        guard let stepDate = step.date else { return false }
        return Calendar.current.isDateInToday(stepDate)
    }
    
    private var titleColor: Color {
        if step.completed { return Color.gray.opacity(0.5) }
        if isOverdue { return overdueRed }
        return primaryOrange
    }
    
    private var borderColor: Color {
        if step.completed { return Color.gray.opacity(0.1) }
        if isOverdue { return overdueRed.opacity(0.3) }
        return primaryOrange.opacity(0.25)
    }
    
    private var backgroundColor: Color {
        if step.completed { return Color.white }
        if isOverdue { return overdueRed.opacity(0.03) }
        return primaryOrange.opacity(0.02)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Checkbox
            RoundedRectangle(cornerRadius: 6)
                .stroke(step.completed ? successGreen : (isOverdue ? overdueRed.opacity(0.6) : primaryOrange.opacity(0.5)), lineWidth: 2)
                .frame(width: 24, height: 24)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(step.completed ? successGreen : Color.clear)
                )
                .overlay(
                    step.completed ?
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .scaleEffect(isAnimating ? 1.3 : 1.0)
                        .opacity(isAnimating ? 0.9 : 1.0)
                    : nil
                )
                .scaleEffect(isAnimating ? 1.2 : 1.0)
                .contentShape(Rectangle())
                .onTapGesture {
                    onToggle()
                }
                .onAppear {
                    previousCompleted = step.completed
                }
                .onChange(of: step.completed) { oldValue, newValue in
                    // Animate when step becomes completed (was false, now true)
                    if !previousCompleted && newValue {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
                            isAnimating = true
                        }
                        
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                            withAnimation(.easeOut(duration: 0.2)) {
                                isAnimating = false
                            }
                        }
                    }
                    previousCompleted = newValue
                }
            
            // Title - clickable for edit
            HStack {
                Text(step.title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(titleColor)
                    .strikethrough(step.completed, color: Color.gray.opacity(0.4))
                    .lineLimit(2)
                
                Spacer()
                
                Text("\(step.estimatedTime ?? 30) min")
                    .font(.system(size: 11))
                    .foregroundColor(Color.gray.opacity(0.5))
            }
            .contentShape(Rectangle())
            .onTapGesture {
                onEdit()
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(backgroundColor)
                .shadow(color: .black.opacity(isHovering ? 0.04 : 0.015), radius: isHovering ? 3 : 1, x: 0, y: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(borderColor, lineWidth: isOverdue ? 1.5 : 1)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovering = hovering
            }
        }
    }
}

// MARK: - Habits Table (Compact Web-style)

struct HabitsTableView: View {
    let habits: [Habit]
    let weekDays: [Date]
    let onToggle: (Habit, Date) -> Void  // Now passes the specific date
    
    private let dayNamesShort = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    private func isHabitScheduledForDay(_ habit: Habit, day: Date) -> Bool {
        let dayOfWeek = Calendar.current.component(.weekday, from: day)
        let dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let dayName = dayNames[dayOfWeek - 1]
        
        if habit.frequency == "daily" { return true }
        if habit.frequency == "custom", let selectedDays = habit.selectedDays {
            return selectedDays.contains(dayName)
        }
        return false
    }
    
    private func isHabitCompletedForDay(_ habit: Habit, day: Date) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: day)
        
        if let completions = habit.habitCompletions {
            return completions[dateStr] == true
        }
        return false
    }
    
    var body: some View {
        VStack(spacing: 6) {
            // Header row with day names
            HStack(spacing: 0) {
                Text("")
                    .frame(width: 110, alignment: .leading)
                
                ForEach(0..<7, id: \.self) { i in
                    let day = weekDays[i]
                    let isToday = Calendar.current.isDateInToday(day)
                    let dayIndex = (Calendar.current.component(.weekday, from: day) + 5) % 7
                    
                    VStack(spacing: 1) {
                        Text(dayNamesShort[dayIndex])
                            .font(.system(size: 8, weight: .semibold))
                            .foregroundColor(isToday ? primaryOrange : Color.gray.opacity(0.5))
                        Text("\(Calendar.current.component(.day, from: day))")
                            .font(.system(size: 9, weight: isToday ? .bold : .medium))
                            .foregroundColor(isToday ? primaryOrange : Color.gray.opacity(0.6))
                    }
                    .frame(width: 30)
                    .padding(.vertical, 4)
                    .background(isToday ? primaryOrange.opacity(0.1) : .clear)
                    .cornerRadius(5)
                }
            }
            
            // Habit rows
            ForEach(habits) { habit in
                HStack(spacing: 0) {
                    Text(habit.name)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(Color(white: 0.35))
                        .lineLimit(1)
                        .frame(width: 110, alignment: .leading)
                    
                    ForEach(0..<7, id: \.self) { i in
                        let day = weekDays[i]
                        let isScheduled = isHabitScheduledForDay(habit, day: day)
                        let isCompleted = isHabitCompletedForDay(habit, day: day)
                        let isFuture = day > Calendar.current.startOfDay(for: Date())
                        
                        Button(action: {
                            if !isFuture {
                                onToggle(habit, day)
                            }
                        }) {
                            RoundedRectangle(cornerRadius: 5)
                                .fill(
                                    isCompleted ? primaryOrange :
                                    !isScheduled ? Color.gray.opacity(0.05) :
                                    isFuture ? Color.gray.opacity(0.08) : Color.gray.opacity(0.18)
                                )
                                .frame(width: 26, height: 26)
                                .overlay(
                                    isCompleted ?
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                    : nil
                                )
                                .overlay(
                                    // Border for scheduled but not completed
                                    RoundedRectangle(cornerRadius: 5)
                                        .stroke(
                                            isScheduled && !isCompleted && !isFuture ? primaryOrange.opacity(0.3) : Color.clear,
                                            lineWidth: 1
                                        )
                                )
                        }
                        .buttonStyle(.plain)
                        .frame(width: 30)
                        .disabled(isFuture)
                        .opacity(isFuture ? 0.5 : 1)
                    }
                }
                .padding(.vertical, 3)
            }
        }
    }
}

// MARK: - Steps List

struct StepsListView: View {
    let steps: [Step]
    let weekDays: [Date]
    let onToggle: (Step) -> Void
    let onEdit: (Step) -> Void
    
    @State private var showCompleted = false
    
    private var incompleteSteps: [Step] {
        steps.filter { !$0.completed }
    }
    
    private var completedSteps: [Step] {
        steps.filter { $0.completed }
    }
    
    var body: some View {
        VStack(spacing: 6) {
            // Incomplete steps
            ForEach(incompleteSteps) { step in
                StepRowView(step: step, weekDays: weekDays, onToggle: { onToggle(step) }, onEdit: { onEdit(step) })
            }
            
            // Completed steps toggle
            if !completedSteps.isEmpty {
                Button(action: { withAnimation(.easeInOut(duration: 0.2)) { showCompleted.toggle() } }) {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 9))
                        Text("\(completedSteps.count) splněn\(completedSteps.count == 1 ? "ý" : "ých") krok\(completedSteps.count == 1 ? "" : "ů")")
                            .font(.system(size: 11))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 8))
                            .rotationEffect(.degrees(showCompleted ? 180 : 0))
                    }
                    .foregroundColor(.gray.opacity(0.7))
                    .padding(.top, 8)
                }
                .buttonStyle(.plain)
                
                if showCompleted {
                    ForEach(completedSteps) { step in
                        StepRowView(step: step, weekDays: weekDays, onToggle: { onToggle(step) }, onEdit: { onEdit(step) })
                            .opacity(0.7)
                    }
                }
            }
        }
    }
}

struct StepRowView: View {
    let step: Step
    let weekDays: [Date]
    let onToggle: () -> Void
    let onEdit: () -> Void
    @State private var isHovering = false
    @State private var isAnimating = false
    @State private var previousCompleted: Bool = false
    
    // Brand colors
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    private let successGreen = Color(red: 0.13, green: 0.77, blue: 0.37)
    private let overdueRed = Color(red: 0.94, green: 0.27, blue: 0.27) // #EF4444
    
    private var isOverdue: Bool {
        guard let stepDate = step.date, !step.completed else { return false }
        return stepDate < Calendar.current.startOfDay(for: Date())
    }
    
    private var isToday: Bool {
        guard let stepDate = step.date else { return false }
        return Calendar.current.isDateInToday(stepDate)
    }
    
    private var isFuture: Bool {
        guard let stepDate = step.date else { return false }
        return stepDate > Calendar.current.startOfDay(for: Date())
    }
    
    private var dateLabel: String {
        guard let stepDate = step.date else { return "" }
        
        if isOverdue {
            return "❗ Overdue"
        } else if Calendar.current.isDateInToday(stepDate) {
            return "Today"
        } else if Calendar.current.isDateInTomorrow(stepDate) {
            return "Tomorrow"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE"
            formatter.locale = Locale(identifier: "en_US")
            return formatter.string(from: stepDate)
        }
    }
    
    private var timeLabel: String {
        let minutes = step.estimatedTime ?? 30
        return "\(minutes) min"
    }
    
    private var checklistProgress: (completed: Int, total: Int)? {
        guard let checklist = step.checklist, !checklist.isEmpty else { return nil }
        let completed = checklist.filter { $0.completed }.count
        return (completed, checklist.count)
    }
    
    // Colors based on status
    private var titleColor: Color {
        if step.completed { return Color.gray.opacity(0.5) }
        if isOverdue { return overdueRed }
        if isToday { return primaryOrange }
        return Color(white: 0.4)
    }
    
    private var dateLabelColor: Color {
        if step.completed { return Color.gray.opacity(0.4) }
        if isOverdue { return overdueRed }
        if isToday { return primaryOrange }
        return Color.gray.opacity(0.5)
    }
    
    private var borderColor: Color {
        if step.completed { return Color.gray.opacity(0.08) }
        if isOverdue { return overdueRed.opacity(0.3) }
        if isToday { return primaryOrange.opacity(0.3) }
        return Color.gray.opacity(0.12)
    }
    
    private var backgroundColor: Color {
        if step.completed { return Color.white }
        if isOverdue { return overdueRed.opacity(0.03) }
        if isToday { return primaryOrange.opacity(0.02) }
        return Color.white
    }
    
    private var checkboxBorderColor: Color {
        if step.completed { return successGreen }
        if isOverdue { return overdueRed.opacity(0.6) }
        if isToday { return primaryOrange.opacity(0.6) }
        return Color.gray.opacity(0.3)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            // Checkbox - square with checkmark
            RoundedRectangle(cornerRadius: 6)
                .stroke(step.completed ? successGreen : checkboxBorderColor, lineWidth: 2)
                .frame(width: 24, height: 24)
                .background(
                    RoundedRectangle(cornerRadius: 6)
                        .fill(step.completed ? successGreen : Color.clear)
                )
                .overlay(
                    step.completed ?
                    Image(systemName: "checkmark")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                        .scaleEffect(isAnimating ? 1.3 : 1.0)
                        .opacity(isAnimating ? 0.9 : 1.0)
                    : nil
                )
                .scaleEffect(isAnimating ? 1.2 : 1.0)
                .contentShape(Rectangle())
                .onTapGesture {
                    onToggle()
                }
                .onAppear {
                    previousCompleted = step.completed
                }
                .onChange(of: step.completed) { oldValue, newValue in
                    // Animate when step becomes completed (was false, now true)
                    if !previousCompleted && newValue {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) {
                            isAnimating = true
                        }
                        
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                            withAnimation(.easeOut(duration: 0.2)) {
                                isAnimating = false
                            }
                        }
                    }
                    previousCompleted = newValue
                }
            
            // Title and checklist progress - clickable for edit
            HStack(spacing: 6) {
                Text(step.title)
                    .font(.system(size: 13, weight: step.isImportant == true ? .semibold : .medium))
                    .foregroundColor(titleColor)
                    .strikethrough(step.completed, color: Color.gray.opacity(0.4))
                    .lineLimit(1)
                
                // Checklist indicator
                if let progress = checklistProgress {
                    Text("\(progress.completed)/\(progress.total)")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(Color.gray.opacity(0.6))
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.gray.opacity(0.08))
                        .cornerRadius(4)
                }
                
                Spacer()
                
                // Date label
                Text(dateLabel)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(dateLabelColor)
                
                // Time
                Text(timeLabel)
                    .font(.system(size: 11))
                    .foregroundColor(Color.gray.opacity(0.5))
            }
            .contentShape(Rectangle())
            .onTapGesture {
                onEdit()
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(backgroundColor)
                .shadow(color: .black.opacity(isHovering ? 0.04 : 0.015), radius: isHovering ? 3 : 1, x: 0, y: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(borderColor, lineWidth: isOverdue || isToday ? 1.5 : 1)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovering = hovering
            }
        }
    }
}

// MARK: - Other Steps View

// MARK: - Other Steps View

struct OtherStepsView: View {
    let steps: [Step]
    let weekDays: [Date]
    let goals: [Goal]
    let onStepToggle: (Step) -> Void
    let onStepEdit: (Step) -> Void
    let onAddStep: () -> Void
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    private var weekStart: Date {
        weekDays.first ?? Date()
    }
    
    private var weekEnd: Date {
        weekDays.last ?? Date()
    }
    
    private var today: Date {
        Calendar.current.startOfDay(for: Date())
    }
    
    private var otherSteps: [Step] {
        // Get all steps that are not in the current week and not completed
        steps.filter { step in
            guard let stepDate = step.date, !step.completed else { return false }
            
            let calendar = Calendar.current
            let stepDateStart = calendar.startOfDay(for: stepDate)
            let weekStartStart = calendar.startOfDay(for: weekStart)
            let weekEndStart = calendar.startOfDay(for: weekEnd)
            
            // Exclude steps from current week
            return stepDateStart < weekStartStart || stepDateStart > weekEndStart
        }
    }
    
    private var overdueSteps: [Step] {
        otherSteps.filter { step in
            guard let stepDate = step.date else { return false }
            let calendar = Calendar.current
            let stepDateStart = calendar.startOfDay(for: stepDate)
            return stepDateStart < today
        }
    }
    
    private var futureSteps: [Step] {
        otherSteps.filter { step in
            guard let stepDate = step.date else { return false }
            let calendar = Calendar.current
            let stepDateStart = calendar.startOfDay(for: stepDate)
            let weekEndStart = calendar.startOfDay(for: weekEnd)
            return stepDateStart > weekEndStart
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Text(t("focus.otherSteps"))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundColor(Color(white: 0.2))
                
                Spacer()
                
                Button(action: onAddStep) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(primaryOrange)
                        .frame(width: 24, height: 24)
                        .background(primaryOrange.opacity(0.1))
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
            }
            
            // Two columns: Overdue and Future
            HStack(alignment: .top, spacing: 16) {
                // Overdue Steps
                VStack(alignment: .leading, spacing: 8) {
                    Text(t("focus.overdueSteps"))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(0.5)
                    
                    if overdueSteps.isEmpty {
                        Text(t("focus.noOverdueSteps"))
                            .font(.system(size: 12))
                            .foregroundColor(.gray.opacity(0.5))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                    } else {
                        VStack(spacing: 6) {
                            ForEach(overdueSteps) { step in
                                OtherStepRow(
                                    step: step,
                                    isOverdue: true,
                                    weekStart: weekStart,
                                    weekEnd: weekEnd,
                                    onToggle: { onStepToggle(step) },
                                    onEdit: { onStepEdit(step) }
                                )
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                
                // Future Steps
                VStack(alignment: .leading, spacing: 8) {
                    Text(t("focus.futureSteps"))
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.gray.opacity(0.6))
                        .tracking(0.5)
                    
                    if futureSteps.isEmpty {
                        Text(t("focus.noFutureSteps"))
                            .font(.system(size: 12))
                            .foregroundColor(.gray.opacity(0.5))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                    } else {
                        VStack(spacing: 6) {
                            ForEach(futureSteps) { step in
                                OtherStepRow(
                                    step: step,
                                    isOverdue: false,
                                    weekStart: weekStart,
                                    weekEnd: weekEnd,
                                    onToggle: { onStepToggle(step) },
                                    onEdit: { onStepEdit(step) }
                                )
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Other Step Row

struct OtherStepRow: View {
    let step: Step
    let isOverdue: Bool
    let weekStart: Date
    let weekEnd: Date
    let onToggle: () -> Void
    let onEdit: () -> Void
    
    @State private var isHovering = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    private var isInCurrentWeek: Bool {
        guard let stepDate = step.date else { return false }
        let calendar = Calendar.current
        let stepDateStart = calendar.startOfDay(for: stepDate)
        let weekStartStart = calendar.startOfDay(for: weekStart)
        let weekEndStart = calendar.startOfDay(for: weekEnd)
        return stepDateStart >= weekStartStart && stepDateStart <= weekEndStart
    }
    
    private var dateString: String {
        guard let date = step.date else { return "" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        
        if isInCurrentWeek {
            // Pro kroky v aktuálním týdnu zobraz jen den v týdnu
            formatter.dateFormat = "EEEE"
            return formatter.string(from: date).capitalized
        } else {
            // Pro kroky mimo aktuální týden zobraz celé datum včetně roku
            formatter.dateFormat = "d. MMMM yyyy"
            return formatter.string(from: date)
        }
    }
    
    private var timeString: String {
        guard let time = step.estimatedTime, time > 0 else { return "" }
        return "\(time) min"
    }
    
    private var titleColor: Color {
        if step.completed {
            return Color.gray.opacity(0.5)
        } else if isOverdue {
            return Color.red.opacity(0.8)
        } else {
            return Color(white: 0.2)
        }
    }
    
    private var dateTimeColor: Color {
        isOverdue ? Color.red.opacity(0.7) : Color.gray.opacity(0.6)
    }
    
    private var backgroundColor: Color {
        isOverdue && !step.completed ? Color.red.opacity(0.05) : Color.gray.opacity(0.03)
    }
    
    private var borderColor: Color {
        isOverdue && !step.completed ? Color.red.opacity(0.3) : Color.gray.opacity(0.15)
    }
    
    private var checkboxFill: Color {
        step.completed ? primaryOrange : Color.white
    }
    
    private var checkboxStroke: Color {
        isOverdue ? Color.red.opacity(0.4) : Color.gray.opacity(0.3)
    }
    
    var body: some View {
        HStack(spacing: 10) {
            // Checkbox
            checkboxView
            
            // Title
            Text(step.title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(titleColor)
                .strikethrough(step.completed)
                .lineLimit(1)
            
            Spacer()
            
            // Date and time
            dateTimeView
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(backgroundColor)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(borderColor, lineWidth: 1)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onEdit()
        }
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                isHovering = hovering
            }
        }
    }
    
    private var checkboxView: some View {
        Button(action: onToggle) {
            RoundedRectangle(cornerRadius: 5)
                .fill(checkboxFill)
                .frame(width: 20, height: 20)
                .overlay(
                    RoundedRectangle(cornerRadius: 5)
                        .stroke(checkboxStroke, lineWidth: 2)
                )
                .overlay(
                    Group {
                        if step.completed {
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                )
        }
        .buttonStyle(.plain)
    }
    
    private var dateTimeView: some View {
        HStack(spacing: 8) {
            if isOverdue && !step.completed {
                Text("❗")
                    .font(.system(size: 10))
            }
            
            if !dateString.isEmpty {
                Text(dateString)
                    .font(.system(size: 11))
                    .foregroundColor(dateTimeColor)
            }
            
            if !timeString.isEmpty {
                Text(timeString)
                    .font(.system(size: 11))
                    .foregroundColor(dateTimeColor)
            }
        }
    }
}

struct ChecklistItemRow: View {
    @Binding var item: ChecklistItem
    let onDelete: () -> Void
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: { item.completed.toggle() }) {
                checkboxView
            }
            .buttonStyle(.plain)
            
            TextField("Název položky...", text: $item.title)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .foregroundColor(item.completed ? .gray : Color(white: 0.25))
            
            Spacer()
            
            Button(action: onDelete) {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.gray.opacity(0.4))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(rowBackground)
        .overlay(rowBorder)
    }
    
    private var checkboxView: some View {
        RoundedRectangle(cornerRadius: 5)
            .fill(item.completed ? primaryOrange : Color.white)
            .frame(width: 20, height: 20)
            .overlay(
                RoundedRectangle(cornerRadius: 5)
                    .stroke(item.completed ? primaryOrange : Color.gray.opacity(0.35), lineWidth: 2)
            )
            .overlay(
                Group {
                    if item.completed {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            )
    }
    
    private var rowBackground: some View {
        RoundedRectangle(cornerRadius: 10)
            .fill(item.completed ? primaryOrange.opacity(0.06) : Color.gray.opacity(0.04))
    }
    
    private var rowBorder: some View {
        RoundedRectangle(cornerRadius: 10)
            .stroke(item.completed ? primaryOrange.opacity(0.25) : Color.gray.opacity(0.12), lineWidth: 1)
    }
}

// MARK: - Date Extensions

extension Date {
    var startOfWeek: Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: self)
        return calendar.date(from: components) ?? self
    }
}

#Preview {
    WeekOverviewView(
        goals: .constant([]),
        habits: .constant([]),
        steps: .constant([])
    )
}

