import SwiftUI

// MARK: - Dark Mode Support
extension DesignSystem.Colors {
    // Dynamic colors that adapt to light/dark mode
    static let adaptiveBackground = Color(UIColor.systemBackground)
    static let adaptiveSurface = Color(UIColor.secondarySystemBackground)
    static let adaptiveTextPrimary = Color(UIColor.label)
    static let adaptiveTextSecondary = Color(UIColor.secondaryLabel)
    static let adaptiveTextTertiary = Color(UIColor.tertiaryLabel)
    
    // Dark mode specific colors
    static let darkBackground = Color(red: 18/255, green: 18/255, blue: 18/255)
    static let darkSurface = Color(red: 28/255, green: 28/255, blue: 30/255)
    static let darkSurfaceSecondary = Color(red: 44/255, green: 44/255, blue: 46/255)
}

// MARK: - Accessibility Support
struct AccessibilitySupport {
    // Dynamic Type support
    static func adaptiveFont(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    // High contrast support
    static func adaptiveColor(light: Color, dark: Color) -> Color {
        return Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(dark)
            default:
                return UIColor(light)
            }
        })
    }
    
    // Reduced motion support
    static func adaptiveAnimation(duration: Double = 0.3) -> Animation {
        if UIAccessibility.isReduceMotionEnabled {
            return .linear(duration: 0.1)
        } else {
            return .easeInOut(duration: duration)
        }
    }
}

// MARK: - Enhanced Design System with Dark Mode
extension DesignSystem {
    struct AdaptiveColors {
        // Background colors
        static let background = Color(UIColor.systemBackground)
        static let surface = Color(UIColor.secondarySystemBackground)
        static let surfacePrimary = Color(UIColor.secondarySystemBackground)
        static let surfaceSecondary = Color(UIColor.tertiarySystemBackground)
        
        // Text colors
        static let textPrimary = Color(UIColor.label)
        static let textSecondary = Color(UIColor.secondaryLabel)
        static let textTertiary = Color(UIColor.tertiaryLabel)
        
        // Primary colors (keep consistent with web app)
        static let primary = Color(red: 232/255, green: 135/255, blue: 30/255)
        static let primaryLight = Color(red: 249/255, green: 168/255, blue: 85/255)
        static let primaryDark = Color(red: 209/255, green: 106/255, blue: 10/255)
        
        // Status colors
        static let success = Color(red: 34/255, green: 197/255, blue: 94/255)
        static let warning = Color(red: 245/255, green: 158/255, blue: 11/255)
        static let error = Color(red: 239/255, green: 68/255, blue: 68/255)
        static let info = Color(red: 59/255, green: 130/255, blue: 246/255)
        
        // Category colors
        static let shortTerm = Color(red: 34/255, green: 197/255, blue: 94/255)
        static let mediumTerm = Color(red: 59/255, green: 130/255, blue: 246/255)
        static let longTerm = Color(red: 147/255, green: 51/255, blue: 234/255)
        
        // Glass effect colors
        static let glassBackground = Color(UIColor.systemBackground).opacity(0.8)
        static let glassBorder = Color(UIColor.separator)
    }
    
    struct AdaptiveTypography {
        // Headers with Dynamic Type support
        static let largeTitle = Font.largeTitle.weight(.bold)
        static let title1 = Font.title.weight(.bold)
        static let title2 = Font.title2.weight(.semibold)
        static let title3 = Font.title3.weight(.semibold)
        
        // Body text with Dynamic Type support
        static let headline = Font.headline.weight(.semibold)
        static let body = Font.body
        static let callout = Font.callout
        static let subheadline = Font.subheadline
        static let footnote = Font.footnote
        static let caption = Font.caption
        static let caption2 = Font.caption2
        
        // Special serif font
        static let serif = Font.system(size: 16, weight: .regular, design: .serif)
    }
}

// MARK: - Enhanced Modern Card with Dark Mode Support
struct AdaptiveModernCard<Content: View>: View {
    let content: Content
    let cornerRadius: CGFloat
    let shadowColor: Color
    let shadowRadius: CGFloat
    
    init(
        cornerRadius: CGFloat = DesignSystem.CornerRadius.md,
        shadowColor: Color? = nil,
        shadowRadius: CGFloat = 8,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.cornerRadius = cornerRadius
        self.shadowColor = shadowColor ?? DesignSystem.AdaptiveColors.textPrimary.opacity(0.1)
        self.shadowRadius = shadowRadius
    }
    
    var body: some View {
        content
            .background(DesignSystem.AdaptiveColors.surface)
            .cornerRadius(cornerRadius)
            .shadow(color: shadowColor, radius: shadowRadius, x: 0, y: 2)
    }
}

// MARK: - Enhanced Progress Bar with Accessibility
struct AdaptiveModernProgressBar: View {
    let progress: Double
    let height: CGFloat
    let backgroundColor: Color
    let foregroundColor: Color
    let cornerRadius: CGFloat
    let accessibilityLabel: String
    
    init(
        progress: Double,
        height: CGFloat = 8,
        backgroundColor: Color? = nil,
        foregroundColor: Color = DesignSystem.AdaptiveColors.primary,
        cornerRadius: CGFloat = 4,
        accessibilityLabel: String? = nil
    ) {
        self.progress = max(0, min(1, progress))
        self.height = height
        self.backgroundColor = backgroundColor ?? DesignSystem.AdaptiveColors.surfaceSecondary
        self.foregroundColor = foregroundColor
        self.cornerRadius = cornerRadius
        self.accessibilityLabel = accessibilityLabel ?? "Progress \(Int(progress * 100)) percent"
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(backgroundColor)
                    .frame(height: height)
                
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(foregroundColor)
                    .frame(width: geometry.size.width * progress, height: height)
                    .animation(AccessibilitySupport.adaptiveAnimation(), value: progress)
            }
        }
        .frame(height: height)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityValue("\(Int(progress * 100)) percent complete")
    }
}

// MARK: - Enhanced Status Badge with Accessibility
struct AdaptiveStatusBadge: View {
    let text: String
    let color: Color
    let backgroundColor: Color
    
    init(text: String, color: Color, backgroundColor: Color) {
        self.text = text
        self.color = color
        self.backgroundColor = backgroundColor
    }
    
    var body: some View {
        Text(text)
            .font(DesignSystem.AdaptiveTypography.caption)
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, DesignSystem.Spacing.sm)
            .padding(.vertical, DesignSystem.Spacing.xs)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                    .fill(backgroundColor)
            )
            .accessibilityLabel("Status: \(text)")
    }
}

// MARK: - Enhanced Modern Icon with Accessibility
struct AdaptiveModernIcon: View {
    let systemName: String
    let size: CGFloat
    let color: Color
    let backgroundColor: Color?
    let accessibilityLabel: String?
    
    init(
        systemName: String,
        size: CGFloat = 20,
        color: Color = DesignSystem.AdaptiveColors.textPrimary,
        backgroundColor: Color? = nil,
        accessibilityLabel: String? = nil
    ) {
        self.systemName = systemName
        self.size = size
        self.color = color
        self.backgroundColor = backgroundColor
        self.accessibilityLabel = accessibilityLabel
    }
    
    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: size, weight: .medium))
            .foregroundColor(color)
            .frame(width: size + DesignSystem.Spacing.sm, height: size + DesignSystem.Spacing.sm)
            .background(
                backgroundColor.map { bgColor in
                    Circle()
                        .fill(bgColor)
                }
            )
            .accessibilityLabel(accessibilityLabel ?? systemName)
    }
}

// MARK: - Enhanced Button Styles with Accessibility
struct AdaptivePrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignSystem.AdaptiveTypography.headline)
            .foregroundColor(.white)
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.AdaptiveColors.primary)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(AccessibilitySupport.adaptiveAnimation(duration: 0.1), value: configuration.isPressed)
            .accessibilityHint("Double tap to activate")
    }
}

struct AdaptiveSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignSystem.AdaptiveTypography.headline)
            .foregroundColor(DesignSystem.AdaptiveColors.primary)
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(DesignSystem.AdaptiveColors.primary, lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(AccessibilitySupport.adaptiveAnimation(duration: 0.1), value: configuration.isPressed)
            .accessibilityHint("Double tap to activate")
    }
}

// MARK: - Enhanced Empty State with Accessibility
struct AdaptiveEmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    let actionTitle: String?
    let action: (() -> Void)?
    
    init(
        icon: String,
        title: String,
        subtitle: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.actionTitle = actionTitle
        self.action = action
    }
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.lg) {
            AdaptiveModernIcon(
                systemName: icon,
                size: 48,
                color: DesignSystem.AdaptiveColors.textTertiary,
                backgroundColor: DesignSystem.AdaptiveColors.surfaceSecondary,
                accessibilityLabel: "Empty state icon"
            )
            
            VStack(spacing: DesignSystem.Spacing.sm) {
                Text(title)
                    .font(DesignSystem.AdaptiveTypography.title3)
                    .foregroundColor(DesignSystem.AdaptiveColors.textPrimary)
                    .multilineTextAlignment(.center)
                
                Text(subtitle)
                    .font(DesignSystem.AdaptiveTypography.body)
                    .foregroundColor(DesignSystem.AdaptiveColors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                }
                .buttonStyle(AdaptivePrimaryButtonStyle())
                .accessibilityHint("Double tap to \(actionTitle.lowercased())")
            }
        }
        .padding(DesignSystem.Spacing.xl)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title). \(subtitle)")
    }
}

// MARK: - Enhanced Loading State with Accessibility
struct AdaptiveLoadingView: View {
    let message: String
    
    init(message: String = "Načítám...") {
        self.message = message
    }
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(DesignSystem.AdaptiveColors.primary)
                .accessibilityLabel("Loading")
            
            Text(message)
                .font(DesignSystem.AdaptiveTypography.body)
                .foregroundColor(DesignSystem.AdaptiveColors.textSecondary)
                .accessibilityLabel(message)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
    }
}
