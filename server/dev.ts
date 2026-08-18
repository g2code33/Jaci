// Vite dev-server plugin: mounts the API + media routes into the same
// dev server, so `npm run dev` serves frontend and backend on one port.

import type { Plugin } from 'vite'
import { Readable } from 'node:stream'
import { createNodeApp } from './nodeApp'

const FORWARD_PREFIXES = ['/api/', '/media/']

function toWebRequest(req: any): Request {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const headers: Record<string, string> = {}
  for (const key of Object.keys(req.headers)) {
    const lower = key.toLowerCase()
    if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(lower)) continue
    const value = req.headers[key]
    if (typeof value === 'string') headers[lower] = value
  }
  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers,
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = Readable.toWeb(req) as never
    init.duplex = 'half'
  }
  return new Request(url.toString(), init)
}

async function writeResponse(res: any, webRes: Response) {
  res.statusCode = webRes.status
  const setCookies: string[] = []
  webRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'set-cookie') {
      setCookies.push(value)
      return
    }
    res.setHeader(key, value)
  })
  if (setCookies.length) res.setHeader('set-cookie', setCookies)
  if (webRes.body) {
    Readable.fromWeb(webRes.body as any).pipe(res)
  } else {
    res.end()
  }
}

export function devServer(): Plugin {
  return {
    name: 'jaci-api-dev',
    configureServer(server) {
      const app = createNodeApp()
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!FORWARD_PREFIXES.some((p) => url.startsWith(p))) return next()
        try {
          const webReq = toWebRequest(req)
          const webRes = await app.fetch(webReq)
          await writeResponse(res, webRes)
        } catch (err) {
          console.error('[jaci] api error', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'internal_error' }))
          } else {
            res.end()
          }
        }
      })
    },
  }
}
