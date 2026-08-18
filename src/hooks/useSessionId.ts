import { useEffect, useState } from 'react'

const KEY = 'jaci_session'

/**
 * A stable, per-browser session id used to track secret-answer attempts
 * server-side (and to resume the experience after a refresh).
 */
export function useSessionId(): string {
  const [id, setId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    try {
      let value = window.localStorage.getItem(KEY)
      if (!value) {
        value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
        window.localStorage.setItem(KEY, value)
      }
      return value
    } catch {
      return `mem-${Math.random().toString(36).slice(2, 10)}`
    }
  })

  useEffect(() => {
    if (!id) return
    try {
      window.localStorage.setItem(KEY, id)
    } catch {
      // ignore
    }
  }, [id])

  return id
}
