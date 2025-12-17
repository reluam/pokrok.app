import SwiftUI

struct AspirationsOverviewView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var aspirations: [Aspiration] = []
    @State private var balances: [String: AspirationBalance] = [:]
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddAspirationModal = false
    @State private var selectedAspiration: Aspiration?
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám přehled...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header
                        headerSection
                        
                        // Aspirations List
                        aspirationsSection
                        
                        // Insights Section (lehké/těžké)
                        insightsSection
                        
                        // Bottom padding for tab bar
                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, DesignSystem.Spacing.md)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .background(DesignSystem.Colors.background)
                .refreshable {
                    await loadData()
                }
            }
        }
        .navigationTitle("Přehled")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddAspirationModal = true
                }) {
                    ModernIcon(
                        systemName: "plus",
                        size: 18,
                        color: DesignSystem.Colors.primary
                    )
                }
            }
        }
        .task {
            await loadData()
        }
        .sheet(isPresented: $showAddAspirationModal) {
            AddAspirationModal(onAspirationAdded: {
                Task {
                    await loadData()
                }
            })
        }
        .alert("Chyba", isPresented: $showError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Aspirace")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("Životní cíle a směr")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        showAddAspirationModal = true
                    }) {
                        Text("Přidat")
                            .font(DesignSystem.Typography.caption)
                            .fontWeight(.medium)
                            .foregroundColor(DesignSystem.Colors.primary)
                            .padding(.horizontal, DesignSystem.Spacing.md)
                            .padding(.vertical, DesignSystem.Spacing.sm)
                            .background(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                                    .fill(DesignSystem.Colors.primary.opacity(0.1))
                            )
                    }
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Aspirations Section
    private var aspirationsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            if aspirations.isEmpty {
                EmptyStateView(
                    icon: "sparkles",
                    title: "Žádné aspirace",
                    subtitle: "Vytvořte svou první aspiraci, která vás povede k vašim životním cílům",
                    actionTitle: "Přidat aspiraci",
                    action: {
                        showAddAspirationModal = true
                    }
                )
            } else {
                LazyVStack(spacing: DesignSystem.Spacing.md) {
                    ForEach(aspirations, id: \.id) { aspiration in
                        aspirationCard(aspiration)
                    }
                }
            }
        }
    }
    
    // MARK: - Aspiration Card
    private func aspirationCard(_ aspiration: Aspiration) -> some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
                // Header with title and color indicator
                HStack(alignment: .top, spacing: DesignSystem.Spacing.md) {
                    // Color indicator
                    Circle()
                        .fill(Color(hex: aspiration.color))
                        .frame(width: 12, height: 12)
                        .padding(.top, 4)
                    
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text(aspiration.title)
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        if let description = aspiration.description, !description.isEmpty {
                            Text(description)
                                .font(DesignSystem.Typography.caption)
                                .foregroundColor(DesignSystem.Colors.textSecondary)
                                .lineLimit(2)
                        }
                    }
                    
                    Spacer()
                }
                
                // Balance and Stats
                if let balance = balances[aspiration.id] {
                    aspirationBalanceView(balance)
                } else {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, DesignSystem.Spacing.sm)
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Aspiration Balance View
    private func aspirationBalanceView(_ balance: AspirationBalance) -> some View {
        VStack(spacing: DesignSystem.Spacing.md) {
            // XP Summary
            HStack(spacing: DesignSystem.Spacing.lg) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Celkem XP")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    Text("\(balance.totalXp)")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Posledních 90 dní")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    Text("\(balance.recentXp)")
                        .font(DesignSystem.Typography.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                Spacer()
                
                // Trend indicator
                trendIndicator(balance.trend)
            }
            
            // Completion Rate
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                HStack {
                    Text("Úspěšnost")
                        .font(DesignSystem.Typography.caption)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    
                    Spacer()
                    
                    Text("\(Int(balance.completionRateRecent))%")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(completionRateColor(balance.completionRateRecent))
                }
                
                ModernProgressBar(
                    progress: balance.completionRateRecent / 100,
                    height: 6,
                    foregroundColor: completionRateColor(balance.completionRateRecent)
                )
            }
            
            // Activity breakdown
            HStack(spacing: DesignSystem.Spacing.md) {
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Kroky")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    Text("\(balance.recentCompletedSteps)/\(balance.recentPlannedSteps)")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                    Text("Návyky")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                    Text("\(balance.recentCompletedHabits)/\(balance.recentPlannedHabits)")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.medium)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                }
                
                Spacer()
            }
        }
    }
    
    // MARK: - Trend Indicator
    private func trendIndicator(_ trend: String) -> some View {
        HStack(spacing: DesignSystem.Spacing.xs) {
            Image(systemName: trendIcon(trend))
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(trendColor(trend))
            
            Text(trendText(trend))
                .font(DesignSystem.Typography.caption2)
                .fontWeight(.medium)
                .foregroundColor(trendColor(trend))
        }
        .padding(.horizontal, DesignSystem.Spacing.sm)
        .padding(.vertical, DesignSystem.Spacing.xs)
        .background(
            RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.sm)
                .fill(trendColor(trend).opacity(0.1))
        )
    }
    
    private func trendIcon(_ trend: String) -> String {
        switch trend {
        case "positive":
            return "arrow.up.right"
        case "negative":
            return "arrow.down.right"
        default:
            return "minus"
        }
    }
    
    private func trendColor(_ trend: String) -> Color {
        switch trend {
        case "positive":
            return DesignSystem.Colors.success
        case "negative":
            return DesignSystem.Colors.error
        default:
            return DesignSystem.Colors.textTertiary
        }
    }
    
    private func trendText(_ trend: String) -> String {
        switch trend {
        case "positive":
            return "Roste"
        case "negative":
            return "Klesá"
        default:
            return "Stabilní"
        }
    }
    
    private func completionRateColor(_ rate: Double) -> Color {
        if rate >= 80 {
            return DesignSystem.Colors.success
        } else if rate >= 50 {
            return DesignSystem.Colors.primary
        } else {
            return DesignSystem.Colors.error
        }
    }
    
    // MARK: - Insights Section
    private var insightsSection: some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.md) {
            Text("Přehled")
                .font(DesignSystem.Typography.title3)
                .foregroundColor(DesignSystem.Colors.textPrimary)
            
            if aspirations.isEmpty {
                EmptyView()
            } else {
                // Calculate easy/hard insights
                let insights = calculateInsights()
                
                if !insights.easy.isEmpty || !insights.hard.isEmpty {
                    VStack(spacing: DesignSystem.Spacing.md) {
                        if !insights.easy.isEmpty {
                            insightCard(title: "Lehké", items: insights.easy, color: DesignSystem.Colors.success)
                        }
                        
                        if !insights.hard.isEmpty {
                            insightCard(title: "Těžké", items: insights.hard, color: DesignSystem.Colors.error)
                        }
                    }
                }
            }
        }
    }
    
    private func insightCard(title: String, items: [String], color: Color) -> some View {
        ModernCard {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    Text(title)
                        .font(DesignSystem.Typography.headline)
                        .foregroundColor(color)
                    
                    Spacer()
                }
                
                ForEach(items, id: \.self) { item in
                    HStack {
                        Circle()
                            .fill(color.opacity(0.2))
                            .frame(width: 6, height: 6)
                        
                        Text(item)
                            .font(DesignSystem.Typography.body)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                    }
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    private func calculateInsights() -> (easy: [String], hard: [String]) {
        var easy: [String] = []
        var hard: [String] = []
        
        for aspiration in aspirations {
            guard let balance = balances[aspiration.id] else { continue }
            
            let rate = balance.completionRateRecent
            
            if rate >= 80 {
                easy.append(aspiration.title)
            } else if rate < 30 {
                hard.append(aspiration.title)
            }
        }
        
        return (easy: easy, hard: hard)
    }
    
    // MARK: - Data Loading
    private func loadData() async {
        isLoading = true
        
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            
            await MainActor.run {
                self.aspirations = fetchedAspirations
            }
            
            // Load balances for all aspirations in parallel (optimized)
            let balanceTasks = fetchedAspirations.map { aspiration in
                Task<AspirationBalance?, Error> {
                    do {
                        let balance = try await apiManager.fetchAspirationBalance(aspirationId: aspiration.id)
                        return balance
                    } catch {
                        return nil
                    }
                }
            }
            
            // Wait for all balance tasks to complete
            var newBalances: [String: AspirationBalance] = [:]
            for (index, task) in balanceTasks.enumerated() {
                if let balance = try? await task.value {
                    newBalances[fetchedAspirations[index].id] = balance
                }
            }
            
            await MainActor.run {
                self.balances = newBalances
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.showError = true
                self.isLoading = false
            }
        }
    }
}

// MARK: - Add Aspiration Modal
struct AddAspirationModal: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiManager = APIManager.shared
    @State private var aspirationTitle = ""
    @State private var aspirationDescription = ""
    @State private var selectedColor = "#3B82F6"
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    let onAspirationAdded: () -> Void
    
    private let colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: DesignSystem.Spacing.lg) {
                    // Title Field
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        HStack {
                            Text("Název aspirace")
                                .font(DesignSystem.Typography.headline)
                                .foregroundColor(DesignSystem.Colors.textPrimary)
                            Text("*")
                                .foregroundColor(DesignSystem.Colors.primary)
                        }
                        TextField("Např. Být tím nejlepším člověkem, jakým můžu být", text: $aspirationTitle)
                            .font(DesignSystem.Typography.body)
                            .padding(DesignSystem.Spacing.md)
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.textTertiary.opacity(0.3), lineWidth: 1)
                            )
                    }
                    
                    // Description Field
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Popis (volitelné)")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        TextField("Popište svou aspiraci podrobněji...", text: $aspirationDescription, axis: .vertical)
                            .font(DesignSystem.Typography.body)
                            .padding(DesignSystem.Spacing.md)
                            .frame(minHeight: 100, alignment: .top)
                            .background(DesignSystem.Colors.surface)
                            .cornerRadius(DesignSystem.CornerRadius.md)
                            .overlay(
                                RoundedRectangle(cornerRadius: DesignSystem.CornerRadius.md)
                                    .stroke(DesignSystem.Colors.textTertiary.opacity(0.3), lineWidth: 1)
                            )
                            .lineLimit(4...8)
                    }
                    
                    // Color Picker
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                        Text("Barva")
                            .font(DesignSystem.Typography.headline)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        HStack(spacing: DesignSystem.Spacing.md) {
                            ForEach(colors, id: \.self) { color in
                                Button(action: {
                                    selectedColor = color
                                }) {
                                    Circle()
                                        .fill(Color(hex: color))
                                        .frame(width: 40, height: 40)
                                        .overlay(
                                            Circle()
                                                .stroke(selectedColor == color ? DesignSystem.Colors.primary : Color.clear, lineWidth: 3)
                                        )
                                }
                            }
                        }
                    }
                    
                    // Add Button
                    Button(action: {
                        addAspiration()
                    }) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Text("Přidat aspiraci")
                                    .font(DesignSystem.Typography.headline)
                                    .fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(DesignSystem.Spacing.md)
                        .background(aspirationTitle.isEmpty || isLoading ? DesignSystem.Colors.textTertiary : DesignSystem.Colors.primary)
                        .foregroundColor(.white)
                        .cornerRadius(DesignSystem.CornerRadius.md)
                    }
                    .disabled(aspirationTitle.isEmpty || isLoading)
                    .padding(.top, DesignSystem.Spacing.md)
                }
                .padding(DesignSystem.Spacing.lg)
            }
            .background(DesignSystem.Colors.background)
            .navigationTitle("Nová aspirace")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Zrušit") {
                        dismiss()
                    }
                    .foregroundColor(DesignSystem.Colors.textSecondary)
                }
            }
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func addAspiration() {
        isLoading = true
        
        Task {
            do {
                let aspirationRequest = CreateAspirationRequest(
                    title: aspirationTitle,
                    description: aspirationDescription.isEmpty ? nil : aspirationDescription,
                    color: selectedColor,
                    icon: nil
                )
                
                _ = try await apiManager.createAspiration(aspirationRequest)
                
                await MainActor.run {
                    isLoading = false
                    onAspirationAdded()
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }
}

// MARK: - Color Extension
// Color extension with init(hex:) is now defined in DesignSystem.swift

#Preview {
    AspirationsOverviewView()
}
