# iOS Redesign Implementation Plan - Playful Animated Style

## 📋 Přehled

Tento dokument popisuje implementační plán pro redesign iOS aplikace Pokrok podle designových pravidel z webové aplikace (REDESIGN_STRUCTURE.md). Cílem je vytvořit konzistentní, playful design s pastelovými barvami, tlustými hnědými obrysy a playful animacemi.

---

## 🎨 Fáze 1: Design System Foundation (Priorita: VYSOKÁ)

### Úkol 1.1: Aktualizace Design Tokens
**Soubor:** `Pokrok/DesignSystem.swift`

**Změny:**
- Přidat pastelové barvy (pink, yellow-green, purple, yellow) místo současné oranžové palety
- Přidat tmavou hnědou barvu pro obrysy (#5D4037)
- Přidat hnědé textové barvy (primary, secondary, light)
- Přidat spacing systém (xs, sm, md, lg, xl, 2xl) - již existuje, zkontrolovat konzistenci
- Přidat corner radius systém (sm: 8px, md: 12px, lg: 16px) - již existuje
- Odstranit dark mode adaptivní barvy - nový design používá světlé barvy konzistentně
- Přidat shadow systém pro button highlight efekt

**Nové barvy:**
```swift
struct PlayfulColors {
    // Primary Pastel Colors
    static let pinkLight = Color(hex: "#FFE5E5")
    static let pink = Color(hex: "#FFB3BA")
    static let pinkDark = Color(hex: "#FF9AA2")
    
    static let yellowGreenLight = Color(hex: "#E5FFE5")
    static let yellowGreen = Color(hex: "#B3FFB3")
    static let yellowGreenDark = Color(hex: "#9AFF9A")
    
    static let purpleLight = Color(hex: "#E5E5FF")
    static let purple = Color(hex: "#B3B3FF")
    static let purpleDark = Color(hex: "#9A9AFF")
    
    static let yellowLight = Color(hex: "#FFF9E5")
    static let yellow = Color(hex: "#FFE5B3")
    
    // Outline & Text Colors
    static let outline = Color(hex: "#5D4037")      // Dark brown outline
    static let textPrimary = Color(hex: "#5D4037")   // Dark brown text
    static let textSecondary = Color(hex: "#8D6E63") // Lighter brown text
    static let textLight = Color(hex: "#A1887F")     // Light brown text
}
```

**Odhadovaný čas:** 2-3 hodiny

### Úkol 1.2: Přidání Color Extension pro Hex
**Soubor:** `Pokrok/DesignSystem.swift` (rozšíření)

**Změny:**
- Přidat extension pro `Color` inicializaci z hex stringu
- Přidat helper pro konverzi hex na RGB

**Odhadovaný čas:** 30 minut

### Úkol 1.3: Typography System
**Soubor:** `Pokrok/DesignSystem.swift`

**Změny:**
- Zachovat současný typography systém
- Poznámka: Comic Neue není dostupný v iOS, použijeme systémové fonty s rounded designem
- Pro playful feel použít `.system(.rounded)` design kde je to možné
- Font weights: 400-700 (Regular až Bold)

**Odhadovaný čas:** 1 hodina

### Úkol 1.4: Animation Utilities
**Soubor:** `Pokrok/Animations.swift` (nový)

**Změny:**
- Vytvořit nový soubor pro animation utilities
- Implementovat SwiftUI animace:
  - `playfulBounce` - pro tlačítka a karty při kliknutí
  - `playfulWiggle` - pro pozornost/chyby
  - `playfulPulse` - pro aktivní stavy
  - `playfulSlideIn` - pro modaly a panely
  - `playfulFloat` - pro dekorativní prvky

**Animace v SwiftUI:**
```swift
struct PlayfulAnimations {
    static let bounce = Animation.spring(response: 0.4, dampingFraction: 0.6)
    static let wiggle = Animation.spring(response: 0.15, dampingFraction: 0.3)
    static let pulse = Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true)
    static let slideIn = Animation.spring(response: 0.5, dampingFraction: 0.8)
    static let float = Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true)
}
```

**Odhadovaný čas:** 2-3 hodiny

---

## 🧩 Fáze 2: Core Components (Priorita: VYSOKÁ)

### Úkol 2.1: PlayfulButton Component
**Soubor:** `Pokrok/PlayfulComponents.swift` (nový)

**Funkcionalita:**
- Tlusté hnědé obrysy (3-4px) podle velikosti
- Pastelové pozadí (varianty: pink, yellow-green, purple, yellow)
- Bounce animace při kliknutí (scale down na 0.95)
- Zaoblené rohy (12px)
- Shadow pro highlight efekt (offset shadow)
- Loading states s spinnerem a textem
- Touch-friendly minimální velikost (44x44px)
- Responzivní padding podle velikosti

**Varianty:**
- `size`: sm, md, lg
- `variant`: pink, yellowGreen, purple, yellow
- `isLoading`: Boolean pro loading state
- `isPressed`: Boolean pro pressed state (pro navigation buttons)

**Odhadovaný čas:** 4-5 hodin

### Úkol 2.2: PlayfulCard Component
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Funkcionalita:**
- Tlusté hnědé obrysy (3-4px)
- Pastelové pozadí nebo pattern
- Hover lift animace (iOS: long press preview nebo tap feedback)
- Zaoblené rohy (16px)
- Subtle drop shadow
- Možnost kliknutí s animací

**Varianty:**
- `variant`: pink, yellowGreen, purple, pattern
- `animated`: Boolean pro hover animace
- `onTap`: Optional closure pro kliknutí

**Odhadovaný čas:** 3-4 hodiny

### Úkol 2.3: PlayfulCheckbox Component
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Funkcionalita:**
- Čtverec s tlustým hnědým obrysem
- Checkmark animace při zaškrtnutí
- Barvově kódované stavy (pink, yellow-green, purple)
- Bounce animace při toggle
- Touch-friendly velikost (min 44x44px)

**Varianty:**
- `checked`: Boolean
- `color`: pink, yellowGreen, purple
- `onChange`: Closure s (Bool) -> Void

**Odhadovaný čas:** 2-3 hodiny

### Úkol 2.4: PlayfulBadge Component
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Funkcionalita:**
- Status badges s tlustým obrysem
- Pastelové pozadí
- Hnědý text
- Zaoblené rohy

**Odhadovaný čas:** 1-2 hodiny

### Úkol 2.5: PlayfulInput Component
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Funkcionalita:**
- Text input s tlustým hnědým obrysem
- Pastelové pozadí (světlé)
- Placeholder text v hnědé barvě
- Focus state s animací
- Responzivní padding

**Odhadovaný čas:** 2-3 hodiny

---

## 🎯 Fáze 3: Game-Specific Components (Priorita: VYSOKÁ)

### Úkol 3.1: PlayfulGoalCard Component
**Soubor:** `Pokrok/PlayfulComponents.swift` nebo nový `PlayfulGameComponents.swift`

**Funkcionalita:**
- Nahradit `ModernGoalCard`
- Použít PlayfulCard jako základ
- Přidat playful styling
- Playful animace při interakcích

**Odhadovaný čas:** 3-4 hodiny

### Úkol 3.2: PlayfulStepCard Component
**Soubor:** `Pokrok/PlayfulGameComponents.swift` (nový)

**Funkcionalita:**
- Nahradit `ModernStepCard`
- PlayfulCheckbox pro dokončení
- PlayfulCard styling
- Animace při toggle dokončení

**Odhadovaný čas:** 3-4 hodiny

### Úkol 3.3: PlayfulHabitCard Component
**Soubor:** `Pokrok/PlayfulGameComponents.swift`

**Funkcionalita:**
- Nová komponenta pro habit cards
- Playful styling
- Checkbox pro dokončení
- Statistiky a progress

**Odhadovaný čas:** 3-4 hodiny

### Úkol 3.4: PlayfulProgressBar Component
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Funkcionalita:**
- Nahradit `ModernProgressBar`
- Playful styling s tlustým obrysem
- Pastelové barvy
- Smooth animace

**Odhadovaný čas:** 2 hodiny

---

## 📱 Fáze 4: View Updates (Priorita: VYSOKÁ)

### Úkol 4.1: DashboardView Update
**Soubor:** `Pokrok/DashboardView.swift`

**Změny:**
- Aktualizovat barvy na playful paletu
- Použít PlayfulCard místo ModernCard
- Aktualizovat button styling

**Odhadovaný čas:** 2-3 hodiny

### Úkol 4.2: DailyPlanningView Update
**Soubor:** `Pokrok/DailyPlanningView.swift`

**Změny:**
- Aktualizovat všechny karty na PlayfulStepCard a PlayfulHabitCard
- Aktualizovat button styling
- Přidat playful animace
- Aktualizovat barvy

**Odhadovaný čas:** 4-5 hodin

### Úkol 4.3: GoalsView Update
**Soubor:** `Pokrok/OtherViews.swift`

**Změny:**
- Aktualizovat ModernGoalCard na PlayfulGoalCard
- Aktualizovat button styling
- Aktualizovat barvy

**Odhadovaný čas:** 2-3 hodiny

### Úkol 4.4: StepsView Update
**Soubor:** `Pokrok/OtherViews.swift`

**Změny:**
- Aktualizovat ModernStepCard na PlayfulStepCard
- Aktualizovat button styling
- Aktualizovat barvy

**Odhadovaný čas:** 2-3 hodiny

### Úkol 4.5: ContentView (Tab Bar) Update
**Soubor:** `Pokrok/ContentView.swift`

**Změny:**
- Aktualizovat tab bar styling (accent color na playful barvu)
- Aktualizovat floating action button na playful styl
- Přidat playful animace

**Odhadovaný čas:** 2-3 hodiny

### Úkol 4.6: Modal Views Update
**Soubory:** Všechny modaly v aplikaci

**Změny:**
- Aktualizovat inputy na PlayfulInput
- Aktualizovat buttony na PlayfulButton
- Aktualizovat barvy
- Přidat slide-in animace

**Odhadovaný čas:** 3-4 hodiny

---

## 🎬 Fáze 5: Animations & Micro-interactions (Priorita: STŘEDNÍ)

### Úkol 5.1: Button Click Animations
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Změny:**
- Implementovat scale down animaci při kliknutí (0.95)
- Shadow reduction při kliknutí
- Return animace po kliknutí
- Pressed state pro navigation buttons

**Odhadovaný čas:** 2-3 hodiny

### Úkol 5.2: Card Hover/Tap Animations
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Změny:**
- Lift animace při tap (iOS haptic feedback)
- Long press preview pokud je to možné
- Slide animations pro list items

**Odhadovaný čas:** 2-3 hodiny

### Úkol 5.3: Loading Animations
**Soubor:** `Pokrok/PlayfulComponents.swift`

**Změny:**
- Playful loading spinners
- Skeleton loading states
- Success/error animations

**Odhadovaný čas:** 2-3 hodiny

### Úkol 5.4: Page Transitions
**Soubor:** Všechny view soubory

**Změny:**
- Přidat slide-in animace pro navigation
- Fade animations kde to dává smysl
- Smooth transitions mezi views

**Odhadovaný čas:** 2-3 hodiny

---

## 🎨 Fáze 6: Pattern Backgrounds (Priorita: NÍZKÁ)

### Úkol 6.1: Pattern Utilities
**Soubor:** `Pokrok/PlayfulComponents.swift` nebo `Pokrok/Patterns.swift` (nový)

**Změny:**
- Implementovat diagonal stripes pattern (SwiftUI Shape)
- Implementovat dots pattern (SwiftUI Shape)
- Použít pro karty s variantou "pattern"

**Odhadovaný čas:** 3-4 hodiny

---

## 📋 Implementační Checklist

### Fáze 1: Design System Foundation
- [ ] Aktualizovat Design Tokens
- [ ] Přidat Color Extension pro Hex
- [ ] Aktualizovat Typography System
- [ ] Vytvořit Animation Utilities

### Fáze 2: Core Components
- [ ] PlayfulButton Component
- [ ] PlayfulCard Component
- [ ] PlayfulCheckbox Component
- [ ] PlayfulBadge Component
- [ ] PlayfulInput Component

### Fáze 3: Game-Specific Components
- [ ] PlayfulGoalCard Component
- [ ] PlayfulStepCard Component
- [ ] PlayfulHabitCard Component
- [ ] PlayfulProgressBar Component

### Fáze 4: View Updates
- [ ] DashboardView Update
- [ ] DailyPlanningView Update
- [ ] GoalsView Update
- [ ] StepsView Update
- [ ] ContentView (Tab Bar) Update
- [ ] Modal Views Update

### Fáze 5: Animations & Micro-interactions
- [ ] Button Click Animations
- [ ] Card Hover/Tap Animations
- [ ] Loading Animations
- [ ] Page Transitions

### Fáze 6: Pattern Backgrounds
- [ ] Pattern Utilities

---

## ⏱️ Odhadovaný čas

- **Fáze 1:** 5-7 hodin
- **Fáze 2:** 12-17 hodin
- **Fáze 3:** 11-14 hodin
- **Fáze 4:** 15-21 hodin
- **Fáze 5:** 8-12 hodin
- **Fáze 6:** 3-4 hodin

**Celkem:** ~54-75 hodin

**Prioritní implementace (Fáze 1-4):** ~43-59 hodin

---

## 🚀 Doporučený pořadí implementace

1. **Fáze 1** - Design System Foundation (základ pro vše)
2. **Fáze 2** - Core Components (stavební kameny)
3. **Fáze 3** - Game-Specific Components (použití core komponent)
4. **Fáze 4** - View Updates (aplikace nových komponent)
5. **Fáze 5** - Animations & Micro-interactions (polish)
6. **Fáze 6** - Pattern Backgrounds (volitelné)

---

## 📝 Technické poznámky

### SwiftUI Specifické úvahy

1. **Dark Mode:**
   - Nový design používá světlé barvy konzistentně
   - V iOS můžeme zachovat light mode, nebo použít mírně tmavší varianty pastelových barev pro dark mode
   - **Doporučení:** Zachovat light mode, nebo vytvořit dark mode varianty s mírně tmavšími pastely

2. **Animations:**
   - SwiftUI má výbornou podporu pro animace
   - Použijeme `withAnimation` a `Animation.spring()` pro playful feel
   - Respektovat `AccessibilitySettings.reduceMotion` pro uživatele s preferencí sníženého pohybu

3. **Patterns:**
   - SwiftUI nepodporuje CSS patterns přímo
   - Musíme vytvořit custom `Shape` nebo `View` pro pattern efekty
   - Pro diagonal stripes použijeme `Path` s `LinearGradient`
   - Pro dots použijeme `Canvas` nebo opakující se `Circle` shapes

4. **Typography:**
   - Comic Neue není dostupný v iOS
   - Použijeme systémové fonty s `.system(.rounded)` designem kde je to možné
   - Pro iOS 13+ můžeme použít SF Rounded, který má playful feel
   - Alternativně můžeme přidat custom font Comic Neue do projektu

5. **Touch Targets:**
   - Všechny interaktivní prvky musí mít minimálně 44x44px pro lepší uživatelský zážitek
   - iOS HIG doporučuje 44x44px jako minimální touch target

6. **Haptic Feedback:**
   - Přidat haptic feedback pro button clicks a důležité akce
   - Použít `.impactFeedback` nebo `.successNotification` podle kontextu

---

## 🎯 Design Principles (z REDESIGN_STRUCTURE.md)

1. **Thick Outlines**: Všechny interaktivní prvky mají 3-4px tmavě hnědé obrysy
2. **Pastel Colors**: Používat jemné, tlumené pastelové barvy pro pozadí
3. **Rounded Corners**: Velkorysé zaoblené rohy (8-16px) pro přátelský pocit
4. **Playful Animations**: Jemné bounce, wiggle, pulse animace
5. **Flat Design**: Žádné gradienty (kromě patternů), ploché barvy
6. **Consistent Spacing**: Důsledně používat spacing systém
7. **Dark Brown Text**: Veškerý text v tmavě hnědé (#5D4037) pro konzistenci
8. **Pattern Backgrounds**: Používat diagonální pruhy nebo tečky pro variaci
9. **Button Design Rules:**
   - Všechna tlačítka musí mít shadow (highlight efekt)
   - Všechna tlačítka musí mít click animaci (scale down)
   - Navigation/Menu buttons: Když jsou active/selected, zůstávají "pressed" (bez shadow)
   - Loading States: Zobrazit loading indikátor a text ("Načítání", "Ukládání", atd.)
10. **Responsive Design**: Všechny komponenty musí být plně responzivní

---

## 🔄 Migration Strategy

### Step-by-Step Migration

1. **Začít s Design Systemem**
   - Vytvořit všechny design tokens
   - Vybudovat core komponenty
   - Testovat v izolaci

2. **Aktualizovat Layout jako první**
   - Tab bar
   - Navigation
   - Main container

3. **Aktualizovat komponenty postupně**
   - Začít s nejviditelnějšími komponentami
   - Nechat staré komponenty, dokud nejsou nové připravené
   - Použít feature flags pokud je třeba

4. **Testovat & Iterovat**
   - Testovat na všech velikostech obrazovek (iPhone SE až iPad)
   - Zajistit přístupnost
   - Performance testing
   - User testing

---

## 📚 Resources

- Design inspiration: REDESIGN_STRUCTURE.md
- Color palette: Pastel pink, yellow-green, purple with dark brown outlines
- Animation library: SwiftUI native animations
- Typography: SF Rounded nebo systémové fonty s rounded designem

---

## ⚠️ Poznámky

- Všechny změny by měly být zpětně kompatibilní s existující funkcionalitou
- Zachovat všechny současné features
- Testovat na různých zařízeních iOS (iPhone SE, iPhone 14, iPad)
- Zajistit přístupnost (VoiceOver, Dynamic Type, Reduce Motion)
- Performance: Sledovat FPS během animací

