import SwiftUI

extension Goal {
    enum Status: String, CaseIterable {
        case active = "active"
        case completed = "completed"
        case paused = "paused"
    }
}

struct GoalsView: View {
    @Binding var goals: [Goal]
    @Binding var steps: [Step]
    @EnvironmentObject var apiManager: APIManager
    
    @State private var showingAddGoal = false
    @State private var selectedGoal: Goal?
    @State private var filterStatus: String? = nil
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047) // #ea580c
    
    private var filteredGoals: [Goal] {
        if let status = filterStatus {
            return goals.filter { $0.status == status }
        }
        return goals
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top header with filter and add button
            HStack {
                Menu {
                    Button("All statuses") { filterStatus = nil }
                    Divider()
                    Button("Active") { filterStatus = "active" }
                    Button("Completed") { filterStatus = "completed" }
                    Button("Paused") { filterStatus = "paused" }
                } label: {
                    HStack(spacing: 6) {
                        Text(filterStatus == nil ? "All statuses" : filterStatus?.capitalized ?? "All statuses")
                            .font(.system(size: 13))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 9))
                    }
                    .foregroundColor(Color(white: 0.3))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(6)
                }
                
                Spacer()
                
                Button(action: { showingAddGoal = true }) {
                    HStack(spacing: 5) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .semibold))
                        Text("Add goal")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(primaryOrange)
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 12)
            
            // Table in white card
            ScrollView {
                VStack(spacing: 0) {
                    // Table header
                    HStack(spacing: 0) {
                        Text("Name")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                        
                        Text("Status")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 120)
                            .padding(.vertical, 8)
                        
                        Text("Date")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 150, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        Text("Steps")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 100, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        Color.clear
                            .frame(width: 40)
                    }
                    .background(
                        LinearGradient(
                            colors: [Color.gray.opacity(0.05), Color.gray.opacity(0.08)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .overlay(
                        Rectangle()
                            .frame(height: 1)
                            .foregroundColor(Color.gray.opacity(0.2))
                        , alignment: .bottom
                    )
                    
                    // Table rows
                    if filteredGoals.isEmpty {
                        VStack(spacing: 8) {
                            Text("Žádné cíle nejsou nastavené")
                                .font(.system(size: 16))
                                .foregroundColor(.gray)
                            Text("Klikněte na tlačítko výše pro přidání nového cíle")
                                .font(.system(size: 13))
                                .foregroundColor(.gray.opacity(0.7))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                    } else {
                        ForEach(filteredGoals) { goal in
                            GoalTableRow(
                                goal: goal,
                                onRowClick: { selectedGoal = goal },
                                onDateClick: { },
                                onStatusToggle: {
                                    updateGoalStatus(goal)
                                },
                                goals: $goals
                            )
                            
                            if goal.id != filteredGoals.last?.id {
                                Divider()
                                    .background(Color.gray.opacity(0.1))
                            }
                        }
                    }
                }
                .background(Color.white)
                .cornerRadius(16)
                .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.gray.opacity(0.1), lineWidth: 1)
                )
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .sheet(isPresented: $showingAddGoal) {
            CreateGoalModal(goals: $goals, onDismiss: { showingAddGoal = false })
        }
        .sheet(item: $selectedGoal) { goal in
            EditGoalModal(goal: goal, goals: $goals, steps: $steps, onDismiss: { selectedGoal = nil })
        }
    }
    
    private func updateGoalStatus(_ goal: Goal) {
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            var updatedGoal = goal
            let newStatus = goal.status == "active" ? "completed" : "active"
            updatedGoal.status = newStatus
            goals[index] = updatedGoal
            
            // Sync with API
            Task {
                try? await apiManager.updateGoal(updatedGoal)
            }
        }
    }
}

struct GoalTableRow: View {
    let goal: Goal
    let onRowClick: () -> Void
    let onDateClick: () -> Void
    let onStatusToggle: () -> Void
    @Binding var goals: [Goal]
    
    @State private var isHovering = false
    @State private var showDatePicker = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    private var dateString: String {
        guard let targetDate = goal.targetDate else { return "Bez data" }
        let formatter = DateFormatter()
        formatter.dateFormat = "d.M.yyyy"
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: targetDate)
    }
    
    private var isCompleted: Bool {
        goal.status == "completed"
    }
    
    var body: some View {
        HStack(spacing: 0) {
            // Name
            Text(goal.title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(isCompleted ? Color.gray.opacity(0.5) : Color(white: 0.15))
                .strikethrough(isCompleted)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            
            // Status toggle
            Toggle("", isOn: Binding(
                get: { goal.status == "active" },
                set: { _ in onStatusToggle() }
            ))
            .toggleStyle(.switch)
            .tint(primaryOrange)
            .frame(width: 120)
            .padding(.vertical, 8)
            .disabled(isCompleted)
            
            // Date - clickable with popover
            Text(dateString)
                .font(.system(size: 12))
                .foregroundColor(dateString == "Bez data" ? Color.gray.opacity(0.4) : primaryOrange.opacity(0.8))
                .frame(width: 150, alignment: .leading)
                .padding(.vertical, 8)
                .contentShape(Rectangle())
                .onTapGesture {
                    showDatePicker = true
                }
                .popover(isPresented: $showDatePicker, attachmentAnchor: .point(.bottom)) {
                    DatePickerModal(
                        goal: goal,
                        goals: $goals,
                        onDismiss: { showDatePicker = false }
                    )
                    .presentationCompactAdaptation(.popover)
                }
            
            // Steps count
            HStack(spacing: 3) {
                Image(systemName: "target")
                    .font(.system(size: 11))
                    .foregroundColor(.gray.opacity(0.5))
                Text("0")
                    .font(.system(size: 12))
                    .foregroundColor(Color(white: 0.4))
            }
            .frame(width: 100, alignment: .leading)
            .padding(.vertical, 8)
            
            // Edit button
            Button(action: onRowClick) {
                Image(systemName: "pencil")
                    .font(.system(size: 12))
                    .foregroundColor(.gray.opacity(0.5))
                    .frame(width: 40)
                    .padding(.vertical, 8)
            }
            .buttonStyle(.plain)
        }
        .background(
            isHovering ? primaryOrange.opacity(0.08) : (isCompleted ? primaryOrange.opacity(0.05) : Color.white)
        )
        .contentShape(Rectangle())
        .gesture(
            TapGesture().onEnded {
                onRowClick()
            }
        )
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}

// MARK: - Create Goal Modal

struct CreateGoalModal: View {
    @Binding var goals: [Goal]
    let onDismiss: () -> Void
    
    @State private var title: String = ""
    @State private var description: String = ""
    @State private var targetDate: Date? = nil
    @State private var status: Goal.Status = .active
    @State private var addToFocus: Bool = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Create goal")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            .padding(24)
            
            Divider()
            
            // Content
            ScrollView {
                HStack(alignment: .top, spacing: 32) {
                    // Left: General Information
                    VStack(alignment: .leading, spacing: 20) {
                        Text("GENERAL INFORMATION")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(white: 0.4))
                            .tracking(1)
                        
                        // Goal Title
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 2) {
                                Text("GOAL TITLE")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(white: 0.4))
                                Text("*")
                                    .foregroundColor(primaryOrange)
                            }
                            TextField("E.g. Learn to program", text: $title)
                                .textFieldStyle(.plain)
                                .font(.system(size: 15))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                        
                        // Description
                        VStack(alignment: .leading, spacing: 6) {
                            Text("DESCRIPTION (optional)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            TextEditor(text: $description)
                                .font(.system(size: 14))
                                .frame(height: 100)
                                .padding(12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                                .scrollContentBackground(.hidden)
                        }
                        
                        // End date
                        VStack(alignment: .leading, spacing: 6) {
                            Text("End date")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            DatePicker("", selection: Binding(
                                get: { targetDate ?? Date() },
                                set: { targetDate = $0 }
                            ), displayedComponents: .date)
                            .labelsHidden()
                            .datePickerStyle(.compact)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                        }
                        
                        // Status
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Status")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            Picker("", selection: $status) {
                                Text("Active").tag(Goal.Status.active)
                                Text("Completed").tag(Goal.Status.completed)
                                Text("Paused").tag(Goal.Status.paused)
                            }
                            .pickerStyle(.menu)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                        }
                        
                        // Add to focus
                        VStack(alignment: .leading, spacing: 4) {
                            Toggle(isOn: $addToFocus) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Add to focus")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(Color(white: 0.3))
                                    Text("Goals in focus will be highlighted and shown on the main panel")
                                        .font(.system(size: 11))
                                        .foregroundColor(.gray)
                                }
                            }
                            .toggleStyle(.checkbox)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    
                    // Right: Steps
                    VStack(alignment: .leading, spacing: 12) {
                        Text("STEPS")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(white: 0.4))
                            .tracking(1)
                        
                        VStack(spacing: 12) {
                            // Empty state
                            VStack(spacing: 12) {
                                Image(systemName: "list.bullet.clipboard")
                                    .font(.system(size: 48))
                                    .foregroundColor(.gray.opacity(0.3))
                                Text("No steps")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray.opacity(0.6))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                            
                            // Add step button
                            Button(action: {}) {
                                HStack {
                                    Image(systemName: "plus")
                                        .font(.system(size: 12, weight: .semibold))
                                    Text("Add step")
                                        .font(.system(size: 13, weight: .medium))
                                }
                                .foregroundColor(primaryOrange)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(primaryOrange.opacity(0.04))
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(primaryOrange.opacity(0.35), style: StrokeStyle(lineWidth: 1.5, dash: [6]))
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.leading, 16)
                    .overlay(
                        Rectangle()
                            .fill(Color.gray.opacity(0.12))
                            .frame(width: 1)
                        , alignment: .leading
                    )
                }
                .padding(24)
            }
            
            Divider()
            
            // Footer
            HStack {
                Spacer()
                
                Button("Cancel") {
                    onDismiss()
                }
                .buttonStyle(.plain)
                .foregroundColor(.gray)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                
                Button(action: saveGoal) {
                    Text("Save")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(primaryOrange)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
            .padding(20)
        }
        .frame(width: 700, height: 600)
        .background(Color.white)
    }
    
    private func saveGoal() {
        // TODO: Implement API call to create goal
        let newGoal = Goal(
            id: UUID().uuidString,
            userId: nil,
            title: title,
            description: description.isEmpty ? nil : description,
            targetDate: targetDate,
            status: status.rawValue,
            priority: "medium",
            category: nil,
            color: nil,
            icon: nil,
            createdAt: Date(),
            updatedAt: nil
        )
        goals.append(newGoal)
        onDismiss()
    }
}

// MARK: - Edit Goal Modal

struct EditGoalModal: View {
    let goal: Goal
    @Binding var goals: [Goal]
    @Binding var steps: [Step]
    let onDismiss: () -> Void
    
    @State private var title: String
    @State private var description: String
    @State private var targetDate: Date?
    @State private var status: Goal.Status
    @State private var addToFocus: Bool = false
    @State private var showingDatePicker = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    init(goal: Goal, goals: Binding<[Goal]>, steps: Binding<[Step]>, onDismiss: @escaping () -> Void) {
        self.goal = goal
        self._goals = goals
        self._steps = steps
        self.onDismiss = onDismiss
        _title = State(initialValue: goal.title)
        _description = State(initialValue: goal.description ?? "")
        _targetDate = State(initialValue: goal.targetDate)
        _status = State(initialValue: Goal.Status(rawValue: goal.status) ?? .active)
    }
    
    private var goalSteps: [Step] {
        steps.filter { $0.goalId == goal.id }
    }
    
    private var dateString: String {
        guard let date = targetDate else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM.yyyy"
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Edit goal")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(Color(white: 0.2))
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                }
                .buttonStyle(.plain)
            }
            .padding(24)
            
            Divider()
            
            // Content - Two columns
            ScrollView {
                HStack(alignment: .top, spacing: 32) {
                    // Left: General Information
                    VStack(alignment: .leading, spacing: 20) {
                        Text("GENERAL INFORMATION")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(white: 0.4))
                            .tracking(1)
                        
                        // Goal Title
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 2) {
                                Text("GOAL TITLE")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(Color(white: 0.4))
                                Text("*")
                                    .foregroundColor(primaryOrange)
                            }
                            TextField("", text: $title)
                                .textFieldStyle(.plain)
                                .font(.system(size: 15))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                        
                        // Description
                        VStack(alignment: .leading, spacing: 6) {
                            Text("DESCRIPTION (optional)")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            TextEditor(text: $description)
                                .font(.system(size: 14))
                                .frame(height: 100)
                                .padding(12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                                .scrollContentBackground(.hidden)
                        }
                        
                        // End date
                        VStack(alignment: .leading, spacing: 6) {
                            Text("End date")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            HStack {
                                TextField("dd.mm.yyyy", text: Binding(
                                    get: { dateString },
                                    set: { _ in }
                                ))
                                .textFieldStyle(.plain)
                                .font(.system(size: 14))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 12)
                                .background(Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                                .disabled(true)
                                
                                Button(action: {
                                    showingDatePicker = true
                                }) {
                                    Image(systemName: "calendar")
                                        .font(.system(size: 14))
                                        .foregroundColor(.gray)
                                        .padding(12)
                                        .background(Color.gray.opacity(0.05))
                                        .cornerRadius(10)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        
                        // Status
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Status")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(Color(white: 0.4))
                            Picker("", selection: $status) {
                                Text("Active").tag(Goal.Status.active)
                                Text("Completed").tag(Goal.Status.completed)
                                Text("Paused").tag(Goal.Status.paused)
                            }
                            .pickerStyle(.menu)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                        }
                        
                        // Add to focus
                        VStack(alignment: .leading, spacing: 4) {
                            Toggle(isOn: $addToFocus) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Add to focus")
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundColor(Color(white: 0.3))
                                    Text("Goals in focus will be highlighted and shown on the main panel")
                                        .font(.system(size: 11))
                                        .foregroundColor(.gray)
                                }
                            }
                            .toggleStyle(.checkbox)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    
                    // Right: Steps
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("STEPS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(Color(white: 0.4))
                                .tracking(1)
                            Spacer()
                            Button(action: {}) {
                                HStack(spacing: 4) {
                                    Image(systemName: "plus")
                                        .font(.system(size: 11, weight: .semibold))
                                    Text("Add step")
                                        .font(.system(size: 12, weight: .medium))
                                }
                                .foregroundColor(primaryOrange)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(primaryOrange.opacity(0.1))
                                .cornerRadius(6)
                            }
                            .buttonStyle(.plain)
                        }
                        
                        if goalSteps.isEmpty {
                            VStack(spacing: 8) {
                                Text("No steps")
                                    .font(.system(size: 13))
                                    .foregroundColor(.gray.opacity(0.6))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                        } else {
                            VStack(spacing: 12) {
                                ForEach(Array(goalSteps.enumerated()), id: \.element.id) { index, step in
                                    GoalStepCard(step: step, stepNumber: index + 1)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.leading, 16)
                    .overlay(
                        Rectangle()
                            .fill(Color.gray.opacity(0.12))
                            .frame(width: 1)
                        , alignment: .leading
                    )
                }
                .padding(24)
            }
            
            Divider()
            
            // Footer
            HStack {
                Button("Delete") {
                    // TODO: Implement delete
                    onDismiss()
                }
                .buttonStyle(.plain)
                .foregroundColor(.red)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
                
                Spacer()
                
                Button("Cancel") {
                    onDismiss()
                }
                .buttonStyle(.plain)
                .foregroundColor(.gray)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                
                Button(action: saveChanges) {
                    Text("Save")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 10)
                        .background(primaryOrange)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
            }
            .padding(20)
        }
        .frame(width: 800, height: 650)
        .background(Color.white)
        .popover(isPresented: $showingDatePicker) {
            DatePickerModal(
                goal: goal,
                goals: $goals,
                onDismiss: {
                    showingDatePicker = false
                    // Update targetDate from goal
                    if let updatedGoal = goals.first(where: { $0.id == goal.id }) {
                        targetDate = updatedGoal.targetDate
                    }
                }
            )
        }
    }
    
    private func saveChanges() {
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            var updated = goal
            updated.title = title
            updated.description = description.isEmpty ? nil : description
            updated.targetDate = targetDate
            updated.status = status.rawValue
            goals[index] = updated
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateGoal(updated)
            }
        }
        onDismiss()
    }
}

// MARK: - Goal Step Card

struct GoalStepCard: View {
    let step: Step
    let stepNumber: Int
    
    private var stepDateString: String {
        guard let date = step.date else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "MM/dd"
        return formatter.string(from: date)
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Text("#\(stepNumber)")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.gray.opacity(0.6))
                .frame(width: 30)
            
            Text(step.title)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(Color(white: 0.2))
            
            Spacer()
            
            if !stepDateString.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 10))
                        .foregroundColor(.gray.opacity(0.5))
                    Text(stepDateString)
                        .font(.system(size: 11))
                        .foregroundColor(.gray.opacity(0.6))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray.opacity(0.15), lineWidth: 1)
        )
    }
}

// MARK: - Date Picker Modal

struct DatePickerModal: View {
    let goal: Goal
    @Binding var goals: [Goal]
    let onDismiss: () -> Void
    
    @State private var selectedDate: Date
    @State private var currentMonth: Date
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    private let weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
    
    init(goal: Goal, goals: Binding<[Goal]>, onDismiss: @escaping () -> Void) {
        self.goal = goal
        self._goals = goals
        self.onDismiss = onDismiss
        _selectedDate = State(initialValue: goal.targetDate ?? Date())
        _currentMonth = State(initialValue: goal.targetDate ?? Date())
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("New date:")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(white: 0.15))
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.gray.opacity(0.5))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 10)
            
            Divider()
            
            // Calendar content
            VStack(spacing: 8) {
                // Week day headers
                HStack(spacing: 4) {
                    ForEach(weekDays, id: \.self) { day in
                        Text(day)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(.gray.opacity(0.6))
                            .frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.top, 8)
                
                // Calendar grid
                calendarGrid
                    .padding(.horizontal, 8)
                
                // Month navigation
                HStack {
                    Button(action: previousMonth) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 12))
                            .foregroundColor(.gray.opacity(0.6))
                            .padding(6)
                    }
                    .buttonStyle(.plain)
                    
                    Spacer()
                    
                    Text(monthYearString)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(white: 0.2))
                    
                    Spacer()
                    
                    Button(action: nextMonth) {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12))
                            .foregroundColor(.gray.opacity(0.6))
                            .padding(6)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 8)
                .padding(.top, 4)
            }
            .padding(.vertical, 8)
            
            // Footer buttons
            HStack(spacing: 8) {
                Button("Confirm") {
                    saveDate()
                }
                .buttonStyle(.plain)
                .foregroundColor(.white)
                .font(.system(size: 13, weight: .semibold))
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(primaryOrange)
                .cornerRadius(6)
                
                Button("Cancel") {
                    onDismiss()
                }
                .buttonStyle(.plain)
                .foregroundColor(Color(white: 0.3))
                .font(.system(size: 13))
                .padding(.horizontal, 20)
                .padding(.vertical, 8)
                .background(Color.gray.opacity(0.1))
                .cornerRadius(6)
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 14)
        }
        .frame(width: 280, height: 340)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private var calendarGrid: some View {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month], from: currentMonth)
        guard let firstDay = calendar.date(from: components),
              let range = calendar.range(of: .day, in: .month, for: firstDay) else {
            return AnyView(EmptyView())
        }
        
        let daysInMonth = range.count
        let startingDayOfWeek = calendar.component(.weekday, from: firstDay)
        // Convert Sunday (1) to 6, Monday (2) to 0, etc. for Czech week (Monday = first day)
        let adjustedStart = startingDayOfWeek == 1 ? 6 : startingDayOfWeek - 2
        
        var days: [Date?] = []
        // Add empty cells for days before the first day of the month
        for _ in 0..<adjustedStart {
            days.append(nil)
        }
        // Add all days of the month
        for day in 1...daysInMonth {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstDay) {
                days.append(date)
            }
        }
        
        return AnyView(
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4) {
                ForEach(0..<days.count, id: \.self) { index in
                    if let date = days[index] {
                        dayButton(date: date)
                    } else {
                        Color.clear
                            .frame(height: 28)
                    }
                }
            }
        )
    }
    
    private func dayButton(date: Date) -> some View {
        let calendar = Calendar.current
        let day = calendar.component(.day, from: date)
        let isSelected = calendar.isDate(date, inSameDayAs: selectedDate)
        let isToday = calendar.isDateInToday(date)
        let isCurrentMonth = calendar.isDate(date, equalTo: currentMonth, toGranularity: .month)
        
        return Button(action: {
            selectedDate = date
        }) {
            Text("\(day)")
                .font(.system(size: 11, weight: isSelected ? .bold : .regular))
                .foregroundColor(isSelected ? .white : (isToday ? primaryOrange : (isCurrentMonth ? Color(white: 0.2) : Color.gray.opacity(0.4))))
                .frame(width: 28, height: 28)
                .background(isSelected ? primaryOrange : (isToday ? primaryOrange.opacity(0.1) : Color.gray.opacity(0.05)))
                .cornerRadius(6)
        }
        .buttonStyle(.plain)
    }
    
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "LLLL yyyy"
        let string = formatter.string(from: currentMonth)
        // Capitalize first letter only
        return string.prefix(1).uppercased() + string.dropFirst()
    }
    
    private func previousMonth() {
        let calendar = Calendar.current
        if let newMonth = calendar.date(byAdding: .month, value: -1, to: currentMonth) {
            currentMonth = newMonth
        }
    }
    
    private func nextMonth() {
        let calendar = Calendar.current
        if let newMonth = calendar.date(byAdding: .month, value: 1, to: currentMonth) {
            currentMonth = newMonth
        }
    }
    
    private func saveDate() {
        if let index = goals.firstIndex(where: { $0.id == goal.id }) {
            var updated = goal
            updated.targetDate = selectedDate
            goals[index] = updated
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateGoal(updated)
            }
        }
        onDismiss()
    }
}
