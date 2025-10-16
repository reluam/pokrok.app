# Pokrok iOS

iOS aplikace pro osobní rozvoj a smysluplné žití, vytvořená ve SwiftUI.

## Funkce

- **Domů** - Přehled dnešních a zpožděných kroků
- **Přehled** - Statistiky a celkový pokrok
- **Cíle** - Správa osobních cílů
- **Kroky** - Denní kroky k dosažení cílů
- **Nastavení** - Konfigurace aplikace

## Technologie

- **SwiftUI** - Moderní iOS UI framework
- **iOS 17+** - Minimální verze iOS
- **Xcode 15+** - Vývojové prostředí

## Instalace

1. Otevřete `Pokrok.xcodeproj` v Xcode
2. Vyberte simulátor nebo zařízení
3. Stiskněte ⌘+R pro spuštění

## Struktura projektu

```
Pokrok/
├── Sources/
│   ├── PokrokApp.swift      # Hlavní aplikace
│   ├── ContentView.swift    # Hlavní navigace
│   ├── DashboardView.swift  # Domů screen
│   ├── OverviewView.swift   # Přehled screen
│   └── OtherViews.swift     # Ostatní screens
├── Assets.xcassets/         # Ikony a barvy
└── Preview Content/         # Preview assets
```

## Vývoj

Projekt je připraven pro:
- Přidání Clerk autentizace
- Integraci s API
- Implementaci glassmorphism efektů
- Přidání nativních iOS funkcí

## Budoucí funkce

- [ ] Clerk autentizace
- [ ] API integrace
- [ ] Glassmorphism design
- [ ] Face ID/Touch ID
- [ ] Apple Pay integrace
- [ ] Widgets
- [ ] Notifikace
