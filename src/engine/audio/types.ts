/** Audio engine types (§7). */

export type TargetState = 'focus' | 'flow' | 'calm' | 'winddown' | 'sleep'

/**
 * A tunable snapshot of the engine. The closed loop (§9) writes these; the UI
 * reads them. All values are normalized 0..1 except where noted so the loop can
 * reason about them uniformly.
 */
export interface EngineParams {
  /** AM entrainment carrier rate in Hz (beta≈15 focus … delta≈2.5 sleep). */
  entrainmentHz: number
  /** Modulation depth = the "neural effect intensity" control, 0..1. */
  neuralDepth: number
  /** Master brightness (filter cutoff bias), 0..1. */
  brightness: number
  /** Rhythmic layer tempo, BPM. */
  tempo: number
  /** Layer density — how much percussion/texture is present, 0..1. */
  density: number
}

/** A named target state with its default parameter profile. */
export interface StateProfile extends EngineParams {
  key: TargetState
  label: string
  /** Target arousal on the --signal arc (0 wound-down … 1 elevated). */
  targetArousal: number
  /** Musical root in Hz, derived from 440 Hz reference tuning (§7.2). */
  rootHz: number
  /**
   * Chord voicing (just-intonation ratios over rootHz) for the pad layer.
   * Always 5 entries so the persistent pad voices can be retuned in place
   * when the scape changes without recreating oscillators.
   */
  chordRatios: readonly number[]
  /**
   * Scale degrees (ratios over rootHz, one octave) the generative melodic
   * layer quantizes to — a pentatonic-ish set tailored per scape.
   */
  scale: readonly number[]
}
