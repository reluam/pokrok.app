# Legacy Code Removal Plan

## Fáze 1: Bezpečné odstranění (můžeme smazat hned)

### 1. Backup soubory
- `app/[locale]/main/components/JourneyGameView.tsx.backup`
- `app/[locale]/main/components/JourneyGameView.tsx.bak`

### 2. Prázdné API adresáře
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

### 3. Prázdné komponenty adresáře
- `components/game-tabs/`

## Fáze 2: Označení komentáři (po testování odstranit)

### Nepoužívané funkce v lib/cesta-db.ts

Všechny tyto funkce jsou označeny komentáři `// LEGACY: NEPOUŽÍVÁNO - k odstranění` a mohou být po testování odstraněny.

#### Needed Steps Settings (řádky ~1056-1128)
- `getNeededStepsSettings()`
- `createNeededStepsSettings()`
- `updateNeededStepsSettings()`
- `upsertNeededStepsSettings()`

#### Event funkce (řádky ~3410-3640)
- `getEventsByUserId()`
- `createEvent()`
- `updateEvent()`
- `deleteEvent()`
- `getEventInteractionsByUserId()`
- `getEventInteractionsByDate()`
- `createEventInteraction()`
- `updateEventInteraction()`
- `deleteEventInteraction()`

#### Notes funkce (řádky ~3917-3971)
- `createNote()`
- `getNotesByUser()`
- `getNotesByGoal()`
- `getStandaloneNotes()`
- `updateNote()`
- `deleteNote()`

#### Daily Planning funkce (řádky ~4114-4170)
- `getDailyPlanning()`
- `createOrUpdateDailyPlanning()`
- `markStepAsCompleted()`

#### Streak funkce (řádky ~4173-4242)
- `getUserStreak()`
- `createOrUpdateUserStreak()`
- `updateUserStreak()`

#### Statistics funkce (řádky ~4245-4319)
- `getUserStepStatistics()`
- `createOrUpdateDailyStats()`
- `getDailyStats()`
- `getUserDailyStats()`

#### Goal funkce
- `deleteGoal()` (řádky ~2603-2682) - používá se `deleteGoalById()`
- `updateGoalPriorities()` (řádky ~2567-2602)
- `determineGoalCategoryWithSettings()` (řádky ~2683-2699)
- `updateGoalProgress()` (řádky ~2700-2718)
- `updateGoalProgressCount()` (řádky ~2720-2743)
- `updateGoalProgressAmount()` (řádky ~2745-2769)
- `updateGoalProgressSteps()` (řádky ~2770-2804)

#### Category Settings funkce (řádky ~2805-2858)
- `getCategorySettings()`
- `createCategorySettings()`
- `updateCategorySettings()`

#### Values funkce (řádky ~2859-2972)
- `getUserValues()`
- `createUserValue()`
- `updateUserValue()`
- `deleteUserValue()`
- `addExperienceToValue()`

#### Automation funkce
- `getActiveAutomations()` (řádky ~3656-3668)
- `generateAutomatedSteps()` (řádky ~3859-3915)

#### Alias
- `getAllDailySteps` (řádek ~1434) - alias pro `getDailyStepsByUserId`
- `calculateNextCustomStepDate()` (řádky ~1436-1441)

## Postup

1. ✅ Vytvořit audit report - HOTOVO
2. ⏳ Označit zbytečný kód komentáři - V PRŮBĚHU
3. ⏳ Otestovat aplikaci
4. ⏳ Odstranit označený kód
5. ⏳ Smazat prázdné adresáře a backup soubory

