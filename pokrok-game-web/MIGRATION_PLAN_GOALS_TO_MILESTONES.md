# Plán migrace: Cíle → Milníky

## Přehled změny

**Stará struktura:**
- Oblast → Cíl → Krok

**Nová struktura:**
- Oblast → Kroky (přímo)
- Oblast → Milníky (přímo)
- Milníky a kroky mezi sebou nemají vazbu

## Fáze implementace

### Fáze 1: Databázové změny

#### 1.1 Vytvoření tabulky milestones
```sql
CREATE TABLE IF NOT EXISTS milestones (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id VARCHAR(255) NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed_date DATE, -- target_date z původního cíle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

#### 1.2 Migrace dat z goals do milestones
- Pro každý cíl vytvořit milník:
  - `title` → `title`
  - `description` → `description`
  - `target_date` → `completed_date`
  - `area_id` → `area_id` (zachovat)
  - `user_id` → `user_id` (zachovat)

#### 1.3 Úprava tabulky daily_steps
- Odstranit sloupec `goal_id` (nebo nastavit na NULL)
- Ujistit se, že všechny kroky mají `area_id` (pokud nemají, použít area_id z cíle)
- Přidat index na `area_id` pro rychlejší dotazy

#### 1.4 Odstranění tabulky goals
- Po úspěšné migraci smazat tabulku `goals`
- Smazat související tabulky: `goal_metrics`, `goal_progress_history` (pokud existují)

### Fáze 2: API změny

#### 2.1 Nové API endpointy pro milníky
- `GET /api/milestones` - seznam milníků pro oblast
- `POST /api/milestones` - vytvoření milníku
- `PUT /api/milestones/[id]` - aktualizace milníku
- `DELETE /api/milestones/[id]` - smazání milníku

#### 2.2 Úprava API endpointů pro kroky
- `GET /api/daily-steps` - odstranit filtrování podle goal_id
- `POST /api/daily-steps` - odstranit goal_id z requestu, vyžadovat area_id
- `PUT /api/daily-steps/[id]` - odstranit možnost změny goal_id
- Všechny dotazy filtrovat podle `area_id` místo `goal_id`

#### 2.3 Odstranění API endpointů pro cíle
- Smazat `/api/goals/*` endpointy
- Smazat `/api/cesta/goals-with-steps` endpoint

### Fáze 3: Frontend změny - Komponenty

#### 3.1 Vytvoření nových komponent
- `MilestoneCard.tsx` - zobrazení jednoho milníku jako karty/tabulky
- `MilestonesList.tsx` - seznam milníků v oblasti
- `MilestoneForm.tsx` - formulář pro vytvoření/editaci milníku

#### 3.2 Úprava existujících komponent pro kroky
- `StepForm.tsx` / `StepModal.tsx` - odstranit výběr cíle, vyžadovat oblast
- `StepsList.tsx` - filtrovat podle `area_id` místo `goal_id`
- `UpcomingView.tsx` - upravit logiku filtrování kroků (pouze podle oblasti)

#### 3.3 Úprava zobrazení oblasti
- `AreaDetailView.tsx` nebo podobná komponenta:
  - Zobrazit milníky nahoře (jako karty/tabulky)
  - Pod nimi zobrazit kroky
  - Milníky a kroky jsou nezávislé

### Fáze 4: Frontend změny - Stránky a navigace

#### 4.1 Odstranění stránek a komponent souvisejících s cíli
- Smazat `GoalDetailPage.tsx`
- Smazat `GoalsManagementView.tsx` (nebo upravit, pokud se používá jinde)
- Odstranit všechny routy `/goals/*`
- Odstranit navigační položky pro cíle

#### 4.2 Úprava navigace
- V navigaci zůstanou pouze "Oblasti"
- Po kliknutí na oblast se zobrazí:
  - Milníky (nahoře)
  - Kroky (dole)

### Fáze 5: TypeScript typy a interfaces

#### 5.1 Nové typy
```typescript
interface Milestone {
  id: string
  user_id: string
  area_id: string
  title: string
  description?: string
  completed_date?: Date | string
  created_at: Date | string
  updated_at: Date | string
}
```

#### 5.2 Úprava existujících typů
- `DailyStep` - odstranit `goal_id`, `area_id` je povinné
- Odstranit `Goal` interface ze všech souborů
- Aktualizovat všechny komponenty používající `Goal` typ

### Fáze 6: Migrační skript

#### 6.1 Vytvoření migračního API endpointu
- `POST /api/admin/migrate-goals-to-milestones`
- Skript provede:
  1. Načte všechny cíle
  2. Pro každý cíl vytvoří milník
  3. Pro všechny kroky s `goal_id`:
     - Najde `area_id` z cíle
     - Nastaví `area_id` na krok
     - Nastaví `goal_id` na NULL
  4. Ověří úspěšnost migrace
  5. (Volitelně) Smaže tabulku goals

### Fáze 7: Čištění kódu

#### 7.1 Odstranění nepoužívaného kódu
- Smazat všechny importy `Goal` typu
- Smazat všechny funkce pracující s cíli
- Smazat všechny komentáře odkazující na cíle
- Aktualizovat dokumentaci

#### 7.2 Aktualizace překladů
- Odstranit překlady související s cíli
- Přidat překlady pro milníky

## Pořadí implementace (doporučené)

1. **Fáze 1** - Databázové změny (vytvoření tabulky milestones)
2. **Fáze 6** - Migrační skript (převod existujících dat)
3. **Fáze 2** - API změny (nové endpointy pro milníky, úprava kroků)
4. **Fáze 5** - TypeScript typy
5. **Fáze 3** - Frontend komponenty (milníky, úprava kroků)
6. **Fáze 4** - Frontend stránky a navigace
7. **Fáze 7** - Čištění kódu

## Rizika a pozornosti

1. **Ztráta dat**: Před migrací vytvořit backup databáze
2. **Závislosti**: Zkontrolovat všechny místa, kde se používají cíle
3. **Mobile apps**: iOS/macOS aplikace mohou potřebovat aktualizaci API
4. **Postupné nasazení**: Zvážit feature flag pro postupné vypnutí cílů

## Testování

1. Test migračního skriptu na kopii produkční databáze
2. Test vytváření/editace milníků
3. Test vytváření/editace kroků (bez cíle)
4. Test zobrazení oblasti s milníky a kroky
5. Test všech API endpointů
6. E2E testy kritických workflows

## Otázky k ověření

1. Co s cíli, které nemají `area_id`? (Přeskočit nebo přiřadit k výchozí oblasti?)
2. Co s cíli, které mají `status = 'completed'`? (Použít `completed_date` jako `completed_date` v milníku?)
3. Co s `goal_metrics`? (Smazat nebo převést někam?)
4. Co s historií progressu cílů? (Smazat?)
5. Jak zobrazit milníky v oblasti? (Karty, tabulka, timeline?)
