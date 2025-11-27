import SwiftUI

struct WeekOverviewView: View {
    @Binding var goals: [Goal]
    @Binding var habits: [Habit]
    @Binding var steps: [Step]
    @State private var currentWeekStart: Date = Date().startOfWeek
    @State private var selectedDay: Date? = nil
    
    private var weekDays: [Date] {
        (0..<7).map { currentWeekStart.addingTimeInterval(Double($0) * 86400) }
    }
    
    private var today: Date {
        Calendar.current.startOfDay(for: Date())
    }
    
    private var headerText: String {
        if let selected = selectedDay {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE, d. MMMM yyyy"
            formatter.locale = Locale(identifier: "cs_CZ")
            return formatter.string(from: selected)
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "d"
            let startDay = formatter.string(from: currentWeekStart)
            let endDay = formatter.string(from: weekDays[6])
            formatter.dateFormat = "MMMM yyyy"
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
                    onPrevWeek: { currentWeekStart = currentWeekStart.addingTimeInterval(-7 * 86400) },
                    onNextWeek: { currentWeekStart = currentWeekStart.addingTimeInterval(7 * 86400) }
                )
                
                // Stats Bar
                StatsBarView(stats: weekStats)
                
                // Weekly Focus
                WeeklyFocusView(
                    habits: habits,
                    steps: steps,
                    weekDays: weekDays,
                    selectedDay: selectedDay,
                    onHabitToggle: toggleHabit,
                    onStepToggle: toggleStep
                )
            }
            .padding(24)
        }
        .background(Color.orange.opacity(0.03))
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
    
    private func toggleHabit(_ habit: Habit) {
        // TODO: Implement habit toggle via API
    }
    
    private func toggleStep(_ step: Step) {
        // TODO: Implement step toggle via API
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
    
    private var isToday: Bool {
        Calendar.current.isDate(day, inSameDayAs: today)
    }
    
    private var isPast: Bool {
        day < today
    }
    
    private var dotColor: Color {
        if stats.isComplete && (isPast || isToday) {
            return .green
        } else if isSelected || isToday {
            return .orange
        } else if isPast && stats.total > 0 {
            return Color.gray.opacity(0.5)
        }
        return Color.gray.opacity(0.3)
    }
    
    private var textColor: Color {
        if stats.isComplete && (isPast || isToday) {
            return .green
        } else if isSelected || isToday {
            return .orange
        }
        return .primary
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                // Dot
                ZStack {
                    Circle()
                        .fill(dotColor)
                        .frame(width: 24, height: 24)
                    
                    if stats.isComplete && (isPast || isToday) {
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }
                .overlay(
                    Circle()
                        .stroke(isSelected ? dotColor : .clear, lineWidth: 3)
                        .frame(width: 32, height: 32)
                )
                
                // Day name
                Text(dayName)
                    .font(.caption2.bold())
                    .foregroundColor(textColor.opacity(0.8))
                
                // Day number
                Text("\(Calendar.current.component(.day, from: day))")
                    .font(.headline.bold())
                    .foregroundColor(textColor)
                
                // Stats
                Text("\(stats.completed)/\(stats.total)")
                    .font(.system(size: 10))
                    .foregroundColor(stats.isComplete && stats.total > 0 ? .green : .gray)
            }
        }
        .buttonStyle(.plain)
        .frame(width: 50)
    }
}

// MARK: - Stats Bar

struct StatsBarView: View {
    let stats: WeekStats
    
    var body: some View {
        HStack(spacing: 40) {
            // Progress
            VStack(spacing: 4) {
                HStack(spacing: 8) {
                    Text("\(stats.progressPercent)%")
                        .font(.title2.bold())
                        .foregroundColor(.orange)
                    
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.orange.opacity(0.2))
                            
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.orange)
                                .frame(width: geo.size.width * stats.progress)
                        }
                    }
                    .frame(width: 100, height: 8)
                }
                
                Text("Progress")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Completed
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.orange)
                    Text("\(stats.completed)")
                        .font(.title2.bold())
                    Text("/\(stats.total)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Text("Completed")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Weekly Focus

struct WeeklyFocusView: View {
    let habits: [Habit]
    let steps: [Step]
    let weekDays: [Date]
    let selectedDay: Date?
    let onHabitToggle: (Habit) -> Void
    let onStepToggle: (Step) -> Void
    
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
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "target")
                    .foregroundColor(.orange)
                Text("Weekly Focus")
                    .font(.title3.bold())
                
                Spacer()
                
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                        Text("Add Step")
                    }
                    .font(.subheadline)
                    .foregroundColor(.orange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.orange, lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
            
            HStack(alignment: .top, spacing: 24) {
                // Habits Table
                VStack(alignment: .leading, spacing: 12) {
                    Text("HABITS")
                        .font(.caption.bold())
                        .foregroundColor(.secondary)
                    
                    if weekHabits.isEmpty {
                        Text("No habits yet")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding()
                    } else {
                        HabitsTableView(
                            habits: weekHabits,
                            weekDays: weekDays,
                            onToggle: onHabitToggle
                        )
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                Divider()
                
                // Steps List
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("STEPS THIS WEEK")
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                        
                        Text("\(weekSteps.filter { $0.completed }.count)/\(weekSteps.count)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("\(totalMinutes) min")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if weekSteps.isEmpty {
                        Text("No steps scheduled")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding()
                    } else {
                        StepsListView(steps: weekSteps, weekDays: weekDays, onToggle: onStepToggle)
                    }
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

// MARK: - Habits Table

struct HabitsTableView: View {
    let habits: [Habit]
    let weekDays: [Date]
    let onToggle: (Habit) -> Void
    
    private let dayNamesShort = ["PO", "ÚT", "ST", "ČT", "PÁ", "SO", "NE"]
    
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
        VStack(spacing: 0) {
            // Header row
            HStack(spacing: 0) {
                Text("")
                    .frame(width: 120, alignment: .leading)
                
                ForEach(0..<7, id: \.self) { i in
                    let day = weekDays[i]
                    let isToday = Calendar.current.isDateInToday(day)
                    // Convert to Monday-based index
                    let dayIndex = (Calendar.current.component(.weekday, from: day) + 5) % 7
                    
                    VStack(spacing: 2) {
                        Text(dayNamesShort[dayIndex])
                            .font(.system(size: 10))
                        Text("\(Calendar.current.component(.day, from: day))")
                            .font(.caption.bold())
                    }
                    .frame(width: 36)
                    .padding(.vertical, 4)
                    .background(isToday ? Color.orange.opacity(0.1) : .clear)
                    .cornerRadius(6)
                }
            }
            .foregroundColor(.secondary)
            
            // Habit rows
            ForEach(habits) { habit in
                HStack(spacing: 0) {
                    Text(habit.name)
                        .font(.subheadline)
                        .lineLimit(1)
                        .frame(width: 120, alignment: .leading)
                    
                    ForEach(0..<7, id: \.self) { i in
                        let day = weekDays[i]
                        let isScheduled = isHabitScheduledForDay(habit, day: day)
                        let isCompleted = isHabitCompletedForDay(habit, day: day)
                        let isPast = day < Calendar.current.startOfDay(for: Date())
                        let isToday = Calendar.current.isDateInToday(day)
                        
                        Button(action: {
                            onToggle(habit)
                        }) {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(
                                    isCompleted ? Color.orange :
                                    !isScheduled ? Color.clear :
                                    (isPast || isToday) ? Color.gray.opacity(0.1) : Color.gray.opacity(0.05)
                                )
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
                        .frame(width: 36)
                        .disabled(!isScheduled)
                    }
                }
                .padding(.vertical, 8)
            }
        }
    }
}

// MARK: - Steps List

struct StepsListView: View {
    let steps: [Step]
    let weekDays: [Date]
    let onToggle: (Step) -> Void
    
    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                ForEach(steps) { step in
                    StepRowView(step: step, weekDays: weekDays, onToggle: { onToggle(step) })
                }
            }
        }
        .frame(maxHeight: 400)
    }
}

struct StepRowView: View {
    let step: Step
    let weekDays: [Date]
    let onToggle: () -> Void
    @State private var isHovering = false
    
    private var dateLabel: String {
        guard let stepDate = step.date else { return "" }
        
        let today = Calendar.current.startOfDay(for: Date())
        let stepDay = Calendar.current.startOfDay(for: stepDate)
        
        if Calendar.current.isDateInToday(stepDate) {
            return "Today"
        } else if Calendar.current.isDateInYesterday(stepDate) {
            return "Yesterday"
        } else if Calendar.current.isDateInTomorrow(stepDate) {
            return "Tomorrow"
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEEE"
            formatter.locale = Locale(identifier: "cs_CZ")
            return formatter.string(from: stepDate)
        }
    }
    
    private var timeLabel: String {
        let minutes = step.estimatedTime ?? 30
        return "\(minutes) min"
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Circle()
                    .stroke(step.completed ? Color.green : Color.orange, lineWidth: 2)
                    .frame(width: 24, height: 24)
                    .overlay(
                        step.completed ?
                        Circle()
                            .fill(Color.green)
                            .frame(width: 24, height: 24)
                            .overlay(
                                Image(systemName: "checkmark")
                                    .font(.caption.bold())
                                    .foregroundColor(.white)
                            )
                        : nil
                    )
            }
            .buttonStyle(.plain)
            
            Text(step.title)
                .font(.subheadline)
                .foregroundColor(step.completed ? .secondary : Color.orange)
                .strikethrough(step.completed)
                .lineLimit(2)
            
            Spacer()
            
            Text(dateLabel)
                .font(.caption)
                .foregroundColor(.orange)
            
            Text(timeLabel)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.1 : 0.03), radius: isHovering ? 6 : 3, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
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

