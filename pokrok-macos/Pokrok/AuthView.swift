import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var isHoveringSignIn = false
    @State private var isHoveringSignUp = false
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color(red: 1, green: 0.95, blue: 0.9),
                    Color.white,
                    Color(red: 1, green: 0.97, blue: 0.93)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Decorative circles
            GeometryReader { geometry in
                Circle()
                    .fill(Color.orange.opacity(0.1))
                    .frame(width: 300, height: 300)
                    .offset(x: -100, y: -50)
                
                Circle()
                    .fill(Color.orange.opacity(0.08))
                    .frame(width: 200, height: 200)
                    .offset(x: geometry.size.width - 150, y: geometry.size.height - 200)
            }
            
            VStack(spacing: 40) {
                Spacer()
                
                // Logo and title
                VStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.orange, Color.orange.opacity(0.8)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                            .shadow(color: .orange.opacity(0.3), radius: 20, x: 0, y: 10)
                        
                        Image(systemName: "flame.fill")
                            .font(.system(size: 50))
                            .foregroundColor(.white)
                    }
                    
                    Text("Pokrok")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.orange, Color.orange.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    
                    Text("Gamifikovaný systém pro dosažení cílů")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Sign in buttons
                VStack(spacing: 16) {
                    // Sign In button
                    Button(action: {
                        authManager.signIn()
                    }) {
                        HStack(spacing: 12) {
                            if authManager.isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "person.fill")
                                    .font(.title2)
                            }
                            Text("Přihlásit se")
                                .font(.headline)
                        }
                        .frame(maxWidth: 280)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(
                                colors: [Color.orange, Color.orange.opacity(0.9)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .shadow(color: .orange.opacity(isHoveringSignIn ? 0.4 : 0.2), radius: isHoveringSignIn ? 15 : 10, x: 0, y: 5)
                    }
                    .buttonStyle(.plain)
                    .onHover { hovering in
                        withAnimation(.easeInOut(duration: 0.2)) {
                            isHoveringSignIn = hovering
                        }
                    }
                    .scaleEffect(isHoveringSignIn ? 1.02 : 1.0)
                    .disabled(authManager.isLoading)
                    
                    // Sign Up button
                    Button(action: {
                        authManager.signUp()
                    }) {
                        HStack(spacing: 12) {
                            Image(systemName: "person.badge.plus")
                                .font(.title2)
                            Text("Vytvořit účet")
                                .font(.headline)
                        }
                        .frame(maxWidth: 280)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .foregroundColor(.orange)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.orange, lineWidth: 2)
                        )
                        .shadow(color: .black.opacity(isHoveringSignUp ? 0.1 : 0.05), radius: isHoveringSignUp ? 10 : 5, x: 0, y: 3)
                    }
                    .buttonStyle(.plain)
                    .onHover { hovering in
                        withAnimation(.easeInOut(duration: 0.2)) {
                            isHoveringSignUp = hovering
                        }
                    }
                    .scaleEffect(isHoveringSignUp ? 1.02 : 1.0)
                    .disabled(authManager.isLoading)
                    
                    // Error message
                    if let error = authManager.error {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding(.top, 8)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: 280)
                    }
                    
                    Divider()
                        .frame(maxWidth: 200)
                        .padding(.vertical, 16)
                    
                    // Demo mode
                    Button(action: {
                        authManager.signInDemo()
                    }) {
                        Text("Pokračovat v demo režimu")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .buttonStyle(.plain)
                }
                
                Spacer()
                
                // Footer
                Text("© 2024 Pokrok • Smysluplně žití")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 20)
            }
            .padding(40)
        }
        .frame(minWidth: 500, minHeight: 600)
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager())
}
