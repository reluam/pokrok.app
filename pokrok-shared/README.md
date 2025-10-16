# @pokrok/shared

Sdílené typy a API klienty pro aplikace Pokrok.

## Instalace

```bash
npm install @pokrok/shared
```

## Použití

### API Klient

```typescript
import { CestaApiClient } from '@pokrok/shared'

const apiClient = new CestaApiClient('https://your-api-url.com', 'your-auth-token')

// Získání cílů
const goals = await apiClient.getGoals()

// Vytvoření nového cíle
const newGoal = await apiClient.createGoal({
  title: 'Naučit se React Native',
  description: 'Vytvořit mobilní aplikaci',
  targetDate: '2024-12-31',
  priority: 'meaningful'
})
```

### Typy

```typescript
import { Goal, Value, DailyStep, CreateGoalRequest } from '@pokrok/shared'

const goal: Goal = {
  id: '123',
  user_id: 'user-123',
  title: 'Naučit se React Native',
  // ... další vlastnosti
}
```

### Utility funkce

```typescript
import { formatDate, getGoalProgressColor, validateGoalData } from '@pokrok/shared'

const formattedDate = formatDate(new Date())
const progressColor = getGoalProgressColor(75)
const errors = validateGoalData(goalData)
```

## API Reference

### CestaApiClient

Hlavní třída pro komunikaci s API.

#### Metody

- `getGoals()` - Získání všech cílů
- `createGoal(data)` - Vytvoření nového cíle
- `updateGoal(id, data)` - Aktualizace cíle
- `deleteGoal(id)` - Smazání cíle
- `getValues()` - Získání hodnot
- `createValue(data)` - Vytvoření hodnoty
- `getDailySteps()` - Získání denních kroků
- `createDailyStep(data)` - Vytvoření kroku
- `toggleDailyStep(id)` - Přepnutí stavu kroku

### Typy

- `Goal` - Cíl
- `Value` - Hodnota
- `DailyStep` - Denní krok
- `Event` - Událost
- `User` - Uživatel
- `CreateGoalRequest` - Požadavek na vytvoření cíle
- `UpdateGoalRequest` - Požadavek na aktualizaci cíle

### Utility funkce

- `formatDate(date)` - Formátování data
- `getGoalProgressColor(progress)` - Barva podle pokroku
- `validateGoalData(data)` - Validace dat cíle
- `getIconEmoji(iconName)` - Emoji pro ikonu

## Vývoj

```bash
# Instalace závislostí
npm install

# Build
npm run build

# Development mode
npm run dev
```
