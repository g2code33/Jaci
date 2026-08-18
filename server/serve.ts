// Production Node server: serves the built SPA + API + media.
//   npm run build && npm start

import { serve } from '@hono/node-server'
import { createNodeApp } from './nodeApp'
import { env } from './env'

const app = createNodeApp({ serveStatic: true })
const port = Number(process.env.PORT || env('PORT', '8787'))

console.log(`[jaci] serving on http://0.0.0.0:${port}`)

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' })
