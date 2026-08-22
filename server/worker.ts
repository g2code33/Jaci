// Cloudflare Workers entry point.
//
// One Worker serves the API (Hono) and Cloudflare's "Workers Assets" serves
// the static Vite build (see wrangler.jsonc — `run_worker_first: ["/api/*"]`
// routes API traffic here while everything else is served from ./dist).
//
// The database is Cloudflare D1 via the `DB` binding (server/storageD1.ts).
// Media uploads go straight to Cloudinary (signed server-side); the Node-only
// local file upload path is not available on Workers.

import { createApp } from './app'
import { createD1Storage, type D1DatabaseLike } from './storageD1'

export interface Env {
  DB: D1DatabaseLike
  ADMIN_PASSWORD?: string
  AUTH_SECRET?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
  CLOUDINARY_FOLDER?: string
}

// The Hono app also holds a per-isolate in-memory map for secret-answer
// attempt limiting. Cache the app per isolate so that map (and the storage
// adapter) survive across requests — otherwise attempts would reset on
// every request.
let cachedApp: ReturnType<typeof createApp> | null = null

function buildApp(env: Env) {
  const cloudinary = env.CLOUDINARY_CLOUD_NAME
    ? {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY || '',
        apiSecret: env.CLOUDINARY_API_SECRET || '',
        folder: env.CLOUDINARY_FOLDER || 'jacinta-birthday',
      }
    : undefined

  return createApp({
    storage: createD1Storage(env.DB),
    authSecret: env.AUTH_SECRET || 'set-a-secret-in-wrangler',
    adminPassword: env.ADMIN_PASSWORD || '',
    cloudinary,
    isProd: true,
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!cachedApp) cachedApp = buildApp(env)
    return cachedApp.fetch(request)
  },
}
