import SwiftUI

// Widget Design System - matching main app's playful design
struct WidgetDesignSystem {
    // Primary color - default to app's primary color (#E8871E)
    // In widgets, we use a default since we can't access UserSettingsManager
    static let primaryColor = Color(red: 232/255, green: 135/255, blue: 30/255)
    static let primaryColorLight = Color(red: 255/255, green: 249/255, blue: 245/255) // Warm white with slight tint
    static let yellowGreen = Color(red: 179/255, green: 255/255, blue: 179/255)
    
    // Text colors (adaptive for dark mode)
    static var textPrimary: Color {
        Color.primary
    }
    
    static var textSecondary: Color {
        Color.secondary
    }
    
    // Background color (adaptive for dark mode)
    static var background: Color {
        Color(.systemBackground)
    }
    
    // Typography - using rounded design
    struct Typography {
        static func headline(size: CGFloat) -> Font {
            .system(size: size, weight: .semibold, design: .rounded)
        }
        
        static func body(size: CGFloat) -> Font {
            .system(size: size, weight: .regular, design: .rounded)
        }
        
        static func caption(size: CGFloat) -> Font {
            .system(size: size, weight: .regular, design: .rounded)
        }
        
        static func title(size: CGFloat) -> Font {
            .system(size: size, weight: .bold, design: .rounded)
        }
    }
    
    // Corner radius
    struct CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
    }
    
    // Spacing
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
    }
}

