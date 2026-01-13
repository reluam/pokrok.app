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
    @State private var metrics: [GoalMetric] = []
    @State private var isLoading = true
    @State private var isSaving = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var deleteWithSteps = false
    @State private var selectedContentTab: ContentTab = .steps
    @State private var showSettings = false
    @State private var metricEditMode: MetricEditMode?
    
    enum MetricEditMode: Identifiable {
        case full(GoalMetric)
        
        var id: String {
            switch self {
            case .full(let metric): return "full-\(metric.id)"
            }
        }
    }
    
    enum ContentTab: String, CaseIterable {
        case steps = "Kroky"
        case metrics = "Metriky"
    }
    
    private var isCreating: Bool {
        goal == nil
    }
    
    private var navigationTitle: String {
        if isCreating {
            return "Nový cíl"
        } else if let goal = goal {
            return goal.title
        } else {
            return "Detail cíle"
        }
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
                    if isCreating {
                        settingsContent
                    } else if let goal = goal {
                        // Progress bar with percentage
                        HStack(spacing: DesignSystem.Spacing.md) {
                            PlayfulProgressBar(
                                progress: Double(goal.progressPercentage) / 100,
                                height: 16,
                                variant: .yellowGreen
                            )
                            
                            Text("\(goal.progressPercentage)%")
                                .font(DesignSystem.Typography.title3)
                                .fontWeight(.bold)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        }
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        .padding(.top, DesignSystem.Spacing.md)
                        
                        // Custom Tab Picker for Steps/Metrics with counts
                        HStack(spacing: 0) {
                            // Steps Tab
                            Button(action: {
                                selectedContentTab = .steps
                            }) {
                                VStack(spacing: DesignSystem.Spacing.xs) {
                                    HStack(spacing: DesignSystem.Spacing.xs) {
                                        Text("Kroky")
                                            .font(DesignSystem.Typography.headline)
                                            .fontWeight(.semibold)
                                        
                                        // Count of incomplete steps
                                        let incompleteCount = steps.filter { !$0.completed }.count
                                        if incompleteCount > 0 {
                                            Text("(\(incompleteCount))")
                                                .font(DesignSystem.Typography.caption)
                                                .fontWeight(.medium)
                                        }
                                    }
                                }
                                .foregroundColor(selectedContentTab == .steps ? .white : DesignSystem.Colors.textSecondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, DesignSystem.Spacing.sm)
                                .background(
                                    selectedContentTab == .steps ? DesignSystem.Colors.dynamicPrimary : Color.clear
                                )
                            }
                            
                            // Metrics Tab
                            Button(action: {
                                selectedContentTab = .metrics
                            }) {
                                VStack(spacing: DesignSystem.Spacing.xs) {
                                    HStack(spacing: DesignSystem.Spacing.xs) {
                                        Text("Metriky")
                                            .font(DesignSystem.Typography.headline)
                                            .fontWeight(.semibold)
                                        
                                        // Count of metrics
                                        if metrics.count > 0 {
                                            Text("(\(metrics.count))")
                                                .font(DesignSystem.Typography.caption)
                                                .fontWeight(.medium)
                                        }
                                    }
                                }
                                .foregroundColor(selectedContentTab == .metrics ? .white : DesignSystem.Colors.textSecondary)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, DesignSystem.Spacing.sm)
                                .background(
                                    selectedContentTab == .metrics ? DesignSystem.Colors.dynamicPrimary : Color.clear
                                )
                            }
                        }
                        .background(DesignSystem.Colors.surface)
                        .cornerRadius(DesignSystem.CornerRadius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                        )
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        
                        // Content based on selected tab
                        if selectedContentTab == .steps {
                            stepsContent
                        } else {
                            metricsContent
                        }
                    }
                }
                .padding(.vertical, DesignSystem.Spacing.md)
                .padding(.bottom, 100) // Padding for tab bar
            }
            .background(DesignSystem.Colors.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                // Title in the center
                ToolbarItem(placement: .principal) {
                    Text(navigationTitle)
                        .font(DesignSystem.Typography.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                // Settings or Create button on the right
                if !isCreating {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: {
                            showSettings = true
                        }) {
                            Image(systemName: "gearshape.fill")
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        }
                    }
                } else {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Vytvořit") {
                            saveGoal()
                        }
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        .disabled(isSaving || editingTitle.isEmpty)
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                NavigationView {
                    settingsContent
                        .navigationTitle("Nastavení cíle")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .navigationBarTrailing) {
                                Button("Hotovo") {
                                    showSettings = false
                                }
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            }
                        }
                        .onChange(of: editingTitle) { _, _ in
                            autoSave()
                        }
                        .onChange(of: editingDescription) { _, _ in
                            autoSave()
                        }
                        .onChange(of: editingTargetDate) { _, _ in
                            autoSave()
                        }
                        .onChange(of: editingAreaId) { _, _ in
                            autoSave()
                        }
                        .onChange(of: editingIcon) { _, _ in
                            autoSave()
                        }
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .confirmationDialog("Smazat cíl", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
                Button("Odpojit kroky", role: .destructive) {
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
            .sheet(item: $metricEditMode) { mode in
                NavigationView {
                    switch mode {
                    case .full(let metric):
                        MetricEditView(metric: metric, onMetricUpdated: {
                            loadData()
                        })
                    }
                }
            }
            .onAppear {
                loadData()
            }
        }
    }
    
    // MARK: - Steps Content
    private var stepsContent: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if sortedSteps.isEmpty {
                Text("Žádné kroky")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(DesignSystem.Spacing.md)
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(sortedSteps, id: \.id) { step in
                        StepCardView(step: step) {
                            toggleStepCompletion(stepId: step.id, completed: !step.completed)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, DesignSystem.Spacing.md)
    }
    
    // MARK: - Metrics Content
    private var metricsContent: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if metrics.isEmpty {
                Text("Žádné metriky")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(DesignSystem.Spacing.md)
            } else {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                    ForEach(metrics, id: \.id) { metric in
                        MetricCard(
                            metric: metric,
                            onTap: {
                                metricEditMode = .full(metric)
                            },
                            onValueChanged: { newValue in
                                updateMetricValue(metricId: metric.id, goalId: metric.goalId, newValue: newValue)
                            }
                        )
                    }
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
            }
        }
        .padding(.horizontal, DesignSystem.Spacing.md)
    }
    
    // MARK: - Sorted Steps (incomplete first, then completed, both sorted by date ascending)
    private var sortedSteps: [DailyStep] {
        let incomplete = steps.filter { !$0.completed }
            .sorted { step1, step2 in
                let date1 = step1.date ?? Date.distantPast
                let date2 = step2.date ?? Date.distantPast
                return date1 < date2
            }
        
        let completed = steps.filter { $0.completed }
            .sorted { step1, step2 in
                let date1 = step1.date ?? Date.distantPast
                let date2 = step2.date ?? Date.distantPast
                return date1 < date2
            }
        
        return incomplete + completed
    }
    
    // MARK: - Step Card View Helper
    private struct StepCardView: View {
        let step: DailyStep
        let onToggle: () -> Void
        
        private var isOverdue: Bool {
            guard !step.completed, let stepDate = step.date else { return false }
            let calendar = Calendar.current
            let today = calendar.startOfDay(for: Date())
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return stepStartOfDay < today
        }
        
        private var isFuture: Bool {
            guard let stepDate = step.date else { return false }
            let calendar = Calendar.current
            let today = calendar.startOfDay(for: Date())
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return stepStartOfDay > today
        }
        
        var body: some View {
            PlayfulStepCard(
                step: step,
                goalTitle: nil,
                goal: nil, // No goal icon in goal detail
                aspiration: nil, // No aspiration icon in goal detail
                isOverdue: isOverdue,
                isFuture: isFuture,
                onToggle: onToggle
            )
        }
    }
    
    // MARK: - Settings Content (Editing fields)
    private var settingsContent: some View {
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
                                        .background(DesignSystem.Colors.surface)
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
                                                .background(DesignSystem.Colors.surface)
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
                                        .background(DesignSystem.Colors.surface)
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
                    
                    // Icon Picker
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Ikona")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        
                        IconPickerView(selectedIcon: Binding(
                            get: { editingIcon },
                            set: { editingIcon = $0 }
                        ))
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
                    
                    // Action buttons (only for existing goals)
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
                        .shadow(color: Color(UIColor { traitCollection in
                            switch traitCollection.userInterfaceStyle {
                            case .dark:
                                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(0.2))
                            default:
                                return UIColor(DesignSystem.Colors.dynamicPrimary.opacity(1.0))
                            }
                        }), radius: 0, x: 3, y: 3)
                    }
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
    }
    
    private func loadData() {
        Task {
            do {
                async let aspirationsTask = apiManager.fetchAspirations()
                
                if let goal = goal {
                    async let stepsTask = apiManager.fetchSteps()
                    async let metricsTask = apiManager.fetchGoalMetrics(goalId: goal.id)
                    
                    // Load aspirations first
                    let fetchedAspirations = try await aspirationsTask
                    
                    // Try to load steps and metrics, but don't fail if metrics fail
                    var allSteps: [DailyStep] = []
                    var fetchedMetrics: [GoalMetric] = []
                    
                    do {
                        allSteps = try await stepsTask
                    } catch {
                        print("Error loading steps: \(error)")
                    }
                    
                    do {
                        fetchedMetrics = try await metricsTask
                    } catch {
                        print("Error loading metrics: \(error)")
                        // Metrics are optional, continue without them
                    }
                    
                    await MainActor.run {
                        self.aspirations = fetchedAspirations
                        
                        // Filter steps for this goal (include all steps, even without date)
                        self.steps = allSteps.filter { $0.goalId == goal.id }
                            .sorted { step1, step2 in
                                // Sort by date if available, otherwise put at end
                                let date1 = step1.date ?? Date.distantFuture
                                let date2 = step2.date ?? Date.distantFuture
                                if date1 == date2 {
                                    // If same date, incomplete first
                                    if step1.completed == step2.completed {
                                        return step1.id < step2.id
                                    }
                                    return !step1.completed && step2.completed
                                }
                                return date1 < date2
                            }
                        
                        self.metrics = fetchedMetrics
                        self.isLoading = false
                        
                        print("✅ Loaded \(self.steps.count) steps and \(self.metrics.count) metrics for goal \(goal.id)")
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
                    self.errorMessage = "Chyba při načítání dat: \(error.localizedDescription)"
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
    
    // Auto-save function for settings
    private func autoSave() {
        guard !isCreating, let goal = goal else { return }
        guard !editingTitle.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        // Debounce auto-save to avoid too many API calls
        Task {
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
            
            do {
                _ = try await apiManager.updateGoal(
                    goalId: goal.id,
                    title: editingTitle,
                    description: editingDescription.isEmpty ? nil : editingDescription,
                    targetDate: editingTargetDate,
                    aspirationId: editingAreaId
                )
                
                await MainActor.run {
                    onGoalAdded?()
                }
            } catch {
                // Silently fail for auto-save
                print("Auto-save failed: \(error)")
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
                    
                    await MainActor.run {
                        isSaving = false
                        onGoalAdded?()
                        dismiss()
                    }
                } else if let goal = goal {
                    // Update existing goal
                    _ = try await apiManager.updateGoal(
                        goalId: goal.id,
                        title: editingTitle,
                        description: editingDescription.isEmpty ? nil : editingDescription,
                        targetDate: editingTargetDate,
                        aspirationId: editingAreaId
                    )
                    
                    await MainActor.run {
                        isSaving = false
                        onGoalAdded?()
                        if !showSettings {
                            dismiss()
                        }
                    }
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
    
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                // Find the step to update
                guard let stepIndex = steps.firstIndex(where: { $0.id == stepId }) else { return }
                let step = steps[stepIndex]
                
                // Update via API using updateStepCompletion
                let updatedStep = try await apiManager.updateStepCompletion(
                    stepId: stepId,
                    completed: completed,
                    currentStep: step
                )
                
                // Update local state
                await MainActor.run {
                    steps[stepIndex] = updatedStep
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func updateMetricValue(metricId: String, goalId: String, newValue: Decimal) {
        Task {
            do {
                _ = try await apiManager.updateGoalMetric(
                    metricId: metricId,
                    goalId: goalId,
                    currentValue: newValue
                )
                
                // Reload data to get updated metric
                await MainActor.run {
                    loadData()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Metric Card Component
struct MetricCard: View {
    let metric: GoalMetric
    let onTap: () -> Void
    let onValueChanged: (Decimal) -> Void
    
    @State private var editingValue: String
    @FocusState private var isEditing: Bool
    @StateObject private var apiManager = APIManager.shared
    
    private var progress: Double {
        let current = NSDecimalNumber(decimal: metric.currentValue).doubleValue
        let target = NSDecimalNumber(decimal: metric.targetValue).doubleValue
        let initial = NSDecimalNumber(decimal: metric.initialValue ?? 0).doubleValue
        
        let range = target - initial
        if range == 0 {
            return current >= target ? 1.0 : 0.0
        } else if range > 0 {
            // Increasing metric
            return min(max((current - initial) / range, 0.0), 1.0)
        } else {
            // Decreasing metric
            return min(max((initial - current) / abs(range), 0.0), 1.0)
        }
    }
    
    private var isCompleted: Bool {
        let current = NSDecimalNumber(decimal: metric.currentValue).doubleValue
        let target = NSDecimalNumber(decimal: metric.targetValue).doubleValue
        let initial = NSDecimalNumber(decimal: metric.initialValue ?? 0).doubleValue
        
        if initial > target {
            // Decreasing metric
            return current <= target
        } else {
            // Increasing metric
            return current >= target
        }
    }
    
    private func formatValue(_ value: Decimal) -> String {
        let number = NSDecimalNumber(decimal: value)
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 1
        formatter.minimumFractionDigits = 0
        return formatter.string(from: number) ?? "0"
    }
    
    private func parseDecimal(_ string: String) -> Decimal? {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        if let number = formatter.number(from: string) {
            return number.decimalValue
        }
        return nil
    }
    
    init(metric: GoalMetric, onTap: @escaping () -> Void, onValueChanged: @escaping (Decimal) -> Void) {
        self.metric = metric
        self.onTap = onTap
        self.onValueChanged = onValueChanged
        
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 0
        let number = NSDecimalNumber(decimal: metric.currentValue)
        self._editingValue = State(initialValue: formatter.string(from: number) ?? "0")
    }
    
    var body: some View {
        PlayfulCard(
            variant: .pink,
            onTap: nil // Remove onTap from card, handle it separately
        ) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                // Name row - clickable for full edit
                Button(action: onTap) {
                    HStack {
                        Text(metric.name)
                            .font(DesignSystem.Typography.body)
                            .fontWeight(.medium)
                            .foregroundColor(isCompleted ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textPrimary)
                            .strikethrough(isCompleted)
                        
                        Spacer()
                        
                        Text("\(Int(progress * 100))%")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
                .buttonStyle(PlainButtonStyle())
                
                HStack(alignment: .center, spacing: DesignSystem.Spacing.xs) {
                    // Current value - show text or textfield based on editing state
                    if isEditing {
                        HStack(spacing: 4) {
                            TextField("0", text: $editingValue)
                                .font(DesignSystem.Typography.body)
                                .fontWeight(.semibold)
                                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.trailing)
                                .focused($isEditing)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                                .frame(minWidth: 60)
                                .textFieldStyle(.roundedBorder)
                                .overlay(
                                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                                )
                                .onChange(of: isEditing) { _, isFocused in
                                    if !isFocused {
                                        saveValue()
                                    }
                                }
                                .toolbar {
                                    ToolbarItemGroup(placement: .keyboard) {
                                        Spacer()
                                        Button("Hotovo") {
                                            isEditing = false
                                            saveValue()
                                        }
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                        .fontWeight(.semibold)
                                    }
                                }
                            
                            if let unit = metric.unit, !unit.isEmpty {
                                Text(unit)
                                    .font(DesignSystem.Typography.body)
                                    .fontWeight(.semibold)
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            }
                        }
                    } else {
                        Button(action: {
                            isEditing = true
                        }) {
                            HStack(spacing: 4) {
                                Text("\(formatValue(metric.currentValue))")
                                    .font(DesignSystem.Typography.body)
                                    .fontWeight(.semibold)
                                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                
                                if let unit = metric.unit, !unit.isEmpty {
                                    Text(unit)
                                        .font(DesignSystem.Typography.body)
                                        .fontWeight(.semibold)
                                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                                }
                            }
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                    
                    Text("/")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    Text("\(formatValue(metric.targetValue))\(metric.unit.map { " \($0)" } ?? "")")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                PlayfulProgressBar(
                    progress: progress,
                    height: 8,
                    variant: .pink
                )
            }
        }
        .onChange(of: metric.currentValue) { _, newValue in
            // Update editing value when metric changes externally
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 0
            let number = NSDecimalNumber(decimal: newValue)
            editingValue = formatter.string(from: number) ?? "0"
        }
    }
    
    private func saveValue() {
        guard let newValue = parseDecimal(editingValue) else {
            // Reset to original value if invalid
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.maximumFractionDigits = 2
            formatter.minimumFractionDigits = 0
            let number = NSDecimalNumber(decimal: metric.currentValue)
            editingValue = formatter.string(from: number) ?? "0"
            return
        }
        
        // Only save if value actually changed
        if newValue != metric.currentValue {
            onValueChanged(newValue)
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
