import Foundation

struct AppConfig {
    static let shared = AppConfig()
    
    // MARK: - Environment Detection
    
    var isDebug: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
    
    var environment: AppEnvironment {
        return isDebug ? .debug : .production
    }
    
    // MARK: - Configuration Properties
    
    var bundleIdentifier: String {
        switch environment {
        case .debug:
            return "com.pokrok.app.debug"
        case .production:
            return "com.pokrok.app"
        }
    }
    
    var apiBaseURL: String {
        switch environment {
        case .debug:
            return "http://127.0.0.1:3000/api/cesta"  // Lokální server pro testování
        case .production:
            return "https://www.pokrok.app/api/cesta"  // Produkční server
        }
    }
    
    var clerkPublishableKey: String {
        switch environment {
        case .debug:
            return "pk_test_aWRlYWwta29pLTE4LmNsZXJrLmFjY291bnRzLmRldiQ"  // Test key
        case .production:
            return "pk_live_YOUR_PRODUCTION_KEY_HERE"  // Produkční key (budete muset nahradit)
        }
    }
    
    var appGroupIdentifier: String {
        switch environment {
        case .debug:
            return "group.com.smysluplneziti.pokrok.debug"
        case .production:
            return "group.com.smysluplneziti.pokrok"
        }
    }
    
    var appName: String {
        switch environment {
        case .debug:
            return "Pokrok (Debug)"
        case .production:
            return "Pokrok"
        }
    }
    
    // MARK: - Debug Info
    
    var debugInfo: String {
        return """
        Environment: \(environment.rawValue)
        Bundle ID: \(bundleIdentifier)
        API URL: \(apiBaseURL)
        App Group: \(appGroupIdentifier)
        """
    }
}

enum AppEnvironment: String, CaseIterable {
    case debug = "Debug"
    case production = "Production"
}
