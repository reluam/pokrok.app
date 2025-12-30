import SwiftUI
import Clerk

enum Tab: String, CaseIterable {
    case steps = "Feed"
    case habits = "Návyky"
    case goals = "Pokrok"
    case settings = "Nastavení"
    
    var icon: String {
        switch self {
        case .steps: return "checkmark.circle.fill"
        case .habits: return "repeat.circle.fill"
        case .goals: return "chart.bar.fill"
        case .settings: return "gear"
        }
    }
}

struct ContentView: View {
    @Environment(\.clerk) private var clerk
    @ObservedObject private var settingsManager = UserSettingsManager.shared
    @State private var selectedTab: Tab = .steps
    @State private var showAddAspirationModal = false
    @State private var showAddGoalModal = false
    @State private var showAddStepModal = false
    @State private var showAddHabitModal = false
    @State private var showAddMenu = false
    
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
                        PlayfulTabBar(selectedTab: $selectedTab, showAddMenu: $showAddMenu)
                    }
                    .ignoresSafeArea(.keyboard, edges: .bottom)
                }
                .background(DesignSystem.Colors.background)
                .sheet(isPresented: $showAddAspirationModal) {
                    AddAspirationModal(onAspirationAdded: {})
                }
                .sheet(isPresented: $showAddGoalModal) {
                    AddGoalModal(onGoalAdded: {})
                }
                .sheet(isPresented: $showAddStepModal) {
                    AddStepModal(initialDate: Date(), onStepAdded: {})
                }
                .sheet(isPresented: $showAddHabitModal) {
                    AddHabitModal(onHabitAdded: {})
                }
                .sheet(isPresented: $showAddMenu) {
                    AddMenuSheet(
                        showAddAspirationModal: $showAddAspirationModal,
                        showAddGoalModal: $showAddGoalModal,
                        showAddStepModal: $showAddStepModal,
                        showAddHabitModal: $showAddHabitModal
                    )
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
            
            // Central Add Button
            Button(action: {
                showAddMenu = true
            }) {
                Circle()
                    .fill(DesignSystem.Colors.dynamicPrimary)
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
                            icon: "checkmark.circle.fill",
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
