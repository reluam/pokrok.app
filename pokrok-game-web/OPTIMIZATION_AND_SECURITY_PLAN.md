# Plán optimalizace výkonu a bezpečnosti aplikace Pokrok

## 📋 Přehled

Tento dokument obsahuje podrobný plán pro:
1. **Optimalizaci funkcí a dotazů** - řešení problémů s pomalým načítáním (8 sekund) a pomalými operacemi (1 sekunda)
2. **Zajištění bezpečnosti** - kontrola, že pouze autentizovaný uživatel má přístup ke svým datům

---

## 🔒 ČÁST 1: BEZPEČNOSTNÍ AUDIT A OPRAVY

### 1.1 Kritické bezpečnostní problémy

#### ❌ Problém 1: `/api/daily-steps/route.ts` - GET endpoint bez autentizace
**Lokace:** `app/api/daily-steps/route.ts` (řádky 42-118)

**Problém:**
- Endpoint neověřuje autentizaci uživatele
- Pouze kontroluje `userId` v query parametru, ale neověřuje, že patří autentizovanému uživateli
- Umožňuje přístup k datům jiných uživatelů

**Řešení:**
```typescript
export async function GET(request: NextRequest) {
  try {
    // ✅ PŘIDAT: Ověření autentizace
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ PŘIDAT: Ověření, že userId patří autentizovanému uživateli
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const goalId = searchParams.get('goalId')
    
    // ✅ PŘIDAT: Ověření vlastnictví
    if (userId && userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ✅ PŘIDAT: Ověření vlastnictví goalId, pokud je poskytnut
    if (goalId) {
      const goal = await sql`SELECT user_id FROM goals WHERE id = ${goalId}`
      if (goal.length === 0 || goal[0].user_id !== dbUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    
    // Použít dbUser.id místo userId z query parametru
    const targetUserId = userId || dbUser.id
    
    // ... zbytek kódu
  }
}
```

#### ❌ Problém 2: `/api/daily-steps/route.ts` - DELETE endpoint bez autentizace
**Lokace:** `app/api/daily-steps/route.ts` (řádky 490-517)

**Problém:**
- Endpoint neověřuje autentizaci
- Neověřuje vlastnictví stepu před smazáním

**Řešení:**
```typescript
export async function DELETE(request: NextRequest) {
  try {
    // ✅ PŘIDAT: Ověření autentizace
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ PŘIDAT: Ověření uživatele
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // ✅ PŘIDAT: Ověření vlastnictví stepu
    const step = await sql`
      SELECT user_id FROM daily_steps WHERE id = ${stepId}
    `
    
    if (step.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }
    
    if (step[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ... zbytek kódu
  }
}
```

#### ❌ Problém 3: `/api/daily-steps/route.ts` - PUT endpoint bez ověření vlastnictví
**Lokace:** `app/api/daily-steps/route.ts` (řádky 237-488)

**Problém:**
- Endpoint ověřuje autentizaci, ale neověřuje vlastnictví stepu před úpravou

**Řešení:**
```typescript
export async function PUT(request: NextRequest) {
  try {
    // ✅ PŘIDAT: Ověření autentizace (pokud chybí)
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { stepId, ... } = body
    
    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // ✅ PŘIDAT: Ověření vlastnictví stepu
    const existingStep = await sql`
      SELECT user_id FROM daily_steps WHERE id = ${stepId}
    `
    
    if (existingStep.length === 0) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    }
    
    if (existingStep[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // ... zbytek kódu
  }
}
```

#### ❌ Problém 4: `/api/daily-steps/route.ts` - POST endpoint bez ověření userId
**Lokace:** `app/api/daily-steps/route.ts` (řádky 120-235)

**Problém:**
- Endpoint přijímá `userId` z request body, ale neověřuje, že patří autentizovanému uživateli

**Řešení:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // ✅ PŘIDAT: Ověření autentizace
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId, ... } = body
    
    // ✅ PŘIDAT: Ověření, že userId v body odpovídá autentizovanému uživateli
    if (userId && userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Použít dbUser.id místo userId z body
    const targetUserId = userId || dbUser.id
    
    // ... zbytek kódu s targetUserId
  }
}
```

### 1.2 Audit všech API routes

#### Kontrolní seznam pro každý API endpoint:

1. ✅ **Ověření autentizace** - `const { userId: clerkUserId } = await auth()`
2. ✅ **Kontrola existence uživatele** - `getUserByClerkId(clerkUserId)`
3. ✅ **Ověření vlastnictví dat** - kontrola, že `user_id` v databázi odpovídá `dbUser.id`
4. ✅ **Validace vstupů** - kontrola, že všechny požadované parametry jsou přítomny
5. ✅ **SQL injection ochrana** - použití parametrizovaných dotazů (už je implementováno)

#### Endpointy k ověření:

- [ ] `/api/daily-steps/route.ts` - GET, POST, PUT, DELETE
- [ ] `/api/habits/route.ts` - GET, POST, PUT, DELETE
- [ ] `/api/habits/toggle/route.ts` - POST
- [ ] `/api/habits/calendar/route.ts` - GET
- [ ] `/api/goals/route.ts` - GET, POST, PUT, DELETE
- [ ] `/api/goals/focus/route.ts` - POST
- [ ] `/api/cesta/areas/route.ts` - GET, POST, PUT, DELETE
- [ ] `/api/cesta/daily-steps/[id]/toggle/route.ts` - POST
- [ ] `/api/cesta/goals-with-steps/route.ts` - GET
- [ ] `/api/cesta/user-settings/route.ts` - GET, PATCH
- [ ] `/api/player/route.ts` - GET, POST, PUT
- [ ] `/api/player/delete/route.ts` - DELETE
- [ ] `/api/workflows/route.ts` - GET, POST
- [ ] `/api/workflows/[id]/route.ts` - GET, PUT, DELETE
- [ ] `/api/workflows/pending/route.ts` - GET
- [ ] `/api/workflows/responses/route.ts` - POST
- [ ] `/api/automations/route.ts` - GET, POST

### 1.3 Vytvoření helper funkce pro autorizaci

**Lokace:** `lib/auth-helpers.ts` (nový soubor)

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId, User } from '@/lib/cesta-db'

export interface AuthContext {
  clerkUserId: string
  dbUser: User
}

/**
 * Ověří autentizaci a vrátí kontext uživatele
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const { userId: clerkUserId } = await auth()
  
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getUserByClerkId(clerkUserId)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return { clerkUserId, dbUser }
}

/**
 * Ověří, že userId patří autentizovanému uživateli
 */
export function verifyOwnership(userId: string, dbUser: User): boolean {
  return userId === dbUser.id
}

/**
 * Ověří vlastnictví entity podle user_id v databázi
 */
export async function verifyEntityOwnership(
  entityId: string,
  tableName: string,
  dbUser: User,
  sql: any
): Promise<boolean> {
  try {
    const result = await sql`
      SELECT user_id FROM ${sql(tableName)} WHERE id = ${entityId}
    `
    return result.length > 0 && result[0].user_id === dbUser.id
  } catch (error) {
    console.error(`Error verifying ownership for ${tableName}:`, error)
    return false
  }
}
```

---

## ⚡ ČÁST 2: OPTIMALIZACE VÝKONU

### 2.1 Problémy s výkonem

#### 🐌 Problém 1: Pomalé načítání aplikace (8 sekund)

**Příčiny:**
1. `/api/game/init` načítá všechna data sekvenčně místo paralelně
2. `getHabitsByUserId` používá `json_object_agg` s LEFT JOIN, což je pomalé
3. `getGoalsByUserId` má LEFT JOIN s areas
4. Chybí databázové indexy pro některé sloupce
5. Cache má příliš krátký TTL (0.5 sekundy)

**Řešení:**

##### A) Optimalizace dotazu `getHabitsByUserId`

**Současný stav:**
```typescript
const result = await sql`
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
  WHERE h.user_id = ${userId}
  GROUP BY h.id
  ORDER BY h.created_at DESC
`
```

**Optimalizace:**
1. Přidat index na `habit_completions(habit_id, completion_date)`
2. Použít subquery místo LEFT JOIN s GROUP BY
3. Načítat pouze potřebná data

**Optimalizovaný dotaz:**
```typescript
// Varianta 1: Separátní dotazy (rychlejší pro malý počet habits)
const habits = await sql`
  SELECT * FROM habits 
  WHERE user_id = ${userId}
  ORDER BY created_at DESC
`

const habitIds = habits.map(h => h.id)
if (habitIds.length > 0) {
  const completions = await sql`
    SELECT habit_id, completion_date, completed
    FROM habit_completions
    WHERE habit_id = ANY(${habitIds})
  `
  
  // Seskupit completions podle habit_id
  const completionsMap = new Map()
  completions.forEach(c => {
    const date = c.completion_date.toISOString().split('T')[0]
    if (!completionsMap.has(c.habit_id)) {
      completionsMap.set(c.habit_id, {})
    }
    completionsMap.get(c.habit_id)[date] = c.completed
  })
  
  // Přidat completions k habits
  habits.forEach(habit => {
    habit.habit_completions = completionsMap.get(habit.id) || {}
  })
}

// Varianta 2: Optimalizovaný dotaz s window functions (pro větší množství dat)
const result = await sql`
  WITH habit_completions_agg AS (
    SELECT 
      habit_id,
      json_object_agg(
        TO_CHAR(completion_date, 'YYYY-MM-DD'),
        completed
      ) as completions
    FROM habit_completions
    WHERE habit_id IN (
      SELECT id FROM habits WHERE user_id = ${userId}
    )
    GROUP BY habit_id
  )
  SELECT 
    h.*,
    COALESCE(hca.completions, '{}'::json) as habit_completions
  FROM habits h
  LEFT JOIN habit_completions_agg hca ON h.id = hca.habit_id
  WHERE h.user_id = ${userId}
  ORDER BY h.created_at DESC
`
```

##### B) Optimalizace cache

**Současný stav:**
- TTL: 0.5 sekundy (příliš krátké)
- Cache se čistí při každém volání

**Optimalizace:**
```typescript
// Zvýšit TTL
const HABITS_CACHE_TTL = 30000 // 30 sekund
const GOALS_CACHE_TTL = 30000 // 30 sekund
const USER_CACHE_TTL = 60000 // 60 sekund

// Použít request-scoped cache s AsyncLocalStorage
import { AsyncLocalStorage } from 'async_hooks'

const requestCache = new AsyncLocalStorage<Map<string, any>>()

// V API route:
export async function GET(request: NextRequest) {
  return requestCache.run(new Map(), async () => {
    // Cache je dostupný pouze v rámci tohoto requestu
    // Automaticky se vyčistí po dokončení requestu
  })
}
```

##### C) Přidání databázových indexů

**Chybějící indexy:**
```sql
-- Indexy pro habit_completions
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id 
  ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date 
  ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit_date 
  ON habit_completions(user_id, habit_id, completion_date);

-- Indexy pro habits
CREATE INDEX IF NOT EXISTS idx_habits_user_id_created 
  ON habits(user_id, created_at DESC);

-- Indexy pro daily_steps (pokud chybí)
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date 
  ON daily_steps(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_goal_date 
  ON daily_steps(user_id, goal_id, date) WHERE goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_area_date 
  ON daily_steps(user_id, area_id, date) WHERE area_id IS NOT NULL;

-- Indexy pro goals
CREATE INDEX IF NOT EXISTS idx_goals_user_status_created 
  ON goals(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_area 
  ON goals(user_id, area_id) WHERE area_id IS NOT NULL;

-- Indexy pro areas
CREATE INDEX IF NOT EXISTS idx_areas_user_order 
  ON areas(user_id, "order");
```

#### 🐌 Problém 2: Pomalé dokončení návyků/kroků (1 sekunda)

**Příčiny:**
1. Po toggle habit completion se znovu načítají všechny habits
2. Chybí optimalizace pro jednotlivé operace
3. Neefektivní cache invalidation

**Řešení:**

##### A) Optimalizace `toggleHabitCompletion`

**Současný stav:**
```typescript
// V /api/habits/toggle/route.ts
const result = await toggleHabitCompletion(dbUser.id, habitId, date)
// ...
const allHabits = await getHabitsByUserId(dbUser.id) // ❌ Načítá všechny habits
const updatedHabit = allHabits.find(h => h.id === habitId)
```

**Optimalizace:**
```typescript
// V toggleHabitCompletion - vrátit pouze aktualizovaný habit
export async function toggleHabitCompletion(userId: string, habitId: string, date?: string) {
  // ... existující logika ...
  
  // ✅ Místo invalidace cache, aktualizovat pouze konkrétní habit
  // Načíst pouze tento habit s completions
  const habit = await sql`
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
    WHERE h.id = ${habitId} AND h.user_id = ${userId}
    GROUP BY h.id
  `
  
  return {
    ...habit[0],
    habit_completions: habit[0].habit_completions || {}
  }
}

// V API route:
export async function POST(request: NextRequest) {
  // ...
  const updatedHabit = await toggleHabitCompletion(dbUser.id, habitId, date)
  
  // ✅ Invalidate cache pouze pro tento habit (ne všechny)
  invalidateHabitsCache(dbUser.id)
  
  return NextResponse.json(updatedHabit)
}
```

##### B) Optimalizace dokončení stepu

**Současný stav:**
- Při dokončení stepu se načítá celý step znovu

**Optimalizace:**
```typescript
// V updateDailyStepFields - použít RETURNING klauzuli
export async function updateDailyStepFields(stepId: string, updates: any) {
  const result = await sql`
    UPDATE daily_steps 
    SET ${sql(updates)}, updated_at = NOW()
    WHERE id = ${stepId}
    RETURNING 
      id, user_id, goal_id, title, description, completed, 
      TO_CHAR(date, 'YYYY-MM-DD') as date,
      is_important, is_urgent, aspiration_id, area_id,
      estimated_time, xp_reward, deadline, completed_at, 
      created_at, updated_at,
      COALESCE(checklist, '[]'::jsonb) as checklist,
      COALESCE(require_checklist_complete, false) as require_checklist_complete
  `
  
  return result[0] || null
}
```

### 2.2 Optimalizace načítání dat

#### A) Lazy loading pro nepotřebná data

**Problém:** Načítají se všechna data najednou, i když nejsou potřeba

**Řešení:**
```typescript
// V /api/game/init/route.ts
export async function GET(request: NextRequest) {
  // ...
  const { minimal } = new URL(request.url).searchParams.get('minimal')
  
  if (minimal === 'true') {
    // Načíst pouze základní data
    return NextResponse.json({
      user: dbUser,
      player: await getPlayerByUserId(dbUser.id).catch(() => null)
    })
  }
  
  // Plné načtení pouze pokud je potřeba
  const [player, goals, habits] = await Promise.all([
    getPlayerByUserId(dbUser.id).catch(() => null),
    getGoalsByUserId(dbUser.id).catch(() => []),
    getHabitsByUserId(dbUser.id).catch(() => [])
  ])
  
  // ...
}
```

#### B) Paginace pro velké množství dat

**Pro goals a habits:**
```typescript
export async function getGoalsByUserId(
  userId: string,
  limit?: number,
  offset?: number
): Promise<Goal[]> {
  const query = sql`
    SELECT g.*, a.name as area_name
    FROM goals g
    LEFT JOIN areas a ON g.area_id = a.id
    WHERE g.user_id = ${userId}
    ORDER BY g.created_at DESC
  `
  
  if (limit) {
    query.append(sql` LIMIT ${limit}`)
  }
  if (offset) {
    query.append(sql` OFFSET ${offset}`)
  }
  
  return await query
}
```

#### C) Použití database connection pooling

**Problém:** Každý request vytváří nové připojení

**Řešení:**
```typescript
// V lib/database.ts
import { Pool } from '@neondatabase/serverless'
import { neonConfig } from '@neondatabase/serverless'

// Použít connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximální počet připojení
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const sql = pool
```

### 2.3 Frontend optimalizace

#### A) Skeleton loading místo prázdné obrazovky

**Současný stav:**
- Zobrazuje se pouze spinner

**Optimalizace:**
```typescript
// Zobrazit skeleton UI místo spinneru
// Uživatel vidí strukturu stránky, i když se data načítají
```

#### B) Optimistic updates

**Pro toggle habit/step:**
```typescript
// Okamžitě aktualizovat UI, pak odeslat request
const toggleHabit = async (habitId: string) => {
  // Optimistic update
  setHabits(prev => prev.map(h => 
    h.id === habitId 
      ? { ...h, completed_today: !h.completed_today }
      : h
  ))
  
  try {
    await fetch('/api/habits/toggle', { ... })
  } catch (error) {
    // Rollback při chybě
    setHabits(prev => prev.map(h => 
      h.id === habitId 
        ? { ...h, completed_today: !h.completed_today }
        : h
    ))
  }
}
```

#### C) Debouncing pro rychlé operace

**Pro rychlé klikání:**
```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedToggle = useDebouncedCallback(
  async (habitId: string) => {
    await toggleHabit(habitId)
  },
  300 // 300ms debounce
)
```

---

## 📝 ČÁST 3: IMPLEMENTAČNÍ PLÁN

### Fáze 1: Bezpečnostní opravy (Priorita: VYSOKÁ)

1. **Opravit `/api/daily-steps/route.ts`**
   - [ ] Přidat autentizaci do GET
   - [ ] Přidat autentizaci do POST
   - [ ] Přidat autentizaci do PUT
   - [ ] Přidat autentizaci do DELETE
   - [ ] Ověřit vlastnictví u všech operací

2. **Vytvořit helper funkce pro autorizaci**
   - [ ] Vytvořit `lib/auth-helpers.ts`
   - [ ] Implementovat `requireAuth()`
   - [ ] Implementovat `verifyOwnership()`
   - [ ] Implementovat `verifyEntityOwnership()`

3. **Audit všech API routes**
   - [ ] Projít všechny endpointy
   - [ ] Přidat autentizaci tam, kde chybí
   - [ ] Ověřit vlastnictví dat

### Fáze 2: Databázové optimalizace (Priorita: VYSOKÁ)

1. **Přidat chybějící indexy**
   - [ ] Vytvořit migrační script `scripts/add-performance-indexes.js`
   - [ ] Spustit migraci
   - [ ] Ověřit výkon

2. **Optimalizovat dotazy**
   - [ ] Optimalizovat `getHabitsByUserId`
   - [ ] Optimalizovat `getGoalsByUserId`
   - [ ] Optimalizovat `getDailyStepsByUserId`

### Fáze 3: Cache optimalizace (Priorita: STŘEDNÍ)

1. **Zlepšit cache strategii**
   - [ ] Zvýšit TTL pro cache
   - [ ] Implementovat request-scoped cache
   - [ ] Optimalizovat cache invalidation

2. **Optimalizovat toggle operace**
   - [ ] Upravit `toggleHabitCompletion` aby vracel pouze aktualizovaný habit
   - [ ] Upravit toggle step aby nepotřeboval reload všech dat

### Fáze 4: Frontend optimalizace (Priorita: STŘEDNÍ)

1. **Implementovat optimistic updates**
   - [ ] Pro toggle habit
   - [ ] Pro toggle step
   - [ ] Pro další rychlé operace

2. **Zlepšit UX při načítání**
   - [ ] Skeleton loading
   - [ ] Progressive loading

### Fáze 5: Monitoring a testování (Priorita: NÍZKÁ)

1. **Přidat monitoring výkonu**
   - [ ] Logovat dobu trvání dotazů
   - [ ] Sledovat pomalé dotazy
   - [ ] Nastavit alerty pro pomalé operace

2. **Testování**
   - [ ] Load testing
   - [ ] Security testing
   - [ ] Performance testing

---

## 🎯 OČEKÁVANÉ VÝSLEDKY

### Bezpečnost
- ✅ Všechny API routes jsou chráněné autentizací
- ✅ Všechny operace ověřují vlastnictví dat
- ✅ Žádný uživatel nemůže přistupovat k datům jiných uživatelů

### Výkon
- ✅ Načtení aplikace: **8 sekund → < 2 sekundy**
- ✅ Dokončení návyku: **1 sekunda → < 200ms**
- ✅ Dokončení kroku: **1 sekunda → < 200ms**
- ✅ Celková odezva API: **< 500ms pro většinu operací**

---

## 📚 DODATEČNÉ POZNÁMKY

### Best practices pro bezpečnost
1. **Nikdy nedůvěřujte client-side datům** - vždy ověřujte na serveru
2. **Používejte parametrizované dotazy** - ochrana proti SQL injection (už implementováno)
3. **Ověřujte vlastnictví u každé operace** - i když se zdá zbytečné
4. **Logujte podezřelé aktivity** - pro pozdější analýzu

### Best practices pro výkon
1. **Používejte indexy** - pro všechny sloupce používané v WHERE a JOIN
2. **Optimalizujte dotazy** - vyhněte se N+1 problémům
3. **Používejte cache** - ale s rozumem
4. **Měřte výkon** - nelze optimalizovat to, co neměříte

---

## ✅ CHECKLIST PRO IMPLEMENTACI

### Bezpečnost
- [ ] Všechny API routes mají autentizaci
- [ ] Všechny operace ověřují vlastnictví
- [ ] Helper funkce pro autorizaci jsou implementovány
- [ ] Security audit je dokončen

### Výkon
- [ ] Všechny potřebné indexy jsou vytvořeny
- [ ] Dotazy jsou optimalizovány
- [ ] Cache strategie je vylepšena
- [ ] Toggle operace jsou optimalizovány
- [ ] Frontend používá optimistic updates

### Testování
- [ ] Všechny endpointy jsou otestovány
- [ ] Výkon je měřen a dokumentován
- [ ] Security testy prošly úspěšně

---

**Datum vytvoření:** 2024
**Poslední aktualizace:** 2024
**Autor:** AI Assistant





