import SwiftUI
import WidgetKit

// Widget-specific colors matching the app's primary color
extension Color {
    static let widgetPrimary = Color(red: 232/255, green: 135/255, blue: 30/255)
    static let widgetPrimaryLight = Color(red: 249/255, green: 168/255, blue: 85/255)
    static let widgetSuccess = Color(red: 34/255, green: 197/255, blue: 94/255)
}

struct TodayStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: family == .systemMedium ? 12 : 8) {
            // Header
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.widgetPrimary)
                    .font(.system(size: family == .systemMedium ? 18 : 16, weight: .semibold))
                
                Text("Kroky")
                    .font(.system(size: family == .systemMedium ? 16 : 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                if !entry.todaySteps.isEmpty {
                    Text("\(entry.stepStats.completed)/\(entry.stepStats.total)")
                        .font(.system(size: family == .systemMedium ? 14 : 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            
            if entry.todaySteps.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: family == .systemMedium ? 32 : 24))
                        .foregroundColor(.widgetSuccess)
                    
                    Text("Všechny úkoly hotové!")
                        .font(.system(size: family == .systemMedium ? 14 : 12, weight: .medium))
                        .foregroundColor(.widgetSuccess)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: family == .systemMedium ? 8 : 6) {
                    ForEach(entry.todaySteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: family == .systemMedium ? 10 : 6) {
                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: family == .systemMedium ? 16 : 12))
                                .foregroundColor(step.completed ? .widgetSuccess : .gray)
                            
                            Text(step.title)
                                .font(.system(size: family == .systemMedium ? 13 : 11))
                                .foregroundColor(step.completed ? .secondary : .primary)
                                .strikethrough(step.completed)
                                .lineLimit(family == .systemMedium ? 2 : 1)
                            
                            Spacer()
                        }
                    }
                    
                    if entry.todaySteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.todaySteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(.system(size: family == .systemMedium ? 11 : 10))
                            .foregroundColor(.secondary)
                            .padding(.top, 2)
                    }
                }
            }
            
            Spacer()
        }
        .padding(family == .systemMedium ? 16 : 12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct FutureStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(.widgetPrimary)
                    .font(.system(size: 16, weight: .semibold))
                
                Text("Budoucí kroky")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("\(entry.futureSteps.count)")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
            }
            
            if entry.futureSteps.isEmpty {
                VStack(spacing: 4) {
                    Image(systemName: "calendar.badge.checkmark")
                        .font(.system(size: 24))
                        .foregroundColor(.widgetPrimary)
                    
                    Text("Žádné budoucí kroky")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.futureSteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: 6) {
                            Image(systemName: "circle")
                                .font(.system(size: 12))
                                .foregroundColor(.widgetPrimary)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.title)
                                    .font(.system(size: 11))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Text(step.date, style: .date)
                                    .font(.system(size: 9))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                        }
                    }
                    
                    if entry.futureSteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.futureSteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(.system(size: 10))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct TodayHabitsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        return habit.habitCompletions?[todayStr] == true
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: family == .systemMedium ? 12 : 8) {
            // Header
            HStack {
                Image(systemName: "repeat.circle.fill")
                    .foregroundColor(.widgetPrimary)
                    .font(.system(size: family == .systemMedium ? 18 : 16, weight: .semibold))
                
                Text("Návyky")
                    .font(.system(size: family == .systemMedium ? 16 : 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                if entry.habitStats.total > 0 {
                    Text("\(entry.habitStats.completed)/\(entry.habitStats.total)")
                        .font(.system(size: family == .systemMedium ? 14 : 12, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            
            if entry.todayHabits.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: family == .systemMedium ? 32 : 24))
                        .foregroundColor(.widgetSuccess)
                    
                    Text("Žádné návyky na dnes")
                        .font(.system(size: family == .systemMedium ? 14 : 12, weight: .medium))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: family == .systemMedium ? 8 : 6) {
                    ForEach(entry.todayHabits.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { habit in
                        HStack(spacing: family == .systemMedium ? 10 : 6) {
                            let completed = isHabitCompleted(habit)
                            Image(systemName: completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: family == .systemMedium ? 16 : 12))
                                .foregroundColor(completed ? .widgetPrimary : .gray)
                            
                            Text(habit.name)
                                .font(.system(size: family == .systemMedium ? 13 : 11))
                                .foregroundColor(completed ? .secondary : .primary)
                                .strikethrough(completed)
                                .lineLimit(family == .systemMedium ? 2 : 1)
                            
                            Spacer()
                        }
                    }
                    
                    if entry.todayHabits.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.todayHabits.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(.system(size: family == .systemMedium ? 11 : 10))
                            .foregroundColor(.secondary)
                            .padding(.top, 2)
                    }
                }
            }
            
            Spacer()
        }
        .padding(family == .systemMedium ? 16 : 12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct InspirationWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(spacing: 8) {
            // Header
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(.widgetPrimary)
                    .font(.system(size: 16, weight: .semibold))
                
                Text("Inspirace")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            // Inspiration content
            VStack(spacing: 6) {
                Text(entry.inspiration.0)
                    .font(.system(size: family == .systemSmall ? 32 : 40))
                
                Text(entry.inspiration.1)
                    .font(.system(size: family == .systemSmall ? 11 : 13, weight: .medium))
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(family == .systemSmall ? 2 : 3)
                
                Text(entry.inspiration.2)
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.widgetPrimary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(Color.widgetPrimary.opacity(0.15))
                    )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            Spacer()
        }
        .padding(12)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

struct OverviewWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    private var dayName: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "EEEE"
        return formatter.string(from: Date()).capitalized
    }
    
    private var dayNumber: Int {
        Calendar.current.component(.day, from: Date())
    }
    
    private var totalTasks: Int {
        return entry.stepStats.total + entry.habitStats.total
    }
    
    private var completedTasks: Int {
        return entry.stepStats.completed + entry.habitStats.completed
    }
    
    private var progressPercentageValue: Double {
        guard totalTasks > 0 else { return 0 }
        return min(Double(completedTasks) / Double(totalTasks), 1.0)
    }
    
    private var completionPercentage: Int {
        guard totalTasks > 0 else { return 0 }
        return Int(progressPercentageValue * 100)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header with date and progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(dayName)
                            .font(.system(size: 13, weight: .regular))
                            .foregroundColor(.secondary)
                        
                        HStack(alignment: .bottom, spacing: 4) {
                            Text("\(dayNumber)")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.primary)
                        }
                    }
                    
                    Spacer()
                    
                    // Progress bar and percentage
                    VStack(alignment: .trailing, spacing: 4) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.secondary.opacity(0.2))
                                    .frame(height: 6)
                                
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(Color.widgetPrimary)
                                    .frame(width: geometry.size.width * progressPercentageValue, height: 6)
                            }
                        }
                        .frame(height: 6)
                        
                        Text("\(completionPercentage)% (\(completedTasks)/\(totalTasks))")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    .frame(width: 100)
                }
            }
            .padding(.bottom, 4)
            
            Divider()
                .padding(.vertical, 4)
            
            // Steps Section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.widgetPrimary)
                        .font(.system(size: 14, weight: .semibold))
                    
                    Text("Kroky")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Spacer()
                }
                
                if entry.todaySteps.isEmpty {
                    Text("Žádné kroky na dnes")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .padding(.leading, 20)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(entry.todaySteps.prefix(4), id: \.id) { step in
                            HStack(spacing: 6) {
                                Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 12))
                                    .foregroundColor(step.completed ? .widgetSuccess : .gray)
                                
                                Text(step.title)
                                    .font(.system(size: 11))
                                    .foregroundColor(step.completed ? .secondary : .primary)
                                    .strikethrough(step.completed)
                                    .lineLimit(1)
                                
                                Spacer()
                            }
                        }
                        
                        if entry.todaySteps.count > 4 {
                            Text("+ \(entry.todaySteps.count - 4) dalších")
                                .font(.system(size: 10))
                                .foregroundColor(.secondary)
                                .padding(.leading, 20)
                        }
                    }
                }
            }
            
            Divider()
                .padding(.vertical, 4)
            
            // Habits Section
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "repeat.circle.fill")
                        .foregroundColor(.widgetPrimary)
                        .font(.system(size: 14, weight: .semibold))
                    
                    Text("Návyky")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    if entry.habitStats.total > 0 {
                        Text("\(entry.habitStats.completed)/\(entry.habitStats.total)")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                }
                
                if entry.todayHabits.isEmpty {
                    Text("Žádné návyky na dnes")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .padding(.leading, 20)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(entry.todayHabits.prefix(3), id: \.id) { habit in
                            HStack(spacing: 6) {
                                let isCompleted = isHabitCompleted(habit)
                                Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 12))
                                    .foregroundColor(isCompleted ? .widgetPrimary : .gray)
                                
                                Text(habit.name)
                                    .font(.system(size: 11))
                                    .foregroundColor(isCompleted ? .secondary : .primary)
                                    .strikethrough(isCompleted)
                                    .lineLimit(1)
                                
                                Spacer()
                            }
                        }
                        
                        if entry.todayHabits.count > 3 {
                            Text("+ \(entry.todayHabits.count - 3) dalších")
                                .font(.system(size: 10))
                                .foregroundColor(.secondary)
                                .padding(.leading, 20)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding(16)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        return habit.habitCompletions?[todayStr] == true
    }
}
