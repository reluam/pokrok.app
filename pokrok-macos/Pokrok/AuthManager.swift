import Foundation
import AuthenticationServices
import SwiftUI

class AuthManager: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var userId: String?
    @Published var userEmail: String?
    @Published var sessionToken: String?
    @Published var error: String?
    
    private let keychainService = "com.pokrok.macos"
    private let tokenKey = "sessionToken"
    private let userIdKey = "userId"
    private let userEmailKey = "userEmail"
    
    // Clerk configuration
    // Use your web app URL for sign-in, not Clerk's API domain
    private let webAppURL = "https://pokrok.app"
    private let callbackURLScheme = "pokrok"
    
    private var webAuthSession: ASWebAuthenticationSession?
    private var presentationContextProvider: AuthPresentationContextProvider?
    
    override init() {
        super.init()
        checkExistingSession()
    }
    
    private func checkExistingSession() {
        if let userId = getFromKeychain(key: userIdKey) {
            let token = getFromKeychain(key: tokenKey)
            self.sessionToken = token
            self.userId = userId
            self.userEmail = getFromKeychain(key: userEmailKey)
            self.isAuthenticated = true
            
            // Configure API manager
            APIManager.shared.setUserId(userId)
            APIManager.shared.setAuthToken(token)
            
            // Optionally validate token
            Task {
                await validateSession()
            }
        }
    }
    
    // MARK: - Web-based Sign In
    
    func signIn() {
        error = nil
        
        // Use web app's sign-in, then redirect to our callback endpoint
        let signInURLString = "\(webAppURL)/sign-in?redirect_url=/api/auth/macos-callback"
        
        guard let signInURL = URL(string: signInURLString) else {
            self.error = "Invalid sign-in URL"
            return
        }
        
        // Open in default browser
        NSWorkspace.shared.open(signInURL)
    }
    
    func signUp() {
        error = nil
        
        let signUpURLString = "\(webAppURL)/sign-up?redirect_url=/api/auth/macos-callback"
        
        guard let signUpURL = URL(string: signUpURLString) else {
            self.error = "Invalid sign-up URL"
            return
        }
        
        // Open in default browser
        NSWorkspace.shared.open(signUpURL)
    }
    
    // Handle URL callback from browser
    func handleURL(_ url: URL) {
        handleAuthCallback(callbackURL: url, error: nil)
    }
    
    private func handleAuthCallback(callbackURL: URL?, error: Error?) {
        isLoading = false
        
        if let error = error {
            if (error as NSError).code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                self.error = nil // User cancelled
            } else {
                self.error = error.localizedDescription
            }
            return
        }
        
        guard let callbackURL = callbackURL else {
            self.error = "No callback URL received"
            return
        }
        
        // Parse callback URL
        // Expected: pokrok://auth/callback?user_id=xxx&session_id=xxx
        let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)
        
        if let clerkUserId = components?.queryItems?.first(where: { $0.name == "user_id" })?.value {
            let sessionId = components?.queryItems?.first(where: { $0.name == "session_id" })?.value
            
            // Save user ID and configure API manager
            self.userId = clerkUserId
            self.sessionToken = sessionId
            self.isAuthenticated = true
            
            saveToKeychain(key: userIdKey, value: clerkUserId)
            if let sessionId = sessionId {
                saveToKeychain(key: tokenKey, value: sessionId)
            }
            
            // Configure API manager with user ID
            APIManager.shared.setUserId(clerkUserId)
            APIManager.shared.setAuthToken(sessionId)
            
            // Fetch additional user data
            Task {
                await fetchSessionAfterAuth()
            }
        } else {
            self.error = "Authentication failed - no user ID received"
        }
    }
    
    private func fetchSessionAfterAuth() async {
        // After web auth completes, we need to get the session
        // This would typically be done via your backend API
        do {
            let gameData = try await APIManager.shared.fetchGameData()
            await MainActor.run {
                self.userId = gameData.user.id
                self.userEmail = gameData.user.email
                self.isAuthenticated = true
                
                saveToKeychain(key: userIdKey, value: gameData.user.id)
                if !gameData.user.email.isEmpty {
                    saveToKeychain(key: userEmailKey, value: gameData.user.email)
                }
            }
        } catch {
            await MainActor.run {
                self.error = "Failed to fetch user data: \(error.localizedDescription)"
            }
        }
    }
    
    private func saveSession(token: String, userId: String, email: String?) {
        self.sessionToken = token
        self.userId = userId
        self.userEmail = email
        self.isAuthenticated = true
        
        saveToKeychain(key: tokenKey, value: token)
        saveToKeychain(key: userIdKey, value: userId)
        if let email = email {
            saveToKeychain(key: userEmailKey, value: email)
        }
        
        // Update API manager with token
        APIManager.shared.setAuthToken(token)
    }
    
    private func validateSession() async {
        // Validate session is still valid
        do {
            _ = try await APIManager.shared.fetchGameData()
            // Session is valid
        } catch {
            // Session invalid, sign out
            await MainActor.run {
                signOut()
            }
        }
    }
    
    // MARK: - Sign Out
    
    func signOut() {
        deleteFromKeychain(key: tokenKey)
        deleteFromKeychain(key: userIdKey)
        deleteFromKeychain(key: userEmailKey)
        
        sessionToken = nil
        userId = nil
        userEmail = nil
        isAuthenticated = false
        
        APIManager.shared.setAuthToken(nil)
    }
    
    // MARK: - Demo Mode
    
    func signInDemo() {
        isAuthenticated = true
        userId = "demo-user"
        userEmail = "demo@pokrok.app"
    }
    
    // MARK: - Keychain Helpers
    
    private func saveToKeychain(key: String, value: String) {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func getFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    private func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Presentation Context Provider

class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return NSApplication.shared.windows.first ?? ASPresentationAnchor()
    }
}
