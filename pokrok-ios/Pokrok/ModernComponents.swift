import SwiftUI

// MARK: - Modern Goal Card Component
struct ModernGoalCard: View {
    let goal: Goal
    let onTap: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        HStack {
                            Text(goal.title)
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                                .lineLimit(2)
                            
                            if let icon = goal.icon {
                                LucideIcon(icon, size: 24, color: DesignSystem.Colors.dynamicPrimary)
                            }
                        }
                        
                        if let description = goal.description, !description.isEmpty {
                            Text(description)
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .lineLimit(2)
                        }
                    }
                    
                    Spacer()
                    
                    // Action buttons
                    HStack(spacing: DesignSystem.Spacing.xs) {
                        Button(action: onEdit) {
                            ModernIcon(
                                systemName: "pencil",
                                size: 16,
                                color: DesignSystem.Colors.textTertiary
                            )
                        }
                        
                        Button(action: onDelete) {
                            ModernIcon(
                                systemName: "trash",
                                size: 16,
                                color: DesignSystem.Colors.error
                            )
                        }
                    }
                }
                
                // Progress section
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                    HStack {
                        Text("Pokrok")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                        
                        Spacer()
                        
                        Text("\(goal.progressPercentage)%")
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }
                    
                    ModernProgressBar(
                        progress: Double(goal.progressPercentage) / 100,
                        height: 6,
                        foregroundColor: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary
                    )
                }
                
                // Footer
                HStack {
                    if let targetDate = goal.targetDate {
                        HStack(spacing: DesignSystem.Spacing.xs) {
                            ModernIcon(
                                systemName: "calendar",
                                size: 12,
                                color: DesignSystem.Colors.textTertiary
                            )
                            Text("Do: \(targetDate, style: .date)")
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                        }
                    }
                    
                    Spacer()
                    
                    StatusBadge(
                        text: goal.status == "completed" ? "Dokončeno" : "Aktivní",
                        color: goal.status == "completed" ? DesignSystem.Colors.success : DesignSystem.Colors.primary,
                        backgroundColor: goal.status == "completed" ? DesignSystem.Colors.success.opacity(0.1) : DesignSystem.Colors.primary.opacity(0.1)
                    )
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
        .onTapGesture {
            onTap()
        }
    }
}

// MARK: - Modern Step Card Component
struct ModernStepCard: View {
    let step: DailyStep
    let goalTitle: String?
    let isOverdue: Bool
    let isFuture: Bool
    let onToggle: () -> Void
    
    @State private var isAnimating = false
    
    private var borderColor: Color {
        if step.completed {
            return DesignSystem.Colors.success.opacity(0.2)
        } else if isOverdue {
            return DesignSystem.Colors.error.opacity(0.2)
        } else if isFuture {
            return DesignSystem.Colors.textSecondary.opacity(0.2)
        } else {
            return DesignSystem.Colors.primary.opacity(0.2)
        }
    }
    
    private var backgroundColor: Color {
        if step.completed {
            return DesignSystem.Colors.success.opacity(0.08)
        } else if isOverdue {
            return DesignSystem.Colors.error.opacity(0.08)
        } else if isFuture {
            return DesignSystem.Colors.textSecondary.opacity(0.08)
        } else {
            return DesignSystem.Colors.primary.opacity(0.08)
        }
    }
    
    private var statusText: String {
        if step.completed {
            return "Dokončeno"
        } else if isOverdue {
            return "Zpožděno"
        } else if isFuture {
            return "Budoucí"
        } else {
            return "Čekající"
        }
    }
    
    private var statusColor: Color {
        if step.completed {
            return DesignSystem.Colors.success
        } else if isOverdue {
            return DesignSystem.Colors.error
        } else if isFuture {
            return DesignSystem.Colors.textSecondary
        } else {
            return DesignSystem.Colors.primary
        }
    }
    
    private var textColor: Color {
        if isFuture {
            return DesignSystem.Colors.textSecondary
        } else {
            return DesignSystem.Colors.textPrimary
        }
    }
    
    var body: some View {
        NavigationLink(destination: StepDetailView(step: step)) {
            ModernCard(
                backgroundColor: backgroundColor,
                shadowColor: isOverdue ? DesignSystem.Colors.error.opacity(0.2) : DesignSystem.Shadows.sm
            ) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    // Checkbox
                    Button(action: {
                        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                            isAnimating = true
                        }
                        
                        // Reset animation after completion
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                            isAnimating = false
                        }
                        
                        onToggle()
                    }) {
                        Image(systemName: step.completed ? "checkmark.circle.fill" : "circle")
                            .font(.title2)
                            .foregroundColor(statusColor)
                            .scaleEffect(isAnimating ? 1.3 : 1.0)
                            .background(
                                Circle()
                                    .fill(isAnimating ? statusColor.opacity(0.2) : Color.clear)
                                    .scaleEffect(isAnimating ? 1.5 : 1.0)
                                    .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isAnimating)
                            )
                            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isAnimating)
                    }
                    .buttonStyle(PlainButtonStyle())
                    
                    // Content
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text(step.title)
                            .font(DesignSystem.Typography.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(textColor)
                            .strikethrough(step.completed)
                            .lineLimit(2)
                        
                        if let description = step.description, !description.isEmpty {
                            Text(description)
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .lineLimit(2)
                        }
                        
                        HStack {
                            if let goalTitle = goalTitle {
                                HStack(spacing: DesignSystem.Spacing.xs) {
                                    ModernIcon(
                                        systemName: "target",
                                        size: 10,
                                        color: DesignSystem.Colors.textTertiary
                                    )
                                    Text(goalTitle)
                                        .font(DesignSystem.Typography.caption2)
                                        .foregroundColor(DesignSystem.Colors.textSecondary)
                                }
                            }
                            
                            Spacer()
                            
                            if let stepDate = step.date {
                                Text(stepDate, style: .date)
                                .font(DesignSystem.Typography.caption2)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                            }
                        }
                    }
                    
                    Spacer()
                    
                    // Status indicator
                    VStack {
                        StatusBadge(
                            text: statusText,
                            color: statusColor,
                            backgroundColor: statusColor.opacity(0.1)
                        )
                        
                        Spacer()
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Category Header Component
struct CategoryHeader: View {
    let title: String
    let icon: String
    let count: Int
    let color: Color
    
    var body: some View {
        HStack {
            HStack(spacing: DesignSystem.Spacing.sm) {
                Text(icon)
                    .font(.title2)
                
                Text(title)
                    .font(DesignSystem.Typography.title3)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
            }
            
            Spacer()
            
            StatusBadge(
                text: "\(count) cílů",
                color: color,
                backgroundColor: color.opacity(0.1)
            )
        }
        .padding(.horizontal, DesignSystem.Spacing.md)
        .padding(.vertical, DesignSystem.Spacing.sm)
    }
}

// MARK: - Stats Card Component
struct StatsCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        ModernCard {
            VStack(spacing: DesignSystem.Spacing.sm) {
                ModernIcon(
                    systemName: icon,
                    size: 24,
                    color: color,
                    backgroundColor: color.opacity(0.1)
                )
                
                Text(value)
                    .font(DesignSystem.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text(title)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
}

// MARK: - Floating Action Button
struct FloatingActionButton: View {
    let icon: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(
                    Circle()
                        .fill(DesignSystem.Colors.primary)
                        .shadow(color: DesignSystem.Shadows.md, radius: 8, x: 0, y: 4)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Section Header Component
struct SectionHeader: View {
    let title: String
    let subtitle: String?
    let actionTitle: String?
    let action: (() -> Void)?
    
    init(
        title: String,
        subtitle: String? = nil,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.actionTitle = actionTitle
        self.action = action
    }
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                Text(title)
                    .font(DesignSystem.Typography.title3)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            
            Spacer()
            
            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.primary)
                }
            }
        }
        .padding(.horizontal, DesignSystem.Spacing.md)
        .padding(.vertical, DesignSystem.Spacing.sm)
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignSystem.Spacing.sm) {
                ModernIcon(
                    systemName: icon,
                    size: 20,
                    color: color,
                    backgroundColor: color.opacity(0.1)
                )
                
                Text(title)
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.medium)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(DesignSystem.Spacing.md)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
