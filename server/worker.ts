// Cloudflare Workers entry point.
//
// The Hono app is fully runtime-agnostic; only storage differs. For a
// production Workers deployment, swap `createMemoryStorage()` for a KV
// or D1-backed adapter (see README). Local/disk media upload is not
// available on Workers — use Cloudinary.
//
//   wrangler.toml:
//     name = "jaci-birthday"
//     main = "server/worker.ts"
//     [vars] ADMIN_PASSWORD / AUTH_SECRET / CLOUDINARY_* via secrets

import { createApp } from './app'
import { createMemoryStorage } from './storage'

interface Env {
  ADMIN_PASSWORD?: string
  AUTH_SECRET?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  CLOUDINARY_FOLDER?: string
}

const app = createApp({
  storage: createMemoryStorage(),
  authSecret: (globalThis as any).AUTH_SECRET || 'set-a-secret-in-wrangler',
  adminPassword: (globalThis as any).ADMIN_PASSWORD || '',
  cloudinary:
    (globalThis as any).CLOUDINARY_CLOUD_NAME && (globalThis as any).CLOUDINARY_API_KEY
      ? {
          cloudName: (globalThis as any).CLOUDINARY_CLOUD_NAME as string,
          apiKey: (globalThis as any).CLOUDINARY_API_KEY as string,
          apiSecret: (globalThis as any).CLOUDINARY_API_SECRET as string,
          folder: (globalThis as any).CLOUDINARY_FOLDER || 'jacinta-birthday',
        }
      : undefined,
  isProd: true,
})

export default {
  fetch: app.fetch,
}
