import SwiftUI

// MARK: - Lucide Icon System
// Maps Lucide icon names to SF Symbols (similar outline style)

struct LucideIcon: View {
    let iconName: String?
    let size: CGFloat
    let color: Color
    
    init(_ iconName: String?, size: CGFloat = 20, color: Color = DesignSystem.Colors.textPrimary) {
        self.iconName = iconName
        self.size = size
        self.color = color
    }
    
    var body: some View {
        Image(systemName: sfSymbolName(for: iconName))
            .font(.system(size: size, weight: .regular))
            .foregroundColor(color)
    }
    
    // Map Lucide icon names to SF Symbols
    private func sfSymbolName(for iconName: String?) -> String {
        guard let iconName = iconName else {
            return "target" // Default
        }
        
        // Map Lucide icon names to SF Symbols
        let iconMap: [String: String] = [
            "Target": "target",
            "Trophy": "trophy.fill",
            "Star": "star.fill",
            "Heart": "heart.fill",
            "Zap": "bolt.fill",
            "BookOpen": "book.fill",
            "Dumbbell": "figure.strengthtraining.traditional",
            "Car": "car.fill",
            "Home": "house.fill",
            "Briefcase": "briefcase.fill",
            "GraduationCap": "graduationcap.fill",
            "Music": "music.note",
            "Camera": "camera.fill",
            "Plane": "airplane",
            "TreePine": "tree.fill",
            "Coffee": "cup.and.saucer.fill",
            "Gamepad2": "gamecontroller.fill",
            "Paintbrush": "paintbrush.fill",
            "Utensils": "fork.knife",
            "ShoppingBag": "bag.fill",
            "Smile": "face.smiling",
            "ThumbsUp": "hand.thumbsup.fill",
            "Sparkles": "sparkles",
            "Sun": "sun.max.fill",
            "Moon": "moon.fill",
            "Rainbow": "rainbow",
            "Droplets": "drop.fill",
            "Leaf": "leaf.fill",
            "Mountain": "mountain.2.fill",
            "Waves": "waveform",
            "Flower2": "flower",
            "Bird": "bird.fill",
            "Fish": "fish.fill",
            "Cat": "cat.fill",
            "Dog": "dog.fill",
            "Rabbit": "hare.fill",
            "Bot": "cpu",
            "Ghost": "eye",
            "Skull": "skull",
            "Crown": "crown.fill",
            "Gem": "diamond.fill",
            "Key": "key.fill",
            "Lock": "lock.fill",
            "Shield": "shield.fill",
            "Compass": "safari.fill",
            "Map": "map.fill",
            "Globe": "globe",
            "Flag": "flag.fill",
            "Medal": "medal.fill",
            "Award": "award.fill",
            "Gift": "gift.fill",
            "Cake": "birthday.cake.fill",
            "Cookie": "circle.fill",
            "Pizza": "circle.fill",
            "Apple": "applelogo",
            "Banana": "circle.fill",
            "Cherry": "circle.fill",
            "Grape": "circle.fill",
            "Carrot": "carrot.fill",
            "Activity": "chart.bar.fill",
            "HeartPulse": "heart.circle.fill",
            "Stethoscope": "cross.case.fill",
            "Pill": "pills.fill",
            "Cpu": "cpu",
            "Smartphone": "iphone",
            "Laptop": "laptopcomputer",
            "Code": "chevron.left.forwardslash.chevron.right",
            "Monitor": "desktopcomputer",
            "Wifi": "wifi",
            "DollarSign": "dollarsign.circle.fill",
            "TrendingUp": "chart.line.uptrend.xyaxis",
            "Banknote": "banknote.fill",
            "CreditCard": "creditcard.fill",
            "Wallet": "wallet.pass.fill",
            "Coins": "bitcoinsign.circle.fill",
            "Building": "building.2.fill",
            "Users": "person.2.fill",
            "LayoutDashboard": "square.grid.2x2.fill",
            "User": "person.fill",
            "MapPin": "mappin.circle.fill",
            "Phone": "phone.fill",
            "Mail": "envelope.fill"
        ]
        
        return iconMap[iconName] ?? "target" // Default to target if not found
    }
}

// Helper function to get Lucide icon
func getLucideIcon(_ iconName: String?, size: CGFloat = 20, color: Color = DesignSystem.Colors.textPrimary) -> some View {
    LucideIcon(iconName, size: size, color: color)
}

