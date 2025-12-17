import SwiftUI

struct WidgetSettingsView: View {
    @StateObject private var settingsManager = WidgetSettingsManager()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Header
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        ModernIcon(
                            systemName: "square.grid.3x3",
                            size: 60,
                            color: DesignSystem.Colors.primary,
                            backgroundColor: DesignSystem.Colors.primary.opacity(0.1)
                        )
                        
                        Text("Nastavení Widgetu")
                            .font(DesignSystem.Typography.title2)
                            .fontWeight(.bold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Vyberte typ obsahu, který se zobrazí ve widgetu")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, DesignSystem.Spacing.lg)
                    
                    // Widget Type Selection
                    VStack(spacing: DesignSystem.Spacing.md) {
                        ForEach(WidgetType.allCases, id: \.self) { widgetType in
                            WidgetTypeCard(
                                widgetType: widgetType,
                                isSelected: settingsManager.selectedWidgetType == widgetType
                            ) {
                                settingsManager.selectedWidgetType = widgetType
                                settingsManager.saveSettings()
                            }
                        }
                    }
                    
                    // Preview Section
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Náhled")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Widget se automaticky aktualizuje během několika minut")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, DesignSystem.Spacing.lg)
                    
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
        }
        .navigationTitle("Widget")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Hotovo") {
                    dismiss()
                }
            }
        }
    }
}

struct WidgetTypeCard: View {
    let widgetType: WidgetType
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignSystem.Spacing.md) {
                // Icon
                ModernIcon(
                    systemName: iconName,
                    size: 24,
                    color: isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.textSecondary,
                    backgroundColor: isSelected ? DesignSystem.Colors.primary.opacity(0.1) : DesignSystem.Colors.surfaceSecondary
                )
                
                // Content
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text(widgetType.displayName)
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.textPrimary)
                    
                    Text(widgetType.description)
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                        .multilineTextAlignment(.leading)
                }
                
                Spacer()
                
                // Selection indicator
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(DesignSystem.Colors.primary)
                        .font(.title2)
                }
            }
            .padding(DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(isSelected ? DesignSystem.Colors.primary.opacity(0.05) : DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(isSelected ? DesignSystem.Colors.primary : DesignSystem.Colors.outline.opacity(0.2), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private var iconName: String {
        switch widgetType {
        case .todaySteps:
            return "calendar.badge.checkmark"
        case .futureSteps:
            return "calendar.badge.clock"
        case .todayHabits:
            return "repeat.circle.fill"
        case .inspiration:
            return "lightbulb.fill"
        }
    }
}

#Preview {
    WidgetSettingsView()
}
