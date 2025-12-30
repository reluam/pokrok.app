import SwiftUI

struct GoalDetailView: View {
    let goal: Goal?
    let onGoalAdded: (() -> Void)?
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    
    // Editing states
    @State private var editingTitle: String
    @State private var editingDescription: String
    @State private var editingTargetDate: Date?
    @State private var editingStartDate: Date?
    @State private var editingStatus: String
    @State private var editingAreaId: String?
    @State private var editingIcon: String?
    
    @State private var aspirations: [Aspiration] = []
    @State private var steps: [DailyStep] = []
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var deleteWithSteps = false
    
    private var isCreating: Bool {
        goal == nil
    }
    
    init(goal: Goal? = nil, onGoalAdded: (() -> Void)? = nil) {
        self.goal = goal
        self.onGoalAdded = onGoalAdded
        
        if let goal = goal {
            self._editingTitle = State(initialValue: goal.title)
            self._editingDescription = State(initialValue: goal.description ?? "")
            self._editingTargetDate = State(initialValue: goal.targetDate)
            self._editingStartDate = State(initialValue: nil)
            self._editingStatus = State(initialValue: goal.status)
            self._editingAreaId = State(initialValue: goal.aspirationId)
            self._editingIcon = State(initialValue: goal.icon)
        } else {
            self._editingTitle = State(initialValue: "")
            self._editingDescription = State(initialValue: "")
            self._editingTargetDate = State(initialValue: nil)
            self._editingStartDate = State(initialValue: nil)
            self._editingStatus = State(initialValue: "active")
            self._editingAreaId = State(initialValue: nil)
            self._editingIcon = State(initialValue: nil)
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.lg) {
                    // Basic Information Card
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Název")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            TextField("Název cíle", text: $editingTitle)
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
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .cornerRadius(DesignSystem.CornerRadius.md)
                    .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
                    
                    // Date and Status Card
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Datum a stav")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                            // Status
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                Text("Stav")
                                    .font(DesignSystem.Typography.caption)
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                
                                Picker("Stav", selection: $editingStatus) {
                                    Text("Aktivní").tag("active")
                                    Text("Dokončeno").tag("completed")
                                    Text("Pozastaveno").tag("paused")
                                }
                                .pickerStyle(.segmented)
                                .tint(DesignSystem.Colors.dynamicPrimary)
                            }
                            
                            // Dates
                            HStack(spacing: DesignSystem.Spacing.md) {
                                // Start Date
                                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                    Text("Datum startu")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    
                                    if let startDate = editingStartDate {
                                        DatePicker("", selection: Binding(
                                            get: { startDate },
                                            set: { editingStartDate = $0 }
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
                                            editingStartDate = Date()
                                        }) {
                                            Text("Přidat datum startu")
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
                                
                                // Target Date
                                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                                    Text("Cílové datum")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    
                                    if let targetDate = editingTargetDate {
                                        DatePicker("", selection: Binding(
                                            get: { targetDate },
                                            set: { editingTargetDate = $0 }
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
                                            editingTargetDate = Date()
                                        }) {
                                            Text("Přidat cílové datum")
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
                    
                    // Progress Card (only for existing goals)
                    if let goal = goal {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                            Text("Pokrok")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                                HStack {
                                    Text("Pokrok")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                    
                                    Spacer()
                                    
                                    Text("\(goal.progressPercentage)%")
                                        .font(DesignSystem.Typography.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                }
                                
                                PlayfulProgressBar(
                                    progress: Double(goal.progressPercentage) / 100,
                                    height: 12,
                                    variant: .yellowGreen
                                )
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
                    
                    // Steps Section (only for existing goals)
                    if let goal = goal, !steps.isEmpty {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                            Text("Kroky k cíli")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            
                            LazyVStack(spacing: DesignSystem.Spacing.sm) {
                                ForEach(steps.prefix(10), id: \.id) { step in
                                    HStack {
                                        Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                                            .font(.system(size: 16))
                                            .foregroundColor(step.completed ? DesignSystem.Colors.success : DesignSystem.Colors.dynamicPrimary)
                                        
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(step.title)
                                                .font(DesignSystem.Typography.caption)
                                                .foregroundColor(step.completed ? DesignSystem.Colors.textTertiary : DesignSystem.Colors.textPrimary)
                                                .strikethrough(step.completed)
                                            
                                            Text(step.date, style: .date)
                                                .font(DesignSystem.Typography.caption2)
                                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                        }
                                        
                                        Spacer()
                                    }
                                    .padding(.vertical, DesignSystem.Spacing.xs)
                                }
                                
                                if steps.count > 10 {
                                    Text("... a \(steps.count - 10) dalších kroků")
                                        .font(DesignSystem.Typography.caption)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                        .padding(.top, DesignSystem.Spacing.xs)
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
                    
                    // Action buttons
                    HStack(spacing: DesignSystem.Spacing.md) {
                        // Delete button (only for existing goals)
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
                            saveGoal()
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
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle(isCreating ? "Nový cíl" : "Detail cíle")
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
        .alert("Smazat cíl", isPresented: $showDeleteConfirmation) {
            Button("Zrušit", role: .cancel) { }
            Button("Smazat bez kroků", role: .destructive) {
                deleteWithSteps = false
                deleteGoal()
            }
            Button("Smazat včetně kroků", role: .destructive) {
                deleteWithSteps = true
                deleteGoal()
            }
        } message: {
            Text("Opravdu chcete smazat tento cíl? Můžete zvolit, zda smazat i všechny kroky k tomuto cíli.")
        }
    }
    
    private func loadData() {
        Task {
            do {
                async let aspirationsTask = apiManager.fetchAspirations()
                
                if let goal = goal {
                    async let stepsTask = apiManager.fetchSteps()
                    let (fetchedAspirations, allSteps) = try await (aspirationsTask, stepsTask)
                    
                    await MainActor.run {
                        self.aspirations = fetchedAspirations
                        self.steps = allSteps.filter { $0.goalId == goal.id }.sorted { $0.date < $1.date }
                        self.isLoading = false
                    }
                } else {
                    let fetchedAspirations = try await aspirationsTask
                    
                    await MainActor.run {
                        self.aspirations = fetchedAspirations
                        self.isLoading = false
                    }
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
    
    private func saveGoal() {
        guard !editingTitle.trimmingCharacters(in: .whitespaces).isEmpty else {
            errorMessage = "Název cíle je povinný"
            showError = true
            return
        }
        
        isSaving = true
        
        Task {
            do {
                if isCreating {
                    // Create new goal
                    let createRequest = CreateGoalRequest(
                        title: editingTitle,
                        description: editingDescription.isEmpty ? nil : editingDescription,
                        targetDate: editingTargetDate,
                        priority: "meaningful",
                        icon: editingIcon,
                        aspirationId: editingAreaId
                    )
                    _ = try await apiManager.createGoal(createRequest)
                } else if let goal = goal {
                    // Update existing goal
                    _ = try await apiManager.updateGoal(
                        goalId: goal.id,
                        title: editingTitle,
                        description: editingDescription.isEmpty ? nil : editingDescription,
                        targetDate: editingTargetDate,
                        aspirationId: editingAreaId
                    )
                }
                
                await MainActor.run {
                    isSaving = false
                    onGoalAdded?()
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
    
    private func deleteGoal() {
        guard let goal = goal else { return }
        
        isDeleting = true
        
        Task {
            do {
                try await apiManager.deleteGoal(goalId: goal.id, deleteSteps: deleteWithSteps)
                
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

#Preview {
    GoalDetailView(
        goal: Goal(
            id: "1",
            title: "Příklad cíle",
            description: "Toto je popis příkladového cíle",
            targetDate: Calendar.current.date(byAdding: .day, value: 30, to: Date()),
            priority: "medium_term",
            status: "active",
            progressPercentage: 75,
            icon: nil,
            aspirationId: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    )
}
