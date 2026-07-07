/**
 * The state → color engine (§5.2).
 *
 * `--signal` is the whole product's identity: a single OKLCH value bound to the
 * user's cognitive state. In the finished product the closed loop (engine/loop)
 * drives `arousal` from real biometrics; here the same function powers the
 * hero's interactive preview. One code path, no fakery — the color genuinely is
 * a function of a live scalar.
 */

export type CognitiveState = 'winddown' | 'settled' | 'focus' | 'elevated'

/**
 * OKLCH anchor points [L, C, H], ordered along the arousal axis.
 *
 * Desktop.fm keeps the UI strictly achromatic — the ONLY color on the page is
 * this signal. It is recolored to a calming blue → soft periwinkle band: the
 * hue never leaves the 232–258 blue range and chroma stays low-mid, so every
 * live state reads as one tranquil blue rather than a rainbow sweep.
 */
export const STATE_ANCHORS: Record<CognitiveState, readonly [number, number, number]> = {
  winddown: [0.54, 0.08, 258], // deep calm indigo
  settled: [0.70, 0.10, 238], // soft sky blue
  focus: [0.66, 0.13, 250], // clear periwinkle-blue
  elevated: [0.76, 0.12, 240], // bright, airy blue
}

const AROUSAL_ORDER: CognitiveState[] = ['winddown', 'settled', 'focus', 'elevated']

export interface Lch {
  l: number
  c: number
  h: number
}

export function stateToLch(state: CognitiveState): Lch {
  const [l, c, h] = STATE_ANCHORS[state]
  return { l, c, h }
}

/** Shortest-path hue interpolation so the arc never spins the long way round. */
function lerpHue(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180
  return (a + d * t + 360) % 360
}

export function lerpLch(a: Lch, b: Lch, t: number): Lch {
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: lerpHue(a.h, b.h, t),
  }
}

/**
 * Map a continuous arousal scalar (0 = fully wound down, 1 = elevated) onto the
 * anchor arc. This is the bridge the loop uses: measured arousal → color.
 */
export function arousalToLch(arousal: number): Lch {
  const a = Math.min(1, Math.max(0, arousal))
  const span = AROUSAL_ORDER.length - 1
  const scaled = a * span
  const i = Math.min(span - 1, Math.floor(scaled))
  const t = scaled - i
  return lerpLch(stateToLch(AROUSAL_ORDER[i]), stateToLch(AROUSAL_ORDER[i + 1]), t)
}

export function lchToCss({ l, c, h }: Lch): string {
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`
}

/** Push a color into the DOM so every token reading `--signal` updates at once. */
export function applySignal(lch: Lch, target: HTMLElement = document.documentElement): void {
  target.style.setProperty('--signal', lchToCss(lch))
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
