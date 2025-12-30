import SwiftUI

struct HelpView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var expandedCategories: Set<String> = []
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.md) {
                    // Header
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Nápověda")
                            .font(DesignSystem.Typography.title1)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Vše, co potřebujete vědět o aplikaci Pokrok")
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                    
                    // Accordion sections
                    VStack(spacing: DesignSystem.Spacing.sm) {
                        HelpAccordionSection(
                            id: "getting-started",
                            title: "Začínáme",
                            icon: "rocket.fill",
                            content: GettingStartedContent()
                        )
                        
                        HelpAccordionSection(
                            id: "navigation",
                            title: "Navigace",
                            icon: "map.fill",
                            content: NavigationContent()
                        )
                        
                        HelpAccordionSection(
                            id: "areas",
                            title: "Oblasti",
                            icon: "square.grid.2x2.fill",
                            content: AreasContent()
                        )
                        
                        HelpAccordionSection(
                            id: "goals",
                            title: "Cíle",
                            icon: "target",
                            content: GoalsContent()
                        )
                        
                        HelpAccordionSection(
                            id: "steps",
                            title: "Kroky",
                            icon: "figure.walk",
                            content: StepsContent()
                        )
                        
                        HelpAccordionSection(
                            id: "habits",
                            title: "Návyky",
                            icon: "checkmark.square.fill",
                            content: HabitsContent()
                        )
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.bottom, DesignSystem.Spacing.xl)
                }
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Nápověda")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Hotovo") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
            }
        }
    }
}

// MARK: - Accordion Section Component
struct HelpAccordionSection<Content: View>: View {
    let id: String
    let title: String
    let icon: String
    let content: Content
    @State private var isExpanded = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header button
            Button(action: {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    isExpanded.toggle()
                }
            }) {
                HStack(spacing: DesignSystem.Spacing.md) {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                        .frame(width: 24, height: 24)
                    
                    Text(title)
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                }
                .padding(DesignSystem.Spacing.md)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary, lineWidth: 2)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
            }
            .buttonStyle(PlainButtonStyle())
            
            // Content
            if isExpanded {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                    content
                }
                .padding(DesignSystem.Spacing.md)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                        .stroke(DesignSystem.Colors.dynamicPrimary.opacity(0.3), lineWidth: 1)
                )
                .cornerRadius(DesignSystem.CornerRadius.md)
                .padding(.top, DesignSystem.Spacing.xs)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .shadow(color: DesignSystem.Colors.dynamicPrimary.opacity(1.0), radius: 0, x: 3, y: 3)
    }
}

// MARK: - Content Views

struct GettingStartedContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Životní plánovač pro lidi, kteří chtějí dosáhnout svých cílů")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Pokrok vám pomůže získat jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete. Rozdělte velké cíle na malé kroky, budujte návyky a sledujte svůj pokrok.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("4 kroky k úspěchu")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HelpStepView(number: 0, text: "Vytvořte si oblasti (např. Zdraví, Kariéra, Vztahy)")
                HelpStepView(number: 1, text: "Přidejte cíle k těmto oblastem")
                HelpStepView(number: 2, text: "Rozdělte cíle na konkrétní kroky")
                HelpStepView(number: 3, text: "Budujte návyky pro dlouhodobý pokrok")
            }
        }
    }
}

struct NavigationContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Aplikace má čtyři hlavní záložky v dolní části obrazovky")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Mezi záložkami můžete přepínat klepnutím na ikony v dolní navigační liště. Uprostřed je tlačítko \"+\" pro rychlé přidání nového kroku, cíle nebo návyku.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                HelpFeatureView(
                    icon: "checkmark.circle.fill",
                    title: "Feed",
                    description: "Zobrazuje všechny vaše kroky v chronologickém pořadí. Můžete si vybrat datum pomocí výběru data nahoře a zobrazit kroky pro konkrétní den. Zobrazuje seznam všech kroků s možností označit je jako dokončené. Důležité kroky jsou zvýrazněny."
                )
                
                HelpFeatureView(
                    icon: "repeat.circle.fill",
                    title: "Návyky",
                    description: "Zobrazuje všechny vaše návyky pro vybraný den. Můžete si vybrat datum pomocí výběru data nahoře. Zobrazuje seznam návyků s možností označit je jako dokončené. Návyky jsou seskupené podle frekvence (denní, týdenní, měsíční)."
                )
                
                HelpFeatureView(
                    icon: "chart.bar.fill",
                    title: "Pokrok",
                    description: "Zobrazuje všechny vaše cíle seskupené podle oblastí. U každého cíle vidíte pokrok v procentech a počet kroků. Cíle jsou organizované podle životních oblastí, které jste si vytvořili. Můžete kliknout na cíl a zobrazit jeho detail."
                )
                
                HelpFeatureView(
                    icon: "gear",
                    title: "Nastavení",
                    description: "Obsahuje nastavení aplikace: změna barvy aplikace, správa životních oblastí, nastavení notifikací, widgety a další možnosti. Zde také najdete nápovědu a možnost odhlásit se."
                )
            }
        }
    }
}

struct AreasContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Organizujte své cíle, kroky a návyky do logických skupin")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Oblasti jsou způsob, jak organizovat své cíle, kroky a návyky do logických skupin. Ideálně by měly představovat větší životní oblasti nebo projekty.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Jak vytvořit oblast?")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HelpStepView(number: 1, text: "Přejděte do Nastavení (ikona ozubeného kola)")
                HelpStepView(number: 2, text: "Vyberte záložku \"Životní oblasti\"")
                HelpStepView(number: 3, text: "Klikněte na tlačítko \"Přidat oblast\"")
                HelpStepView(number: 4, text: "Vyplňte název oblasti (např. \"Zdraví\", \"Kariéra\")")
                HelpStepView(number: 5, text: "Volitelně přidejte popis, barvu a ikonu")
                HelpStepView(number: 6, text: "Klikněte na \"Uložit\"")
            }
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Tipy")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HelpTipView(text: "Vytvářejte oblasti pro větší životní oblasti (Zdraví, Kariéra, Vztahy) nebo pro větší projekty")
                HelpTipView(text: "Není nutné přiřazovat vše k oblasti - cíle, kroky a návyky mohou existovat i bez oblasti")
                HelpTipView(text: "Používejte barvy a ikony pro lepší vizuální rozlišení oblastí")
                HelpTipView(text: "Oblasti pomáhají s filtrováním a organizací, zejména když máte mnoho cílů a kroků")
            }
        }
    }
}

struct GoalsContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Cíle jsou konkrétní, měřitelné výsledky, kterých chcete dosáhnout")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Cíle by měly být měřitelné, s termínem dokončení a měly by být v centru vaší pozornosti.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Jak vytvořit cíl?")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HelpStepView(number: 1, text: "Klikněte na tlačítko \"+\" v dolní části obrazovky")
                HelpStepView(number: 2, text: "Vyberte \"Cíl\"")
                HelpStepView(number: 3, text: "Vyplňte název cíle")
                HelpStepView(number: 4, text: "Volitelně přidejte popis, termín a přiřaďte k oblasti")
                HelpStepView(number: 5, text: "Klikněte na \"Vytvořit\"")
            }
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Tipy")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HelpTipView(text: "Rozdělte velké cíle na menší kroky")
                HelpTipView(text: "Nastavte si realistické termíny")
                HelpTipView(text: "Pravidelně kontrolujte pokrok")
                HelpTipView(text: "Používejte oblasti pro organizaci cílů")
            }
        }
    }
}

struct StepsContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Kroky jsou konkrétní akce, které vás přiblíží k vašim cílům")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Kroky jsou naplánované na konkrétní datum, mohou být přiřazeny k cíli a mohou mít odhadovaný čas dokončení.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Jak vytvořit krok?")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HelpStepView(number: 1, text: "Klikněte na tlačítko \"+\" v dolní části obrazovky")
                HelpStepView(number: 2, text: "Vyberte \"Krok\"")
                HelpStepView(number: 3, text: "Vyplňte název kroku")
                HelpStepView(number: 4, text: "Vyberte datum a volitelně přiřaďte k cíli")
                HelpStepView(number: 5, text: "Klikněte na \"Vytvořit\"")
            }
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Tipy")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HelpTipView(text: "Rozdělte velké úkoly na menší kroky")
                HelpTipView(text: "Nastavte si realistické termíny")
                HelpTipView(text: "Označte důležité kroky")
                HelpTipView(text: "Používejte odhadovaný čas pro lepší plánování")
            }
        }
    }
}

struct HabitsContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Návyky jsou opakující se aktivity, které chcete dělat pravidelně")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            Text("Návyky můžete nastavit jako denní, týdenní nebo měsíční. Můžete také nastavit připomínky a vybrat dny v týdnu.")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Jak vytvořit návyk?")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HelpStepView(number: 1, text: "Klikněte na tlačítko \"+\" v dolní části obrazovky")
                HelpStepView(number: 2, text: "Vyberte \"Návyk\"")
                HelpStepView(number: 3, text: "Vyplňte název návyku")
                HelpStepView(number: 4, text: "Vyberte frekvenci (denní, týdenní, měsíční)")
                HelpStepView(number: 5, text: "Volitelně nastavte připomínku a vyberte dny")
                HelpStepView(number: 6, text: "Klikněte na \"Vytvořit\"")
            }
            
            Divider()
                .background(DesignSystem.Colors.dynamicPrimary.opacity(0.3))
            
            Text("Tipy")
                .font(DesignSystem.Typography.headline)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HelpTipView(text: "Začněte s malými návyky")
                HelpTipView(text: "Nastavte si připomínky pro lepší dodržování")
                HelpTipView(text: "Sledujte svůj streak (sérii)")
                HelpTipView(text: "Buďte trpěliví - budování návyků trvá čas")
            }
        }
    }
}

// MARK: - Helper Components

struct HelpStepView: View {
    let number: Int
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: DesignSystem.Spacing.sm) {
            Text("\(number)")
                .font(DesignSystem.Typography.caption)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(DesignSystem.Colors.dynamicPrimary)
                .clipShape(Circle())
            
            Text(text)
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textPrimary)
        }
    }
}

struct HelpFeatureView: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: DesignSystem.Spacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
                .frame(width: 20, height: 20)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(DesignSystem.Typography.body)
                    .fontWeight(.semibold)
                    .foregroundColor(DesignSystem.Colors.textPrimary)
                
                Text(description)
                    .font(DesignSystem.Typography.caption)
                    .foregroundColor(DesignSystem.Colors.textSecondary)
            }
        }
    }
}

struct HelpTipView: View {
    let text: String
    
    var body: some View {
        HStack(alignment: .top, spacing: DesignSystem.Spacing.xs) {
            Text("•")
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            
            Text(text)
                .font(DesignSystem.Typography.body)
                .foregroundColor(DesignSystem.Colors.textSecondary)
        }
    }
}

#Preview {
    HelpView()
}

