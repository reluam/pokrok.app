import Foundation
import SwiftUI

enum AppLocale: String, CaseIterable {
    case cs = "cs"
    case en = "en"
    
    var displayName: String {
        switch self {
        case .cs: return "Čeština"
        case .en: return "English"
        }
    }
}

class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()
    
    @Published var currentLocale: AppLocale = .cs {
        didSet {
            // Only save to UserDefaults if not during initialization
            if !isInitializing {
                UserDefaults.standard.set(currentLocale.rawValue, forKey: "app_locale")
                loadTranslations()
            }
        }
    }
    
    private var translations: [String: String] = [:]
    private var isInitializing = true
    
    private init() {
        // Load saved locale or default to system locale
        let initialLocale: AppLocale
        if let savedLocale = UserDefaults.standard.string(forKey: "app_locale"),
           let locale = AppLocale(rawValue: savedLocale) {
            initialLocale = locale
        } else {
            // Try to detect system locale
            let systemLocale = Foundation.Locale.current.languageCode ?? "en"
            initialLocale = systemLocale == "cs" ? .cs : .en
        }
        
        // Set locale directly without triggering didSet during initialization
        _currentLocale = Published(initialValue: initialLocale)
        loadTranslations()
        isInitializing = false
    }
    
    private func loadTranslations() {
        guard let url = Bundle.main.url(forResource: "translations_\(currentLocale.rawValue)", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            // Fallback to English if current locale fails
            if currentLocale != .en {
                let previousLocale = currentLocale
                currentLocale = .en
                if let fallbackUrl = Bundle.main.url(forResource: "translations_en", withExtension: "json"),
                   let fallbackData = try? Data(contentsOf: fallbackUrl),
                   let fallbackJson = try? JSONSerialization.jsonObject(with: fallbackData) as? [String: Any] {
                    translations = flattenDictionary(fallbackJson, prefix: "")
                } else {
                    // If even English fails, keep previous locale but with empty translations
                    currentLocale = previousLocale
                    translations = [:]
                }
            } else {
                translations = [:]
            }
            return
        }
        
        // Flatten nested JSON structure
        translations = flattenDictionary(json, prefix: "")
    }
    
    private func flattenDictionary(_ dict: [String: Any], prefix: String) -> [String: String] {
        var result: [String: String] = [:]
        
        for (key, value) in dict {
            let fullKey = prefix.isEmpty ? key : "\(prefix).\(key)"
            
            if let nestedDict = value as? [String: Any] {
                result.merge(flattenDictionary(nestedDict, prefix: fullKey)) { (_, new) in new }
            } else if let stringValue = value as? String {
                result[fullKey] = stringValue
            }
        }
        
        return result
    }
    
    func t(_ key: String, fallback: String? = nil) -> String {
        return translations[key] ?? fallback ?? key
    }
    
    func updateLocale(_ locale: AppLocale) {
        currentLocale = locale
    }
}

// Convenience extension for SwiftUI
extension View {
    func localized(_ key: String, fallback: String? = nil) -> String {
        return LocalizationManager.shared.t(key, fallback: fallback)
    }
}

// Convenience function for easier access
func t(_ key: String, fallback: String? = nil) -> String {
    return LocalizationManager.shared.t(key, fallback: fallback)
}

