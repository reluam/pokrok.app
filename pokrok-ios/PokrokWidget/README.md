# Pokrok iOS Widget

Widget pro iOS aplikaci Pokrok, který zobrazuje:
1. **Dnešní kroky** (plus zpožděné)
2. **Budoucí kroky** (plus zpožděné) 
3. **Inspirace** (aktivity pro volný čas)

## Instalace do Xcode projektu

### 1. Přidání Widget Extension Target

1. Otevřete `Pokrok.xcodeproj` v Xcode
2. File → New → Target
3. Vyberte "Widget Extension"
4. Product Name: `PokrokWidget`
5. Bundle Identifier: `com.smysluplneziti.pokrokWidget`
6. Use Core Data: Ne
7. Include Configuration Intent: Ne

### 2. Přidání souborů do projektu

Přidejte následující soubory do nového Widget targetu:

```
PokrokWidget/
├── PokrokWidgetBundle.swift
├── PokrokWidget.swift
├── WidgetViews.swift
├── SharedModels.swift
├── Info.plist
└── Assets.xcassets/
    └── Contents.json
```

### 3. Konfigurace projektu

1. **App Groups**: Přidejte App Group pro sdílení dat mezi aplikací a widgetem
   - Target Settings → Signing & Capabilities → + App Groups
   - Group ID: `group.com.smysluplneziti.pokrokWidget`

2. **Deployment Target**: Nastavte minimální iOS verzi na 16.0+ (pro WidgetKit)

3. **Dependencies**: Widget target musí mít přístup k:
   - WidgetKit framework
   - SwiftUI framework

### 4. Sdílení dat mezi aplikací a widgetem

Pro sdílení dat (např. auth token) použijte App Groups:

```swift
// V hlavní aplikaci
let sharedDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrokWidget")
sharedDefaults?.set(authToken, forKey: "auth_token")

// V widgetu
let sharedDefaults = UserDefaults(suiteName: "group.com.smysluplneziti.pokrokWidget")
let authToken = sharedDefaults?.string(forKey: "auth_token")
```

### 5. Build Settings

Ujistěte se, že:
- Widget target má správný Bundle Identifier
- Code Signing je správně nakonfigurován
- Deployment Target je iOS 16.0+

## Funkce widgetu

### Typy zobrazení

1. **Dnešní kroky** (`todaySteps`)
   - Zobrazuje nedokončené kroky pro dnešní datum
   - Zahrnuje zpožděné kroky
   - Podporuje označování jako dokončené

2. **Budoucí kroky** (`futureSteps`)
   - Zobrazuje kroky naplánované na budoucí data
   - Řazeno podle data
   - Zobrazuje cílové datum

3. **Inspirace** (`inspiration`)
   - Náhodné aktivity pro volný čas
   - Emoji ikony a popisné texty
   - Kategorie aktivit (relaxace, vzdělávání, pohyb, atd.)

### Velikosti widgetu

- **Small**: 2 kroky nebo inspirace
- **Medium**: 4 kroky nebo rozšířená inspirace  
- **Large**: Více kroků a detailní informace

### Aktualizace

Widget se aktualizuje:
- Každou hodinu automaticky
- Při otevření aplikace
- Při změně dat

## API Integration

Widget používá stejné API jako hlavní aplikace:
- `GET /api/steps` - pro načtení kroků
- `GET /api/goals` - pro načtení cílů
- Bearer token autentifikace

## Customization

Widget podporuje:
- Různé velikosti (Small, Medium, Large)
- Automatické přepínání mezi typy zobrazení
- Dark/Light mode
- Lokalizace (čeština)

## Troubleshooting

### Časté problémy

1. **Widget se nezobrazuje**
   - Zkontrolujte Bundle Identifier
   - Ověřte Code Signing
   - Restartujte zařízení

2. **Data se nenačítají**
   - Zkontrolujte App Groups konfiguraci
   - Ověřte API endpointy
   - Zkontrolujte auth token

3. **Build chyby**
   - Zkontrolujte Deployment Target
   - Ověřte framework dependencies
   - Vyčistěte Build Folder (Cmd+Shift+K)

## Vývoj

Pro vývoj widgetu:
1. Použijte Preview v Xcode
2. Testujte na fyzickém zařízení
3. Simulátor nemusí správně zobrazovat všechny funkce

## Licence

Widget je součástí Pokrok iOS aplikace a podléhá stejné licenci.
