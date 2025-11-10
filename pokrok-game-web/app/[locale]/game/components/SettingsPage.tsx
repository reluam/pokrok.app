'use client'

import { SettingsView } from './SettingsView'

interface SettingsPageProps {
  player?: any
  onPlayerUpdate?: (updatedPlayer: any) => void
  onBack?: () => void
}

export function SettingsPage({ player, onPlayerUpdate, onBack }: SettingsPageProps) {
  const handlePlayerUpdate = (updatedPlayer: any) => {
    // Update player in parent component if needed
    if (onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer)
    } else {
      console.log('Player updated:', updatedPlayer)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  return (
    <SettingsView 
      player={player} 
      onPlayerUpdate={handlePlayerUpdate}
      onBack={handleBack}
    />
  )
}

