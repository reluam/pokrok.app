import { useState, memo } from 'react'
import { 
  Target, 
  Trophy, 
  Star, 
  Heart, 
  Zap, 
  BookOpen, 
  Dumbbell, 
  Car, 
  Home, 
  Briefcase, 
  GraduationCap, 
  Music, 
  Camera, 
  Plane, 
  TreePine, 
  Coffee, 
  Gamepad2, 
  Paintbrush, 
  Utensils, 
  ShoppingBag,
  Smile,
  Laugh,
  ThumbsUp,
  Sparkles,
  Sun,
  Moon,
  Rainbow,
  Droplets,
  Leaf,
  Mountain,
  Waves,
  Flower2,
  Bird,
  Fish,
  Cat,
  Dog,
  Rabbit,
  Crown,
  Gem,
  Key,
  Lock,
  Shield,
  Compass,
  Map,
  Globe,
  Flag,
  Medal,
  Award,
  Gift,
  Cake,
  Cookie,
  Pizza,
  Apple,
  Banana,
  Cherry,
  Grape,
  Carrot,
  Bot,
  Ghost,
  Skull,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft
} from 'lucide-react'

interface IconPickerProps {
  selectedIcon?: string
  onIconSelect: (icon: string) => void
  className?: string
}

const iconCategories = {
  'Základní': [
    { name: 'Target', icon: Target, emoji: '🎯' },
    { name: 'Trophy', icon: Trophy, emoji: '🏆' },
    { name: 'Star', icon: Star, emoji: '⭐' },
    { name: 'Heart', icon: Heart, emoji: '❤️' },
    { name: 'Zap', icon: Zap, emoji: '⚡' },
    { name: 'BookOpen', icon: BookOpen, emoji: '📖' },
    { name: 'Dumbbell', icon: Dumbbell, emoji: '🏋️' },
    { name: 'Car', icon: Car, emoji: '🚗' },
    { name: 'Home', icon: Home, emoji: '🏠' },
    { name: 'Briefcase', icon: Briefcase, emoji: '💼' },
    { name: 'GraduationCap', icon: GraduationCap, emoji: '🎓' },
    { name: 'Music', icon: Music, emoji: '🎵' },
    { name: 'Camera', icon: Camera, emoji: '📷' },
    { name: 'Plane', icon: Plane, emoji: '✈️' },
    { name: 'TreePine', icon: TreePine, emoji: '🌲' },
    { name: 'Coffee', icon: Coffee, emoji: '☕' },
    { name: 'Gamepad2', icon: Gamepad2, emoji: '🎮' },
    { name: 'Paintbrush', icon: Paintbrush, emoji: '🎨' },
    { name: 'Utensils', icon: Utensils, emoji: '🍽️' },
    { name: 'ShoppingBag', icon: ShoppingBag, emoji: '🛍️' }
  ],
  'Smajlíci': [
    { name: 'Smile', icon: Smile, emoji: '😊' },
    { name: 'Laugh', icon: Laugh, emoji: '😂' },
    { name: 'ThumbsUp', icon: ThumbsUp, emoji: '👍' },
    { name: 'Sparkles', icon: Sparkles, emoji: '✨' },
    { name: 'Sun', icon: Sun, emoji: '☀️' },
    { name: 'Moon', icon: Moon, emoji: '🌙' },
    { name: 'Rainbow', icon: Rainbow, emoji: '🌈' },
    { name: 'Droplets', icon: Droplets, emoji: '💧' },
    { name: 'Leaf', icon: Leaf, emoji: '🍃' },
    { name: 'Mountain', icon: Mountain, emoji: '🏔️' },
    { name: 'Waves', icon: Waves, emoji: '🌊' },
    { name: 'Flower2', icon: Flower2, emoji: '🌸' }
  ],
  'Zvířata': [
    { name: 'Bird', icon: Bird, emoji: '🐦' },
    { name: 'Fish', icon: Fish, emoji: '🐟' },
    { name: 'Cat', icon: Cat, emoji: '🐱' },
    { name: 'Dog', icon: Dog, emoji: '🐶' },
    { name: 'Rabbit', icon: Rabbit, emoji: '🐰' }
  ],
  'Fantasy': [
    { name: 'Bot', icon: Bot, emoji: '🤖' },
    { name: 'Ghost', icon: Ghost, emoji: '👻' },
    { name: 'Skull', icon: Skull, emoji: '💀' },
    { name: 'Crown', icon: Crown, emoji: '👑' },
    { name: 'Gem', icon: Gem, emoji: '💎' },
    { name: 'Key', icon: Key, emoji: '🗝️' },
    { name: 'Lock', icon: Lock, emoji: '🔒' },
    { name: 'Shield', icon: Shield, emoji: '🛡️' },
    { name: 'Compass', icon: Compass, emoji: '🧭' },
    { name: 'Map', icon: Map, emoji: '🗺️' },
    { name: 'Globe', icon: Globe, emoji: '🌍' },
    { name: 'Flag', icon: Flag, emoji: '🏳️' },
    { name: 'Medal', icon: Medal, emoji: '🏅' },
    { name: 'Award', icon: Award, emoji: '🏆' },
    { name: 'Gift', icon: Gift, emoji: '🎁' }
  ],
  'Jídlo': [
    { name: 'Cake', icon: Cake, emoji: '🎂' },
    { name: 'Cookie', icon: Cookie, emoji: '🍪' },
    { name: 'Pizza', icon: Pizza, emoji: '🍕' },
    { name: 'Apple', icon: Apple, emoji: '🍎' },
    { name: 'Banana', icon: Banana, emoji: '🍌' },
    { name: 'Cherry', icon: Cherry, emoji: '🍒' },
    { name: 'Grape', icon: Grape, emoji: '🍇' },
    { name: 'Carrot', icon: Carrot, emoji: '🥕' }
  ],
  'Šipky': [
    { name: 'ArrowUp', icon: ArrowUp, emoji: '⬆️' },
    { name: 'ArrowRight', icon: ArrowRight, emoji: '➡️' },
    { name: 'ArrowDown', icon: ArrowDown, emoji: '⬇️' },
    { name: 'ArrowLeft', icon: ArrowLeft, emoji: '⬅️' }
  ]
}

export const IconPicker = memo(function IconPicker({ 
  selectedIcon, 
  onIconSelect, 
  className = '' 
}: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Základní')

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(iconCategories).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Icons grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {iconCategories[activeCategory as keyof typeof iconCategories].map((iconData) => (
          <button
            key={iconData.name}
            onClick={() => onIconSelect(iconData.name)}
            className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedIcon === iconData.name
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            title={iconData.name}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl">{iconData.emoji}</span>
              <span className="text-xs text-gray-500 truncate w-full text-center">
                {iconData.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected icon preview */}
      {selectedIcon && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {(() => {
                const allIcons = Object.values(iconCategories).flat()
                const selectedIconData = allIcons.find(icon => icon.name === selectedIcon)
                return selectedIconData?.emoji || '🎯'
              })()}
            </span>
            <div>
              <p className="font-medium text-gray-900">Vybraná ikona</p>
              <p className="text-sm text-gray-500">{selectedIcon}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
