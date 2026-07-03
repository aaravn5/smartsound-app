import { CameraCapture, type CaptureStatus, type RoiSample } from './capture'
import { bandPeak, pos, steadinessFrom } from './pos'
import { EMPTY_BASELINE, IDLE_READING, type Baseline, type BiometricReading } from './types'

interface Timed extends RoiSample {
  t: number
}

/**
 * The Attune/Presence pipeline (§8): capture → ROI → POS → HR/steadiness/
 * respiration, all local. Emits a smoothed reading every frame and derives
 * arousal relative to the user's own baseline. A trend sensor, not a medical
 * device — confidence-gated throughout (§8.2).
 */
export class BiometricPipeline {
  private cap = new CameraCapture()
  private buf: Timed[] = []
  private readonly N = 300 // ~10 s at 30 fps
  private rafId = 0
  private lastT = 0
  private analyzeAcc = 0
  private phase = 0
  private hrHistory: number[] = []
  private smoothedHr = 64
  private smoothedResp = 7
  private reading: BiometricReading = { ...IDLE_READING }
  private baseline: Baseline = { ...EMPTY_BASELINE }

  onReading?: (r: BiometricReading) => void
  onStatus?: (s: CaptureStatus) => void

  get status(): CaptureStatus { return this.cap.status }
  get isActive(): boolean { return this.cap.active }
  get current(): BiometricReading { return this.reading }
  get currentBaseline(): Baseline { return this.baseline }

  async start(): Promise<CaptureStatus> {
    const status = await this.cap.start()
    this.onStatus?.(status)
    if (status === 'active') {
      this.lastT = performance.now()
      this.rafId = requestAnimationFrame(this.loop)
    }
    return status
  }

  stop(): void {
    cancelAnimationFrame(this.rafId)
    this.cap.stop()
    this.buf = []
    this.reading = { ...IDLE_READING }
    this.onStatus?.(this.cap.status)
  }

  /** Freeze current live values as the personal baseline (§8.1, onboarding). */
  captureBaseline(): Baseline {
    this.baseline = {
      hr: this.smoothedHr,
      respiration: this.smoothedResp,
      steadiness: this.reading.steadiness,
      captured: true,
    }
    return this.baseline
  }

  private loop = () => {
    const now = performance.now()
    const dt = (now - this.lastT) / 1000
    this.lastT = now

    const s = this.cap.sample()
    if (s) {
      this.buf.push({ ...s, t: now })
      if (this.buf.length > this.N) this.buf.shift()
    }

    // Ring pulse phase advances at the measured HR even between analyses.
    this.phase = (this.phase + dt * (this.smoothedHr / 60)) % 1

    this.analyzeAcc += dt
    if (this.analyzeAcc > 0.4 && this.buf.length >= 64) {
      this.analyzeAcc = 0
      this.analyze()
    } else {
      this.reading = { ...this.reading, phase: this.phase }
      this.onReading?.(this.reading)
    }
    this.rafId = requestAnimationFrame(this.loop)
  }

  private estimateFps(): number {
    if (this.buf.length < 2) return 30
    const span = (this.buf[this.buf.length - 1].t - this.buf[0].t) / 1000
    return span > 0 ? (this.buf.length - 1) / span : 30
  }

  private analyze(): void {
    const fps = this.estimateFps()
    const quality = this.buf.slice(-30).reduce((a, x) => a + x.quality, 0) / Math.min(30, this.buf.length)

    const pulse = pos(this.buf)
    const hrPeak = bandPeak(pulse, fps, 0.7, 4) // 42–240 bpm
    const respPeak = bandPeak(this.buf.map((x) => x.g), fps, 0.1, 0.5) // 6–30 br/min

    const confidence = Math.min(1, hrPeak.confidence * (0.4 + 0.6 * quality))

    if (hrPeak.freqHz > 0 && confidence > 0.15) {
      const hr = hrPeak.freqHz * 60
      // Confidence-weighted smoothing — no false precision (§8.1).
      const k = 0.12 + 0.25 * confidence
      this.smoothedHr += (hr - this.smoothedHr) * k
      this.hrHistory.push(this.smoothedHr)
      if (this.hrHistory.length > 48) this.hrHistory.shift()
    }
    if (respPeak.freqHz > 0) {
      this.smoothedResp += (respPeak.freqHz * 60 - this.smoothedResp) * 0.1
    }

    const steadiness = steadinessFrom(this.hrHistory)
    const arousal = this.deriveArousal(this.smoothedHr, steadiness)

    this.reading = {
      hr: this.smoothedHr,
      respiration: this.smoothedResp,
      steadiness,
      confidence,
      phase: this.phase,
      arousal,
      active: true,
    }
    this.onReading?.(this.reading)
  }

  /** Arousal relative to the user's own baseline (§8.1, §9.1). */
  private deriveArousal(hr: number, steadiness: number): number {
    if (this.baseline.captured) {
      const hrTerm = (hr - this.baseline.hr) / Math.max(30, this.baseline.hr)
      const steadyTerm = this.baseline.steadiness - steadiness
      return clamp(0.5 + hrTerm * 1.6 + steadyTerm * 0.5)
    }
    // No baseline yet: map absolute HR 52..92 bpm onto 0.2..0.85.
    return clamp(0.2 + ((hr - 52) / 40) * 0.65)
  }
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))
