import SwiftUI
import Clerk

struct ContentView: View {
    @Environment(\.clerk) private var clerk
    @State private var showAddMenu = false
    @State private var showAddGoalModal = false
    @State private var showAddStepModal = false
    @State private var showAddHabitModal = false
    
    var body: some View {
        Group {
            if clerk.user != nil {
                // Main app content for authenticated users
                ZStack(alignment: .bottom) {
                    TabView {
                        DashboardView()
                            .tabItem {
                                Image(systemName: "house.fill")
                                Text("Domů")
                            }
                        
                        GoalsView()
                            .tabItem {
                                Image(systemName: "flag.fill")
                                Text("Cíle")
                            }
                        
                        StepsView()
                            .tabItem {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Kroky")
                            }
                        
                        HabitsView()
                            .tabItem {
                                Image(systemName: "repeat.circle.fill")
                                Text("Návyky")
                            }
                        
                        SettingsView()
                            .tabItem {
                                Image(systemName: "gear")
                                Text("Nastavení")
                            }
                    }
                    .accentColor(.orange)
                    
                    // Floating half-circle plus button emerging from tab bar
                    GeometryReader { geometry in
                        VStack(spacing: 0) {
                            Spacer()
                            Button(action: {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    showAddMenu.toggle()
                                }
                            }) {
                                ZStack {
                                    // Half circle (top half only)
                                    Circle()
                                        .fill(DesignSystem.Colors.primary)
                                        .frame(width: 70, height: 70)
                                        .shadow(color: DesignSystem.Colors.primary.opacity(0.4), radius: 8, x: 0, y: -2)
                                        .clipShape(
                                            Rectangle()
                                                .offset(y: -35) // Clip bottom half
                                        )
                                    
                                    Image(systemName: showAddMenu ? "xmark" : "plus")
                                        .font(.system(size: 24, weight: .semibold))
                                        .foregroundColor(.white)
                                        .rotationEffect(.degrees(showAddMenu ? 45 : 0))
                                        .offset(y: -10)
                                }
                                .frame(width: 70, height: 35)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, geometry.safeAreaInsets.bottom + 49)
                    }
                    
                    // Add Menu Overlay
                    if showAddMenu {
                        Color.black.opacity(0.4)
                            .ignoresSafeArea()
                            .onTapGesture {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    showAddMenu = false
                                }
                            }
                        
                        VStack(spacing: 16) {
                            Spacer()
                            
                            // Menu Options
                            VStack(spacing: 12) {
                                AddMenuButton(
                                    icon: "flag.fill",
                                    title: "Cíl",
                                    color: DesignSystem.Colors.longTerm
                                ) {
                                    showAddMenu = false
                                    showAddGoalModal = true
                                }
                                
                                AddMenuButton(
                                    icon: "checkmark.circle.fill",
                                    title: "Krok",
                                    color: DesignSystem.Colors.primary
                                ) {
                                    showAddMenu = false
                                    showAddStepModal = true
                                }
                                
                                AddMenuButton(
                                    icon: "repeat.circle.fill",
                                    title: "Návyk",
                                    color: DesignSystem.Colors.mediumTerm
                                ) {
                                    showAddMenu = false
                                    showAddHabitModal = true
                                }
                            }
                            .padding(.horizontal, 40)
                            .padding(.bottom, 120)
                        }
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .sheet(isPresented: $showAddGoalModal) {
                    AddGoalModal(onGoalAdded: {})
                }
                .sheet(isPresented: $showAddStepModal) {
                    AddStepModal(onStepAdded: {})
                }
                .sheet(isPresented: $showAddHabitModal) {
                    AddHabitModal(onHabitAdded: {})
                }
            } else {
                // Authentication screen for unauthenticated users
                AuthView()
            }
        }
        .onAppear {
        }
    }
}

// MARK: - Add Menu Button Component
struct AddMenuButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.2))
                        .frame(width: 48, height: 48)
                    
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
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.Colors.surface)
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
