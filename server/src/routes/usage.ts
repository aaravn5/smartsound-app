/**
 * Usage metering + the server-enforced free cap (§4.3 of the goal doc).
 * The client's `src/lib/entitlements.ts` stub is UX-only; THIS is the source
 * of truth — a Free-tier client can't bypass the cap by editing localStorage.
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../middleware/require-auth.js'
import {
  addUsageMinutes,
  createSessionLog,
  endSessionLog,
  getSessionLog,
  getSubscription,
  getUsageToday,
  insertArousalSamples,
  recordSessionStart,
} from '../db.js'
import { FREE_DAILY_MIN, FREE_DAILY_SESSIONS } from '../types.js'
import type { AppEnv } from '../hono-app.js'

export const usageRoutes = new Hono<AppEnv>()
/** Mounted separately at `/api/session` in index.ts (paths match the goal doc exactly). */
export const sessionRoutes = new Hono<AppEnv>()

usageRoutes.get('/', requireAuth, (c) => {
  const user = c.get('user')
  const usage = getUsageToday(user.id)
  return c.json({ minutesToday: usage.minutes, sessionsToday: usage.sessions })
})

const startBody = z.object({
  /** One of the engine's TargetState values (focus/flow/calm/winddown/sleep, etc). */
  state: z.string().min(1).max(32),
})

sessionRoutes.post('/start', requireAuth, async (c) => {
  const user = c.get('user')
  const subscription = getSubscription(user.id)
  const usage = getUsageToday(user.id)

  if (subscription.plan === 'free' && (usage.sessions >= FREE_DAILY_SESSIONS || usage.minutes >= FREE_DAILY_MIN)) {
    return c.json({ error: 'cap_reached', reason: 'cap' as const }, 402)
  }

  const parsed = startBody.safeParse(await c.req.json().catch(() => ({})))
  const state = parsed.success ? parsed.data.state : 'focus'

  recordSessionStart(user.id)
  const log = createSessionLog(user.id, state)
  return c.json({ sessionId: log.id, startedAt: log.started_at })
})

const endBody = z.object({
  sessionId: z.string().min(1),
  minutes: z.number().min(0).max(24 * 60),
  arousalSamples: z.array(z.object({ t: z.number().min(0), arousal: z.number().min(0).max(1) })).default([]),
})

sessionRoutes.post('/end', requireAuth, async (c) => {
  const user = c.get('user')
  const body = endBody.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'invalid_body', issues: body.error.issues }, 400)
  }
  const { sessionId, minutes, arousalSamples } = body.data

  const existing = getSessionLog(sessionId, user.id)
  if (!existing) {
    return c.json({ error: 'session_not_found' }, 404)
  }

  const log = endSessionLog(sessionId, user.id, minutes)
  insertArousalSamples(sessionId, arousalSamples)
  const usage = addUsageMinutes(user.id, minutes)

  return c.json({ session: log, usage: { minutesToday: usage.minutes, sessionsToday: usage.sessions } })
})
