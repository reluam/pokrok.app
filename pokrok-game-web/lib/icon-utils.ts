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
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Search,
  Wallet,
  Coins,
  // Health icons
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  // Technology icons
  Cpu,
  Smartphone,
  Laptop,
  Code,
  Monitor,
  Wifi,
  // Economy/Finance icons
  DollarSign,
  TrendingUp,
  Banknote,
  CreditCard,
  // Career icons
  Building,
  Users,
  // Layout/Organization icons
  LayoutDashboard,
  // Help icons
  HelpCircle,
} from 'lucide-react'

const iconMap: Record<string, any> = {
  Target, Trophy, Star, Heart, Zap, BookOpen, Dumbbell, Car, Home, Briefcase, GraduationCap, Music, Camera, Plane, TreePine, Coffee, Gamepad2, Paintbrush, Utensils, ShoppingBag,
  Smile, Laugh, ThumbsUp, Sparkles, Sun, Moon, Rainbow, Droplets, Leaf, Mountain, Waves, Flower2,
  Bird, Fish, Cat, Dog, Rabbit,
  Bot, Ghost, Skull, Crown, Gem, Key, Lock, Shield, Compass, Map, Globe, Flag, Medal, Award, Gift,
  Cake, Cookie, Pizza, Apple, Banana, Cherry, Grape, Carrot,
  ArrowUp, ArrowRight, ArrowDown, ArrowLeft,
  User, MapPin, Phone, Mail, Search, Wallet, Coins,
  // Health icons
  Activity, HeartPulse, Stethoscope, Pill,
  // Technology icons
  Cpu, Smartphone, Laptop, Code, Monitor, Wifi,
  // Economy/Finance icons
  DollarSign, TrendingUp, Banknote, CreditCard,
  // Career icons
  Building, Users,
  // Layout/Organization icons
  LayoutDashboard,
  // Help icons
  HelpCircle
}

// Map emoji icons to outline icons
const emojiToIconMap: Record<string, string> = {
  '💰': 'Wallet', // Money bag emoji -> Wallet icon
  '🌱': 'Leaf',    // Seedling emoji -> Leaf icon
  '🎯': 'Target'   // Target emoji -> Target icon (already handled, but for consistency)
}

const emojiMap: Record<string, string> = {
  Target: '🎯', Trophy: '🏆', Star: '⭐', Heart: '❤️', Zap: '⚡', BookOpen: '📖', Dumbbell: '🏋️', Car: '🚗', Home: '🏠', Briefcase: '💼', GraduationCap: '🎓', Music: '🎵', Camera: '📷', Plane: '✈️', TreePine: '🌲', Coffee: '☕', Gamepad2: '🎮', Paintbrush: '🎨', Utensils: '🍽️', ShoppingBag: '🛍️',
  Smile: '😊', Laugh: '😂', ThumbsUp: '👍', Sparkles: '✨', Sun: '☀️', Moon: '🌙', Rainbow: '🌈', Droplets: '💧', Leaf: '🍃', Mountain: '🏔️', Waves: '🌊', Flower2: '🌸',
  Bird: '🐦', Fish: '🐟', Cat: '🐱', Dog: '🐶', Rabbit: '🐰',
  Bot: '🤖', Ghost: '👻', Skull: '💀', Crown: '👑', Gem: '💎', Key: '🗝️', Lock: '🔒', Shield: '🛡️', Compass: '🧭', Map: '🗺️', Globe: '🌍', Flag: '🏳️', Medal: '🏅', Award: '🏆', Gift: '🎁',
  Cake: '🎂', Cookie: '🍪', Pizza: '🍕', Apple: '🍎', Banana: '🍌', Cherry: '🍒', Grape: '🍇', Carrot: '🥕',
  ArrowUp: '⬆️', ArrowRight: '➡️', ArrowDown: '⬇️', ArrowLeft: '⬅️',
  // Health icons
  Activity: '📊', HeartPulse: '💓', Stethoscope: '🩺', Pill: '💊',
  // Technology icons
  Cpu: '💻', Smartphone: '📱', Laptop: '💻', Code: '💻', Monitor: '🖥️', Wifi: '📶',
  // Economy/Finance icons
  DollarSign: '💵', TrendingUp: '📈', Banknote: '💵', CreditCard: '💳',
  // Career icons
  Building: '🏢', Users: '👥',
  // Layout/Organization icons
  LayoutDashboard: '📊'
}

export function getIconComponent(iconName?: string | null) {
  if (!iconName || iconName === '🎯') {
    return Target // Default icon
  }
  
  // Check if it's an emoji that needs to be mapped to an outline icon
  if (emojiToIconMap[iconName]) {
    const mappedIconName = emojiToIconMap[iconName]
    const icon = iconMap[mappedIconName]
    if (icon) {
      return icon
    }
  }
  
  // Check if it's a direct icon name
  const icon = iconMap[iconName]
  if (!icon) {
    console.warn(`Icon "${iconName}" not found in iconMap, using Target as default`)
    return Target // Default icon
  }
  return icon
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

// List of available outline icons for goals
export const AVAILABLE_ICONS = [
  { name: 'Target', label: 'Cíl' },
  { name: 'User', label: 'Uživatel' },
  { name: 'Home', label: 'Domov' },
  { name: 'MapPin', label: 'Lokace' },
  { name: 'Phone', label: 'Telefon' },
  { name: 'Globe', label: 'Globus' },
  { name: 'Mail', label: 'Email' },
  { name: 'Heart', label: 'Srdce' },
  { name: 'Star', label: 'Hvězda' },
  { name: 'Trophy', label: 'Trofej' },
  { name: 'Briefcase', label: 'Aktovka' },
  { name: 'GraduationCap', label: 'Vzdělání' },
  { name: 'BookOpen', label: 'Kniha' },
  { name: 'Music', label: 'Hudba' },
  { name: 'Camera', label: 'Fotoaparát' },
  { name: 'Plane', label: 'Letadlo' },
  { name: 'Car', label: 'Auto' },
  { name: 'Dumbbell', label: 'Cvičení' },
  { name: 'Coffee', label: 'Káva' },
  { name: 'Utensils', label: 'Jídlo' },
  { name: 'ShoppingBag', label: 'Nákup' },
  { name: 'Paintbrush', label: 'Malování' },
  { name: 'Gamepad2', label: 'Hry' },
  { name: 'TreePine', label: 'Příroda' },
  { name: 'Mountain', label: 'Hora' },
  { name: 'Waves', label: 'Vlny' },
  { name: 'Sun', label: 'Slunce' },
  { name: 'Moon', label: 'Měsíc' },
  { name: 'Sparkles', label: 'Jiskry' },
  { name: 'Key', label: 'Klíč' },
  { name: 'Lock', label: 'Zámek' },
  { name: 'Shield', label: 'Štít' },
  { name: 'Compass', label: 'Kompas' },
  { name: 'Map', label: 'Mapa' },
  { name: 'Flag', label: 'Vlajka' },
  { name: 'Gift', label: 'Dárek' },
  { name: 'Crown', label: 'Koruna' },
  { name: 'Gem', label: 'Drahokam' },
  { name: 'Medal', label: 'Medaile' },
  { name: 'Award', label: 'Ocenění' },
  { name: 'Zap', label: 'Blesk' },
  { name: 'Smile', label: 'Úsměv' },
  { name: 'ThumbsUp', label: 'Palec nahoru' },
  { name: 'Rainbow', label: 'Duha' },
  { name: 'Droplets', label: 'Kapky' },
  { name: 'Leaf', label: 'List' },
  { name: 'Flower2', label: 'Květina' },
  { name: 'Bird', label: 'Pták' },
  { name: 'Fish', label: 'Ryba' },
  { name: 'Cat', label: 'Kočka' },
  { name: 'Dog', label: 'Pes' },
  { name: 'Rabbit', label: 'Králík' },
  { name: 'Bot', label: 'Robot' },
  { name: 'Ghost', label: 'Duch' },
  { name: 'Skull', label: 'Lebka' },
  { name: 'Cake', label: 'Dort' },
  { name: 'Cookie', label: 'Sušenka' },
  { name: 'Pizza', label: 'Pizza' },
  { name: 'Apple', label: 'Jablko' },
  { name: 'Banana', label: 'Banán' },
  { name: 'Cherry', label: 'Třešně' },
  { name: 'Grape', label: 'Hrozny' },
  { name: 'Carrot', label: 'Mrkev' },
  // Health icons
  { name: 'Activity', label: 'Aktivita' },
  { name: 'HeartPulse', label: 'Zdraví' },
  { name: 'Stethoscope', label: 'Lékař' },
  { name: 'Pill', label: 'Léky' },
  // Technology icons
  { name: 'Cpu', label: 'Počítač' },
  { name: 'Smartphone', label: 'Smartphone' },
  { name: 'Laptop', label: 'Laptop' },
  { name: 'Code', label: 'Kód' },
  { name: 'Monitor', label: 'Monitor' },
  { name: 'Wifi', label: 'WiFi' },
  // Economy/Finance icons
  { name: 'DollarSign', label: 'Dolar' },
  { name: 'TrendingUp', label: 'Růst' },
  { name: 'Banknote', label: 'Bankovka' },
  { name: 'CreditCard', label: 'Kreditka' },
  { name: 'Wallet', label: 'Peněženka' },
  { name: 'Coins', label: 'Mince' },
  // Career icons
  { name: 'Building', label: 'Budova' },
  { name: 'Users', label: 'Tým' },
  // Layout/Organization icons
  { name: 'LayoutDashboard', label: 'Přehled' },
] as const

export type IconName = typeof AVAILABLE_ICONS[number]['name']