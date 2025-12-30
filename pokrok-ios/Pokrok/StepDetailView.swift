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
    
    @State private var goals: [Goal] = []
    @State private var aspirations: [Aspiration] = []
    @State private var isCompleted: Bool
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    
    private var isCreating: Bool {
        step == nil
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
            self._editingDate = State(initialValue: step.date)
            self._editingGoalId = State(initialValue: step.goalId)
            self._editingIsImportant = State(initialValue: step.isImportant ?? false)
            self._editingIsUrgent = State(initialValue: false)
            self._editingDeadline = State(initialValue: nil)
            self._editingEstimatedTime = State(initialValue: 0)
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
                    .background(Color.white)
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
                    .background(Color.white)
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
                    .background(Color.white)
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
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.sm)
                }
            }
        }
        .padding(DesignSystem.Spacing.md)
        .background(Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
        )
        .cornerRadius(DesignSystem.CornerRadius.md)
        .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
    }
    
    private var dateAndTimeCard: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Datum a čas")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Datum")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    
                    DatePicker("Datum", selection: $editingDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .tint(DesignSystem.Colors.dynamicPrimary)
                        .padding(DesignSystem.Spacing.sm)
                        .background(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .cornerRadius(DesignSystem.CornerRadius.sm)
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
                        .background(Color.white)
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
                                .background(Color.white)
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
                        .background(Color.white)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .cornerRadius(DesignSystem.CornerRadius.sm)
                }
            }
        }
        .padding(DesignSystem.Spacing.md)
        .background(Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
        )
        .cornerRadius(DesignSystem.CornerRadius.md)
        .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
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
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
                .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
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
        .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
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
                Button("Hotovo") {
                    dismiss()
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
                        date: editingDate,
                        goalId: editingGoalId
                    )
                    let createdStep = try await apiManager.createStep(createRequest)
                    
                    // Update the created step with additional fields if needed
                    if editingIsImportant || editingAreaId != nil || editingDeadline != nil || editingEstimatedTime > 0 {
                        _ = try await apiManager.updateStep(
                            stepId: createdStep.id,
                            title: nil,
                            description: nil,
                            date: nil,
                            goalId: nil,
                            areaId: editingAreaId,
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
            createdAt: Date(),
            updatedAt: Date()
        ),
        goalTitle: "Příklad cíle"
    )
}

#Preview("Create") {
    StepDetailView(initialDate: Date())
}
