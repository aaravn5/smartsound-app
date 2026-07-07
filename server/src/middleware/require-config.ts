import type { MiddlewareHandler } from 'hono'
import { isConfigured, missingKeys, type ConfigGroup } from '../env.js'

/**
 * Gates a route behind a secret group being configured. Returns 503 instead
 * of letting the handler crash on an empty client-id/secret when the
 * operator hasn't set up real OAuth/Stripe credentials yet.
 */
export function requireConfig(group: ConfigGroup): MiddlewareHandler {
  return async (c, next) => {
    if (!isConfigured(group)) {
      return c.json({ error: 'not_configured', missing: missingKeys(group) }, 503)
    }
    await next()
  }
}
