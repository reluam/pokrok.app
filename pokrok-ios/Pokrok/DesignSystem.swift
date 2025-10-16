import SwiftUI

// MARK: - Design System
// Moderní designový systém podle Apple HIG a Liquid Glass principů

struct DesignSystem {
    
    // MARK: - Colors (konzistentní s webovou aplikací)
    struct Colors {
        // Primary colors - teplá oranžová paleta
        static let primary = Color(red: 232/255, green: 135/255, blue: 30/255)
        static let primaryLight = Color(red: 249/255, green: 168/255, blue: 85/255)
        static let primaryDark = Color(red: 209/255, green: 106/255, blue: 10/255)
        
        // Background colors
        static let background = Color(red: 255/255, green: 250/255, blue: 245/255)
        static let surface = Color.white
        static let surfaceSecondary = Color(red: 249/255, green: 250/255, blue: 251/255)
        
        // Text colors
        static let textPrimary = Color.black
        static let textSecondary = Color(red: 107/255, green: 114/255, blue: 128/255)
        static let textTertiary = Color(red: 156/255, green: 163/255, blue: 175/255)
        
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
        static let glassBackground = Color.white.opacity(0.8)
        static let glassBorder = Color.white.opacity(0.2)
    }
    
    // MARK: - Typography (konzistentní s webovou aplikací)
    struct Typography {
        // Headers - Poppins style
        static let largeTitle = Font.system(size: 34, weight: .bold, design: .default)
        static let title1 = Font.system(size: 28, weight: .bold, design: .default)
        static let title2 = Font.system(size: 22, weight: .semibold, design: .default)
        static let title3 = Font.system(size: 20, weight: .semibold, design: .default)
        
        // Body text - Inter style
        static let headline = Font.system(size: 17, weight: .semibold, design: .default)
        static let body = Font.system(size: 17, weight: .regular, design: .default)
        static let callout = Font.system(size: 16, weight: .regular, design: .default)
        static let subheadline = Font.system(size: 15, weight: .regular, design: .default)
        static let footnote = Font.system(size: 13, weight: .regular, design: .default)
        static let caption = Font.system(size: 12, weight: .regular, design: .default)
        static let caption2 = Font.system(size: 11, weight: .regular, design: .default)
        
        // Special - Asul style for quotes/descriptions
        static let serif = Font.system(size: 16, weight: .regular, design: .serif)
    }
    
    // MARK: - Spacing
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    struct CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 24
    }
    
    // MARK: - Shadows
    struct Shadows {
        static let sm = Color.black.opacity(0.05)
        static let md = Color.black.opacity(0.1)
        static let lg = Color.black.opacity(0.15)
    }
}

// MARK: - Modern Card Component
struct ModernCard<Content: View>: View {
    let content: Content
    let backgroundColor: Color
    let cornerRadius: CGFloat
    let shadowColor: Color
    let shadowRadius: CGFloat
    
    init(
        backgroundColor: Color = DesignSystem.Colors.surface,
        cornerRadius: CGFloat = DesignSystem.CornerRadius.md,
        shadowColor: Color = DesignSystem.Shadows.sm,
        shadowRadius: CGFloat = 8,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.backgroundColor = backgroundColor
        self.cornerRadius = cornerRadius
        self.shadowColor = shadowColor
        self.shadowRadius = shadowRadius
    }
    
    var body: some View {
        content
            .background(backgroundColor)
            .cornerRadius(cornerRadius)
            .shadow(color: shadowColor, radius: shadowRadius, x: 0, y: 2)
    }
}

// MARK: - Glass Effect Component
struct GlassEffect<Content: View>: View {
    let content: Content
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.Colors.glassBackground)
                    .overlay(
                        RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                            .stroke(DesignSystem.Colors.glassBorder, lineWidth: 1)
                    )
            )
    }
}

// MARK: - Progress Bar Component
struct ModernProgressBar: View {
    let progress: Double
    let height: CGFloat
    let backgroundColor: Color
    let foregroundColor: Color
    let cornerRadius: CGFloat
    
    init(
        progress: Double,
        height: CGFloat = 8,
        backgroundColor: Color = DesignSystem.Colors.surfaceSecondary,
        foregroundColor: Color = DesignSystem.Colors.primary,
        cornerRadius: CGFloat = 4
    ) {
        self.progress = max(0, min(1, progress))
        self.height = height
        self.backgroundColor = backgroundColor
        self.foregroundColor = foregroundColor
        self.cornerRadius = cornerRadius
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
                    .animation(.easeInOut(duration: 0.3), value: progress)
            }
        }
        .frame(height: height)
    }
}

// MARK: - Status Badge Component
struct StatusBadge: View {
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
            .font(DesignSystem.Typography.caption)
            .fontWeight(.medium)
            .foregroundColor(color)
            .padding(.horizontal, DesignSystem.Spacing.sm)
            .padding(.vertical, DesignSystem.Spacing.xs)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                    .fill(backgroundColor)
            )
    }
}

// MARK: - Icon Component
struct ModernIcon: View {
    let systemName: String
    let size: CGFloat
    let color: Color
    let backgroundColor: Color?
    
    init(
        systemName: String,
        size: CGFloat = 20,
        color: Color = DesignSystem.Colors.textPrimary,
        backgroundColor: Color? = nil
    ) {
        self.systemName = systemName
        self.size = size
        self.color = color
        self.backgroundColor = backgroundColor
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
    }
}

// MARK: - Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignSystem.Typography.headline)
            .foregroundColor(.white)
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .fill(DesignSystem.Colors.primary)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(DesignSystem.Typography.headline)
            .foregroundColor(DesignSystem.Colors.primary)
            .padding(.horizontal, DesignSystem.Spacing.lg)
            .padding(.vertical, DesignSystem.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                    .stroke(DesignSystem.Colors.primary, lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// MARK: - Empty State Component
struct EmptyStateView: View {
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
            ModernIcon(
                systemName: icon,
                size: 48,
                color: DesignSystem.Colors.textTertiary,
                backgroundColor: DesignSystem.Colors.surfaceSecondary
            )
            
            VStack(spacing: DesignSystem.Spacing.sm) {
                Text(title)
                    .font(DesignSystem.Typography.title3)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text(subtitle)
                    .font(DesignSystem.Typography.body)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            
            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding(DesignSystem.Spacing.xl)
    }
}

// MARK: - Loading State Component
struct LoadingView: View {
    let message: String
    
    init(message: String = "Načítám...") {
        self.message = message
    }
    
    var body: some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            ProgressView()
                .scaleEffect(1.2)
                .tint(DesignSystem.Colors.primary)
            
            Text(message)
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
