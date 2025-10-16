# Pokrok iOS - Moderní Redesign

## Přehled

Tento projekt obsahuje kompletní redesign iOS aplikace Pokrok podle Apple Human Interface Guidelines a současných designových trendů. Aplikace nyní reflektuje jednoduchost a dýchatelnost webové aplikace při zachování všech klíčových funkcí.

## Klíčové funkce

- **Domů** - Pracovní plocha s přehledem cílů a kroků
- **Přehled** - Statistiky a pokrok cílů
- **Cíle** - Správa cílů podle kategorií (krátkodobé, střednědobé, dlouhodobé)
- **Kroky** - Správa denních kroků podle stavu
- **Nastavení** - Uživatelské nastavení a profil

## Designový systém

### Barvy (konzistentní s webovou aplikací)

- **Primární**: `#E8871E` (teplá oranžová)
- **Pozadí**: `#FFFAF5` (teplé bílé)
- **Text**: Adaptivní podle světlého/tmavého režimu
- **Status barvy**: Zelená (úspěch), červená (chyba), modrá (info)

### Typografie

- **Headers**: System font s váhou Bold/Semibold
- **Body text**: System font s váhou Regular
- **Podpora Dynamic Type** pro přístupnost

### Komponenty

#### ModernCard
Moderní karta s jemnými stíny a zaoblenými rohy podle Apple HIG.

#### ModernProgressBar
Animovaný progress bar s podporou přístupnosti.

#### StatusBadge
Malé štítky pro označení stavu s konzistentními barvami.

#### ModernIcon
Ikony s kruhovým pozadím a podporou přístupnosti.

#### EmptyStateView
Prázdné stavy s ikonami a call-to-action tlačítky.

#### LoadingView
Načítací stavy s animovaným progress indikátorem.

## Apple Design Guidelines

### Dodržené principy

1. **Jasnost** - Všechny prvky jsou snadno pochopitelné
2. **Úcta** - Design podporuje obsah, nikoli s ním nesoupeří
3. **Hloubka** - Vizuální hierarchie pomocí vrstev a stínů

### Liquid Glass prvky

- Průhledné pozadí s jemnými stíny
- Zaoblené rohy a plynulé přechody
- Dynamické materiály reagující na prostředí

## Přístupnost

### Podporované funkce

- **Dynamic Type** - Automatické škálování textu
- **VoiceOver** - Kompletní podpora pro čtečky obrazovky
- **Reduce Motion** - Respektování nastavení sníženého pohybu
- **High Contrast** - Podpora vysokého kontrastu
- **Tmavý režim** - Automatické přepínání podle systémového nastavení

### Accessibility Labels

Všechny interaktivní prvky mají správné accessibility labely a hinty pro VoiceOver uživatele.

## Struktura projektu

```
Pokrok/
├── DesignSystem.swift          # Základní designový systém
├── ModernComponents.swift      # Moderní UI komponenty
├── AccessibilitySupport.swift  # Podpora přístupnosti a tmavého režimu
├── ContentView.swift          # Hlavní navigace
├── DashboardView.swift        # Domovská obrazovka
├── OverviewView.swift         # Přehled statistik
├── OtherViews.swift           # Cíle, Kroky, Nastavení
├── Models.swift               # Datové modely
├── APIManager.swift           # API komunikace
└── AuthView.swift             # Autentifikace
```

## Technologie

- **SwiftUI** - Moderní deklarativní UI framework
- **Clerk** - Autentifikace a správa uživatelů
- **Combine** - Reaktivní programování
- **Async/Await** - Moderní asynchronní programování

## Instalace a spuštění

1. Otevřete `Pokrok.xcodeproj` v Xcode
2. Nastavte správný Team a Bundle Identifier
3. Spusťte aplikaci na simulátoru nebo zařízení

## Budoucí vylepšení

- [ ] Push notifikace
- [ ] Widgety pro iOS
- [ ] Apple Watch podpora
- [ ] Siri Shortcuts
- [ ] Offline režim
- [ ] Export dat

## Kontakt

Pro dotazy nebo návrhy kontaktujte vývojový tým.

---

*Tento redesign dodržuje nejnovější Apple Human Interface Guidelines a poskytuje konzistentní uživatelský zážitek napříč všemi platformami.*
