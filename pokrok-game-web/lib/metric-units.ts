// Metric units configuration
export type MetricType = 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'

export interface UnitOption {
  value: string
  label: string
  type: MetricType
}

// Helper function to get localized unit label
function getLocalizedUnitLabel(value: string, type: MetricType, locale: string = 'en'): string {
  const isCzech = locale === 'cs' || locale.startsWith('cs-')
  
  // Currency units - same for all locales (use ISO codes)
  if (type === 'currency') {
    const currencyLabels: Record<string, { en: string; cs: string }> = {
      'CZK': { en: 'CZK (Kč)', cs: 'CZK (Kč)' },
      'USD': { en: 'USD ($)', cs: 'USD ($)' },
      'EUR': { en: 'EUR (€)', cs: 'EUR (€)' },
      'GBP': { en: 'GBP (£)', cs: 'GBP (£)' },
      'PLN': { en: 'PLN (zł)', cs: 'PLN (zł)' },
      'JPY': { en: 'JPY (¥)', cs: 'JPY (¥)' },
      'CHF': { en: 'CHF (Fr)', cs: 'CHF (Fr)' },
      'AUD': { en: 'AUD (A$)', cs: 'AUD (A$)' },
      'CAD': { en: 'CAD (C$)', cs: 'CAD (C$)' },
    }
    return currencyLabels[value]?.[isCzech ? 'cs' : 'en'] || value
  }
  
  // Distance units
  if (type === 'distance') {
    const distanceLabels: Record<string, { en: string; cs: string }> = {
      'm': { en: 'm (meters)', cs: 'm (metry)' },
      'km': { en: 'km (kilometers)', cs: 'km (kilometry)' },
      'mi': { en: 'mi (miles)', cs: 'mi (míle)' },
      'ft': { en: 'ft (feet)', cs: 'ft (stopy)' },
      'yd': { en: 'yd (yards)', cs: 'yd (yardy)' },
    }
    return distanceLabels[value]?.[isCzech ? 'cs' : 'en'] || value
  }
  
  // Weight units
  if (type === 'weight') {
    const weightLabels: Record<string, { en: string; cs: string }> = {
      'kg': { en: 'kg (kilograms)', cs: 'kg (kilogramy)' },
      'g': { en: 'g (grams)', cs: 'g (gramy)' },
      'lbs': { en: 'lbs (pounds)', cs: 'lbs (libry)' },
      'oz': { en: 'oz (ounces)', cs: 'oz (unce)' },
    }
    return weightLabels[value]?.[isCzech ? 'cs' : 'en'] || value
  }
  
  // Time units
  if (type === 'time') {
    const timeLabels: Record<string, { en: string; cs: string }> = {
      's': { en: 's (seconds)', cs: 's (sekundy)' },
      'min': { en: 'min (minutes)', cs: 'min (minuty)' },
      'h': { en: 'h (hours)', cs: 'h (hodiny)' },
      'd': { en: 'd (days)', cs: 'd (dny)' },
      'w': { en: 'w (weeks)', cs: 't (týdny)' },
      'mo': { en: 'mo (months)', cs: 'měs (měsíce)' },
      'y': { en: 'y (years)', cs: 'r (roky)' },
    }
    return timeLabels[value]?.[isCzech ? 'cs' : 'en'] || value
  }
  
  // Percentage
  if (type === 'percentage') {
    return isCzech ? '% (procento)' : '% (percent)'
  }
  
  // Number units
  if (type === 'number') {
    const numberLabels: Record<string, { en: string; cs: string }> = {
      '': { en: '(none)', cs: '(žádná)' },
      'pieces': { en: 'pieces', cs: 'ks (kusy)' },
      'items': { en: 'items', cs: 'položky' },
      'units': { en: 'units', cs: 'jednotky' },
      'times': { en: 'times', cs: 'krát' },
    }
    return numberLabels[value]?.[isCzech ? 'cs' : 'en'] || value
  }
  
  return value
}

// Common currency codes (ISO 4217) - base definitions
const CURRENCIES_BASE: Array<{ value: string; type: MetricType }> = [
  { value: 'CZK', type: 'currency' },
  { value: 'USD', type: 'currency' },
  { value: 'EUR', type: 'currency' },
  { value: 'GBP', type: 'currency' },
  { value: 'PLN', type: 'currency' },
  { value: 'JPY', type: 'currency' },
  { value: 'CHF', type: 'currency' },
  { value: 'AUD', type: 'currency' },
  { value: 'CAD', type: 'currency' },
]

// Distance units - base definitions
const DISTANCE_UNITS_BASE: Array<{ value: string; type: MetricType }> = [
  { value: 'm', type: 'distance' },
  { value: 'km', type: 'distance' },
  { value: 'mi', type: 'distance' },
  { value: 'ft', type: 'distance' },
  { value: 'yd', type: 'distance' },
]

// Weight units - base definitions
const WEIGHT_UNITS_BASE: Array<{ value: string; type: MetricType }> = [
  { value: 'kg', type: 'weight' },
  { value: 'g', type: 'weight' },
  { value: 'lbs', type: 'weight' },
  { value: 'oz', type: 'weight' },
]

// Time units - base definitions
const TIME_UNITS_BASE: Array<{ value: string; type: MetricType }> = [
  { value: 's', type: 'time' },
  { value: 'min', type: 'time' },
  { value: 'h', type: 'time' },
  { value: 'd', type: 'time' },
  { value: 'w', type: 'time' },
  { value: 'mo', type: 'time' },
  { value: 'y', type: 'time' },
]

// Percentage - base definitions
const PERCENTAGE_UNITS_BASE: Array<{ value: string; type: MetricType }> = [
  { value: '%', type: 'percentage' },
]

// Common number units - base definitions
const NUMBER_UNITS_BASE: Array<{ value: string; type: MetricType }> = [
  { value: '', type: 'number' },
  { value: 'pieces', type: 'number' },
  { value: 'items', type: 'number' },
  { value: 'units', type: 'number' },
  { value: 'times', type: 'number' },
]

// Helper function to create localized unit options
function createLocalizedUnits(units: Array<{ value: string; type: MetricType }>, locale: string = 'en'): UnitOption[] {
  return units.map(unit => ({
    value: unit.value,
    label: getLocalizedUnitLabel(unit.value, unit.type, locale),
    type: unit.type,
  }))
}

// Legacy exports for backwards compatibility (default to English)
export const CURRENCIES: UnitOption[] = createLocalizedUnits(CURRENCIES_BASE, 'en')
export const DISTANCE_UNITS: UnitOption[] = createLocalizedUnits(DISTANCE_UNITS_BASE, 'en')
export const WEIGHT_UNITS: UnitOption[] = createLocalizedUnits(WEIGHT_UNITS_BASE, 'en')
export const TIME_UNITS: UnitOption[] = createLocalizedUnits(TIME_UNITS_BASE, 'en')
export const PERCENTAGE_UNITS: UnitOption[] = createLocalizedUnits(PERCENTAGE_UNITS_BASE, 'en')
export const NUMBER_UNITS: UnitOption[] = createLocalizedUnits(NUMBER_UNITS_BASE, 'en')

// Get units by type with localization
export function getUnitsByType(type: MetricType, weightPreference: 'kg' | 'lbs' = 'kg', locale: string = 'en'): UnitOption[] {
  switch (type) {
    case 'currency':
      return createLocalizedUnits(CURRENCIES_BASE, locale)
    case 'distance':
      return createLocalizedUnits(DISTANCE_UNITS_BASE, locale)
    case 'weight':
      // Return preferred unit first
      const weightUnits = createLocalizedUnits(WEIGHT_UNITS_BASE, locale)
      return weightPreference === 'lbs' 
        ? [...weightUnits.filter(u => u.value === 'lbs'), ...weightUnits.filter(u => u.value !== 'lbs')]
        : [...weightUnits.filter(u => u.value === 'kg'), ...weightUnits.filter(u => u.value !== 'kg')]
    case 'time':
      return createLocalizedUnits(TIME_UNITS_BASE, locale)
    case 'percentage':
      return createLocalizedUnits(PERCENTAGE_UNITS_BASE, locale)
    case 'number':
      return createLocalizedUnits(NUMBER_UNITS_BASE, locale)
    case 'custom':
      return [] // For custom, user can enter any unit
    default:
      return createLocalizedUnits(NUMBER_UNITS_BASE, locale)
  }
}

// Get default currency based on locale
export function getDefaultCurrencyByLocale(locale: string): string {
  const localeToCurrency: Record<string, string> = {
    'cs': 'CZK',
    'cs-CZ': 'CZK',
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-AU': 'AUD',
    'en-CA': 'CAD',
    'de': 'EUR',
    'de-DE': 'EUR',
    'fr': 'EUR',
    'fr-FR': 'EUR',
    'it': 'EUR',
    'it-IT': 'EUR',
    'es': 'EUR',
    'es-ES': 'EUR',
    'pl': 'PLN',
    'pl-PL': 'PLN',
    'ja': 'JPY',
    'ja-JP': 'JPY',
    'zh': 'USD',
    'zh-CN': 'USD',
  }
  
  return localeToCurrency[locale] || localeToCurrency[locale.split('-')[0]] || 'USD'
}

// Check if two units are compatible (same unit or convertible)
export function areUnitsCompatible(unit1: string | null | undefined, unit2: string | null | undefined): boolean {
  // Both null/empty are compatible
  if ((!unit1 || unit1 === '') && (!unit2 || unit2 === '')) return true
  // If one is null/empty and other is not, they're not compatible
  if ((!unit1 || unit1 === '') || (!unit2 || unit2 === '')) return false
  if (unit1 === unit2) return true
  
  // Weight conversions (kg <-> lbs)
  const weightGroups = [
    ['kg', 'g'], // metric
    ['lbs', 'oz'], // imperial
  ]
  for (const group of weightGroups) {
    if (group.includes(unit1) && group.includes(unit2)) return true
  }
  
  // Distance conversions
  const distanceGroups = [
    ['m', 'km', 'cm'], // metric
    ['ft', 'yd', 'mi'], // imperial
  ]
  for (const group of distanceGroups) {
    if (group.includes(unit1) && group.includes(unit2)) return true
  }
  
  return false
}

// Convert a value from one unit to another (same type only)
export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value
  
  // Distance conversions (metric)
  if (['m', 'km', 'cm'].includes(fromUnit) && ['m', 'km', 'cm'].includes(toUnit)) {
    // Convert to meters first
    let meters = value
    if (fromUnit === 'km') meters = value * 1000
    else if (fromUnit === 'cm') meters = value / 100
    else if (fromUnit === 'm') meters = value
    
    // Convert from meters to target unit
    if (toUnit === 'km') return meters / 1000
    else if (toUnit === 'cm') return meters * 100
    else if (toUnit === 'm') return meters
  }
  
  // Distance conversions (imperial)
  if (['ft', 'yd', 'mi'].includes(fromUnit) && ['ft', 'yd', 'mi'].includes(toUnit)) {
    // Convert to feet first
    let feet = value
    if (fromUnit === 'mi') feet = value * 5280
    else if (fromUnit === 'yd') feet = value * 3
    else if (fromUnit === 'ft') feet = value
    
    // Convert from feet to target unit
    if (toUnit === 'mi') return feet / 5280
    else if (toUnit === 'yd') return feet / 3
    else if (toUnit === 'ft') return feet
  }
  
  // Weight conversions (metric)
  if (['kg', 'g'].includes(fromUnit) && ['kg', 'g'].includes(toUnit)) {
    if (fromUnit === 'g' && toUnit === 'kg') return value / 1000
    if (fromUnit === 'kg' && toUnit === 'g') return value * 1000
  }
  
  // Weight conversions (imperial)
  if (['lbs', 'oz'].includes(fromUnit) && ['lbs', 'oz'].includes(toUnit)) {
    if (fromUnit === 'oz' && toUnit === 'lbs') return value / 16
    if (fromUnit === 'lbs' && toUnit === 'oz') return value * 16
  }
  
  // If units are not compatible, return original value
  return value
}

// Get the best unit to display for a group of compatible units (prefer larger base units)
export function getBestDisplayUnit(units: string[]): string {
  if (units.length === 0) return ''
  if (units.length === 1) return units[0]
  
  // For distance (metric), prefer meters or kilometers depending on typical values
  const metricDistance = ['m', 'km', 'cm']
  const hasMetric = units.some(u => metricDistance.includes(u))
  if (hasMetric) {
    // Prefer meters for display (can show decimals nicely)
    if (units.includes('m')) return 'm'
    if (units.includes('km')) return 'km'
    if (units.includes('cm')) return 'cm'
  }
  
  // For distance (imperial), prefer feet
  const imperialDistance = ['ft', 'yd', 'mi']
  const hasImperial = units.some(u => imperialDistance.includes(u))
  if (hasImperial) {
    if (units.includes('ft')) return 'ft'
    if (units.includes('yd')) return 'yd'
    if (units.includes('mi')) return 'mi'
  }
  
  // For weight (metric), prefer kg
  const metricWeight = ['kg', 'g']
  const hasMetricWeight = units.some(u => metricWeight.includes(u))
  if (hasMetricWeight) {
    if (units.includes('kg')) return 'kg'
    if (units.includes('g')) return 'g'
  }
  
  // For weight (imperial), prefer lbs
  const imperialWeight = ['lbs', 'oz']
  const hasImperialWeight = units.some(u => imperialWeight.includes(u))
  if (hasImperialWeight) {
    if (units.includes('lbs')) return 'lbs'
    if (units.includes('oz')) return 'oz'
  }
  
  // Default: return first unit
  return units[0]
}

// Group metrics by compatible units
export interface GroupedMetric {
  unit: string | null
  metrics: Array<{
    id: string
    name: string
    current_value: number
    target_value: number
    initial_value: number
    unit: string | null
  }>
  totalCurrent: number
  totalTarget: number
  totalInitial: number
}

export function groupMetricsByUnits(metrics: Array<{
  id: string
  name: string
  current_value: number
  target_value: number
  initial_value: number
  unit: string | null
}>): GroupedMetric[] {
  const groups: Map<string, GroupedMetric> = new Map()
  
  for (const metric of metrics) {
    // Normalize unit (null/empty becomes empty string for grouping)
    const normalizedUnit = metric.unit || ''
    
    // Find compatible group or create new one
    let groupKey: string | null = null
    const groupKeys = Array.from(groups.keys())
    for (const key of groupKeys) {
      if (areUnitsCompatible(normalizedUnit, key)) {
        groupKey = key
        break
      }
    }
    
    if (!groupKey) {
      // Create new group with this unit
      groupKey = normalizedUnit
      groups.set(groupKey, {
        unit: normalizedUnit || null,
        metrics: [],
        totalCurrent: 0,
        totalTarget: 0,
        totalInitial: 0
      })
    }
    
    const group = groups.get(groupKey)!
    
    // Add metric to group first
    group.metrics.push(metric)
    
    // Convert metric values to group's unit and add to totals
    // If units are null/empty, no conversion needed
    const fromUnit = metric.unit || ''
    const toUnit = group.unit || ''
    
    // Ensure values are numbers before conversion
    const currentValue = parseFloat(String(metric.current_value || 0))
    const targetValue = parseFloat(String(metric.target_value || 0))
    const initialValue = parseFloat(String(metric.initial_value || 0))
    
    const convertedCurrent = fromUnit && toUnit && !isNaN(currentValue) ? convertUnit(currentValue, fromUnit, toUnit) : (isNaN(currentValue) ? 0 : currentValue)
    const convertedTarget = fromUnit && toUnit && !isNaN(targetValue) ? convertUnit(targetValue, fromUnit, toUnit) : (isNaN(targetValue) ? 0 : targetValue)
    const convertedInitial = fromUnit && toUnit && !isNaN(initialValue) ? convertUnit(initialValue, fromUnit, toUnit) : (isNaN(initialValue) ? 0 : initialValue)
    
    // Only add if values are valid numbers
    if (!isNaN(convertedCurrent) && isFinite(convertedCurrent)) {
      group.totalCurrent += convertedCurrent
    }
    if (!isNaN(convertedTarget) && isFinite(convertedTarget)) {
      group.totalTarget += convertedTarget
    }
    if (!isNaN(convertedInitial) && isFinite(convertedInitial)) {
      group.totalInitial += convertedInitial
    }
  }
  
  // Convert all groups to best display unit
  const result: GroupedMetric[] = []
  const groupValues = Array.from(groups.values())
  for (const group of groupValues) {
    if (group.metrics.length > 1) {
      // Multiple metrics in group - convert to best unit
      const units = group.metrics.map(m => m.unit).filter((u): u is string => !!u)
      if (units.length > 0) {
        const bestUnit = getBestDisplayUnit(units)
        
        if (bestUnit !== group.unit) {
          // Convert totals to best unit
          const fromUnit = group.unit || ''
          const toUnit = bestUnit
          if (fromUnit && toUnit) {
            group.totalCurrent = convertUnit(group.totalCurrent, fromUnit, toUnit)
            group.totalTarget = convertUnit(group.totalTarget, fromUnit, toUnit)
            group.totalInitial = convertUnit(group.totalInitial, fromUnit, toUnit)
            group.unit = bestUnit
          }
        }
      }
    }
    result.push(group)
  }
  
  return result
}
