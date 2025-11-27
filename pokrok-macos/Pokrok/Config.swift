import Foundation

/// Konfigurace aplikace
/// Nastavte zde své API klíče a URLs
enum Config {
    // MARK: - Clerk Authentication
    
    /// Váš Clerk Publishable Key (začíná pk_test_ nebo pk_live_)
    /// Najdete v Clerk Dashboard -> API Keys
    static let clerkPublishableKey = "pk_test_YOUR_PUBLISHABLE_KEY"
    
    /// Clerk Frontend API domain
    /// Automaticky se extrahuje z publishable key, nebo nastavte přímo
    static var clerkFrontendAPI: String {
        // Pokud máte custom domain, nastavte ho zde
        // return "auth.yourdomain.com"
        
        // Jinak extrahujeme z publishable key
        if clerkPublishableKey.hasPrefix("pk_test_") {
            let encoded = String(clerkPublishableKey.dropFirst(8))
            if let decoded = decodeBase64URL(encoded) {
                return decoded
            }
        } else if clerkPublishableKey.hasPrefix("pk_live_") {
            let encoded = String(clerkPublishableKey.dropFirst(8))
            if let decoded = decodeBase64URL(encoded) {
                return decoded
            }
        }
        return "your-app.clerk.accounts.dev"
    }
    
    // MARK: - API Configuration
    
    /// Base URL pro váš backend API
    /// Pro development použijte localhost, pro production vaši doménu
    static var apiBaseURL: String {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://your-production-api.com"
        #endif
    }
    
    // MARK: - App Configuration
    
    /// URL scheme pro OAuth callback
    /// Musí odpovídat tomu, co je v Info.plist
    static let callbackURLScheme = "pokrok"
    
    /// Bundle identifier
    static let bundleIdentifier = "com.smysluplneziti.pokrok"
    
    // MARK: - Helpers
    
    private static func decodeBase64URL(_ string: String) -> String? {
        var base64 = string
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        
        // Add padding if needed
        while base64.count % 4 != 0 {
            base64.append("=")
        }
        
        guard let data = Data(base64Encoded: base64),
              let decoded = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return decoded
    }
}

// MARK: - Usage Instructions
/*
 
 ## Jak nastavit Clerk autentizaci:
 
 1. Jděte na https://dashboard.clerk.com
 2. Vytvořte novou aplikaci nebo použijte existující
 3. V API Keys zkopírujte "Publishable key"
 4. Vložte ho do clerkPublishableKey výše
 
 ## Jak nastavit URL scheme pro OAuth callback:
 
 V Xcode:
 1. Vyberte target Pokrok
 2. Jděte do Info tab
 3. Rozbalte "URL Types"
 4. Přidejte nový URL Type:
    - Identifier: com.smysluplneziti.pokrok
    - URL Schemes: pokrok
 
 ## Clerk Dashboard nastavení:
 
 V Clerk Dashboard -> Paths:
 - Přidejte "pokrok://callback" jako Allowed redirect URL
 
 */

