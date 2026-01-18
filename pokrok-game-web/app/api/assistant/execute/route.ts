import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getGoalsByUserId, getHabitsByUserId, getDailyStepsByUserId, createGoal, createDailyStep, createGoalMetric, createArea, createHabit, toggleHabitCompletion, updateDailyStepFields } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface AssistantContext {
  goals: any[]
  habits: any[]
  areas: any[]
  todaySteps: any[]
  today: string
}

/**
 * Načte kontext uživatele pro AI asistenta
 */
async function getUserContext(userId: string): Promise<AssistantContext> {
  const today = new Date().toISOString().split('T')[0]
  
  // Načíst cíle, návyky, oblasti a dnešní kroky
  const [goals, habits, areas, todaySteps] = await Promise.all([
    getGoalsByUserId(userId),
    getHabitsByUserId(userId),
    sql`
      SELECT id, name, description, color, icon
      FROM areas
      WHERE user_id = ${userId}
      ORDER BY name ASC
    `,
    getDailyStepsByUserId(userId, undefined, today, today)
  ])

  return {
    goals: goals.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      area_id: g.area_id,
      target_date: g.target_date
    })),
    habits: habits.map(h => ({
      id: h.id,
      name: h.name,
      description: h.description,
      area_id: h.area_id
    })),
    areas: areas.map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      color: a.color,
      icon: a.icon
    })),
    todaySteps: todaySteps.map(s => ({
      id: s.id,
      title: s.title,
      completed: s.completed
    })),
    today
  }
}

/**
 * Najde cíle nebo oblasti v promptu pomocí fuzzy matching (lokálně, bez AI)
 */
function findMatchingGoalsAndAreas(
  query: string,
  goals: any[],
  areas: any[]
): { goalId?: string; areaId?: string } {
  const queryLower = query.toLowerCase().trim()
  const result: { goalId?: string; areaId?: string } = {}
  
  // Rozdělit query na slova pro lepší matching
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
  
  // Najít cíle - hledáme přesné shody nebo podobné názvy
  let bestGoalMatch: { goal: any; score: number } | null = null
  for (const goal of goals) {
    const goalTitle = (goal.title || '').toLowerCase().trim()
    if (!goalTitle) continue
    
    // Přesná shoda
    if (queryLower.includes(goalTitle) || goalTitle.includes(queryLower)) {
      bestGoalMatch = { goal, score: 100 }
      break
    }
    
    // Částečná shoda - počet společných slov
    const goalWords = goalTitle.split(/\s+/)
    const commonWords = queryWords.filter(qw => goalWords.some((gw: string) => gw.includes(qw) || qw.includes(gw)))
    if (commonWords.length > 0) {
      const score = (commonWords.length / Math.max(queryWords.length, goalWords.length)) * 50
      if (!bestGoalMatch || score > bestGoalMatch.score) {
        bestGoalMatch = { goal, score }
      }
    }
  }
  
  if (bestGoalMatch && bestGoalMatch.score >= 30) {
    result.goalId = bestGoalMatch.goal.id
  }
  
  // Najít oblasti - hledáme přesné shody nebo podobné názvy
  let bestAreaMatch: { area: any; score: number } | null = null
  for (const area of areas) {
    const areaName = (area.name || '').toLowerCase().trim()
    if (!areaName) continue
    
    // Přesná shoda
    if (queryLower.includes(areaName) || areaName.includes(queryLower)) {
      bestAreaMatch = { area, score: 100 }
      break
    }
    
    // Částečná shoda - počet společných slov
    const areaWords = areaName.split(/\s+/)
    const commonWords = queryWords.filter(qw => areaWords.some((aw: string) => aw.includes(qw) || qw.includes(aw)))
    if (commonWords.length > 0) {
      const score = (commonWords.length / Math.max(queryWords.length, areaWords.length)) * 50
      if (!bestAreaMatch || score > bestAreaMatch.score) {
        bestAreaMatch = { area, score }
      }
    }
  }
  
  if (bestAreaMatch && bestAreaMatch.score >= 30) {
    result.areaId = bestAreaMatch.area.id
  }
  
  return result
}

/**
 * Načte všechna data uživatele pro AI asistenta (včetně metrik)
 */
async function getUserDataForAI(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  // Načíst všechna data
  const [goals, habits, areas, steps, metrics] = await Promise.all([
    getGoalsByUserId(userId),
    getHabitsByUserId(userId),
    sql`
      SELECT id, name, description, color, icon
      FROM areas
      WHERE user_id = ${userId}
      ORDER BY name ASC
    `,
    getDailyStepsByUserId(userId, undefined, today, today),
    sql`
      SELECT id, goal_id, name, description, type, unit, target_value, current_value, initial_value, incremental_value
      FROM goal_metrics
      WHERE user_id = ${userId}
      ORDER BY created_at ASC
    `
  ])

  return {
    goals: goals.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      target_date: g.target_date ? new Date(g.target_date).toISOString().split('T')[0] : null,
      status: g.status,
      priority: g.priority,
      category: g.category,
      area_id: g.area_id,
      icon: g.icon
    })),
    habits: habits.map(h => ({
      id: h.id,
      name: h.name,
      description: h.description,
      frequency: h.frequency,
      selected_days: h.selected_days,
      area_id: h.area_id,
      icon: h.icon
    })),
    areas: areas.map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      color: a.color,
      icon: a.icon
    })),
    steps: steps.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : null,
      completed: s.completed,
      goal_id: s.goal_id,
      area_id: s.area_id,
      is_important: s.is_important,
      is_urgent: s.is_urgent
    })),
    metrics: metrics.map((m: any) => ({
      id: m.id,
      goal_id: m.goal_id,
      name: m.name,
      description: m.description,
      type: m.type,
      unit: m.unit,
      target_value: m.target_value,
      current_value: m.current_value,
      initial_value: m.initial_value,
      incremental_value: m.incremental_value
    })),
    today
  }
}

/**
 * Function calling schemas pro OpenAI
 */
const functionDefinitions = [
  {
    name: 'complete_habits',
    description: 'Označit návyky jako dokončené pro určitý datum. Může označit všechny návyky nebo konkrétní návyky podle názvu.',
    parameters: {
      type: 'object',
      properties: {
        habitIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'ID návyků k označení. Pokud prázdné, označí všechny návyky.'
        },
        date: {
          type: 'string',
          format: 'date',
          description: 'Datum ve formátu YYYY-MM-DD. Pokud není zadáno, použije se dnešní datum.'
        }
      },
      required: []
    }
  },
  {
    name: 'create_goal',
    description: 'Vytvořit nový cíl. Použij, když uživatel chce vytvořit nový cíl nebo když mluví o cíli, který ještě neexistuje.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Název cíle'
        },
        description: {
          type: 'string',
          description: 'Popis cíle (volitelné)'
        },
        targetDate: {
          type: 'string',
          format: 'date',
          description: 'Cílové datum ve formátu YYYY-MM-DD (volitelné)'
        },
        areaId: {
          type: 'string',
          description: 'ID oblasti, do které cíl patří. Pokud není zadáno, použij nejrelevantnější oblast nebo null.'
        },
        icon: {
          type: 'string',
          description: 'Ikona pro cíl (volitelné, default: Target)'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'create_metric',
    description: 'Vytvořit metriku pro cíl. Použij, když uživatel mluví o měření pokroku (např. "našetřit 500 000", "zhubnout 10 kg").',
    parameters: {
      type: 'object',
      properties: {
        goalId: {
          type: 'string',
          description: 'ID cíle, ke kterému metrika patří'
        },
        name: {
          type: 'string',
          description: 'Název metriky (např. "Našetřeno", "Váha", "Ujeté kilometry")'
        },
        type: {
          type: 'string',
          enum: ['number', 'currency', 'percentage', 'distance', 'time', 'weight', 'custom'],
          description: 'Typ metriky'
        },
        unit: {
          type: 'string',
          description: 'Jednotka (např. "CZK", "kg", "km", "hod")'
        },
        targetValue: {
          type: 'number',
          description: 'Cílová hodnota'
        },
        currentValue: {
          type: 'number',
          description: 'Aktuální hodnota (default: 0)'
        },
        initialValue: {
          type: 'number',
          description: 'Počáteční hodnota (default: 0)'
        }
      },
      required: ['goalId', 'name', 'type', 'unit', 'targetValue']
    }
  },
  {
    name: 'create_step',
    description: 'Vytvořit krok (úkol). Použij, když uživatel chce vytvořit konkrétní úkol nebo krok.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Název kroku'
        },
        description: {
          type: 'string',
          description: 'Popis kroku (volitelné)'
        },
        date: {
          type: 'string',
          format: 'date',
          description: 'Datum kroku ve formátu YYYY-MM-DD (default: dnešní datum)'
        },
        goalId: {
          type: 'string',
          description: 'ID cíle, ke kterému krok patří (volitelné)'
        },
        areaId: {
          type: 'string',
          description: 'ID oblasti, do které krok patří (volitelné)'
        },
        isImportant: {
          type: 'boolean',
          description: 'Je krok důležitý? (default: false)'
        },
        isUrgent: {
          type: 'boolean',
          description: 'Je krok urgentní? (default: false)'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'create_habit',
    description: 'Vytvořit nový návyk. Použij, když uživatel chce vytvořit nový návyk.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Název návyku'
        },
        description: {
          type: 'string',
          description: 'Popis návyku (volitelné)'
        },
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Frekvence návyku (default: daily)'
        },
        areaId: {
          type: 'string',
          description: 'ID oblasti, do které návyk patří (volitelné)'
        },
        icon: {
          type: 'string',
          description: 'Ikona pro návyk (volitelné)'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'create_area',
    description: 'Vytvořit novou oblast. Použij, když uživatel chce vytvořit novou oblast života.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Název oblasti'
        },
        description: {
          type: 'string',
          description: 'Popis oblasti (volitelné)'
        },
        color: {
          type: 'string',
          description: 'Barva oblasti (volitelné, hex kód)'
        },
        icon: {
          type: 'string',
          description: 'Ikona pro oblast (volitelné)'
        }
      },
      required: ['name']
    }
  }
]

/**
 * Zkontroluje, zda je návyk naplánován pro daný den
 */
function isHabitScheduledForDay(habit: any, date: Date): boolean {
  // Daily frequency - vždy naplánováno
  if (habit.frequency === 'daily') {
    return true
  }
  
  // Always show flag - vždy zobrazit
  if (habit.always_show) {
    return true
  }
  
  // Weekly / custom frequency - kontrola selected_days
  if (habit.frequency === 'weekly' || habit.frequency === 'custom') {
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    const enDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const csDays = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota']
    const dayName = enDays[dayOfWeek]
    const dayNameCs = csDays[dayOfWeek]
    
    let selectedDays: any = habit.selected_days
    if (typeof selectedDays === 'string') {
      try {
        selectedDays = JSON.parse(selectedDays)
      } catch {
        selectedDays = selectedDays.split(',').map((s: string) => s.trim().toLowerCase())
      }
    }
    
    if (Array.isArray(selectedDays)) {
      const normalized = selectedDays.map((d: any) => String(d).toLowerCase())
      if (normalized.includes(dayName.toLowerCase()) || normalized.includes(dayNameCs.toLowerCase())) {
        return true
      }
    }
  }
  
  // Specific dates
  const dateStr = date.toISOString().split('T')[0]
  const specificDates = habit.selected_dates || habit.dates
  if (specificDates) {
    const list = Array.isArray(specificDates) ? specificDates : []
    if (list.includes(dateStr)) {
      return true
    }
  }
  
  return false
}

/**
 * Interpretuje instrukce a připraví preview změn
 */
async function interpretInstructions(
  instructions: any[],
  userId: string,
  context: AssistantContext,
  userData: any
): Promise<{ items: any[]; summary: string }> {
  const previewItems: any[] = []
  
  for (const instruction of instructions) {
    const { type, operation, filter, data, date } = instruction
    
    if (operation === 'complete' && type === 'habit') {
      const completionDate = date ? new Date(date) : new Date(context.today)
      completionDate.setHours(0, 0, 0, 0)
      
      // Najít návyky podle filtru
      let allHabits: any[] = []
      let scheduledHabits: any[] = []
      
      if (filter?.type === 'all') {
        allHabits = userData.habits || []
        // Filtrovat pouze naplánované návyky
        scheduledHabits = allHabits.filter((h: any) => isHabitScheduledForDay(h, completionDate))
      } else if (filter?.type === 'ids') {
        allHabits = (userData.habits || []).filter((h: any) => filter.values.includes(h.id))
        scheduledHabits = allHabits.filter((h: any) => isHabitScheduledForDay(h, completionDate))
      } else if (filter?.type === 'names') {
        allHabits = (userData.habits || []).filter((h: any) => filter.values.includes(h.name))
        scheduledHabits = allHabits.filter((h: any) => isHabitScheduledForDay(h, completionDate))
      }
      
      // Pokud jsou naplánované návyky, zobrazíme obě možnosti
      if (scheduledHabits.length > 0 && allHabits.length > scheduledHabits.length) {
        previewItems.push({
          type: 'habit',
          operation: 'complete',
          date: date || context.today,
          allItems: allHabits.map((h: any) => ({ id: h.id, name: h.name })),
          scheduledItems: scheduledHabits.map((h: any) => ({ id: h.id, name: h.name })),
          allCount: allHabits.length,
          scheduledCount: scheduledHabits.length,
          requiresChoice: true
        })
      } else {
        // Pokud jsou všechny návyky naplánované nebo žádné nejsou naplánované, zobrazíme jen jednu možnost
        previewItems.push({
          type: 'habit',
          operation: 'complete',
          date: date || context.today,
          items: allHabits.map((h: any) => ({ id: h.id, name: h.name })),
          count: allHabits.length,
          requiresChoice: false
        })
      }
    } else if (operation === 'create') {
      if (type === 'goal') {
        // Validace: title je povinný
        if (!data || !data.title || (typeof data.title === 'string' && data.title.trim() === '')) {
          previewItems.push({
            type: 'goal',
            operation: 'create',
            error: 'Chybí název cíle',
            data: {
              title: data?.title || '(chybí název)',
              description: data?.description,
              targetDate: data?.targetDate
            }
          })
        } else {
          previewItems.push({
            type: 'goal',
            operation: 'create',
            data: {
              title: data.title,
              description: data.description,
              targetDate: data.targetDate
            }
          })
        }
      } else if (type === 'step') {
        // Validace: title je povinný
        if (!data || !data.title || (typeof data.title === 'string' && data.title.trim() === '')) {
          previewItems.push({
            type: 'step',
            operation: 'create',
            error: 'Chybí název kroku',
            data: {
              title: data?.title || '(chybí název)',
              description: data?.description,
              date: data?.date || context.today
            }
          })
        } else {
          previewItems.push({
            type: 'step',
            operation: 'create',
            data: {
              title: data.title,
              description: data.description,
              date: data.date || context.today
            }
          })
        }
      } else if (type === 'habit') {
        previewItems.push({
          type: 'habit',
          operation: 'create',
          data: {
            name: data.name,
            description: data.description,
            frequency: data.frequency || 'daily'
          }
        })
      } else if (type === 'area') {
        previewItems.push({
          type: 'area',
          operation: 'create',
          data: {
            name: data.name,
            description: data.description
          }
        })
      } else if (type === 'metric') {
        previewItems.push({
          type: 'metric',
          operation: 'create',
          data: {
            name: data.name,
            type: data.type,
            unit: data.unit,
            targetValue: data.targetValue
          }
        })
      }
    } else if (operation === 'update') {
      // Zpracování update operací
      if (type === 'step') {
        // Najít krok podle filtru
        let step: any = null
        if (filter?.type === 'ids' && filter.values.length > 0) {
          step = (userData.steps || []).find((s: any) => filter.values.includes(s.id))
        } else if (filter?.type === 'names' && filter.values.length > 0) {
          step = (userData.steps || []).find((s: any) => filter.values.includes(s.title))
        }
        
        if (step) {
          previewItems.push({
            type: 'step',
            operation: 'update',
            stepId: step.id,
            stepTitle: step.title,
            currentData: {
              goal_id: step.goal_id,
              area_id: step.area_id,
              title: step.title,
              description: step.description,
              date: step.date
            },
            newData: {
              goalId: data?.goalId || step.goal_id,
              areaId: data?.areaId || step.area_id,
              title: data?.title || step.title,
              description: data?.description !== undefined ? data.description : step.description,
              date: data?.date || step.date
            }
          })
        }
      } else if (type === 'goal') {
        // Najít cíl podle filtru
        let goal: any = null
        if (filter?.type === 'ids' && filter.values.length > 0) {
          goal = (userData.goals || []).find((g: any) => filter.values.includes(g.id))
        } else if (filter?.type === 'names' && filter.values.length > 0) {
          goal = (userData.goals || []).find((g: any) => filter.values.includes(g.title))
        }
        
        if (goal) {
          previewItems.push({
            type: 'goal',
            operation: 'update',
            goalId: goal.id,
            goalTitle: goal.title,
            currentData: {
              title: goal.title,
              description: goal.description,
              target_date: goal.target_date,
              status: goal.status
            },
            newData: {
              title: data?.title || goal.title,
              description: data?.description !== undefined ? data.description : goal.description,
              targetDate: data?.targetDate || goal.target_date,
              status: data?.status || goal.status
            }
          })
        }
      } else if (type === 'habit') {
        // Najít návyk podle filtru
        let habit: any = null
        if (filter?.type === 'ids' && filter.values.length > 0) {
          habit = (userData.habits || []).find((h: any) => filter.values.includes(h.id))
        } else if (filter?.type === 'names' && filter.values.length > 0) {
          habit = (userData.habits || []).find((h: any) => filter.values.includes(h.name))
        }
        
        if (habit) {
          previewItems.push({
            type: 'habit',
            operation: 'update',
            habitId: habit.id,
            habitName: habit.name,
            currentData: {
              name: habit.name,
              description: habit.description,
              frequency: habit.frequency,
              area_id: habit.area_id
            },
            newData: {
              name: data?.name || habit.name,
              description: data?.description !== undefined ? data.description : habit.description,
              frequency: data?.frequency || habit.frequency,
              areaId: data?.areaId || habit.area_id
            }
          })
        }
      }
    }
  }
  
  // Vytvořit souhrn
  const summaries: string[] = []
  for (const item of previewItems) {
    if (item.type === 'habit' && item.operation === 'complete') {
      if (item.requiresChoice) {
        summaries.push(`Označím návyky jako dokončené (${item.scheduledCount} naplánovaných z ${item.allCount} celkem)`)
      } else {
        summaries.push(`Označím ${item.count} návyk${item.count === 1 ? '' : item.count < 5 ? 'y' : 'ů'} jako dokončené`)
      }
    } else if (item.operation === 'create') {
      if (item.type === 'goal') {
        summaries.push(`Vytvořím cíl: "${item.data.title}"`)
      } else if (item.type === 'step') {
        summaries.push(`Vytvořím krok: "${item.data.title}"`)
      } else if (item.type === 'habit') {
        summaries.push(`Vytvořím návyk: "${item.data.name}"`)
      } else if (item.type === 'area') {
        summaries.push(`Vytvořím oblast: "${item.data.name}"`)
      } else if (item.type === 'metric') {
        summaries.push(`Vytvořím metriku: "${item.data.name}"`)
      }
    } else if (item.operation === 'update') {
      if (item.type === 'step') {
        const changes: string[] = []
        if (item.newData.goalId !== item.currentData.goal_id) {
          const goal = (userData.goals || []).find((g: any) => g.id === item.newData.goalId)
          changes.push(`přiřadím k cíli "${goal?.title || item.newData.goalId}"`)
        }
        if (item.newData.areaId !== item.currentData.area_id) {
          const area = (userData.areas || []).find((a: any) => a.id === item.newData.areaId)
          changes.push(`přiřadím k oblasti "${area?.name || item.newData.areaId}"`)
        }
        if (item.newData.title !== item.currentData.title) {
          changes.push(`změním název na "${item.newData.title}"`)
        }
        if (item.newData.date !== item.currentData.date) {
          changes.push(`změním datum na "${item.newData.date}"`)
        }
        if (changes.length > 0) {
          summaries.push(`Upravím krok "${item.stepTitle}": ${changes.join(', ')}`)
        } else {
          summaries.push(`Upravím krok "${item.stepTitle}"`)
        }
      } else if (item.type === 'goal') {
        summaries.push(`Upravím cíl "${item.goalTitle}"`)
      } else if (item.type === 'habit') {
        summaries.push(`Upravím návyk "${item.habitName}"`)
      }
    }
  }
  
  return {
    items: previewItems,
    summary: summaries.join(', ')
  }
}

/**
 * Provede instrukce po potvrzení uživatelem
 */
/**
 * Normalizuje data z AI modelu - převádí české názvy polí na anglické
 */
function normalizeAIData(data: any): any {
  if (!data || typeof data !== 'object') return data
  
  const normalized: any = { ...data }
  
  // Mapování českých názvů na anglické
  if (data['Cíl ID'] !== undefined) {
    normalized.goalId = data['Cíl ID']
    delete normalized['Cíl ID']
  }
  if (data['Oblast ID'] !== undefined) {
    normalized.areaId = data['Oblast ID']
    delete normalized['Oblast ID']
  }
  if (data['Název'] !== undefined) {
    normalized.title = data['Název']
    delete normalized['Název']
  }
  if (data['Popis'] !== undefined) {
    normalized.description = data['Popis']
    delete normalized['Popis']
  }
  if (data['Datum'] !== undefined) {
    normalized.date = data['Datum']
    delete normalized['Datum']
  }
  
  return normalized
}

async function executeInstructions(
  instructions: any[],
  userId: string,
  context: AssistantContext,
  userData: any,
  userChoices?: { [key: number]: 'all' | 'scheduled' } // Výběr uživatele pro každou instrukci
): Promise<NextResponse> {
  const results: any[] = []
  
  for (let i = 0; i < instructions.length; i++) {
    let instruction = instructions[i]
    // Normalizovat data z AI modelu
    if (instruction.data) {
      instruction = {
        ...instruction,
        data: normalizeAIData(instruction.data)
      }
    }
    const { type, operation, filter, data, date } = instruction
    
    // Validace instrukce
    if (!type || !operation) {
      results.push({
        type: type || 'unknown',
        operation: operation || 'unknown',
        success: false,
        message: 'Chyba: Neplatná instrukce - chybí type nebo operation.',
        error: 'Invalid instruction format'
      })
      continue
    }
    
    try {
      if (operation === 'complete' && type === 'habit') {
        const completionDate = date ? new Date(date) : new Date(context.today)
        completionDate.setHours(0, 0, 0, 0)
        
        // Najít návyky podle filtru
        let allHabits: any[] = []
        
        if (filter?.type === 'all') {
          allHabits = userData.habits || []
        } else if (filter?.type === 'ids') {
          allHabits = (userData.habits || []).filter((h: any) => filter.values.includes(h.id))
        } else if (filter?.type === 'names') {
          allHabits = (userData.habits || []).filter((h: any) => filter.values.includes(h.name))
        }
        
        // Zkontrolovat, zda uživatel zvolil "scheduled" nebo "all"
        let habitsToComplete: any[] = []
        if (userChoices && userChoices[i] === 'scheduled') {
          // Pouze naplánované návyky
          habitsToComplete = allHabits.filter((h: any) => isHabitScheduledForDay(h, completionDate))
        } else {
          // Všechny návyky (default nebo explicitní volba "all")
          habitsToComplete = allHabits
        }
        
        // Označit návyky jako dokončené
        const completionDateStr = date || context.today
        const completed = []
        
        for (const habit of habitsToComplete) {
          try {
            await toggleHabitCompletion(userId, habit.id, completionDateStr)
            completed.push({ id: habit.id, name: habit.name })
          } catch (error) {
            console.error(`Error completing habit ${habit.id}:`, error)
          }
        }
        
        results.push({
          type: 'habit',
          operation: 'complete',
          success: true,
          message: `Označil jsem ${completed.length} návyk${completed.length === 1 ? '' : completed.length < 5 ? 'y' : 'ů'} jako dokončené.`,
          data: { completed }
        })
      } else if (operation === 'create') {
        if (type === 'goal') {
          const goal = await createGoal({
            user_id: userId,
            title: data.title,
            description: data.description || null,
            target_date: data.targetDate ? new Date(data.targetDate) : undefined,
            area_id: data.areaId || null,
            icon: data.icon || 'Target',
            status: 'active',
            priority: 'meaningful',
            category: 'medium-term',
            goal_type: 'outcome',
            progress_percentage: 0
          })
          
          results.push({
            type: 'goal',
            operation: 'create',
            success: true,
            message: `Vytvořil jsem cíl "${goal.title}".`,
            data: { goal }
          })
          
          // Pokud je v instrukci metrika bez goalId nebo s null, vytvoř ji pro tento cíl
          const metricInstruction = instructions.find(i => i.type === 'metric' && (!i.data?.goalId || i.data?.goalId === null))
          if (metricInstruction) {
            const metric = await createGoalMetric({
              user_id: userId,
              goal_id: goal.id,
              name: metricInstruction.data.name,
              description: undefined,
              type: metricInstruction.data.type,
              unit: metricInstruction.data.unit,
              target_value: metricInstruction.data.targetValue,
              current_value: metricInstruction.data.currentValue || 0,
              incremental_value: 1,
              initial_value: metricInstruction.data.initialValue || 0
            })
            
            results.push({
              type: 'metric',
              operation: 'create',
              success: true,
              message: `Vytvořil jsem metriku "${metric.name}".`,
              data: { metric }
            })
          }
        } else if (type === 'step') {
          // Validace: title je povinný
          if (!data.title || data.title.trim() === '') {
            results.push({
              type: 'step',
              operation: 'create',
              success: false,
              message: 'Chyba: Název kroku je povinný.',
              error: 'Missing title'
            })
            continue
          }
          
          const step = await createDailyStep({
            user_id: userId,
            title: data.title.trim(),
            description: data.description || null,
            date: data.date || context.today,
            goal_id: data.goalId || null,
            area_id: data.areaId || null,
            is_important: data.isImportant || false,
            is_urgent: data.isUrgent || false,
            completed: false
          })
          
          results.push({
            type: 'step',
            operation: 'create',
            success: true,
            message: `Vytvořil jsem krok "${step.title}".`,
            data: { step }
          })
        } else if (type === 'habit') {
          const habit = await createHabit({
            user_id: userId,
            name: data.name,
            description: data.description || data.name,
            frequency: data.frequency || 'daily',
            area_id: data.areaId || null,
            icon: data.icon || null,
            streak: 0,
            max_streak: 0,
            category: 'osobní',
            difficulty: 'medium',
            is_custom: true,
            reminder_time: null,
            notification_enabled: false,
            selected_days: null,
            xp_reward: 1,
            start_date: context.today,
            habit_completions: {}
          })
          
          if (habit) {
            results.push({
              type: 'habit',
              operation: 'create',
              success: true,
              message: `Vytvořil jsem návyk "${habit.name}".`,
              data: { habit }
            })
          }
        } else if (type === 'area') {
          const area = await createArea(
            userId,
            data.name,
            data.description,
            data.color || '#3B82F6',
            data.icon
          )
          
          results.push({
            type: 'area',
            operation: 'create',
            success: true,
            message: `Vytvořil jsem oblast "${area.name}".`,
            data: { area }
          })
        }
      } else if (operation === 'update') {
        if (type === 'step') {
          // Najít krok podle filtru
          let step: any = null
          if (filter?.type === 'ids' && filter.values.length > 0) {
            step = (userData.steps || []).find((s: any) => filter.values.includes(s.id))
          } else if (filter?.type === 'names' && filter.values.length > 0) {
            step = (userData.steps || []).find((s: any) => filter.values.includes(s.title))
          }
          
          if (!step) {
            results.push({
              type: 'step',
              operation: 'update',
              success: false,
              message: 'Chyba: Krok nebyl nalezen.',
              error: 'Step not found'
            })
            continue
          }
          
          // Připravit aktualizace
          const updates: any = {}
          if (data?.goalId !== undefined) {
            updates.goal_id = data.goalId || null
          }
          if (data?.areaId !== undefined) {
            updates.area_id = data.areaId || null
          }
          if (data?.title !== undefined) {
            updates.title = data.title
          }
          if (data?.description !== undefined) {
            updates.description = data.description
          }
          if (data?.date !== undefined) {
            updates.date = data.date
          }
          
          // Aktualizovat krok
          const updatedStep = await updateDailyStepFields(step.id, updates)
          
          if (updatedStep) {
            const changes: string[] = []
            if (data?.goalId !== undefined && data.goalId !== step.goal_id) {
              const goal = (userData.goals || []).find((g: any) => g.id === data.goalId)
              changes.push(`přiřadil k cíli "${goal?.title || data.goalId}"`)
            }
            if (data?.areaId !== undefined && data.areaId !== step.area_id) {
              const area = (userData.areas || []).find((a: any) => a.id === data.areaId)
              changes.push(`přiřadil k oblasti "${area?.name || data.areaId}"`)
            }
            if (data?.title !== undefined && data.title !== step.title) {
              changes.push(`změnil název na "${data.title}"`)
            }
            if (data?.date !== undefined && data.date !== step.date) {
              changes.push(`změnil datum na "${data.date}"`)
            }
            
            results.push({
              type: 'step',
              operation: 'update',
              success: true,
              message: changes.length > 0 
                ? `Upravil jsem krok "${step.title}": ${changes.join(', ')}.`
                : `Upravil jsem krok "${step.title}".`,
              data: { step: updatedStep }
            })
          } else {
            results.push({
              type: 'step',
              operation: 'update',
              success: false,
              message: 'Chyba: Nepodařilo se aktualizovat krok.',
              error: 'Update failed'
            })
          }
        } else if (type === 'goal') {
          // TODO: Implementovat update cíle
          results.push({
            type: 'goal',
            operation: 'update',
            success: false,
            message: 'Aktualizace cílů zatím není implementována.',
            error: 'Not implemented'
          })
        } else if (type === 'habit') {
          // TODO: Implementovat update návyku
          results.push({
            type: 'habit',
            operation: 'update',
            success: false,
            message: 'Aktualizace návyků zatím není implementována.',
            error: 'Not implemented'
          })
        }
      }
    } catch (error: any) {
      console.error(`Error executing instruction ${i}:`, error)
      console.error('Instruction details:', { type, operation, filter, data, date })
      
      results.push({
        type: type || 'unknown',
        operation: operation || 'unknown',
        success: false,
        message: `Chyba při provádění akce: ${error.message || 'Neznámá chyba'}`,
        error: error.message || String(error)
      })
    }
  }
  
  // Filtrovat pouze úspěšné akce pro zprávu
  const successfulResults = results.filter(r => r.success)
  const failedResults = results.filter(r => !r.success)
  
  let message = ''
  if (successfulResults.length > 0 && failedResults.length === 0) {
    message = `Provedl jsem ${successfulResults.length} akci${successfulResults.length === 1 ? '' : successfulResults.length < 5 ? 'e' : 'í'}.`
  } else if (successfulResults.length > 0 && failedResults.length > 0) {
    message = `Provedl jsem ${successfulResults.length} akci${successfulResults.length === 1 ? '' : successfulResults.length < 5 ? 'e' : 'í'}, ${failedResults.length} akci${failedResults.length === 1 ? 'e' : failedResults.length < 5 ? 'e' : 'í'} se nepodařilo.`
  } else {
    message = `Nepodařilo se provést žádnou akci.`
  }
  
  return NextResponse.json({
    success: successfulResults.length > 0,
    message,
    actions: results
  })
}

/**
 * Provede akci na základě function call z AI
 */
async function executeAction(
  functionName: string,
  args: any,
  userId: string,
  context: AssistantContext
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    switch (functionName) {
      case 'complete_habits': {
        const habitIds = args.habitIds || []
        const date = args.date || context.today
        
        // Pokud nejsou zadány konkrétní návyky, vezmeme všechny
        const habitsToComplete = habitIds.length > 0
          ? context.habits.filter(h => habitIds.includes(h.id))
          : context.habits
        
        if (habitsToComplete.length === 0) {
          return { success: false, message: 'Nenašel jsem žádné návyky k označení.' }
        }
        
        // Označit všechny návyky jako dokončené
        const results = await Promise.all(
          habitsToComplete.map(async (habit) => {
            try {
              await toggleHabitCompletion(userId, habit.id, date)
              return { id: habit.id, name: habit.name, success: true }
            } catch (error) {
              console.error(`Error completing habit ${habit.id}:`, error)
              return { id: habit.id, name: habit.name, success: false }
            }
          })
        )
        
        const successful = results.filter(r => r.success)
        return {
          success: true,
          message: `Označil jsem ${successful.length} návyk${successful.length === 1 ? '' : successful.length < 5 ? 'y' : 'ů'} jako dokončené.`,
          data: { completed: successful }
        }
      }
      
      case 'create_goal': {
        const goal = await createGoal({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          target_date: args.targetDate ? new Date(args.targetDate) : undefined,
          area_id: args.areaId || null,
          icon: args.icon || 'Target',
          status: 'active',
          priority: 'meaningful',
          category: 'medium-term',
          goal_type: 'outcome',
          progress_percentage: 0
        })
        
        return {
          success: true,
          message: `Vytvořil jsem cíl "${goal.title}".`,
          data: { goal }
        }
      }
      
      case 'create_metric': {
        const metric = await createGoalMetric({
          user_id: userId,
          goal_id: args.goalId,
          name: args.name,
          description: undefined,
          type: args.type,
          unit: args.unit,
          target_value: args.targetValue,
          current_value: args.currentValue || 0,
          incremental_value: 1,
          initial_value: args.initialValue || 0
        })
        
        return {
          success: true,
          message: `Vytvořil jsem metriku "${metric.name}" s cílem ${metric.target_value} ${metric.unit}.`,
          data: { metric }
        }
      }
      
      case 'create_step': {
        const step = await createDailyStep({
          user_id: userId,
          title: args.title,
          description: args.description || null,
          date: args.date || context.today,
          goal_id: args.goalId || null,
          area_id: args.areaId || null,
          is_important: args.isImportant || false,
          is_urgent: args.isUrgent || false,
          completed: false
        })
        
        return {
          success: true,
          message: `Vytvořil jsem krok "${step.title}".`,
          data: { step }
        }
      }
      
      case 'create_habit': {
        const habit = await createHabit({
          user_id: userId,
          name: args.name,
          description: args.description || args.name,
          frequency: args.frequency || 'daily',
          area_id: args.areaId || null,
          icon: args.icon || null,
          streak: 0,
          max_streak: 0,
          category: 'osobní',
          difficulty: 'medium',
          is_custom: true,
          reminder_time: null,
          notification_enabled: false,
          selected_days: null,
          xp_reward: 1,
          start_date: context.today,
          habit_completions: {}
        })
        
        if (!habit) {
          return { success: false, message: 'Nepodařilo se vytvořit návyk.' }
        }
        
        return {
          success: true,
          message: `Vytvořil jsem návyk "${habit.name}".`,
          data: { habit }
        }
      }
      
      case 'create_area': {
        const area = await createArea(
          userId,
          args.name,
          args.description,
          args.color || '#3B82F6',
          args.icon
        )
        
        return {
          success: true,
          message: `Vytvořil jsem oblast "${area.name}".`,
          data: { area }
        }
      }
      
      default:
        return { success: false, message: `Neznámá akce: ${functionName}` }
    }
  } catch (error: any) {
    console.error(`Error executing action ${functionName}:`, error)
    return { success: false, message: `Chyba při provádění akce: ${error.message}` }
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { query, confirm, pendingActions: requestedPendingActions, userChoices, contextInstructions } = await request.json()
    
    // Načíst kontext uživatele (potřebujeme ho vždy)
    const context = await getUserContext(dbUser.id)
    
    // Načíst všechna data pro AI (včetně metrik)
    const userData = await getUserDataForAI(dbUser.id)

    // Pokud je confirm=true, provedeme instrukce
    if (confirm === true && requestedPendingActions && Array.isArray(requestedPendingActions)) {
      return await executeInstructions(requestedPendingActions, dbUser.id, context, userData, userChoices)
    }
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Zkontrolovat, zda máme API klíč
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Volat Gemini API
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(geminiApiKey)

    // Zjistit dostupné modely pomocí REST API
    let availableModels: string[] = []
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        availableModels = (modelsData.models || [])
          .map((m: any) => m.name?.replace('models/', '') || '')
          .filter((name: string) => name.includes('gemini'))
          .filter((name: string) => {
            // Filtrujeme pouze modely, které podporují generateContent
            const supportedMethods = modelsData.models.find((m: any) => m.name?.replace('models/', '') === name)?.supportedGenerationMethods || []
            return supportedMethods.includes('generateContent')
          })
        console.log('Available Gemini models:', availableModels)
      }
    } catch (error: any) {
      console.warn('Could not list models, will try default:', error.message)
    }

    // Formátovat data jako tabulku
    const formatDataAsTable = (data: any) => {
      let table = ''
      
      if (data.areas && data.areas.length > 0) {
        table += '\n## OBLASTI (Areas)\n'
        table += '| ID | Název | Popis | Barva | Ikona |\n'
        table += '|----|-------|-------|-------|-------|\n'
        data.areas.forEach((a: any) => {
          table += `| ${a.id} | ${a.name || ''} | ${a.description || ''} | ${a.color || ''} | ${a.icon || ''} |\n`
        })
      }
      
      if (data.goals && data.goals.length > 0) {
        table += '\n## CÍLE (Goals)\n'
        table += '| ID | Název | Popis | Cílové datum | Status | Priorita | Kategorie | Oblast ID | Ikona |\n'
        table += '|----|-------|-------|--------------|--------|----------|------------|-----------|-------|\n'
        data.goals.forEach((g: any) => {
          table += `| ${g.id} | ${g.title || ''} | ${g.description || ''} | ${g.target_date || ''} | ${g.status || ''} | ${g.priority || ''} | ${g.category || ''} | ${g.area_id || ''} | ${g.icon || ''} |\n`
        })
      }
      
      if (data.metrics && data.metrics.length > 0) {
        table += '\n## METRIKY (Metrics)\n'
        table += '| ID | Cíl ID | Název | Popis | Typ | Jednotka | Cílová hodnota | Aktuální hodnota | Počáteční hodnota |\n'
        table += '|----|--------|-------|-------|-----|----------|-----------------|------------------|-------------------|\n'
        data.metrics.forEach((m: any) => {
          table += `| ${m.id} | ${m.goal_id || ''} | ${m.name || ''} | ${m.description || ''} | ${m.type || ''} | ${m.unit || ''} | ${m.target_value || ''} | ${m.current_value || ''} | ${m.initial_value || ''} |\n`
        })
      }
      
      if (data.habits && data.habits.length > 0) {
        table += '\n## NÁVYKY (Habits)\n'
        table += '| ID | Název | Popis | Frekvence | Oblast ID | Ikona |\n'
        table += '|----|-------|-------|-----------|-----------|-------|\n'
        data.habits.forEach((h: any) => {
          table += `| ${h.id} | ${h.name || ''} | ${h.description || ''} | ${h.frequency || ''} | ${h.area_id || ''} | ${h.icon || ''} |\n`
        })
      }
      
      if (data.steps && data.steps.length > 0) {
        table += '\n## KROKY (Steps)\n'
        table += '| ID | Název | Popis | Datum | Dokončeno | Cíl ID | Oblast ID | Důležité | Urgentní |\n'
        table += '|----|-------|-------|-------|-----------|--------|-----------|----------|----------|\n'
        data.steps.forEach((s: any) => {
          table += `| ${s.id} | ${s.title || ''} | ${s.description || ''} | ${s.date || ''} | ${s.completed ? 'Ano' : 'Ne'} | ${s.goal_id || ''} | ${s.area_id || ''} | ${s.is_important ? 'Ano' : 'Ne'} | ${s.is_urgent ? 'Ano' : 'Ne'} |\n`
        })
      }
      
      return table
    }
    
    const dataTable = formatDataAsTable(userData)
    
    // Sestavit prompt pro AI s kontextem předchozích nepotvrzených akcí
    let contextInfo = ''
    if (contextInstructions && Array.isArray(contextInstructions) && contextInstructions.length > 0) {
      contextInfo = `\n**DŮLEŽITÉ - KONTEXT PŘEDCHOZÍCH NEPOTVRZENÝCH AKCÍ:**
Uživatel má následující nepotvrzené akce, které ještě nebyly provedeny:
${JSON.stringify(contextInstructions, null, 2)}

Tyto akce jsou stále v procesu schvalování. Pokud uživatel v novém promptu mluví o těchto akcích nebo chce něco změnit, musíš to vzít v úvahu. Pokud uživatel chce pokračovat s těmito akcemi, vrať je znovu v instrukcích. Pokud chce něco změnit, uprav instrukce podle nového promptu.

`
    }
    
    const aiPrompt = `Jsem automatizovaný systém aplikace. Uživatel zadal tento prompt:
"${query}"
${contextInfo}
Na jeho základě musím provést změnu v jeho datech. Níže posílám tabulku dat, které máme k dispozici:
${dataTable}

**Dnešní datum: ${userData.today}**

**DŮLEŽITÉ - JAK ROZPOZNAT OPERACI Z PROMPTU:**
- Pokud uživatel říká "vytvoř", "přidej", "nový", "založ", "udělej", "připrav" → použij "operation": "create"
- Pokud uživatel říká "označ", "dokonči", "splň", "hotovo", "udělal jsem" → použij "operation": "complete"
- Pokud uživatel mluví o něčem, co ještě neexistuje (např. "přidej krok X"), je to VŽDY "create"
- Pokud uživatel mluví o něčem, co už existuje a chce to označit jako hotové, je to "complete"
- POZOR: Pokud uživatel chce VYTVOŘIT novou položku, NIKDY nepoužívej "complete" - použij "create"!

Vrať mi ve formátu JSON s tímto strukturou:
{
  "message": "Popis toho, co chceš udělat (v češtině)",
  "instructions": [
    {
      "type": "habit" | "step" | "goal" | "area" | "metric",
      "operation": "complete" | "create" | "update" | "delete",
      "date": "YYYY-MM-DD", // pouze pro complete operace
      "filter": {
        "type": "all" | "ids" | "names",
        "values": [] // IDs nebo názvy podle typu filtru
      },
      "data": {} // data pro create/update operace (použij pole z tabulky výše)
    }
  ]
}

**PRAVIDLA:**
- Vždy vrať POUZE JSON - žádný další text
- **ROZHODNUTÍ OPERACE:** Analyzuj prompt uživatele a rozhodni, zda chce VYTVOŘIT novou položku (create), OZNAČIT existující jako dokončenou (complete), UPRAVIT existující (update) nebo SMAZAT (delete)
- Pro "create" operace:
  * MUSÍŠ vždy vyplnit VŠECHNA povinná pole v "data"
  * Pro "step": data.title je POVINNÉ a musí být neprázdný textový řetězec, data.date je POVINNÉ (pokud není uvedeno, použij ${userData.today})
  * Pro "goal": data.title je POVINNÉ a musí být neprázdný textový řetězec
  * Pro "habit": data.name je POVINNÉ a musí být neprázdný textový řetězec
  * Pro "area": data.name je POVINNÉ a musí být neprázdný textový řetězec
  * NIKDY nepoužívej "filter" pro create operace
- Pro "complete" operace:
  * Použij "filter" k určení, které položky označit
  * Použij "date" k určení data dokončení
  * NIKDY nepoužívej "data" pro complete operace
- Pro "update" operace použij filter k určení položky a data s poli k úpravě
- Pokud uživatel mluví o "dnešních návycích" nebo "dnes", použij datum: ${userData.today}
- Pokud uživatel mluví o existující položce, použij její ID nebo název ve filtru
- NIKDY nevracej undefined, null nebo prázdný řetězec pro povinná pole!

**PŘÍKLADY:**

Vytvořit nový krok:
{
  "message": "Vytvořím krok 'Zavolat zubaři'",
  "instructions": [
    {
      "type": "step",
      "operation": "create",
      "data": {
        "title": "Zavolat zubaři",
        "description": "Objednat se na prohlídku",
        "date": "${userData.today}",
        "is_important": false,
        "is_urgent": false
      }
    }
  ]
}

Vytvořit nový cíl:
{
  "message": "Vytvořím cíl 'Našetřit 500 000 na dům'",
  "instructions": [
    {
      "type": "goal",
      "operation": "create",
      "data": {
        "title": "Našetřit 500 000 na dům",
        "description": "Našetřit 500 000 CZK na koupi domu",
        "target_date": "2027-01-15",
        "status": "active",
        "priority": "meaningful",
        "category": "medium-term"
      }
    }
  ]
}

Označit všechny návyky jako dokončené:
{
  "message": "Označím všechny návyky jako dokončené pro dnešní datum",
  "instructions": [
    {
      "type": "habit",
      "operation": "complete",
      "date": "${userData.today}",
      "filter": {
        "type": "all",
        "values": []
      }
    }
  ]
}

**DŮLEŽITÉ PRAVIDLO PRO OPERACE:**
- Pokud uživatel říká "vytvoř", "přidej", "nový", "založ", "udělej" → použij "operation": "create"
- Pokud uživatel říká "označ", "dokonči", "splň", "hotovo" → použij "operation": "complete"
- Pokud uživatel říká "změň", "uprav", "upravit" → použij "operation": "update"
- Pokud uživatel říká "smaž", "odstraň" → použij "operation": "delete"
- Pro "create" operace NIKDY nepoužívej "filter" - místo toho vyplň "data" s novými hodnotami
- Pro "complete" operace NIKDY nepoužívej "data" - místo toho použij "filter" k určení, které položky označit

Vrať POUZE JSON, žádný další text!`

    // Gemini API - použijeme generateContent BEZ tools (LLM vrací JSON instrukce)
    // Zkusíme různé názvy modelů podle dostupnosti
    // Seznam modelů k vyzkoušení v pořadí priority
    let modelsToTry: string[] = availableModels.length > 0 
      ? availableModels.filter(m => m.includes('gemini') && (m.includes('flash') || m.includes('pro')))
      : ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.5-flash-001', 'gemini-1.5-pro-001']
    
    if (modelsToTry.length === 0 && availableModels.length > 0) {
      // Pokud nemáme žádný gemini model, použijeme první dostupný
      modelsToTry = [availableModels[0]]
    }

    let result
    let workingModelName: string | null = null
    let lastError: any = null
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`)
        const model = genAI.getGenerativeModel({ 
          model: modelName
        })
        
        result = await model.generateContent(aiPrompt)
        workingModelName = modelName
        console.log(`Successfully used model: ${modelName}`)
        break // Úspěch, přerušíme smyčku
      } catch (error: any) {
        console.error(`Error with model ${modelName}:`, error.message)
        lastError = error
        continue // Zkusíme další model
      }
    }

    if (!result || !workingModelName) {
      throw new Error(`Failed to generate content with any model. Last error: ${lastError?.message || 'Unknown error'}`)
    }
    
    const response = result.response
    const responseText = response.text()

    // Parsovat JSON odpověď z LLM
    let instructions: any = null
    try {
      // Zkus najít JSON v odpovědi (může být v code blocku nebo jako plain text)
      let jsonText = responseText.trim()
      
      // Odstranit markdown code blocks pokud existují
      const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) || jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1].trim()
      }
      
      // Zkus najít JSON objekt v textu (pokud je obalený textem)
      const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonObjectMatch) {
        jsonText = jsonObjectMatch[0]
      }
      
      instructions = JSON.parse(jsonText)
      
      // Logovat instrukce pro debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Parsed instructions:', JSON.stringify(instructions, null, 2))
        if (instructions.instructions) {
          instructions.instructions.forEach((inst: any, idx: number) => {
            if (inst.type === 'step' && inst.operation === 'create') {
              console.log(`Step instruction ${idx}:`, {
                title: inst.data?.title,
                hasTitle: !!inst.data?.title,
                titleType: typeof inst.data?.title,
                data: inst.data
              })
            }
          })
        }
      }
    } catch (error: any) {
      console.error('Error parsing LLM response as JSON:', error)
      console.error('Response text:', responseText)
      
      // Zkus ještě jednou s lepším parsováním
      try {
        // Najít první { a poslední }
        const firstBrace = responseText.indexOf('{')
        const lastBrace = responseText.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonCandidate = responseText.substring(firstBrace, lastBrace + 1)
          instructions = JSON.parse(jsonCandidate)
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (retryError: any) {
        return NextResponse.json({
          success: false,
          message: 'Nepodařilo se zpracovat odpověď. Zkuste to prosím znovu s jiným příkazem.',
          error: 'Invalid JSON response from LLM',
          debug: process.env.NODE_ENV === 'development' ? responseText.substring(0, 200) : undefined
        })
      }
    }

    // Validovat strukturu odpovědi
    if (!instructions.instructions || !Array.isArray(instructions.instructions)) {
      return NextResponse.json({
        success: false,
        message: instructions.message || 'Nepodařilo se zpracovat instrukce.',
        error: 'Invalid instructions format'
      })
    }

    // Odfiltrovat duplicitní instrukce (stejný type + operation + data)
    let uniqueInstructions = instructions.instructions.filter((instruction: any, index: number, self: any[]) => {
      return index === self.findIndex((i) => {
        if (i.type !== instruction.type || i.operation !== instruction.operation) {
          return false
        }
        // Pro create operace porovnej data
        if (instruction.operation === 'create' && instruction.data) {
          const key = instruction.type === 'step' ? 'title' : instruction.type === 'goal' ? 'title' : instruction.type === 'habit' ? 'name' : instruction.type === 'area' ? 'name' : 'id'
          return i.data && i.data[key] === instruction.data[key]
        }
        // Pro complete operace porovnej filter
        if (instruction.operation === 'complete' && instruction.filter) {
          return JSON.stringify(i.filter) === JSON.stringify(instruction.filter) && i.date === instruction.date
        }
        return true
      })
    })

    if (uniqueInstructions.length !== instructions.instructions.length) {
      console.log(`Filtered ${instructions.instructions.length - uniqueInstructions.length} duplicate instructions`)
    }

    // Automaticky přiřadit cíle a oblasti k vytvářeným krokům (lokálně, bez AI)
    const matching = findMatchingGoalsAndAreas(query, userData.goals, userData.areas)
    if (matching.goalId || matching.areaId) {
      uniqueInstructions = uniqueInstructions.map((instruction: any) => {
        // Pokud vytváříme krok a nemá přiřazený goalId/areaId, přiřaď je
        if (instruction.type === 'step' && instruction.operation === 'create' && instruction.data) {
          return {
            ...instruction,
            data: {
              ...instruction.data,
              goalId: instruction.data.goalId || matching.goalId,
              areaId: instruction.data.areaId || matching.areaId
            }
          }
        }
        // Pokud upravujeme krok a nemá přiřazený goalId/areaId, přiřaď je
        if (instruction.type === 'step' && instruction.operation === 'update' && instruction.data) {
          return {
            ...instruction,
            data: {
              ...instruction.data,
              goalId: instruction.data.goalId !== undefined ? instruction.data.goalId : (matching.goalId || undefined),
              areaId: instruction.data.areaId !== undefined ? instruction.data.areaId : (matching.areaId || undefined)
            }
          }
        }
        return instruction
      })
      
      if (matching.goalId || matching.areaId) {
        console.log(`Auto-assigned: goalId=${matching.goalId}, areaId=${matching.areaId}`)
      }
    }

    // Interpretovat instrukce a připravit preview
    const preview = await interpretInstructions(uniqueInstructions, dbUser.id, context, userData)

    // Vždy vyžadovat potvrzení, pokud jsou nějaké instrukce
    const requiresConfirmation = uniqueInstructions.length > 0 && preview.items.length > 0

    return NextResponse.json({
      success: true,
      message: instructions.message || 'Připravil jsem následující změny:',
      preview: preview,
      instructions: uniqueInstructions,
      requiresConfirmation: requiresConfirmation
    })

  } catch (error: any) {
    console.error('Error in AI assistant:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    })
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

