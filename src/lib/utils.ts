export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Parse an ISO date ("2026-08-22") into a local Date at midnight. */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10))
  return new Date(y || 0, (m || 1) - 1, d || 1)
}

export interface RevealDateParts {
  day: string
  month: string
  year: string
}

export function revealDateParts(iso: string): RevealDateParts {
  const date = parseIsoDate(iso)
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ]
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: months[date.getMonth()] || '',
    year: String(date.getFullYear()),
  }
}

export function dateLabel(iso: string): string {
  const parts = revealDateParts(iso)
  return `${parts.day}.${parts.month ? iso.slice(5, 7) : ''}.${parts.year}`
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

export function countdownTo(iso: string, now = new Date()): CountdownParts {
  const target = parseIsoDate(iso)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  }
}

/** True when the given ISO date is today (or already passed). */
export function isBirthdayNow(iso: string, now = new Date()): boolean {
  return parseIsoDate(iso).getTime() - now.getTime() <= 0
}
