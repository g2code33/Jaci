// Node entry: wires up environment, file storage, local uploads and
// static serving into the Hono app. Used by both the Vite dev plugin
// and the production Node server.

import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp, type LocalFileStore } from './app'
import { env } from './env'
import { randomHex } from './crypto'
import type { CloudinarySettings } from './cloudinary'
import { createFileStorage } from './storageFile'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.aac': 'audio/aac',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

function safeName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  return base || 'file'
}

export function createLocalFileStore(dir: string): LocalFileStore {
  return {
    async save(name, data) {
      const id = `${Date.now().toString(36)}-${randomHex(6)}`
      const filename = `${id}-${safeName(name)}`
      await fsPromises.mkdir(dir, { recursive: true })
      await fsPromises.writeFile(path.join(dir, filename), data)
      return { id, url: `/media/${encodeURIComponent(filename)}` }
    },
    async remove(id) {
      try {
        const files = await fsPromises.readdir(dir)
        for (const f of files) {
          if (f.startsWith(`${id}-`)) {
            await fsPromises.unlink(path.join(dir, f))
          }
        }
      } catch {
        // ignore
      }
    },
    async list() {
      try {
        const files = await fsPromises.readdir(dir)
        return files
          .map((f) => {
            const id = f.split('-')[0]
            return { id, url: `/media/${encodeURIComponent(f)}` }
          })
          .sort((a, b) => b.url.localeCompare(a.url))
      } catch {
        return []
      }
    },
  }
}

function cloudinaryFromEnv(): CloudinarySettings | undefined {
  const cloudName = env('CLOUDINARY_CLOUD_NAME')
  if (!cloudName) return undefined
  return {
    cloudName,
    apiKey: env('CLOUDINARY_API_KEY', ''),
    apiSecret: env('CLOUDINARY_API_SECRET', ''),
    folder: env('CLOUDINARY_FOLDER', 'jacinta-birthday'),
  }
}

function sendFile(c: any, filePath: string): Response {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    },
  })
}

export interface NodeAppOptions {
  /** If true, serve the built SPA from dist/ (production mode). */
  serveStatic?: boolean
  distDir?: string
  storagePath?: string
}

export function createNodeApp(options: NodeAppOptions = {}) {
  const isProd = process.env.NODE_ENV === 'production'
  const storagePath =
    options.storagePath || env('STORAGE_PATH', path.join(REPO_ROOT, 'data', 'config.json'))
  const uploadsDir = path.join(path.dirname(storagePath), 'uploads')
  const distDir = options.distDir || path.join(REPO_ROOT, 'dist')

  const adminPassword = env('ADMIN_PASSWORD') || (isProd ? '' : 'jacinta-admin')
  const authSecret = env('AUTH_SECRET') || randomHex(24)

  if (!env('ADMIN_PASSWORD')) {
    console.warn(
      `[jaci] ADMIN_PASSWORD not set — ${isProd ? 'admin login is DISABLED' : `using dev password "${adminPassword}"`}. Set it in .env before deploying.`,
    )
  }

  const app = createApp({
    storage: createFileStorage(storagePath),
    authSecret,
    adminPassword,
    cloudinary: cloudinaryFromEnv(),
    fileStore: createLocalFileStore(uploadsDir),
    isProd,
  })

  // Local media files
  app.get('/media/*', (c) => {
    const url = new URL(c.req.url)
    const name = decodeURIComponent(url.pathname.replace(/^\/media\//, ''))
    const resolved = path.resolve(uploadsDir, path.basename(name))
    if (!resolved.startsWith(path.resolve(uploadsDir))) {
      return c.json({ error: 'not_found' }, 404)
    }
    try {
      return sendFile(c, resolved)
    } catch {
      return c.json({ error: 'not_found' }, 404)
    }
  })

  if (options.serveStatic) {
    app.all('*', (c) => {
      const url = new URL(c.req.url)
      const pathname = url.pathname
      if (pathname.startsWith('/api/') || pathname.startsWith('/media/')) {
        return c.json({ error: 'not_found' }, 404)
      }
      let filePath = pathname === '/' ? '/index.html' : pathname
      const resolved = path.resolve(distDir, `.${filePath}`)
      if (resolved.startsWith(path.resolve(distDir))) {
        try {
          if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            return sendFile(c, resolved)
          }
        } catch {
          // fall through to SPA index
        }
      }
      try {
        return sendFile(c, path.join(distDir, 'index.html'))
      } catch {
        return c.text('App not built yet — run `npm run build`.', 500)
      }
    })
  }

  return app
}
