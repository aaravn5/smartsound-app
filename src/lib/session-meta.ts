/**
 * Session metadata — the wall-clock instant the current session started,
 * written by the player at the SINGLE point a session actually begins (right
 * next to `recordRecent`) and cleared when it stops. The landing's Now
 * Playing widget reads it so its elapsed readout matches the player's even
 * after navigating away. Engine state remains the only source of truth for
 * "running" — a stale timestamp is simply ignored while the engine is idle.
 */

const KEY = 'ss_session_started_v1'

export function recordSessionStartedAt(t: number = Date.now()): void {
  try {
    window.localStorage.setItem(KEY, String(t))
  } catch {
    // storage unavailable — the widget falls back to its mount time
  }
}

export function clearSessionStartedAt(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function readSessionStartedAt(): number | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const t = Number(raw)
    return Number.isFinite(t) && t > 0 ? t : null
  } catch {
    return null
  }
}
