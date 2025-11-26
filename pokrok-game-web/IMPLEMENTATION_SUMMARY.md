# Implementační plán - Stručný souhrn

## 🎯 Hlavní změny

### 1. Nový koncept: Focus Management
Uživatel si sám řídí priority cílů rozdělením na:
- **Aktivní fokus** - cíle, na které se soustředit teď
- **Odložené** - cíle dočasně odložené

Priority se automaticky propíšou všude v aplikaci.

### 2. Přepracování hlavního panelu
Nový "Daily Workspace" s:
- **Dnešní fokus** - kroky z aktivních cílů
- **Dnešní návyky** - kompaktní zobrazení
- **Všechny kroky** - kompletní seznam
- **Rychlý přehled** - pokrok, streak, statistiky

### 3. Vylepšení průvodce nastavením cílů
5-krokový průvodce s časovým horizontem a možností přidat do fokusu.

### 4. Balance Dashboard
Vizuální přehled aspiračních bilancí s doporučeními.

---

## 📋 Implementační fáze

### ✅ FÁZE 1: Databáze a API (7-9 hodin)
- Migrace: přidat `focus_status` a `focus_order` do goals tabulky
- Aktualizace TypeScript typů
- API endpointy pro správu fokusu

### ✅ FÁZE 2: Focus Management View (9-12 hodin)
- Nová komponenta pro správu fokusu
- Drag & drop pro změnu priorit
- Integrace do navigace

### ✅ FÁZE 3: Hlavní panel (13-17 hodin)
- Refaktor DayView na Daily Workspace
- Komponenta "Dnešní fokus"
- Quick Overview Widget

### ✅ FÁZE 4: Průvodce cíli (10-13 hodin)
- Goal Creation Wizard s časovým horizontem
- Integrace do Management sekce

### ⏳ FÁZE 5-8: Ostatní vylepšení (36-47 hodin)
- Balance Dashboard
- Daily Check-in/Review
- Timeline view
- Gamifikace

---

## 🚀 Doporučený postup

1. **Začít s Fází 1** - databáze a API (základ pro vše)
2. **Pokračovat Fází 2** - Focus Management (klíčová funkcionalita)
3. **Dokončit Fází 3** - hlavní panel (okamžitý dopad na UX)
4. **Postupně Fáze 4-8** - podle priorit

**Prioritní implementace (Fáze 1-3):** ~29-38 hodin

---

## 📁 Vytvořené soubory

1. **IMPLEMENTATION_PLAN.md** - kompletní implementační plán
2. **FOCUS_MANAGEMENT_SPEC.md** - detailní specifikace Focus Management
3. **scripts/migrate-add-focus-fields.js** - migrační script pro databázi

---

## 🔑 Klíčové soubory k úpravě

### Databáze
- `lib/cesta-db.ts` - přidat focus_status a focus_order do Goal interface
- `scripts/migrate-add-focus-fields.js` - spustit migraci

### API
- `app/api/goals/focus/route.ts` - nový endpoint pro správu fokusu

### Komponenty
- `app/[locale]/game/components/views/FocusManagementView.tsx` - nový
- `app/[locale]/game/components/views/DayView.tsx` - refaktor
- `app/[locale]/game/components/views/TodayFocusSection.tsx` - nový
- `app/[locale]/game/components/views/QuickOverviewWidget.tsx` - nový
- `app/[locale]/game/components/JourneyGameView.tsx` - přidat navigaci

---

## 💡 Důležité poznámky

- Všechny změny jsou zpětně kompatibilní
- Focus status je volitelný - cíle bez fokusu fungují jako dřív
- Migrace je bezpečná pro produkční data
- Uživatel má plnou kontrolu nad prioritami

---

## 📊 Odhadovaný čas

- **Minimální implementace (Fáze 1-3):** ~29-38 hodin
- **Kompletní implementace:** ~75-100 hodin

