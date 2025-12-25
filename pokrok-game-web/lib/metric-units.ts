// Metric units configuration
export type MetricType = 'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'

export interface UnitOption {
  value: string
  label: string
  type: MetricType
}

// Common currency codes (ISO 4217)
export const CURRENCIES: UnitOption[] = [
  { value: 'CZK', label: 'CZK (Kč)', type: 'currency' },
  { value: 'USD', label: 'USD ($)', type: 'currency' },
  { value: 'EUR', label: 'EUR (€)', type: 'currency' },
  { value: 'GBP', label: 'GBP (£)', type: 'currency' },
  { value: 'PLN', label: 'PLN (zł)', type: 'currency' },
  { value: 'JPY', label: 'JPY (¥)', type: 'currency' },
  { value: 'CHF', label: 'CHF (Fr)', type: 'currency' },
  { value: 'AUD', label: 'AUD (A$)', type: 'currency' },
  { value: 'CAD', label: 'CAD (C$)', type: 'currency' },
]

// Distance units
export const DISTANCE_UNITS: UnitOption[] = [
  { value: 'm', label: 'm (meters)', type: 'distance' },
  { value: 'km', label: 'km (kilometers)', type: 'distance' },
  { value: 'mi', label: 'mi (miles)', type: 'distance' },
  { value: 'ft', label: 'ft (feet)', type: 'distance' },
  { value: 'yd', label: 'yd (yards)', type: 'distance' },
]

// Weight units
export const WEIGHT_UNITS: UnitOption[] = [
  { value: 'kg', label: 'kg (kilograms)', type: 'weight' },
  { value: 'g', label: 'g (grams)', type: 'weight' },
  { value: 'lbs', label: 'lbs (pounds)', type: 'weight' },
  { value: 'oz', label: 'oz (ounces)', type: 'weight' },
]

// Time units
export const TIME_UNITS: UnitOption[] = [
  { value: 's', label: 's (seconds)', type: 'time' },
  { value: 'min', label: 'min (minutes)', type: 'time' },
  { value: 'h', label: 'h (hours)', type: 'time' },
  { value: 'd', label: 'd (days)', type: 'time' },
  { value: 'w', label: 'w (weeks)', type: 'time' },
  { value: 'mo', label: 'mo (months)', type: 'time' },
  { value: 'y', label: 'y (years)', type: 'time' },
]

// Percentage
export const PERCENTAGE_UNITS: UnitOption[] = [
  { value: '%', label: '% (percent)', type: 'percentage' },
]

// Common number units
export const NUMBER_UNITS: UnitOption[] = [
  { value: '', label: '(none)', type: 'number' },
  { value: 'pieces', label: 'pieces', type: 'number' },
  { value: 'items', label: 'items', type: 'number' },
  { value: 'units', label: 'units', type: 'number' },
  { value: 'times', label: 'times', type: 'number' },
]

// Get units by type
export function getUnitsByType(type: MetricType, weightPreference: 'kg' | 'lbs' = 'kg'): UnitOption[] {
  switch (type) {
    case 'currency':
      return CURRENCIES
    case 'distance':
      return DISTANCE_UNITS
    case 'weight':
      // Return preferred unit first
      return weightPreference === 'lbs' 
        ? [...WEIGHT_UNITS.filter(u => u.value === 'lbs'), ...WEIGHT_UNITS.filter(u => u.value !== 'lbs')]
        : [...WEIGHT_UNITS.filter(u => u.value === 'kg'), ...WEIGHT_UNITS.filter(u => u.value !== 'kg')]
    case 'time':
      return TIME_UNITS
    case 'percentage':
      return PERCENTAGE_UNITS
    case 'number':
      return NUMBER_UNITS
    case 'custom':
      return [] // For custom, user can enter any unit
    default:
      return NUMBER_UNITS
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
  
  return localeToCurrency[locale] || 'USD'
}

// Check if two units are compatible (same unit or convertible)
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
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
  unit: string
  metrics: Array<{
    id: string
    name: string
    current_value: number
    target_value: number
    initial_value: number
    unit: string
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
  unit: string
}>): GroupedMetric[] {
  const groups: Map<string, GroupedMetric> = new Map()
  
  for (const metric of metrics) {
    // Find compatible group or create new one
    let groupKey: string | null = null
    for (const [key] of groups) {
      if (areUnitsCompatible(metric.unit, key)) {
        groupKey = key
        break
      }
    }
    
    if (!groupKey) {
      // Create new group with this unit
      groupKey = metric.unit
      groups.set(groupKey, {
        unit: metric.unit,
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
    const convertedCurrent = convertUnit(metric.current_value, metric.unit, group.unit)
    const convertedTarget = convertUnit(metric.target_value, metric.unit, group.unit)
    const convertedInitial = convertUnit(metric.initial_value || 0, metric.unit, group.unit)
    
    group.totalCurrent += convertedCurrent
    group.totalTarget += convertedTarget
    group.totalInitial += convertedInitial
  }
  
  // Convert all groups to best display unit
  const result: GroupedMetric[] = []
  for (const group of groups.values()) {
    if (group.metrics.length > 1) {
      // Multiple metrics in group - convert to best unit
      const units = group.metrics.map(m => m.unit)
      const bestUnit = getBestDisplayUnit(units)
      
      if (bestUnit !== group.unit) {
        // Convert totals to best unit
        group.totalCurrent = convertUnit(group.totalCurrent, group.unit, bestUnit)
        group.totalTarget = convertUnit(group.totalTarget, group.unit, bestUnit)
        group.totalInitial = convertUnit(group.totalInitial, group.unit, bestUnit)
        group.unit = bestUnit
      }
    }
    result.push(group)
  }
  
  return result
}

