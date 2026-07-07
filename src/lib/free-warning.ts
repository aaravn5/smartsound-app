import { FREE_DAILY_MIN } from '~/lib/entitlements'

/**
 * free-warning — pure display helpers for the free tier's gentle two-minute
 * warning during playback. The entitlements stub stays the single source of
 * truth for the cap itself (this module never writes usage); these functions
 * only decide when the quiet Silver line appears so the fade-out is never a
 * surprise.
 */

/** Minutes left in today's free allowance, counting the running session. */
export function remainingFreeMinutes(
  minutesToday: number,
  elapsedMs: number,
  cap: number = FREE_DAILY_MIN,
): number {
  return Math.max(0, cap - (minutesToday + elapsedMs / 60_000))
}

/** The warning shows only for a free listener, mid-playback, at ≤2 min left. */
export function shouldWarnLowTime(
  plan: string,
  running: boolean,
  remainingMin: number,
): boolean {
  return plan === 'free' && running && remainingMin <= 2
}

/** The quiet line itself — never a hard-cut surprise. */
export function lowTimeMessage(remainingMin: number): string {
  const m = Math.max(1, Math.ceil(remainingMin))
  return `${m} min left today — the record will fade out`
}
