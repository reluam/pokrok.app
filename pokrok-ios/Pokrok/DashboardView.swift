import SwiftUI

struct DashboardView: View {
    @StateObject private var apiManager = APIManager.shared
    @State private var userSettings: UserSettings?
    @State private var isLoading = true
    @State private var errorMessage = ""
    @State private var showError = false
    
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
            // Refresh token for widget every time app becomes active (non-blocking)
            Task {
                await apiManager.refreshTokenForWidget()
            }
        }
    }
    
    // MARK: - Data Loading
    private func loadData() {
        Task {
            do {
                // Load settings in background, don't block UI
                let fetchedSettings = try await apiManager.fetchUserSettings()
                
                await MainActor.run {
                    self.userSettings = fetchedSettings
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
}

#Preview {
    DashboardView()
}
