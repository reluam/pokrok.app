'use client'

import { WorkflowsView } from '../WorkflowsView'

interface WorkflowsPageProps {
  player?: any
  onBack?: () => void
  onNavigateToMain?: () => void
}

export function WorkflowsPage({ player, onBack, onNavigateToMain }: WorkflowsPageProps) {
  return (
    <WorkflowsView 
      player={player}
      onBack={onBack}
      onNavigateToMain={onNavigateToMain}
    />
  )
}

