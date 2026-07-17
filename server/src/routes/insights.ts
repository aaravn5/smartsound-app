/**
 * Aggregate, real-data insights (§2 Insights, §5 `/api/insights`) from
 * `session_logs` / `arousal_samples`. Free plan sees only its last 3
 * sessions (§4.1 "Insights history"); Pro/Studio get full history.
 */

import { Hono } from 'hono'
import { requireAuth } from '../middleware/require-auth.js'
import { getSubscription, listArousalSamples, listSessionLogs, listUsageRange, localDateKey } from '../db.js'
import type { AppEnv } from '../hono-app.js'

export const insightsRoutes = new Hono<AppEnv>()

const FREE_HISTORY_LIMIT = 3

insightsRoutes.get('/', requireAuth, (c) => {
  const user = c.get('user')
  const subscription = getSubscription(user.id)
  const historyLimit = subscription.plan === 'free' ? FREE_HISTORY_LIMIT : 1000

  const sessions = listSessionLogs(user.id, historyLimit).filter((s) => s.ended_at !== null)

  // Weekly minutes: last 7 local days, oldest first.
  const since = localDateKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  const usage = listUsageRange(user.id, since)

  // Time-in-state, in minutes, derived from completed sessions' `state` label.
  const timeInState: Record<string, number> = {}
  for (const s of sessions) {
    if (s.minutes) timeInState[s.state] = (timeInState[s.state] ?? 0) + s.minutes
  }

  // Streak: consecutive local days (ending today) with at least one completed session.
  let streak = 0
  const usageByDate = new Map(usage.map((u) => [u.date, u]))
  for (let i = 0; i < 365; i++) {
    const d = localDateKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000))
    const day = usageByDate.get(d)
    if (day && day.sessions > 0) {
      streak++
    } else if (i === 0) {
      continue // today not started yet still allows yesterday's streak to count
    } else {
      break
    }
  }

  // Closed-loop arousal curve for the most recent completed session (sampled points).
  const latest = sessions[0]
  const arousalCurve = latest ? listArousalSamples(latest.id) : []

  return c.json({
    streakDays: streak,
    weeklyMinutes: usage.map((u) => ({ date: u.date, minutes: u.minutes })),
    timeInState,
    recentSessions: sessions.map((s) => ({
      id: s.id,
      state: s.state,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      minutes: s.minutes,
    })),
    arousalCurve: arousalCurve.map((a) => ({ t: a.t, arousal: a.arousal })),
    historyTruncated: subscription.plan === 'free',
  })
})
