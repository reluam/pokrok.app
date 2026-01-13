import SwiftUI

struct DailyPlanningView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var userSettings: UserSettings?
    @State private var dailySteps: [DailyStep] = []
    @State private var habits: [Habit] = []
    @State private var goals: [Goal] = []
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddStepModal = false
    @State private var selectedStep: DailyStep?
    @State private var isPlanningMode = false
    @State private var tempPlannedSteps: [String] = []
    @State private var isSavingPlan = false
    @State private var currentInspiration = ""
    @State private var dailyPlanning: DailyPlanning?
    @State private var loadingHabits: Set<String> = []
    @State private var selectedDate = Date()
    @State private var showHabitAspirationModal = false
    @State private var selectedHabitForAspiration: Habit? = nil
    
    // Stats
    @State private var stepStats = (completed: 0, total: 0)
    @State private var habitStats = (completed: 0, total: 0)
    
    private let inspirations = [
        "🚶‍♂️ Jdi na procházku a načerpej energii z přírody",
        "🧘‍♀️ Medituj 10 minut a zklidni mysl",
        "☕ Dej si dobrý čaj a odpočiň si",
        "📚 Přečti si kapitolu z oblíbené knihy",
        "🎵 Poslouchej hudbu, která tě inspiruje",
        "✍️ Napiš si deník nebo myšlenky",
        "🌱 Zalij květiny nebo se starej o rostliny",
        "🎨 Nakresli něco nebo se věnuj kreativitě",
        "💆‍♀️ Udělej si masáž nebo relaxační cvičení",
        "🍳 Uvař si něco dobrého a užij si jídlo",
        "📞 Zavolej někomu blízkému",
        "🌟 Poděkuj za dnešní úspěchy"
    ]
    
    // Computed properties
    private var today: Date {
        Calendar.current.startOfDay(for: selectedDate)
    }
    
    private var dayName: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "EEEE"
        return formatter.string(from: selectedDate).capitalized
    }
    
    private var monthName: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "cs_CZ")
        formatter.dateFormat = "MMMM"
        return formatter.string(from: selectedDate)
    }
    
    private var dayNumber: Int {
        Calendar.current.component(.day, from: selectedDate)
    }
    
    private var isToday: Bool {
        Calendar.current.isDate(selectedDate, inSameDayAs: Date())
    }
    
    private var todaySteps: [DailyStep] {
        // Filter steps by selected date to ensure we only show steps for the selected day
        // Normalize both dates to start of day for comparison
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: today)
        
        return dailySteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
    }
    
    private var todaysHabits: [Habit] {
        let weekday = Calendar.current.component(.weekday, from: today)
        // Convert weekday to day names in both formats
        // Calendar.component(.weekday) returns 1=Sunday, 2=Monday, etc.
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        let todayCsName = csDayNames[weekday].lowercased()
        let todayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            // Check if habit is scheduled for today based on frequency and selectedDays
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                // Both weekly and custom use selectedDays
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    // Check both Czech and English day names
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(todayCsName) || normalizedSelectedDays.contains(todayEnName)
                }
                return false
            default:
                return false
            }
        }
    }
    
    // Filter habits for progress calculation - only habits actually scheduled for this day
    private var habitsForProgress: [Habit] {
        let weekday = Calendar.current.component(.weekday, from: today)
        let csDayNames = ["", "neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]
        let enDayNames = ["", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        
        let todayCsName = csDayNames[weekday].lowercased()
        let todayEnName = enDayNames[weekday].lowercased()
        
        return habits.filter { habit in
            // Check if scheduled for selected day
            switch habit.frequency {
            case "daily":
                return true
            case "weekly", "custom":
                if let selectedDays = habit.selectedDays, !selectedDays.isEmpty {
                    let normalizedSelectedDays = selectedDays.map { $0.lowercased() }
                    return normalizedSelectedDays.contains(todayCsName) || normalizedSelectedDays.contains(todayEnName)
                }
                return false
            default:
                return false
            }
        }
    }
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám denní plán...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // "Dnes" button when not viewing today - positioned right after navigation title
                        if !isToday {
                            HStack {
                                Spacer()
                                Button(action: {
                                    selectedDate = Date()
                                    loadData()
                                }) {
                                    Text("Dnes")
                                        .font(DesignSystem.Typography.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(DesignSystem.Colors.primary)
                                }
                                Spacer()
                            }
                            .padding(.top, DesignSystem.Spacing.xs)
                        }
                        
                        // Header Section with Date Navigation and Progress Bar
                        headerSectionWithProgress
                        
                        // Steps Section
                        stepsSection
                        
                        // Habits Section
                        habitsSection
                        
                        // Inspiration Section (when all steps completed)
                        if allTodayStepsCompleted {
                            inspirationSection
                        }
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
                .scrollContentBackground(.hidden)
                .contentMargins(.top, 0, for: .scrollContent)
            }
        }
        .navigationTitle("Přehled")
        .navigationBarTitleDisplayMode(.large)
        .toolbarBackground(.hidden, for: .navigationBar)
        .onAppear {
            loadData()
            setRandomInspiration()
        }
        .onChange(of: selectedDate) {
            loadData()
        }
        .sheet(isPresented: $showAddStepModal) {
            NavigationView {
                StepDetailView(initialDate: selectedDate, onStepAdded: {
                loadData()
            })
            }
        }
        .sheet(isPresented: $showHabitAspirationModal) {
            if let habit = selectedHabitForAspiration {
                HabitAspirationEditorView(habit: habit, onAspirationUpdated: {
                    loadData()
                })
            }
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Header Section with Progress
    private var headerSectionWithProgress: some View {
        PlayfulCard(variant: isToday ? .pink : .purple) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                // Date row with navigation arrows
                HStack(alignment: .center, spacing: DesignSystem.Spacing.sm) {
                // Left arrow button
                Button(action: {
                    changeDate(by: -1)
                }) {
                    Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                            .frame(width: 24, height: 24)
                }
                
                // Date and day info
                    HStack(alignment: .bottom, spacing: DesignSystem.Spacing.xs) {
                        Text("\(dayNumber)")
                            .font(DesignSystem.Typography.title1)
                            .fontWeight(.bold)
                            .foregroundColor(isToday ? DesignSystem.Colors.textPrimary : DesignSystem.Colors.textSecondary)
                        
                        Text(monthName)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                        
                        Text(dayName)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                }
                
                Spacer()
                
                // Right arrow button
                Button(action: {
                    changeDate(by: 1)
                }) {
                    Image(systemName: "chevron.right")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(isToday ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textTertiary)
                            .frame(width: 24, height: 24)
                }
                }
                
                // Counters for steps and habits
                HStack(spacing: DesignSystem.Spacing.lg) {
                    // Steps counter
                    HStack(spacing: DesignSystem.Spacing.xs) {
                        Text("\(stepStats.completed)")
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        Text("z")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        Text("\(stepStats.total)")
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        Text("kroků")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    // Habits counter
                    HStack(spacing: DesignSystem.Spacing.xs) {
                        Text("\(habitStats.completed)")
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.Playful.yellow)
                        Text("z")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        Text("\(habitStats.total)")
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        Text("návyků")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                }
            }
            .padding(DesignSystem.Spacing.sm) // Reduced padding from .md to .sm
        }
    }
    
    private func changeDate(by days: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) {
            selectedDate = newDate
            loadData()
        }
    }
    
    private var totalTasks: Int {
        return stepStats.total + habitStats.total
    }
    
    private var completedTasks: Int {
        return stepStats.completed + habitStats.completed
    }
    
    private var progressPercentageValue: Double {
        guard totalTasks > 0 else { return 0 }
        return min(Double(completedTasks) / Double(totalTasks), 1.0)
    }
    
    private var completionPercentage: Int {
        guard totalTasks > 0 else { return 0 }
        return Int(progressPercentageValue * 100)
    }
    
    // MARK: - Steps Section
    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            // Header with counter
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HStack {
                    Text("Kroky")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Spacer()
                    
                    Text("\(stepStats.completed) z \(stepStats.total)")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
            .padding(.vertical, DesignSystem.Spacing.sm)
            
            Divider()
                .background(DesignSystem.Colors.outline.opacity(0.3))
            
            if todaySteps.isEmpty {
                // Empty state - show "Add new step" button
                Button(action: {
                    showAddStepModal = true
                }) {
                    HStack(spacing: DesignSystem.Spacing.sm) {
                        Image(systemName: "plus.circle")
                            .font(.system(size: 20))
                            .foregroundColor(DesignSystem.Colors.primary)
                        
                        Text("Nový krok")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(DesignSystem.Spacing.md)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .fill(DesignSystem.Colors.surfaceSecondary)
                    )
                }
                .buttonStyle(PlainButtonStyle())
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(Array(todaySteps.filter { $0.date != nil }.enumerated()), id: \.element.id) { index, step in
                        let goal = goals.first { $0.id == step.goalId }
                        let calendar = Calendar.current
                        let today = calendar.startOfDay(for: Date())
                        if let stepDateValue = step.date {
                            let stepDate = calendar.startOfDay(for: stepDateValue)
                        let isOverdue = stepDate < today && !step.completed
                        let isFuture = stepDate > today
                        
                        PlayfulStepCard(
                            step: step,
                            goalTitle: goal?.title,
                            isOverdue: isOverdue,
                            isFuture: isFuture,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Habits Section
    private var habitsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            // Header with counter
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HStack {
                    Text("Návyky")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Spacer()
                    
                    Text("\(habitStats.completed) z \(habitStats.total)")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.Playful.yellow)
                }
            }
            .padding(.vertical, DesignSystem.Spacing.sm)
            
            Divider()
                .background(DesignSystem.Colors.outline.opacity(0.3))
            
            if todaysHabits.isEmpty {
                Text("Žádné návyky na dnes")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(DesignSystem.Spacing.md)
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(todaysHabits, id: \.id) { habit in
                        PlayfulHabitCard(
                            habit: habit,
                            isCompleted: isHabitCompleted(habit),
                            onToggle: {
                                if !loadingHabits.contains(habit.id) {
                                toggleHabitCompletion(habit: habit)
                                }
                            }
                        )
                        .onLongPressGesture {
                            showHabitAspirationEditor(habit: habit)
                        }
                        .disabled(loadingHabits.contains(habit.id))
                    }
                }
            }
        }
    }
    
    // MARK: - Inspiration Section
    private var inspirationSection: some View {
        PlayfulCard(variant: .purple) {
            VStack(spacing: DesignSystem.Spacing.lg) {
                VStack(spacing: DesignSystem.Spacing.md) {
                    Image(systemName: "party.popper.fill")
                        .font(.system(size: 48))
                        .foregroundColor(DesignSystem.Colors.success)
                        .symbolEffect(.bounce, value: true)
                    
                    Text("Všechny úkoly hotové!")
                        .font(DesignSystem.Typography.title2)
                        .fontWeight(.bold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .multilineTextAlignment(.center)
                }
                
                VStack(spacing: DesignSystem.Spacing.sm) {
                    Text("✨ Inspirace pro volný čas")
                        .font(DesignSystem.Typography.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text(currentInspiration)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, DesignSystem.Spacing.md)
                }
            }
            .padding(DesignSystem.Spacing.lg)
        }
    }
    
    // MARK: - Helper Functions
    private func isHabitCompleted(_ habit: Habit) -> Bool {
        let todayStr = formatDateString(today)
        return habit.habitCompletions?[todayStr] == true
    }
    
    private func formatDateString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
    
    private var allTodayStepsCompleted: Bool {
        !todaySteps.isEmpty && todaySteps.allSatisfy { $0.completed }
    }
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                // Calculate date range: 7 days ago to 14 days ahead (optimized)
                let calendar = Calendar.current
                let selectedDay = selectedDate
                let startDate = calendar.date(byAdding: .day, value: -7, to: selectedDay) ?? selectedDay
                let endDate = calendar.date(byAdding: .day, value: 14, to: selectedDay) ?? selectedDay
                
                // Load all data in parallel with optimized date range
                async let settingsTask = apiManager.fetchUserSettings()
                async let stepsTask = apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                async let goalsTask = apiManager.fetchGoals()
                async let planningTask = apiManager.fetchDailyPlanning(date: selectedDate)
                async let habitsTask = apiManager.fetchHabits()
                
                // Wait for all tasks, but handle errors individually
                let settings = try? await settingsTask
                let allSteps = (try? await stepsTask) ?? []
                let goals = (try? await goalsTask) ?? []
                let planning = try? await planningTask
                let habits = (try? await habitsTask) ?? []
                
                await MainActor.run {
                    self.userSettings = settings
                    self.dailySteps = allSteps
                    self.goals = goals
                    self.dailyPlanning = planning
                    self.habits = habits
                    self.isLoading = false
                    self.updateStepStats()
                    
                    // Save data to App Group for widget access
                    apiManager.saveWidgetData(steps: allSteps, habits: habits)
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
    
    private func updateStepStats() {
        // Filter steps for selected day
        let calendar = Calendar.current
        let selectedStartOfDay = calendar.startOfDay(for: today)
        
        let stepsForProgress = dailySteps.filter { step in
            guard let stepDate = step.date else { return false }
            let stepStartOfDay = calendar.startOfDay(for: stepDate)
            return calendar.isDate(stepStartOfDay, inSameDayAs: selectedStartOfDay)
        }
        
        // Count steps
        stepStats = (
            completed: stepsForProgress.filter { $0.completed }.count,
            total: stepsForProgress.count
        )
        
        // Count habits for progress (only scheduled habits)
        let todayStr = formatDateString(today)
        let habitsForProgressList = habitsForProgress
        
        habitStats = (
            completed: habitsForProgressList.filter { habit in
                habit.habitCompletions?[todayStr] == true
            }.count,
            total: habitsForProgressList.count
        )
    }
    
    private func setRandomInspiration() {
        currentInspiration = inspirations.randomElement() ?? inspirations[0]
    }
    
    private func toggleStepCompletion(stepId: String, completed: Bool) {
        Task {
            do {
                guard let currentStep = dailySteps.first(where: { $0.id == stepId }) else {
                    return
                }
                
                let updatedStep = try await apiManager.updateStepCompletion(stepId: stepId, completed: completed, currentStep: currentStep)
                
                await MainActor.run {
                    if let index = dailySteps.firstIndex(where: { $0.id == stepId }) {
                        dailySteps[index] = updatedStep
                        updateStepStats()
                        
                        // Save updated data to App Group for widget
                        apiManager.saveWidgetData(steps: dailySteps, habits: habits)
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
    
    private func showHabitAspirationEditor(habit: Habit) {
        selectedHabitForAspiration = habit
        showHabitAspirationModal = true
    }
    
    private func toggleHabitCompletion(habit: Habit) {
        let todayStr = formatDateString(today)
        loadingHabits.insert(habit.id)
        
        Task {
            do {
                let updatedHabit = try await apiManager.toggleHabitCompletion(habitId: habit.id, date: todayStr)
                
                await MainActor.run {
                    if let index = habits.firstIndex(where: { $0.id == habit.id }) {
                        habits[index] = updatedHabit
                    }
                    loadingHabits.remove(habit.id)
                    
                    // Save updated data to App Group for widget
                    apiManager.saveWidgetData(steps: dailySteps, habits: habits)
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                    loadingHabits.remove(habit.id)
                }
            }
        }
    }
}

#Preview {
    DailyPlanningView()
}

// MARK: - Habit Aspiration Editor View
struct HabitAspirationEditorView: View {
    let habit: Habit
    let onAspirationUpdated: () -> Void
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var aspirations: [Aspiration] = []
    @State private var selectedAspirationId: String? = nil
    @State private var isLoading = false
    @State private var isLoadingAspirations = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Habit Name
                    Text(habit.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    // Aspiration Selection
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Oblast")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if isLoadingAspirations {
                            ProgressView()
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        } else if aspirations.isEmpty {
                            Text("Žádné oblasti")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        } else {
                            Picker("Oblast", selection: $selectedAspirationId) {
                                Text("Bez oblasti").tag(nil as String?)
                                ForEach(aspirations, id: \.id) { aspiration in
                                    Text(aspiration.title).tag(aspiration.id as String?)
                                }
                            }
                            .pickerStyle(.menu)
                            .padding(.horizontal)
                        }
                    }
                    
                    Spacer()
                }
            }
            .navigationTitle("Upravit oblast")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Uložit") {
                        saveAspiration()
                    }
                    .disabled(isLoading)
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
            .task {
                selectedAspirationId = habit.aspirationId
                await loadAspirations()
            }
        }
    }
    
    private func loadAspirations() async {
        isLoadingAspirations = true
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            await MainActor.run {
                self.aspirations = fetchedAspirations
                self.isLoadingAspirations = false
            }
        } catch {
            await MainActor.run {
                self.isLoadingAspirations = false
            }
        }
    }
    
    private func saveAspiration() {
        isLoading = true
        
        Task {
            do {
                _ = try await apiManager.updateHabit(
                    habitId: habit.id,
                    name: nil,
                    description: nil,
                    frequency: nil,
                    reminderTime: nil,
                    selectedDays: nil,
                    xpReward: nil,
                    aspirationId: selectedAspirationId
                )
                
                await MainActor.run {
                    isLoading = false
                    onAspirationUpdated()
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}
