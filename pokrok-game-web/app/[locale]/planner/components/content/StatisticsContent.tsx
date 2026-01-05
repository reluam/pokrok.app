'use client'

interface StatisticsContentProps {
  completedSteps: number
  activeHabits: number
  completedGoals: number
  progressPercentage: number
}

export function StatisticsContent({
  completedSteps,
  activeHabits,
  completedGoals,
  progressPercentage
}: StatisticsContentProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center p-8">
      <div className="grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">{completedSteps}</div>
          <div className="text-lg text-orange-800 font-medium">Dokončené kroky</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">{activeHabits}</div>
          <div className="text-lg text-orange-800 font-medium">Splněné návyky</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{completedGoals}</div>
          <div className="text-lg text-orange-800 font-medium">Dokončené cíle</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">{Math.round(progressPercentage)}%</div>
          <div className="text-lg text-orange-800 font-medium">Celkový pokrok</div>
        </div>
      </div>
    </div>
  )
}

