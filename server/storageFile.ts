// Local JSON-file storage (Node only). Great for local development and
// single-node deployments. Swap for KV/D1 on Workers or Vercel.

import fs from 'node:fs/promises'
import path from 'node:path'
import { DEFAULT_STORE } from '../src/lib/defaults'
import type { Store } from '../src/types/config'
import type { StorageAdapter } from './storage'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createFileStorage(file: string): StorageAdapter {
  return {
    async read() {
      try {
        const raw = await fs.readFile(file, 'utf8')
        const parsed = JSON.parse(raw) as Store
        if (parsed && parsed.draft && parsed.published && parsed.meta) {
          return parsed
        }
        return clone(DEFAULT_STORE)
      } catch {
        const seed = clone(DEFAULT_STORE)
        try {
          await fs.mkdir(path.dirname(file), { recursive: true })
          await fs.writeFile(file, JSON.stringify(seed, null, 2), 'utf8')
        } catch {
          // read-only filesystem — fall back to memory semantics
        }
        return seed
      }
    },
    async write(store) {
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file, JSON.stringify(store, null, 2), 'utf8')
    },
  }
}
