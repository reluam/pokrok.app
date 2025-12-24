# Implementační plán: Workflow "Only the important"

## Přehled
Workflow, který každý den po půlnoci zobrazí speciální stránku pro plánování důležitých kroků. Uživatel musí rozdělit dnešní kroky na "Důležité" (maximálně X dle nastavení) a "Ostatní". V denním view se pak zobrazují pouze návyky a důležité kroky.

---

## 1. Databázová struktura

### 1.1 Rozšíření workflows tabulky
- Už existuje tabulka `workflows`
- Přidat do typu `only_the_important` workflow:
  - `settings` JSONB sloupec: `{ important_steps_count: number }` - počet důležitých kroků na den

### 1.2 Nová tabulka: `important_steps_planning`
```sql
CREATE TABLE important_steps_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  step_id TEXT NOT NULL, -- reference na daily_steps.id
  category TEXT NOT NULL, -- 'important' | 'other' | 'backlog'
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date, step_id)
)
```

### 1.3 Rozšíření daily_steps (pokud je potřeba)
- Možná přidat flag `is_important` nebo použít pouze `important_steps_planning` tabulku

---

## 2. API Endpointy

### 2.1 GET `/api/workflows/only-the-important/planning`
- Získat planning data pro konkrétní datum
- Vrací:
  - `important_steps`: kroky v kategorii "important"
  - `other_steps`: kroky v kategorii "other"
  - `backlog_steps`: kroky v kategorii "backlog"
  - `available_steps`: všechny kroky, které mohou být přiřazeny (dnešní, zpožděné, budoucí)
  - `settings`: nastavení workflow (important_steps_count)

### 2.2 POST `/api/workflows/only-the-important/planning`
- Uložit/c aktualizovat planning
- Body:
  - `date`: DATE
  - `steps`: Array<{ step_id, category, order_index }>
- Validace: maximální počet kroků v kategorii "important"

### 2.3 PUT `/api/workflows/only-the-important/move-step`
- Přesunout krok mezi kategoriemi
- Body:
  - `step_id`: string
  - `date`: DATE
  - `from_category`: 'important' | 'other' | 'backlog'
  - `to_category`: 'important' | 'other' | 'backlog'
  - `order_index`: number (optional)

### 2.4 DELETE `/api/workflows/only-the-important/step`
- Odstranit krok z plánování (smazat krok úplně)
- Body:
  - `step_id`: string
  - `date`: DATE (optional)

### 2.5 GET `/api/workflows/only-the-important/check`
- Zkontrolovat, zda uživatel musí dokončit plánování pro dnešní den
- Vrací: `{ needs_planning: boolean, last_planned_date: DATE | null }`

### 2.6 GET `/api/daily-steps?includeImportantFlag=true`
- Rozšířit existující endpoint o možnost filtrovat podle důležitosti
- Pokud workflow je aktivní, vrátit pouze důležité kroky pro dnešní den

---

## 3. Frontend komponenty

### 3.1 `ImportantStepsPlanningView.tsx` - Hlavní komponenta plánování
**Lokace:** `app/[locale]/game/components/workflows/ImportantStepsPlanningView.tsx`

**Funkcionalita:**
- Zobrazení plánovací stránky (nahrazuje celou navigaci i obsah)
- Tři sloupce: "Důležité kroky", "Ostatní kroky", "Backlog"
- Drag & drop mezi sloupci
- Validace maximálního počtu důležitých kroků
- Možnost přidat nový krok
- Možnost smazat krok
- Přepínání mezi dny (dnes, zítra, další dny)
- Tlačítko "Dokončit plánování" → zavře stránku a vrátí do normálního view

**Props:**
```typescript
interface ImportantStepsPlanningViewProps {
  userId: string
  date?: string // default: today
  onComplete: () => void // callback když uživatel dokončí plánování
}
```

### 3.2 `ImportantStepColumn.tsx` - Sloupec s kroky
**Funkcionalita:**
- Zobrazení kroků v dané kategorii
- Drag & drop pro přeskupování a přesouvání
- Validace (např. maximální počet v "Důležité")
- Tlačítko pro smazání kroku

**Props:**
```typescript
interface ImportantStepColumnProps {
  title: string
  steps: DailyStep[]
  category: 'important' | 'other' | 'backlog'
  maxCount?: number // pouze pro "important"
  onMoveStep: (stepId: string, fromCategory: string, toCategory: string, orderIndex: number) => void
  onDeleteStep: (stepId: string) => void
  onAddNewStep: () => void
}
```

### 3.3 `DailyViewWithImportantSteps.tsx` - Upravený denní view
**Lokace:** `app/[locale]/game/components/views/DailyViewWithImportantSteps.tsx`

**Funkcionalita:**
- Rozšíření existujícího `DayView` komponenty
- Pokud je workflow aktivní a je dnes:
  - Zobrazit pouze návyky + důležité kroky
  - Po splnění důležitých → zobrazit "Ostatní" kroky
  - Po splnění všech → zobrazit zprávu "Máte vše splněno" + tlačítko "Nastavit kroky na zítřek"
- Pokud není workflow aktivní nebo není dnes → normální zobrazení

**Integrace:**
- Zkontrolovat, zda je workflow aktivní
- Načíst důležité kroky z `important_steps_planning`
- Filtrovat `dailySteps` podle kategorie

---

## 4. Logika detekce a zobrazení plánovací stránky

### 4.1 Kontrola v `JourneyGameView.tsx` nebo `PageContent.tsx`
**Lokace:** `app/[locale]/game/components/JourneyGameView.tsx`

**Logika:**
1. Při načtení aplikace zkontrolovat:
   - Je workflow "only_the_important" aktivní?
   - Je dnes po půlnoci (nebo uživatel ještě nedokončil plánování pro dnešní den)?
   - Má uživatel dokončené plánování pro dnešní den?
2. Pokud NE → zobrazit `ImportantStepsPlanningView` místo normálního obsahu
3. Pokud ANO → zobrazit normální view s filtrem na důležité kroky

**Implementace:**
```typescript
// V JourneyGameView.tsx
const [showImportantPlanning, setShowImportantPlanning] = useState(false)
const [hasCompletedTodayPlanning, setHasCompletedTodayPlanning] = useState(false)

useEffect(() => {
  checkImportantStepsPlanning()
}, [])

const checkImportantStepsPlanning = async () => {
  // 1. Zkontrolovat, zda má uživatel aktivní workflow
  // 2. Zkontrolovat, zda má dokončené plánování pro dnešní den
  // 3. Pokud ne → zobrazit plánovací stránku
}
```

---

## 5. Nastavení workflow

### 5.1 Rozšíření `WorkflowsView.tsx`
- Přidat sekci pro "Only the important" workflow
- Nastavení: "Počet důležitých kroků na den" (number input, min: 1, max: 10)

### 5.2 API endpoint pro nastavení
- POST/PUT `/api/workflows/{workflow_id}/settings`
- Body: `{ important_steps_count: number }`

---

## 6. Lokalizace

### 6.1 Překlady pro workflow
**Lokace:** `locales/cs/common.json` a `locales/en/common.json`

```json
{
  "workflows": {
    "onlyTheImportant": {
      "name": "Pouze to důležité",
      "description": "Každý den si vyberte nejdůležitější kroky, na které se soustředíte.",
      "settings": {
        "importantStepsCount": "Počet důležitých kroků na den",
        "importantStepsCountDescription": "Kolik kroků bude zobrazeno jako důležité v denním view"
      },
      "planning": {
        "title": "Plánování důležitých kroků",
        "importantSteps": "Důležité kroky",
        "otherSteps": "Ostatní kroky",
        "backlog": "Backlog",
        "addNewStep": "Přidat nový krok",
        "maxSteps": "Maximum {count} kroků",
        "completePlanning": "Dokončit plánování",
        "switchToDate": "Přepnout na {date}",
        "today": "Dnes",
        "tomorrow": "Zítra"
      },
      "dailyView": {
        "allDone": "Máte vše splněno!",
        "planTomorrow": "Nastavit kroky na zítřek",
        "showOtherSteps": "Zobrazit ostatní kroky"
      }
    }
  }
}
```

---

## 7. Implementační kroky (pořadí)

### Fáze 1: Databázová struktura a API
1. ✅ Vytvořit tabulku `important_steps_planning`
2. ✅ Rozšířit workflows tabulku o settings JSONB
3. ✅ Implementovat API endpointy:
   - GET `/api/workflows/only-the-important/planning`
   - POST `/api/workflows/only-the-important/planning`
   - PUT `/api/workflows/only-the-important/move-step`
   - DELETE `/api/workflows/only-the-important/step`
   - GET `/api/workflows/only-the-important/check`
4. ✅ Rozšířit GET `/api/daily-steps` o filtrování důležitých kroků

### Fáze 2: Frontend komponenty
5. ✅ Vytvořit `ImportantStepsPlanningView.tsx`
6. ✅ Vytvořit `ImportantStepColumn.tsx`
7. ✅ Implementovat drag & drop funkcionalitu (použít react-dnd nebo podobnou knihovnu)
8. ✅ Vytvořit `DailyViewWithImportantSteps.tsx` nebo rozšířit existující `DayView.tsx`

### Fáze 3: Integrace a logika
9. ✅ Přidat kontrolu workflow stavu v `JourneyGameView.tsx`
10. ✅ Implementovat logiku zobrazení plánovací stránky po půlnoci
11. ✅ Integrovat filtrování důležitých kroků do denního view
12. ✅ Přidat workflow do `AVAILABLE_WORKFLOWS` v `WorkflowsView.tsx`
13. ✅ Přidat nastavení počtu důležitých kroků

### Fáze 4: Lokalizace a finální úpravy
14. ✅ Přidat všechny překlady
15. ✅ Otestovat všechny scénáře
16. ✅ Opravit případné bugy

---

## 8. Důležité poznámky

### 8.1 Časování
- Kontrola "po půlnoci" se dělá při každém načtení aplikace
- Uložit `last_planned_date` do `important_steps_planning` tabulky nebo do workflow settings
- Porovnat s dnešním datem

### 8.2 Validace
- Maximální počet důležitých kroků je vynucen na frontendu i backendu
- Uživatel může mít méně než maximum, ale ne více

### 8.3 Backlog
- Backlog obsahuje kroky, které nejsou přiřazeny ani do "Důležité" ani do "Ostatní"
- Zůstávají s původním datem (budoucí datum)

### 8.4 Ostatní kroky
- Ostatní kroky získají dnešní datum při přiřazení
- Zobrazují se až po splnění důležitých kroků

### 8.5 Přepínání mezi dny
- Uživatel může plánovat kroky i na budoucí dny
- Každý den má svůj vlastní planning state

---

## 9. Technické detaily

### 9.1 Drag & Drop
- Použít `@dnd-kit/core` nebo `react-beautiful-dnd`
- Podporovat:
  - Přesouvání mezi sloupci
  - Přeskupování v rámci sloupce
  - Validaci při dropu (např. max počet)

### 9.2 State management
- Použít React state (`useState`, `useEffect`)
- Možná přidat `useReducer` pro komplexnější state plánování

### 9.3 API calls
- Použít `fetch` API
- Error handling a loading states
- Optimistic updates pro lepší UX

---

## 10. Testovací scénáře

1. ✅ Aktivace workflow → zobrazí se plánovací stránka
2. ✅ Přidání kroků do "Důležité" (max počet)
3. ✅ Přesunutí kroků mezi sloupci
4. ✅ Smazání kroku
5. ✅ Přidání nového kroku
6. ✅ Přepnutí na zítřek a plánování
7. ✅ Dokončení plánování → návrat do normálního view
8. ✅ Zobrazení pouze důležitých kroků v denním view
9. ✅ Zobrazení "Ostatních" po splnění důležitých
10. ✅ Zpráva o dokončení všech kroků
11. ✅ Tlačítko "Nastavit kroky na zítřek" → otevře plánovací stránku

---

**Konec implementačního plánu**

