import SwiftUI

struct StepsView: View {
    let goals: [Goal]
    @Binding var steps: [Step]
    @EnvironmentObject var apiManager: APIManager
    @StateObject private var localizationManager = LocalizationManager.shared
    
    @State private var showingAddStep = false
    @State private var selectedStep: Step?
    @State private var showCompleted = false
    @State private var goalFilter: String? = nil
    @State private var dateFilter: Date? = nil
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047) // #ea580c
    
    private var filteredSteps: [Step] {
        var filtered = steps
        
        // Filter by completed
        if !showCompleted {
            filtered = filtered.filter { !$0.completed }
        }
        
        // Filter by goal
        if let goalId = goalFilter {
            filtered = filtered.filter { $0.goalId == goalId }
        }
        
        // Filter by date
        if let filterDate = dateFilter {
            let calendar = Calendar.current
            filtered = filtered.filter { step in
                guard let stepDate = step.date else { return false }
                return calendar.isDate(stepDate, inSameDayAs: filterDate)
            }
        }
        
        return filtered
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Top header with filters and add button
            HStack {
                // Filters
                HStack(spacing: 16) {
                    // Show completed checkbox
                    Toggle(isOn: $showCompleted) {
                        Text(t("steps.filters.showCompleted"))
                            .font(.system(size: 13))
                            .foregroundColor(Color(white: 0.3))
                    }
                    .toggleStyle(.checkbox)
                    
                    // Goal filter
                    Menu {
                        Button(t("steps.filters.goal.all")) { goalFilter = nil }
                        Divider()
                        ForEach(goals) { goal in
                            Button(goal.title) { goalFilter = goal.id }
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Text(goalFilter == nil ? t("steps.filters.goal.all") : (goals.first(where: { $0.id == goalFilter })?.title ?? t("steps.filters.goal.all")))
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
                    
                    // Date filter
                    HStack(spacing: 8) {
                        DatePicker("", selection: Binding(
                            get: { dateFilter ?? Date() },
                            set: { dateFilter = $0 }
                        ), displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .labelsHidden()
                        .frame(width: 120)
                        
                        if dateFilter != nil {
                            Button(action: { dateFilter = nil }) {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.gray.opacity(0.5))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                Spacer()
                
                Button(action: { showingAddStep = true }) {
                    HStack(spacing: 5) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .semibold))
                        Text(t("steps.addStep"))
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
                        Text(t("table.name"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                        
                        Text(t("steps.title"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 100, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        Text(t("table.date"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 150, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        Text(t("steps.goal"))
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(white: 0.3))
                            .frame(width: 200, alignment: .leading)
                            .padding(.vertical, 8)
                        
                        Text(t("steps.stepTime"))
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
                    if filteredSteps.isEmpty {
                        VStack(spacing: 8) {
                            Text(t("steps.noSteps"))
                                .font(.system(size: 16))
                                .foregroundColor(.gray)
                            Text(t("steps.noStepsDescription"))
                                .font(.system(size: 13))
                                .foregroundColor(.gray.opacity(0.7))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                    } else {
                        ForEach(filteredSteps) { step in
                            StepTableRow(
                                step: step,
                                goals: goals,
                                steps: $steps,
                                onRowClick: { selectedStep = step }
                            )
                            
                            if step.id != filteredSteps.last?.id {
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
        .sheet(isPresented: $showingAddStep) {
            StepEditModal(
                step: nil,
                goals: goals,
                steps: $steps,
                onDismiss: { showingAddStep = false }
            )
        }
        .sheet(item: $selectedStep) { step in
            StepEditModal(
                step: step,
                goals: goals,
                steps: $steps,
                onDismiss: { selectedStep = nil }
            )
        }
    }
}

struct StepTableRow: View {
    let step: Step
    let goals: [Goal]
    @Binding var steps: [Step]
    let onRowClick: () -> Void
    
    @State private var isHovering = false
    @State private var showDatePicker = false
    @State private var showGoalPicker = false
    @State private var showTimePicker = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    private var checklistCount: String {
        guard let checklist = step.checklist, !checklist.isEmpty else {
            return "—"
        }
        let completed = checklist.filter { $0.completed }.count
        return "\(completed)/\(checklist.count)"
    }
    
    private var dateString: String {
        guard let date = step.date else { return "Bez data" }
        let formatter = DateFormatter()
        formatter.dateFormat = "d.M.yyyy"
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
    }
    
    private var goalTitle: String {
        guard let goalId = step.goalId,
              let goal = goals.first(where: { $0.id == goalId }) else {
            return "Bez cíle"
        }
        return goal.title
    }
    
    private var timeString: String {
        guard let time = step.estimatedTime, time > 0 else {
            return "—"
        }
        return "\(time) min"
    }
    
    var body: some View {
        HStack(spacing: 0) {
            // Name
            Text(step.title)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(step.completed ? Color.gray.opacity(0.5) : Color(white: 0.15))
                .strikethrough(step.completed)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            
            // Checklist count
            HStack(spacing: 4) {
                Image(systemName: "checklist")
                    .font(.system(size: 10))
                    .foregroundColor(checklistCount == "—" ? Color.gray.opacity(0.3) : primaryOrange.opacity(0.6))
                Text(checklistCount)
                    .font(.system(size: 12, weight: checklistCount == "—" ? .regular : .semibold))
                    .foregroundColor(checklistCount == "—" ? Color.gray.opacity(0.4) : primaryOrange.opacity(0.8))
            }
            .frame(width: 100, alignment: .leading)
            .padding(.vertical, 8)
            
            // Date - clickable
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
                    StepDatePickerModal(
                        step: step,
                        steps: $steps,
                        onDismiss: { showDatePicker = false }
                    )
                    .presentationCompactAdaptation(.popover)
                }
            
            // Goal - clickable
            Text(goalTitle)
                .font(.system(size: 12))
                .foregroundColor(goalTitle == "Bez cíle" ? Color.gray.opacity(0.4) : primaryOrange.opacity(0.8))
                .frame(width: 200, alignment: .leading)
                .padding(.vertical, 8)
                .contentShape(Rectangle())
                .onTapGesture {
                    showGoalPicker = true
                }
                .popover(isPresented: $showGoalPicker, attachmentAnchor: .point(.bottom)) {
                    StepGoalPickerModal(
                        step: step,
                        goals: goals,
                        steps: $steps,
                        onDismiss: { showGoalPicker = false }
                    )
                    .presentationCompactAdaptation(.popover)
                }
            
            // Time - clickable
            Text(timeString)
                .font(.system(size: 12))
                .foregroundColor(timeString == "—" ? Color.gray.opacity(0.4) : primaryOrange.opacity(0.8))
                .frame(width: 100, alignment: .leading)
                .padding(.vertical, 8)
                .contentShape(Rectangle())
                .onTapGesture {
                    showTimePicker = true
                }
                .popover(isPresented: $showTimePicker, attachmentAnchor: .point(.bottom)) {
                    StepTimePickerModal(
                        step: step,
                        steps: $steps,
                        onDismiss: { showTimePicker = false }
                    )
                    .presentationCompactAdaptation(.popover)
                }
            
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
            isHovering ? primaryOrange.opacity(0.08) : Color.white
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onRowClick()
        }
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.2)) {
                isHovering = hovering
            }
        }
    }
}

// MARK: - Step Date Picker Modal For Edit

struct StepDatePickerModalForEdit: View {
    @Binding var selectedDate: Date
    let onDismiss: () -> Void
    
    @State private var currentMonth: Date
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    private let weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
    
    init(selectedDate: Binding<Date>, onDismiss: @escaping () -> Void) {
        self._selectedDate = selectedDate
        self.onDismiss = onDismiss
        _currentMonth = State(initialValue: selectedDate.wrappedValue)
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
                    onDismiss()
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
        let adjustedStart = startingDayOfWeek == 1 ? 6 : startingDayOfWeek - 2
        
        var days: [Date?] = []
        for _ in 0..<adjustedStart {
            days.append(nil)
        }
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
}

// MARK: - Step Date Picker Modal

struct StepDatePickerModal: View {
    let step: Step
    @Binding var steps: [Step]
    let onDismiss: () -> Void
    
    @State private var selectedDate: Date
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    private let weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
    
    @State private var currentMonth: Date
    
    init(step: Step, steps: Binding<[Step]>, onDismiss: @escaping () -> Void) {
        self.step = step
        self._steps = steps
        self.onDismiss = onDismiss
        let initialDate = step.date ?? Date()
        _selectedDate = State(initialValue: initialDate)
        _currentMonth = State(initialValue: initialDate)
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
        let adjustedStart = startingDayOfWeek == 1 ? 6 : startingDayOfWeek - 2
        
        var days: [Date?] = []
        for _ in 0..<adjustedStart {
            days.append(nil)
        }
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
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            var updated = step
            updated.date = selectedDate
            steps[index] = updated
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateStep(updated)
            }
        }
        onDismiss()
    }
}

// MARK: - Step Goal Picker Modal

struct StepGoalPickerModal: View {
    let step: Step
    let goals: [Goal]
    @Binding var steps: [Step]
    let onDismiss: () -> Void
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Select goal")
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
            
            // Goals list
            ScrollView {
                VStack(spacing: 0) {
                    Button(action: {
                        saveGoal(nil)
                    }) {
                        HStack {
                            Text("Bez cíle")
                                .font(.system(size: 13))
                                .foregroundColor(Color(white: 0.2))
                            Spacer()
                            if step.goalId == nil {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 11))
                                    .foregroundColor(primaryOrange)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                    }
                    .buttonStyle(.plain)
                    
                    Divider()
                    
                    ForEach(goals) { goal in
                        Button(action: {
                            saveGoal(goal.id)
                        }) {
                            HStack {
                                Text(goal.title)
                                    .font(.system(size: 13))
                                    .foregroundColor(Color(white: 0.2))
                                Spacer()
                                if step.goalId == goal.id {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 11))
                                        .foregroundColor(primaryOrange)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                        
                        if goal.id != goals.last?.id {
                            Divider()
                        }
                    }
                }
            }
            .frame(height: 200)
        }
        .frame(width: 250, height: 280)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func saveGoal(_ goalId: String?) {
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            var updated = step
            updated.goalId = goalId
            steps[index] = updated
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateStep(updated)
            }
        }
        onDismiss()
    }
}

// MARK: - Step Time Picker Modal

struct StepTimePickerModal: View {
    let step: Step
    @Binding var steps: [Step]
    let onDismiss: () -> Void
    
    @State private var timeMinutes: String
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    init(step: Step, steps: Binding<[Step]>, onDismiss: @escaping () -> Void) {
        self.step = step
        self._steps = steps
        self.onDismiss = onDismiss
        _timeMinutes = State(initialValue: step.estimatedTime != nil ? "\(step.estimatedTime!)" : "")
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Estimated time")
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
            
            // Time input
            VStack(spacing: 16) {
                TextField("Minutes", text: $timeMinutes)
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
                
                Text("Enter time in minutes")
                    .font(.system(size: 11))
                    .foregroundColor(.gray.opacity(0.6))
            }
            .padding(16)
            
            // Footer buttons
            HStack(spacing: 8) {
                Button("Confirm") {
                    saveTime()
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
            .padding(.bottom, 14)
        }
        .frame(width: 250, height: 220)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 2)
    }
    
    private func saveTime() {
        if let index = steps.firstIndex(where: { $0.id == step.id }) {
            var updated = step
            updated.estimatedTime = Int(timeMinutes) ?? nil
            steps[index] = updated
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateStep(updated)
            }
        }
        onDismiss()
    }
}

// MARK: - Step Edit Modal

struct StepEditModal: View {
    let step: Step?
    let goals: [Goal]
    @Binding var steps: [Step]
    let onDismiss: () -> Void
    
    @State private var title: String
    @State private var description: String
    @State private var selectedGoalId: String?
    @State private var estimatedTime: String
    @State private var isImportant: Bool
    @State private var date: Date
    @State private var checklist: [ChecklistItem]
    @State private var requireAllChecklist: Bool
    @State private var showDatePicker = false
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    init(step: Step?, goals: [Goal], steps: Binding<[Step]>, onDismiss: @escaping () -> Void) {
        self.step = step
        self.goals = goals
        self._steps = steps
        self.onDismiss = onDismiss
        
        if let step = step {
            _title = State(initialValue: step.title)
            _description = State(initialValue: step.description ?? "")
            _selectedGoalId = State(initialValue: step.goalId)
            _estimatedTime = State(initialValue: step.estimatedTime != nil ? "\(step.estimatedTime!)" : "30")
            _isImportant = State(initialValue: step.isImportant ?? false)
            _date = State(initialValue: step.date ?? Date())
            _checklist = State(initialValue: step.checklist ?? [])
        } else {
            _title = State(initialValue: "")
            _description = State(initialValue: "")
            _selectedGoalId = State(initialValue: nil)
            _estimatedTime = State(initialValue: "30")
            _isImportant = State(initialValue: false)
            _date = State(initialValue: Date())
            _checklist = State(initialValue: [])
        }
        _requireAllChecklist = State(initialValue: false)
    }
    
    private var dateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd.MM.yyyy"
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
    }
    
    private var checklistProgress: String {
        guard !checklist.isEmpty else { return "" }
        let completed = checklist.filter { $0.completed }.count
        return "\(completed)/\(checklist.count) splněno"
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(step == nil ? "Add step" : "Edit step")
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
            
            // Content
            ScrollView {
                HStack(alignment: .top, spacing: 32) {
                    // Left: Step Details
                    leftColumn
                    
                    // Right: Checklist
                    rightColumn
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
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                
                Button(action: saveStep) {
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
    }
    
    private var leftColumn: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Title
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 2) {
                    Text("Title")
                        .font(.system(size: 13, weight: .semibold))
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
                Text("Description")
                    .font(.system(size: 13, weight: .semibold))
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
            
            // Date and Goal row
            HStack(spacing: 16) {
                // Date
                VStack(alignment: .leading, spacing: 6) {
                    Text("Date")
                        .font(.system(size: 13, weight: .semibold))
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
                        
                        Button(action: { showDatePicker = true }) {
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
                .frame(maxWidth: .infinity)
                
                // Goal
                VStack(alignment: .leading, spacing: 6) {
                    Text("Goal")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(white: 0.4))
                    Menu {
                        Button("No goal") { selectedGoalId = nil }
                        Divider()
                        ForEach(goals) { goal in
                            Button(goal.title) { selectedGoalId = goal.id }
                        }
                    } label: {
                        HStack {
                            Text(selectedGoalId.flatMap { id in goals.first { $0.id == id }?.title } ?? "No goal")
                                .font(.system(size: 14))
                                .foregroundColor(Color(white: 0.2))
                            Spacer()
                            Image(systemName: "chevron.down")
                                .font(.system(size: 12))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                    .buttonStyle(.plain)
                }
                .frame(maxWidth: .infinity)
            }
            
            // Time and Important row
            HStack(spacing: 16) {
                // Estimated time
                VStack(alignment: .leading, spacing: 6) {
                    Text("Odhadovaný čas (min)")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(Color(white: 0.4))
                    TextField("30", text: $estimatedTime)
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
                .frame(maxWidth: .infinity)
                
                // Important checkbox
                VStack {
                    Spacer()
                    Button(action: { isImportant.toggle() }) {
                        HStack(spacing: 8) {
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(isImportant ? primaryOrange : Color.gray.opacity(0.3), lineWidth: 2)
                                .frame(width: 20, height: 20)
                                .background(
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(isImportant ? primaryOrange : Color.clear)
                                )
                                .overlay(
                                    isImportant ?
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                    : nil
                                )
                            Image(systemName: "star.fill")
                                .font(.system(size: 14))
                                .foregroundColor(isImportant ? primaryOrange : Color.gray.opacity(0.5))
                            Text("Důležitý")
                                .font(.system(size: 14))
                                .foregroundColor(Color(white: 0.35))
                        }
                    }
                    .buttonStyle(.plain)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity)
        .popover(isPresented: $showDatePicker) {
            StepDatePickerModalForEdit(
                selectedDate: $date,
                onDismiss: { showDatePicker = false }
            )
            .presentationCompactAdaptation(.popover)
        }
    }
    
    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Checklist header
            HStack {
                Text("Checklist")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color(white: 0.25))
                Spacer()
                if !checklist.isEmpty {
                    Text(checklistProgress)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }
            .padding(.bottom, 8)
            
            // Checklist items
            if checklist.isEmpty {
                VStack(spacing: 8) {
                    Text("Zatím žádné položky")
                        .font(.system(size: 13))
                        .foregroundColor(.gray.opacity(0.6))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 20)
            } else {
                VStack(spacing: 6) {
                    ForEach(checklist.indices, id: \.self) { index in
                        StepChecklistItemRow(
                            item: $checklist[index],
                            onDelete: { checklist.remove(at: index) },
                            primaryOrange: primaryOrange
                        )
                    }
                }
            }
            
            // Add item button
            Button(action: {
                let newItem = ChecklistItem(id: UUID().uuidString, title: "", completed: false)
                checklist.append(newItem)
            }) {
                HStack {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .semibold))
                    Text("Přidat položku")
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
            
            // Require all toggle
            if !checklist.isEmpty {
                Toggle(isOn: $requireAllChecklist) {
                    Text("Vyžadovat splnění všech položek před dokončením kroku")
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
                .toggleStyle(.checkbox)
                .padding(.top, 6)
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
    
    private func saveStep() {
        let timeValue = Int(estimatedTime) ?? 30
        
        if let existingStep = step {
            // Update existing step
            var updated = existingStep
            updated.title = title
            updated.description = description.isEmpty ? nil : description
            updated.goalId = selectedGoalId
            updated.estimatedTime = timeValue
            updated.isImportant = isImportant
            updated.date = date
            updated.checklist = checklist.isEmpty ? nil : checklist
            
            if let index = steps.firstIndex(where: { $0.id == existingStep.id }) {
                steps[index] = updated
            }
            
            // Sync with API
            Task {
                try? await APIManager.shared.updateStep(updated)
            }
        } else {
            // Create new step
            let newStep = Step(
                id: UUID().uuidString,
                userId: nil,
                goalId: selectedGoalId,
                title: title,
                description: description.isEmpty ? nil : description,
                completed: false,
                completedAt: nil,
                date: date,
                isImportant: isImportant,
                isUrgent: nil,
                createdAt: Date(),
                aspirationId: nil,
                deadline: nil,
                metricId: nil,
                areaId: nil,
                estimatedTime: timeValue,
                xpReward: nil,
                checklist: checklist.isEmpty ? nil : checklist
            )
            
            steps.append(newStep)
            
            // Sync with API
            Task {
                try? await APIManager.shared.createStep(newStep)
            }
        }
        
        onDismiss()
    }
}

// MARK: - Step Checklist Item Row

struct StepChecklistItemRow: View {
    @Binding var item: ChecklistItem
    let onDelete: () -> Void
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Button(action: { item.completed.toggle() }) {
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
            .buttonStyle(.plain)
            
            TextField("Název položky...", text: $item.title)
                .textFieldStyle(.plain)
                .font(.system(size: 13))
                .foregroundColor(item.completed ? .gray.opacity(0.6) : Color(white: 0.25))
                .strikethrough(item.completed)
            
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
        .background(item.completed ? primaryOrange.opacity(0.1) : Color.gray.opacity(0.05))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(item.completed ? primaryOrange.opacity(0.3) : Color.gray.opacity(0.15), lineWidth: 1)
        )
    }
}

#Preview {
    StepsView(goals: [], steps: .constant([]))
}

