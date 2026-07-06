/**
 * hero-math — the pure scroll-timeline of the three-act landing hero.
 *
 * The hero is a ~320vh scroll container with a position:sticky 100vh stage;
 * `heroProgress` maps the page scroll offset within that container to a
 * 0..1 timeline, and every act boundary/opacity/zoom below is a pure
 * function of that progress so the whole choreography is testable without
 * a browser.
 *
 *   Act I  — The Study      p ∈ [0,    0.35)
 *   Act II — The Zoom       p ∈ [0.35, 0.70)
 *   Act III— The Pressings  p ∈ [0.70, 1.00]
 */

export const HERO_SCROLL_VH = 320
export const ACT1_END = 0.35
export const ACT2_END = 0.7

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))

/** Accelerate-then-settle — the camera push of Act II. */
export function easeInOutCubic(t: number): number {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Scroll progress 0..1 for a container of height `containerH` whose top sits
 * at `containerTop` document-px, given the page scroller's `scrollY` and the
 * viewport height. 0 until the container reaches the top, 1 once its bottom
 * meets the viewport bottom.
 */
export function heroProgress(
  scrollY: number,
  containerTop: number,
  containerH: number,
  viewportH: number,
): number {
  const scrollable = containerH - viewportH
  if (scrollable <= 0) return 0
  return clamp01((scrollY - containerTop) / scrollable)
}

/**
 * Normalized camera zoom 0..1 (the canvas maps 1 → its computed
 * "screen fills the viewport" zoom). A whisper of push during Act I, the
 * full accelerate-then-settle travel across Act II, pinned at 1 in Act III.
 */
export function heroZoomT(p: number): number {
  if (p <= ACT1_END) return 0.02 * (p / ACT1_END)
  if (p >= ACT2_END) return 1
  return 0.02 + 0.98 * easeInOutCubic((p - ACT1_END) / (ACT2_END - ACT1_END))
}

/** Headline (and subline) — full through the study, gone as the zoom begins. */
export function headlineOpacity(p: number): number {
  return clamp01(1 - (p - 0.26) / 0.14)
}

/** The scroll cue dies on first movement. */
export function cueOpacity(p: number): number {
  return clamp01(1 - p / 0.07)
}

/** The study (room, desk, screen, EEG) fades as the bezel swallows the frame. */
export function roomOpacity(p: number): number {
  return clamp01(1 - (p - 0.58) / 0.12)
}

/** Act III — inside the computer: carousel, CTAs, search. */
export function act3Opacity(p: number): number {
  return clamp01((p - ACT2_END) / 0.09)
}
