import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var apiManager: APIManager
    
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    @AppStorage("selectedLanguage") private var selectedLanguage = "cs"
    @AppStorage("apiBaseURL") private var apiBaseURL = "http://localhost:3000"
    
    var body: some View {
        TabView {
            // General settings
            Form {
                Section("Obecné") {
                    Toggle("Zvuky", isOn: $soundEnabled)
                    Toggle("Notifikace", isOn: $notificationsEnabled)
                    
                    Picker("Jazyk", selection: $selectedLanguage) {
                        Text("Čeština").tag("cs")
                        Text("English").tag("en")
                    }
                }
                
                Section("Vzhled") {
                    Text("Nastavení vzhledu bude brzy dostupné")
                        .foregroundColor(.secondary)
                }
            }
            .formStyle(.grouped)
            .tabItem {
                Label("Obecné", systemImage: "gear")
            }
            
            // Account settings
            Form {
                Section("Účet") {
                    if authManager.isAuthenticated {
                        LabeledContent("Email", value: authManager.userEmail ?? "Neznámý")
                        LabeledContent("ID", value: authManager.userId ?? "Neznámé")
                        
                        Button("Odhlásit se", role: .destructive) {
                            authManager.signOut()
                        }
                    } else {
                        Text("Nejste přihlášeni")
                            .foregroundColor(.secondary)
                        
                        Button("Přihlásit se") {
                            authManager.signIn()
                        }
                    }
                }
            }
            .formStyle(.grouped)
            .tabItem {
                Label("Účet", systemImage: "person.circle")
            }
            
            // API settings (for development)
            Form {
                Section("API") {
                    TextField("Base URL", text: $apiBaseURL)
                        .textFieldStyle(.roundedBorder)
                    
                    Text("Použijte pro vývoj a testování")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Section("Debug") {
                    Button("Načíst demo data") {
                        authManager.signInDemo()
                    }
                    
                    Button("Vymazat cache") {
                        // Clear local cache
                    }
                }
            }
            .formStyle(.grouped)
            .tabItem {
                Label("Vývojář", systemImage: "hammer")
            }
        }
        .frame(width: 450, height: 300)
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager())
        .environmentObject(APIManager())
}

