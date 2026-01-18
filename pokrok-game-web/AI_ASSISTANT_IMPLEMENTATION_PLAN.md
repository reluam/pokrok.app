# AI Asistent - Implementační Plán

## Přehled

AI asistent, který rozumí přirozenému jazyku a provádí akce v aplikaci (vytváření cílů, označování návyků, atd.).

## Doporučené řešení

### 1. AI Provider: **OpenAI GPT-4 Turbo** nebo **Anthropic Claude 3.5 Sonnet**

**Použito: Google Gemini 1.5 Pro**
- ✅ Vynikající function calling / tool use
- ✅ Dobrá podpora češtiny
- ✅ Rychlé API
- ✅ **Zdarma**: 60 requests/minutu (dostatečné pro začátek)
- ✅ Dobrá dokumentace

**Alternativa: Anthropic Claude 3.5 Sonnet**
- ✅ Vynikající kvalita odpovědí
- ✅ Bezpečnostní features
- ✅ Cena: ~$0.003 za 1K tokens (input), ~$0.015 za 1K tokens (output)
- ⚠️ Méně zkušeností s function calling (ale stále dobré)

### 2. Architektura

```
User Input (přirozený jazyk)
    ↓
API Route: /api/assistant/execute
    ↓
1. Načíst kontext uživatele (goals, habits, areas, steps)
2. Volat AI s function calling
3. AI vrátí strukturované akce
4. Provedeme akce (vytvoření goal, označení habit, atd.)
5. Vrátíme výsledek uživateli
```

### 3. Function Calling Schema

AI bude mít k dispozici tyto "tools" (funkce):

1. **complete_habits** - Označit návyky jako dokončené
2. **create_goal** - Vytvořit nový cíl
3. **create_metric** - Vytvořit metriku pro cíl
4. **create_step** - Vytvořit krok
5. **create_habit** - Vytvořit návyk
6. **create_area** - Vytvořit oblast
7. **update_goal** - Aktualizovat cíl
8. **complete_step** - Označit krok jako dokončený

### 4. Kontext pro AI

Před každým voláním načteme:
- Aktuální cíle uživatele (titles, descriptions, areas)
- Aktuální návyky (names, areas)
- Oblasti (names, colors)
- Dnešní kroky
- Dnešní datum

## Implementace

### Krok 1: Instalace závislostí

```bash
npm install openai
# nebo
npm install @anthropic-ai/sdk
```

### Krok 2: Environment Variables

```env
OPENAI_API_KEY=sk-...
# nebo
ANTHROPIC_API_KEY=sk-ant-...
```

### Krok 3: API Route

Vytvořit `/app/api/assistant/execute/route.ts` s:
- Načtením kontextu uživatele
- Voláním OpenAI/Anthropic s function calling
- Provedením akcí
- Vrácením výsledku

### Krok 4: Frontend Integration

Upravit `AssistantSearch` komponentu, aby:
- Detekovala, když uživatel zadává příkaz (ne jen vyhledávání)
- Volala `/api/assistant/execute`
- Zobrazila výsledek a provedla akce

## Příklady použití

### Příklad 1: "Odškrkni všechny dnešní návyky jako hotové"

**AI rozpozná:**
- Akce: `complete_habits`
- Parametry: `{ all: true, date: "today" }`

**Provede:**
1. Načte všechny návyky uživatele
2. Pro každý návyk zavolá `toggleHabitCompletion` pro dnešní datum
3. Vrátí: "Označil jsem X návyků jako dokončené"

### Příklad 2: "Jeden z mých cílů je koupit si nové auto do 2 let. Potřebuju na něj našetřit ještě 500 000"

**AI rozpozná:**
- Akce 1: `create_goal`
  - title: "Koupit nové auto"
  - target_date: +2 roky od dnes
  - area_id: relevantní oblast (nebo null)
- Akce 2: `create_metric`
  - goal_id: ID nově vytvořeného cíle
  - name: "Našetřeno"
  - type: "currency"
  - unit: "CZK"
  - target_value: 500000
  - current_value: 0
  - initial_value: 0

**Provede:**
1. Vytvoří cíl "Koupit nové auto"
2. Vytvoří metriku "Našetřeno" s cílem 500 000 CZK
3. Vrátí: "Vytvořil jsem cíl 'Koupit nové auto' s metrikou 'Našetřeno' (cíl: 500 000 CZK)"

## Náklady

**Google Gemini API:**
- ✅ **Zdarma**: 60 requests/minutu (3,600/hodinu, 86,400/den)
- ✅ **Dostatečné pro začátek**: I při 1000 uživatelů s 10 dotazy/den = 10,000 dotazů/den (méně než limit)
- ✅ **Po překročení**: Placené plány od $0.000125 za 1K tokens (velmi levné)

**Odhad pro 1000 uživatelů, 10 dotazů/den:**
- 10,000 dotazů/den = **ZDARMA** (pod limitem 86,400/den)
- I při 10,000 uživatelích = stále zdarma (100,000 dotazů/den < 86,400/den? Ne, ale limit je 60/min = 86,400/den)

## Bezpečnost

1. ✅ Všechny akce přes existující API routes (už mají auth)
2. ✅ Validace všech vstupů z AI
3. ✅ Rate limiting (max 10-20 dotazů/minutu na uživatele)
4. ✅ Logování všech akcí
5. ✅ Potvrzení před destruktivními akcemi (smazání, atd.)

## Implementace ✅

### Co bylo implementováno:

1. ✅ **API Route**: `/app/api/assistant/execute/route.ts`
   - Načítá kontext uživatele (goals, habits, areas, steps)
   - Volá OpenAI GPT-4 Turbo s function calling
   - Provede akce (create_goal, create_metric, complete_habits, atd.)
   - Vrátí strukturovanou odpověď

2. ✅ **Function Calling Schemas**:
   - `complete_habits` - Označit návyky jako dokončené
   - `create_goal` - Vytvořit nový cíl
   - `create_metric` - Vytvořit metriku pro cíl
   - `create_step` - Vytvořit krok
   - `create_habit` - Vytvořit návyk
   - `create_area` - Vytvořit oblast

3. ✅ **Frontend Integration**: Upravena `AssistantSearch` komponenta
   - Detekuje příkazy vs. vyhledávání
   - Zobrazuje tlačítko pro provedení příkazu
   - Zobrazuje výsledek akce
   - Dispatchuje event pro refresh dat

4. ✅ **Dependencies**: Přidán `openai` do `package.json`

## Nastavení

### 1. Instalace závislostí

```bash
cd pokrok-game-web
npm install
```

### 2. Environment Variables

Přidej do `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

Získej API klíč na: https://platform.openai.com/api-keys

### 3. Testování

1. Spusť dev server: `npm run dev`
2. Otevři aplikaci a přejdi do asistenta
3. Zkus příkazy:
   - "Odškrkni všechny dnešní návyky jako hotové"
   - "Vytvoř cíl: Koupit nové auto do 2 let"
   - "Potřebuju na auto našetřit 500 000 CZK"

## Další kroky

1. ⏳ Testovat s reálnými příklady
2. ⏳ Optimalizovat kontext (snížit tokeny) - možná použít GPT-3.5 Turbo pro levnější variantu
3. ⏳ Přidat rate limiting (max 10-20 dotazů/minutu na uživatele)
4. ⏳ Přidat caching pro často používané dotazy
5. ⏳ Přidat více function calls (update_goal, delete_goal, atd.)
6. ⏳ Přidat potvrzení před destruktivními akcemi
7. ⏳ Přidat lepší error handling a user feedback

