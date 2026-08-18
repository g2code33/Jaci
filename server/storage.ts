// Storage abstraction. Free of Node-only imports so it can run on
// Workers / Vercel. The local file adapter lives in storageFile.ts.

import { DEFAULT_STORE } from '../src/lib/defaults'
import type { Store } from '../src/types/config'

export interface StorageAdapter {
  read(): Promise<Store>
  write(store: Store): Promise<void>
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * In-memory store. Data is lost on restart — use it as a placeholder on
 * serverless runtimes until you wire up Cloudflare KV / D1 / Vercel KV.
 */
export function createMemoryStorage(initial?: Store): StorageAdapter {
  let store = clone(initial ?? DEFAULT_STORE)
  return {
    async read() {
      return store
    },
    async write(next) {
      store = next
    },
  }
}
