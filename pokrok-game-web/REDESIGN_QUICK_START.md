# Redesign Quick Start Guide

## ✅ Co bylo vytvořeno

### 1. Design System Foundation
- ✅ **Design Tokens** (`lib/design-tokens.ts`) - Všechny barvy, spacing, typography
- ✅ **Tailwind Config** - Aktualizován s novými barvami a animacemi
- ✅ **Animation CSS** (`styles/animations.css`) - Všechny animace (bounce, wiggle, pulse, atd.)
- ✅ **Pattern CSS** (`styles/patterns.css`) - Vzory pro pozadí (stripes, dots, grid)
- ✅ **Globals CSS** - Aktualizován s novými base styly

### 2. Ukázková Komponenta
- ✅ **PlayfulButton** (`components/design-system/Button/PlayfulButton.tsx`) - Ukázka použití

### 3. Dokumentace
- ✅ **REDESIGN_STRUCTURE.md** - Kompletní struktura redesignu
- ✅ **REDESIGN_QUICK_START.md** - Tento soubor

---

## 🚀 Jak začít

### 🧪 Testování PlayfulButton

**Nejjednodušší způsob:** Otevři aplikaci a přejdi na **Month View** (měsíční zobrazení). Tam najdeš kompletní testovací stránku s:
- Všemi variantami tlačítek
- Všemi velikostmi
- Interaktivními testy
- Responsivními příklady
- Vzory pozadí

**Cesta:** `/cs/game` → Navigace → Focus → Month

### 1. Použití PlayfulButton

```tsx
import { PlayfulButton } from '@/components/design-system/Button'

// Základní použití
<PlayfulButton variant="pink" onClick={handleClick}>
  Klikni mě!
</PlayfulButton>

// Různé varianty
<PlayfulButton variant="yellow-green">Žlutozelená</PlayfulButton>
<PlayfulButton variant="purple">Fialová</PlayfulButton>
<PlayfulButton variant="yellow">Žlutá</PlayfulButton>

// Různé velikosti
<PlayfulButton size="sm">Malé</PlayfulButton>
<PlayfulButton size="md">Střední</PlayfulButton>
<PlayfulButton size="lg">Velké</PlayfulButton>
```

### 2. Použití Tailwind tříd

```tsx
// Barvy
<div className="bg-playful-pink">Růžové pozadí</div>
<div className="bg-playful-yellow-green">Žlutozelené pozadí</div>
<div className="bg-playful-purple">Fialové pozadí</div>

// Border
<div className="border-playful-thick rounded-playful-lg">
  Tlustý hnědý border
</div>

// Animace
<div className="animate-playful-bounce">Bounce animace</div>
<div className="animate-playful-wiggle">Wiggle animace</div>
<div className="animate-playful-pulse">Pulse animace</div>

// Hover efekty
<div className="hover-playful-lift">Zvedne se při hover</div>
<div className="hover-playful-scale">Zvětší se při hover</div>
```

### 3. Použití vzorů

```tsx
// Diagonální pruhy
<div className="pattern-stripes-pink-yellow">
  Růžovo-žluté pruhy
</div>

// Tečky
<div className="pattern-dots">
  Tečkovaný vzor
</div>
```

### 4. Použití design tokens

```tsx
import { colors, spacing, borderRadius } from '@/lib/design-tokens'

// V JavaScriptu/TypeScriptu
const buttonStyle = {
  backgroundColor: colors.pink.base,
  border: `3px solid ${colors.outline.base}`,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
}
```

---

## 📋 Další kroky

### Fáze 1: Vytvořit další komponenty
1. `PlayfulCard` - Karta s tlustým borderem
2. `PlayfulInput` - Input s tlustým borderem
3. `PlayfulCheckbox` - Checkbox s animací
4. `PlayfulBadge` - Badge pro statusy

### Fáze 2: Aktualizovat existující komponenty
1. SidebarNavigation → PlayfulSidebar
2. TodayFocusSection → PlayfulFocusSection
3. Goal cards → PlayfulGoalCard
4. Step cards → PlayfulStepCard

### Fáze 3: Aktualizovat views
1. WeekView
2. MonthView
3. DayView
4. JourneyGameView

---

## 🎨 Design principy

1. **Tlusté obrysy**: Všechny interaktivní elementy mají 3-4px tmavě hnědý border
2. **Pastelové barvy**: Měkké, tlumené pastelové barvy pro pozadí
3. **Zaoblené rohy**: Velkorysý border-radius (8-16px) pro přátelský vzhled
4. **Hravé animace**: Jemné bounce, wiggle, pulse animace
5. **Plochý design**: Žádné gradienty (kromě vzorů), ploché barvy
6. **Konzistentní spacing**: Používej spacing systém konzistentně
7. **Tmavě hnědý text**: Všechen text v tmavě hnědé (#5D4037) pro konzistenci
8. **Vzorová pozadí**: Používej diagonální pruhy nebo tečky pro variaci
9. **Responsivní design**: Všechny komponenty musí být plně responsivní
   - **Mobile-first**: Začni s mobilním designem
   - **Breakpointy**: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
   - **Touch-friendly**: Minimálně 44x44px pro touch elementy
   - **Flexibilní layouty**: Používej flexbox/grid s responsivními třídami
   - **Responsivní typography**: `text-sm sm:text-base lg:text-lg`
   - **Full-width na mobilu**: Tlačítka a inputy plné šířky na mobilu (`w-full sm:w-auto`)

---

## 🔍 Příklady

### Playful Card
```tsx
<div className="card-playful-pink">
  <h3 className="text-text-primary font-bold">Nadpis</h3>
  <p>Obsah karty</p>
</div>
```

### Playful Button s animací
```tsx
<PlayfulButton 
  variant="purple" 
  animated={true}
  onClick={() => console.log('Klik!')}
>
  Klikni mě!
</PlayfulButton>
```

### Playful Input (použití Tailwind)
```tsx
<input 
  type="text"
  className="border-playful-thick rounded-playful-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-playful-outline-base"
  placeholder="Zadej text..."
/>
```

---

## 📚 Dokumentace

Více informací najdeš v:
- **REDESIGN_STRUCTURE.md** - Kompletní struktura a plán
- **lib/design-tokens.ts** - Všechny design tokens
- **styles/animations.css** - Všechny animace
- **styles/patterns.css** - Všechny vzory

---

## 💡 Tipy

1. **Začni s malými změnami** - Nejdřív aktualizuj jednu komponentu, pak další
2. **Používej Tailwind třídy** - Jsou rychlejší než custom CSS
3. **Testuj animace** - Některé animace mohou být rušivé, testuj je
4. **Zachovej přístupnost** - Ujisti se, že kontrast je dostatečný
5. **Respektuj existující funkcionalitu** - Design měníme, ne logiku

---

## 🐛 Troubleshooting

### Animace nefungují
- Zkontroluj, že `styles/animations.css` je importován v `globals.css`
- Zkontroluj, že Tailwind config obsahuje keyframes

### Barvy nefungují
- Zkontroluj, že Tailwind config obsahuje nové barvy
- Restartuj dev server po změně Tailwind config

### Border není tlustý
- Použij `border-playful-thick` (4px) nebo `border-playful-base` (3px)
- Zkontroluj, že nemáš jiný border style, který to přepisuje

---

## 🎉 Hotovo!

Máš teď kompletní základ pro redesign. Můžeš začít vytvářet nové komponenty nebo aktualizovat existující!

