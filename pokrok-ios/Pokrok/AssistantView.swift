import SwiftUI

struct AssistantView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    @State private var searchText: String = ""
    @State private var searchResults: [AssistantSearchResult] = []
    @State private var isSearching: Bool = false
    @State private var showSearchResults: Bool = false
    
    // Modal states
    @State private var showAddAspirationModal = false
    @State private var showAddGoalModal = false
    @State private var showAddStepModal = false
    @State private var showAddHabitModal = false
    
    // Detail modal states (for editing existing items)
    @State private var selectedStep: DailyStep?
    @State private var selectedGoal: Goal?
    @State private var selectedHabit: Habit?
    @State private var showStepDetail = false
    @State private var showGoalDetail = false
    @State private var showHabitDetail = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Section - Always at top
                VStack(spacing: DesignSystem.Spacing.md) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                            Text("Asistent")
                                .font(DesignSystem.Typography.title2)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            
                            Text("Vyhledávejte a přidávejte rychle")
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                        
                        Spacer()
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                    
                    // Search Bar
                    HStack(spacing: DesignSystem.Spacing.sm) {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .font(.system(size: 18))
                        
                        TextField("Hledat...", text: $searchText)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .onChange(of: searchText) { _, newValue in
                                if newValue.count >= 2 {
                                    performSearch(query: newValue)
                                } else {
                                    searchResults = []
                                    showSearchResults = false
                                }
                            }
                        
                        if !searchText.isEmpty {
                            Button(action: {
                                searchText = ""
                                searchResults = []
                                showSearchResults = false
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(DesignSystem.Colors.textSecondary)
                                    .font(.system(size: 18))
                            }
                        }
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(DesignSystem.Colors.surface)
                    .cornerRadius(DesignSystem.CornerRadius.md)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                    )
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    
                    // Search Results
                    if showSearchResults && !searchResults.isEmpty {
                        ScrollView {
                            VStack(spacing: DesignSystem.Spacing.sm) {
                                ForEach(searchResults) { result in
                                    AssistantSearchResultRow(result: result) {
                                        handleSearchResultTap(result: result)
                                    }
                                }
                            }
                            .padding(.horizontal, DesignSystem.Spacing.md)
                        }
                        .frame(maxHeight: 300)
                    } else if isSearching {
                        HStack {
                            Spacer()
                            ProgressView()
                                .padding()
                            Spacer()
                        }
                    }
                }
                .background(DesignSystem.Colors.background)
                
                // Quick Actions Section - Only show when not searching
                if searchText.isEmpty {
                    Divider()
                        .padding(.vertical, DesignSystem.Spacing.sm)
                    
                    VStack(spacing: DesignSystem.Spacing.lg) {
                        Text("Rychlé přidání")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, DesignSystem.Spacing.md)
                            .padding(.top, DesignSystem.Spacing.md)
                        
                        // Four Tiles in a grid
                        VStack(spacing: DesignSystem.Spacing.md) {
                            // First row - Oblasti a Cíle
                            HStack(spacing: DesignSystem.Spacing.md) {
                                AssistantTile(
                                    icon: "folder.fill",
                                    title: "Oblast",
                                    color: DesignSystem.Colors.Playful.purple
                                ) {
                                    showAddAspirationModal = true
                                }
                                
                                AssistantTile(
                                    icon: "flag.fill",
                                    title: "Cíl",
                                    color: DesignSystem.Colors.Playful.yellowGreen
                                ) {
                                    showAddGoalModal = true
                                }
                            }
                            
                            // Second row - Kroky a Návyky
                            HStack(spacing: DesignSystem.Spacing.md) {
                                AssistantTile(
                                    icon: "checkmark.circle.fill",
                                    title: "Krok",
                                    color: settingsManager.primaryColor
                                ) {
                                    showAddStepModal = true
                                }
                                
                                AssistantTile(
                                    icon: "repeat.circle.fill",
                                    title: "Návyk",
                                    color: DesignSystem.Colors.Playful.yellow
                                ) {
                                    showAddHabitModal = true
                                }
                            }
                        }
                        .padding(.horizontal, DesignSystem.Spacing.md)
                        
                        Spacer()
                    }
                    .background(DesignSystem.Colors.background)
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Zavřít") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
        .sheet(isPresented: $showAddAspirationModal) {
            AddAspirationModal(onAspirationAdded: {})
        }
        .sheet(isPresented: $showAddGoalModal) {
            NavigationView {
                GoalDetailView(onGoalAdded: {})
            }
        }
        .sheet(isPresented: $showAddStepModal) {
            NavigationView {
                StepDetailView(initialDate: Date(), onStepAdded: {})
            }
        }
        .sheet(isPresented: $showAddHabitModal) {
            NavigationView {
                HabitDetailView(onHabitAdded: {})
            }
        }
        .sheet(item: $selectedStep) { step in
            NavigationView {
                StepDetailView(step: step, onStepAdded: {})
            }
        }
        .sheet(item: $selectedGoal) { goal in
            NavigationView {
                GoalDetailView(goal: goal, onGoalAdded: {})
            }
        }
        .sheet(item: $selectedHabit) { habit in
            NavigationView {
                HabitDetailView(habit: habit, onHabitAdded: {})
            }
        }
    }
    
    private func performSearch(query: String) {
        guard query.count >= 2 else {
            searchResults = []
            showSearchResults = false
            return
        }
        
        isSearching = true
        showSearchResults = true
        
        Task {
            do {
                let results = try await apiManager.searchAssistant(query: query)
                await MainActor.run {
                    searchResults = results
                    isSearching = false
                }
            } catch {
                await MainActor.run {
                    isSearching = false
                    searchResults = []
                }
            }
        }
    }
    
    private func handleSearchResultTap(result: AssistantSearchResult) {
        dismiss()
        
        // Load and open detail view based on result type
        Task {
            do {
                switch result.type {
                case "goal":
                    // Load all goals and find the one by ID
                    let goals = try await apiManager.fetchGoals()
                    if let goal = goals.first(where: { $0.id == result.id }) {
                        await MainActor.run {
                            selectedGoal = goal
                        }
                    }
                    
                case "step":
                    // Load all steps and find the one by ID
                    // Need to fetch steps for a wide date range to find the step
                    let calendar = Calendar.current
                    let today = Date()
                    let startDate = calendar.date(byAdding: .year, value: -1, to: today) ?? today
                    let endDate = calendar.date(byAdding: .year, value: 1, to: today) ?? today
                    
                    let steps = try await apiManager.fetchSteps(startDate: startDate, endDate: endDate)
                    if let step = steps.first(where: { $0.id == result.id }) {
                        await MainActor.run {
                            selectedStep = step
                        }
                    }
                    
                case "habit":
                    // Load all habits and find the one by ID
                    let habits = try await apiManager.fetchHabits()
                    if let habit = habits.first(where: { $0.id == result.id }) {
                        await MainActor.run {
                            selectedHabit = habit
                        }
                    }
                    
                case "area":
                    // TODO: Implement area detail view
                    break
                    
                default:
                    break
                }
            } catch {
                print("Error loading \(result.type) detail: \(error)")
            }
        }
    }
}

// MARK: - Assistant Search Result
struct AssistantSearchResult: Identifiable, Codable {
    let id: String
    let type: String
    let title: String
    let description: String?
    let metadata: [String: String]?
    
    enum CodingKeys: String, CodingKey {
        case id
        case type
        case title
        case description
        case metadata
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        type = try container.decode(String.self, forKey: .type)
        title = try container.decode(String.self, forKey: .title)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        
        // Decode metadata as flexible dictionary
        if let metadataDict = try? container.decode([String: AnyCodableValue].self, forKey: .metadata) {
            metadata = metadataDict.compactMapValues { value in
                if let string = value.stringValue {
                    return string
                } else if let bool = value.boolValue {
                    return String(bool)
                } else if let number = value.numberValue {
                    return String(number)
                }
                return nil
            }
        } else {
            metadata = nil
        }
    }
}

// Helper for flexible metadata decoding
private struct AnyCodableValue: Codable {
    let stringValue: String?
    let boolValue: Bool?
    let numberValue: Double?
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let string = try? container.decode(String.self) {
            stringValue = string
            boolValue = nil
            numberValue = nil
        } else if let bool = try? container.decode(Bool.self) {
            stringValue = nil
            boolValue = bool
            numberValue = nil
        } else if let number = try? container.decode(Double.self) {
            stringValue = nil
            boolValue = nil
            numberValue = number
        } else if let int = try? container.decode(Int.self) {
            stringValue = nil
            boolValue = nil
            numberValue = Double(int)
        } else {
            stringValue = nil
            boolValue = nil
            numberValue = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let string = stringValue {
            try container.encode(string)
        } else if let bool = boolValue {
            try container.encode(bool)
        } else if let number = numberValue {
            try container.encode(number)
        }
    }
}

// MARK: - Assistant Search Result Row
struct AssistantSearchResultRow: View {
    let result: AssistantSearchResult
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignSystem.Spacing.md) {
                // Icon based on type
                ZStack {
                    Circle()
                        .fill(typeColor.opacity(0.2))
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: typeIcon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(typeColor)
                }
                
                // Content
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(result.title)
                        .font(DesignSystem.Typography.body)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .lineLimit(1)
                    
                    if let description = result.description, !description.isEmpty {
                        Text(description)
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .lineLimit(2)
                    }
                    
                    Text(typeLabel)
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(typeColor)
                        .padding(.horizontal, DesignSystem.Spacing.xs)
                        .padding(.vertical, 2)
                        .background(typeColor.opacity(0.1))
                        .cornerRadius(4)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }
            .padding(DesignSystem.Spacing.md)
            .background(DesignSystem.Colors.surface)
            .cornerRadius(DesignSystem.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(DesignSystem.Colors.outline.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var typeIcon: String {
        switch result.type {
        case "area": return "folder.fill"
        case "goal": return "flag.fill"
        case "step": return "checkmark.circle.fill"
        case "habit": return "repeat.circle.fill"
        default: return "circle.fill"
        }
    }
    
    private var typeColor: Color {
        switch result.type {
        case "area": return DesignSystem.Colors.Playful.purple
        case "goal": return DesignSystem.Colors.Playful.yellowGreen
        case "step": return DesignSystem.Colors.dynamicPrimary
        case "habit": return DesignSystem.Colors.Playful.yellow
        default: return DesignSystem.Colors.textSecondary
        }
    }
    
    private var typeLabel: String {
        switch result.type {
        case "area": return "Oblast"
        case "goal": return "Cíl"
        case "step": return "Krok"
        case "habit": return "Návyk"
        default: return result.type.capitalized
        }
    }
}

// MARK: - Assistant Tile
struct AssistantTile: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignSystem.Spacing.sm) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.2))
                        .frame(width: 60, height: 60)
                    
                    Image(systemName: icon)
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundColor(color)
                }
                
                Text(title)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(DesignSystem.Colors.surface)
            .cornerRadius(DesignSystem.CornerRadius.md)
            .overlay(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(color.opacity(0.3), lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}


