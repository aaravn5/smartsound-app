/** Biometric pipeline types (§8). Public name: "Attune / Presence" (§8). */

export interface BiometricReading {
  /** Heart rate, bpm, confidence-smoothed. */
  hr: number
  /** Respiration, breaths/min. Drives the ring's breathing motion. */
  respiration: number
  /**
   * Relative steadiness trend, 0..1 — an HRV-*trend* proxy. Deliberately NOT
   * clinical HRV in ms (§8.1, §8.2). Higher = more settled.
   */
  steadiness: number
  /** Signal confidence, 0..1. Low confidence softens the loop's reactivity. */
  confidence: number
  /** Position within the current cardiac cycle, 0..1 — for the ring's pulse. */
  phase: number
  /** Derived arousal vs the user's own baseline, 0..1. */
  arousal: number
  active: boolean
}

export interface Baseline {
  hr: number
  respiration: number
  steadiness: number
  captured: boolean
}

export const IDLE_READING: BiometricReading = {
  hr: 64,
  respiration: 7,
  steadiness: 0.5,
  confidence: 0,
  phase: 0,
  arousal: 0.5,
  active: false,
}

export const EMPTY_BASELINE: Baseline = {
  hr: 64,
  respiration: 7,
  steadiness: 0.5,
  captured: false,
}
