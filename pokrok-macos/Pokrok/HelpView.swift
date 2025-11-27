import SwiftUI

struct HelpView: View {
    @Environment(\.dismiss) var dismiss
    @Binding var goals: [Goal]
    @Binding var habits: [Habit]
    @Binding var steps: [Step]
    
    @State private var selectedCategory: HelpCategory = .gettingStarted
    
    enum HelpCategory: String, CaseIterable {
        case gettingStarted = "Začínáme"
        case overview = "Jak používat"
        case goals = "Cíle"
        case steps = "Kroky"
        case habits = "Návyky"
        
        var icon: String {
            switch self {
            case .gettingStarted: return "rocket.fill"
            case .overview: return "questionmark.circle.fill"
            case .goals: return "target"
            case .steps: return "footprints"
            case .habits: return "checkmark.square.fill"
            }
        }
    }
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        NavigationStack {
            HStack(spacing: 0) {
                // Sidebar with categories
                VStack(alignment: .leading, spacing: 0) {
                    Text("Nápověda")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 16)
                    
                    Divider()
                    
                    ScrollView {
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(HelpCategory.allCases, id: \.self) { category in
                                CategoryButton(
                                    category: category,
                                    isSelected: selectedCategory == category,
                                    primaryOrange: primaryOrange
                                ) {
                                    selectedCategory = category
                                }
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
                .frame(width: 200)
                .background(Color.gray.opacity(0.05))
                
                Divider()
                
                // Content area
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        contentView
                    }
                    .padding(24)
                }
                .frame(maxWidth: .infinity)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Zavřít") {
                        dismiss()
                    }
                }
            }
        }
        .frame(width: 900, height: 700)
    }
    
    @ViewBuilder
    private var contentView: some View {
        switch selectedCategory {
        case .gettingStarted:
            GettingStartedView(primaryOrange: primaryOrange)
        case .overview:
            OverviewHelpView(primaryOrange: primaryOrange)
        case .goals:
            GoalsHelpView(primaryOrange: primaryOrange)
        case .steps:
            StepsHelpView(primaryOrange: primaryOrange)
        case .habits:
            HabitsHelpView(primaryOrange: primaryOrange)
        }
    }
}

// MARK: - Category Button

struct CategoryButton: View {
    let category: HelpView.HelpCategory
    let isSelected: Bool
    let primaryOrange: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: category.icon)
                    .font(.system(size: 14))
                    .foregroundColor(isSelected ? primaryOrange : Color.gray.opacity(0.6))
                    .frame(width: 20)
                
                Text(category.rawValue)
                    .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                    .foregroundColor(isSelected ? Color(white: 0.2) : Color.gray.opacity(0.7))
                
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(isSelected ? Color.white : Color.clear)
            .overlay(
                Rectangle()
                    .fill(isSelected ? primaryOrange : Color.clear)
                    .frame(width: 3)
                , alignment: .leading
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Getting Started View

struct GettingStartedView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Hero
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 8) {
                    Image(systemName: "rocket.fill")
                        .font(.system(size: 28))
                    Text("Vítejte v Pokroku!")
                        .font(.system(size: 24, weight: .bold))
                }
                .foregroundColor(.white)
                
                Text("Získejte **perspektivu**, **jasnost** a dosáhněte svých **cílů**.")
                    .font(.system(size: 14))
                    .foregroundColor(Color.white.opacity(0.9))
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [primaryOrange, primaryOrange.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            
            // 3 Benefits
            HStack(spacing: 12) {
                BenefitCard(
                    icon: "eye.fill",
                    text: "Perspektiva",
                    primaryOrange: primaryOrange
                )
                BenefitCard(
                    icon: "sparkles",
                    text: "Jasnost",
                    primaryOrange: primaryOrange
                )
                BenefitCard(
                    icon: "target",
                    text: "Cíle",
                    primaryOrange: primaryOrange
                )
            }
            
            // 3 Steps
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Image(systemName: "footprints")
                        .font(.system(size: 18))
                        .foregroundColor(primaryOrange)
                    Text("3 kroky k úspěchu")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                StepCard(
                    number: 1,
                    icon: "target",
                    title: "Vytvořte cíl",
                    subtitle: "Čeho chcete dosáhnout?",
                    example: "Naučit se React",
                    primaryOrange: primaryOrange
                )
                
                StepCard(
                    number: 2,
                    icon: "footprints",
                    title: "Přidejte kroky",
                    subtitle: "Konkrétní akce směrem k vašemu cíli",
                    example: "Instalovat Node.js",
                    primaryOrange: primaryOrange
                )
                
                StepCard(
                    number: 3,
                    icon: "checkmark.square.fill",
                    title: "Vytvořte návyky",
                    subtitle: "Opakující se aktivity",
                    example: "Ranní cvičení",
                    primaryOrange: primaryOrange
                )
            }
            
            // What's Next
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 18))
                        .foregroundColor(primaryOrange)
                    Text("Co dál?")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                HStack(spacing: 12) {
                    NextItemCard(icon: "calendar", text: "Denní přehled", primaryOrange: primaryOrange)
                    NextItemCard(icon: "checkmark.circle", text: "Dokončujte kroky", primaryOrange: primaryOrange)
                    NextItemCard(icon: "star.fill", text: "Zaměřte se na důležité", primaryOrange: primaryOrange)
                    NextItemCard(icon: "chart.bar", text: "Sledujte pokrok", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.orange.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.1), lineWidth: 1)
            )
        }
    }
}

// MARK: - Helper Views

struct BenefitCard: View {
    let icon: String
    let text: String
    let primaryOrange: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(primaryOrange)
            Text(text)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(Color(white: 0.3))
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.orange.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.1), lineWidth: 1)
        )
    }
}

struct StepCard: View {
    let number: Int
    let icon: String
    let title: String
    let subtitle: String
    let example: String
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(primaryOrange)
                        .frame(width: 32, height: 32)
                    Text("\(number)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: icon)
                            .font(.system(size: 14))
                            .foregroundColor(primaryOrange)
                        Text(title)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(Color(white: 0.2))
                    }
                    Text(subtitle)
                        .font(.system(size: 11))
                        .foregroundColor(Color.gray.opacity(0.6))
                }
            }
            
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundColor(primaryOrange)
                Text(example)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(Color(white: 0.25))
                Spacer()
                Text("V Focusu")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(primaryOrange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
            }
            .padding(12)
            .background(Color.orange.opacity(0.05))
            .cornerRadius(10)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
        )
    }
}

struct NextItemCard: View {
    let icon: String
    let text: String
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(Color.orange.opacity(0.6))
            Text(text)
                .font(.system(size: 12))
                .foregroundColor(Color.gray.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .padding(.horizontal, 10)
        .background(Color.white)
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.orange.opacity(0.1), lineWidth: 1)
        )
    }
}

// MARK: - Overview Help View

struct OverviewHelpView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Hero
            VStack(alignment: .leading, spacing: 8) {
                Text("Jak používat aplikaci?")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.white)
                Text("Praktické návody a tipy pro efektivní použití")
                    .font(.system(size: 14))
                    .foregroundColor(Color.white.opacity(0.9))
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [primaryOrange, primaryOrange.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            
            // Use Cases
            VStack(alignment: .leading, spacing: 16) {
                UseCaseCard(
                    title: "Denní plánování",
                    description: "Začněte každý den s jasným plánem",
                    steps: [
                        "Otevřete aplikaci ráno",
                        "Zkontrolujte kroky na dnes",
                        "Dokončujte kroky během dne",
                        "Sledujte svůj pokrok"
                    ],
                    result: "Máte přehled o svém dni a víte, co je důležité",
                    primaryOrange: primaryOrange
                )
                
                UseCaseCard(
                    title: "Dlouhodobé cíle",
                    description: "Rozdělte velké cíle na malé kroky",
                    steps: [
                        "Vytvořte cíl s termínem",
                        "Přidejte kroky k cíli",
                        "Pracujte na krocích každý den",
                        "Sledujte pokrok k cíli"
                    ],
                    result: "Postupně dosahujete svých cílů",
                    primaryOrange: primaryOrange
                )
            }
        }
    }
}

struct UseCaseCard: View {
    let title: String
    let description: String
    let steps: [String]
    let result: String
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(Color(white: 0.2))
            
            Text(description)
                .font(.system(size: 13))
                .foregroundColor(Color.gray.opacity(0.7))
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(primaryOrange)
                                .frame(width: 20, height: 20)
                            Text("\(index + 1)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Text(step)
                            .font(.system(size: 12))
                            .foregroundColor(Color(white: 0.3))
                    }
                }
            }
            
            Text(result)
                .font(.system(size: 11))
                .foregroundColor(primaryOrange)
                .padding(8)
                .background(Color.orange.opacity(0.1))
                .cornerRadius(6)
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Goals Help View

struct GoalsHelpView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Hero
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "target")
                            .font(.system(size: 28))
                        Text("Cíle")
                            .font(.system(size: 24, weight: .bold))
                    }
                    .foregroundColor(.white)
                    Text("Jak pracovat s cíli")
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.9))
                }
                Spacer()
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [primaryOrange, primaryOrange.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            
            // What are goals
            VStack(alignment: .leading, spacing: 12) {
                Text("Co jsou cíle?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                Text("Cíle jsou dlouhodobé aspirace, které chcete dosáhnout. Měly by být měřitelné, s termínem a mohou být přidány do Focusu.")
                    .font(.system(size: 13))
                    .foregroundColor(Color.gray.opacity(0.7))
                
                HStack(spacing: 8) {
                    TagView(icon: "target", text: "Měřitelné", primaryOrange: primaryOrange)
                    TagView(icon: "calendar", text: "S termínem", primaryOrange: primaryOrange)
                    TagView(icon: "star.fill", text: "V Focusu", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
            
            // How to create
            VStack(alignment: .leading, spacing: 12) {
                Text("Jak vytvořit cíl?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                VStack(alignment: .leading, spacing: 8) {
                    StepRow(number: 1, text: "Klikněte na tlačítko 'Přidat cíl'", primaryOrange: primaryOrange)
                    StepRow(number: 2, text: "Vyplňte název cíle", primaryOrange: primaryOrange)
                    StepRow(number: 3, text: "Nastavte termín (volitelné)", primaryOrange: primaryOrange)
                    StepRow(number: 4, text: "Přidejte kroky k cíli", primaryOrange: primaryOrange)
                    StepRow(number: 5, text: "Uložte cíl", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
            
            // Tips
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 16))
                        .foregroundColor(primaryOrange)
                    Text("Tipy")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    TipRow(text: "Rozdělte velké cíle na menší kroky", primaryOrange: primaryOrange)
                    TipRow(text: "Nastavte realistické termíny", primaryOrange: primaryOrange)
                    TipRow(text: "Přidejte důležité cíle do Focusu", primaryOrange: primaryOrange)
                    TipRow(text: "Pravidelně kontrolujte pokrok", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.orange.opacity(0.05))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.1), lineWidth: 1)
            )
        }
    }
}

struct TagView: View {
    let icon: String
    let text: String
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 10))
            Text(text)
                .font(.system(size: 10, weight: .medium))
        }
        .foregroundColor(primaryOrange)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(8)
    }
}

struct StepRow: View {
    let number: Int
    let text: String
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(primaryOrange)
                    .frame(width: 20, height: 20)
                Text("\(number)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            }
            Text(text)
                .font(.system(size: 12))
                .foregroundColor(Color(white: 0.3))
        }
    }
}

struct TipRow: View {
    let text: String
    let primaryOrange: Color
    
    var body: some View {
        HStack(spacing: 8) {
            Text("•")
                .foregroundColor(primaryOrange)
            Text(text)
                .font(.system(size: 12))
                .foregroundColor(Color.gray.opacity(0.7))
        }
    }
}

// MARK: - Steps Help View

struct StepsHelpView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Hero
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "footprints")
                            .font(.system(size: 28))
                        Text("Kroky")
                            .font(.system(size: 24, weight: .bold))
                    }
                    .foregroundColor(.white)
                    Text("Jak pracovat s kroky")
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.9))
                }
                Spacer()
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [primaryOrange, primaryOrange.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            
            // What are steps
            VStack(alignment: .leading, spacing: 12) {
                Text("Co jsou kroky?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                Text("Kroky jsou konkrétní akce, které vedou k dosažení vašich cílů. Můžete je přiřadit k cíli, nastavit datum a odhadovaný čas.")
                    .font(.system(size: 13))
                    .foregroundColor(Color.gray.opacity(0.7))
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
            
            // How to create
            VStack(alignment: .leading, spacing: 12) {
                Text("Jak vytvořit krok?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                VStack(alignment: .leading, spacing: 8) {
                    StepRow(number: 1, text: "Klikněte na tlačítko 'Přidat krok'", primaryOrange: primaryOrange)
                    StepRow(number: 2, text: "Vyplňte název kroku", primaryOrange: primaryOrange)
                    StepRow(number: 3, text: "Nastavte datum (volitelné)", primaryOrange: primaryOrange)
                    StepRow(number: 4, text: "Přiřaďte k cíli (volitelné)", primaryOrange: primaryOrange)
                    StepRow(number: 5, text: "Nastavte odhadovaný čas", primaryOrange: primaryOrange)
                    StepRow(number: 6, text: "Uložte krok", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
        }
    }
}

// MARK: - Habits Help View

struct HabitsHelpView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Hero
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.square.fill")
                            .font(.system(size: 28))
                        Text("Návyky")
                            .font(.system(size: 24, weight: .bold))
                    }
                    .foregroundColor(.white)
                    Text("Jak pracovat s návyky")
                        .font(.system(size: 14))
                        .foregroundColor(Color.white.opacity(0.9))
                }
                Spacer()
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [primaryOrange, primaryOrange.opacity(0.8)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            
            // What are habits
            VStack(alignment: .leading, spacing: 12) {
                Text("Co jsou návyky?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                Text("Návyky jsou opakující se aktivity, které chcete dělat pravidelně. Můžete je nastavit na každý den nebo vybrat konkrétní dny v týdnu.")
                    .font(.system(size: 13))
                    .foregroundColor(Color.gray.opacity(0.7))
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
            
            // How to create
            VStack(alignment: .leading, spacing: 12) {
                Text("Jak vytvořit návyk?")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(Color(white: 0.2))
                
                VStack(alignment: .leading, spacing: 8) {
                    StepRow(number: 1, text: "Klikněte na tlačítko 'Přidat návyk'", primaryOrange: primaryOrange)
                    StepRow(number: 2, text: "Vyplňte název návyku", primaryOrange: primaryOrange)
                    StepRow(number: 3, text: "Vyberte frekvenci (denně nebo vlastní)", primaryOrange: primaryOrange)
                    StepRow(number: 4, text: "Pokud vlastní, vyberte dny v týdnu", primaryOrange: primaryOrange)
                    StepRow(number: 5, text: "Uložte návyk", primaryOrange: primaryOrange)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
        }
    }
}

#Preview {
    HelpView(goals: .constant([]), habits: .constant([]), steps: .constant([]))
}

