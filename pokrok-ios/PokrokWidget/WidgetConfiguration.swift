import Foundation
import WidgetKit

struct PokrokWidgetConfiguration {
    static let shared = PokrokWidgetConfiguration()
    
    // App Group identifier for data sharing
    let appGroupIdentifier = "group.com.smysluplneziti.pokrok"
    
    // API Configuration
    let baseURL = "https://www.pokrok.app/api"
    
    // Widget update intervals
    let updateInterval: TimeInterval = 3600 // 1 hour
    
    // Maximum number of items to display per widget size
    let maxItemsSmall = 2
    let maxItemsMedium = 4
    let maxItemsLarge = 6
    
    // Inspiration activities
    let inspirations = [
        ("☕", "Dejte si kávu a odpočiňte si", "Relaxace"),
        ("📚", "Přečtěte si kapitolu z knihy", "Vzdělávání"),
        ("🚶‍♂️", "Jděte se projít na čerstvý vzduch", "Pohyb"),
        ("🧘‍♀️", "Zameditujte 10 minut", "Mindfulness"),
        ("👥", "Zkontaktujte někoho blízkého", "Sociální"),
        ("🎵", "Poslechněte si oblíbenou hudbu", "Zábava"),
        ("🌱", "Zalijte pokojové rostliny", "Péče"),
        ("✍️", "Napište si deník", "Reflexe"),
        ("🎨", "Nakreslete nebo vybarvěte", "Kreativita"),
        ("🍃", "Udělate si čaj a relaxujte", "Pohoda"),
        ("📱", "Odpojte se od technologií", "Digitální detox"),
        ("🏃‍♂️", "Jděte si zaběhat", "Sport"),
        ("🍳", "Uvařte si něco dobrého", "Vaření"),
        ("📖", "Přečtěte si článek", "Čtení"),
        ("🎯", "Naplánujte zítřejší den", "Plánování")
    ]
    
    private init() {}
    
    func getRandomInspiration() -> (String, String, String) {
        return inspirations.randomElement() ?? inspirations[0]
    }
    
    func getMaxItems(for family: WidgetFamily) -> Int {
        switch family {
        case .systemSmall:
            return maxItemsSmall
        case .systemMedium:
            return maxItemsMedium
        case .systemLarge:
            return maxItemsLarge
        default:
            return maxItemsMedium
        }
    }
    
    func getSharedUserDefaults() -> UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }
}
