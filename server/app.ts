// The framework-agnostic Hono application. Runs on Node (dev plugin +
// production server), and can be mounted on Cloudflare Workers or Vercel.

import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createSessionToken, verifySessionToken } from './auth'
import { buildSignedUpload, type CloudinarySettings } from './cloudinary'
import { safeEqualHex } from './crypto'
import type { StorageAdapter } from './storage'
import { DEFAULT_CONFIG } from '../src/lib/defaults'
import type { BackgroundsConfig, BirthdayConfig, MediaItem, MusicTrack, StageId } from '../src/types/config'

export interface LocalFileStore {
  save(name: string, data: Uint8Array): Promise<{ id: string; url: string }>
  remove(id: string): Promise<void>
  list(): Promise<Array<{ id: string; url: string }>>
}

export interface AppDeps {
  storage: StorageAdapter
  authSecret: string
  adminPassword: string
  cloudinary?: CloudinarySettings
  fileStore?: LocalFileStore
  isProd?: boolean
}

const ADMIN_COOKIE = 'jaci_admin'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

interface AttemptRecord {
  count: number
  resetAt: number
}

export function checkAnswer(guess: string, answer: string, lock: {
  trimWhitespace: boolean
  caseSensitive: boolean
}): boolean {
  let g = guess ?? ''
  let a = answer ?? ''
  if (lock.trimWhitespace) {
    g = g.trim()
    a = a.trim()
  }
  if (!lock.caseSensitive) {
    g = g.toLowerCase()
    a = a.toLowerCase()
  }
  return a.length > 0 && g === a
}

/** Strip dangerous markup from admin-authored rich text (defence in depth). */
function stripDangerousHtml(html: string): string {
  return html
    .replace(/<\s*(script|iframe|object|embed|style|link|meta|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(?:"|')\s*javascript:[^"']*(?:"|')/gi, '$1="#"')
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Shallow-merge an incoming config over the defaults so partial payloads are safe. */
function mergeConfig(incoming: unknown): BirthdayConfig {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as BirthdayConfig
  if (!incoming || typeof incoming !== 'object') return base
  const src = incoming as Record<string, unknown>
  for (const key of Object.keys(base) as Array<keyof BirthdayConfig>) {
    const value = src[key]
    if (value === undefined || value === null) continue
    if (typeof value === 'object' && !Array.isArray(value)) {
      ;(base as unknown as Record<string, unknown>)[key] = {
        ...(base[key] as object),
        ...(value as object),
      }
    } else {
      ;(base as unknown as Record<string, unknown>)[key] = value
    }
  }
  base.backgrounds = normalizeBackgrounds((base as unknown as Record<string, unknown>).backgrounds)
  return migrateMusic(base)
}

/** Deep-merge each stage background over defaults so older saves gain new fields. */
function normalizeBackgrounds(value: unknown): BackgroundsConfig {
  const base = DEFAULT_CONFIG.backgrounds
  const incoming = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const out = {} as BackgroundsConfig
  for (const key of Object.keys(base) as StageId[]) {
    const stage = incoming[key]
    out[key] = {
      ...base[key],
      ...(stage && typeof stage === 'object' ? (stage as Record<string, unknown>) : {}),
    } as BackgroundsConfig[StageId]
  }
  return out
}

/**
 * Older configs stored a single `music.url` / `music.title`. Convert those
 * into the new playlist shape so nothing the admin saved is lost.
 */
function migrateMusic(config: BirthdayConfig): BirthdayConfig {
  const music = config.music as unknown as {
    url?: string
    title?: string
    autoplay?: boolean
    tracks?: MusicTrack[]
  }
  if (music.url && (!Array.isArray(music.tracks) || music.tracks.length === 0)) {
    music.tracks = [{ id: 'track-legacy', title: music.title || 'Music', url: music.url }]
  }
  if (!Array.isArray(music.tracks)) music.tracks = []
  delete music.url
  delete music.title
  delete music.autoplay
  return config
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono()
  const attempts = new Map<string, AttemptRecord>()

  async function isAuthed(cookie: string | undefined): Promise<boolean> {
    if (!cookie) return false
    return verifySessionToken(cookie, deps.authSecret)
  }

  function setAdminCookie(c: any, token: string, maxAge: number) {
    setCookie(c, ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: !!deps.isProd,
      maxAge,
    })
  }

  // ─────────────────────────────────────────────────────────────
  // Public
  // ─────────────────────────────────────────────────────────────

  app.get('/api/config', async (c) => {
    const store = await deps.storage.read()
    // Merge over defaults so configs saved by older versions still get
    // any newly-added fields filled in.
    const config = mergeConfig(store.published)
    return c.json({
      config,
      meta: {
        cloudName: config.media.cloudName || deps.cloudinary?.cloudName || '',
        publishedAt: store.meta.publishedAt || null,
      },
    })
  })

  app.post('/api/answer', async (c) => {
    const store = await deps.storage.read()
    const lock = store.published.secretLock
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const guess = typeof body.answer === 'string' ? body.answer : ''
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
    const key = sessionId || 'anon'

    if (!lock.answer || lock.answer.trim() === '') {
      return c.json({
        correct: false,
        error: 'not_configured',
        message: 'This surprise is still being prepared. Check back soon ❤️',
      })
    }

    const maxAttempts = Math.max(0, Number(lock.maxAttempts) || 0)
    if (maxAttempts > 0) {
      const rec = attempts.get(key) || { count: 0, resetAt: 0 }
      if (rec.resetAt < Date.now()) rec.count = 0
      if (rec.count >= maxAttempts) {
        return c.json({
          correct: false,
          lockedOut: true,
          message: 'Too many tries — give it a little moment, then try again. ❤️',
        })
      }
    }

    const correct = checkAnswer(guess, lock.answer, lock)
    if (correct) {
      attempts.delete(key)
      return c.json({ correct: true, message: lock.correctMessage || "I knew you'd remember. ❤️" })
    }

    if (maxAttempts > 0) {
      const rec = attempts.get(key) || { count: 0, resetAt: Date.now() + 10 * 60 * 1000 }
      rec.count += 1
      attempts.set(key, rec)
      const remaining = Math.max(0, maxAttempts - rec.count)
      return c.json({ correct: false, attemptsRemaining: remaining, message: lock.wrongMessage })
    }

    return c.json({ correct: false, message: lock.wrongMessage })
  })

  // ─────────────────────────────────────────────────────────────
  // Admin authentication (public endpoints)
  // ─────────────────────────────────────────────────────────────

  app.post('/api/admin/login', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const password = typeof body.password === 'string' ? body.password : ''
    const ok = deps.adminPassword.length > 0 && safeEqualHex(password, deps.adminPassword)
    if (!ok) {
      return c.json({ ok: false, error: 'invalid' }, 401)
    }
    const token = await createSessionToken(deps.authSecret, SESSION_TTL_SECONDS)
    setAdminCookie(c, token, SESSION_TTL_SECONDS)
    return c.json({ ok: true })
  })

  app.post('/api/admin/logout', (c) => {
    deleteCookie(c, ADMIN_COOKIE, { path: '/' })
    return c.json({ ok: true })
  })

  app.get('/api/admin/me', async (c) => {
    const authed = await isAuthed(getCookie(c, ADMIN_COOKIE))
    return c.json({ authed })
  })

  // ─────────────────────────────────────────────────────────────
  // Protected admin routes
  // ─────────────────────────────────────────────────────────────

  app.use('/api/admin/*', async (c, next) => {
    if (!(await isAuthed(getCookie(c, ADMIN_COOKIE)))) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    await next()
  })

  app.get('/api/admin/config', async (c) => {
    const store = await deps.storage.read()
    return c.json({
      draft: mergeConfig(store.draft),
      published: mergeConfig(store.published),
      meta: store.meta,
      cloudinary: deps.cloudinary
        ? { enabled: true, cloudName: deps.cloudinary.cloudName, folder: deps.cloudinary.folder }
        : { enabled: false, cloudName: '', folder: '' },
      localUpload: !!deps.fileStore,
    })
  })

  app.put('/api/admin/config/draft', async (c) => {
    const body = (await c.req.json().catch(() => null)) as unknown
    if (!body || typeof body !== 'object' || typeof (body as any).name !== 'string') {
      return c.json({ ok: false, error: 'invalid_payload' }, 400)
    }
    const store = await deps.storage.read()
    store.draft = mergeConfig(body)
    if (typeof store.draft.letter?.body === 'string') {
      store.draft.letter.body = stripDangerousHtml(store.draft.letter.body)
    }
    store.meta.updatedAt = new Date().toISOString()
    await deps.storage.write(store)
    return c.json({ ok: true, draft: store.draft })
  })

  app.post('/api/admin/config/publish', async (c) => {
    const store = await deps.storage.read()
    store.published = JSON.parse(JSON.stringify(store.draft)) as BirthdayConfig
    store.meta.publishedAt = new Date().toISOString()
    await deps.storage.write(store)
    return c.json({ ok: true, published: store.published, meta: store.meta })
  })

  app.post('/api/admin/config/revert', async (c) => {
    const store = await deps.storage.read()
    store.draft = JSON.parse(JSON.stringify(store.published)) as BirthdayConfig
    await deps.storage.write(store)
    return c.json({ ok: true, draft: store.draft })
  })

  app.post('/api/admin/config/reset', async (c) => {
    const store = await deps.storage.read()
    store.draft = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as BirthdayConfig
    store.published = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as BirthdayConfig
    store.meta = { version: 1, updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString() }
    await deps.storage.write(store)
    return c.json({ ok: true, draft: store.draft })
  })

  // ─── Cloudinary signed upload ───────────────────────────────

  app.post('/api/admin/cloudinary/signature', async (c) => {
    if (!deps.cloudinary) {
      return c.json({ enabled: false })
    }
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const folder = typeof body.folder === 'string' && body.folder ? body.folder : deps.cloudinary.folder
    const publicId = typeof body.publicId === 'string' ? body.publicId : undefined
    const signed = await buildSignedUpload(deps.cloudinary, {
      folder,
      publicId: publicId || undefined,
    })
    return c.json({ enabled: true, ...signed })
  })

  // ─── Local media upload (fallback when Cloudinary isn't set) ─

  app.post('/api/admin/media/local', async (c) => {
    if (!deps.fileStore) {
      return c.json({ ok: false, error: 'local_upload_unavailable' }, 501)
    }
    const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null
    const name = typeof body?.name === 'string' ? body.name : ''
    const type = typeof body?.type === 'string' ? body.type : ''
    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : ''
    if (!name || !dataUrl) return c.json({ ok: false, error: 'invalid_payload' }, 400)

    const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl)
    if (!match) return c.json({ ok: false, error: 'invalid_data_url' }, 400)
    const mime = match[1]
    const buf = base64ToBytes(match[2])
    const maxBytes = 15 * 1024 * 1024
    if (buf.length > maxBytes) return c.json({ ok: false, error: 'too_large' }, 413)

    const saved = await deps.fileStore.save(name, buf)
    const kind = mime.startsWith('video') ? 'video' : mime.startsWith('audio') ? 'audio' : 'image'
    const item: MediaItem = { id: saved.id, kind, url: saved.url, caption: '', alt: name, folder: 'local' }
    return c.json({ ok: true, item })
  })

  app.get('/api/admin/media/local', async (c) => {
    if (!deps.fileStore) return c.json({ ok: true, items: [] })
    const items = await deps.fileStore.list()
    return c.json({ ok: true, items })
  })

  app.delete('/api/admin/media/local/:id', async (c) => {
    if (!deps.fileStore) return c.json({ ok: false, error: 'local_upload_unavailable' }, 501)
    const id = c.req.param('id')
    await deps.fileStore.remove(id)
    return c.json({ ok: true })
  })

  return app
}
