# Performance Trace - Co se děje během 12 sekund načítání

## Aktuální tok načítání při otevření `/planner`

### Krok 1: Načtení stránky (`/planner/page.tsx`)
**Čas: ~0-500ms**

1. **Auth check** - Clerk ověření uživatele
2. **Načtení user settings** - `/api/cesta/user-settings`
   - SQL: `SELECT * FROM user_settings WHERE user_id = ?`
3. **Načtení game data** - `/api/game/init`
   - Paralelně:
     - `getPlayerByUserId()` - SQL: `SELECT * FROM players WHERE user_id = ?`
     - `getGoalsByUserId()` - SQL: `SELECT g.*, a.name FROM goals g LEFT JOIN areas a ON g.area_id = a.id WHERE g.user_id = ?`
       - **Dekryptování všech goals** (title, description) - SYNCHRONNÍ operace!
       - `checkAndUpdateGoalsStatus()` - další SQL dotazy pro každý goal
     - `getHabitsByUserId()` - SQL s LEFT JOIN habit_completions (90 dní)
       - **Dekryptování všech habits** (name, description) - SYNCHRONNÍ operace!

### Krok 2: Renderování GameWorldView
**Čas: ~500-1000ms**

- `GameWorldView` se renderuje s prázdnými `dailySteps = []`
- `isLoadingSteps = true` → zobrazí se loading spinner
- Spouští se `useEffect` pro načítání steps

### Krok 3: Načítání Daily Steps (`GameWorldView.tsx`)
**Čas: ~1000-12000ms (TADY JE PROBLÉM!)**

```typescript
// GameWorldView.tsx line 71-73
const response = await fetch(
  `/api/daily-steps?userId=${currentUserId}&startDate=${veryOldDate}&endDate=${endDate}`
)
```

**Co se děje v `/api/daily-steps`:**

1. **Auth check** - `requireAuth()` 
2. **SQL dotaz** - `getDailyStepsByUserId()`
   ```sql
   SELECT 
     id, user_id, goal_id, title, description, completed, 
     TO_CHAR(date, 'YYYY-MM-DD') as date,
     ...
   FROM daily_steps 
   WHERE user_id = ? 
     AND (date >= ?::date AND date <= ?::date OR frequency IS NOT NULL)
   ORDER BY ...
   ```
   
   **PROBLÉM:** `OR frequency IS NOT NULL` znamená, že se načítají VŠECHNY recurring steps bez ohledu na date range!
   
3. **Normalizace dat** - mapování všech kroků
   ```typescript
   let normalizedSteps = steps.map((step) => ({
     ...step,
     date: normalizeDateFromDB(step.date)
   }))
   ```

4. **Response** - vrací se JSON s kroky

### Krok 4: Dekryptování kroků
**Čas: ~11000-12000ms**

**KRITICKÝ PROBLÉM:** `getDailyStepsByUserId` NEdekryptuje kroky!
- Kroky mají `title` a `description` zašifrované v databázi
- Ale v `/api/daily-steps/route.ts` se NEdekryptují
- Dekryptování se možná děje někde jinde nebo vůbec?

**Podívejme se:**
- `getDailyStepsByUserId` v `cesta-db.ts` vrací kroky přímo z SQL
- Nevidím tam žádné `decryptFields()` pro steps
- Goals a Habits se dekryptují, ale Steps NE!

### Krok 5: React renderování a useMemo
**Čas: ~12000-12500ms**

Po načtení steps:
1. `setDailySteps(steps)` → trigger re-render
2. `setIsLoadingSteps(false)` → trigger re-render
3. `UpcomingView` se renderuje
4. **useMemo výpočty:**
   - `allFeedSteps` - filtr všech kroků (pokud má hodně kroků, může být pomalé)
   - `upcomingSteps` - filtr a limit na 15 kroků
   - `stepsByArea` - grouping podle areas
   - `habitsByArea` - grouping habits podle areas

## Identifikované problémy:

### 🔴 KRITICKÝ: SQL dotaz načítá VŠECHNY recurring steps
```sql
WHERE user_id = ? 
  AND (date >= ?::date AND date <= ?::date OR frequency IS NOT NULL)
```

**`OR frequency IS NOT NULL`** znamená:
- Pokud má uživatel 100 recurring steps, načtou se VŠECHNY, i když jsou mimo date range!
- To může být tisíce záznamů, které se pak filtrují na klientovi

### 🔴 MOŽNÝ: Dekryptování na klientovi
- Pokud se kroky nedekryptují na serveru, může se to dít na klientovi
- Dekryptování velkého množství kroků může být pomalé (synchronní operace)

### 🟡 MOŽNÝ: useMemo výpočty
- Pokud je hodně kroků (tisíce), může být filtrování a sorting pomalé
- Ale to by nemělo trvat 12 sekund

## Doporučení pro debugging:

1. **Přidat performance logging:**
   ```typescript
   console.time('fetch-daily-steps')
   const response = await fetch(...)
   console.timeEnd('fetch-daily-steps')
   ```

2. **Zkontrolovat počet načtených kroků:**
   ```typescript
   console.log('Loaded steps count:', steps.length)
   ```

3. **Zkontrolovat, jestli se kroky dekryptují:**
   - Podívat se, jestli `title` a `description` jsou zašifrované nebo plain text

4. **Optimalizovat SQL dotaz:**
   - Odstranit `OR frequency IS NOT NULL` nebo ho podmínit date range

