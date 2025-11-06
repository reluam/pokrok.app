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
    
    // Stats
    @State private var stepStats = (completed: 0, total: 0)
    
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
            let stepStartOfDay = calendar.startOfDay(for: step.date)
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
            // Check if habit is scheduled for today
            if habit.alwaysShow {
                return true
            }
            
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
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddStepModal = true
                }) {
                    ModernIcon(
                        systemName: "plus",
                        size: 18,
                        color: DesignSystem.Colors.primary
                    )
                }
            }
        }
        .onAppear {
            loadData()
            setRandomInspiration()
        }
        .onChange(of: selectedDate) { _ in
            loadData()
        }
        .sheet(isPresented: $showAddStepModal) {
            AddStepModal(initialDate: selectedDate, onStepAdded: {
                loadData()
            })
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Header Section with Progress
    private var headerSectionWithProgress: some View {
        ModernCard(
            backgroundColor: isToday ? DesignSystem.Colors.surface : DesignSystem.Colors.surfaceSecondary.opacity(0.6)
        ) {
            HStack(alignment: .center, spacing: DesignSystem.Spacing.md) {
                // Left arrow button
                Button(action: {
                    changeDate(by: -1)
                }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(isToday ? DesignSystem.Colors.primary : DesignSystem.Colors.textTertiary)
                        .frame(width: 32, height: 32)
                }
                
                // Date and day info
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(dayName)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                    
                    HStack(alignment: .bottom, spacing: DesignSystem.Spacing.xs) {
                        Text("\(dayNumber)")
                            .font(DesignSystem.Typography.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(isToday ? DesignSystem.Colors.textPrimary : DesignSystem.Colors.textSecondary)
                        
                        if !isToday {
                            Text("(ne dnes)")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textTertiary)
                        }
                    }
                }
                
                Spacer()
                
                // Progress bar and percentage
                VStack(alignment: .trailing, spacing: DesignSystem.Spacing.xs) {
                    ModernProgressBar(
                        progress: stepStats.total > 0 ? Double(stepStats.completed) / Double(stepStats.total) : 0,
                        height: 8,
                        foregroundColor: DesignSystem.Colors.success
                    )
                    
                    Text("\(completionPercentage)% (\(stepStats.completed)/\(stepStats.total))")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(isToday ? DesignSystem.Colors.textSecondary : DesignSystem.Colors.textTertiary)
                }
                .frame(width: 120)
                
                // Right arrow button
                Button(action: {
                    changeDate(by: 1)
                }) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(isToday ? DesignSystem.Colors.primary : DesignSystem.Colors.textTertiary)
                        .frame(width: 32, height: 32)
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    private func changeDate(by days: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) {
            selectedDate = newDate
            loadData()
        }
    }
    
    private var completionPercentage: Int {
        guard stepStats.total > 0 else { return 0 }
        return Int((Double(stepStats.completed) / Double(stepStats.total)) * 100)
    }
    
    // MARK: - Steps Section
    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Kroky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
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
                    ForEach(Array(todaySteps.enumerated()), id: \.element.id) { index, step in
                        StepRow(
                            step: step,
                            index: index,
                            onToggle: {
                                toggleStepCompletion(stepId: step.id, completed: !step.completed)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Habits Section
    private var habitsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Návyky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            if todaysHabits.isEmpty {
                Text("Žádné návyky na dnes")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .padding(DesignSystem.Spacing.md)
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.sm) {
                    ForEach(todaysHabits, id: \.id) { habit in
                        HabitRow(
                            habit: habit,
                            isCompleted: isHabitCompleted(habit),
                            isLoading: loadingHabits.contains(habit.id),
                            onToggle: {
                                toggleHabitCompletion(habit: habit)
                            }
                        )
                    }
                }
            }
        }
    }
    
    // MARK: - Inspiration Section
    private var inspirationSection: some View {
        ModernCard {
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
                // Calculate dates for selected day, yesterday, and tomorrow relative to selected date
                let calendar = Calendar.current
                let selectedDay = selectedDate
                let yesterdayDate = calendar.date(byAdding: .day, value: -1, to: selectedDay) ?? selectedDay
                let tomorrowDate = calendar.date(byAdding: .day, value: 1, to: selectedDay) ?? selectedDay
                
                // Load all data in parallel, including steps for yesterday, selected day, and tomorrow
                async let settingsTask = apiManager.fetchUserSettings()
                async let stepsSelectedTask = apiManager.fetchStepsForDate(date: selectedDay)
                async let stepsYesterdayTask = apiManager.fetchStepsForDate(date: yesterdayDate)
                async let stepsTomorrowTask = apiManager.fetchStepsForDate(date: tomorrowDate)
                async let goalsTask = apiManager.fetchGoals()
                async let planningTask = apiManager.fetchDailyPlanning(date: selectedDate)
                async let habitsTask = apiManager.fetchHabits()
                
                // Wait for all tasks, but handle errors individually
                let settings = try? await settingsTask
                
                // Fetch steps for all three days
                var allSteps: [DailyStep] = []
                do {
                    let stepsSelected = (try? await stepsSelectedTask) ?? []
                    let stepsYesterday = (try? await stepsYesterdayTask) ?? []
                    let stepsTomorrow = (try? await stepsTomorrowTask) ?? []
                    
                    // Combine all steps and remove duplicates (in case of overlap)
                    var stepsDict: [String: DailyStep] = [:]
                    for step in stepsYesterday + stepsSelected + stepsTomorrow {
                        stepsDict[step.id] = step
                    }
                    allSteps = Array(stepsDict.values)
                } catch {
                    // Silently handle errors
                }
                
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
        // Count all today's steps (API already filters by date)
        let plannedSteps = dailySteps
        
        stepStats = (
            completed: plannedSteps.filter { $0.completed }.count,
            total: plannedSteps.count
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

// MARK: - Step Row Component
struct StepRow: View {
    let step: DailyStep
    let onToggle: () -> Void
    let index: Int
    
    init(step: DailyStep, index: Int = 0, onToggle: @escaping () -> Void) {
        self.step = step
        self.index = index
        self.onToggle = onToggle
    }
    
    private var isOverdue: Bool {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let stepDate = calendar.startOfDay(for: step.date)
        return stepDate < today && !step.completed
    }
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: DesignSystem.Spacing.md) {
                // Checkbox - square with green background when completed
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(step.completed ? DesignSystem.Colors.success : Color.clear)
                        .frame(width: 20, height: 20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(step.completed ? DesignSystem.Colors.success : DesignSystem.Colors.textTertiary, lineWidth: 2)
                        )
                    
                    if step.completed {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                .shadow(color: step.completed ? DesignSystem.Colors.success.opacity(0.3) : Color.clear, radius: 4, x: 0, y: 2)
                
                // Step number
                Text("#\(index + 1)")
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textTertiary)
                
                // Step content
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    HStack(spacing: DesignSystem.Spacing.sm) {
                        Text(step.title)
                            .font(DesignSystem.Typography.body)
                            .fontWeight(.semibold)
                            .foregroundColor(step.completed ? DesignSystem.Colors.success.opacity(0.8) : DesignSystem.Colors.textPrimary)
                            .strikethrough(step.completed)
                            .multilineTextAlignment(.leading)
                        
                        // Status chip
                        if isOverdue {
                            Text("Zpožděné")
                                .font(DesignSystem.Typography.caption2)
                                .fontWeight(.medium)
                                .foregroundColor(DesignSystem.Colors.error)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(DesignSystem.Colors.error.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                    
                    if let description = step.description, !description.isEmpty {
                        Text(description)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .lineLimit(2)
                    }
                }
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                    .fill(step.completed ? 
                          Color(red: 240/255, green: 253/255, blue: 244/255) : // green-50 equivalent
                          Color(red: 249/255, green: 250/255, blue: 251/255)) // gray-50 equivalent
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                    .stroke(step.completed ? 
                            Color(red: 187/255, green: 247/255, blue: 208/255) : // green-200 equivalent
                            Color(red: 229/255, green: 231/255, blue: 235/255), // gray-200 equivalent
                            lineWidth: 1)
            )
            .shadow(color: step.completed ? 
                    DesignSystem.Colors.success.opacity(0.2) : 
                    Color.black.opacity(0.05),
                    radius: step.completed ? 6 : 2,
                    x: 0,
                    y: step.completed ? 4 : 1)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Habit Row Component
struct HabitRow: View {
    let habit: Habit
    let isCompleted: Bool
    let isLoading: Bool
    let onToggle: () -> Void
    
    var body: some View {
        Button(action: onToggle) {
            HStack(spacing: DesignSystem.Spacing.sm) {
                // Checkbox - square with orange background when completed
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(isCompleted ? DesignSystem.Colors.primary : Color.clear)
                        .frame(width: 20, height: 20)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .stroke(isCompleted ? DesignSystem.Colors.primary : DesignSystem.Colors.textTertiary, lineWidth: 2)
                        )
                    
                    if isLoading {
                        ProgressView()
                            .scaleEffect(0.7)
                    } else if isCompleted {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
                
                Text(habit.name)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(isCompleted ? DesignSystem.Colors.primary.opacity(0.8) : DesignSystem.Colors.textPrimary)
                    .strikethrough(isCompleted)
                    .multilineTextAlignment(.leading)
                
                Spacer()
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(isCompleted ? DesignSystem.Colors.primary.opacity(0.1) : DesignSystem.Colors.background)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(isCompleted ? DesignSystem.Colors.primary.opacity(0.3) : Color.clear, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(isLoading)
    }
}

#Preview {
    DailyPlanningView()
}
