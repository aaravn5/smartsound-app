import { arousalToLch, lchToCss } from '~/design/signal'

export function arousalLabel(a: number): string {
  if (a < 0.25) return 'Wind-down'
  if (a < 0.5) return 'Settled'
  if (a < 0.78) return 'Focus'
  return 'Elevated'
}

export const pct = (n: number) => Math.round(n * 100)

export function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** The live signal color for a given arousal — matches the --signal token. */
export function signalColor(arousal: number): string {
  return lchToCss(arousalToLch(arousal))
}
