import SwiftUI

struct StepDetailView: View {
    let step: DailyStep?
    let goalTitle: String?
    let initialDate: Date?
    let onStepAdded: (() -> Void)?
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    
    // Editing states
    @State private var editingTitle: String
    @State private var editingDescription: String
    @State private var editingDate: Date
    @State private var editingGoalId: String?
    @State private var editingAreaId: String?
    @State private var editingIsImportant: Bool
    @State private var editingIsUrgent: Bool
    @State private var editingDeadline: Date?
    @State private var editingEstimatedTime: Int
    @State private var editingIsRepeating: Bool
    @State private var editingFrequency: String?
    @State private var editingSelectedDays: [String]
    @State private var editingRecurringStartDate: Date?
    @State private var editingRecurringEndDate: Date?
    @State private var editingRecurringDisplayMode: String
    
    @State private var goals: [Goal] = []
    @State private var aspirations: [Aspiration] = []
    @State private var isCompleted: Bool
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var showDuplicatedStep = false
    @State private var duplicatedStep: DailyStep?
    
    private var isCreating: Bool {
        step == nil || (step?.id.isEmpty ?? false)
    }
    
    init(step: DailyStep? = nil, goalTitle: String? = nil, initialDate: Date? = nil, onStepAdded: (() -> Void)? = nil) {
        self.step = step
        self.goalTitle = goalTitle
        self.initialDate = initialDate
        self.onStepAdded = onStepAdded
        
        if let step = step {
        self._isCompleted = State(initialValue: step.completed)
            self._editingTitle = State(initialValue: step.title)
            self._editingDescription = State(initialValue: step.description ?? "")
            self._editingDate = State(initialValue: step.date ?? Date())
            self._editingGoalId = State(initialValue: step.goalId)
            self._editingIsImportant = State(initialValue: step.isImportant ?? false)
            self._editingIsUrgent = State(initialValue: step.isUrgent ?? false)
            self._editingDeadline = State(initialValue: step.deadline)
            self._editingEstimatedTime = State(initialValue: step.estimatedTime ?? 0)
            self._editingAreaId = State(initialValue: step.areaId ?? step.aspirationId)
            self._editingIsRepeating = State(initialValue: step.frequency != nil)
            self._editingFrequency = State(initialValue: step.frequency)
            self._editingSelectedDays = State(initialValue: step.selectedDays ?? [])
            self._editingRecurringStartDate = State(initialValue: step.recurringStartDate)
            self._editingRecurringEndDate = State(initialValue: step.recurringEndDate)
            self._editingRecurringDisplayMode = State(initialValue: step.recurringDisplayMode ?? "next_only")
        } else {
            self._isCompleted = State(initialValue: false)
            self._editingTitle = State(initialValue: "")
            self._editingDescription = State(initialValue: "")
            self._editingDate = State(initialValue: initialDate ?? Date())
            self._editingGoalId = State(initialValue: nil)
            self._editingIsImportant = State(initialValue: false)
            self._editingIsUrgent = State(initialValue: false)
            self._editingDeadline = State(initialValue: nil)
            self._editingEstimatedTime = State(initialValue: 0)
            self._editingIsRepeating = State(initialValue: false)
            self._editingFrequency = State(initialValue: nil)
            self._editingSelectedDays = State(initialValue: [])
            self._editingRecurringStartDate = State(initialValue: nil)
            self._editingRecurringEndDate = State(initialValue: nil)
            self._editingRecurringDisplayMode = State(initialValue: "next_only")
        }
    }
    
    // MARK: - Computed Properties
    
    private var filteredGoals: [Goal] {
        if let areaId = editingAreaId {
            return goals.filter { $0.aspirationId == areaId }
        }
        return goals
    }
    
    private var basicInformationCard: some View {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                Text("Název")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                
                TextField("Název kroku", text: $editingTitle)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .padding(DesignSystem.Spacing.sm)
                    .background(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.sm)
            }
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                Text("Popis")
                                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                
                TextEditor(text: $editingDescription)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .frame(minHeight: 80)
                    .padding(DesignSystem.Spacing.sm)
                    .background(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.sm)
            }
            
            // Goal and Area
            HStack(spacing: DesignSystem.Spacing.md) {
                // Area
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Oblast")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    Picker("Oblast", selection: Binding(
                        get: { editingAreaId ?? "" },
                        set: { editingAreaId = $0.isEmpty ? nil : $0 }
                    )) {
                        Text("Bez oblasti").tag("")
                        ForEach(aspirations, id: \.id) { aspiration in
                            Text(aspiration.title).tag(aspiration.id)
                            }
                        }
                    .pickerStyle(.menu)
                    .tint(DesignSystem.Colors.dynamicPrimary)
                    .padding(DesignSystem.Spacing.sm)
                    .background(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.sm)
                }
                
                // Goal
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Cíl")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    Picker("Cíl", selection: Binding(
                        get: { editingGoalId ?? "" },
                        set: { editingGoalId = $0.isEmpty ? nil : $0 }
                    )) {
                        Text("Bez cíle").tag("")
                        ForEach(filteredGoals, id: \.id) { goal in
                            Text(goal.title).tag(goal.id)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(DesignSystem.Colors.dynamicPrimary)
                    .padding(DesignSystem.Spacing.sm)
                    .background(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.sm)
                }
            }
                            }
                            .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
        )
        .cornerRadius(DesignSystem.CornerRadius.md)
        .shadow(color: Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
            default:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(1.0))
            }
        }), radius: 0, x: 3, y: 3)
    }
    
    private var dateAndTimeCard: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Datum a čas")
                                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            // Repeating toggle
            HStack {
                Text("Opakování")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                
                Spacer()
                
                Toggle("", isOn: $editingIsRepeating)
                    .tint(DesignSystem.Colors.dynamicPrimary)
                    .onChange(of: editingIsRepeating) { newValue in
                        if !newValue {
                            editingFrequency = nil
                            editingSelectedDays = []
                            editingRecurringStartDate = nil
                            editingRecurringEndDate = nil
                        } else {
                            editingFrequency = editingFrequency ?? "daily"
                            editingRecurringStartDate = editingRecurringStartDate ?? Date()
                        }
                    }
            }
            .padding(DesignSystem.Spacing.sm)
            .background(DesignSystem.Colors.surface)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
            )
            .cornerRadius(DesignSystem.CornerRadius.sm)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                if !editingIsRepeating {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Datum")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        DatePicker("Datum", selection: $editingDate, displayedComponents: .date)
                            .datePickerStyle(.compact)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                            .padding(DesignSystem.Spacing.sm)
                            .background(DesignSystem.Colors.surface)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.sm)
                    }
                } else {
                    // Frequency selector
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Frekvence")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        Picker("Frekvence", selection: Binding(
                            get: { editingFrequency ?? "daily" },
                            set: { 
                                editingFrequency = $0
                                if $0 == "daily" {
                                    editingSelectedDays = []
                                }
                            }
                        )) {
                            Text("Denně").tag("daily")
                            Text("Týdně").tag("weekly")
                            Text("Měsíčně").tag("monthly")
                        }
                        .pickerStyle(.segmented)
                        .tint(DesignSystem.Colors.dynamicPrimary)
                    }
                    
                    // Selected days for weekly
                    if editingFrequency == "weekly" {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Vyberte dny v týdnu")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            let weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
                            let dayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
                            
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: DesignSystem.Spacing.xs) {
                                ForEach(Array(weekDays.enumerated()), id: \.element) { index, day in
                                    Button(action: {
                                        if editingSelectedDays.contains(day) {
                                            editingSelectedDays.removeAll { $0 == day }
                                        } else {
                                            editingSelectedDays.append(day)
                                        }
                                    }) {
                                        Text(dayLabels[index])
                                            .font(DesignSystem.Typography.caption)
                                            .foregroundColor(editingSelectedDays.contains(day) ? .white : DesignSystem.Colors.dynamicPrimary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, DesignSystem.Spacing.xs)
                                            .background(editingSelectedDays.contains(day) ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.surface)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                            )
                                            .cornerRadius(DesignSystem.CornerRadius.sm)
                                    }
                                }
                            }
                        }
                    }
                    
                    // Selected days for monthly
                    if editingFrequency == "monthly" {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Vyberte dny v měsíci")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: DesignSystem.Spacing.xs) {
                                ForEach(1...31, id: \.self) { day in
                                    let dayStr = String(day)
                                    Button(action: {
                                        if editingSelectedDays.contains(dayStr) {
                                            editingSelectedDays.removeAll { $0 == dayStr }
                                        } else {
                                            editingSelectedDays.append(dayStr)
                                        }
                                    }) {
                                        Text(dayStr)
                                            .font(DesignSystem.Typography.caption2)
                                            .foregroundColor(editingSelectedDays.contains(dayStr) ? .white : DesignSystem.Colors.dynamicPrimary)
                                            .frame(maxWidth: .infinity)
                                            .padding(.vertical, DesignSystem.Spacing.xs)
                                            .background(editingSelectedDays.contains(dayStr) ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.surface)
                                            .overlay(
                                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                            )
                                            .cornerRadius(DesignSystem.CornerRadius.sm)
                                    }
                                }
                            }
                        }
                    }
                    
                    // Recurring start date
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Začátek opakování")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        DatePicker("", selection: Binding(
                            get: { editingRecurringStartDate ?? Date() },
                            set: { editingRecurringStartDate = $0 }
                        ), displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .tint(DesignSystem.Colors.dynamicPrimary)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                    }
                    
                    // Recurring end date
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Konec opakování")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        if let endDate = editingRecurringEndDate {
                            HStack {
                                DatePicker("", selection: Binding(
                                    get: { endDate },
                                    set: { editingRecurringEndDate = $0 }
                                ), displayedComponents: .date)
                                .datePickerStyle(.compact)
                                .tint(DesignSystem.Colors.dynamicPrimary)
                                
                                Button(action: {
                                    editingRecurringEndDate = nil
                                }) {
                                    Text("Nikdy")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                }
                            }
                            .padding(DesignSystem.Spacing.sm)
                            .background(DesignSystem.Colors.surface)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                            .cornerRadius(DesignSystem.CornerRadius.sm)
                        } else {
                            Button(action: {
                                editingRecurringEndDate = Date()
                            }) {
                                Text("Přidat konec opakování")
                                    .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    .frame(maxWidth: .infinity)
                                    .padding(DesignSystem.Spacing.sm)
                                    .background(DesignSystem.Colors.surface)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                    )
                                    .cornerRadius(DesignSystem.CornerRadius.sm)
                            }
                        }
                    }
                }
                            
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Deadline (volitelné)")
                                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    if let deadline = editingDeadline {
                        DatePicker("", selection: Binding(
                            get: { deadline },
                            set: { editingDeadline = $0 }
                        ), displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .tint(DesignSystem.Colors.dynamicPrimary)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                    } else {
                        Button(action: {
                            editingDeadline = Date()
                        }) {
                            Text("Přidat deadline")
                                            .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                .frame(maxWidth: .infinity)
                                .padding(DesignSystem.Spacing.sm)
                                .background(DesignSystem.Colors.surface)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                )
                                .cornerRadius(DesignSystem.CornerRadius.sm)
                                    }
                                }
                }
                
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Odhadovaný čas (minuty)")
                                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    TextField("0", value: $editingEstimatedTime, format: .number)
                        .keyboardType(.numberPad)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .padding(DesignSystem.Spacing.sm)
                        .background(DesignSystem.Colors.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                }
            }
        }
        .padding(DesignSystem.Spacing.md)
        .background(DesignSystem.Colors.surface)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
        )
        .cornerRadius(DesignSystem.CornerRadius.md)
        .shadow(color: Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
            default:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(1.0))
            }
        }), radius: 0, x: 3, y: 3)
    }
    
    private var priorityAndStatusCard: some View {
        Group {
            if !isCreating {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                    Text("Důležitost a stav")
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Toggle("Důležitý", isOn: $editingIsImportant)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                        
                        Toggle("Naléhavý", isOn: $editingIsUrgent)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .tint(DesignSystem.Colors.dynamicPrimary)
                        
                        Divider()
                            .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
                        
                        HStack {
                            Text("Dokončeno")
                                .font(DesignSystem.Typography.body)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            Spacer()
                            
                            Button(action: {
                                toggleCompletion()
                            }) {
                                Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 24))
                                    .foregroundColor(isCompleted ? DesignSystem.Colors.success : DesignSystem.Colors.dynamicPrimary)
                            }
                        }
                    }
                }
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
                .shadow(color: Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
            default:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(1.0))
                                    }
        }), radius: 0, x: 3, y: 3)
                            }
                        }
    }
    
    private var actionButtons: some View {
        HStack(spacing: DesignSystem.Spacing.md) {
            // Delete button (only for existing steps)
            if !isCreating {
                Button(action: {
                    showDeleteConfirmation = true
                }) {
                    HStack {
                        Image(systemName: "trash")
                        Text("Smazat")
                    }
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                        .padding(DesignSystem.Spacing.md)
                    .background(DesignSystem.Colors.redFull)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.redFull, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.md)
                }
                .buttonStyle(PlainButtonStyle())
                .disabled(isDeleting)
            }
            
            // Save button
            Button(action: {
                saveStep()
            }) {
                HStack {
                    if isSaving {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: isCreating ? "plus" : "checkmark")
                        Text(isCreating ? "Vytvořit" : "Uložit")
                    }
                }
                .font(DesignSystem.Typography.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(DesignSystem.Spacing.md)
                .background(DesignSystem.Colors.dynamicPrimary)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
            }
            .buttonStyle(PlainButtonStyle())
            .disabled(isSaving || editingTitle.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .shadow(color: Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
            default:
                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(1.0))
            }
        }), radius: 0, x: 3, y: 3)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    basicInformationCard
                    dateAndTimeCard
                    priorityAndStatusCard
                    actionButtons
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle(isCreating ? "Nový krok" : "Detail kroku")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    // Duplicate button (only for existing steps)
                    if !isCreating {
                        Button(action: {
                            duplicateStep()
                        }) {
                            Image(systemName: "doc.on.doc")
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        }
                    }
                    
                    Button("Hotovo") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showDuplicatedStep) {
            if let duplicatedStep = duplicatedStep {
                NavigationView {
                    StepDetailView(
                        step: duplicatedStep,
                        onStepAdded: {
                            onStepAdded?()
                            showDuplicatedStep = false
                        }
                    )
                }
            }
        }
        .onAppear {
            loadData()
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .alert("Smazat krok", isPresented: $showDeleteConfirmation) {
            Button("Zrušit", role: .cancel) { }
            Button("Smazat", role: .destructive) {
                deleteStep()
            }
        } message: {
            Text("Opravdu chcete smazat tento krok? Tato akce je nevratná.")
        }
    }
    
    private func loadData() {
        Task {
            do {
                async let goalsTask = apiManager.fetchGoals()
                async let aspirationsTask = apiManager.fetchAspirations()
                
                let (fetchedGoals, fetchedAspirations) = try await (goalsTask, aspirationsTask)
                
                await MainActor.run {
                    self.goals = fetchedGoals
                    self.aspirations = fetchedAspirations
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func toggleCompletion() {
        guard let step = step else { return }
        
        Task {
            do {
                let updatedStep = try await apiManager.updateStepCompletion(
                    stepId: step.id,
                    completed: !isCompleted,
                    currentStep: step
                )
                
                await MainActor.run {
                    isCompleted = updatedStep.completed
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func saveStep() {
        guard !editingTitle.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Název kroku je povinný"
            showError = true
            return
        }
        
        isSaving = true
        
        Task {
            do {
                if isCreating {
                    // Create new step
                    let createRequest = CreateStepRequest(
                        title: editingTitle,
                        description: editingDescription.isEmpty ? nil : editingDescription,
                        date: editingIsRepeating ? nil : editingDate,
                        goalId: editingGoalId,
                        areaId: editingAreaId,
                        isRepeating: editingIsRepeating ? true : nil,
                        frequency: editingIsRepeating ? editingFrequency : nil,
                        selectedDays: editingIsRepeating && !editingSelectedDays.isEmpty ? editingSelectedDays : nil,
                        recurringStartDate: editingIsRepeating ? editingRecurringStartDate : nil,
                        recurringEndDate: editingIsRepeating ? editingRecurringEndDate : nil,
                        recurringDisplayMode: editingIsRepeating ? editingRecurringDisplayMode : nil
                    )
                    let createdStep = try await apiManager.createStep(createRequest)
                    
                    // Update the created step with additional fields if needed
                    if editingIsImportant || editingDeadline != nil || editingEstimatedTime > 0 {
                        _ = try await apiManager.updateStep(
                            stepId: createdStep.id,
                            title: nil,
                            description: nil,
                            date: nil,
                            goalId: nil,
                            areaId: nil,
                            isImportant: editingIsImportant ? true : nil,
                            isUrgent: nil,
                            deadline: editingDeadline,
                            estimatedTime: editingEstimatedTime > 0 ? editingEstimatedTime : nil
                        )
                    }
                } else if let step = step {
                    // Update existing step
                    _ = try await apiManager.updateStep(
                        stepId: step.id,
                        title: editingTitle,
                        description: editingDescription.isEmpty ? nil : editingDescription,
                        date: editingDate,
                        goalId: editingGoalId,
                        areaId: editingAreaId,
                        isImportant: editingIsImportant,
                        isUrgent: editingIsUrgent,
                        deadline: editingDeadline,
                        estimatedTime: editingEstimatedTime > 0 ? editingEstimatedTime : nil
                    )
                }
                
                await MainActor.run {
                    isSaving = false
                    onStepAdded?()
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func duplicateStep() {
        guard let step = step else { return }
        
        // Create duplicated step with all properties copied
        // Use empty id to indicate this is a new step (not an existing one)
        let duplicatedStep = DailyStep(
            id: "", // Empty ID indicates new step
            title: "\(step.title) - duplicate",
            description: step.description,
            date: step.date ?? Date(), // Use current date if no date set
            completed: false, // Reset completion status
            goalId: step.goalId,
            isImportant: step.isImportant,
            isUrgent: step.isUrgent,
            areaId: step.areaId,
            aspirationId: step.aspirationId,
            estimatedTime: step.estimatedTime,
            xpReward: step.xpReward,
            deadline: step.deadline,
            completedAt: nil, // Reset completion date
            checklist: step.checklist, // Copy checklist
            requireChecklistComplete: step.requireChecklistComplete,
            frequency: nil, // Reset recurring properties - don't duplicate as recurring step
            selectedDays: nil,
            lastInstanceDate: nil,
            lastCompletedInstanceDate: nil,
            recurringStartDate: nil,
            recurringEndDate: nil,
            recurringDisplayMode: nil,
            isHidden: step.isHidden,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        self.duplicatedStep = duplicatedStep
        showDuplicatedStep = true
    }
    
    private func deleteStep() {
        guard let step = step else { return }
        
        isDeleting = true
        
        Task {
            do {
                try await apiManager.deleteStep(stepId: step.id)
                
                await MainActor.run {
                    isDeleting = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isDeleting = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

#Preview("Edit") {
    StepDetailView(
        step: DailyStep(
            id: "1",
            title: "Příklad kroku",
            description: "Toto je popis příkladového kroku",
            date: Date(),
            completed: false,
            goalId: "goal1",
            isImportant: nil,
            isUrgent: nil,
            areaId: nil,
            aspirationId: nil,
            estimatedTime: nil,
            xpReward: nil,
            deadline: nil,
            completedAt: nil,
            checklist: nil,
            requireChecklistComplete: nil,
            frequency: nil,
            selectedDays: nil,
            lastInstanceDate: nil,
            lastCompletedInstanceDate: nil,
            recurringStartDate: nil,
            recurringEndDate: nil,
            recurringDisplayMode: nil,
            isHidden: nil,
            createdAt: Date(),
            updatedAt: Date()
        ),
        goalTitle: "Příklad cíle"
    )
}

#Preview("Create") {
    StepDetailView(initialDate: Date())
}
