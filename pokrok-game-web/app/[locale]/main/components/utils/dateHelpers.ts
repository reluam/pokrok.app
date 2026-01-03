// Helper functions for date manipulation

export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const normalizeDate = (date: Date | string | null | undefined): string => {
  if (!date) return ''
  
  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date
    }
    if (date.includes('T')) {
      const datePart = date.split('T')[0]
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return datePart
      }
    }
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      if (date.includes('T') && date.includes('Z')) {
        const y = parsed.getUTCFullYear()
        const m = String(parsed.getUTCMonth() + 1).padStart(2, '0')
        const d = String(parsed.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      } else {
        const y = parsed.getFullYear()
        const m = String(parsed.getMonth() + 1).padStart(2, '0')
        const d = String(parsed.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    }
    return ''
  }
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const seconds = date.getUTCSeconds()
    const milliseconds = date.getUTCMilliseconds()
    
    if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
      const y = date.getUTCFullYear()
      const m = String(date.getUTCMonth() + 1).padStart(2, '0')
      const d = String(date.getUTCDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    } else {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
  }
  
  return ''
}

