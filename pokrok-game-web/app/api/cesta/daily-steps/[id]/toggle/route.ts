import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId, toggleDailyStep, getUpdatedGoalAfterStepCompletion, getDailyStepsByUserId, updateGoalProgressCombined } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to get the correct ID
    const dbUser = await getUserByClerkId(userId)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stepId = params.id

    if (!stepId) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 })
    }

    // Verify that the step belongs to the user
    const userSteps = await getDailyStepsByUserId(dbUser.id)
    const stepExists = userSteps.some(step => step.id === stepId)
    
    if (!stepExists) {
      return NextResponse.json({ error: 'Step not found or access denied' }, { status: 404 })
    }

    // Get current step to check if it will be completed after toggle
    const currentStep = userSteps.find(step => step.id === stepId)
    const willBeCompleted = currentStep ? !currentStep.completed : false

    const updatedStep = await toggleDailyStep(stepId)
    
    // Update goal progress using combined formula if step was completed
    let updatedGoal = null
    if (willBeCompleted && updatedStep.goal_id) {
      await updateGoalProgressCombined(updatedStep.goal_id)
      updatedGoal = await getUpdatedGoalAfterStepCompletion(updatedStep.goal_id)
    }
    
    // Normalize date to YYYY-MM-DD string
    const normalizeDate = (date: any): string | null => {
      if (!date) return null
      if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date
      }
      if (typeof date === 'string' && date.includes('T')) {
        return date.split('T')[0]
      }
      if (date instanceof Date || (typeof date === 'object' && 'getTime' in date)) {
        const d = new Date(date)
        const year = d.getUTCFullYear()
        const month = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      return null
    }
    
    const normalizedStep = {
      ...updatedStep,
      date: normalizeDate(updatedStep.date)
    }
    
    return NextResponse.json({ 
      step: normalizedStep,
      goal: updatedGoal
    })
  } catch (error) {
    console.error('Error toggling daily step:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

