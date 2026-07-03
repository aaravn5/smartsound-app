import type { TargetState } from '~/engine/audio/types'

/**
 * NASA-TLX-lite ground truth (§3, §9.2). Each check-in is a real, user-supplied
 * rating of perceived load. These calibrate the loop to the individual instead
 * of a population average. Kept in memory for this build (no server).
 */
export type LoadRating = 'light' | 'right' | 'hard'

export interface CheckIn {
  t: number
  state: TargetState
  rating: LoadRating
}

const checkIns: CheckIn[] = []

export function recordCheckIn(state: TargetState, rating: LoadRating): void {
  checkIns.push({ t: performance.now(), state, rating })
}

export function getCheckIns(): CheckIn[] {
  return checkIns
}

export function clearCheckIns(): void {
  checkIns.length = 0
}

/**
 * A small per-state arousal offset the loop can fold into its target: if the
 * user reports work felt too hard, ease the target down; too light, nudge up.
 */
export function targetOffset(state: TargetState): number {
  const relevant = checkIns.filter((c) => c.state === state).slice(-5)
  if (!relevant.length) return 0
  const score = relevant.reduce((a, c) => a + (c.rating === 'hard' ? -1 : c.rating === 'light' ? 1 : 0), 0)
  return Math.max(-0.1, Math.min(0.1, (score / relevant.length) * 0.1))
}
