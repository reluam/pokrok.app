import SwiftUI
import Clerk

struct AuthView: View {
    @Environment(\.clerk) private var clerk
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showError = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.orange)
                    
                    Text("Vítejte v Pokrok")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Přihlaste se nebo vytvořte si účet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                // Email/Password Form
                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(.headline)
                        TextField("Zadejte email", text: $email)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Heslo")
                            .font(.headline)
                        SecureField("Zadejte heslo", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    
                    // Sign In/Up Button
                    Button(action: handleEmailAuth) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            }
                            Text(isSignUp ? "Vytvořit účet" : "Přihlásit se")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isLoading || email.isEmpty || password.isEmpty)
                    
                    // Toggle Sign Up/Sign In
                    Button(action: {
                        isSignUp.toggle()
                        errorMessage = ""
                    }) {
                        Text(isSignUp ? "Už máte účet? Přihlaste se" : "Nemáte účet? Vytvořte si ho")
                            .foregroundColor(.orange)
                    }
                }
                .padding(.horizontal)
                
                // OAuth Buttons
                VStack(spacing: 16) {
                    Text("Nebo")
                        .foregroundColor(.secondary)
                    
                    // Google Sign In
                    Button(action: handleGoogleSignIn) {
                        HStack {
                            Image(systemName: "globe")
                            Text("Pokračovat s Google")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isLoading)
                    
                    // Apple Sign In (only on real device)
                    #if !targetEnvironment(simulator)
                    Button(action: handleAppleSignIn) {
                        HStack {
                            Image(systemName: "applelogo")
                            Text("Pokračovat s Apple")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.black)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isLoading)
                    #else
                    VStack(spacing: 8) {
                        Text("Apple Sign In není dostupný v simulátoru")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Text("Použijte Google nebo email přihlášení")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(8)
                    #endif
                }
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .alert("Chyba", isPresented: $showError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private func handleEmailAuth() {
        isLoading = true
        errorMessage = ""
        
        Task {
            do {
                if isSignUp {
                    try await clerk.signUp.create(.init(emailAddress: email, password: password))
                } else {
                    try await clerk.signIn.create(.init(identifier: email, password: password))
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
            
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    private func handleGoogleSignIn() {
        isLoading = true
        errorMessage = ""
        
        Task {
            do {
                try await clerk.signIn.create(.init(strategy: .google))
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
            
            await MainActor.run {
                isLoading = false
            }
        }
    }
    
    private func handleAppleSignIn() {
        isLoading = true
        errorMessage = ""
        
        Task {
            do {
                try await clerk.signIn.create(.init(strategy: .apple))
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
            
            await MainActor.run {
                isLoading = false
            }
        }
    }
}