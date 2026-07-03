import type { MiddlewareHandler } from 'hono'
import { env } from '../env.js'

/**
 * M2: Origin/Referer defense-in-depth against CSRF for cookie-authenticated,
 * state-changing requests. This is a belt-and-suspenders check alongside
 * `SameSite` session cookies — it rejects any state-changing `/api/*` request
 * whose `Origin` (or, failing that, `Referer`) doesn't match `PUBLIC_ORIGIN`.
 *
 * Exempted:
 *  - `/api/billing/webhook` — called server-to-server by Stripe, which sends
 *    no browser Origin header at all; integrity is instead guaranteed by the
 *    `stripe-signature` HMAC check in `routes/billing.ts`.
 *  - `/api/auth/*\/callback` — OAuth callbacks are *legitimately* cross-site
 *    (the browser is redirected/POSTed here from accounts.google.com /
 *    appleid.apple.com), so an Origin/Referer match against our own origin
 *    would never succeed. State is validated via the `oauth_state` cookie
 *    instead (see `routes/auth.ts`).
 */

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isExempt(path: string): boolean {
  if (path === '/api/billing/webhook') return true
  if (/^\/api\/auth\/[^/]+\/callback$/.test(path)) return true
  return false
}

function originFromReferer(referer: string): string | null {
  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

export const csrfOriginCheck: MiddlewareHandler = async (c, next) => {
  const { method, path } = c.req

  if (!STATE_CHANGING_METHODS.has(method) || isExempt(path)) {
    await next()
    return
  }

  const origin = c.req.header('origin') ?? originFromReferer(c.req.header('referer') ?? '')

  if (!origin || origin !== env.PUBLIC_ORIGIN) {
    return c.json({ error: 'csrf_origin_mismatch' }, 403)
  }

  await next()
}
