import type { Plan } from '~/lib/entitlements'

/**
 * Developer access — a password-gated unlock that grants the full app (every
 * mode, no daily cap) by elevating the plan in the SAME localStorage record
 * the entitlements stub reads. `entitlements.ts` logic is untouched: this
 * module only writes the storage that stub already documents as a
 * client-side, trivially-bypassable UX layer. Like the stub itself, this is
 * NOT a security boundary — it's a developer convenience for reviewing the
 * paid experience.
 */

export const DEV_PASSWORD = 'ceodev01'

const DEV_FLAG_KEY = 'ss_dev_access_v1'
/** Must match `STORAGE_KEY` in entitlements.ts (kept private there). */
const ENTITLEMENTS_KEY = 'smartsound.entitlements.v1'
/** The plan dev access grants — top tier, so nothing is capped or gated. */
const DEV_PLAN: Plan = 'studio'

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function writePlan(plan: Plan): void {
  try {
    const raw = window.localStorage.getItem(ENTITLEMENTS_KEY)
    let minutes = 0
    let sessions = 0
    if (raw) {
      const parsed = JSON.parse(raw) as { date?: string; minutes?: number; sessions?: number }
      if (parsed.date === localDateKey()) {
        minutes = typeof parsed.minutes === 'number' ? parsed.minutes : 0
        sessions = typeof parsed.sessions === 'number' ? parsed.sessions : 0
      }
    }
    window.localStorage.setItem(
      ENTITLEMENTS_KEY,
      JSON.stringify({ date: localDateKey(), minutes, sessions, plan }),
    )
  } catch {
    // Storage unavailable — dev access simply won't stick.
  }
}

export function isDevAccess(): boolean {
  try {
    return window.localStorage.getItem(DEV_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

/** Attempt an unlock. Returns true (and elevates the plan) on the right password. */
export function tryUnlockDevAccess(password: string): boolean {
  if (password !== DEV_PASSWORD) return false
  try {
    window.localStorage.setItem(DEV_FLAG_KEY, '1')
  } catch {
    return false
  }
  writePlan(DEV_PLAN)
  return true
}

export function disableDevAccess(): void {
  try {
    window.localStorage.removeItem(DEV_FLAG_KEY)
  } catch {
    // ignore
  }
  writePlan('free')
}

/**
 * Keep the elevated plan alive across the daily rollover (the stub's fresh
 * record resets plan to 'free' at local midnight). Called from the app shell
 * on mount + on an interval.
 */
export function ensureDevPlan(): void {
  if (!isDevAccess()) return
  try {
    const raw = window.localStorage.getItem(ENTITLEMENTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { date?: string; plan?: string }
      if (parsed.date === localDateKey() && parsed.plan === DEV_PLAN) return
    }
  } catch {
    // fall through and rewrite
  }
  writePlan(DEV_PLAN)
}
