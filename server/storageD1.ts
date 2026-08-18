// Cloudflare D1 storage adapter.
//
// The whole experience is driven by a single centralised `Store` document
// (draft + published config + metadata), so we persist it as one row in a
// D1 table. This keeps the existing `StorageAdapter` interface intact while
// giving durable, globally-replicated storage on Cloudflare.
//
// The structural `D1DatabaseLike` types below are compatible with the real
// `D1Database` binding (env.DB) without requiring @cloudflare/workers-types.

import { DEFAULT_STORE } from '../src/lib/defaults'
import type { Store } from '../src/types/config'
import type { StorageAdapter } from './storage'

const STORE_KEY = 'main'

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(column?: string): Promise<T | null>
  run(): Promise<unknown>
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement
  exec(query: string): Promise<unknown>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createD1Storage(db: D1DatabaseLike): StorageAdapter {
  let ensured = false

  // Best-effort schema setup. The same table is also created by
  // migrations/0001_init.sql; this just makes the store resilient if
  // someone deploys without running migrations.
  const ensure = async () => {
    if (ensured) return
    try {
      await db
        .prepare(
          'CREATE TABLE IF NOT EXISTS config_store (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)',
        )
        .run()
      ensured = true
    } catch (err) {
      console.error('[jaci] could not ensure schema', err)
    }
  }

  const adapter: StorageAdapter = {
    async read() {
      await ensure()
      try {
        const row = await db
          .prepare('SELECT data FROM config_store WHERE id = ?')
          .bind(STORE_KEY)
          .first<string>('data')
        if (row) {
          const parsed = JSON.parse(row) as Store
          if (parsed && parsed.draft && parsed.published && parsed.meta) return parsed
        }
      } catch (err) {
        console.error('[jaci] D1 read failed — falling back to defaults', err)
      }
      // First run (or corrupted row): seed defaults.
      const seed = clone(DEFAULT_STORE)
      try {
        await adapter.write(seed)
      } catch {
        // ignore — will be re-attempted on next write
      }
      return seed
    },

    async write(store) {
      await ensure()
      await db
        .prepare(
          `INSERT INTO config_store (id, data, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        )
        .bind(STORE_KEY, JSON.stringify(store), Date.now())
        .run()
    },
  }

  return adapter
}
