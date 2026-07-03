import type { MiddlewareHandler } from 'hono'

/**
 * H2: tiny, dependency-free fixed-window rate limiter keyed by client IP.
 *
 * Not a substitute for a shared store (Redis, etc) in a multi-process
 * deployment — this scaffold runs as a single Node process, so an in-memory
 * `Map` is sufficient to blunt credential-stuffing / brute-force / webhook
 * spam against the auth, billing, and session endpoints.
 */

interface Window {
  count: number
  resetAt: number
}

/** Reads the first hop of `x-forwarded-for` (the original client), falling back to a stable default. */
function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  // @hono/node-server does not expose the raw socket's remoteAddress through
  // the Hono context, and there is no other reliable per-request source of
  // truth without a proxy in front of us — fall back to a shared bucket.
  return 'unknown'
}

export interface RateLimitOptions {
  /** Max requests allowed per window, per IP. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

/** Fixed-window limiter. Returns 429 with `Retry-After` once `limit` is exceeded within `windowMs`. */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
  const { limit, windowMs } = options
  const buckets = new Map<string, Window>()
  sweep(buckets, Math.max(windowMs, 60_000))

  return async (c, next) => {
    const key = clientIp(c)
    const now = Date.now()
    const existing = buckets.get(key)

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    existing.count += 1
    if (existing.count > limit) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
      c.header('Retry-After', String(retryAfterSec))
      return c.json({ error: 'rate_limited' }, 429)
    }

    await next()
  }
}

/** Periodically drop expired buckets so long-lived processes don't leak memory. */
function sweep(buckets: Map<string, Window>, intervalMs: number): void {
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, window] of buckets) {
      if (window.resetAt <= now) buckets.delete(key)
    }
  }, intervalMs)
  timer.unref?.()
}
