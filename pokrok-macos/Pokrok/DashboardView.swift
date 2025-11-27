import SwiftUI

struct DashboardView: View {
    @Binding var goals: [Goal]
    @Binding var habits: [Habit]
    
    private var activeGoals: [Goal] {
        goals.filter { $0.status == .active }
    }
    
    private var todayHabits: [Habit] {
        habits.filter { $0.frequency == .daily }
    }
    
    private var completedHabitsToday: Int {
        // In real implementation, check actual completions
        todayHabits.filter { habit in
            if let lastCompleted = habit.lastCompleted {
                return Calendar.current.isDateInToday(lastCompleted)
            }
            return false
        }.count
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Dobrý den! 👋")
                            .font(.largeTitle.bold())
                        Text(Date().formatted(date: .complete, time: .omitted))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    // Quick stats
                    HStack(spacing: 20) {
                        StatBadge(
                            title: "Streak",
                            value: "\(habits.map { $0.streak }.max() ?? 0)",
                            icon: "flame.fill",
                            color: .orange
                        )
                        StatBadge(
                            title: "Cíle",
                            value: "\(activeGoals.count)",
                            icon: "target",
                            color: .blue
                        )
                        StatBadge(
                            title: "Návyky",
                            value: "\(completedHabitsToday)/\(todayHabits.count)",
                            icon: "checkmark.circle.fill",
                            color: .green
                        )
                    }
                }
                .padding(.bottom, 8)
                
                // Today's Focus
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader(title: "Dnešní focus", icon: "star.fill")
                    
                    if todayHabits.isEmpty {
                        EmptyStateCard(
                            title: "Žádné denní návyky",
                            subtitle: "Přidejte návyky pro sledování",
                            icon: "plus.circle"
                        )
                    } else {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 12) {
                            ForEach(todayHabits.prefix(4)) { habit in
                                HabitCard(habit: habit)
                            }
                        }
                    }
                }
                
                // Active Goals
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader(title: "Aktivní cíle", icon: "target")
                    
                    if activeGoals.isEmpty {
                        EmptyStateCard(
                            title: "Žádné aktivní cíle",
                            subtitle: "Vytvořte svůj první cíl",
                            icon: "plus.circle"
                        )
                    } else {
                        ForEach(activeGoals.prefix(3)) { goal in
                            GoalCard(goal: goal)
                        }
                    }
                }
                
                // Progress Overview
                VStack(alignment: .leading, spacing: 16) {
                    SectionHeader(title: "Přehled pokroku", icon: "chart.line.uptrend.xyaxis")
                    
                    HStack(spacing: 16) {
                        ProgressCard(
                            title: "Týdenní aktivita",
                            progress: 0.65,
                            subtitle: "5 z 7 dní aktivních",
                            color: .orange
                        )
                        
                        ProgressCard(
                            title: "Splnění návyků",
                            progress: Double(completedHabitsToday) / max(Double(todayHabits.count), 1),
                            subtitle: "\(completedHabitsToday) z \(todayHabits.count) dnes",
                            color: .green
                        )
                    }
                }
            }
            .padding(24)
        }
    }
}

// MARK: - Components

struct SectionHeader: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.orange)
            Text(title)
                .font(.title2.bold())
        }
    }
}

struct StatBadge: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(value)
                    .font(.headline.bold())
            }
            .foregroundColor(color)
            
            Text(title)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct HabitCard: View {
    let habit: Habit
    @State private var isCompleted = false
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: {
                withAnimation(.spring(response: 0.3)) {
                    isCompleted.toggle()
                }
            }) {
                ZStack {
                    Circle()
                        .stroke(isCompleted ? Color.green : Color.gray.opacity(0.3), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    if isCompleted {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 24, height: 24)
                        
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(habit.name)
                    .font(.subheadline.bold())
                    .strikethrough(isCompleted)
                    .foregroundColor(isCompleted ? .secondary : .primary)
                
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.caption2)
                        .foregroundColor(.orange)
                    Text("\(habit.streak) dní")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            difficultyBadge
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.1 : 0.05), radius: isHovering ? 8 : 4, x: 0, y: 2)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
    
    private var difficultyBadge: some View {
        Text(habit.difficulty.rawValue.capitalized)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(difficultyColor.opacity(0.1))
            .foregroundColor(difficultyColor)
            .cornerRadius(4)
    }
    
    private var difficultyColor: Color {
        switch habit.difficulty {
        case .easy: return .green
        case .medium: return .orange
        case .hard: return .red
        }
    }
}

struct GoalCard: View {
    let goal: Goal
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Priority indicator
            Circle()
                .fill(priorityColor)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(goal.title)
                    .font(.headline)
                
                if let description = goal.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            // Category badge
            Text(goal.category)
                .font(.caption)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Color.blue.opacity(0.1))
                .foregroundColor(.blue)
                .cornerRadius(6)
            
            // Deadline if exists
            if let deadline = goal.deadline {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Termín")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(deadline.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(isHovering ? 0.1 : 0.05), radius: isHovering ? 8 : 4, x: 0, y: 2)
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
    
    private var priorityColor: Color {
        switch goal.priority {
        case .high: return .red
        case .medium: return .orange
        case .low: return .green
        }
    }
}

struct ProgressCard: View {
    let title: String
    let progress: Double
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.1))
                        .frame(height: 8)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * progress, height: 8)
                }
            }
            .frame(height: 8)
            
            HStack {
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("\(Int(progress * 100))%")
                    .font(.caption.bold())
                    .foregroundColor(color)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
        )
    }
}

struct EmptyStateCard: View {
    let title: String
    let subtitle: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(.gray.opacity(0.5))
            
            Text(title)
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(subtitle)
                .font(.subheadline)
                .foregroundColor(.secondary.opacity(0.8))
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [8]))
                .foregroundColor(.gray.opacity(0.3))
        )
    }
}

#Preview {
    DashboardView(
        goals: .constant(MainAppView.demoGoals),
        habits: .constant(MainAppView.demoHabits)
    )
}

