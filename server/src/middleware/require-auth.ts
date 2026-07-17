import type { MiddlewareHandler } from 'hono'
import { currentUser } from '../session.js'
import type { AppEnv } from '../hono-app.js'

/** Resolves the session cookie to a user and sets `c.get('user')`, or 401s. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await currentUser(c)
  if (!user) {
    return c.json({ error: 'unauthenticated' }, 401)
  }
  c.set('user', user)
  await next()
}
