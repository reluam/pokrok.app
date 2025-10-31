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

const iconMap: Record<string, any> = {
  Target, Trophy, Star, Heart, Zap, BookOpen, Dumbbell, Car, Home, Briefcase, GraduationCap, Music, Camera, Plane, TreePine, Coffee, Gamepad2, Paintbrush, Utensils, ShoppingBag,
  Smile, Laugh, ThumbsUp, Sparkles, Sun, Moon, Rainbow, Droplets, Leaf, Mountain, Waves, Flower2,
  Bird, Fish, Cat, Dog, Rabbit,
  Bot, Ghost, Skull, Crown, Gem, Key, Lock, Shield, Compass, Map, Globe, Flag, Medal, Award, Gift,
  Cake, Cookie, Pizza, Apple, Banana, Cherry, Grape, Carrot,
  ArrowUp, ArrowRight, ArrowDown, ArrowLeft
}

const emojiMap: Record<string, string> = {
  Target: '🎯', Trophy: '🏆', Star: '⭐', Heart: '❤️', Zap: '⚡', BookOpen: '📖', Dumbbell: '🏋️', Car: '🚗', Home: '🏠', Briefcase: '💼', GraduationCap: '🎓', Music: '🎵', Camera: '📷', Plane: '✈️', TreePine: '🌲', Coffee: '☕', Gamepad2: '🎮', Paintbrush: '🎨', Utensils: '🍽️', ShoppingBag: '🛍️',
  Smile: '😊', Laugh: '😂', ThumbsUp: '👍', Sparkles: '✨', Sun: '☀️', Moon: '🌙', Rainbow: '🌈', Droplets: '💧', Leaf: '🍃', Mountain: '🏔️', Waves: '🌊', Flower2: '🌸',
  Bird: '🐦', Fish: '🐟', Cat: '🐱', Dog: '🐶', Rabbit: '🐰',
  Bot: '🤖', Ghost: '👻', Skull: '💀', Crown: '👑', Gem: '💎', Key: '🗝️', Lock: '🔒', Shield: '🛡️', Compass: '🧭', Map: '🗺️', Globe: '🌍', Flag: '🏳️', Medal: '🏅', Award: '🏆', Gift: '🎁',
  Cake: '🎂', Cookie: '🍪', Pizza: '🍕', Apple: '🍎', Banana: '🍌', Cherry: '🍒', Grape: '🍇', Carrot: '🥕',
  ArrowUp: '⬆️', ArrowRight: '➡️', ArrowDown: '⬇️', ArrowLeft: '⬅️'
}

export function getIconComponent(iconName?: string) {
  if (!iconName || !iconMap[iconName]) {
    return Target // Default icon
  }
  return iconMap[iconName]
}

export function getIconEmoji(iconName?: string) {
  if (!iconName || !emojiMap[iconName]) {
    return '🎯' // Default emoji
  }
  return emojiMap[iconName]
}

export function getDefaultGoalIcon() {
  return 'Target'
}