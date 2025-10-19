import SwiftUI

struct DashboardView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var userSettings: UserSettings?
    @State private var dailySteps: [DailyStep] = []
    @State private var isLoading = true
    @State private var showAddStepModal = false
    @State private var errorMessage = ""
    @State private var showError = false
    @State private var selectedStep: DailyStep?
    
    var body: some View {
        NavigationView {
            if isLoading {
                LoadingView(message: "Načítám vaši cestu...")
            } else {
                // Show appropriate view based on user settings
                if userSettings?.workflow == "no_workflow" {
                    NoWorkflowView()
                } else {
                    DailyPlanningView()
                }
            }
        }
        .onAppear {
            loadData()
            // Refresh token for widget every time app becomes active
            Task {
                await apiManager.refreshTokenForWidget()
            }
        }
    }
    
    // MARK: - Data Loading
    private func loadData() {
        print("🔍 Main App: loadData called")
        Task {
            do {
                print("🔍 Main App: Starting API call for user settings...")
                let fetchedSettings = try await apiManager.fetchUserSettings()
                
                print("🔍 Main App: API call completed - Settings: \(fetchedSettings.workflow)")
                
                await MainActor.run {
                    self.userSettings = fetchedSettings
                    self.isLoading = false
                }
            } catch {
                print("🔍 Main App: API call failed: \(error)")
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                    self.isLoading = false
                }
            }
        }
    }
}

#Preview {
    DashboardView()
}
