import SwiftUI

// MARK: - Design System
// Moderní designový systém podle Apple HIG a Liquid Glass principů

// Helper pro vytváření adaptivních barev (light/dark mode)
private func adaptiveColor(light: (CGFloat, CGFloat, CGFloat), dark: (CGFloat, CGFloat, CGFloat)) -> Color {
    Color(UIColor { traitCollection in
        switch traitCollection.userInterfaceStyle {
        case .dark:
            return UIColor(red: dark.0/255, green: dark.1/255, blue: dark.2/255, alpha: 1.0)
        default:
            return UIColor(red: light.0/255, green: light.1/255, blue: light.2/255, alpha: 1.0)
        }
    })
}

struct DesignSystem {
    
    // MARK: - Colors (konzistentní s webovou aplikací)
    // Podporuje dark mode s matnými barvami v "papírovém" stylu
    struct Colors {
        // Primary colors - teplá oranžová paleta (zachována v obou režimech)
        static let primary = adaptiveColor(
            light: (232, 135, 30),
            dark: (249, 168, 85) // Světlejší pro lepší kontrast
        )
        static let primaryLight = adaptiveColor(
            light: (249, 168, 85),
            dark: (255, 190, 120)
        )
        static let primaryDark = adaptiveColor(
            light: (209, 106, 10),
            dark: (232, 135, 30)
        )
        
        // Background colors - matné, papírové barvy
        static let background = adaptiveColor(
            light: (255, 250, 245),
            dark: (18, 18, 20) // Tmavě šedá, ne černá
        )
        static let surface = adaptiveColor(
            light: (255, 255, 255),
            dark: (28, 28, 30) // Tmavší šedá pro karty
        )
        static let surfaceSecondary = adaptiveColor(
            light: (249, 250, 251),
            dark: (38, 38, 42) // Ještě tmavší pro sekundární plochy
        )
        
        // Text colors - matné, ne příliš kontrastní
        static let textPrimary = adaptiveColor(
            light: (0, 0, 0),
            dark: (245, 245, 247) // Světle šedá, ne bílá
        )
        static let textSecondary = adaptiveColor(
            light: (107, 114, 128),
            dark: (174, 178, 186) // Středně šedá
        )
        static let textTertiary = adaptiveColor(
            light: (156, 163, 175),
            dark: (142, 147, 158) // Tmavší šedá
        )
        
        // Status colors - zachovány, ale upraveny pro dark mode
        static let success = adaptiveColor(
            light: (34, 197, 94),
            dark: (74, 222, 128) // Světlejší zelená
        )
        static let warning = adaptiveColor(
            light: (245, 158, 11),
            dark: (251, 191, 36) // Světlejší žlutá
        )
        static let error = adaptiveColor(
            light: (239, 68, 68),
            dark: (248, 113, 113) // Světlejší červená
        )
        static let info = adaptiveColor(
            light: (59, 130, 246),
            dark: (96, 165, 250) // Světlejší modrá
        )
        
        // Category colors - zachovány s úpravami pro dark mode
        static let shortTerm = adaptiveColor(
            light: (34, 197, 94),
            dark: (74, 222, 128)
        )
        static let mediumTerm = adaptiveColor(
            light: (59, 130, 246),
            dark: (96, 165, 250)
        )
        static let longTerm = adaptiveColor(
            light: (147, 51, 234),
            dark: (167, 85, 247) // Světlejší fialová
        )
        
        // Glass effect colors - adaptivní pro dark mode
        static var glassBackground: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor(red: 38/255, green: 38/255, blue: 42/255, alpha: 0.8)
                default:
                    return UIColor.white.withAlphaComponent(0.8)
                }
            })
        }
        static var glassBorder: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor.white.withAlphaComponent(0.1)
                default:
                    return UIColor.white.withAlphaComponent(0.2)
                }
            })
        }
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
    // V dark mode jsou stíny jemnější a méně viditelné
    struct Shadows {
        static var sm: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor.black.withAlphaComponent(0.2)
                default:
                    return UIColor.black.withAlphaComponent(0.05)
                }
            })
        }
        static var md: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor.black.withAlphaComponent(0.3)
                default:
                    return UIColor.black.withAlphaComponent(0.1)
                }
            })
        }
        static var lg: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor.black.withAlphaComponent(0.4)
                default:
                    return UIColor.black.withAlphaComponent(0.15)
                }
            })
        }
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
