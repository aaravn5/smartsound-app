import { CHORD_RATIOS, PROFILES } from './profiles'
import type { EngineParams, StateProfile, TargetState } from './types'

/**
 * SoundscapeEngine (§7) — a generative, layered, adaptively-modulated Web Audio
 * graph. NOT a track player: pads are live detuned oscillators, the bed is
 * generated pink noise, percussion is procedurally scheduled, so soundscapes are
 * endless and never loop-obvious (§7.2). A single entrainment LFO applies
 * phase-locked amplitude modulation across layers (§7.3, Brain.fm-style — not
 * binaural beats). A compressor→limiter master chain subdues transients so the
 * sound sits in the background (§7.2). The closed loop (§9) drives it via
 * setParams(); a manual override drives it via setNeuralIntensity()/setState().
 */

const LOOKAHEAD = 0.12 // seconds of scheduler lookahead
const TICK_MS = 25

const PAD_BASE = 0.15
const NOISE_BASE = 0.13
const BASS_BASE = 0.22

interface CompSettings {
  threshold: number
  knee: number
  ratio: number
  attack: number
  release: number
}

function setComp(c: DynamicsCompressorNode, s: CompSettings) {
  c.threshold.value = s.threshold
  c.knee.value = s.knee
  c.ratio.value = s.ratio
  c.attack.value = s.attack
  c.release.value = s.release
}

function pinkNoiseBuffer(ctx: AudioContext, seconds = 6): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    d[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12
  }
  return buf
}

function shortNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * 0.2)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** brightness 0..1 → filter cutoff Hz, perceptually spaced. */
const brightnessHz = (b: number) => 220 * Math.pow(36, Math.min(1, Math.max(0, b)))

export class SoundscapeEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private bus!: GainNode
  private analyser!: AnalyserNode
  private compressor!: DynamicsCompressorNode
  private limiter!: DynamicsCompressorNode

  private padOscs: OscillatorNode[] = []
  private padFilter!: BiquadFilterNode
  private padAM!: GainNode
  private noiseSrc!: AudioBufferSourceNode
  private noiseFilter!: BiquadFilterNode
  private noiseAM!: GainNode
  private bassOsc!: OscillatorNode
  private bassFilter!: BiquadFilterNode
  private bassGain!: GainNode
  private bassAM!: GainNode
  private percGain!: GainNode
  private tickBuffer!: AudioBuffer

  private entrainLFO!: OscillatorNode
  private padDepth!: GainNode
  private noiseDepth!: GainNode
  private bassDepth!: GainNode
  private slowLFO!: OscillatorNode
  private slowLFOGain!: GainNode

  private schedulerId: number | null = null
  private nextBeatTime = 0
  private running = false
  private profile: StateProfile = PROFILES.focus
  private params: EngineParams = { ...PROFILES.focus }
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(2048))

  get isRunning() { return this.running }
  get currentParams(): EngineParams { return { ...this.params } }
  get currentProfile(): StateProfile { return this.profile }
  get context() { return this.ctx }

  async start(state: TargetState): Promise<void> {
    if (this.running) { this.setState(state); return }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    this.ctx = ctx
    await ctx.resume()
    const now = ctx.currentTime
    this.profile = PROFILES[state]
    this.params = { ...this.profile }

    // ── master chain: bus → analyser + (comp → limiter → out) ──
    this.master = ctx.createGain()
    this.master.gain.value = 0.0001
    this.compressor = ctx.createDynamicsCompressor()
    setComp(this.compressor, { threshold: -24, knee: 30, ratio: 4, attack: 0.02, release: 0.28 })
    this.limiter = ctx.createDynamicsCompressor()
    setComp(this.limiter, { threshold: -3, knee: 0, ratio: 20, attack: 0.003, release: 0.1 })
    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.82
    this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
    this.bus = ctx.createGain()
    this.bus.connect(this.analyser)
    this.bus.connect(this.master)
    this.master.connect(this.compressor)
    this.compressor.connect(this.limiter)
    this.limiter.connect(ctx.destination)

    // ── entrainment LFO: one carrier → phase-locked AM across layers ──
    this.entrainLFO = ctx.createOscillator()
    this.entrainLFO.frequency.value = this.profile.entrainmentHz
    this.slowLFO = ctx.createOscillator()
    this.slowLFO.frequency.value = 0.033 // slow filter drift → endless evolution
    this.slowLFOGain = ctx.createGain()
    this.slowLFOGain.gain.value = 260
    this.slowLFO.connect(this.slowLFOGain)

    const cutoff = brightnessHz(this.profile.brightness)

    // ── pad layer: detuned consonant chord ──
    this.padFilter = ctx.createBiquadFilter()
    this.padFilter.type = 'lowpass'
    this.padFilter.frequency.value = cutoff
    this.padFilter.Q.value = 0.7
    this.slowLFOGain.connect(this.padFilter.frequency)
    this.padAM = ctx.createGain()
    this.padAM.gain.value = PAD_BASE
    this.padDepth = ctx.createGain()
    this.padDepth.gain.value = this.profile.neuralDepth * PAD_BASE
    this.entrainLFO.connect(this.padDepth)
    this.padDepth.connect(this.padAM.gain)
    this.padFilter.connect(this.padAM)
    this.padAM.connect(this.bus)
    this.padOscs = CHORD_RATIOS.map((ratio, i) => {
      const osc = ctx.createOscillator()
      osc.type = i === 0 ? 'sine' : 'triangle'
      osc.frequency.value = this.profile.rootHz * ratio
      osc.detune.value = (i - 2) * 4 // subtle spread
      osc.connect(this.padFilter)
      return osc
    })

    // ── noise bed ──
    this.noiseSrc = ctx.createBufferSource()
    this.noiseSrc.buffer = pinkNoiseBuffer(ctx)
    this.noiseSrc.loop = true
    this.noiseFilter = ctx.createBiquadFilter()
    this.noiseFilter.type = 'lowpass'
    this.noiseFilter.frequency.value = cutoff * 0.6
    this.noiseFilter.Q.value = 0.5
    this.noiseAM = ctx.createGain()
    this.noiseAM.gain.value = NOISE_BASE
    this.noiseDepth = ctx.createGain()
    this.noiseDepth.gain.value = this.profile.neuralDepth * NOISE_BASE
    this.entrainLFO.connect(this.noiseDepth)
    this.noiseDepth.connect(this.noiseAM.gain)
    this.noiseSrc.connect(this.noiseFilter)
    this.noiseFilter.connect(this.noiseAM)
    this.noiseAM.connect(this.bus)

    // ── bass pulse (envelope scheduled to tempo) ──
    this.bassOsc = ctx.createOscillator()
    this.bassOsc.type = 'sine'
    this.bassOsc.frequency.value = this.profile.rootHz / 2
    this.bassFilter = ctx.createBiquadFilter()
    this.bassFilter.type = 'lowpass'
    this.bassFilter.frequency.value = 220
    this.bassGain = ctx.createGain()
    this.bassGain.gain.value = 0.0001
    this.bassAM = ctx.createGain()
    this.bassAM.gain.value = BASS_BASE
    this.bassDepth = ctx.createGain()
    this.bassDepth.gain.value = this.profile.neuralDepth * BASS_BASE * 0.5
    this.entrainLFO.connect(this.bassDepth)
    this.bassDepth.connect(this.bassAM.gain)
    this.bassOsc.connect(this.bassFilter)
    this.bassFilter.connect(this.bassGain)
    this.bassGain.connect(this.bassAM)
    this.bassAM.connect(this.bus)

    // ── percussion bus ──
    this.percGain = ctx.createGain()
    this.percGain.gain.value = 0.9
    this.percGain.connect(this.bus)
    this.tickBuffer = shortNoiseBuffer(ctx)

    // start everything
    this.padOscs.forEach((o) => o.start(now))
    this.noiseSrc.start(now)
    this.bassOsc.start(now)
    this.entrainLFO.start(now)
    this.slowLFO.start(now)

    // fade in like a calibration sweep
    this.master.gain.setValueAtTime(0.0001, now)
    this.master.gain.exponentialRampToValueAtTime(0.85, now + 2.2)

    this.nextBeatTime = now + 0.1
    this.running = true
    this.schedulerId = window.setInterval(this.scheduleTick, TICK_MS)
  }

  private scheduleTick = () => {
    const ctx = this.ctx
    if (!ctx) return
    while (this.nextBeatTime < ctx.currentTime + LOOKAHEAD) {
      this.scheduleBeat(this.nextBeatTime)
      this.nextBeatTime += 60 / this.params.tempo
    }
  }

  private scheduleBeat(t: number) {
    const beat = 60 / this.params.tempo
    // bass pulse envelope
    const g = this.bassGain.gain
    g.cancelScheduledValues(t)
    g.setValueAtTime(0.0001, t)
    g.exponentialRampToValueAtTime(0.6, t + 0.03)
    g.exponentialRampToValueAtTime(0.0001, t + beat * 0.92)
    // sparse offbeat percussion, probability = density
    if (Math.random() < this.params.density) this.tick(t + beat * 0.5)
  }

  private tick(t: number) {
    const ctx = this.ctx
    if (!ctx) return
    const src = ctx.createBufferSource()
    src.buffer = this.tickBuffer
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800 + 2600 * this.params.brightness
    bp.Q.value = 1.4
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    src.connect(bp)
    bp.connect(g)
    g.connect(this.percGain)
    src.start(t)
    src.stop(t + 0.16)
  }

  /** Crossfade to a new target state's full profile (§7). */
  setState(state: TargetState) {
    if (!this.ctx || !this.running) { this.profile = PROFILES[state]; this.params = { ...PROFILES[state] }; return }
    this.profile = PROFILES[state]
    this.setParams({ ...PROFILES[state] }, 3)
    this.bassOsc.frequency.setTargetAtTime(PROFILES[state].rootHz / 2, this.ctx.currentTime, 1.5)
    this.padOscs.forEach((o, i) => {
      o.frequency.setTargetAtTime(PROFILES[state].rootHz * CHORD_RATIOS[i], this.ctx!.currentTime, 1.5)
    })
  }

  /** The closed loop / manual override writes params here, smoothly (§9.2). */
  setParams(p: Partial<EngineParams>, rampSeconds = 1.2) {
    if (!this.ctx || !this.running) { this.params = { ...this.params, ...p }; return }
    const now = this.ctx.currentTime
    const tau = rampSeconds / 3
    if (p.entrainmentHz != null) {
      this.params.entrainmentHz = p.entrainmentHz
      this.entrainLFO.frequency.setTargetAtTime(p.entrainmentHz, now, tau)
    }
    if (p.neuralDepth != null) {
      this.params.neuralDepth = p.neuralDepth
      this.padDepth.gain.setTargetAtTime(p.neuralDepth * PAD_BASE, now, tau)
      this.noiseDepth.gain.setTargetAtTime(p.neuralDepth * NOISE_BASE, now, tau)
      this.bassDepth.gain.setTargetAtTime(p.neuralDepth * BASS_BASE * 0.5, now, tau)
    }
    if (p.brightness != null) {
      this.params.brightness = p.brightness
      const hz = brightnessHz(p.brightness)
      this.padFilter.frequency.setTargetAtTime(hz, now, tau)
      this.noiseFilter.frequency.setTargetAtTime(hz * 0.6, now, tau)
    }
    if (p.tempo != null) this.params.tempo = p.tempo
    if (p.density != null) this.params.density = p.density
  }

  /** Manual "neural effect intensity" control (§7.3). */
  setNeuralIntensity(depth: number) {
    this.setParams({ neuralDepth: Math.min(1, Math.max(0, depth)) }, 0.6)
  }

  /** Live FFT for the signal ring (§11 — real bins, not fake bars). */
  getSpectrum(): Uint8Array {
    if (this.analyser) this.analyser.getByteFrequencyData(this.freqData)
    return this.freqData
  }

  /** Overall output level 0..1, for glow/energy. */
  getLevel(): number {
    const d = this.getSpectrum()
    let sum = 0
    for (let i = 0; i < d.length; i++) sum += d[i]
    return sum / (d.length * 255)
  }

  async stop(): Promise<void> {
    if (!this.ctx || !this.running) return
    const ctx = this.ctx
    const now = ctx.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setTargetAtTime(0.0001, now, 0.2)
    if (this.schedulerId != null) window.clearInterval(this.schedulerId)
    this.schedulerId = null
    this.running = false
    await new Promise((r) => setTimeout(r, 700))
    try {
      this.padOscs.forEach((o) => o.stop())
      this.noiseSrc.stop()
      this.bassOsc.stop()
      this.entrainLFO.stop()
      this.slowLFO.stop()
      await ctx.close()
    } catch {
      /* already stopped */
    }
    this.ctx = null
  }
}
