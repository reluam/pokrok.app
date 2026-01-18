import SwiftUI
import Clerk

enum Tab: String, CaseIterable {
    case steps = "Feed"
    case habits = "Návyky"
    case goals = "Pokrok"
    case settings = "Nastavení"
    
    var icon: String {
        switch self {
        case .steps: return "shoeprints.fill"
        case .habits: return "repeat.circle.fill"
        case .goals: return "chart.bar.fill"
        case .settings: return "gear"
        }
    }
}

struct ContentView: View {
    @Environment(\.clerk) private var clerk
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    @ObservedObject private var navigationManager = NavigationManager.shared
    @State private var selectedTab: Tab = .steps
    @State private var showAddAspirationModal = false
    @State private var showAddGoalModal = false
    @State private var showAddStepModal = false
    @State private var showAddHabitModal = false
    @State private var showAddMenu = false
    @State private var showQuickAddSheet = false
    @State private var quickAddStepTitle: String? = nil
    
    var body: some View {
        Group {
            if clerk.user != nil {
                // Main app content for authenticated users
                ZStack {
                    // Main content
                    Group {
                        switch selectedTab {
                        case .steps:
                            StepsView()
                        case .habits:
                            HabitsView()
                        case .goals:
                            GoalsView()
                        case .settings:
                            SettingsView()
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    
                    // Custom Playful Tab Bar
                    VStack {
                        Spacer()
                        PlayfulTabBar(selectedTab: $selectedTab, showAddMenu: $showAddMenu, showQuickAddSheet: $showQuickAddSheet)
                    }
                    .ignoresSafeArea(.keyboard, edges: .bottom)
                }
                .background(DesignSystem.Colors.background)
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
                .sheet(isPresented: $showAddMenu) {
                    AddMenuSheet(
                        showAddAspirationModal: $showAddAspirationModal,
                        showAddGoalModal: $showAddGoalModal,
                        showAddStepModal: $showAddStepModal,
                        showAddHabitModal: $showAddHabitModal
                    )
                }
                .sheet(isPresented: $showQuickAddSheet) {
                    QuickAddSheet(
                        showAddAspirationModal: $showAddAspirationModal,
                        showAddGoalModal: $showAddGoalModal,
                        showAddStepModal: $showAddStepModal,
                        showAddHabitModal: $showAddHabitModal,
                        quickAddStepTitle: $quickAddStepTitle
                    )
                }
                .sheet(isPresented: Binding(
                    get: { quickAddStepTitle != nil },
                    set: { if !$0 { quickAddStepTitle = nil } }
                )) {
                    NavigationView {
                        StepDetailView(initialDate: Date(), initialTitle: quickAddStepTitle, onStepAdded: {
                            quickAddStepTitle = nil
                        })
                    }
                }
                .onChange(of: navigationManager.navigateToTab) { _, newTab in
                    if let tab = newTab {
                        selectedTab = tab
                        navigationManager.navigateToTab = nil
                    }
                }
            } else {
                // Authentication screen for unauthenticated users
                AuthView()
            }
        }
    }
}

// MARK: - Playful Tab Bar
struct PlayfulTabBar: View {
    @Binding var selectedTab: Tab
    @Binding var showAddMenu: Bool
    @Binding var showQuickAddSheet: Bool
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            // First two tabs (Kroky, Návyky)
            ForEach([Tab.steps, Tab.habits], id: \.self) { tab in
                TabBarButton(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    action: {
                        selectedTab = tab
                    }
                )
                .frame(maxWidth: .infinity)
            }
            
            // Central Add Step Button
            Button(action: {
                showQuickAddSheet = true
            }) {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [settingsManager.primaryColor, settingsManager.primaryColor.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                    .overlay(
                        Circle()
                            .stroke(DesignSystem.Colors.outline, lineWidth: 2)
                    )
                    .overlay(
                        Image(systemName: "plus")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                    )
                    .shadow(color: settingsManager.primaryColor.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .buttonStyle(PlainButtonStyle())
            .padding(.horizontal, DesignSystem.Spacing.xs)
            
            // Last two tabs (Cíle, Nastavení)
            ForEach([Tab.goals, Tab.settings], id: \.self) { tab in
                TabBarButton(
                    tab: tab,
                    isSelected: selectedTab == tab,
                    action: {
                        selectedTab = tab
                    }
                )
                .frame(maxWidth: .infinity)
            }
        }
        .frame(height: 56)
        .padding(.horizontal, DesignSystem.Spacing.sm)
        .padding(.vertical, DesignSystem.Spacing.sm)
        .padding(.bottom, DesignSystem.Spacing.sm)
        .background(
            // Main tab bar background
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                .fill(DesignSystem.Colors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .background(
                    // Offset shadow for playful effect
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                        .fill(DesignSystem.Shadows.card)
                        .offset(
                            x: DesignSystem.Shadows.cardOffsetX,
                            y: DesignSystem.Shadows.cardOffsetY
                        )
                )
        )
        .padding(.horizontal, DesignSystem.Spacing.md)
    }
}

// MARK: - Tab Bar Button
struct TabBarButton: View {
    let tab: Tab
    let isSelected: Bool
    let action: () -> Void
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignSystem.Spacing.xs) {
                Image(systemName: tab.icon)
                    .font(.system(size: 20, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textSecondary)
                
                Text(tab.rawValue)
                    .font(DesignSystem.Typography.caption2)
                    .foregroundColor(isSelected ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56) // Match tab bar height
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Add Menu Sheet
struct AddMenuSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var showAddAspirationModal: Bool
    @Binding var showAddGoalModal: Bool
    @Binding var showAddStepModal: Bool
    @Binding var showAddHabitModal: Bool
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Header
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 48, weight: .medium))
                            .foregroundColor(settingsManager.primaryColor)
                        
                        Text("Přidat nový")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Vyberte, co chcete přidat")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    .padding(.top, DesignSystem.Spacing.xl)
                    
                    // Menu options
                    VStack(spacing: DesignSystem.Spacing.md) {
                        AddMenuButton(
                            icon: "folder.fill",
                            title: "Oblast",
                            color: DesignSystem.Colors.Playful.purple
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showAddAspirationModal = true
                            }
                        }
                        
                        AddMenuButton(
                            icon: "flag.fill",
                            title: "Cíl",
                            color: DesignSystem.Colors.Playful.yellowGreen
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showAddGoalModal = true
                            }
                        }
                        
                        AddMenuButton(
                            icon: "shoeprints.fill",
                            title: "Krok",
                            color: settingsManager.primaryColor
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showAddStepModal = true
                            }
                        }
                        
                        AddMenuButton(
                            icon: "repeat.circle.fill",
                            title: "Návyk",
                            color: DesignSystem.Colors.Playful.yellow
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showAddHabitModal = true
                            }
                        }
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.lg)
                    
                    // Bottom padding
                    Spacer(minLength: 100)
                }
                .padding(.top, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Přidat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Zrušit") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
    }
}

// MARK: - Add Menu Button Component
struct AddMenuButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignSystem.Spacing.md) {
                ZStack {
                    Circle()
                        .fill(color.mix(with: DesignSystem.Colors.surface, by: 0.85))
                        .frame(width: 48, height: 48)
                        .overlay(
                            Circle()
                                .stroke(settingsManager.primaryColor, lineWidth: 2)
                        )
                        .background(
                            Circle()
                                .fill(DesignSystem.Shadows.card)
                                .offset(
                                    x: DesignSystem.Shadows.cardOffsetX,
                                    y: DesignSystem.Shadows.cardOffsetY
                                )
                        )
                    
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(color)
                }
                
                Text(title)
                    .font(DesignSystem.Typography.headline)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DesignSystem.Colors.textTertiary)
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(settingsManager.primaryColor, lineWidth: 2)
            )
            .background(
                // Offset shadow effect matching playful design
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .fill(DesignSystem.Shadows.card)
                    .offset(
                        x: DesignSystem.Shadows.cardOffsetX,
                        y: DesignSystem.Shadows.cardOffsetY
                            )
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Add Habit Modal (placeholder)
struct AddHabitModal: View {
    @Environment(\.dismiss) private var dismiss
    let onHabitAdded: () -> Void
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Vytvoření návyku")
                    .font(DesignSystem.Typography.title2)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text("Tato funkce bude brzy k dispozici")
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                
                Spacer()
            }
            .padding()
            .navigationTitle("Nový návyk")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Quick Add Sheet
struct QuickAddSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var showAddAspirationModal: Bool
    @Binding var showAddGoalModal: Bool
    @Binding var showAddStepModal: Bool
    @Binding var showAddHabitModal: Bool
    @Binding var quickAddStepTitle: String?
    
    @State private var stepTitle: String = ""
    @State private var isCreating = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var titleFieldOffset: CGFloat = 0
    @State private var titleFieldHighlighted = false
    @FocusState private var isStepTitleFocused: Bool
    @StateObject private var apiManager = APIManager.shared
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Step input box
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                        Text("Nový krok")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        TextField("Název kroku", text: $stepTitle)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                            .textFieldStyle(.plain)
                            .focused($isStepTitleFocused)
                            .padding(DesignSystem.Spacing.md)
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .fill(DesignSystem.Colors.surface)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                            .stroke(titleFieldHighlighted ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.outline, lineWidth: titleFieldHighlighted ? 2 : 1)
                                    )
                            )
                            .offset(x: titleFieldOffset)
                            .animation(.easeInOut(duration: 0.1), value: titleFieldOffset)
                            .animation(.easeInOut(duration: 0.2), value: titleFieldHighlighted)
                        
                        Button(action: {
                            if stepTitle.trimmingCharacters(in: .whitespaces).isEmpty {
                                // Animate field if empty
                                animateTitleField()
                            } else {
                                quickAddStepTitle = stepTitle
                                dismiss()
                            }
                        }) {
                            HStack {
                                Text("Upravit detaily")
                                    .font(DesignSystem.Typography.body)
                                    .fontWeight(.medium)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14, weight: .medium))
                            }
                            .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                            .padding(DesignSystem.Spacing.md)
                        }
                    }
                    .padding(DesignSystem.Spacing.md)
                    .background(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                            .fill(DesignSystem.Colors.surface)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.lg)
                                    .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                            )
                    )
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.lg)
                    
                    // Other options
                    VStack(spacing: DesignSystem.Spacing.md) {
                        Text("Nebo přidat")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, DesignSystem.Spacing.md)
                        
                        QuickAddOptionButton(
                            icon: "repeat.circle.fill",
                            title: "Návyk",
                            color: DesignSystem.Colors.Playful.yellow
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                showAddHabitModal = true
                            }
                        }
                        
                        QuickAddOptionButton(
                            icon: "flag.fill",
                            title: "Cíl",
                            color: DesignSystem.Colors.Playful.yellowGreen
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                showAddGoalModal = true
                            }
                        }
                        
                        QuickAddOptionButton(
                            icon: "folder.fill",
                            title: "Oblast",
                            color: DesignSystem.Colors.Playful.purple
                        ) {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                showAddAspirationModal = true
                            }
                        }
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    
                    Spacer(minLength: 100)
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Přidat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Vytvořit") {
                        createStepDirectly()
                    }
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                    .fontWeight(.semibold)
                    .disabled(stepTitle.trimmingCharacters(in: .whitespaces).isEmpty || isCreating)
                }
            }
            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    isStepTitleFocused = true
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func animateTitleField() {
        // Vibrate left-right animation
        withAnimation(.easeInOut(duration: 0.1)) {
            titleFieldOffset = -10
            titleFieldHighlighted = true
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeInOut(duration: 0.1)) {
                titleFieldOffset = 10
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation(.easeInOut(duration: 0.1)) {
                titleFieldOffset = -10
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(.easeInOut(duration: 0.1)) {
                titleFieldOffset = 10
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            withAnimation(.easeInOut(duration: 0.1)) {
                titleFieldOffset = 0
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            titleFieldHighlighted = false
            isStepTitleFocused = true
        }
    }
    
    private func createStepDirectly() {
        let trimmedTitle = stepTitle.trimmingCharacters(in: .whitespaces)
        guard !trimmedTitle.isEmpty else {
            animateTitleField()
            return
        }
        
        isCreating = true
        
        Task {
            do {
                let createRequest = CreateStepRequest(
                    title: trimmedTitle,
                    description: nil,
                    date: Date(), // Today's date
                    goalId: nil, // No goal
                    areaId: nil, // No area
                    isRepeating: nil,
                    frequency: nil,
                    selectedDays: nil,
                    recurringStartDate: nil,
                    recurringEndDate: nil,
                    recurringDisplayMode: nil
                )
                
                _ = try await apiManager.createStep(createRequest)
                
                await MainActor.run {
                    isCreating = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isCreating = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Quick Add Option Button
struct QuickAddOptionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignSystem.Spacing.md) {
                ZStack {
                    Circle()
                        .fill(color.mix(with: DesignSystem.Colors.surface, by: 0.85))
                        .frame(width: 40, height: 40)
                        .overlay(
                            Circle()
                                .stroke(settingsManager.primaryColor, lineWidth: 2)
                        )
                    
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(color)
                }
                
                Text(title)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(DesignSystem.Colors.textTertiary)
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(settingsManager.primaryColor, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}
