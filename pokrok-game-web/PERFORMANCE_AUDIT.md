# Audit výkonu a SQL dotazů - Planner stránka

**Datum auditu:** 2024  
**Cíl:** Analyzovat načítání dat při otevření `/planner` a identifikovat problémy s výkonem  
**Aktuální doba načítání:** 10-15 sekund

## 1. Proces načítání při otevření `/planner`

### 1.1 Počáteční volání (`/planner/page.tsx`)

Při načtení stránky se provádějí následující kroky:

#### Krok 1: Načtení uživatelských nastavení
- **Endpoint:** `/api/cesta/user-settings`
- **Funkce:** `getUserSettings(dbUser.id)`
- **SQL dotazy:**
  ```sql
  -- getUserByClerkId (s cache)
  SELECT * FROM users WHERE clerk_user_id = ?
  
  -- getUserSettings
  SELECT * FROM user_settings WHERE user_id = ?
  ```
- **Problém:** Žádný zásadní problém

#### Krok 2: Načtení všech herních dat
- **Endpoint:** `/api/game/init`
- **Funkce:** 
  - `getPlayerByUserId(dbUser.id)`
  - `getGoalsByUserId(dbUser.id)`
  - `getHabitsByUserId(dbUser.id, true)` - **forceFresh = true**

##### A. Onboarding inicializace (v `/api/game/init`)
**PROBLÉM:** Provádí se při každém načtení, i když už je uživatel onboardován
```sql
-- Kontrola existence onboarding area
SELECT id FROM areas 
WHERE user_id = ? AND (name = 'Začínáme' OR name = 'Getting Started')
LIMIT 1

-- Pokud neexistuje, kontrola user settings pro locale
SELECT locale FROM user_settings WHERE user_id = ?

-- Pokud area neexistuje, inicializace onboarding steps
-- (volá initializeOnboardingSteps - vytváří area + několik steps)

-- Pokud area existuje, kontrola steps
SELECT id FROM daily_steps 
WHERE user_id = ? AND area_id = ?
LIMIT 1
```
**Doporučení:** Tuto kontrolu provádět pouze pokud `has_completed_onboarding = false`

##### B. Načtení Goals (`getGoalsByUserId`)
```sql
SELECT g.*, a.name as area_name
FROM goals g
LEFT JOIN areas a ON g.area_id = a.id
WHERE g.user_id = ?
ORDER BY g.created_at DESC
```
**Po dotazu:**
- Dekryptování všech goals (title, description)
- Asynchronní volání `checkAndUpdateGoalsStatus(userId)` - další SQL dotazy:
  ```sql
  SELECT g.*, a.name as area_name
  FROM goals g
  LEFT JOIN areas a ON g.area_id = a.id
  WHERE g.user_id = ? AND g.status != 'completed' AND g.start_date IS NOT NULL
  
  -- Pro každý goal, pokud potřebuje update:
  UPDATE goals SET status = ? WHERE id = ? AND user_id = ?
  ```
**Problém:** `checkAndUpdateGoalsStatus` se provádí při každém načtení, i když goals nemusí potřebovat update

##### C. Načtení Habits (`getHabitsByUserId`)
```sql
SELECT h.*, 
       COALESCE(
         json_object_agg(
           TO_CHAR(hc.completion_date, 'YYYY-MM-DD'), 
           hc.completed
         ) FILTER (WHERE hc.completion_date IS NOT NULL),
         '{}'::json
       ) as habit_completions
FROM habits h
LEFT JOIN habit_completions hc ON h.id = hc.habit_id
WHERE h.user_id = ?
GROUP BY h.id
ORDER BY h.created_at DESC
```
**Problém:** Načítají se **VŠECHNA** habit_completions pro všechny habit bez časového omezení. Pokud má uživatel habit po dobu 2 let s denní frekvencí, načte se ~730 záznamů pro jeden habit!

##### D. Načtení Player (`getPlayerByUserId`)
```sql
SELECT * FROM players WHERE user_id = ? LIMIT 1
```
**Problém:** Žádný

### 1.2 Načtení Daily Steps (`GameWorldView`)

**Endpoint:** `/api/daily-steps`
**Parametry:** `startDate` = **10 let zpět**, `endDate` = **30 dní dopředu**

#### **KRITICKÝ PROBLÉM: Načítá se 10 let zpět!**

```sql
SELECT ... 
FROM daily_steps 
WHERE user_id = ?
AND (date >= '2014-01-01'::date AND date <= '2034-01-01'::date OR frequency IS NOT NULL)
ORDER BY ...
```

**Problémy:**
1. **Načítají se všechny completed steps z minulosti** - pro uživatele, který má aplikaci 2 roky, to může být tisíce záznamů
2. **Načítají se všechny recurring steps** (frequency IS NOT NULL) bez ohledu na to, jestli jsou relevantní
3. Po načtení se provádí kontrola a vytváření instancí pro OLD recurring step templates (is_hidden = true)

#### Proces vytváření instancí pro recurring steps:
```sql
-- Najít všechny OLD recurring step templates
SELECT id, user_id, goal_id, title, description, 
       frequency, selected_days,
       recurring_start_date, recurring_end_date,
       last_instance_date
FROM daily_steps
WHERE user_id = ? AND is_hidden = true AND frequency IS NOT NULL

-- Pro každý template:
-- 1. Kontrola, jestli potřebuje vytvořit instance (do 30 dní dopředu)
-- 2. Výpočet všech dat, kdy by měla být instance
-- 3. Batch vytvoření instancí (až 60 instancí)
```

**Problém:** Tento proces se provádí při každém GET requestu na `/api/daily-steps`, i když instance už existují

### 1.3 Další načítání v `JourneyGameView` a `PageContent`

#### `PageContent` - načítání view settings
```typescript
useEffect(() => {
  const response = await fetch('/api/view-settings?view_type=upcoming')
  // ...
}, [])
```

#### `PageContent` - načtení všech steps při navigaci na Steps page
```typescript
// Při navigaci na 'steps' page se načítají VŠECHNY steps
const response = await fetch(`/api/daily-steps?userId=${currentUserId}`)
// Bez date filtru - načte se VŠE!
```

#### `JourneyGameView` - další API volání při různých akcích
- `/api/cesta/areas` - načtení areas (opakovaně)
- `/api/workflows/only-the-important/check` - kontrola workflow
- `/api/habits/calendar` - načtení habit calendar dat
- A další...

## 2. Identifikované problémy

### 🔴 Kritické problémy

1. **Načítání 10 let zpět u Daily Steps**
   - **Soubor:** `pokrok-game-web/app/[locale]/planner/components/GameWorldView.tsx:65-66`
   - **Problém:** `veryOldDate.setFullYear(veryOldDate.getFullYear() - 10)` 
   - **Doporučení:** Omezit na max. 90 dní zpět (pro zobrazování overdue steps)

2. **Načítání všech habit_completions bez limitu**
   - **Soubor:** `pokrok-game-web/lib/cesta-db.ts:4638-4652`
   - **Problém:** `LEFT JOIN habit_completions` bez WHERE klauzule omezující datum
   - **Doporučení:** Omezit na posledních 90 dní nebo použít agregační dotaz

3. **Onboarding kontrola při každém načtení**
   - **Soubor:** `pokrok-game-web/app/api/game/init/route.ts:22-80`
   - **Problém:** Kontrola probíhá i pro uživatele s `has_completed_onboarding = true`
   - **Doporučení:** Přeskočit, pokud `has_completed_onboarding = true`

4. **Automatické vytváření instancí recurring steps při GET**
   - **Soubor:** `pokrok-game-web/app/api/daily-steps/route.ts:404-484`
   - **Problém:** Při každém GET se kontrolují a vytvářejí instance
   - **Doporučení:** Přesunout do background job nebo provádět pouze při potřebe

### 🟡 Střední problémy

5. **checkAndUpdateGoalsStatus se provádí při každém načtení**
   - **Soubor:** `pokrok-game-web/lib/cesta-db.ts:1186-1189`
   - **Problém:** Asynchronní volání může zpomalit response
   - **Doporučení:** Provádět pouze pokud se goals změnily nebo jednou denně

6. **Načtení všech steps bez filtru při navigaci na Steps page**
   - **Soubor:** `pokrok-game-web/app/[locale]/planner/components/pages/PageContent.tsx:341-361`
   - **Problém:** Načítají se všechny steps z historie
   - **Doporučení:** Použít rozumný date range nebo pagination

7. **Cache pro goals je vypnutý (TTL = 0)**
   - **Soubor:** `pokrok-game-web/lib/cesta-db.ts:19`
   - **Problém:** `GOALS_CACHE_TTL = 0` - žádné cacheování
   - **Doporučení:** Zapnout cache s TTL 5-10 sekund

### 🟢 Menší problémy

8. **Více volání na `/api/cesta/areas`**
   - Načítá se na více místech
   - **Doporučení:** Načíst jednou a předat jako prop

9. **Žádné indexy na často používaných sloupcích**
   - **Doporučení:** Přidat indexy na:
     - `daily_steps(user_id, date)`
     - `daily_steps(user_id, completed, date)`
     - `habit_completions(user_id, habit_id, completion_date)`
     - `goals(user_id, status, start_date)`

## 3. Legacy a zbytečný kód

### 3.1 Legacy kód pro recurring steps

#### OLD recurring steps systém (is_hidden = true)
- **Soubor:** `pokrok-game-web/app/api/daily-steps/route.ts:404-484`
- **Popis:** Starý systém, kde recurring steps jsou "hidden" a vytvářejí se instance
- **Nový systém:** Recurring steps mají `current_instance_date` a nejsou hidden
- **Doporučení:** 
  - Migrovat všechny OLD recurring steps na nový systém
  - Odstranit kód pro vytváření instancí při GET
  - Odstranit `is_hidden`, `last_instance_date`, `last_completed_instance_date`

#### DEPRECATED funkce `createRecurringStepInstance`
- **Soubor:** `pokrok-game-web/app/api/daily-steps/route.ts:64-114`
- **Popis:** Funkce je označená jako DEPRECATED
- **Doporučení:** Odstranit po migraci na nový systém

#### Kontrola instance title pattern (" - ")
- **Soubor:** `pokrok-game-web/app/api/daily-steps/route.ts:1153-1273`
- **Popis:** Kontrola, jestli step je instance pomocí patternu v title
- **Doporučení:** Po migraci na nový systém odstranit

### 3.2 Zbytečné kontroly

#### Kontrola existence `start_date` column v habits table
- **Soubor:** `pokrok-game-web/lib/cesta-db.ts:4488-4501`
- **Popis:** Při každém vytváření habit se kontroluje, jestli column existuje
- **Doporučení:** Pokud je migration už provedená, odstranit

#### Retry logika v `/planner/page.tsx`
- **Soubor:** `pokrok-game-web/app/[locale]/planner/page.tsx:52-62`
- **Popis:** Retry logika pro 500 errors při načítání game data
- **Posouzení:** Může být užitečná pro nové uživatele, ale pro existující uživatele je zbytečná

### 3.3 Duplicitní kód

#### Více míst, kde se načítají areas
- `JourneyGameView` načítá areas
- `PageContent` může načítat areas
- **Doporučení:** Centralizovat načítání na jedno místo

#### Duplicitní date normalization
- **Soubor:** `pokrok-game-web/app/api/daily-steps/route.ts:286-320`
- **Popis:** Funkce `normalizeDateFromDB` je použita na více místech
- **Posouzení:** Může být užitečná, ale zvážit centralizaci do utility

## 4. Doporučení pro optimalizaci

### 4.1 Okamžité opravy (High Priority)

1. **Omezit rozsah načítaných Daily Steps**
   ```typescript
   // GameWorldView.tsx - změnit z 10 let na 90 dní
   const veryOldDate = new Date(today)
   veryOldDate.setDate(veryOldDate.getDate() - 90) // Místo -10 let
   ```

2. **Optimalizovat načítání habit_completions**
   ```sql
   -- Přidat WHERE klauzuli omezující na posledních 90 dní
   SELECT h.*, 
          COALESCE(
            json_object_agg(
              TO_CHAR(hc.completion_date, 'YYYY-MM-DD'), 
              hc.completed
            ) FILTER (WHERE hc.completion_date >= CURRENT_DATE - INTERVAL '90 days'),
            '{}'::json
          ) as habit_completions
   FROM habits h
   LEFT JOIN habit_completions hc ON h.id = hc.habit_id 
     AND hc.completion_date >= CURRENT_DATE - INTERVAL '90 days'
   WHERE h.user_id = ?
   GROUP BY h.id
   ```

3. **Přeskočit onboarding kontrolu pro onboardované uživatele**
   ```typescript
   // /api/game/init/route.ts
   if (dbUser.has_completed_onboarding) {
     // Přeskočit onboarding kontrolu
   } else {
     // Provést onboarding kontrolu
   }
   ```

4. **Odstranit automatické vytváření instancí při GET**
   ```typescript
   // /api/daily-steps/route.ts
   // Odstranit nebo přesunout do background job
   // Kontrola a vytváření instancí by mělo být:
   // - Při vytváření/update recurring step
   // - V background job (cron)
   // - NE při každém GET requestu
   ```

5. **Přidat databázové indexy**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date 
   ON daily_steps(user_id, date) 
   WHERE date IS NOT NULL;
   
   CREATE INDEX IF NOT EXISTS idx_daily_steps_user_completed_date 
   ON daily_steps(user_id, completed, date);
   
   CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit_date 
   ON habit_completions(user_id, habit_id, completion_date);
   
   CREATE INDEX IF NOT EXISTS idx_goals_user_status 
   ON goals(user_id, status, start_date);
   ```

### 4.2 Střednědobé optimalizace (Medium Priority)

6. **Lazy loading pro checkAndUpdateGoalsStatus**
   - Provádět pouze pokud se goals změnily v posledních X hodinách
   - Nebo přesunout do background job

7. **Zapnout cache pro goals**
   ```typescript
   const GOALS_CACHE_TTL = 5000 // 5 sekund místo 0
   ```

8. **Použít date range při načítání steps na Steps page**
   ```typescript
   // Místo načtení všech steps, použít rozumný range
   const startDate = new Date()
   startDate.setDate(startDate.getDate() - 90)
   const endDate = new Date()
   endDate.setDate(endDate.getDate() + 90)
   ```

9. **Centralizovat načítání areas**
   - Načíst areas jednou v `/api/game/init` nebo při prvním potřebném použití
   - Předat jako prop do komponent

### 4.3 Dlouhodobé optimalizace (Low Priority)

10. **Migrace z OLD recurring steps na nový systém**
    - Migrační script pro všechny existující OLD recurring steps
    - Po migraci odstranit legacy kód

11. **Implementovat pagination pro steps**
    - Pro Steps page použít infinite scroll nebo pagination
    - Načítat po 50-100 záznamů

12. **Background jobs pro dlouhotrvající operace**
    - Vytváření instancí recurring steps
    - checkAndUpdateGoalsStatus
    - Cleanup starých záznamů

13. **Query optimization**
    - Analyzovat EXPLAIN pro všechny hlavní dotazy
    - Optimalizovat složité JOINy
    - Použít materiálované view pro často používané dotazy

## 5. Odhadované zlepšení výkonu

Po implementaci kritických oprav:
- **Omezení Daily Steps na 90 dní:** -60% dat v response (z ~10 let na 90 dní)
- **Optimalizace habit_completions:** -80% dat v response (z celé historie na 90 dní)
- **Odstranění onboarding kontroly:** -200-500ms pro onboardované uživatele
- **Odstranění automatického vytváření instancí:** -1-3 sekundy v závislosti na počtu recurring steps
- **Přidání indexů:** -30-50% času na SQL dotazech

**Celkové odhadované zlepšení:** 5-8 sekund (z 10-15s na 2-7s)

## 6. Plán implementace

### Fáze 1: Kritické opravy (1-2 dny)
1. Omezit rozsah Daily Steps
2. Optimalizovat habit_completions
3. Přeskočit onboarding kontrolu
4. Přidat indexy

### Fáze 2: Odstranění legacy kódu (3-5 dní)
1. Migrace OLD recurring steps
2. Odstranění kódu pro OLD systém
3. Testování

### Fáze 3: Další optimalizace (5-10 dní)
1. Zapnout cache pro goals
2. Lazy loading pro checkAndUpdateGoalsStatus
3. Centralizovat načítání areas
4. Pagination pro steps

### Fáze 4: Monitoring a fine-tuning (kontinuálně)
1. Sledování výkonu po změnách
2. A/B testování
3. Další optimalizace na základě dat

## 7. Monitoring

Doporučeno implementovat:
- Logování času trvání každého API requestu
- Metriky pro počet načtených záznamů
- Alerting při pomalých dotazech (>1s)
- Graf výkonu v čase

---

**Poznámka:** Tento audit byl proveden na základě statické analýzy kódu. Pro úplné pochopení je doporučeno:
1. Profilovat aplikaci v produkci
2. Sledovat SQL query logs
3. Měřit skutečnou dobu načítání po každé změně

