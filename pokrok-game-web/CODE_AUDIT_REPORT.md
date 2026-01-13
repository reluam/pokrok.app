# Code Audit Report - Nepoužívané soubory a kód

## Datum auditu: 2025-01-13

## 1. SOUBORY K ODSTRAŇENÍ

### 1.1 Backup soubory
Tyto soubory jsou zálohy a nejsou potřeba:
- `app/[locale]/main/components/JourneyGameView.tsx.backup`
- `app/[locale]/main/components/JourneyGameView.tsx.bak`

### 1.2 Prázdné API adresáře (bez route.ts)
Tyto adresáře jsou prázdné a neobsahují žádný kód:
- `app/api/add-habit-columns/`
- `app/api/add-priority-order-column/`
- `app/api/add-selected-days-column/`
- `app/api/add-step-columns/`
- `app/api/add-xp-column/`
- `app/api/check-table/`
- `app/api/debug-calendar/`
- `app/api/debug-goals-structure/`
- `app/api/debug-habits/`
- `app/api/debug-users/`
- `app/api/fix-frequency-constraint/`
- `app/api/fix-goals-sorting/`
- `app/api/fix-goals-status-constraint/`
- `app/api/fix-habit-completions/`
- `app/api/init-db/`
- `app/api/setup-db/`
- `app/api/aspirations/balance/`
- `app/api/auth/sign-out/`
- `app/api/areas/initialize-default/`
- `app/api/cesta/goal-milestones/`
- `app/api/goals/priorities/`

### 1.3 Prázdné komponenty adresáře
- `components/game-tabs/` - prázdný adresář

## 2. NEPOUŽÍVANÉ FUNKCE V LIB/CESTA-DB.TS

### ✅ OVĚŘENO - NEPOUŽÍVANÉ (mohou být odstraněny):

#### Needed Steps Settings (0 použití):
- `getNeededStepsSettings()` - NEPOUŽÍVÁNO
- `createNeededStepsSettings()` - NEPOUŽÍVÁNO
- `updateNeededStepsSettings()` - NEPOUŽÍVÁNO
- `upsertNeededStepsSettings()` - NEPOUŽÍVÁNO

#### Event funkce (0 použití):
- `getEventsByUserId()` - NEPOUŽÍVÁNO
- `createEvent()` - NEPOUŽÍVÁNO
- `updateEvent()` - NEPOUŽÍVÁNO
- `deleteEvent()` - NEPOUŽÍVÁNO
- `getEventInteractionsByUserId()` - NEPOUŽÍVÁNO
- `createEventInteraction()` - NEPOUŽÍVÁNO
- `updateEventInteraction()` - NEPOUŽÍVÁNO
- `deleteEventInteraction()` - NEPOUŽÍVÁNO

#### Notes funkce (0 použití):
- `getNotesByUser()` - NEPOUŽÍVÁNO
- `getNotesByGoal()` - NEPOUŽÍVÁNO
- `getStandaloneNotes()` - NEPOUŽÍVÁNO
- `createNote()` - NEPOUŽÍVÁNO
- `updateNote()` - NEPOUŽÍVÁNO
- `deleteNote()` - NEPOUŽÍVÁNO

#### Daily Planning funkce (0 použití):
- `getDailyPlanning()` - NEPOUŽÍVÁNO
- `createOrUpdateDailyPlanning()` - NEPOUŽÍVÁNO
- `markStepAsCompleted()` - NEPOUŽÍVÁNO

#### Streak funkce (0 použití):
- `getUserStreak()` - NEPOUŽÍVÁNO
- `createOrUpdateUserStreak()` - NEPOUŽÍVÁNO
- `updateUserStreak()` - NEPOUŽÍVÁNO

#### Statistics funkce (0 použití):
- `getUserStepStatistics()` - NEPOUŽÍVÁNO
- `createOrUpdateDailyStats()` - NEPOUŽÍVÁNO
- `getDailyStats()` - NEPOUŽÍVÁNO
- `getUserDailyStats()` - NEPOUŽÍVÁNO

#### Goal funkce (0 použití):
- `deleteGoal()` - NEPOUŽÍVÁNO (používá se `deleteGoalById()`)
- `updateGoalPriorities()` - NEPOUŽÍVÁNO
- `determineGoalCategoryWithSettings()` - NEPOUŽÍVÁNO
- `updateGoalProgressCount()` - NEPOUŽÍVÁNO
- `updateGoalProgressAmount()` - NEPOUŽÍVÁNO
- `updateGoalProgressSteps()` - NEPOUŽÍVÁNO

#### Category Settings funkce (0 použití):
- `getCategorySettings()` - NEPOUŽÍVÁNO
- `createCategorySettings()` - NEPOUŽÍVÁNO
- `updateCategorySettings()` - NEPOUŽÍVÁNO

#### Values funkce (0 použití):
- `getUserValues()` - NEPOUŽÍVÁNO
- `createUserValue()` - NEPOUŽÍVÁNO
- `updateUserValue()` - NEPOUŽÍVÁNO
- `deleteUserValue()` - NEPOUŽÍVÁNO
- `addExperienceToValue()` - NEPOUŽÍVÁNO

#### Automation funkce (částečně nepoužívané):
- `getActiveAutomations()` - NEPOUŽÍVÁNO (používá se jen v `generateAutomatedSteps()`)
- `generateAutomatedSteps()` - NEPOUŽÍVÁNO (legacy kód, nepoužívá se)

#### Goal Progress funkce (částečně nepoužívané):
- `updateGoalProgress()` - NEPOUŽÍVÁNO (používá se `updateGoalProgressCombined()`)
- `updateGoalProgressCount()` - NEPOUŽÍVÁNO
- `updateGoalProgressAmount()` - NEPOUŽÍVÁNO
- `updateGoalProgressSteps()` - NEPOUŽÍVÁNO

#### Alias (nepoužívané):
- `getAllDailySteps` - alias pro `getDailyStepsByUserId`, NEPOUŽÍVÁNO
- `calculateNextCustomStepDate()` - NEPOUŽÍVÁNO

### ⚠️ POUŽÍVÁ SE JEN V ADMIN/SETUP (možná přesunout do samostatného souboru):
- `getAllUsers()` - použito jen v admin migračních skriptech
- `isUserAdmin()` - použito v admin/setup routes (16x)
- `getInspirationValues()` - použito jen v admin migračních skriptech

## 3. NEJVĚTŠÍ SOUBORY K ANALÝZE

Tyto soubory mají >2000 řádků a potřebují detailní analýzu:
1. `lib/cesta-db.ts` - 4800 řádků
2. `app/[locale]/planner/components/JourneyGameView.tsx` - 4297 řádků
3. `app/[locale]/main/components/JourneyGameView.tsx` - 4119 řádků
4. `app/[locale]/planner/components/views/StepsManagementView.tsx` - 4075 řádků
5. `app/[locale]/planner/components/pages/PageContent.tsx` - 3097 řádků
6. `app/[locale]/main/components/pages/PageContent.tsx` - 2830 řádků
7. `app/[locale]/planner/components/views/GoalDetailPage.tsx` - 2667 řádků
8. `app/[locale]/main/components/views/GoalDetailPage.tsx` - 2228 řádků

## 4. SHRNUTÍ - CO MŮŽEME ODSTRAŇOVAT

### ✅ JISTÉ ODSTRAŇOVÁNÍ (bezpečné):
1. **Backup soubory** (2 soubory)
2. **Prázdné API adresáře** (21 adresářů)
3. **Prázdný komponenty adresář** (1 adresář)
4. **Nepoužívané funkce v cesta-db.ts** (~50+ funkcí)

### ⚠️ POTŘEBUJE OVĚŘENÍ:
- Největší soubory (>2000 řádků) - potřebují detailní analýzu pro nepoužívané části

## 5. DALŠÍ KROKY

1. ✅ Ověřit použití všech funkcí v cesta-db.ts - HOTOVO
2. ⏳ Projít největší soubory a najít nepoužívané části - V PRŮBĚHU
3. ✅ Označit zbytečný kód komentáři - HOTOVO
4. ⏳ Po testování odstranit

## 6. ODHADENÝ POČET ŘÁDKŮ K ODSTRAŇOVÁNÍ

- Backup soubory: ~18,000 řádků (2 soubory)
- Prázdné API adresáře: 0 řádků (prázdné)
- Nepoužívané funkce v cesta-db.ts: ~2000-3000 řádků (odhad)
- **CELKEM: ~20,000-21,000 řádků k odstranění**

