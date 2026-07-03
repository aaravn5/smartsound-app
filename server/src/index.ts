/**
 * SmartSound backend scaffold entrypoint (§5 of the goal doc).
 *
 * Mounts auth / me / usage / insights / billing / account routes on a Hono
 * app and serves it with @hono/node-server. In production this sits behind a
 * reverse proxy that serves the SPA's `dist/` and forwards `/api/*` here —
 * see `README.md` for a sample Caddy/nginx config + systemd unit.
 */

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env, usingInsecureSessionSecret } from './env.js'
import './db.js' // side effect: opens the DB and runs migrations
import type { AppEnv } from './hono-app.js'
import { authRoutes } from './routes/auth.js'
import { meRoutes } from './routes/me.js'
import { usageRoutes, sessionRoutes } from './routes/usage.js'
import { insightsRoutes } from './routes/insights.js'
import { billingRoutes } from './routes/billing.js'
import { accountRoutes } from './routes/account.js'

const app = new Hono<AppEnv>()

app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: env.PUBLIC_ORIGIN,
    credentials: true,
  }),
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/api/auth', authRoutes)
app.route('/api/me', meRoutes)
app.route('/api/usage', usageRoutes)
app.route('/api/session', sessionRoutes) // /api/session/start, /api/session/end
app.route('/api/insights', insightsRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/account', accountRoutes)

app.notFound((c) => c.json({ error: 'not_found' }, 404))

if (usingInsecureSessionSecret) {
  // eslint-disable-next-line no-console
  console.warn(
    '[smartsound-server] SESSION_SECRET is not set — using an insecure dev default. Set it before deploying.',
  )
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[smartsound-server] listening on http://localhost:${info.port}`)
})
