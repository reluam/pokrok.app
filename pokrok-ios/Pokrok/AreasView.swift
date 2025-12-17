import SwiftUI

struct AreasView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var aspirations: [Aspiration] = []
    @State private var balances: [String: AspirationBalance] = [:]
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var showAddAspirationModal = false
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám oblasti...")
            } else {
                ScrollView {
                    LazyVStack(spacing: DesignSystem.Spacing.lg) {
                        // Header
                        headerSection
                        
                        // Aspirations List
                        aspirationsSection
                        
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
        .navigationTitle("Oblasti")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showAddAspirationModal = true
                }) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(DesignSystem.Colors.dynamicPrimary)
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
        PlayfulCard(variant: .pink) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
                        Text("Oblasti")
                            .font(DesignSystem.Typography.title2)
                            .foregroundColor(DesignSystem.Colors.textPrimary)
                        
                        Text("\(aspirations.count) oblastí celkem")
                            .font(DesignSystem.Typography.caption)
                            .foregroundColor(DesignSystem.Colors.textSecondary)
                    }
                    
                    Spacer()
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
                    icon: "folder",
                    title: "Zatím nemáte žádné oblasti",
                    subtitle: "Vytvořte svou první oblast, která vás povede k vašim životním cílům",
                    actionTitle: "Přidat oblast"
                ) {
                    showAddAspirationModal = true
                }
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
        PlayfulCard(variant: .purple) {
            VStack(alignment: .leading, spacing: DesignSystem.Spacing.sm) {
                // Header with title and color indicator
                HStack(alignment: .top, spacing: DesignSystem.Spacing.md) {
                    // Color indicator
                    Circle()
                        .fill(Color(hex: aspiration.color))
                        .frame(width: 16, height: 16)
                    
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
                }
            }
            .padding(DesignSystem.Spacing.md)
        }
    }
    
    // MARK: - Aspiration Balance View
    private func aspirationBalanceView(_ balance: AspirationBalance) -> some View {
        VStack(alignment: .leading, spacing: DesignSystem.Spacing.xs) {
            // Progress bar
            PlayfulProgressBar(
                progress: balance.completionRateRecent / 100.0,
                height: 8,
                variant: .yellowGreen
            )
            
            // Stats
            HStack(spacing: DesignSystem.Spacing.md) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(balance.recentCompletedSteps + balance.recentCompletedHabits)/\(balance.recentPlannedSteps + balance.recentPlannedHabits)")
                        .font(DesignSystem.Typography.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(DesignSystem.Colors.textPrimary)
                    
                    Text("Splněno")
                        .font(DesignSystem.Typography.caption2)
                        .foregroundColor(DesignSystem.Colors.textSecondary)
                }
                
                Spacer()
                
                Text("\(Int(balance.completionRateRecent))%")
                    .font(DesignSystem.Typography.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(DesignSystem.Colors.dynamicPrimary)
            }
        }
    }
    
    // MARK: - Data Loading
    private func loadData() async {
        isLoading = true
        do {
            let fetchedAspirations = try await apiManager.fetchAspirations()
            
            // Fetch balances for all aspirations
            var fetchedBalances: [String: AspirationBalance] = [:]
            for aspiration in fetchedAspirations {
                do {
                    let balance = try await apiManager.fetchAspirationBalance(aspirationId: aspiration.id)
                    fetchedBalances[aspiration.id] = balance
                } catch {
                    // Continue if one fails
                    continue
                }
            }
            
            await MainActor.run {
                self.aspirations = fetchedAspirations
                self.balances = fetchedBalances
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

