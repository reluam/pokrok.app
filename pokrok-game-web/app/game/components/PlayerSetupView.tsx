'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface PlayerSetupViewProps {
  onPlayerCreated: (playerData: any) => void
}

export function PlayerSetupView({ onPlayerCreated }: PlayerSetupViewProps) {
  const { user } = useUser()
  const [playerName, setPlayerName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [hairColor, setHairColor] = useState('#8B4513')
  const [skinColor, setSkinColor] = useState('#FDBCB4')
  const [eyeColor, setEyeColor] = useState('#4A90E2')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreatePlayer = async () => {
    if (!playerName.trim() || !user) return

    setIsCreating(true)
    try {
      // Get user from database via API
      const userResponse = await fetch(`/api/user?clerkId=${user.id}`)
      if (!userResponse.ok) {
        console.error('User not found in database')
        return
      }

      const dbUser = await userResponse.json()

      const playerData = {
        userId: dbUser.id,
        name: playerName.trim(),
        gender,
        avatar: 'default',
        appearance: {
          hairColor,
          skinColor,
          eyeColor
        },
        level: 1,
        experience: 0,
        energy: 100,
        currentDay: 1,
        currentTime: 6
      }

      console.log('Creating player:', playerData)
      const response = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      })
      
      if (response.ok) {
        const createdPlayer = await response.json()
        console.log('Player created successfully:', createdPlayer)
        if (createdPlayer && createdPlayer.id) {
          onPlayerCreated(createdPlayer)
        } else {
          console.error('Player data is invalid:', createdPlayer)
        }
      } else {
        console.error('Failed to create player, status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error creating player:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full" style={{
        fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14px'
      }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" style={{
            textShadow: '2px 2px 0px #000000',
            color: '#2d5016'
          }}>VYTVOŘ SVOU POSTAVU</h1>
          <p className="text-gray-600">Jak se chceš jmenovat a jak vypadáš?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Character Preview */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">NÁHLED</h2>
            <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-gray-300 flex items-center justify-center bg-gray-100">
              <div className="w-24 h-24 rounded-full relative" style={{ backgroundColor: skinColor }}>
                {/* Hair */}
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-full"
                  style={{ backgroundColor: hairColor }}
                />
                {/* Eyes */}
                <div 
                  className="absolute top-6 left-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: eyeColor }}
                />
                <div 
                  className="absolute top-6 right-4 w-3 h-3 rounded-full"
                  style={{ backgroundColor: eyeColor }}
                />
                {/* Smile */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-4 border-b-2 border-gray-600 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600">{playerName || 'Tvoje jméno'}</p>
          </div>

          {/* Player Customization */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">PŘIZPŮSOBENÍ</h2>
            
            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">JMÉNO</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="Zadej své jméno"
                maxLength={20}
              />
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">POHLAVÍ</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value as 'male')}
                    className="mr-2"
                  />
                  Muž
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value as 'female')}
                    className="mr-2"
                  />
                  Žena
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    checked={gender === 'other'}
                    onChange={(e) => setGender(e.target.value as 'other')}
                    className="mr-2"
                  />
                  Jiné
                </label>
              </div>
            </div>

            {/* Hair Color */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">BARVA VLASŮ</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  className="w-12 h-12 border-2 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{hairColor}</span>
              </div>
            </div>

            {/* Skin Color */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">BARVA POKOŽKY</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={skinColor}
                  onChange={(e) => setSkinColor(e.target.value)}
                  className="w-12 h-12 border-2 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{skinColor}</span>
              </div>
            </div>

            {/* Eye Color */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">BARVA OČÍ</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={eyeColor}
                  onChange={(e) => setEyeColor(e.target.value)}
                  className="w-12 h-12 border-2 border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{eyeColor}</span>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreatePlayer}
              disabled={!playerName.trim() || isCreating}
              className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'VYTVÁŘÍM...' : 'VYTVOŘIT POSTAVU'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

