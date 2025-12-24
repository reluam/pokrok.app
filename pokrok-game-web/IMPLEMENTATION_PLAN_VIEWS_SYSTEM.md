# Implementační plán: Systém Views místo Workflows

## Přehled
Workflows se přemění na systém Views, kde uživatelé si budou moct nastavit, jak fungují jednotlivé views (denní, týdenní, měsíční, roční) a přidávat je do hlavního panelu pomocí switcherů na levém panelu.

---

## 1. Databázová struktura

### 1.1 Nová tabulka: `view_configurations`
```sql
CREATE TABLE view_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('day', 'week', 'month', 'year')),
  view_key TEXT NOT NULL, -- např. 'only_the_important', 'daily_review', atd.
  enabled BOOLEAN DEFAULT false,
  settings JSONB, -- nastavení konkrétního view
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, view_type, view_key)
)
```

### 1.2 Upravit existující tabulku `important_steps_planning`
- Zůstane stejná, ale bude aktivní pouze pokud je view "only_the_important" aktivní pro daný view_type

---

## 2. Struktura Views

### 2.1 Typy views:
- **Day View** - denní zobrazení
  - Available views: `only_the_important`, `daily_review`, atd.
- **Week View** - týdenní zobrazení
  - Available views: `weekly_planning`, atd.
- **Month View** - měsíční zobrazení
  - Available views: `monthly_review`, atd.
- **Year View** - roční zobrazení
  - Available views: `yearly_overview`, atd.

### 2.2 Definice views:
```typescript
type ViewType = 'day' | 'week' | 'month' | 'year'

interface ViewDefinition {
  key: string
  nameKey: string // translation key
  descriptionKey: string // translation key
  viewTypes: ViewType[] // ve kterých view typech je dostupný
  settingsComponent?: React.ComponentType<ViewSettingsProps>
  requiresPremium?: boolean
}

const AVAILABLE_VIEWS: Record<string, ViewDefinition> = {
  only_the_important: {
    key: 'only_the_important',
    nameKey: 'views.onlyTheImportant.name',
    descriptionKey: 'views.onlyTheImportant.description',
    viewTypes: ['day'], // pouze pro denní view
    settingsComponent: OnlyTheImportantSettings,
    requiresPremium: true
  },
  // další views...
}
```

---

## 3. UI Komponenty

### 3.1 `ViewsSettingsView.tsx` - Nastavení views
**Lokace:** `app/[locale]/game/components/settings/ViewsSettingsView.tsx`

**Funkcionalita:**
- Zobrazí seznam view typů (Day, Week, Month, Year)
- Pro každý typ zobrazí dostupné views s možností aktivace/deaktivace
- Aktivované views budou mít nastavení
- Nastavení se otevře v modalu nebo rozbalovací sekci

**Struktura:**
```
Day View
  [ ] Only the important ⚙️ (premium)
  [ ] Daily review
  
Week View
  [ ] Weekly planning
  
Month View
  [ ] Monthly review
  
Year View
  [ ] Yearly overview
```

### 3.2 `OnlyTheImportantSettings.tsx` - Nastavení pro Only the important
**Lokace:** `app/[locale]/game/components/views/settings/OnlyTheImportantSettings.tsx`

**Funkcionalita:**
- Počet důležitých kroků na den
- Tlačítko "Potvrdit" - uloží nastavení a aktivuje view
- Po potvrzení se view aplikuje v DayView

### 3.3 Úprava levého panelu (SidebarNavigation)
- Přidat sekci "Views" s switchery pro aktivované views
- Switchery budou přidávat views do hlavního panelu

---

## 4. Integrace do DayView

### 4.1 Logika aplikace "Only the important" view

**Po potvrzení nastavení:**
1. View se aktivuje pro "day" view_type
2. V DayView se zkontroluje, zda je view aktivní
3. Pokud ano:
   - Zobrazí se pouze důležité kroky (dle plánování)
   - Po splnění důležitých se zobrazí ostatní (pokud jsou)
   - Po splnění všech se zobrazí "Vše splněno" s možnostmi:
     - Přidat další kroky pro dnešek
     - Připravit zítřejší den (otevře plánovací stránku)

### 4.2 Upravený DayView
- Načítá aktivní views z `view_configurations`
- Aplikuje logiku podle aktivních views
- Pro "only_the_important" filtruje kroky podle plánování

---

## 5. API Endpointy

### 5.1 GET `/api/view-configurations`
- Získat všechny aktivní views pro uživatele
- Query params: `view_type` (optional)
- Vrací: `Array<ViewConfiguration>`

### 5.2 POST `/api/view-configurations`
- Aktivovat/deaktivovat view
- Body: `{ view_type, view_key, enabled, settings }`

### 5.3 PUT `/api/view-configurations/[id]`
- Aktualizovat nastavení view
- Body: `{ settings, enabled }`

### 5.4 GET `/api/view-configurations/available`
- Získat dostupné views pro view_type
- Query params: `view_type`
- Vrací: `Array<ViewDefinition>`

---

## 6. Migrace z Workflows

### 6.1 Migrace existujících workflows
- Převést `workflows` tabulku na `view_configurations`
- `daily_review` → view_key: 'daily_review', view_type: 'day'
- `only_the_important` → view_key: 'only_the_important', view_type: 'day'

### 6.2 Odstranění starého workflows systému
- Postupně odstranit `/api/workflows` endpointy (kromě těch, které jsou potřeba pro migraci)
- Odstranit `WorkflowsView` komponentu (nebo přeměnit na ViewsSettingsView)

---

## 7. Plánovací stránka pro "Only the important"

### 7.1 Zobrazení
- Plánovací stránka se zobrazí pouze když:
  - View je aktivní
  - Uživatel ještě nedokončil plánování pro dnešní den
- Nebo když uživatel klikne na "Připravit zítřejší den"

### 7.2 Integrace
- Otevře se jako modal nebo fullscreen overlay
- Po dokončení plánování se zavře a vrátí do DayView

---

## 8. Implementační kroky

### Fáze 1: Databázová struktura
1. ✅ Vytvořit tabulku `view_configurations`
2. ✅ Vytvořit migrační skript z workflows
3. ✅ Vytvořit API endpointy pro view configurations

### Fáze 2: Definice views
4. ✅ Vytvořit `AVAILABLE_VIEWS` konstantu
5. ✅ Vytvořit `OnlyTheImportantSettings` komponentu
6. ✅ Přidat další views (daily_review, atd.)

### Fáze 3: UI pro nastavení views
7. ✅ Vytvořit `ViewsSettingsView` komponentu
8. ✅ Přidat do SettingsView jako nový tab
9. ✅ Implementovat aktivaci/deaktivaci views
10. ✅ Implementovat nastavení views

### Fáze 4: Integrace do DayView
11. ✅ Načítat aktivní views v DayView
12. ✅ Aplikovat logiku "only_the_important" v DayView
13. ✅ Zobrazit "Vše splněno" s možnostmi
14. ✅ Integrovat plánovací stránku

### Fáze 5: Levý panel - switchery
15. ✅ Přidat sekci Views do SidebarNavigation
16. ✅ Implementovat switchery pro aktivované views
17. ✅ Přidávat views do hlavního panelu

### Fáze 6: Migrace a cleanup
18. ✅ Migrovat existující workflows
19. ✅ Otestovat všechny scénáře
20. ✅ Odstranit starý workflows systém

---

## 9. Důležité poznámky

### 9.1 Backwards compatibility
- Při migraci zachovat existující workflows jako views
- Uživatelé si je budou muset znovu aktivovat v novém systému

### 9.2 Premium features
- "Only the important" vyžaduje premium
- Kontrola premium statusu při aktivaci view

### 9.3 Plánování
- Plánování důležitých kroků zůstane stejné
- Pouze způsob aktivace se změní (místo workflow → view configuration)

---

**Konec implementačního plánu**

