'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameState, GamePhase, Player, Goal, Habit, DailyStats, GameTask, Achievement } from '../types/game'

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'intro',
    player: null,
    goals: [],
    habits: [],
    dailyStats: null,
    tasks: [],
    achievements: [],
    currentDay: 1,
    currentTime: 6,
    energy: 100,
    experience: 0,
    level: 1,
    hasCompletedOnboarding: false
  })

  // Load game state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('gameState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Convert date strings back to Date objects
        if (parsed.player?.createdAt) {
          parsed.player.createdAt = new Date(parsed.player.createdAt)
        }
        if (parsed.goals) {
          parsed.goals = parsed.goals.map((goal: any) => ({
            ...goal,
            createdAt: new Date(goal.createdAt),
            deadline: goal.deadline ? new Date(goal.deadline) : undefined,
            completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined
          }))
        }
        if (parsed.habits) {
          parsed.habits = parsed.habits.map((habit: any) => ({
            ...habit,
            createdAt: new Date(habit.createdAt),
            lastCompleted: habit.lastCompleted ? new Date(habit.lastCompleted) : undefined
          }))
        }
        if (parsed.dailyStats?.date) {
          parsed.dailyStats.date = new Date(parsed.dailyStats.date).toISOString().split('T')[0]
        }
        setGameState(parsed)
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    }
  }, [])

  // Save game state to localStorage
  useEffect(() => {
    try {
      // Only save serializable data, not functions
      const serializableState = {
        phase: gameState.phase,
        player: gameState.player,
        goals: gameState.goals,
        habits: gameState.habits,
        dailyStats: gameState.dailyStats,
        tasks: gameState.tasks,
        achievements: gameState.achievements,
        currentDay: gameState.currentDay,
        currentTime: gameState.currentTime,
        energy: gameState.energy,
        experience: gameState.experience,
        level: gameState.level,
        hasCompletedOnboarding: gameState.hasCompletedOnboarding
      }
      localStorage.setItem('gameState', JSON.stringify(serializableState))
    } catch (error) {
      console.error('Failed to save game state:', error)
    }
  }, [
    gameState.phase,
    gameState.player,
    gameState.goals,
    gameState.habits,
    gameState.dailyStats,
    gameState.tasks,
    gameState.achievements,
    gameState.currentDay,
    gameState.currentTime,
    gameState.energy,
    gameState.experience,
    gameState.level,
    gameState.hasCompletedOnboarding
  ])

  const updateGamePhase = useCallback((phase: GamePhase) => {
    setGameState(prev => ({ ...prev, phase }))
  }, [])

  const createPlayer = useCallback((playerData: Omit<Player, 'id' | 'level' | 'experience' | 'createdAt'>) => {
    console.log('createPlayer called with:', playerData)
    const newPlayer: Player = {
      ...playerData,
      id: `player_${Date.now()}`,
      level: 1,
      experience: 0,
      createdAt: new Date()
    }
    console.log('New player created:', newPlayer)
    
    setGameState(prev => {
      const newState = { ...prev, player: newPlayer, phase: 'goals-setup' as GamePhase }
      console.log('Updating game state to:', newState)
      return newState
    })
  }, [])

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
      createdAt: new Date()
    }
    setGameState(prev => ({ ...prev, goals: [...prev.goals, newGoal] }))
  }, [])

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: `habit_${Date.now()}`,
      createdAt: new Date()
    }
    setGameState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setGameState(prev => ({ 
      ...prev, 
      hasCompletedOnboarding: true,
      phase: 'playing'
    }))
  }, [])

  const setDailyStats = useCallback((stats: DailyStats) => {
    setGameState(prev => ({ ...prev, dailyStats: stats, energy: stats.energy }))
  }, [])

  const updateHabit = useCallback((habitId: string, updates: Partial<Habit>) => {
    setGameState(prev => ({
      ...prev,
      habits: prev.habits.map(habit => 
        habit.id === habitId ? { ...habit, ...updates } : habit
      )
    }))
  }, [])

  const completeTask = useCallback((taskId: string) => {
    setGameState(prev => {
      const task = prev.tasks.find(t => t.id === taskId)
      if (!task) return prev

      const newExperience = prev.experience + task.experienceReward
      const newLevel = Math.floor(newExperience / 100) + 1
      const newEnergy = Math.max(0, prev.energy - task.energyCost)

      return {
        ...prev,
        tasks: prev.tasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: true, completedAt: new Date() }
            : t
        ),
        experience: newExperience,
        level: newLevel,
        energy: newEnergy,
        dailyStats: prev.dailyStats ? {
          ...prev.dailyStats,
          completedTasks: prev.dailyStats.completedTasks + 1
        } : null
      }
    })
  }, [])

  const addTask = useCallback((task: Omit<GameTask, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: GameTask = {
      ...task,
      id: `task_${Date.now()}`,
      completed: false,
      createdAt: new Date()
    }
    setGameState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }))
  }, [])

  const advanceTime = useCallback((hours: number = 2) => {
    setGameState(prev => {
      const newTime = prev.currentTime + hours
      if (newTime >= 24) {
        // New day
        return {
          ...prev,
          currentTime: 6, // Reset to morning
          currentDay: prev.currentDay + 1,
          energy: 100, // Reset energy
          dailyStats: null // Reset daily stats
        }
      }
      return { ...prev, currentTime: newTime }
    })
  }, [])

  const rest = useCallback((energyGain: number = 30) => {
    setGameState(prev => ({
      ...prev,
      energy: Math.min(100, prev.energy + energyGain)
    }))
  }, [])

  const unlockAchievement = useCallback((achievementId: string) => {
    setGameState(prev => ({
      ...prev,
      achievements: prev.achievements.map(achievement =>
        achievement.id === achievementId
          ? { ...achievement, unlocked: true, unlockedAt: new Date() }
          : achievement
      )
    }))
  }, [])

  return {
    gameState,
    updateGamePhase,
    createPlayer,
    addGoal,
    addHabit,
    completeOnboarding,
    setDailyStats,
    updateHabit,
    completeTask,
    addTask,
    advanceTime,
    rest,
    unlockAchievement
  }
}
