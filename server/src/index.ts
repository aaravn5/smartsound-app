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
import { secureHeaders } from 'hono/secure-headers'
import { env, usingInsecureSessionSecret } from './env.js'
import './db.js' // side effect: opens the DB and runs migrations
import type { AppEnv } from './hono-app.js'
import { csrfOriginCheck } from './middleware/csrf.js'
import { rateLimit } from './middleware/rate-limit.js'
import { authRoutes } from './routes/auth.js'
import { meRoutes } from './routes/me.js'
import { usageRoutes, sessionRoutes } from './routes/usage.js'
import { insightsRoutes } from './routes/insights.js'
import { billingRoutes } from './routes/billing.js'
import { accountRoutes } from './routes/account.js'

const app = new Hono<AppEnv>()

app.use('*', logger())

// M3: baseline security headers for every response. This is a JSON API (no
// HTML is ever served from here), so we lock down framing/sniffing/referrer
// leakage. NOTE: HSTS (`Strict-Transport-Security`) is intentionally left to
// the reverse proxy (Caddy/nginx) that terminates TLS in front of this
// process — see README.md — since this process itself may be reached over
// plain HTTP behind that proxy and should not assert HSTS on those responses.
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  }),
)

app.use(
  '/api/*',
  cors({
    origin: env.PUBLIC_ORIGIN,
    credentials: true,
  }),
)

// M2: Origin/Referer CSRF check, applied after CORS to every state-changing
// /api/* request (see middleware/csrf.ts for the webhook/OAuth-callback exemptions).
app.use('/api/*', csrfOriginCheck)

// H2: rate limit the endpoints most attractive to abuse — credential
// stuffing / OAuth spam, Stripe checkout/portal creation, and session
// start/end flooding. Keyed by client IP (first hop of `x-forwarded-for`).
app.use('/api/auth/*', rateLimit({ limit: 20, windowMs: 60_000 }))
app.use('/api/billing/*', rateLimit({ limit: 20, windowMs: 60_000 }))
app.use('/api/session/*', rateLimit({ limit: 60, windowMs: 60_000 }))

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
  if (process.env.NODE_ENV === 'production') {
    // H1: never let a production process boot with the well-known dev session
    // secret — anyone who reads this repo could forge signed session cookies.
    // eslint-disable-next-line no-console
    console.error(
      '[smartsound-server] FATAL: SESSION_SECRET is unset in production. Refusing to start — set a strong, ' +
        'random SESSION_SECRET before deploying.',
    )
    process.exit(1)
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[smartsound-server] SESSION_SECRET is not set — using an insecure dev default. Set it before deploying.',
  )
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[smartsound-server] listening on http://localhost:${info.port}`)
})
