# Implementační plán - Vylepšení aplikace Pokrok

## Přehled

Tento dokument popisuje implementační plán pro vylepšení aplikace podle tří hlavních cílů:
1. Uživatel si nastaví své krátkodobé až dlouhodobé cíle
2. Aplikace pomůže organizovat cíle a najít jasnost v tom, na co se soustředit
3. Každodenní práce s aplikací na dosažení cílů

---

## 🎯 NOVÝ KONCEPT: Fokus (Focus Management)

### Popis
Fokus je nová sekce, kde uživatel sám řídí priority svých cílů. Cíle jsou rozděleny na:
- **Aktivní fokus** - cíle, na které se soustředit teď
- **Odložené** - cíle, které jsou dočasně odložené

Priority se propíšou všude v aplikaci (hlavní panel, management, doporučení).

### Databázové změny

#### 1. Přidání nových polí do `goals` tabulky

```sql
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS focus_status VARCHAR(20) DEFAULT NULL 
  CHECK (focus_status IN ('active_focus', 'deferred', NULL)),
ADD COLUMN IF NOT EXISTS focus_order INTEGER DEFAULT NULL;
```

**Význam polí:**
- `focus_status`: 
  - `'active_focus'` - cíl je v aktivním fokusu (soustředit se na něj teď)
  - `'deferred'` - cíl je odložený
  - `NULL` - cíl není v fokusu (neutrální stav)
- `focus_order`: Pořadí priority v rámci aktivních cílů (1 = nejvyšší priorita)

#### 2. Aktualizace TypeScript interface

```typescript
// lib/cesta-db.ts
export interface Goal {
  // ... existing fields ...
  focus_status?: 'active_focus' | 'deferred' | null
  focus_order?: number | null
}
```

---

## 📋 IMPLEMENTAČNÍ PLÁN

### FÁZE 1: Databázové změny a API (Priorita: VYSOKÁ)

#### Úkol 1.1: Migrace databáze
**Soubor:** `lib/cesta-db.ts`
- Přidat `focus_status` a `focus_order` do `initializeCestaDatabase()`
- Vytvořit migrační script pro existující data

**Kroky:**
1. Upravit SQL CREATE TABLE pro `goals`
2. Přidat ALTER TABLE pro existující databáze
3. Vytvořit migrační script `scripts/migrate-add-focus-fields.js`

**Odhadovaný čas:** 2-3 hodiny

#### Úkol 1.2: Aktualizace TypeScript typů
**Soubory:** 
- `lib/cesta-db.ts`
- `pokrok-shared/src/types/index.ts` (pokud existuje)

**Kroky:**
1. Přidat `focus_status` a `focus_order` do `Goal` interface
2. Aktualizovat všechny místa, kde se Goal používá

**Odhadovaný čas:** 1 hodina

#### Úkol 1.3: API endpoint pro správu fokusu
**Soubor:** `app/api/goals/focus/route.ts` (nový)

**Endpoints:**
- `POST /api/goals/focus` - nastavit fokus pro cíle
  ```typescript
  {
    goalId: string,
    focusStatus: 'active_focus' | 'deferred' | null,
    focusOrder?: number
  }
  ```
- `PUT /api/goals/focus/reorder` - změnit pořadí priorit
  ```typescript
  {
    goalIds: string[] // ordered array
  }
  ```
- `GET /api/goals/focus` - získat cíle podle fokusu
  ```typescript
  {
    focusStatus?: 'active_focus' | 'deferred' | null
  }
  ```

**Odhadovaný čas:** 4-5 hodin

---

### FÁZE 2: Nová sekce Fokus (Priorita: VYSOKÁ)

#### Úkol 2.1: Focus Management View
**Soubor:** `app/[locale]/game/components/views/FocusManagementView.tsx` (nový)

**Funkcionalita:**
- Drag & drop pro změnu pořadí priorit
- Přepínání mezi "Aktivní fokus" a "Odložené"
- Zobrazení všech cílů s možností přidat/odebrat z fokusu
- Vizuální indikátory (barvy, ikony)

**UI struktura:**
```
┌─────────────────────────────────────┐
│  Fokus                              │
├─────────────────────────────────────┤
│  [Aktivní fokus] [Odložené]         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Aktivní cíle (drag & drop)    │ │
│  │ 1. Cíl A                      │ │
│  │ 2. Cíl B                      │ │
│  │ 3. Cíl C                      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Ostatní cíle                  │ │
│  │ [Přidat do fokusu]            │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Odhadovaný čas:** 8-10 hodin

#### Úkol 2.2: Integrace do navigace
**Soubor:** `app/[locale]/game/components/JourneyGameView.tsx`

**Kroky:**
1. Přidat 'focus' do `currentPage` typu
2. Přidat tlačítko "Fokus" do hlavní navigace
3. Přidat render logiku pro FocusManagementView

**Odhadovaný čas:** 1-2 hodiny

---

### FÁZE 3: Přepracování hlavního panelu na Daily Workspace (Priorita: VYSOKÁ)

#### Úkol 3.1: Nová struktura hlavního panelu
**Soubor:** `app/[locale]/game/components/views/DayView.tsx` (refaktor)

**Nová struktura:**
```
┌─────────────────────────────────────┐
│  Hlavní panel - Dnes                │
├─────────────────────────────────────┤
│  📊 Rychlý přehled                  │
│  Pokrok: 65% | Streak: 7 dní        │
├─────────────────────────────────────┤
│  🎯 Dnešní fokus (z aktivních cílů) │
│  - Krok 1 z Cíle A                  │
│  - Krok 2 z Cíle B                  │
│  - Krok 3 z Cíle C                  │
├─────────────────────────────────────┤
│  ✅ Dnešní návyky                   │
│  [Kompaktní zobrazení]              │
├─────────────────────────────────────┤
│  📋 Všechny dnešní kroky            │
│  [Seznam všech kroků]               │
└─────────────────────────────────────┘
```

**Kroky:**
1. Přidat sekci "Dnešní fokus" - zobrazit kroky z cílů s `focus_status = 'active_focus'`
2. Reorganizovat layout - fokus nahoře, návyky uprostřed, kroky dole
3. Přidat "Rychlý přehled" widget nahoře

**Odhadovaný čas:** 6-8 hodin

#### Úkol 3.2: Komponenta "Dnešní fokus"
**Soubor:** `app/[locale]/game/components/views/TodayFocusSection.tsx` (nový)

**Funkcionalita:**
- Zobrazit 3-5 nejdůležitějších kroků z aktivních cílů
- Filtrovat podle `focus_status = 'active_focus'` a `focus_order`
- Zobrazit název cíle u každého kroku
- Možnost rychlého dokončení

**Odhadovaný čas:** 4-5 hodin

#### Úkol 3.3: Rychlý přehled widget
**Soubor:** `app/[locale]/game/components/views/QuickOverviewWidget.tsx` (nový)

**Funkcionalita:**
- Zobrazit denní pokrok (procenta)
- Streak counter
- Počet dokončených úkolů dnes
- Balance indikátory (pokud jsou aspirace)

**Odhadovaný čas:** 3-4 hodiny

---

### FÁZE 4: Vylepšení průvodce nastavením cílů (Priorita: STŘEDNÍ)

#### Úkol 4.1: Goal Creation Wizard
**Soubor:** `app/[locale]/game/components/GoalCreationWizard.tsx` (nový nebo refaktor existujícího)

**Kroky průvodce:**
1. **Výběr aspirace/hodnoty** - na co se cíl vztahuje
2. **Definice cíle** - název, popis, metrika
3. **Časový horizont** - krátkodobý (< 3 měsíce), střednědobý (3-12 měsíců), dlouhodobý (> 12 měsíců)
4. **Rozpad na kroky/milníky** - možnost přidat kroky hned
5. **Nastavení fokusu** - zda přidat do aktivního fokusu

**Odhadovaný čas:** 8-10 hodin

#### Úkol 4.2: Integrace do Management sekce
**Soubor:** `app/[locale]/game/components/views/GoalsManagementView.tsx`

**Kroky:**
1. Přidat tlačítko "Nový cíl" s průvodcem
2. Přidat filtr podle časového horizontu
3. Zobrazit focus_status v tabulce

**Odhadovaný čas:** 2-3 hodiny

---

### FÁZE 5: Balance Dashboard (Priorita: STŘEDNÍ)

#### Úkol 5.1: Balance Dashboard komponenta
**Soubor:** `app/[locale]/game/components/views/BalanceDashboard.tsx` (nový)

**Funkcionalita:**
- Zobrazit všechny aspirace s jejich bilancemi
- Vizuální indikátory nerovnováhy (barvy, progress bary)
- Doporučení, na které aspirace se zaměřit
- Možnost přidat do fokusu cíle z nedostatečně zastoupených aspirace

**UI:**
```
┌─────────────────────────────────────┐
│  Balance Dashboard                  │
├─────────────────────────────────────┤
│  Aspirace A: ████████░░ 80%        │
│  Aspirace B: ████░░░░░░ 40% ⚠️     │
│  Aspirace C: ██████████ 100%        │
│                                     │
│  💡 Doporučení:                    │
│  Zaměř se na Aspiraci B            │
└─────────────────────────────────────┘
```

**Odhadovaný čas:** 6-8 hodin

#### Úkol 5.2: Integrace do hlavního panelu
**Soubor:** `app/[locale]/game/components/views/DayView.tsx`

**Kroky:**
1. Přidat Balance Dashboard jako boční panel nebo sekci
2. Zobrazit pouze pokud má uživatel aspirace

**Odhadovaný čas:** 2-3 hodiny

---

### FÁZE 6: Daily Check-in/Review (Priorita: STŘEDNÍ)

#### Úkol 6.1: Ranní Check-in
**Soubor:** `app/[locale]/game/components/DailyCheckIn.tsx` (refaktor nebo nový)

**Funkcionalita:**
- Zobrazit se ráno (první návštěva dne)
- "Co chci dnes dokončit?" - výběr z doporučených kroků
- Možnost přidat vlastní úkol
- Nastavit denní intenci

**Odhadovaný čas:** 5-6 hodin

#### Úkol 6.2: Večerní Review
**Soubor:** `app/[locale]/game/components/DailyReview.tsx` (nový)

**Funkcionalita:**
- Zobrazit večer (po 18:00)
- "Co jsem dnes dokončil?" - reflexe
- Možnost aktualizovat pokrok cílů
- Shrnutí dne

**Odhadovaný čas:** 5-6 hodin

---

### FÁZE 7: Vylepšení Management sekce (Priorita: NÍZKÁ)

#### Úkol 7.1: Timeline view cílů
**Soubor:** `app/[locale]/game/components/views/GoalsTimelineView.tsx` (nový)

**Funkcionalita:**
- Zobrazit cíle v časové ose
- Filtrovat podle časového horizontu
- Vizuální indikátory pokroku

**Odhadovaný čas:** 6-8 hodin

#### Úkol 7.2: Filtry podle časového horizontu
**Soubor:** `app/[locale]/game/components/views/GoalsManagementView.tsx`

**Kroky:**
1. Přidat dropdown filtr: Vše / Krátkodobé / Střednědobé / Dlouhodobé
2. Přidat filtr podle focus_status

**Odhadovaný čas:** 2-3 hodiny

---

### FÁZE 8: Gamifikace a motivace (Priorita: NÍZKÁ)

#### Úkol 8.1: Streak tracking
**Soubor:** `app/[locale]/game/components/StreakTracker.tsx` (nový)

**Funkcionalita:**
- Počítat dny v řadě s aktivitou
- Zobrazit v hlavním panelu
- Oslavy při dosažení milníků (7, 30, 100 dní)

**Odhadovaný čas:** 4-5 hodin

#### Úkol 8.2: Weekly/Monthly summaries
**Soubor:** `app/[locale]/game/components/SummaryView.tsx` (nový)

**Funkcionalita:**
- Automaticky generovat týdenní/měsíční shrnutí
- Zobrazit pokrok, dokončené úkoly, dosažené milníky

**Odhadovaný čas:** 6-8 hodin

---

## 🔄 PROPAGACE FOCUS STATUS V APLIKACI

### Místa, kde se focus_status použije:

1. **Hlavní panel (DayView)**
   - Filtrovat kroky podle aktivních cílů
   - Zobrazit "Dnešní fokus" sekci

2. **Management sekce**
   - Zobrazit focus_status v tabulce cílů
   - Filtrovat podle focus_status
   - Sortovat podle focus_order

3. **Doporučení**
   - Prioritizovat kroky z aktivních cílů
   - Navrhnout přidat cíle do fokusu

4. **Balance Dashboard**
   - Doporučit cíle z nedostatečně zastoupených aspirace
   - Možnost přidat do aktivního fokusu

5. **Statistiky**
   - Zobrazit pokrok podle focus_status
   - Analýza efektivity fokusu

---

## 📝 TECHNICKÉ DETAILY

### API Endpoints

#### POST /api/goals/focus
```typescript
Request:
{
  goalId: string,
  focusStatus: 'active_focus' | 'deferred' | null,
  focusOrder?: number
}

Response:
{
  success: boolean,
  goal: Goal
}
```

#### PUT /api/goals/focus/reorder
```typescript
Request:
{
  goalIds: string[] // ordered array
}

Response:
{
  success: boolean,
  goals: Goal[]
}
```

#### GET /api/goals/focus
```typescript
Query params:
{
  focusStatus?: 'active_focus' | 'deferred' | null
}

Response:
{
  goals: Goal[]
}
```

### Database Migration Script

```javascript
// scripts/migrate-add-focus-fields.js
async function migrate() {
  await sql`
    ALTER TABLE goals 
    ADD COLUMN IF NOT EXISTS focus_status VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS focus_order INTEGER DEFAULT NULL;
  `
  
  // Add constraint
  await sql`
    ALTER TABLE goals
    ADD CONSTRAINT check_focus_status 
    CHECK (focus_status IN ('active_focus', 'deferred') OR focus_status IS NULL);
  `
}
```

---

## 🎨 UI/UX POZNÁMKY

### Focus Management View
- Použít drag & drop (už máte @dnd-kit)
- Vizuální rozlišení: aktivní = zelená/oranžová, odložené = šedá
- Možnost bulk akcí (přidat více cílů najednou)

### Hlavní panel
- Minimalistický design
- Fokus nahoře (nejdůležitější)
- Rychlé akce (swipe, checkbox)
- Responzivní layout

---

## ✅ CHECKLIST IMPLEMENTACE

### Fáze 1: Databáze a API
- [ ] Migrace databáze
- [ ] Aktualizace TypeScript typů
- [ ] API endpoint pro fokus
- [ ] Testování API

### Fáze 2: Focus Management
- [ ] FocusManagementView komponenta
- [ ] Drag & drop funkcionalita
- [ ] Integrace do navigace
- [ ] Testování UI

### Fáze 3: Hlavní panel
- [ ] Refaktor DayView
- [ ] TodayFocusSection komponenta
- [ ] QuickOverviewWidget
- [ ] Testování

### Fáze 4: Průvodce cíli
- [ ] GoalCreationWizard
- [ ] Integrace do Management
- [ ] Testování

### Fáze 5-8: Ostatní vylepšení
- [ ] Balance Dashboard
- [ ] Daily Check-in/Review
- [ ] Timeline view
- [ ] Gamifikace

---

## 📊 ODHADOVANÝ ČAS

- **Fáze 1:** 7-9 hodin
- **Fáze 2:** 9-12 hodin
- **Fáze 3:** 13-17 hodin
- **Fáze 4:** 10-13 hodin
- **Fáze 5:** 8-11 hodin
- **Fáze 6:** 10-12 hodin
- **Fáze 7:** 8-11 hodin
- **Fáze 8:** 10-13 hodin

**Celkem:** ~75-100 hodin

**Prioritní implementace (Fáze 1-3):** ~29-38 hodin

---

## 🚀 DOPORUČENÝ POŘADÍ IMPLEMENTACE

1. **Fáze 1** - Databáze a API (základ pro vše)
2. **Fáze 2** - Focus Management (klíčová funkcionalita)
3. **Fáze 3** - Hlavní panel (okamžitý dopad na UX)
4. **Fáze 4** - Průvodce cíli (zlepší onboarding)
5. **Fáze 5-8** - Postupně podle priorit

---

## 📌 POZNÁMKY

- Všechny změny by měly být zpětně kompatibilní
- Focus status je volitelný - cíle bez fokusu fungují jako dřív
- Migrace by měla být bezpečná pro produkční data
- Testování na všech úrovních (unit, integration, E2E)

