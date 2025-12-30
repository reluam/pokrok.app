import SwiftUI

// MARK: - Icon Utilities
struct IconUtils {
    // Map icon names to emojis (matching web app)
    static let iconToEmoji: [String: String] = [
        "Target": "🎯",
        "Trophy": "🏆",
        "Star": "⭐",
        "Heart": "❤️",
        "Zap": "⚡",
        "BookOpen": "📖",
        "Dumbbell": "🏋️",
        "Car": "🚗",
        "Home": "🏠",
        "Briefcase": "💼",
        "GraduationCap": "🎓",
        "Music": "🎵",
        "Camera": "📷",
        "Plane": "✈️",
        "TreePine": "🌲",
        "Coffee": "☕",
        "Gamepad2": "🎮",
        "Paintbrush": "🎨",
        "Utensils": "🍽️",
        "ShoppingBag": "🛍️",
        "Smile": "😊",
        "Laugh": "😂",
        "ThumbsUp": "👍",
        "Sparkles": "✨",
        "Sun": "☀️",
        "Moon": "🌙",
        "Rainbow": "🌈",
        "Droplets": "💧",
        "Leaf": "🍃",
        "Mountain": "🏔️",
        "Waves": "🌊",
        "Flower2": "🌸",
        "Bird": "🐦",
        "Fish": "🐟",
        "Cat": "🐱",
        "Dog": "🐶",
        "Rabbit": "🐰",
        "Bot": "🤖",
        "Ghost": "👻",
        "Skull": "💀",
        "Crown": "👑",
        "Gem": "💎",
        "Key": "🗝️",
        "Lock": "🔒",
        "Shield": "🛡️",
        "Compass": "🧭",
        "Map": "🗺️",
        "Globe": "🌍",
        "Flag": "🏳️",
        "Medal": "🏅",
        "Award": "🏆",
        "Gift": "🎁",
        "Cake": "🎂",
        "Cookie": "🍪",
        "Pizza": "🍕",
        "Apple": "🍎",
        "Banana": "🍌",
        "Cherry": "🍒",
        "Grape": "🍇",
        "Carrot": "🥕",
        "Activity": "📊",
        "HeartPulse": "💓",
        "Stethoscope": "🩺",
        "Pill": "💊",
        "Cpu": "💻",
        "Smartphone": "📱",
        "Laptop": "💻",
        "Code": "💻",
        "Monitor": "🖥️",
        "Wifi": "📶",
        "DollarSign": "💵",
        "TrendingUp": "📈",
        "Banknote": "💵",
        "CreditCard": "💳",
        "Wallet": "💰",
        "Coins": "🪙",
        "Building": "🏢",
        "Users": "👥",
        "LayoutDashboard": "📊",
        "User": "👤",
        "MapPin": "📍",
        "Phone": "📞",
        "Mail": "✉️"
    ]
    
    // Available icons with labels (matching web app)
    static let availableIcons: [(name: String, emoji: String, label: String)] = [
        ("Target", "🎯", "Cíl"),
        ("User", "👤", "Uživatel"),
        ("Home", "🏠", "Domov"),
        ("MapPin", "📍", "Lokace"),
        ("Phone", "📞", "Telefon"),
        ("Globe", "🌍", "Globus"),
        ("Mail", "✉️", "Email"),
        ("Heart", "❤️", "Srdce"),
        ("Star", "⭐", "Hvězda"),
        ("Trophy", "🏆", "Trofej"),
        ("Briefcase", "💼", "Aktovka"),
        ("GraduationCap", "🎓", "Vzdělání"),
        ("BookOpen", "📖", "Kniha"),
        ("Music", "🎵", "Hudba"),
        ("Camera", "📷", "Fotoaparát"),
        ("Plane", "✈️", "Letadlo"),
        ("Car", "🚗", "Auto"),
        ("Dumbbell", "🏋️", "Cvičení"),
        ("Coffee", "☕", "Káva"),
        ("Utensils", "🍽️", "Jídlo"),
        ("ShoppingBag", "🛍️", "Nákup"),
        ("Paintbrush", "🎨", "Malování"),
        ("Gamepad2", "🎮", "Hry"),
        ("TreePine", "🌲", "Příroda"),
        ("Mountain", "🏔️", "Hora"),
        ("Waves", "🌊", "Vlny"),
        ("Sun", "☀️", "Slunce"),
        ("Moon", "🌙", "Měsíc"),
        ("Sparkles", "✨", "Jiskry"),
        ("Key", "🗝️", "Klíč"),
        ("Lock", "🔒", "Zámek"),
        ("Shield", "🛡️", "Štít"),
        ("Compass", "🧭", "Kompas"),
        ("Map", "🗺️", "Mapa"),
        ("Flag", "🏳️", "Vlajka"),
        ("Gift", "🎁", "Dárek"),
        ("Crown", "👑", "Koruna"),
        ("Gem", "💎", "Drahokam"),
        ("Medal", "🏅", "Medaile"),
        ("Award", "🏆", "Ocenění"),
        ("Zap", "⚡", "Blesk"),
        ("Smile", "😊", "Úsměv"),
        ("ThumbsUp", "👍", "Palec nahoru"),
        ("Rainbow", "🌈", "Duha"),
        ("Droplets", "💧", "Kapky"),
        ("Leaf", "🍃", "List"),
        ("Flower2", "🌸", "Květina"),
        ("Bird", "🐦", "Pták"),
        ("Fish", "🐟", "Ryba"),
        ("Cat", "🐱", "Kočka"),
        ("Dog", "🐶", "Pes"),
        ("Rabbit", "🐰", "Králík"),
        ("Bot", "🤖", "Robot"),
        ("Ghost", "👻", "Duch"),
        ("Skull", "💀", "Lebka"),
        ("Cake", "🎂", "Dort"),
        ("Cookie", "🍪", "Sušenka"),
        ("Pizza", "🍕", "Pizza"),
        ("Apple", "🍎", "Jablko"),
        ("Banana", "🍌", "Banán"),
        ("Cherry", "🍒", "Třešně"),
        ("Grape", "🍇", "Hrozny"),
        ("Carrot", "🥕", "Mrkev"),
        ("Activity", "📊", "Aktivita"),
        ("HeartPulse", "💓", "Zdraví"),
        ("Stethoscope", "🩺", "Lékař"),
        ("Pill", "💊", "Léky"),
        ("Cpu", "💻", "Počítač"),
        ("Smartphone", "📱", "Smartphone"),
        ("Laptop", "💻", "Laptop"),
        ("Code", "💻", "Kód"),
        ("Monitor", "🖥️", "Monitor"),
        ("Wifi", "📶", "WiFi"),
        ("DollarSign", "💵", "Dolar"),
        ("TrendingUp", "📈", "Růst"),
        ("Banknote", "💵", "Bankovka"),
        ("CreditCard", "💳", "Kreditka"),
        ("Wallet", "💰", "Peněženka"),
        ("Coins", "🪙", "Mince"),
        ("Building", "🏢", "Budova"),
        ("Users", "👥", "Tým"),
        ("LayoutDashboard", "📊", "Přehled")
    ]
    
    static func getEmoji(for iconName: String?) -> String {
        guard let iconName = iconName, let emoji = iconToEmoji[iconName] else {
            return "🎯" // Default
        }
        return emoji
    }
    
    static func getIconName(for emoji: String) -> String? {
        return iconToEmoji.first(where: { $0.value == emoji })?.key
    }
}

// MARK: - Icon Picker View
struct IconPickerView: View {
    @Binding var selectedIcon: String?
    @Environment(\.dismiss) private var dismiss
    
    let columns = [
        GridItem(.adaptive(minimum: 60), spacing: 12)
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: columns, spacing: 16) {
                    // None option
                    IconOption(
                        iconName: nil,
                        emoji: "",
                        label: "Bez ikony",
                        isSelected: selectedIcon == nil
                    ) {
                        selectedIcon = nil
                        dismiss()
                    }
                    
                    // All available icons
                    ForEach(IconUtils.availableIcons, id: \.name) { icon in
                        IconOption(
                            iconName: icon.name,
                            emoji: icon.emoji,
                            label: icon.label,
                            isSelected: selectedIcon == icon.name
                        ) {
                            selectedIcon = icon.name
                            dismiss()
                        }
                    }
                }
                .padding(DesignSystem.Spacing.md)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Vyberte ikonu")
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
}

// MARK: - Icon Option
struct IconOption: View {
    let iconName: String?
    let emoji: String
    let label: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignSystem.Spacing.xs) {
                // Use LucideIcon instead of emoji
                if let iconName = iconName {
                    LucideIcon(iconName, size: 32, color: isSelected ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textPrimary)
                } else {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(isSelected ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.textSecondary)
                }
                
                Text(label)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(width: 60, height: 70)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? DesignSystem.Colors.dynamicPrimary.opacity(0.2) : DesignSystem.Colors.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isSelected ? DesignSystem.Colors.dynamicPrimary : DesignSystem.Colors.grayBorder, lineWidth: isSelected ? 3 : 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

