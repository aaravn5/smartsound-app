import { PROFILES, type SoundscapeEngine } from '~/engine/audio'
import type { EngineParams, TargetState } from '~/engine/audio/types'
import type { BiometricReading } from '~/engine/biometric'
import { targetOffset } from '~/lib/calibration'

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))

/**
 * The closed loop (§9). Reads measured arousal against the target state and
 * moves engine parameters to close the gap — then holds. Changes are smooth and
 * rate-limited (a damped controller, never yanked, §9.2). Up-regulation is
 * capped by a safety rail; low signal confidence shrinks reactivity toward the
 * profile/circadian bias (§9.1 fail-safe). The neural-effect slider is a manual
 * override that always wins for a window after the user moves it (§9.2).
 */
export class LoopController {
  /** Damped control state: negative = down-regulate, positive = up-regulate. */
  private adjust = 0
  private depthOverrideUntil = 0
  target = PROFILES.focus
  /** Effective target arousal, including the NASA-TLX calibration offset. */
  private targetArousal = PROFILES.focus.targetArousal

  constructor(private engine: SoundscapeEngine) {}

  setTarget(state: TargetState): void {
    this.target = PROFILES[state]
    this.targetArousal = clamp(PROFILES[state].targetArousal + targetOffset(state))
  }

  /** Manual neural-intensity override — seizes depth for 6 s (§9.2). */
  setManualDepth(depth: number): void {
    this.depthOverrideUntil = performance.now() + 6000
    this.engine.setNeuralIntensity(depth)
  }

  /**
   * Advance the loop one step. Returns the measured arousal so the caller can
   * drive `--signal` from the user's real state.
   */
  update(reading: BiometricReading | null, dt: number): number {
    const base = this.target
    const active = !!reading?.active
    const measured = active ? reading!.arousal : this.targetArousal
    const conf = active ? reading!.confidence : 0

    const error = measured - this.targetArousal // + = over-activated
    // Desired correction opposes the error; safety rail caps up-regulation (+).
    let desired = clamp(-error * 1.4, -0.6, 0.4)
    // Confidence gating: unsure → lean on the profile, don't chase noise.
    desired *= 0.25 + 0.75 * conf

    // Damping — first-order approach toward the desired correction.
    const tau = 2.5
    this.adjust += (desired - this.adjust) * Math.min(1, dt / tau)
    const a = this.adjust

    const params: Partial<EngineParams> = {
      tempo: base.tempo * (1 + a * 0.16),
      density: clamp(base.density + a * 0.22),
      brightness: clamp(base.brightness + a * 0.2),
      entrainmentHz: Math.max(1.5, base.entrainmentHz + a * 3),
    }
    if (performance.now() > this.depthOverrideUntil) {
      params.neuralDepth = clamp(base.neuralDepth + a * 0.12)
    }
    this.engine.setParams(params, 1.6)
    return measured
  }

  reset(): void {
    this.adjust = 0
  }
}
