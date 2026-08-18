// Minimal .env loader for Node contexts (Vite dev plugin + production
// Node server). Real environment variables always take precedence.

import fs from 'node:fs'
import path from 'node:path'

const cache: Record<string, string> = {}
let loaded = false

export function loadEnv(dir = process.cwd()): void {
  if (loaded) return
  loaded = true
  const file = path.join(dir, '.env')
  try {
    const raw = fs.readFileSync(file, 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      let val = t.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (key && process.env[key] === undefined) cache[key] = val
    }
  } catch {
    // No .env file — rely on process.env only.
  }
}

export function env(key: string, fallback = ''): string {
  loadEnv()
  const fromEnv = process.env[key]
  if (fromEnv !== undefined && fromEnv !== '') return fromEnv
  return cache[key] ?? fallback
}
