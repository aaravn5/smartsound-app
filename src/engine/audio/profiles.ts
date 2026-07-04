import type { StateProfile, TargetState } from './types'

/**
 * State profiles (§7.4). Entrainment rates follow the classic bands — beta for
 * focus, alpha for calm/flow, theta for wind-down, delta for sleep — used here
 * as *amplitude modulation* rates (Brain.fm-style), not binaural beats (§7.3).
 * Roots are derived from A=440 (§7.2).
 *
 * `chordRatios` gives each scape its own warm voicing (just-intonation ratios
 * over rootHz) for the pad layer — always 5 tones so the persistent pad
 * voices can be retuned in place on scape switch. `scale` gives the
 * generative bell layer a pentatonic-ish palette to quantize to.
 */
export const PROFILES: Record<TargetState, StateProfile> = {
  focus: {
    key: 'focus',
    label: 'Focus',
    entrainmentHz: 15, // beta
    neuralDepth: 0.5,
    brightness: 0.62,
    tempo: 98,
    density: 0.6,
    targetArousal: 0.62,
    rootHz: 220, // A3
    // 1 – maj3 – 5 – maj7 – 9: bright, alert, clean (lydian-leaning)
    chordRatios: [1, 1.25, 1.5, 1.875, 2.25],
    // major pentatonic
    scale: [1, 1.125, 1.25, 1.5, 1.667, 2],
  },
  flow: {
    key: 'flow',
    label: 'Flow',
    entrainmentHz: 12, // low beta / high alpha
    neuralDepth: 0.45,
    brightness: 0.55,
    tempo: 90,
    density: 0.7,
    targetArousal: 0.55,
    rootHz: 196, // G3
    // 1 – 9 – 5 – 8 – 10: sus/add9, floaty and open
    chordRatios: [1, 1.125, 1.5, 2, 2.5],
    scale: [1, 1.125, 1.333, 1.5, 1.875, 2],
  },
  calm: {
    key: 'calm',
    label: 'Calm',
    entrainmentHz: 10, // alpha
    neuralDepth: 0.38,
    brightness: 0.42,
    tempo: 68,
    density: 0.45,
    targetArousal: 0.4,
    rootHz: 174.6, // F3
    // 1 – maj3 – 5 – maj7 – 9(oct): warm maj7add9, "expensive" pad chord
    chordRatios: [1, 1.25, 1.5, 1.875, 2.5],
    scale: [1, 1.125, 1.25, 1.5, 1.875, 2],
  },
  winddown: {
    key: 'winddown',
    label: 'Wind-down',
    entrainmentHz: 6, // theta
    neuralDepth: 0.32,
    brightness: 0.3,
    tempo: 56,
    density: 0.32,
    targetArousal: 0.25,
    rootHz: 146.8, // D3
    // 1 – min3 – 5 – min7 – min3(oct): soft minor7, gently melancholic
    chordRatios: [1, 1.2, 1.5, 1.8, 2.4],
    scale: [1, 1.2, 1.333, 1.5, 1.8, 2],
  },
  sleep: {
    key: 'sleep',
    label: 'Sleep',
    entrainmentHz: 2.5, // delta — sleep resolves to delta-modulated noise (§7.4)
    neuralDepth: 0.28,
    brightness: 0.2,
    tempo: 48,
    density: 0.22,
    targetArousal: 0.12,
    rootHz: 110, // A2
    // 1 – 5 – 8 – 12 – 15: open fifths/octaves only, minimal partials
    chordRatios: [1, 1.5, 2, 3, 4],
    scale: [1, 1.5, 2],
  },
}

export const TARGET_STATES = Object.values(PROFILES)
