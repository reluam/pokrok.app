import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authManager: AuthManager
    
    @State private var selectedTab: SettingsTab = .user
    @State private var user: UserData?
    @State private var player: Player?
    @State private var isLoading = true
    
    enum SettingsTab: String, CaseIterable {
        case user = "Uživatel"
        case goals = "Cíle"
        case steps = "Kroky"
        case statistics = "Statistiky"
        case workflows = "Workflows"
        case display = "Zobrazení"
        case danger = "Účet"
        
        var icon: String {
            switch self {
            case .user: return "person.fill"
            case .goals: return "target"
            case .steps: return "footprints"
            case .statistics: return "chart.bar.fill"
            case .workflows: return "arrow.triangle.branch"
            case .display: return "eye.fill"
            case .danger: return "person.circle.fill"
            }
        }
    }
    
    private let primaryOrange = Color(red: 0.918, green: 0.345, blue: 0.047)
    
    var body: some View {
        NavigationStack {
            HStack(spacing: 0) {
                // Sidebar with tabs
                VStack(alignment: .leading, spacing: 0) {
                    Text("Nastavení")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 16)
                    
                    Divider()
                    
                    ScrollView {
                        VStack(alignment: .leading, spacing: 4) {
                            ForEach(SettingsTab.allCases, id: \.self) { tab in
                                TabButton(
                                    tab: tab,
                                    isSelected: selectedTab == tab,
                                    primaryOrange: primaryOrange
                                ) {
                                    selectedTab = tab
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
                        if isLoading {
                            ProgressView()
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                        } else {
                            tabContentView
                        }
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
        .task {
            await loadData()
        }
    }
    
    @ViewBuilder
    private var tabContentView: some View {
        switch selectedTab {
        case .user:
            UserSettingsView(user: user, primaryOrange: primaryOrange)
        case .goals:
            GoalsSettingsView(primaryOrange: primaryOrange)
        case .steps:
            StepsSettingsView(primaryOrange: primaryOrange)
        case .statistics:
            StatisticsSettingsView(primaryOrange: primaryOrange)
        case .workflows:
            WorkflowsSettingsView(primaryOrange: primaryOrange)
        case .display:
            DisplaySettingsView(primaryOrange: primaryOrange)
        case .danger:
            DangerSettingsView(
                authManager: authManager,
                primaryOrange: primaryOrange,
                onDismiss: { dismiss() }
            )
        }
    }
    
    private func loadData() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let gameData = try await APIManager.shared.fetchGameData()
            await MainActor.run {
                self.user = gameData.user
                self.player = gameData.player
            }
        } catch {
            print("Error loading settings data: \(error)")
        }
    }
}

// MARK: - Tab Button

struct TabButton: View {
    let tab: SettingsView.SettingsTab
    let isSelected: Bool
    let primaryOrange: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: tab.icon)
                    .font(.system(size: 14))
                    .foregroundColor(isSelected ? primaryOrange : Color.gray.opacity(0.6))
                    .frame(width: 20)
                
                Text(tab.rawValue)
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

// MARK: - User Settings View

struct UserSettingsView: View {
    let user: UserData?
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            // Contact Info
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("📧")
                        .font(.system(size: 18))
                    Text("Kontaktní údaje")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    LabeledField(label: "Email", value: user?.email ?? "N/A")
                    LabeledField(label: "Jméno", value: user?.name ?? "N/A")
                }
            }
            
            // Account Info
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("📅")
                        .font(.system(size: 18))
                    Text("Účet")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    LabeledField(label: "Registrován", value: "N/A")
                    
                    LabeledField(label: "Uživatelské ID", value: user?.id ?? "N/A")
                }
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.locale = Locale(identifier: "cs_CZ")
        return formatter.string(from: date)
    }
}

struct LabeledField: View {
    let label: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(Color.gray.opacity(0.7))
            Text(value)
                .font(.system(size: 13))
                .foregroundColor(Color(white: 0.2))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(Color.white)
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
        }
    }
}

// MARK: - Goals Settings View

struct GoalsSettingsView: View {
    let primaryOrange: Color
    
    @AppStorage("goalsDefaultStatus") private var defaultStatus = "active"
    @AppStorage("goalsAutoComplete") private var autoComplete = false
    @AppStorage("goalsReminderDays") private var reminderDays = 7
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            // Basic Settings
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("📊")
                        .font(.system(size: 18))
                    Text("Základní nastavení")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Výchozí stav cíle")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.gray.opacity(0.7))
                        Picker("", selection: $defaultStatus) {
                            Text("Aktivní").tag("active")
                            Text("Splněný").tag("completed")
                            Text("Ke zvážení").tag("considering")
                        }
                        .pickerStyle(.menu)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.white)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Dny před připomínkou")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.gray.opacity(0.7))
                        TextField("", value: $reminderDays, format: .number)
                            .textFieldStyle(.plain)
                            .padding(10)
                            .background(Color.white)
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                    }
                }
            }
            
            // Automation
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("⚙️")
                        .font(.system(size: 18))
                    Text("Automatizace")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                Toggle(isOn: $autoComplete) {
                    Text("Automaticky označit cíl jako splněný při dokončení všech kroků")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray.opacity(0.7))
                }
                .toggleStyle(.checkbox)
            }
        }
    }
}

// MARK: - Steps Settings View

struct StepsSettingsView: View {
    let primaryOrange: Color
    
    @AppStorage("stepsEstimatedTimeDefault") private var estimatedTimeDefault = 30
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("👣")
                        .font(.system(size: 18))
                    Text("Nastavení kroků")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text("Výchozí odhadovaný čas (min)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color.gray.opacity(0.7))
                    TextField("", value: $estimatedTimeDefault, format: .number)
                        .textFieldStyle(.plain)
                        .padding(10)
                        .background(Color.white)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                }
            }
        }
    }
}

// MARK: - Statistics Settings View

struct StatisticsSettingsView: View {
    let primaryOrange: Color
    
    @AppStorage("statisticsShowStreaks") private var showStreaks = true
    @AppStorage("statisticsShowProgress") private var showProgress = true
    @AppStorage("statisticsShowAchievements") private var showAchievements = true
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("📈")
                        .font(.system(size: 18))
                    Text("Zobrazení")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 12) {
                    Toggle(isOn: $showStreaks) {
                        Text("Zobrazit streak")
                            .font(.system(size: 12))
                            .foregroundColor(Color.gray.opacity(0.7))
                    }
                    .toggleStyle(.checkbox)
                    
                    Toggle(isOn: $showProgress) {
                        Text("Zobrazit pokrok")
                            .font(.system(size: 12))
                            .foregroundColor(Color.gray.opacity(0.7))
                    }
                    .toggleStyle(.checkbox)
                    
                    Toggle(isOn: $showAchievements) {
                        Text("Zobrazit úspěchy")
                            .font(.system(size: 12))
                            .foregroundColor(Color.gray.opacity(0.7))
                    }
                    .toggleStyle(.checkbox)
                }
            }
        }
    }
}

// MARK: - Workflows Settings View

struct WorkflowsSettingsView: View {
    let primaryOrange: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Workflows budou brzy dostupné")
                .font(.system(size: 14))
                .foregroundColor(Color.gray.opacity(0.6))
        }
    }
}

// MARK: - Display Settings View

struct DisplaySettingsView: View {
    let primaryOrange: Color
    
    @AppStorage("displayDefaultView") private var defaultView = "day"
    @AppStorage("displayDateFormat") private var dateFormat = "DD.MM.YYYY"
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Text("👁️")
                        .font(.system(size: 18))
                    Text("Zobrazení")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Výchozí zobrazení")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.gray.opacity(0.7))
                        Picker("", selection: $defaultView) {
                            Text("Den").tag("day")
                            Text("Týden").tag("week")
                            Text("Měsíc").tag("month")
                            Text("Rok").tag("year")
                        }
                        .pickerStyle(.menu)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.white)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                    
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Formát data")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color.gray.opacity(0.7))
                        Picker("", selection: $dateFormat) {
                            Text("DD.MM.YYYY").tag("DD.MM.YYYY")
                            Text("MM/DD/YYYY").tag("MM/DD/YYYY")
                            Text("YYYY-MM-DD").tag("YYYY-MM-DD")
                            Text("DD MMM YYYY").tag("DD MMM YYYY")
                        }
                        .pickerStyle(.menu)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(Color.white)
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                }
            }
        }
    }
}

// MARK: - Danger Settings View

struct DangerSettingsView: View {
    @ObservedObject var authManager: AuthManager
    let primaryOrange: Color
    let onDismiss: () -> Void
    
    @State private var showLogoutConfirmation = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 6) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 18))
                    Text("Účet")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(white: 0.2))
                }
                
                Button(action: {
                    showLogoutConfirmation = true
                }) {
                    Text("Odhlásit se")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.red)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .alert("Odhlásit se?", isPresented: $showLogoutConfirmation) {
                    Button("Zrušit", role: .cancel) {}
                    Button("Odhlásit", role: .destructive) {
                        authManager.signOut()
                        onDismiss()
                    }
                } message: {
                    Text("Opravdu se chcete odhlásit?")
                }
            }
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager())
        .environmentObject(APIManager())
}

