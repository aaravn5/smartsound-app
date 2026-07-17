import { Hono } from 'hono'
import { requireAuth } from '../middleware/require-auth.js'
import { getSubscription, getUsageToday } from '../db.js'
import { FREE_DAILY_MIN, FREE_DAILY_SESSIONS } from '../types.js'
import type { AppEnv } from '../hono-app.js'

export const meRoutes = new Hono<AppEnv>()

meRoutes.get('/', requireAuth, (c) => {
  const user = c.get('user')
  const subscription = getSubscription(user.id)
  const usage = getUsageToday(user.id)
  const capReached =
    subscription.plan === 'free' && (usage.minutes >= FREE_DAILY_MIN || usage.sessions >= FREE_DAILY_SESSIONS)

  return c.json({
    user: { id: user.id, email: user.email, provider: user.provider, createdAt: user.created_at },
    plan: subscription.plan,
    usage: {
      minutesToday: usage.minutes,
      sessionsToday: usage.sessions,
      capReached,
    },
  })
})
