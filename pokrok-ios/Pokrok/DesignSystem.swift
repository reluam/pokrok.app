import SwiftUI

// MARK: - Color Extension for Hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
    
    // Mix color s jinou barvou
    func mix(with color: Color, by ratio: Double) -> Color {
        let ratio = max(0, min(1, ratio))
        let uiColor1 = UIColor(self)
        let uiColor2 = UIColor(color)
        
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0, a1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0, a2: CGFloat = 0
        
        uiColor1.getRed(&r1, green: &g1, blue: &b1, alpha: &a1)
        uiColor2.getRed(&r2, green: &g2, blue: &b2, alpha: &a2)
        
        return Color(
            .sRGB,
            red: Double(r1 * (1 - ratio) + r2 * ratio),
            green: Double(g1 * (1 - ratio) + g2 * ratio),
            blue: Double(b1 * (1 - ratio) + b2 * ratio),
            opacity: Double(a1 * (1 - ratio) + a2 * ratio)
        )
    }
}

// MARK: - Design System
// Playful animated style design system podle REDESIGN_STRUCTURE.md

// Helper pro vytváření adaptivních barev (light/dark mode)
// POZNÁMKA: Nový design používá světlé barvy konzistentně, ale zachováváme podporu dark mode pro přístupnost
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
    
    // MARK: - Colors (Playful Animated Style)
    // Pastel barvy s tmavě hnědými obrysy podle REDESIGN_STRUCTURE.md
    struct Colors {
        // MARK: Primary Pastel Colors
        struct Playful {
            // Pink
            static let pinkLight = Color(hex: "#FFE5E5")
            static let pink = Color(hex: "#FFB3BA")
            static let pinkDark = Color(hex: "#FF9AA2")
            
            // Yellow-Green
            static let yellowGreenLight = Color(hex: "#E5FFE5")
            static let yellowGreen = Color(hex: "#B3FFB3")
            static let yellowGreenDark = Color(hex: "#9AFF9A")
            
            // Purple
            static let purpleLight = Color(hex: "#E5E5FF")
            static let purple = Color(hex: "#B3B3FF")
            static let purpleDark = Color(hex: "#9A9AFF")
            
            // Yellow
            static let yellowLight = Color(hex: "#FFF9E5")
            static let yellow = Color(hex: "#FFE5B3")
        }
        
        // MARK: Outline & Text Colors
        // Adaptive colors: dark brown in light mode, light in dark mode
        static let outline: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 228.0/255.0, green: 228.0/255.0, blue: 231.0/255.0, alpha: 1.0) // Lighter gray outline for better visibility
            default:
                return UIColor(red: 93.0/255.0, green: 64.0/255.0, blue: 55.0/255.0, alpha: 1.0) // Dark brown outline
            }
        })
        
        static let textPrimary: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 244.0/255.0, green: 244.0/255.0, blue: 245.0/255.0, alpha: 1.0) // Light text
            default:
                return UIColor(red: 93.0/255.0, green: 64.0/255.0, blue: 55.0/255.0, alpha: 1.0) // Dark brown text
            }
        })
        
        static let textSecondary: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 190.0/255.0, green: 190.0/255.0, blue: 195.0/255.0, alpha: 1.0) // Lighter gray text for better readability
            default:
                return UIColor(red: 141.0/255.0, green: 110.0/255.0, blue: 99.0/255.0, alpha: 1.0) // Lighter brown text
            }
        })
        
        static let textLight: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 161.0/255.0, green: 161.0/255.0, blue: 170.0/255.0, alpha: 1.0) // Medium gray text for better readability
            default:
                return UIColor(red: 161.0/255.0, green: 136.0/255.0, blue: 127.0/255.0, alpha: 1.0) // Light brown text
            }
        })
        
        // MARK: Background Colors
        // Adaptive backgrounds: light in light mode, dark in dark mode
        static let background: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 10.0/255.0, green: 10.0/255.0, blue: 12.0/255.0, alpha: 1.0) // Very dark background for better contrast
            default:
                return UIColor(red: 255.0/255.0, green: 249.0/255.0, blue: 245.0/255.0, alpha: 1.0) // Warm white with slight yellow tint
            }
        })
        
        static let surface: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 24.0/255.0, green: 24.0/255.0, blue: 27.0/255.0, alpha: 1.0) // Dark surface with better contrast
            default:
                return UIColor.white
            }
        })
        
        static let surfaceSecondary: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 39.0/255.0, green: 39.0/255.0, blue: 42.0/255.0, alpha: 1.0) // Slightly lighter surface for better readability
            default:
                return UIColor(red: 255.0/255.0, green: 245.0/255.0, blue: 240.0/255.0, alpha: 1.0) // Very light pink tint
            }
        })
        
        // MARK: Legacy Colors (deprecated - keeping for backward compatibility during migration)
        // Primary colors - oranžová barva z webu (#E8871E) jako default
        static let primary = Color(hex: "#E8871E")
        static let primaryLight = Color(hex: "#F68B1D")
        static let primaryDark = Color(hex: "#D16A0A")
        
        // Helper pro získání primary color z UserSettings nebo default
        static func primaryColor(from userSettings: UserSettings?) -> Color {
            if let colorHex = userSettings?.primaryColor {
                return Color(hex: colorHex)
            }
            return primary
        }
        
        // Dynamická primary color z UserSettingsManager
        // POZNÁMKA: Toto není reaktivní - pro reaktivní barvu použijte PrimaryColorView nebo pozorujte UserSettingsManager
        static var dynamicPrimary: Color {
            return UserSettingsManager.shared.primaryColor
        }
        
        // Dynamická primary light color (světlejší verze primary barvy)
        static var dynamicPrimaryLight: Color {
            let hex = UserSettingsManager.shared.primaryColorHex
            let primaryColor = Color(hex: hex)
            return Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    // Dark mode: mix with dark surface instead of white
                    let darkSurface = Color(red: 39.0/255.0, green: 39.0/255.0, blue: 42.0/255.0)
                    return UIColor(primaryColor.mix(with: darkSurface, by: 0.6)) // Less mixing for better visibility
                default:
                    // Light mode: mix with white
                    return UIColor(primaryColor.mix(with: .white, by: 0.7))
                }
            })
        }
        
        // Dynamická primary dark color (tmavší verze primary barvy)
        static var dynamicPrimaryDark: Color {
            let hex = UserSettingsManager.shared.primaryColorHex
            // Vytvoříme tmavší verzi mixováním s černou (mix 80% primary + 20% černá)
            return Color(hex: hex).mix(with: .black, by: 0.2)
        }
        
        // Helper pro získání primary color z environment object (reaktivní)
        static func primaryColor(from settingsManager: UserSettingsManager) -> Color {
            return settingsManager.primaryColor
        }
        
        // Helper pro získání primary color hex z environment object (reaktivní)
        static func primaryColorHex(from settingsManager: UserSettingsManager) -> String {
            return settingsManager.primaryColorHex
        }
        
        // Legacy text colors (mapped to brown)
        static let textTertiary = textLight
        
        // MARK: Status Colors (mapped to playful colors)
        static let success = Playful.yellowGreen
        static let warning = Playful.yellow
        static let error = dynamicPrimary // Používá primary color místo růžové
        static let info = Playful.purple
        
        // MARK: State-specific colors (matching web design)
        // Primary light - for completed items (bg-primary-100)
        static var primaryLightBackground: Color {
            let primaryColor = UserSettingsManager.shared.primaryColor
            return Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    // Dark mode: mix with dark surface for better visibility
                    let darkBg = Color(red: 39.0/255.0, green: 39.0/255.0, blue: 42.0/255.0)
                    return UIColor(primaryColor.mix(with: darkBg, by: 0.25)) // Increased opacity for better visibility
                default:
                    // Light mode: mix with white
                    return UIColor(primaryColor.mix(with: .white, by: 0.85))
                }
            })
        }
        
        // Red light - for overdue items (bg-red-50)
        static let redLight: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 80.0/255.0, green: 25.0/255.0, blue: 25.0/255.0, alpha: 1.0) // Slightly lighter dark red for better visibility
            default:
                return UIColor(red: 254.0/255.0, green: 242.0/255.0, blue: 242.0/255.0, alpha: 1.0) // Light red
            }
        })
        
        // Gray borders for future/not scheduled items
        static let grayBorder: Color = Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(red: 82.0/255.0, green: 82.0/255.0, blue: 91.0/255.0, alpha: 1.0) // Lighter gray border for better visibility
            default:
                return UIColor(red: 156.0/255.0, green: 163.0/255.0, blue: 175.0/255.0, alpha: 1.0) // Light gray border (gray-400)
            }
        })
        
        // MARK: Category Colors (mapped to playful colors)
        static let shortTerm = Playful.yellowGreen
        static let mediumTerm = Playful.purple
        static let longTerm = dynamicPrimary // Používá primary color místo růžové
        
        // MARK: Glass Effect Colors (for GlassEffect component)
        static var glassBackground: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor(red: 39.0/255.0, green: 39.0/255.0, blue: 42.0/255.0, alpha: 0.9) // Dark glass with better visibility
                default:
                    return UIColor.white.withAlphaComponent(0.8) // Light glass
                }
            })
        }
        static var glassBorder: Color {
            Color(UIColor { traitCollection in
                switch traitCollection.userInterfaceStyle {
                case .dark:
                    return UIColor(red: 82.0/255.0, green: 82.0/255.0, blue: 91.0/255.0, alpha: 0.5) // Lighter border for better visibility
                default:
                    return UIColor.white.withAlphaComponent(0.2) // Light border
                }
            })
        }
    }
    
    // MARK: - Typography (Playful Style)
    // Using system fonts with rounded design for playful feel
    // Note: Comic Neue is not available in iOS, using SF Rounded where possible
    struct Typography {
        // Headers - Bold, playful feel
        static let largeTitle = Font.system(size: 34, weight: .bold, design: .rounded)
        static let title1 = Font.system(size: 28, weight: .bold, design: .rounded)
        static let title2 = Font.system(size: 22, weight: .semibold, design: .rounded)
        static let title3 = Font.system(size: 20, weight: .semibold, design: .rounded)
        
        // Body text - Regular, playful feel
        static let headline = Font.system(size: 17, weight: .semibold, design: .rounded)
        static let body = Font.system(size: 17, weight: .regular, design: .rounded)
        static let callout = Font.system(size: 16, weight: .regular, design: .rounded)
        static let subheadline = Font.system(size: 15, weight: .regular, design: .rounded)
        static let footnote = Font.system(size: 13, weight: .regular, design: .rounded)
        static let caption = Font.system(size: 12, weight: .regular, design: .rounded)
        static let caption2 = Font.system(size: 11, weight: .regular, design: .rounded)
        
        // Special - Serif for quotes/descriptions (if needed)
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
    // Playful shadows for buttons and cards with offset for highlight effect (matching web design)
    struct Shadows {
        // Standard shadows
        static let sm = Color.black.opacity(0.1)
        static let md = Color.black.opacity(0.15)
        static let lg = Color.black.opacity(0.2)
        
        // Offset shadow effect (3px 3px offset) - matching web's box-playful-highlight
        // Used for cards and buttons to create the "shadow box" effect
        static var offsetShadow: Color {
            DesignSystem.Colors.dynamicPrimary.opacity(1.0)
        }
        static let offsetShadowX: CGFloat = 3
        static let offsetShadowY: CGFloat = 3
        
        // Button highlight shadow (offset shadow for playful effect)
        static var buttonHighlight: Color {
            DesignSystem.Colors.dynamicPrimary.opacity(1.0)
        }
        static let buttonHighlightOffset: CGFloat = 3
        static let buttonHighlightRadius: CGFloat = 0 // No blur for offset shadow
        
        // Card shadow (offset shadow matching web)
        static var card: Color {
            DesignSystem.Colors.dynamicPrimary.opacity(1.0)
        }
        static let cardRadius: CGFloat = 0 // No blur for offset shadow
        static let cardOffsetX: CGFloat = 3
        static let cardOffsetY: CGFloat = 3
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
