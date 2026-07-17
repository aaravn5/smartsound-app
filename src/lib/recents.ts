import type { TargetState } from '~/engine/audio/types'

/**
 * Recently played — a tiny, honest local record. The player writes an entry
 * only when a session actually starts (the same moment the engine's
 * `start()` is called); Today's "Recently played" shelf reads it. No
 * fabricated history: until a first real session, the shelf simply doesn't
 * render.
 */

const KEY = 'ss_recent_states_v1'
const MAX = 8

const VALID: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

export function readRecents(): TargetState[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is TargetState =>
      typeof s === 'string' && (VALID as readonly string[]).includes(s),
    )
  } catch {
    return []
  }
}

export function recordRecent(state: TargetState): void {
  try {
    const next = [state, ...readRecents().filter((s) => s !== state)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable (private mode etc.) — recents just stay empty.
  }
}
