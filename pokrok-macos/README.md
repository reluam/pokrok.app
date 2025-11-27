# Pokrok macOS

Nativní macOS aplikace pro gamifikovaný systém sledování cílů a návyků.

## Funkce

- 🎯 **Správa cílů** - Vytvářejte, sledujte a dokončujte své cíle
- 🔄 **Návyky** - Budujte pozitivní návyky se streaky
- 📅 **Denní plánování** - Plánujte svůj den s přehledem
- 📊 **Statistiky** - Sledujte svůj pokrok v čase
- 🔥 **Gamifikace** - XP, levely a achievementy

## Požadavky

- macOS 14.0+
- Xcode 15.0+
- Swift 5.9+

## Instalace

1. Otevřete `Pokrok.xcodeproj` v Xcode
2. Nastavte API URL v Settings → Vývojář
3. Spusťte aplikaci (⌘R)

## Architektura

```
Pokrok/
├── PokrokApp.swift      # Entry point
├── Models.swift         # Datové modely
├── APIManager.swift     # API komunikace
├── AuthManager.swift    # Autentizace
├── ContentView.swift    # Hlavní navigace
├── AuthView.swift       # Přihlašovací obrazovka
├── DashboardView.swift  # Hlavní přehled
├── GoalsView.swift      # Správa cílů
├── HabitsView.swift     # Správa návyků
├── DayPlanView.swift    # Denní plánování
├── StatisticsView.swift # Statistiky
└── SettingsView.swift   # Nastavení
```

## API

Aplikace komunikuje se stejným backendem jako webová verze (`pokrok-game-web`).

### Endpoints

- `GET /api/game/init` - Inicializace hry
- `GET/POST /api/goals` - CRUD pro cíle
- `GET/POST /api/habits` - CRUD pro návyky
- `POST /api/habits/:id/complete` - Označení návyku jako splněného

## Vývoj

### Demo režim

Pro vývoj bez backendu použijte Demo režim v přihlašovací obrazovce.

### Konfigurace API

V Settings → Vývojář můžete změnit base URL API.

## Roadmap

- [ ] Plná integrace s Clerk autentizací
- [ ] Offline podpora
- [ ] Menu bar widget
- [ ] Klávesové zkratky
- [ ] Notifikace
- [ ] Sync s iOS aplikací

## Licence

Proprietární - © 2024 Smysluplně žití

