import { Hono } from 'hono'
import { requireAuth } from '../middleware/require-auth.js'
import { deleteUserData, exportUserData } from '../db.js'
import { clearSession } from '../session.js'
import type { AppEnv } from '../hono-app.js'

export const accountRoutes = new Hono<AppEnv>()

/** Full data export (§5 privacy: only derived scalars were ever stored — no raw video/frames). */
accountRoutes.get('/export', requireAuth, (c) => {
  const user = c.get('user')
  return c.json(exportUserData(user.id))
})

accountRoutes.post('/delete', requireAuth, async (c) => {
  const user = c.get('user')
  deleteUserData(user.id)
  await clearSession(c)
  return c.json({ ok: true })
})
