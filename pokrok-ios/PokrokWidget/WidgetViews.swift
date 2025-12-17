import SwiftUI
import WidgetKit

struct TodayStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: family == .systemMedium ? WidgetDesignSystem.Spacing.md : WidgetDesignSystem.Spacing.sm) {
            // Header
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(WidgetDesignSystem.primaryColor)
                    .font(WidgetDesignSystem.Typography.headline(size: family == .systemMedium ? 18 : 16))
                
                Text("Kroky")
                    .font(WidgetDesignSystem.Typography.headline(size: family == .systemMedium ? 16 : 14))
                    .foregroundColor(WidgetDesignSystem.textPrimary)
                
                Spacer()
                
                if !entry.todaySteps.isEmpty {
                    Text("\(entry.stepStats.completed)/\(entry.stepStats.total)")
                        .font(WidgetDesignSystem.Typography.caption(size: family == .systemMedium ? 14 : 12))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                }
            }
            
            if entry.todaySteps.isEmpty {
                VStack(spacing: WidgetDesignSystem.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: family == .systemMedium ? 32 : 24))
                        .foregroundColor(WidgetDesignSystem.yellowGreen)
                    
                    Text("Žádné kroky na dnes")
                        .font(WidgetDesignSystem.Typography.body(size: family == .systemMedium ? 14 : 12))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: family == .systemMedium ? WidgetDesignSystem.Spacing.sm : 6) {
                    ForEach(entry.todaySteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: family == .systemMedium ? 10 : 6) {
                            Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: family == .systemMedium ? 16 : 12))
                                .foregroundColor(step.completed ? WidgetDesignSystem.primaryColor : Color.gray)
                            
                            Text(step.title)
                                .font(WidgetDesignSystem.Typography.body(size: family == .systemMedium ? 13 : 11))
                                .foregroundColor(step.completed ? WidgetDesignSystem.textSecondary : WidgetDesignSystem.textPrimary)
                                .strikethrough(step.completed)
                                .lineLimit(family == .systemMedium ? 2 : 1)
                            
                            Spacer()
                        }
                    }
                    
                    if entry.todaySteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.todaySteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(WidgetDesignSystem.Typography.caption(size: family == .systemMedium ? 11 : 10))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                            .padding(.top, 2)
                    }
                }
            }
            
            Spacer()
        }
        .padding(family == .systemMedium ? WidgetDesignSystem.Spacing.md : WidgetDesignSystem.Spacing.sm)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct FutureStepsWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(alignment: .leading, spacing: WidgetDesignSystem.Spacing.sm) {
            // Header
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(WidgetDesignSystem.primaryColor)
                    .font(WidgetDesignSystem.Typography.headline(size: 16))
                
                Text("Budoucí kroky")
                    .font(WidgetDesignSystem.Typography.headline(size: 14))
                    .foregroundColor(WidgetDesignSystem.textPrimary)
                
                Spacer()
                
                Text("\(entry.futureSteps.count)")
                    .font(WidgetDesignSystem.Typography.caption(size: 12))
                    .foregroundColor(WidgetDesignSystem.textSecondary)
            }
            
            if entry.futureSteps.isEmpty {
                VStack(spacing: WidgetDesignSystem.Spacing.xs) {
                    Image(systemName: "calendar.badge.checkmark")
                        .font(.system(size: 24))
                        .foregroundColor(WidgetDesignSystem.primaryColor)
                    
                    Text("Žádné budoucí kroky")
                        .font(WidgetDesignSystem.Typography.body(size: 12))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.futureSteps.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { step in
                        HStack(spacing: 6) {
                            Image(systemName: "circle")
                                .font(.system(size: 12))
                                .foregroundColor(WidgetDesignSystem.primaryColor)
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text(step.title)
                                    .font(WidgetDesignSystem.Typography.body(size: 11))
                                    .foregroundColor(WidgetDesignSystem.textPrimary)
                                    .lineLimit(1)
                                
                                Text(step.date, style: .date)
                                    .font(WidgetDesignSystem.Typography.caption(size: 9))
                                    .foregroundColor(WidgetDesignSystem.textSecondary)
                            }
                            
                            Spacer()
                        }
                    }
                    
                    if entry.futureSteps.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.futureSteps.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(WidgetDesignSystem.Typography.caption(size: 10))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                    }
                }
            }
            
            Spacer()
        }
        .padding(WidgetDesignSystem.Spacing.sm)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
        VStack(alignment: .leading, spacing: family == .systemMedium ? WidgetDesignSystem.Spacing.md : WidgetDesignSystem.Spacing.sm) {
            // Header
            HStack {
                Image(systemName: "repeat.circle.fill")
                    .foregroundColor(WidgetDesignSystem.primaryColor)
                    .font(WidgetDesignSystem.Typography.headline(size: family == .systemMedium ? 18 : 16))
                
                Text("Návyky")
                    .font(WidgetDesignSystem.Typography.headline(size: family == .systemMedium ? 16 : 14))
                    .foregroundColor(WidgetDesignSystem.textPrimary)
                
                Spacer()
                
                if entry.habitStats.total > 0 {
                    Text("\(entry.habitStats.completed)/\(entry.habitStats.total)")
                        .font(WidgetDesignSystem.Typography.caption(size: family == .systemMedium ? 14 : 12))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                }
            }
            
            if entry.todayHabits.isEmpty {
                VStack(spacing: WidgetDesignSystem.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: family == .systemMedium ? 32 : 24))
                        .foregroundColor(WidgetDesignSystem.yellowGreen)
                    
                    Text("Žádné návyky na dnes")
                        .font(WidgetDesignSystem.Typography.body(size: family == .systemMedium ? 14 : 12))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(alignment: .leading, spacing: family == .systemMedium ? WidgetDesignSystem.Spacing.sm : 6) {
                    ForEach(entry.todayHabits.prefix(PokrokWidgetConfiguration.shared.getMaxItems(for: family)), id: \.id) { habit in
                        HStack(spacing: family == .systemMedium ? 10 : 6) {
                            let completed = isHabitCompleted(habit)
                            Image(systemName: completed ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: family == .systemMedium ? 16 : 12))
                                .foregroundColor(completed ? WidgetDesignSystem.primaryColor : Color.gray)
                            
                            Text(habit.name)
                                .font(WidgetDesignSystem.Typography.body(size: family == .systemMedium ? 13 : 11))
                                .foregroundColor(completed ? WidgetDesignSystem.textSecondary : WidgetDesignSystem.textPrimary)
                                .strikethrough(completed)
                                .lineLimit(family == .systemMedium ? 2 : 1)
                            
                            Spacer()
                        }
                    }
                    
                    if entry.todayHabits.count > PokrokWidgetConfiguration.shared.getMaxItems(for: family) {
                        Text("+ \(entry.todayHabits.count - PokrokWidgetConfiguration.shared.getMaxItems(for: family)) dalších")
                            .font(WidgetDesignSystem.Typography.caption(size: family == .systemMedium ? 11 : 10))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                            .padding(.top, 2)
                    }
                }
            }
            
            Spacer()
        }
        .padding(family == .systemMedium ? WidgetDesignSystem.Spacing.md : WidgetDesignSystem.Spacing.sm)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct InspirationWidgetView: View {
    let entry: SimpleEntry
    let family: WidgetFamily
    
    var body: some View {
        VStack(spacing: WidgetDesignSystem.Spacing.sm) {
            // Header
            HStack {
                Image(systemName: "lightbulb.fill")
                    .foregroundColor(WidgetDesignSystem.primaryColor)
                    .font(WidgetDesignSystem.Typography.headline(size: 16))
                
                Text("Inspirace")
                    .font(WidgetDesignSystem.Typography.headline(size: 14))
                    .foregroundColor(WidgetDesignSystem.textPrimary)
                
                Spacer()
            }
            
            // Inspiration content
            VStack(spacing: 6) {
                Text(entry.inspiration.0)
                    .font(.system(size: family == .systemSmall ? 32 : 40))
                
                Text(entry.inspiration.1)
                    .font(WidgetDesignSystem.Typography.body(size: family == .systemSmall ? 11 : 13))
                    .foregroundColor(WidgetDesignSystem.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(family == .systemSmall ? 2 : 3)
                
                Text(entry.inspiration.2)
                    .font(WidgetDesignSystem.Typography.caption(size: 9))
                    .foregroundColor(WidgetDesignSystem.primaryColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(
                        Capsule()
                            .fill(WidgetDesignSystem.primaryColor.opacity(0.15))
                    )
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            
            Spacer()
        }
        .padding(WidgetDesignSystem.Spacing.sm)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
        VStack(alignment: .leading, spacing: WidgetDesignSystem.Spacing.md) {
            // Header with date and progress
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(dayName)
                            .font(WidgetDesignSystem.Typography.body(size: 13))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                        
                        HStack(alignment: .bottom, spacing: 4) {
                            Text("\(dayNumber)")
                                .font(WidgetDesignSystem.Typography.title(size: 28))
                                .foregroundColor(WidgetDesignSystem.textPrimary)
                        }
                    }
                    
                    Spacer()
                    
                    // Progress bar and percentage
                    VStack(alignment: .trailing, spacing: 4) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(Color.secondary.opacity(0.2))
                                    .frame(height: 6)
                                
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(WidgetDesignSystem.primaryColor)
                                    .frame(width: geometry.size.width * progressPercentageValue, height: 6)
                                
                                RoundedRectangle(cornerRadius: 3)
                                    .stroke(WidgetDesignSystem.primaryColor, lineWidth: 2)
                                    .frame(height: 6)
                            }
                        }
                        .frame(height: 6)
                        
                        Text("\(completionPercentage)% (\(completedTasks)/\(totalTasks))")
                            .font(WidgetDesignSystem.Typography.caption(size: 11))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                    }
                    .frame(width: 100)
                }
            }
            .padding(.bottom, 4)
            
            Divider()
                .padding(.vertical, 4)
            
            // Steps Section
            VStack(alignment: .leading, spacing: WidgetDesignSystem.Spacing.sm) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(WidgetDesignSystem.primaryColor)
                        .font(WidgetDesignSystem.Typography.headline(size: 14))
                    
                    Text("Kroky")
                        .font(WidgetDesignSystem.Typography.headline(size: 14))
                        .foregroundColor(WidgetDesignSystem.textPrimary)
                    
                    Spacer()
                }
                
                if entry.todaySteps.isEmpty {
                    Text("Žádné kroky na dnes")
                        .font(WidgetDesignSystem.Typography.body(size: 11))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                        .padding(.leading, 20)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(entry.todaySteps.prefix(4), id: \.id) { step in
                            HStack(spacing: 6) {
                                Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 12))
                                    .foregroundColor(step.completed ? WidgetDesignSystem.primaryColor : Color.gray)
                                
                                Text(step.title)
                                    .font(WidgetDesignSystem.Typography.body(size: 11))
                                    .foregroundColor(step.completed ? WidgetDesignSystem.textSecondary : WidgetDesignSystem.textPrimary)
                                    .strikethrough(step.completed)
                                    .lineLimit(1)
                                
                                Spacer()
                            }
                        }
                        
                        if entry.todaySteps.count > 4 {
                            Text("+ \(entry.todaySteps.count - 4) dalších")
                                .font(WidgetDesignSystem.Typography.caption(size: 10))
                                .foregroundColor(WidgetDesignSystem.textSecondary)
                                .padding(.leading, 20)
                        }
                    }
                }
            }
            
            Divider()
                .padding(.vertical, 4)
            
            // Habits Section
            VStack(alignment: .leading, spacing: WidgetDesignSystem.Spacing.sm) {
                HStack {
                    Image(systemName: "repeat.circle.fill")
                        .foregroundColor(WidgetDesignSystem.primaryColor)
                        .font(WidgetDesignSystem.Typography.headline(size: 14))
                    
                    Text("Návyky")
                        .font(WidgetDesignSystem.Typography.headline(size: 14))
                        .foregroundColor(WidgetDesignSystem.textPrimary)
                    
                    Spacer()
                    
                    if entry.habitStats.total > 0 {
                        Text("\(entry.habitStats.completed)/\(entry.habitStats.total)")
                            .font(WidgetDesignSystem.Typography.caption(size: 11))
                            .foregroundColor(WidgetDesignSystem.textSecondary)
                    }
                }
                
                if entry.todayHabits.isEmpty {
                    Text("Žádné návyky na dnes")
                        .font(WidgetDesignSystem.Typography.body(size: 11))
                        .foregroundColor(WidgetDesignSystem.textSecondary)
                        .padding(.leading, 20)
                } else {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(entry.todayHabits.prefix(3), id: \.id) { habit in
                            HStack(spacing: 6) {
                                let isCompleted = isHabitCompleted(habit)
                                Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 12))
                                    .foregroundColor(isCompleted ? WidgetDesignSystem.primaryColor : Color.gray)
                                
                                Text(habit.name)
                                    .font(WidgetDesignSystem.Typography.body(size: 11))
                                    .foregroundColor(isCompleted ? WidgetDesignSystem.textSecondary : WidgetDesignSystem.textPrimary)
                                    .strikethrough(isCompleted)
                                    .lineLimit(1)
                                
                                Spacer()
                            }
                        }
                        
                        if entry.todayHabits.count > 3 {
                            Text("+ \(entry.todayHabits.count - 3) dalších")
                                .font(WidgetDesignSystem.Typography.caption(size: 10))
                                .foregroundColor(WidgetDesignSystem.textSecondary)
                                .padding(.leading, 20)
                        }
                    }
                }
            }
            
            Spacer()
        }
        .padding(WidgetDesignSystem.Spacing.md)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
    
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())
        return habit.habitCompletions?[todayStr] == true
    }
}
