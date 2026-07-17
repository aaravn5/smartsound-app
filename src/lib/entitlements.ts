import { useCallback, useEffect, useState } from 'react'

/**
 * Entitlements — STUB. The server is the source of truth in production (a
 * later backend milestone, §4.3/§5 of the goal doc); this module is UX only,
 * backed by localStorage, and trivially bypassable (clear storage, edit
 * devtools, open a private tab). It exists so the free daily cap has
 * something honest to react to in the UI before real metering lands. NEVER
 * treat `capReached` here as a security boundary.
 */

export type Plan = 'free' | 'pro' | 'studio'

/** Free tier: one session a day, capped at this many minutes (§4.1). */
export const FREE_DAILY_MIN = 20
export const FREE_DAILY_SESSIONS = 1

interface UsageRecord {
  /** Local YYYY-MM-DD this record belongs to — usage resets at local midnight. */
  date: string
  minutes: number
  sessions: number
  plan: Plan
}

const STORAGE_KEY = 'smartsound.entitlements.v1'

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function freshRecord(): UsageRecord {
  return { date: localDateKey(), minutes: 0, sessions: 0, plan: 'free' }
}

function readRecord(): UsageRecord {
  if (typeof window === 'undefined') return freshRecord()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UsageRecord>
      if (parsed.date === localDateKey() && typeof parsed.minutes === 'number' && typeof parsed.sessions === 'number') {
        return { date: parsed.date, minutes: parsed.minutes, sessions: parsed.sessions, plan: parsed.plan === 'pro' || parsed.plan === 'studio' ? parsed.plan : 'free' }
      }
    }
  } catch {
    // malformed JSON or storage unavailable (private mode, quota) — start fresh
  }
  return freshRecord()
}

function writeRecord(rec: UsageRecord): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec))
  } catch {
    // storage unavailable — usage just won't persist across reloads
  }
}

export interface DailyUsage {
  plan: Plan
  minutesToday: number
  sessionsToday: number
  /** True once the free tier has used its one session and/or its 20 minutes today. */
  capReached: boolean
  /** Accumulate elapsed session minutes (fractional) into today's total. */
  addMinutes: (n: number) => void
  /** Mark that a free session has begun — counts against the 1/day allowance. */
  recordSessionStart: () => void
}

/**
 * Client-side daily usage, reset at local midnight. STUB — see module comment.
 */
export function useDailyUsage(): DailyUsage {
  const [rec, setRec] = useState<UsageRecord>(() => readRecord())

  // If the tab stays open across local midnight, roll the record over.
  useEffect(() => {
    const id = window.setInterval(() => {
      setRec((prev) => (prev.date === localDateKey() ? prev : freshRecord()))
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const addMinutes = useCallback((n: number) => {
    if (n <= 0) return
    setRec((prev) => {
      const current = prev.date === localDateKey() ? prev : freshRecord()
      const next: UsageRecord = { ...current, minutes: current.minutes + n }
      writeRecord(next)
      return next
    })
  }, [])

  const recordSessionStart = useCallback(() => {
    setRec((prev) => {
      const current = prev.date === localDateKey() ? prev : freshRecord()
      const next: UsageRecord = { ...current, sessions: current.sessions + 1 }
      writeRecord(next)
      return next
    })
  }, [])

  const capReached = rec.plan === 'free' && (rec.minutes >= FREE_DAILY_MIN || rec.sessions >= FREE_DAILY_SESSIONS)

  return {
    plan: rec.plan,
    minutesToday: rec.minutes,
    sessionsToday: rec.sessions,
    capReached,
    addMinutes,
    recordSessionStart,
  }
}
