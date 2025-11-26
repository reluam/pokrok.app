# Prompt pro předělání hlavního panelu

## Kontext projektu

Pracuji na Next.js aplikaci pro tracking osobního rozvoje s gamifikací. Projekt je monorepo s několika submoduly:
- `pokrok-game-web/` - hlavní Next.js aplikace (App Router)
- `pokrok-web/` - další webová aplikace
- `pokrok-shared/` - sdílené typy a utility

## Technický stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Autentizace**: Clerk
- **Databáze**: PostgreSQL (Neon)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Jazyk**: TypeScript
- **State management**: React hooks (useState, useEffect)

## Aktuální stav hlavního panelu

Hlavní panel je implementován v souboru:
**`pokrok-game-web/app/game/components/JourneyGameView.tsx`**

### Struktura komponenty

Komponenta `JourneyGameView` obsahuje:

1. **Menu na levé straně** - navigace mezi stránkami (Cíle, Návyky, Kroky, atd.)
2. **Hlavní zobrazovací oblast (Display Monitor)** - uprostřed, zobrazuje obsah podle vybraného programu
3. **Programy** - tři programy: "Den", "Týden", "Měsíc"
   - **Program "Den"** (`renderDayContent`):
     - Zobrazuje dnešní datum a progress bar
     - Dvou sloupcový layout:
       - Levý sloupec: Návyky (habits) pro dnes + `always_show` návyky
       - Pravý sloupec: Kroky (steps) - overdue a dnešní nedokončené
     - Každý návyk/krok má checkbox pro označení jako dokončený
     - Progress bar zobrazuje `completedTasks/totalTasks` a procento
   
   - **Program "Týden"** (`renderWeekContent`):
     - Zobrazuje `CalendarProgram` komponentu v týdenním režimu
     - Kalendář s 7 dny (po-ne)
     - Pod kalendářem box s návyky a kroky pro vybraný den (split na dva sloupce)
   
   - **Program "Měsíc"** (`renderMonthContent`):
     - Zobrazuje `CalendarProgram` komponentu v měsíčním režimu
     - Kalendář s dlaždicemi pro každý den měsíce
     - Při kliknutí na den se zobrazí detail panel vpravo s návyky a kroky

4. **Program selector** - tlačítka "Den", "Týden", "Měsíc" v dolní části displeje

### Klíčové funkce

- **Návyky (Habits)**:
  - Zobrazují se podle `frequency` (daily, custom)
  - `always_show = true` návyky se zobrazují vždy, ale počítají se do progressu pouze když jsou splněné
  - Každý návyk má streak indikátor (🔥 X)
  - Toggle completion přes `/api/habits/toggle`
  
- **Kroky (Steps)**:
  - Zobrazují se podle `date` pole
  - Overdue kroky mají červené pozadí
  - Toggle completion přes `/api/daily-steps`
  - Drag & drop mezi sloupci na stránce "Kroky"
  
- **Progress výpočet**:
  - V programu "Den": `(completedHabits + completedSteps) / (totalHabits + totalSteps) * 100`
  - Progress bar je capped na 100% (Math.min)

### API endpointy

- `GET /api/habits` - načtení všech návyků
- `POST /api/habits/toggle` - toggle completion návyku pro daný datum
- `GET /api/daily-steps?userId=...` - načtení všech kroků pro uživatele
- `POST /api/daily-steps` - vytvoření nového kroku
- `PUT /api/daily-steps` - aktualizace kroku
- `GET /api/areas?userId=...` - načtení životních oblastí

### Data struktura

**Habit:**
```typescript
{
  id: string
  name: string
  frequency: 'daily' | 'custom'
  selected_days?: string[]
  always_show?: boolean
  habit_completions?: { [date: string]: boolean }
  xp_reward?: number
  streak?: number
}
```

**Daily Step:**
```typescript
{
  id: string
  title: string
  description?: string
  date: string (YYYY-MM-DD)
  completed: boolean
  goal_id?: string
  xp_reward?: number
  is_important?: boolean
  is_urgent?: boolean
}
```

## Úkol

Chci **předělat hlavní panel** (komponenta `JourneyGameView`, konkrétně program "Den" a celkový layout).

### Co potřebuji

1. **Analyzovat aktuální stav** - projít kód v `JourneyGameView.tsx`, zejména:
   - `renderDayContent()` funkci (řádky ~1899-2180)
   - Layout strukturu (menu, display monitor, program selector)
   - Jak se data načítají a aktualizují

2. **Navrhnout nový design** - podle mých požadavků (které zadám později)

3. **Implementovat změny** - refaktorovat hlavní panel s respektováním:
   - Existujících API endpointů
   - State managementu
   - Prop drilling struktury
   - TypeScript typů

### Klíčové soubory

- `pokrok-game-web/app/game/components/JourneyGameView.tsx` - hlavní komponenta (6371 řádků)
- `pokrok-game-web/app/game/components/CalendarProgram.tsx` - kalendář komponenta
- `pokrok-game-web/app/game/components/GameWorldView.tsx` - parent komponenta
- `pokrok-game-web/app/game/page.tsx` - entry point

### Důležité poznámky

- Aplikace používá českou lokalizaci
- Datumy se ukládají jako `YYYY-MM-DD` stringy v lokálním časovém pásmu
- Návyky s `always_show = true` se zobrazují vždy, ale počítají se do progressu pouze když jsou splněné
- Loading stavy jsou trackované pomocí `Set<string>` (loadingSteps, loadingHabits)
- Drag & drop je implementován pomocí @dnd-kit

## Jak postupovat

1. Nejdřív si přečti `JourneyGameView.tsx`, zejména:
   - Strukturu komponenty (řádky 1-200)
   - `renderDayContent()` funkci (řádky 1899-2180)
   - Jak se renderuje hlavní layout (hledej `renderPageContent` nebo hlavní return statement)

2. Pochop jak funguje:
   - State management (currentPage, currentProgram, selectedItem)
   - Data flow (goals, habits, dailySteps props)
   - API volání (handleHabitToggle, handleStepToggle)

3. Počkej na mé další instrukce, jaký design chci pro nový hlavní panel

---

**Poznámka**: Tento prompt je určen pro začátek nového chatu. Až budeš připraven, napiš mi, že jsi si přečetl kód a rozumíš struktuře, a pak ti zadám konkrétní požadavky na nový design.





