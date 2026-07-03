import type { StateProfile, TargetState } from './types'

/**
 * State profiles (§7.4). Entrainment rates follow the classic bands — beta for
 * focus, alpha for calm/flow, theta for wind-down, delta for sleep — used here
 * as *amplitude modulation* rates (Brain.fm-style), not binaural beats (§7.3).
 * Roots are derived from A=440 (§7.2).
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
  },
}

export const TARGET_STATES = Object.values(PROFILES)

/** A small pentatonic-ish set of ratios over the root — always consonant. */
export const CHORD_RATIOS = [1, 1.2, 1.5, 2, 2.4] as const
