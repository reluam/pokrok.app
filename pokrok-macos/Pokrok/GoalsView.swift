import SwiftUI

struct GoalsView: View {
    @Binding var goals: [Goal]
    @EnvironmentObject var apiManager: APIManager
    
    @State private var showingAddGoal = false
    @State private var selectedGoal: Goal?
    @State private var filterStatus: String? = "active"
    
    private var filteredGoals: [Goal] {
        if let status = filterStatus {
            return goals.filter { $0.status == status }
        }
        return goals
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Cíle")
                        .font(.largeTitle.bold())
                    Text("\(goals.count) celkem • \(goals.filter { $0.status == "active" }.count) aktivních")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Filter
                Picker("Stav", selection: $filterStatus) {
                    Text("Všechny").tag(nil as String?)
                    Text("Aktivní").tag("active" as String?)
                    Text("Dokončené").tag("completed" as String?)
                    Text("Pozastavené").tag("paused" as String?)
                }
                .pickerStyle(.segmented)
                .frame(width: 300)
                
                Button(action: { showingAddGoal = true }) {
                    Label("Přidat cíl", systemImage: "plus")
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
            }
            .padding(24)
            
            Divider()
            
            // Goals list
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(filteredGoals) { goal in
                        GoalRowView(goal: goal, onSelect: {
                            selectedGoal = goal
                        }, onStatusChange: { newStatus in
                            updateGoalStatus(goal, to: newStatus)
                        })
                    }
                }
                .padding(24)
            }
        }
        .sheet(isPresented: $showingAddGoal) {
            AddGoalSheet(goals: $goals)
        }
        .sheet(item: $selectedGoal) { goal in
            GoalDetailSheet(goal: goal, goals: $goals)
        }
    }
    
    private func updateGoalStatus(_ goal: Goal, to status: String) {
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            var updatedGoal = goal
            updatedGoal.status = status
            goals[index] = updatedGoal
            
            // Sync with API
            Task {
                try? await apiManager.updateGoal(updatedGoal)
            }
        }
    }
}

struct GoalRowView: View {
    let goal: Goal
    let onSelect: () -> Void
    let onStatusChange: (String) -> Void
    
    @State private var isHovering = false
    
    var body: some View {
        HStack(spacing: 16) {
            // Status indicator
            Button(action: {
                if goal.status == "active" {
                    onStatusChange("completed")
                } else if goal.status == "completed" {
                    onStatusChange("active")
                }
            }) {
                ZStack {
                    Circle()
                        .stroke(statusColor, lineWidth: 2)
                        .frame(width: 28, height: 28)
                    
                    if goal.status == "completed" {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 28, height: 28)
                        
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            
            // Priority indicator
            Rectangle()
                .fill(priorityColor)
                .frame(width: 4)
                .cornerRadius(2)
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(goal.title)
                    .font(.headline)
                    .strikethrough(goal.status == "completed")
                    .foregroundColor(goal.status == "completed" ? .secondary : .primary)
                
                if let description = goal.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                HStack(spacing: 12) {
                    Label(goal.category ?? "", systemImage: "folder")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if let deadline = goal.targetDate {
                        Label(deadline.formatted(date: .abbreviated, time: .omitted), systemImage: "calendar")
                            .font(.caption)
                            .foregroundColor(isOverdue(deadline) ? .red : .secondary)
                    }
                }
            }
            
            Spacer()
            
            // Priority badge
            Text((goal.priority ?? "medium").capitalized)
                .font(.caption)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(priorityColor.opacity(0.1))
                .foregroundColor(priorityColor)
                .cornerRadius(6)
            
            // Actions
            Button(action: onSelect) {
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
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
        .onTapGesture {
            onSelect()
        }
    }
    
    private var statusColor: Color {
        switch goal.status {
        case "active": return .blue
        case "completed": return .green
        case "paused": return .gray
        default: return .blue
        }
    }
    
    private var priorityColor: Color {
        switch goal.priority {
        case "high", "critical": return .red
        case "medium", "meaningful": return .orange
        case "low", "nice_to_have": return .green
        default: return .orange
        }
    }
    
    private func isOverdue(_ date: Date) -> Bool {
        date < Date() && goal.status != "completed"
    }
}

struct AddGoalSheet: View {
    @Binding var goals: [Goal]
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var apiManager: APIManager
    @EnvironmentObject var authManager: AuthManager
    
    @State private var title = ""
    @State private var description = ""
    @State private var category = "Osobní"
    @State private var priority: Priority = .medium
    @State private var hasDeadline = false
    @State private var deadline = Date().addingTimeInterval(86400 * 7)
    
    let categories = ["Osobní", "Práce", "Zdraví", "Vzdělání", "Finance", "Vztahy"]
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Nový cíl")
                    .font(.title2.bold())
                Spacer()
                Button("Zrušit") { dismiss() }
                    .buttonStyle(.plain)
            }
            .padding()
            
            Divider()
            
            Form {
                Section {
                    TextField("Název cíle", text: $title)
                        .textFieldStyle(.roundedBorder)
                    
                    TextField("Popis (volitelný)", text: $description, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...5)
                }
                
                Section {
                    Picker("Kategorie", selection: $category) {
                        ForEach(categories, id: \.self) { cat in
                            Text(cat).tag(cat)
                        }
                    }
                    
                    Picker("Priorita", selection: $priority) {
                        Text("Nízká").tag(Priority.low)
                        Text("Střední").tag(Priority.medium)
                        Text("Vysoká").tag(Priority.high)
                    }
                    .pickerStyle(.segmented)
                }
                
                Section {
                    Toggle("Nastavit termín", isOn: $hasDeadline)
                    
                    if hasDeadline {
                        DatePicker("Termín", selection: $deadline, displayedComponents: .date)
                    }
                }
            }
            .formStyle(.grouped)
            .padding()
            
            Divider()
            
            // Footer
            HStack {
                Spacer()
                Button("Vytvořit cíl") {
                    createGoal()
                }
                .buttonStyle(.borderedProminent)
                .tint(.orange)
                .disabled(title.isEmpty)
            }
            .padding()
        }
        .frame(width: 500, height: 450)
    }
    
    private func createGoal() {
        let newGoal = Goal(
            id: UUID().uuidString,
            userId: authManager.userId,
            title: title,
            description: description.isEmpty ? nil : description,
            targetDate: hasDeadline ? deadline : nil,
            status: "active",
            priority: priority.rawValue,
            category: category,
            color: nil,
            icon: nil,
            createdAt: Date(),
            updatedAt: nil
        )
        
        goals.append(newGoal)
        
        // Sync with API
        if let userId = authManager.userId {
            Task {
                try? await apiManager.createGoal(newGoal, userId: userId)
            }
        }
        
        dismiss()
    }
}

struct GoalDetailSheet: View {
    let goal: Goal
    @Binding var goals: [Goal]
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(goal.title)
                        .font(.title2.bold())
                    Text(goal.category ?? "")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button("Zavřít") { dismiss() }
                    .buttonStyle(.plain)
            }
            .padding()
            
            Divider()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let description = goal.description {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Popis")
                                .font(.headline)
                            Text(description)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    HStack(spacing: 20) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Priorita")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text((goal.priority ?? "medium").capitalized)
                                .font(.headline)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Stav")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text(goal.status.capitalized)
                                .font(.headline)
                        }
                        
                        if let deadline = goal.targetDate {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Termín")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(deadline.formatted(date: .abbreviated, time: .omitted))
                                    .font(.headline)
                            }
                        }
                    }
                    
                    Divider()
                    
                    Text("Kroky")
                        .font(.headline)
                    
                    Text("Zde budou kroky k dosažení cíle...")
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
        .frame(width: 500, height: 400)
    }
}

#Preview {
    GoalsView(goals: .constant(MainAppView.demoGoals))
        .environmentObject(APIManager())
        .environmentObject(AuthManager())
}

