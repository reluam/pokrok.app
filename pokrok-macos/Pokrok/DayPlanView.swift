import SwiftUI

struct DayPlanView: View {
    let goals: [Goal]
    let habits: [Habit]
    
    @State private var selectedDate = Date()
    @State private var plannedTasks: [PlannedTask] = []
    
    private var todayHabits: [Habit] {
        habits.filter { $0.frequency == .daily }
    }
    
    var body: some View {
        HStack(spacing: 0) {
            // Left panel - Calendar & Date picker
            VStack(spacing: 20) {
                // Date picker
                DatePicker("", selection: $selectedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .padding()
                
                Divider()
                
                // Quick stats for selected day
                VStack(alignment: .leading, spacing: 12) {
                    Text("Přehled dne")
                        .font(.headline)
                    
                    HStack {
                        Label("\(plannedTasks.count)", systemImage: "list.bullet")
                        Spacer()
                        Text("Úkolů")
                            .foregroundColor(.secondary)
                    }
                    .font(.subheadline)
                    
                    HStack {
                        Label("\(todayHabits.count)", systemImage: "repeat.circle")
                        Spacer()
                        Text("Návyků")
                            .foregroundColor(.secondary)
                    }
                    .font(.subheadline)
                }
                .padding()
                
                Spacer()
            }
            .frame(width: 300)
            .background(Color.white)
            
            Divider()
            
            // Main content - Day plan
            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(selectedDate.formatted(date: .complete, time: .omitted))
                            .font(.title2.bold())
                        Text(isToday ? "Dnes" : relativeDateString)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    HStack(spacing: 8) {
                        Button(action: { moveDay(-1) }) {
                            Image(systemName: "chevron.left")
                        }
                        .buttonStyle(.bordered)
                        
                        Button("Dnes") {
                            selectedDate = Date()
                        }
                        .buttonStyle(.bordered)
                        
                        Button(action: { moveDay(1) }) {
                            Image(systemName: "chevron.right")
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding(24)
                
                Divider()
                
                // Timeline
                ScrollView {
                    VStack(spacing: 0) {
                        // Morning section
                        TimeSection(title: "Ráno", icon: "sunrise.fill", color: .orange) {
                            ForEach(todayHabits.prefix(2)) { habit in
                                TimelineHabitItem(habit: habit)
                            }
                        }
                        
                        // Afternoon section
                        TimeSection(title: "Odpoledne", icon: "sun.max.fill", color: .yellow) {
                            ForEach(goals.filter { $0.status == .active }.prefix(2)) { goal in
                                TimelineGoalItem(goal: goal)
                            }
                        }
                        
                        // Evening section
                        TimeSection(title: "Večer", icon: "sunset.fill", color: .purple) {
                            ForEach(todayHabits.suffix(1)) { habit in
                                TimelineHabitItem(habit: habit)
                            }
                        }
                    }
                    .padding(24)
                }
            }
        }
    }
    
    private var isToday: Bool {
        Calendar.current.isDateInToday(selectedDate)
    }
    
    private var relativeDateString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: selectedDate, relativeTo: Date())
    }
    
    private func moveDay(_ days: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) {
            selectedDate = newDate
        }
    }
}

struct PlannedTask: Identifiable {
    let id = UUID()
    var title: String
    var time: Date
    var duration: Int // minutes
    var type: TaskType
    var isCompleted: Bool
    
    enum TaskType {
        case habit, goal, custom
    }
}

struct TimeSection<Content: View>: View {
    let title: String
    let icon: String
    let color: Color
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.headline)
            }
            .padding(.bottom, 4)
            
            content()
        }
        .padding(.bottom, 24)
    }
}

struct TimelineHabitItem: View {
    let habit: Habit
    @State private var isCompleted = false
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Time indicator
            VStack {
                Circle()
                    .fill(isCompleted ? Color.green : Color.orange)
                    .frame(width: 12, height: 12)
                
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 2, height: 40)
            }
            
            // Content
            HStack(spacing: 12) {
                Button(action: {
                    withAnimation { isCompleted.toggle() }
                }) {
                    Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundColor(isCompleted ? .green : .gray)
                }
                .buttonStyle(.plain)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.name)
                        .font(.subheadline.bold())
                        .strikethrough(isCompleted)
                    
                    HStack(spacing: 8) {
                        Label("\(habit.streak) dní", systemImage: "flame.fill")
                            .font(.caption)
                            .foregroundColor(.orange)
                        
                        Text(habit.category)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(isHovering ? 0.1 : 0.05), radius: isHovering ? 6 : 3, x: 0, y: 2)
            )
        }
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}

struct TimelineGoalItem: View {
    let goal: Goal
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Time indicator
            VStack {
                Circle()
                    .fill(priorityColor)
                    .frame(width: 12, height: 12)
                
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 2, height: 40)
            }
            
            // Content
            HStack(spacing: 12) {
                Image(systemName: "target")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(goal.title)
                        .font(.subheadline.bold())
                    
                    HStack(spacing: 8) {
                        Text(goal.category)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if let deadline = goal.deadline {
                            Label(deadline.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }
                
                Spacer()
                
                Text(goal.priority.rawValue.capitalized)
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(priorityColor.opacity(0.1))
                    .foregroundColor(priorityColor)
                    .cornerRadius(4)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(isHovering ? 0.1 : 0.05), radius: isHovering ? 6 : 3, x: 0, y: 2)
            )
        }
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

#Preview {
    DayPlanView(goals: MainAppView.demoGoals, habits: MainAppView.demoHabits)
}

