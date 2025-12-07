# 📱 Responsive Design Guide

## ✅ Co bylo implementováno

### 1. PlayfulButton - Plně responsivní
- ✅ **Mobile**: Plná šířka (`w-full`), menší padding
- ✅ **Desktop**: Automatická šířka (`sm:w-auto`), větší padding
- ✅ **Responsivní velikosti textu**: `text-sm sm:text-base lg:text-lg`
- ✅ **Touch-friendly**: Minimálně 44x44px pro touch elementy
- ✅ **Smooth transitions**: Všechny animace fungují na všech zařízeních

### 2. CSS Utility třídy - Responsivní
- ✅ **Card padding**: `p-4 sm:p-6` (menší na mobilu, větší na desktopu)
- ✅ **Spacing**: `gap-3 sm:gap-4` (menší mezery na mobilu)
- ✅ **Typography**: `text-sm sm:text-base lg:text-lg`
- ✅ **Grid layouts**: `grid-cols-1 sm:grid-cols-2`

### 3. Testovací stránka
- ✅ **MonthView** - Kompletní testovací stránka s příklady

---

## 🧪 Jak testovat PlayfulButton

### Metoda 1: Přes aplikaci (doporučeno)

1. **Spusť dev server:**
   ```bash
   npm run dev
   ```

2. **Otevři aplikaci:**
   - Přejdi na `http://localhost:3000/cs/game`
   - Přihlas se (pokud je potřeba)

3. **Přejdi na Month View:**
   - V sidebaru klikni na **Focus** → **Month**
   - Nebo použij navigaci: Focus → Month

4. **Testuj:**
   - Zkus všechny varianty (pink, yellow-green, purple, yellow)
   - Zkus všechny velikosti (sm, md, lg)
   - Klikni na tlačítka a sleduj animace
   - Změň velikost okna prohlížeče a sleduj responsivitu

### Metoda 2: Přes DevTools

1. **Otevři DevTools** (F12)
2. **Toggle device toolbar** (Ctrl+Shift+M / Cmd+Shift+M)
3. **Vyber zařízení:**
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1920px)
4. **Testuj na různých velikostech**

### Metoda 3: V kódu

```tsx
import { PlayfulButton } from '@/components/design-system/Button'

// V jakékoli komponentě
<PlayfulButton variant="pink" size="md">
  Test tlačítko
</PlayfulButton>
```

---

## 📐 Breakpointy (Tailwind)

```css
sm:  640px   /* Small devices (tablets) */
md:  768px   /* Medium devices (small laptops) */
lg:  1024px  /* Large devices (laptops) */
xl:  1280px  /* Extra large devices (desktops) */
2xl: 1536px  /* 2X Extra large devices */
```

### Příklady použití:

```tsx
// Responsivní padding
<div className="p-4 sm:p-6 lg:p-8">
  {/* 16px na mobilu, 24px na tabletu, 32px na desktopu */}
</div>

// Responsivní grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
  {/* 1 sloupec na mobilu, 2 na tabletu, 3 na desktopu */}
</div>

// Responsivní typography
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  {/* Menší na mobilu, větší na desktopu */}
</h1>

// Responsivní šířka
<button className="w-full sm:w-auto">
  {/* Plná šířka na mobilu, auto na desktopu */}
</button>
```

---

## 🎯 Responsivní best practices

### 1. Mobile-First Approach
```tsx
// ✅ DOBRÉ - Začni s mobilem
<div className="p-4 sm:p-6 lg:p-8">

// ❌ ŠPATNÉ - Začni s desktopem
<div className="p-8 sm:p-6 lg:p-4">
```

### 2. Touch-Friendly Sizes
```tsx
// ✅ DOBRÉ - Minimálně 44x44px
<button className="px-4 py-3 text-base">

// ❌ ŠPATNÉ - Příliš malé
<button className="px-2 py-1 text-xs">
```

### 3. Flexible Layouts
```tsx
// ✅ DOBRÉ - Flexbox s responsivními třídami
<div className="flex flex-col sm:flex-row gap-4">

// ✅ DOBRÉ - Grid s responsivními sloupci
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### 4. Responsive Typography
```tsx
// ✅ DOBRÉ - Menší na mobilu, větší na desktopu
<h1 className="text-xl sm:text-2xl lg:text-3xl">

// ❌ ŠPATNÉ - Stejná velikost všude
<h1 className="text-3xl">
```

### 5. Full-Width on Mobile
```tsx
// ✅ DOBRÉ - Plná šířka na mobilu
<button className="w-full sm:w-auto">

// ❌ ŠPATNÉ - Auto šířka i na mobilu
<button className="w-auto">
```

---

## 🔍 Testování checklist

### Mobil (< 640px)
- [ ] Tlačítka jsou plné šířky
- [ ] Text je čitelný (min 16px)
- [ ] Touch elementy jsou dostatečně velké (min 44x44px)
- [ ] Layout se nezlomí při rotaci
- [ ] Animace fungují plynule

### Tablet (640px - 1024px)
- [ ] Grid se přepne na 2 sloupce
- [ ] Padding se zvětší
- [ ] Text se zvětší
- [ ] Tlačítka mají auto šířku

### Desktop (> 1024px)
- [ ] Grid má 3+ sloupců
- [ ] Maximální šířka obsahu (max-w-*)
- [ ] Všechny animace fungují
- [ ] Hover efekty fungují

---

## 🐛 Časté problémy

### Problém: Tlačítka jsou příliš malá na mobilu
**Řešení:**
```tsx
// Přidej min-height a min-width
<button className="min-h-[44px] min-w-[44px]">
```

### Problém: Text je příliš malý na mobilu
**Řešení:**
```tsx
// Použij responsivní typography
<p className="text-sm sm:text-base">
```

### Problém: Layout se zlomí na mobilu
**Řešení:**
```tsx
// Použij flex-col na mobilu
<div className="flex flex-col sm:flex-row">
```

### Problém: Animace jsou pomalé na mobilu
**Řešení:**
```tsx
// Zkontroluj, že máš `will-change` a `transform`
<div className="transform transition-all will-change-transform">
```

---

## 📚 Další zdroje

- **Tailwind Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **Mobile-First Design**: https://www.w3schools.com/css/css_rwd_intro.asp
- **Touch Target Sizes**: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html

---

## ✅ Shrnutí

1. ✅ **PlayfulButton je plně responsivní**
2. ✅ **Všechny CSS utility třídy podporují responsivitu**
3. ✅ **Testovací stránka je připravena v MonthView**
4. ✅ **Dokumentace aktualizována o responsivní principy**

**Jak testovat:**
1. Spusť `npm run dev`
2. Přejdi na `/cs/game`
3. Klikni na **Focus** → **Month**
4. Testuj všechny varianty a velikosti!

