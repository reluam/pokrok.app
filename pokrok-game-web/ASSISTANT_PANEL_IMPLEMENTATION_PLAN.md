# Implementační plán: Asistent/Rádce Panel

## Přehled
Vytvoření pravého panelu (Assistant Panel) jako kontextového pomocníka, který bude dostupný na všech stránkách aplikace. Panel bude schovatelný, responzivní a postupně rozšiřitelný o AI funkcionalitu.

---

## 1. Architektura a struktura

### 1.1 Komponentní struktura
```
app/[locale]/planner/components/
├── assistant/
│   ├── AssistantPanel.tsx          # Hlavní wrapper komponenta
│   ├── AssistantPanelHeader.tsx    # Header s tlačítkem pro minimalizaci
│   ├── AssistantSearch.tsx         # Vyhledávací sekce
│   ├── AssistantTips.tsx           # Sekce s tipy a radami
│   ├── AssistantSearchResults.tsx  # Zobrazení výsledků vyhledávání
│   └── hooks/
│       ├── useAssistantContext.ts  # Hook pro detekci aktuální stránky/kontextu
│       └── useAssistantTips.ts     # Hook pro generování tipů
```

### 1.2 API endpointy
```
app/api/assistant/
├── search/
│   └── route.ts                    # GET: Vyhledávání kroků, cílů, oblastí, návyků
└── tips/
    └── route.ts                    # GET: Generování kontextových tipů
```

### 1.3 Styling a responsivita
- Desktop (>1024px): Panel viditelný vedle hlavního obsahu
- Tablet (768px-1024px): Panel se může minimalizovat
- Mobile (<768px): Panel minimalizován na ikonu, otevření jako overlay

---

## 2. Fáze 1: Základní struktura a vyhledávání (MVP)

### 2.1 Komponenta AssistantPanel.tsx
**Účel**: Hlavní wrapper komponenta pravého panelu

**Funkcionalita**:
- Správa stavu minimalizace/rozbalení panelu
- Správa stavu zapnutí/vypnutí panelu (z nastavení)
- Responzivní chování (automatická minimalizace na malých obrazovkách)
- Ukládání preferencí uživatele (localStorage): `assistantPanelMinimized`, `assistantPanelEnabled`
- Animace při otevírání/zavírání
- Načítání stavu zapnutí/vypnutí z user settings API

**Props**:
```typescript
interface AssistantPanelProps {
  currentPage: string          // Aktuální stránka pro kontext
  mainPanelSection?: string    // Aktuální sekce (např. goal-{id})
  userId: string
  onOpenStepModal: (step?: any) => void
  onNavigateToGoal: (goalId: string) => void
  onNavigateToArea: (areaId: string) => void
  onNavigateToHabits: (habitId?: string) => void
}
```

**Stav**:
- `isEnabled: boolean` - panel zapnutý/vypnutý (z nastavení)
- `isMinimized: boolean` - stav minimalizace
- `searchQuery: string` - aktuální vyhledávací dotaz
- `searchResults: SearchResult[]` - výsledky vyhledávání
- `isSearching: boolean` - indikátor načítání
- `searchFilters: SearchFilters` - pokročilé filtry pro vyhledávání

**Layout struktura**:
```
{isEnabled && (
  <AssistantPanel>
    <AssistantPanelHeader />
    {!isMinimized && (
      <>
        <AssistantSearch />
        <AssistantTips />
      </>
    )}
  </AssistantPanel>
)}
```

**Nastavení zapnutí/vypnutí**:
- Ukládá se do user settings (`user_settings` tabulka, klíč `assistant_enabled`)
- Možnost zapnout/vypnout v SettingsPage.tsx
- Při vypnutí se panel zcela skryje z UI

### 2.2 API endpoint: `/api/assistant/search`

**Endpoint**: `GET /api/assistant/search?q={query}&userId={userId}&filters={json}`

**Query parametry**:
- `q`: vyhledávací dotaz (string)
- `userId`: ID uživatele (string)
- `filters`: JSON string s filtry (volitelné)
  ```typescript
  {
    types?: ('step' | 'goal' | 'area' | 'habit')[]  // Filtrovat podle typu
    completed?: boolean                              // Pro kroky: pouze dokončené/nedokončené
    status?: string[]                                // Pro cíle: filtrovat podle statusu
    dateFrom?: string                                // Pro kroky: od data
    dateTo?: string                                  // Pro kroky: do data
    areaId?: string                                  // Filtrovat podle oblasti
    goalId?: string                                  // Filtrovat podle cíle
  }
  ```

**Funkcionalita**:
- Vyhledávání ve všech entitách: steps, goals, areas, habits
- Full-text vyhledávání v názvech a popisech
- Podpora pokročilých filtrů
- Vrací sjednocené výsledky s typem entity

**Response struktura**:
```typescript
interface SearchResult {
  id: string
  type: 'step' | 'goal' | 'area' | 'habit'
  title: string
  description?: string
  metadata?: {
    // Pro steps: date, completed, goal_id
    // Pro goals: status, target_date, area_id
    // Pro areas: color, icon, goals_count
    // Pro habits: frequency, category
  }
}
```

**SQL dotaz (příklad)**:
```sql
-- Steps
SELECT id, 'step' as type, title, description, date, completed, goal_id
FROM daily_steps
WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
LIMIT 10

-- Goals
SELECT id, 'goal' as type, title, description, status, target_date, area_id
FROM goals
WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
LIMIT 10

-- Areas
SELECT id, 'area' as type, name as title, description, color, icon
FROM areas
WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
LIMIT 10

-- Habits
SELECT id, 'habit' as type, name as title, description, frequency, category
FROM habits
WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
LIMIT 10
```

### 2.3 Komponenta AssistantSearch.tsx
**Účel**: Vyhledávací pole s výsledky

**Funkcionalita**:
- Input pole pro vyhledávání
- Debouncing (500ms) pro optimalizaci
- Zobrazení výsledků pod vyhledávacím polem
- Loading stav během vyhledávání
- Prázdný stav (žádné výsledky)
- Tlačítko pro rozbalení pokročilých filtrů
- Pokročilé filtry:
  - Výběr typů entit (steps, goals, areas, habits)
  - Pro kroky: checkbox "Pouze nedokončené"
  - Pro kroky: výběr rozsahu datumů
  - Pro cíle: výběr podle statusu
  - Filtrování podle oblasti/cíle

**Akce při kliknutí na výsledek**:
- **Step**: Otevře `StepModal` s editací kroku
- **Goal**: Naviguje na detail cíle (`setMainPanelSection('goal-{id}')`)
- **Area**: Naviguje na view oblasti (`setMainPanelSection('area-{id}')`)
- **Habit**: Naviguje na stránku návyků s otevřeným návykem (`setCurrentPage('habits')` + otevření detailu)

### 2.4 Integrace do JourneyGameView.tsx

**Úpravy layoutu**:
```typescript
// Aktuální struktura:
<div className="bg-primary-50 h-screen w-full flex flex-col">
  <HeaderNavigation />
  <div className="flex flex-1 overflow-hidden">
    <SidebarNavigation />
    <PageContent />
  </div>
</div>

// Nová struktura:
<div className="bg-primary-50 h-screen w-full flex flex-col">
  <HeaderNavigation />
  <div className="flex flex-1 overflow-hidden">
    <SidebarNavigation />
    <PageContent />
    <AssistantPanel />  // Nový panel
  </div>
</div>
```

**CSS/Responsivita**:
```css
/* Desktop */
@media (min-width: 1024px) {
  .assistant-panel {
    width: 320px;
    min-width: 320px;
  }
}

/* Tablet */
@media (max-width: 1023px) {
  .assistant-panel {
    width: 280px;
    min-width: 280px;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .assistant-panel.minimized {
    width: 48px;
  }
  .assistant-panel.expanded {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80vw;
    max-width: 400px;
    z-index: 50;
  }
}
```

---

## 3. Fáze 2: Tipy a rady

### 3.1 Hook useAssistantContext.ts
**Účel**: Detekce aktuálního kontextu stránky

**Detekovaný kontext**:
- Aktuální stránka (`currentPage`: 'main', 'goals', 'habits', 'steps')
- Aktuální sekce (`mainPanelSection`: 'goal-{id}', 'area-{id}', atd.)
- Statistiky uživatele (počet dokončených kroků, návyků, cílů)
- Datum a čas

**Výstup**: `AssistantContext` objekt
```typescript
interface AssistantContext {
  page: string
  section?: string
  entityType?: 'goal' | 'area' | 'habit' | 'step'
  entityId?: string
  userStats: {
    completedSteps: number
    completedHabits: number
    activeGoals: number
    totalAreas: number
  }
}
```

### 3.2 API endpoint: `/api/assistant/tips`

**Endpoint**: `GET /api/assistant/tips?context={json}&userId={userId}`

**Funkcionalita**:
- Generování tipů na základě kontextu
- Analýza používání aplikace uživatelem
- Statistiky pro personalizaci tipů

**Tipy podle kontextu**:

**Hlavní stránka (main)**:
- Pokud málo dokončených kroků: "Zkuste dokončit alespoň jeden krok dnes!"
- Pokud nemá oblasti: "Vytvořte si oblasti pro lepší organizaci cílů"
- Pokud málo aktivních cílů: "Zkuste vytvořit svůj první cíl"

**Stránka kroků (steps)**:
- Pokud málo kroků: "Přidejte si kroky pro dosažení vašich cílů"
- Pokud hodně nedokončených: "Zkuste dokončit alespoň 3 kroky dnes"
- Tipy na organizaci kroků

**Stránka cílů (goals)**:
- Pokud nemá cíle: "Začněte s vytvořením svého prvního cíle"
- Pokud hodně aktivních cílů: "Zkuste se zaměřit na 1-3 nejdůležitější cíle"
- Tipy na SMART cíle

**Stránka návyků (habits)**:
- Pokud nemá návyky: "Vytvořte si svůj první návyk"
- Pokud málo dokončených návyků: "Pravidelnost je klíčová - zkuste dokončit alespoň jeden návyk denně"

**Detail cíle (goal-{id})**:
- Tipy specifické pro daný cíl
- Navržení kroků
- Tipy na dosažení cíle

**Detail oblasti (area-{id})**:
- Tipy na organizaci v rámci oblasti
- Navržení cílů pro oblast

**Response struktura**:
```typescript
interface Tip {
  id: string
  title: string
  description: string
  category: 'motivation' | 'organization' | 'productivity' | 'feature'
  priority: number  // 1-5, vyšší = důležitější
}
```

### 3.3 Komponenta AssistantTips.tsx
**Účel**: Zobrazení kontextových tipů

**Funkcionalita**:
- Načítání tipů na základě kontextu
- Automatické obnovení při změně stránky
- Zobrazení max 3-5 nejdůležitějších tipů
- Možnost označit tip jako "přečtený" (ukládání do localStorage)
  - Klíč: `assistantReadTips` (array tip IDs)
  - Přečtené tipy se automaticky skryjí
- Ikony pro různé kategorie tipů
- Možnost zobrazit znovu přečtené tipy (tlačítko v sekci)

**Design**:
- Boxíky s ikonami
- Barevné rozlišení podle kategorie
- Možnost skrýt tip (křížek)
- Indikátor nových nepřečtených tipů

---

## 4. Integrace s existujícím kódem

### 4.1 JourneyGameView.tsx
**Úpravy**:
1. Přidat `<AssistantPanel />` do layoutu
2. Předat potřebné props: `currentPage`, `mainPanelSection`, `userId`
3. Předat handler funkce pro navigaci a otevírání modalů

**Props pro AssistantPanel**:
```typescript
<AssistantPanel
  currentPage={currentPage}
  mainPanelSection={mainPanelSection}
  userId={userId || player?.user_id}
  onOpenStepModal={handleOpenStepModal}
  onNavigateToGoal={(goalId) => setMainPanelSection(`goal-${goalId}`)}
  onNavigateToArea={(areaId) => setMainPanelSection(`area-${areaId}`)}
  onNavigateToHabits={(habitId) => {
    setCurrentPage('habits')
    // Otevřít detail návyku
  }}
/>
```

### 4.2 Překlady
**Nové klíče v `locales/cs/common.json` a `locales/en/common.json`**:
```json
{
  "assistant": {
    "title": "Asistent",
    "search": {
      "placeholder": "Hledat kroky, cíle, oblasti, návyky...",
      "noResults": "Žádné výsledky",
      "loading": "Vyhledávání...",
      "steps": "Kroky",
      "goals": "Cíle",
      "areas": "Oblasti",
      "habits": "Návyky"
    },
    "tips": {
      "title": "Tipy a rady",
      "motivation": "Motivace",
      "organization": "Organizace",
      "productivity": "Produktivita",
      "feature": "Funkce",
      "markAsRead": "Označit jako přečtené"
    },
    "minimize": "Minimalizovat",
    "expand": "Rozbalit"
  }
}
```

---

## 5. Design a styling

### 5.1 Design koncept
- **Styl**: Boxík podobný levému sidebaru, ale více kompaktní
- **Barvy**: Primární barvy aplikace (primary-500, primary-50)
- **Ikony**: Lucide React (stejně jako zbytek aplikace)
- **Animace**: Plynulé přechody při otevírání/zavírání

### 5.2 Minimalizovaný stav
- Úzký sloupec (~48px)
- Ikona asistenta (Sparkles/HelpCircle)
- Šipka pro rozbalení
- Tooltip na hover

### 5.3 Rozbalený stav
- Šířka: 320px (desktop), 280px (tablet)
- Header s názvem "Asistent" a tlačítkem minimalizace
- Scrollovatelný obsah
- Sekce: Vyhledávání (nahoře), Tipy (dole)

### 5.4 Responsivní chování
- **>1024px**: Panel vedle obsahu, viditelný
- **768px-1024px**: Panel se může minimalizovat, ale není automaticky minimalizován
- **<768px**: Panel automaticky minimalizován, rozbalení jako overlay

---

## 6. Database a optimalizace

### 6.1 Indexy pro vyhledávání
Pro optimalizaci vyhledávání přidat indexy:
```sql
-- Steps
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_title ON daily_steps(user_id, title);
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_description ON daily_steps(user_id, description);

-- Goals
CREATE INDEX IF NOT EXISTS idx_goals_user_title ON goals(user_id, title);
CREATE INDEX IF NOT EXISTS idx_goals_user_description ON goals(user_id, description);

-- Areas
CREATE INDEX IF NOT EXISTS idx_areas_user_name ON areas(user_id, name);

-- Habits
CREATE INDEX IF NOT EXISTS idx_habits_user_name ON habits(user_id, name);
```

### 6.2 Optimalizace vyhledávání
- Debouncing na frontendu (500ms)
- Limit výsledků (10 na entitu)
- Full-text search pouze při dotazu delším než 2 znaky

---

## 7. Postupná implementace (Roadmap)

### Fáze 1: MVP (tento plán)
✅ Základní struktura panelu
✅ Vyhledávání kroků, cílů, oblastí, návyků
✅ Základní tipy a rady
✅ Responzivní design

### Fáze 2: Rozšíření tipů (později)
- Personalizované tipy na základě historie
- Doporučení na základě chování uživatele
- Učení z úspěchů uživatele

### Fáze 3: AI integrace (budoucnost)
- AI asistent pro vytváření úkolů z textu
- AI doporučení pro cíle a oblasti
- Konverzace s AI asistentem
- Automatické generování kroků z popisu cíle

---

## 8. Technické detaily

### 8.1 State management
- Lokální state v `AssistantPanel` komponentě
- localStorage pro uložení preferencí (minimalizace, přečtené tipy)
- Context API není nutný (jednoduchá komponenta)

### 8.2 Performance
- Lazy loading tipů (načítání pouze při otevření sekce)
- Debouncing vyhledávání
- Memoizace výsledků vyhledávání
- Virtualizace výsledků (pokud bude hodně výsledků)

### 8.3 Accessibility
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels pro screen readery
- Focus management při otevírání/zavírání
- Tooltips pro ikony

### 8.4 Testování
- Unit testy pro vyhledávání
- Testy API endpointů
- E2E testy pro hlavní flow (vyhledávání, otevření výsledku)

---

## 9. Schválení a otázky

### Rozhodnutí ze schvalovacího procesu:
1. **Šířka panelu**: 320px je vhodná (možnost později zvětšit)
2. **Pozice**: 
   - Možnost minimalizovat panel
   - Možnost úplně vypnout panel (zapnutí z nastavení)
   - Nastavení pro zapnutí/vypnutí asistenta
3. **Tipy**: Přečtené tipy ukládat do localStorage
4. **Vyhledávání**: ANO - podporovat pokročilé filtry (např. pouze nedokončené kroky, podle data, atd.)
5. **AI integrace**: Řešit až později (po Fázi 2)

### Schválení implementace:
- [x] Schváleno design a layout
- [x] Schválena funkcionalita Fáze 1
- [x] Schváleny API endpointy
- [x] Schválena responzivní strategie

---

## 10. Časový odhad

- **Fáze 1 (MVP)**: 8-12 hodin
  - Komponentní struktura: 2-3h
  - API endpointy: 2h
  - Vyhledávání: 2-3h
  - Tipy: 2-3h
  - Integrace a styling: 2-3h
  - Testování: 1h

---

**Autor**: AI Assistant  
**Datum**: 2024  
**Verze**: 1.0

