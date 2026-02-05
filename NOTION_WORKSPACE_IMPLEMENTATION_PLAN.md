# Implementační plán: Notion Workspace pro Pokrok

## 📋 Přehled

Tento dokument popisuje, jak vytvořit Notion workspace, který replikuje funkcionalitu Pokrok web aplikace. Workspace bude obsahovat databáze pro Areas (oblasti), Steps (kroky), Habits (návyky) a Milestones (milníky), včetně jejich vztahů a automatizací.

---

## 🏗️ Struktura Workspace

### 1. Hlavní databáze

#### 1.1 Areas (Oblasti)
**Název databáze:** `Areas` nebo `Oblasti`

**Vlastnosti (Properties):**
- **Name** (Title) - název oblasti
- **Description** (Text) - popis oblasti
- **Color** (Select) - barva oblasti
  - Možnosti: Blue, Green, Red, Yellow, Purple, Orange, Pink, Gray
- **Icon** (Text) - název ikony (např. "heart", "briefcase", "home")
- **Order** (Number) - pořadí zobrazení
- **Created At** (Created Time) - automaticky
- **Updated At** (Last Edited Time) - automaticky

**Vztahy:**
- Relation: `Steps` (many) - kroky v této oblasti
- Relation: `Habits` (many) - návyky v této oblasti
- Relation: `Milestones` (many) - milníky v této oblasti

---

#### 1.2 Steps (Kroky)
**Název databáze:** `Steps` nebo `Kroky`

**Vlastnosti (Properties):**
- **Title** (Title) - název kroku
- **Description** (Text) - popis kroku
- **Area** (Relation) → Areas - přiřazení k oblasti (volitelné)
- **Date** (Date) - datum kroku (volitelné pro recurring steps)
- **Completed** (Checkbox) - zda je krok dokončen
- **Completed At** (Date) - datum dokončení
- **Is Important** (Checkbox) - důležitý krok
- **Is Urgent** (Checkbox) - urgentní krok
- **Deadline** (Date) - termín dokončení
- **Estimated Time** (Number) - odhadovaný čas v minutách (default: 30)
- **XP Reward** (Number) - XP odměna (default: 1)
- **Checklist** (Text) - JSON string s checklist items (nebo použít Notion's native checklist v body)
- **Require Checklist Complete** (Checkbox) - vyžadovat dokončení checklistu
- **Frequency** (Select) - frekvence opakování
  - Možnosti: `null` (none), `daily`, `weekly`, `monthly`, `custom`
- **Selected Days** (Text) - JSON array s vybranými dny (např. `["monday", "wednesday", "friday"]`)
- **Recurring Start Date** (Date) - datum začátku opakování
- **Recurring End Date** (Date) - datum konce opakování (volitelné)
- **Current Instance Date** (Date) - datum aktuální instance (pro recurring steps)
- **Is Hidden** (Checkbox) - skrytý krok (pro recurring step templates)
- **Parent Recurring Step** (Relation) → Steps - odkaz na původní recurring step (pro instances)
- **Created At** (Created Time) - automaticky
- **Updated At** (Last Edited Time) - automaticky

**Views:**
- **Upcoming** - filtrováno: `Completed = false`, seřazeno podle `Date` (ascending)
- **By Area** - skupinováno podle `Area`
- **Completed** - filtrováno: `Completed = true`
- **Recurring** - filtrováno: `Frequency != null`
- **Today** - filtrováno: `Date = today`

**Vztahy:**
- Relation: `Area` → Areas (many-to-one)
- Self-relation: `Parent Recurring Step` → Steps (pro recurring instances)

---

#### 1.3 Habits (Návyky)
**Název databáze:** `Habits` nebo `Návyky`

**Vlastnosti (Properties):**
- **Name** (Title) - název návyku
- **Description** (Text) - popis návyku
- **Area** (Relation) → Areas - přiřazení k oblasti (volitelné)
- **Frequency** (Select) - frekvence
  - Možnosti: `daily`, `weekly`, `monthly`, `custom`
- **Selected Days** (Text) - JSON array s vybranými dny (např. `["monday", "wednesday", "friday"]`)
- **Streak** (Number) - aktuální streak (default: 0)
- **Max Streak** (Number) - nejdelší streak (default: 0)
- **Category** (Text) - kategorie návyku
- **Difficulty** (Select) - obtížnost
  - Možnosti: `easy`, `medium`, `hard`
- **Reminder Time** (Text) - čas připomínky (např. "09:00")
- **Notification Enabled** (Checkbox) - zapnuté notifikace
- **Icon** (Text) - název ikony
- **Start Date** (Date) - datum začátku
- **XP Reward** (Number) - XP odměna
- **Created At** (Created Time) - automaticky
- **Updated At** (Last Edited Time) - automaticky

**Vztahy:**
- Relation: `Area` → Areas (many-to-one)

**Poznámka:** Habit completions (denní dokončení) lze řešit buď:
- **Možnost A:** Samostatná databáze `Habit Completions` s relation k Habits
- **Možnost B:** Použít Notion's native checkbox v denním template (méně flexibilní)

---

#### 1.4 Habit Completions (Dokončení návyků)
**Název databáze:** `Habit Completions` nebo `Dokončení návyků`

**Vlastnosti (Properties):**
- **Habit** (Relation) → Habits - odkaz na návyk
- **Date** (Date) - datum dokončení
- **Completed** (Checkbox) - zda bylo dokončeno
- **Created At** (Created Time) - automaticky

**Views:**
- **By Habit** - skupinováno podle `Habit`
- **This Week** - filtrováno: `Date` v tomto týdnu
- **This Month** - filtrováno: `Date` v tomto měsíci

---

#### 1.5 Milestones (Milníky)
**Název databáze:** `Milestones` nebo `Milníky`

**Vlastnosti (Properties):**
- **Title** (Title) - název milníku
- **Description** (Text) - popis milníku
- **Area** (Relation) → Areas - přiřazení k oblasti (povinné)
- **Completed Date** (Date) - datum dokončení (volitelné)
- **Progress** (Number) - pokrok (0-100, default: 0)
- **Completable** (Checkbox) - zda lze milník dokončit (nebo jen sledovat progress)
- **Created At** (Created Time) - automaticky
- **Updated At** (Last Edited Time) - automaticky

**Views:**
- **By Area** - skupinováno podle `Area`
- **Upcoming** - filtrováno: `Completed Date = null`, seřazeno podle `Completed Date` (ascending)
- **Completed** - filtrováno: `Completed Date != null`
- **Timeline** - seřazeno podle `Completed Date` (ascending)

**Vztahy:**
- Relation: `Area` → Areas (many-to-one)

---

## 🔗 Vztahy mezi databázemi

### Relační struktura:
```
Areas (1) ──< (many) Steps
Areas (1) ──< (many) Habits
Areas (1) ──< (many) Milestones
Habits (1) ──< (many) Habit Completions
Steps (1) ──< (many) Steps (Parent Recurring Step - self-relation)
```

---

## 📊 Views a Dashboardy

### 2.1 Hlavní Dashboard
**Název stránky:** `Dashboard` nebo `Přehled`

**Obsah:**
- **Upcoming Steps** - linked view z `Steps` databáze, filtrováno: `Completed = false`, `Date <= next 7 days`
- **Today's Habits** - linked view z `Habits` databáze, filtrováno: `Frequency = daily` nebo `Selected Days` obsahuje dnešní den
- **Upcoming Milestones** - linked view z `Milestones` databáze, filtrováno: `Completed Date = null`, seřazeno podle `Completed Date`
- **Areas Overview** - linked view z `Areas` databáze, seřazeno podle `Order`

---

### 2.2 Area Detail Page Template
**Název:** Template pro každou Area

**Obsah:**
- **Area Info** - vlastnosti oblasti (color, icon, description)
- **Steps in this Area** - linked view z `Steps`, filtrováno: `Area = [current area]`
- **Habits in this Area** - linked view z `Habits`, filtrováno: `Area = [current area]`
- **Milestones in this Area** - linked view z `Milestones`, filtrováno: `Area = [current area]`
- **Timeline View** - Milestones timeline s kroky

---

### 2.3 Calendar View
**Název:** `Calendar` nebo `Kalendář`

**Obsah:**
- Notion Calendar view z `Steps` databáze, zobrazeno podle `Date`
- Možnost přidat i `Habits` jako denní úkoly

---

## ⚙️ Automatizace a Workflow

### 3.1 Recurring Steps Workflow

**Problém:** Notion nemá nativní podporu pro automatické generování recurring instances.

**Řešení:**
1. **Manuální přístup:** Použít Notion template button pro vytvoření instance
2. **Externí automatizace:** Použít Notion API + cron job (Make.com, Zapier, nebo vlastní script)
3. **Hybridní přístup:** 
   - Recurring step template má `Frequency`, `Selected Days`, `Recurring Start Date`, `Recurring End Date`
   - Pravidelně (denně/týdně) vytvářet instance pomocí externího nástroje
   - Instance mají `Parent Recurring Step` relation a `Date` nastavený na konkrétní datum

**Doporučený postup:**
- Použít Make.com nebo Zapier pro automatické vytváření recurring instances
- Nebo vytvořit jednoduchý script (Python/Node.js), který běží na cron a používá Notion API

---

### 3.2 Habit Tracking Workflow

**Možnost A: Samostatná databáze Habit Completions**
- Každý den vytvořit záznam v `Habit Completions` pro každý aktivní návyk
- Automatizace může vytvářet denní záznamy pomocí Notion API

**Možnost B: Template s checkboxy**
- Vytvořit denní template stránku s checkboxy pro každý návyk
- Méně flexibilní, ale jednodušší pro manuální použití

**Doporučení:** Možnost A (samostatná databáze) je flexibilnější a umožňuje lepší analýzu.

---

### 3.3 Milestone Progress Tracking

**Automatický výpočet progress:**
- Vytvořit formula property v `Milestones`, která počítá progress na základě dokončených kroků v oblasti
- Nebo manuálně aktualizovat `Progress` property

**Formula příklad (pokud Notion podporuje):**
```
if(Completed Date != null, 100, 
   (count(Steps[Area = this].Completed = true) / count(Steps[Area = this])) * 100)
```

---

## 🎨 Design a Organizace

### 4.1 Workspace Struktura

```
📁 Pokrok Workspace
├── 📄 Dashboard (hlavní přehled)
├── 📁 Areas
│   ├── 📄 Area 1 (např. Health)
│   ├── 📄 Area 2 (např. Career)
│   └── 📄 Area 3 (např. Relationships)
├── 📊 Steps (databáze)
├── 📊 Habits (databáze)
├── 📊 Habit Completions (databáze)
├── 📊 Milestones (databáze)
├── 📄 Calendar View
└── 📄 Settings / Templates
```

---

### 4.2 Templates

**Step Template:**
- Předvyplněné vlastnosti (Estimated Time: 30, XP Reward: 1)
- Checklist sekce v body

**Habit Template:**
- Předvyplněné vlastnosti (Frequency: daily, Streak: 0)
- Denní tracking sekce

**Milestone Template:**
- Předvyplněné vlastnosti (Progress: 0, Completable: true)

---

## 🔧 Technické Detaily

### 5.1 Notion API Integrace

**Požadované scopes:**
- `read` - čtení dat
- `update` - aktualizace dat
- `insert` - vytváření nových záznamů

**Klíčové endpointy:**
- `POST /v1/pages` - vytvoření nového záznamu
- `PATCH /v1/pages/{page_id}` - aktualizace záznamu
- `POST /v1/databases/{database_id}/query` - dotazování databáze

---

### 5.2 Automatizace Script (Příklad)

**Python script pro recurring steps:**

```python
import requests
from datetime import datetime, timedelta
from notion_client import Client

notion = Client(auth="your_notion_token")
steps_db_id = "your_steps_database_id"

# Najít všechny recurring steps
recurring_steps = notion.databases.query(
    database_id=steps_db_id,
    filter={
        "property": "Frequency",
        "select": {"is_not_empty": True}
    }
).get("results", [])

# Pro každý recurring step vytvořit instance pro následující týden
for step in recurring_steps:
    frequency = step["properties"]["Frequency"]["select"]["name"]
    selected_days = step["properties"]["Selected Days"]["rich_text"][0]["plain_text"]
    
    # Logika pro vytvoření instances...
    # (podle frequency a selected_days)
```

---

## 📝 Migrační Plán

### Fáze 1: Základní struktura (1-2 hodiny)
1. ✅ Vytvořit všechny hlavní databáze (Areas, Steps, Habits, Habit Completions, Milestones)
2. ✅ Nastavit všechny properties
3. ✅ Nastavit relations mezi databázemi
4. ✅ Vytvořit základní views

### Fáze 2: Dashboard a Views (1-2 hodiny)
1. ✅ Vytvořit hlavní Dashboard
2. ✅ Vytvořit Area detail page templates
3. ✅ Nastavit Calendar view
4. ✅ Vytvořit další užitečné views (Upcoming, Completed, By Area)

### Fáze 3: Templates a Automatizace (2-3 hodiny)
1. ✅ Vytvořit templates pro Steps, Habits, Milestones
2. ✅ Nastavit automatizaci pro recurring steps (externí nástroj)
3. ✅ Nastavit automatizaci pro habit tracking
4. ✅ Otestovat workflow

### Fáze 4: Migrace dat (1-2 hodiny)
1. ✅ Exportovat data z Pokrok web app (pokud je potřeba)
2. ✅ Importovat do Notion (manuálně nebo pomocí API)
3. ✅ Ověřit správnost migrace

### Fáze 5: Optimalizace a Customizace (1-2 hodiny)
1. ✅ Upravit views podle potřeb
2. ✅ Přidat další automatizace
3. ✅ Vytvořit dokumentaci pro použití

**Celkový odhad času: 6-11 hodin**

---

## 🎯 Best Practices

### 6.1 Naming Conventions
- Používat konzistentní názvy pro properties (např. `Area` místo `Oblast` v relation)
- Používat emoji pro lepší vizuální rozlišení (např. 📊 pro databáze, 📄 pro stránky)

### 6.2 Data Integrity
- Vždy nastavit `Area` relation jako required (kde je to vhodné)
- Používat rollup properties pro počítání souvisejících záznamů
- Validovat data pomocí formulas

### 6.3 Performance
- Omezit počet properties v hlavních views
- Používat filtrování místo zobrazení všech záznamů
- Skupinovat podle Area pro lepší organizaci

---

## 📚 Další Vylepšení

### 7.1 Rozšířené Funkce
- **Gamifikace:** Přidat XP tracking a leveling system
- **Analytics:** Vytvořit analytics dashboard s grafy (pomocí Notion charts nebo externích nástrojů)
- **Templates:** Vytvořit více specializovaných templates (např. pro weekly review)
- **Integrace:** Propojit s dalšími nástroji (Google Calendar, Todoist, atd.)

### 7.2 Customizace
- Přizpůsobit barvy a ikony podle preferencí
- Vytvořit vlastní views pro specifické use cases
- Přidat custom properties podle potřeb

---

## ✅ Checklist Implementace

### Základní Setup
- [ ] Vytvořit Notion workspace
- [ ] Vytvořit databázi Areas
- [ ] Vytvořit databázi Steps
- [ ] Vytvořit databázi Habits
- [ ] Vytvořit databázi Habit Completions
- [ ] Vytvořit databázi Milestones
- [ ] Nastavit všechny relations

### Views a Dashboardy
- [ ] Vytvořit hlavní Dashboard
- [ ] Vytvořit Area detail page templates
- [ ] Nastavit Calendar view
- [ ] Vytvořit Upcoming view
- [ ] Vytvořit Completed view
- [ ] Vytvořit By Area views

### Templates
- [ ] Vytvořit Step template
- [ ] Vytvořit Habit template
- [ ] Vytvořit Milestone template

### Automatizace
- [ ] Nastavit automatizaci pro recurring steps
- [ ] Nastavit automatizaci pro habit tracking
- [ ] Otestovat automatizace

### Migrace a Testování
- [ ] Migrovat existující data (pokud je potřeba)
- [ ] Otestovat všechny workflows
- [ ] Vytvořit dokumentaci

---

## 🔗 Užitečné Zdroje

- [Notion API Documentation](https://developers.notion.com/)
- [Notion Formulas Documentation](https://www.notion.so/help/formulas)
- [Make.com Notion Integration](https://www.make.com/en/integrations/notion)
- [Zapier Notion Integration](https://zapier.com/apps/notion/integrations)

---

## 📝 Poznámky

- Notion nemá nativní podporu pro komplexní recurring tasks, proto je potřeba externí automatizace
- Habit completions lze řešit různými způsoby - vyberte ten, který nejlépe vyhovuje vašim potřebám
- Notion formulas mají omezení - některé výpočty může být potřeba řešit externě
- Pro větší projekty zvažte použití Notion API pro pokročilejší automatizace

---

**Vytvořeno:** 2026-01-30  
**Verze:** 1.0  
**Autor:** AI Assistant
