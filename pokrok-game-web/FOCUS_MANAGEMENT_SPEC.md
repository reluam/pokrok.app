# Focus Management - Detailní specifikace

## Koncept

Focus Management umožňuje uživateli aktivně řídit priority svých cílů. Uživatel si sám rozhoduje, na které cíle se chce soustředit teď a které odložit na později.

## Datový model

### Goal interface rozšíření

```typescript
export interface Goal {
  // ... existing fields ...
  focus_status?: 'active_focus' | 'deferred' | null
  focus_order?: number | null
}
```

### Význam stavů

- **`active_focus`**: Cíl je v aktivním fokusu - uživatel se na něj soustředí teď
  - Kroky z těchto cílů se zobrazují v "Dnešní fokus" sekci
  - Prioritizují se v doporučeních
  - Zobrazují se nahoře v seznamech
  
- **`deferred`**: Cíl je odložený - uživatel se na něj teď nesoustředí
  - Kroky z těchto cílů se nezobrazují v hlavním fokusu
  - Můžou se zobrazit v "Odložené" sekci
  - Nezahrnují se do doporučení
  
- **`null`**: Cíl není v fokusu - neutrální stav
  - Funguje jako dřív
  - Může být přidán do fokusu kdykoliv

### Focus order

- `focus_order` určuje pořadí priorit v rámci aktivních cílů
- Nižší číslo = vyšší priorita (1 = nejvyšší)
- Pouze pro cíle s `focus_status = 'active_focus'`
- Při změně pořadí se automaticky přepočítají

## UI/UX Design

### Focus Management View

```
┌─────────────────────────────────────────────────────────┐
│  🎯 Fokus                                                │
├─────────────────────────────────────────────────────────┤
│  [Aktivní fokus] [Odložené] [Všechny cíle]              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Aktivní fokus (3)                                   │ │
│  │                                                     │ │
│  │ 1. 🏃 Běhat 3x týdně                               │ │
│  │    [▼] [▲] [Odložit]                               │ │
│  │    Pokrok: 60% | 2 kroky dnes                      │ │
│  │                                                     │ │
│  │ 2. 📚 Přečíst 12 knih                              │ │
│  │    [▼] [▲] [Odložit]                               │ │
│  │    Pokrok: 25% | 1 krok dnes                       │ │
│  │                                                     │ │
│  │ 3. 💼 Dokončit projekt                             │ │
│  │    [▼] [▲] [Odložit]                               │ │
│  │    Pokrok: 80% | 3 kroky dnes                      │ │
│  │                                                     │ │
│  │ [+ Přidat cíl do fokusu]                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Ostatní cíle (5)                                   │ │
│  │                                                     │ │
│  │ • 🎨 Naučit se malovat                             │ │
│  │   [Přidat do fokusu]                               │ │
│  │                                                     │ │
│  │ • 🎵 Naučit se hrát na kytaru                      │ │
│  │   [Přidat do fokusu]                               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Interakce

1. **Drag & Drop**
   - Uživatel může přetáhnout cíle v rámci "Aktivní fokus" sekce
   - Pořadí se automaticky uloží
   - Vizuální feedback při drag

2. **Přidání do fokusu**
   - Z "Ostatní cíle" kliknout "Přidat do fokusu"
   - Cíl se přesune do "Aktivní fokus" s nejnižší prioritou
   - Možnost vybrat pořadí při přidání

3. **Odložení**
   - Z "Aktivní fokus" kliknout "Odložit"
   - Cíl se přesune do "Odložené" sekce
   - `focus_status` se změní na `'deferred'`

4. **Odebrání z fokusu**
   - Z "Aktivní fokus" nebo "Odložené" odebrat
   - `focus_status` se změní na `null`
   - Cíl se přesune do "Ostatní cíle"

## Funkcionalita

### Filtrování cílů

```typescript
// Získat aktivní cíle seřazené podle priority
const activeFocusGoals = goals
  .filter(g => g.focus_status === 'active_focus')
  .sort((a, b) => (a.focus_order || 999) - (b.focus_order || 999))

// Získat odložené cíle
const deferredGoals = goals.filter(g => g.focus_status === 'deferred')

// Získat cíle bez fokusu
const neutralGoals = goals.filter(g => !g.focus_status)
```

### Aktualizace pořadí

```typescript
async function updateFocusOrder(goalIds: string[]) {
  // goalIds je ordered array
  const updates = goalIds.map((goalId, index) => ({
    goalId,
    focusOrder: index + 1
  }))
  
  await fetch('/api/goals/focus/reorder', {
    method: 'PUT',
    body: JSON.stringify({ goalIds })
  })
}
```

### Přidání do fokusu

```typescript
async function addToFocus(goalId: string, position?: number) {
  // Pokud position není zadáno, přidá na konec
  const currentActiveGoals = goals.filter(g => g.focus_status === 'active_focus')
  const newOrder = position ?? currentActiveGoals.length + 1
  
  // Přepočítat pořadí ostatních cílů
  const updates = currentActiveGoals
    .filter(g => g.focus_order && g.focus_order >= newOrder)
    .map(g => ({ ...g, focus_order: g.focus_order! + 1 }))
  
  await fetch('/api/goals/focus', {
    method: 'POST',
    body: JSON.stringify({
      goalId,
      focusStatus: 'active_focus',
      focusOrder: newOrder
    })
  })
}
```

## Propagace do aplikace

### Hlavní panel (DayView)

```typescript
// Zobrazit kroky pouze z aktivních cílů v "Dnešní fokus" sekci
const todayFocusSteps = dailySteps.filter(step => {
  const goal = goals.find(g => g.id === step.goal_id)
  return goal?.focus_status === 'active_focus' && 
         !step.completed &&
         isToday(step.date)
})

// Seřadit podle focus_order cíle
const sortedFocusSteps = todayFocusSteps.sort((a, b) => {
  const goalA = goals.find(g => g.id === a.goal_id)
  const goalB = goals.find(g => g.id === b.goal_id)
  const orderA = goalA?.focus_order || 999
  const orderB = goalB?.focus_order || 999
  return orderA - orderB
})
```

### Management sekce

```typescript
// Zobrazit focus_status v tabulce
const goalRows = goals.map(goal => ({
  ...goal,
  focusBadge: goal.focus_status === 'active_focus' 
    ? '🎯 Aktivní' 
    : goal.focus_status === 'deferred' 
    ? '⏸️ Odložené' 
    : null
}))

// Filtrovat podle focus_status
const filteredGoals = goals.filter(goal => {
  if (focusFilter === 'active') return goal.focus_status === 'active_focus'
  if (focusFilter === 'deferred') return goal.focus_status === 'deferred'
  if (focusFilter === 'none') return !goal.focus_status
  return true // all
})
```

### Doporučení

```typescript
// Prioritizovat kroky z aktivních cílů
function getRecommendedSteps(dailySteps: DailyStep[], goals: Goal[]) {
  const activeFocusGoalIds = goals
    .filter(g => g.focus_status === 'active_focus')
    .map(g => g.id)
  
  const focusSteps = dailySteps.filter(s => 
    activeFocusGoalIds.includes(s.goal_id) && !s.completed
  )
  
  const otherSteps = dailySteps.filter(s => 
    !activeFocusGoalIds.includes(s.goal_id) && !s.completed
  )
  
  // Seřadit focus steps podle focus_order
  const sortedFocusSteps = focusSteps.sort((a, b) => {
    const goalA = goals.find(g => g.id === a.goal_id)
    const goalB = goals.find(g => g.id === b.goal_id)
    return (goalA?.focus_order || 999) - (goalB?.focus_order || 999)
  })
  
  return [...sortedFocusSteps, ...otherSteps]
}
```

## API Specifikace

### POST /api/goals/focus

**Request:**
```json
{
  "goalId": "goal_123",
  "focusStatus": "active_focus",
  "focusOrder": 2
}
```

**Response:**
```json
{
  "success": true,
  "goal": {
    "id": "goal_123",
    "title": "Běhat 3x týdně",
    "focus_status": "active_focus",
    "focus_order": 2,
    ...
  }
}
```

**Logika:**
1. Aktualizovat `focus_status` a `focus_order` pro daný cíl
2. Pokud `focusStatus = 'active_focus'` a `focusOrder` je zadáno:
   - Přepočítat pořadí ostatních aktivních cílů
   - Cíle s `focus_order >= focusOrder` se posunou o 1
3. Pokud `focusStatus = null` nebo `'deferred'`:
   - Nastavit `focus_order = null`
   - Přepočítat pořadí zbývajících aktivních cílů

### PUT /api/goals/focus/reorder

**Request:**
```json
{
  "goalIds": ["goal_1", "goal_2", "goal_3"]
}
```

**Response:**
```json
{
  "success": true,
  "goals": [
    { "id": "goal_1", "focus_order": 1, ... },
    { "id": "goal_2", "focus_order": 2, ... },
    { "id": "goal_3", "focus_order": 3, ... }
  ]
}
```

**Logika:**
1. Aktualizovat `focus_order` pro všechny cíle v pořadí
2. Ověřit, že všechny cíle mají `focus_status = 'active_focus'`
3. Vrátit aktualizované cíle

### GET /api/goals/focus

**Query params:**
- `focusStatus` (optional): `'active_focus' | 'deferred' | null`

**Response:**
```json
{
  "goals": [
    {
      "id": "goal_1",
      "title": "Běhat 3x týdně",
      "focus_status": "active_focus",
      "focus_order": 1,
      ...
    },
    ...
  ]
}
```

## Validace

### Pravidla

1. **Focus order**
   - Pouze pro cíle s `focus_status = 'active_focus'`
   - Musí být unikátní v rámci aktivních cílů
   - Automaticky se přepočítá při změnách

2. **Status změny**
   - Cíl může mít pouze jeden focus status
   - Při změně na `null` nebo `'deferred'` se `focus_order` nastaví na `null`

3. **Omezení**
   - Žádné hard limit na počet aktivních cílů (ale UI může doporučit max 5-7)
   - Uživatel může mít libovolné množství odložených cílů

## Testování

### Unit testy

```typescript
describe('Focus Management', () => {
  it('should add goal to active focus', async () => {
    // Test přidání cíle do fokusu
  })
  
  it('should reorder goals correctly', async () => {
    // Test změny pořadí
  })
  
  it('should remove goal from focus', async () => {
    // Test odebrání z fokusu
  })
  
  it('should filter steps by focus status', () => {
    // Test filtrování kroků
  })
})
```

### E2E testy

1. Přidat cíl do aktivního fokusu
2. Změnit pořadí priorit (drag & drop)
3. Odložit cíl
4. Ověřit, že se kroky zobrazují správně v hlavním panelu

## Migrace existujících dat

```typescript
// Všechny existující cíle budou mít focus_status = null
// Uživatelé si je mohou přidat do fokusu ručně

// Možnost automatické migrace:
// - Aktivní cíle s blížícím se deadline -> active_focus
// - Paused cíle -> deferred
// Ale to je volitelné, radši nechat uživateli kontrolu
```

