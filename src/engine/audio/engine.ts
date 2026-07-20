import { PROFILES } from './profiles'
import type { EngineParams, StateProfile, TargetState } from './types'

/**
 * SoundscapeEngine (§7) — a generative, layered, adaptively-modulated Web
 * Audio graph designed to sound like a premium calming pad (Calm/Endel), not
 * a clinical test tone. NOT a track player: every layer is synthesized live
 * so soundscapes are endless and never loop-obvious (§7.2).
 *
 * ── Signal chain ──────────────────────────────────────────────────────────
 *
 *   PAD   5 chord tones (just-intonation ratios per scape, `chordRatios`) ×
 *         2 detuned voices (sine+triangle, ±cents) → padMix → slow-drifting
 *         lowpass (padFilter) → stereo chorus (2 modulated DelayNodes panned
 *         L/R, summed back with the dry signal) → padAM (entrainment-AM gain)
 *         → bus (dry) + reverb send.
 *
 *   SUB   a quiet continuous drone at rootHz/4 (subOsc/subGain) — always-on
 *         low-end foundation — plus a slow bar-length swell (bassOsc through
 *         bassFilter/bassGain/bassAM, entrainment-AM'd) that breathes with
 *         the tempo instead of ticking on every beat.
 *
 *   AIR   filtered pink noise (noiseSrc) through a highpass+lowpass pair for
 *         a wind/ocean colour, with its own slow independent "breathing" LFO
 *         (noiseWaveGain) multiplied by the entrainment-AM gain (noiseAM) →
 *         bus + a light reverb send.
 *
 *   BELL  a sparse generative melodic layer: notes are scheduled at
 *         irregular, density-scaled intervals (not on the beat grid), picked
 *         from the scape's `scale`, played as a soft sine/triangle pluck with
 *         a slow attack and a long (3-5s) release → melodyBus → bus (dry,
 *         quiet) + a strong reverb send (bells live mostly "in the room").
 *
 *   VERB  a ConvolverNode loaded with a procedurally generated, smoothed
 *         (soft, non-hissy) stereo noise impulse response — reverbSend sums
 *         the pad/noise/bell sends, reverbReturn sets the wet level (darker
 *         scapes get slightly more space).
 *
 *   MIX   bus → analyser (tap for getSpectrum/getLevel) and bus → master →
 *         compressor → limiter → destination. Fade-in/out is a ramp on
 *         `master.gain`. Compressor+limiter are the safety net that keeps the
 *         richer mix from ever clipping or turning harsh.
 *
 * A single entrainment LFO (`entrainLFO`) still applies phase-locked
 * amplitude modulation to the pad/sub/air layers via per-layer depth gains
 * (`padDepth`/`noiseDepth`/`bassDepth`), scaled by `neuralDepth` — this is
 * the Brain.fm-style closed-loop hook (§7.3), untouched in mechanism. The
 * bell layer and reverb tail are deliberately left un-AM'd so the musical
 * layer never pulses mechanically; they still breathe indirectly since their
 * reverb sends are tapped post-AM. The closed loop (§9) drives everything via
 * `setParams()`; a manual override drives it via `setNeuralIntensity()`.
 */

const LOOKAHEAD = 0.12 // seconds of scheduler lookahead
const TICK_MS = 25
const BAR_BEATS = 4

const PAD_BASE = 0.16
const NOISE_BASE = 0.13
const BASS_BASE = 0.24
const SUB_BASE = 0.05
const MELODY_DRY = 0.5
const MELODY_WET = 0.85
const PAD_REVERB_SEND = 0.32
const NOISE_REVERB_SEND = 0.12

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

/**
 * A soft, non-hissy stereo reverb impulse response: smoothed (one-pole
 * low-passed) noise shaped by an exponential decay envelope. Smoothing keeps
 * the tail dark/gentle rather than bright/harsh; generating each channel
 * with independent noise decorrelates L/R for width.
 */
function softReverbImpulse(ctx: AudioContext, seconds = 3.2, decay = 3.0): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let prev = 0
    for (let i = 0; i < len; i++) {
      const t = i / len
      const n = Math.random() * 2 - 1
      prev = prev * 0.72 + n * 0.28
      d[i] = prev * Math.pow(1 - t, decay)
    }
  }
  return buf
}

/** MIDI note number → frequency (A4 = 440). */
const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** brightness 0..1 → filter cutoff Hz, perceptually spaced. */
const brightnessHz = (b: number) => 220 * Math.pow(36, Math.min(1, Math.max(0, b)))

/** Darker scapes sit in a slightly larger, wetter room. */
const wetLevelFor = (brightness: number) => 0.22 + (1 - Math.min(1, Math.max(0, brightness))) * 0.16

interface PadVoice {
  oscA: OscillatorNode
  oscB: OscillatorNode
  gain: GainNode
}

export class SoundscapeEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private bus!: GainNode
  private analyser!: AnalyserNode
  private compressor!: DynamicsCompressorNode
  private limiter!: DynamicsCompressorNode

  // reverb
  private reverb!: ConvolverNode
  private reverbSend!: GainNode
  private reverbReturn!: GainNode

  // pad
  private padVoices: PadVoice[] = []
  private padMix!: GainNode
  private padFilter!: BiquadFilterNode
  private padAM!: GainNode
  private padReverbSend!: GainNode
  private chorusDelayL!: DelayNode
  private chorusDelayR!: DelayNode
  private chorusPanL!: StereoPannerNode
  private chorusPanR!: StereoPannerNode
  private chorusLfoL!: OscillatorNode
  private chorusLfoR!: OscillatorNode
  private chorusLfoGainL!: GainNode
  private chorusLfoGainR!: GainNode

  // air / noise bed
  private noiseSrc!: AudioBufferSourceNode
  private noiseHP!: BiquadFilterNode
  private noiseLP!: BiquadFilterNode
  private noiseWaveLFO!: OscillatorNode
  private noiseWaveLFOGain!: GainNode
  private noiseWaveGain!: GainNode
  private noiseAM!: GainNode
  private noiseReverbSend!: GainNode

  // sub + bass swell
  private subOsc!: OscillatorNode
  private subGain!: GainNode
  private bassOsc!: OscillatorNode
  private bassFilter!: BiquadFilterNode
  private bassGain!: GainNode
  private bassAM!: GainNode

  // generative melodic / bell layer
  private melodyBus!: GainNode
  private melodyDry!: GainNode
  private melodyWet!: GainNode
  private nextMelodyTime = 0

  // ── Studio additions (score layer + atmospheres) ──────────────────────────
  // Score bus: the piano's output — dry + a generous reverb send, and
  // deliberately NEVER entrainment-AM'd, so the music never pulses.
  private musicBus!: GainNode
  private musicDry!: GainNode
  private musicWet!: GainNode
  private musicLevel = 0.9
  // Atmosphere input: Serene's synthesized weather layers sum here.
  private atmoIn!: GainNode
  private strikeBuf: AudioBuffer | null = null
  /** When the score steers harmony, bells quantize to these frequencies. */
  currentChordHz: number[] | null = null
  /** One entry per scheduled piano note — the deck flashes them as sparks. */
  readonly noteFlashes: { t: number; midi: number; vel: number }[] = []

  private entrainLFO!: OscillatorNode
  private padDepth!: GainNode
  private noiseDepth!: GainNode
  private bassDepth!: GainNode
  private slowLFO!: OscillatorNode
  private slowLFOGain!: GainNode

  private schedulerId: number | null = null
  private nextBeatTime = 0
  private beatCount = 0
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

    // ── reverb: soft procedural IR, fed by sends, returned into bus ──
    this.reverb = ctx.createConvolver()
    this.reverb.normalize = true
    this.reverb.buffer = softReverbImpulse(ctx)
    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = 1
    this.reverbReturn = ctx.createGain()
    this.reverbReturn.gain.value = wetLevelFor(this.profile.brightness)
    this.reverbSend.connect(this.reverb)
    this.reverb.connect(this.reverbReturn)
    this.reverbReturn.connect(this.bus)

    // ── entrainment LFO: one carrier → phase-locked AM across layers ──
    this.entrainLFO = ctx.createOscillator()
    this.entrainLFO.frequency.value = this.profile.entrainmentHz
    this.slowLFO = ctx.createOscillator()
    this.slowLFO.frequency.value = 0.033 // slow filter drift → endless evolution
    this.slowLFOGain = ctx.createGain()
    this.slowLFOGain.gain.value = 260
    this.slowLFO.connect(this.slowLFOGain)

    const cutoff = brightnessHz(this.profile.brightness)

    // ── pad layer: lush layered chord, chorus width, slow filter drift ──
    this.padMix = ctx.createGain()
    this.padMix.gain.value = 1
    this.padFilter = ctx.createBiquadFilter()
    this.padFilter.type = 'lowpass'
    this.padFilter.frequency.value = cutoff
    this.padFilter.Q.value = 0.7
    this.slowLFOGain.connect(this.padFilter.frequency)
    this.padMix.connect(this.padFilter)

    // stereo chorus: two slow, independently-modulated delay lines panned L/R
    this.chorusDelayL = ctx.createDelay(0.05)
    this.chorusDelayR = ctx.createDelay(0.05)
    this.chorusDelayL.delayTime.value = 0.018
    this.chorusDelayR.delayTime.value = 0.024
    this.chorusPanL = ctx.createStereoPanner()
    this.chorusPanR = ctx.createStereoPanner()
    this.chorusPanL.pan.value = -0.7
    this.chorusPanR.pan.value = 0.7
    this.chorusLfoL = ctx.createOscillator()
    this.chorusLfoR = ctx.createOscillator()
    this.chorusLfoL.frequency.value = 0.11
    this.chorusLfoR.frequency.value = 0.14
    this.chorusLfoGainL = ctx.createGain()
    this.chorusLfoGainR = ctx.createGain()
    this.chorusLfoGainL.gain.value = 0.006
    this.chorusLfoGainR.gain.value = 0.006
    this.chorusLfoL.connect(this.chorusLfoGainL)
    this.chorusLfoR.connect(this.chorusLfoGainR)
    this.chorusLfoGainL.connect(this.chorusDelayL.delayTime)
    this.chorusLfoGainR.connect(this.chorusDelayR.delayTime)

    this.padAM = ctx.createGain()
    this.padAM.gain.value = PAD_BASE
    this.padDepth = ctx.createGain()
    this.padDepth.gain.value = this.profile.neuralDepth * PAD_BASE
    this.entrainLFO.connect(this.padDepth)
    this.padDepth.connect(this.padAM.gain)

    // dry + widened copies all sum into padAM
    this.padFilter.connect(this.padAM)
    this.padFilter.connect(this.chorusDelayL)
    this.padFilter.connect(this.chorusDelayR)
    this.chorusDelayL.connect(this.chorusPanL)
    this.chorusDelayR.connect(this.chorusPanR)
    this.chorusPanL.connect(this.padAM)
    this.chorusPanR.connect(this.padAM)

    this.padReverbSend = ctx.createGain()
    this.padReverbSend.gain.value = PAD_REVERB_SEND
    this.padAM.connect(this.padReverbSend)
    this.padReverbSend.connect(this.reverbSend)
    this.padAM.connect(this.bus)

    // 5 chord tones × 2 detuned voices each (sine+triangle), extensions softer
    this.padVoices = this.profile.chordRatios.map((ratio, i) => {
      const weight = 1 / (1 + i * 0.55)
      const weightSum = this.profile.chordRatios.reduce((s, _r, j) => s + 1 / (1 + j * 0.55), 0)
      const perVoice = (weight / weightSum) / 2
      const oscA = ctx.createOscillator()
      oscA.type = 'sine'
      oscA.frequency.value = this.profile.rootHz * ratio
      oscA.detune.value = -5 + (Math.random() - 0.5) * 3
      const oscB = ctx.createOscillator()
      oscB.type = 'triangle'
      oscB.frequency.value = this.profile.rootHz * ratio
      oscB.detune.value = 5 + (Math.random() - 0.5) * 3
      const gain = ctx.createGain()
      gain.gain.value = perVoice
      oscA.connect(gain)
      oscB.connect(gain)
      gain.connect(this.padMix)
      return { oscA, oscB, gain }
    })

    // ── noise bed: filtered pink noise, wind/ocean colour, slow "breathing" ──
    this.noiseSrc = ctx.createBufferSource()
    this.noiseSrc.buffer = pinkNoiseBuffer(ctx)
    this.noiseSrc.loop = true
    this.noiseHP = ctx.createBiquadFilter()
    this.noiseHP.type = 'highpass'
    this.noiseHP.frequency.value = 80
    this.noiseLP = ctx.createBiquadFilter()
    this.noiseLP.type = 'lowpass'
    this.noiseLP.frequency.value = cutoff * 0.6
    this.noiseLP.Q.value = 0.5
    this.noiseWaveLFO = ctx.createOscillator()
    this.noiseWaveLFO.frequency.value = 0.06 // slow wave-like swell, independent of entrainment
    this.noiseWaveLFOGain = ctx.createGain()
    this.noiseWaveLFOGain.gain.value = NOISE_BASE * 0.35
    this.noiseWaveGain = ctx.createGain()
    this.noiseWaveGain.gain.value = NOISE_BASE * 0.65
    this.noiseWaveLFO.connect(this.noiseWaveLFOGain)
    this.noiseWaveLFOGain.connect(this.noiseWaveGain.gain)
    this.noiseAM = ctx.createGain()
    this.noiseAM.gain.value = 1
    this.noiseDepth = ctx.createGain()
    this.noiseDepth.gain.value = this.profile.neuralDepth * NOISE_BASE
    this.entrainLFO.connect(this.noiseDepth)
    this.noiseDepth.connect(this.noiseAM.gain)
    this.noiseSrc.connect(this.noiseHP)
    this.noiseHP.connect(this.noiseLP)
    this.noiseLP.connect(this.noiseWaveGain)
    this.noiseWaveGain.connect(this.noiseAM)
    this.noiseReverbSend = ctx.createGain()
    this.noiseReverbSend.gain.value = NOISE_REVERB_SEND
    this.noiseAM.connect(this.noiseReverbSend)
    this.noiseReverbSend.connect(this.reverbSend)
    this.noiseAM.connect(this.bus)

    // ── sub drone (always-on low foundation) + bar-length bass swell ──
    this.subOsc = ctx.createOscillator()
    this.subOsc.type = 'sine'
    this.subOsc.frequency.value = this.profile.rootHz / 4
    this.subGain = ctx.createGain()
    this.subGain.gain.value = SUB_BASE
    this.subOsc.connect(this.subGain)
    this.subGain.connect(this.bus)

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

    // ── generative melodic / bell layer ──
    this.melodyBus = ctx.createGain()
    this.melodyBus.gain.value = 1
    this.melodyDry = ctx.createGain()
    this.melodyDry.gain.value = MELODY_DRY
    this.melodyWet = ctx.createGain()
    this.melodyWet.gain.value = MELODY_WET
    this.melodyBus.connect(this.melodyDry)
    this.melodyBus.connect(this.melodyWet)
    this.melodyDry.connect(this.bus)
    this.melodyWet.connect(this.reverbSend)

    // ── studio buses ──
    this.musicBus = ctx.createGain()
    this.musicBus.gain.value = this.musicLevel
    this.musicDry = ctx.createGain()
    this.musicDry.gain.value = 0.9
    this.musicWet = ctx.createGain()
    this.musicWet.gain.value = 0.55
    this.musicBus.connect(this.musicDry)
    this.musicBus.connect(this.musicWet)
    this.musicDry.connect(this.bus)
    this.musicWet.connect(this.reverbSend)
    this.atmoIn = ctx.createGain()
    this.atmoIn.gain.value = 1
    this.atmoIn.connect(this.bus)

    // start everything
    this.padVoices.forEach((v) => { v.oscA.start(now); v.oscB.start(now) })
    this.noiseSrc.start(now)
    this.subOsc.start(now)
    this.bassOsc.start(now)
    this.entrainLFO.start(now)
    this.slowLFO.start(now)
    this.noiseWaveLFO.start(now)
    this.chorusLfoL.start(now)
    this.chorusLfoR.start(now)

    // fade in like a calibration sweep
    this.master.gain.setValueAtTime(0.0001, now)
    this.master.gain.exponentialRampToValueAtTime(0.85, now + 2.2)

    this.nextBeatTime = now + 0.1
    this.nextMelodyTime = now + 2.5 + Math.random() * 3
    this.beatCount = 0
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
    while (this.nextMelodyTime < ctx.currentTime + LOOKAHEAD) {
      this.scheduleMelodyNote(this.nextMelodyTime)
    }
  }

  /** Bar-length bass swell — a slow breath, not a beat-by-beat pulse. */
  private scheduleBeat(t: number) {
    if (this.beatCount % BAR_BEATS === 0) {
      const barSeconds = (60 / this.params.tempo) * BAR_BEATS
      const g = this.bassGain.gain
      g.cancelScheduledValues(t)
      g.setValueAtTime(0.0001, t)
      g.exponentialRampToValueAtTime(0.5, t + barSeconds * 0.35)
      g.exponentialRampToValueAtTime(0.0001, t + barSeconds * 0.95)
    }
    this.beatCount++
  }

  /** Sparse, irregularly-timed melodic pluck — quantized to the scape's scale. */
  private scheduleMelodyNote(t: number) {
    let freq: number
    if (this.currentChordHz && this.currentChordHz.length) {
      const f = this.currentChordHz[Math.floor(Math.random() * this.currentChordHz.length)]
      freq = f * (Math.random() < 0.7 ? 1 : 2)
    } else {
      const scale = this.profile.scale
      const ratio = scale[Math.floor(Math.random() * scale.length)]
      const octaveMul = Math.random() < 0.7 ? 2 : 4
      freq = this.profile.rootHz * ratio * octaveMul
    }
    this.pluckMelody(t, freq)
    const density = Math.min(1, Math.max(0, this.params.density))
    const meanGap = 15 - density * 9 // denser scapes → notes arrive more often
    const gap = Math.max(3.5, meanGap + (Math.random() - 0.5) * 6)
    this.nextMelodyTime = t + gap
  }

  private pluckMelody(t: number, freq: number) {
    const ctx = this.ctx
    if (!ctx) return
    const osc = ctx.createOscillator()
    osc.type = Math.random() < 0.6 ? 'sine' : 'triangle'
    osc.frequency.value = freq
    const filt = ctx.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = freq * 2.4
    filt.Q.value = 0.6
    const g = ctx.createGain()
    const peak = 0.13 + Math.random() * 0.05
    const release = 3.0 + Math.random() * 1.6
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(peak, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + release)
    const pan = ctx.createStereoPanner()
    pan.pan.value = (Math.random() - 0.5) * 0.8
    osc.connect(filt)
    filt.connect(g)
    g.connect(pan)
    pan.connect(this.melodyBus)
    osc.start(t)
    osc.stop(t + release + 0.3)
  }

  /** Crossfade to a new target state's full profile (§7). */
  setState(state: TargetState) {
    if (!this.ctx || !this.running) { this.profile = PROFILES[state]; this.params = { ...PROFILES[state] }; return }
    this.profile = PROFILES[state]
    this.setParams({ ...PROFILES[state] }, 3)
    const now = this.ctx.currentTime
    this.bassOsc.frequency.setTargetAtTime(PROFILES[state].rootHz / 2, now, 1.5)
    this.subOsc.frequency.setTargetAtTime(PROFILES[state].rootHz / 4, now, 1.5)
    this.padVoices.forEach((v, i) => {
      const f = PROFILES[state].rootHz * PROFILES[state].chordRatios[i]
      v.oscA.frequency.setTargetAtTime(f, now, 1.5)
      v.oscB.frequency.setTargetAtTime(f, now, 1.5)
    })
    this.reverbReturn.gain.setTargetAtTime(wetLevelFor(PROFILES[state].brightness), now, 2)
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
      this.noiseLP.frequency.setTargetAtTime(hz * 0.6, now, tau)
    }
    if (p.tempo != null) this.params.tempo = p.tempo
    if (p.density != null) this.params.density = p.density
  }

  /** Manual "neural effect intensity" control (§7.3). */
  setNeuralIntensity(depth: number) {
    this.setParams({ neuralDepth: Math.min(1, Math.max(0, depth)) }, 0.6)
  }

  /** The audio-graph entry point for the studio's atmosphere layers. */
  get atmosphereInput(): GainNode | null {
    return this.running ? this.atmoIn : null
  }

  /** Score volume — a real gain on the un-AM'd music bus. */
  setMusicLevel(level: number) {
    this.musicLevel = level
    if (this.ctx && this.running)
      this.musicBus.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4)
  }

  /** The score steers the harmony: pad voices + sub/bass follow the chord. */
  setChord(bassMidi: number, toneMidis: number[], glide = 1.2) {
    if (!this.ctx || !this.running) return
    const now = this.ctx.currentTime
    const freqs = toneMidis.map(midiHz)
    this.currentChordHz = freqs
    this.padVoices.forEach((v, i) => {
      const f = i < freqs.length ? freqs[i] : freqs[i - freqs.length] * 2
      v.oscA.frequency.setTargetAtTime(f, now, glide / 3)
      v.oscB.frequency.setTargetAtTime(f, now, glide / 3)
    })
    let sub = midiHz(bassMidi)
    while (sub > 55) sub /= 2
    while (sub < 27) sub *= 2
    this.subOsc.frequency.setTargetAtTime(sub, now, glide / 2)
    this.bassOsc.frequency.setTargetAtTime(sub * 2, now, glide / 2)
  }

  /** Return the pad/sub to the profile voicing (score off / sleep). */
  resetChord() {
    if (!this.ctx || !this.running) return
    this.currentChordHz = null
    const now = this.ctx.currentTime
    const p = this.profile
    this.padVoices.forEach((v, i) => {
      const f = p.rootHz * p.chordRatios[i]
      v.oscA.frequency.setTargetAtTime(f, now, 0.6)
      v.oscB.frequency.setTargetAtTime(f, now, 0.6)
    })
    this.subOsc.frequency.setTargetAtTime(p.rootHz / 4, now, 0.6)
    this.bassOsc.frequency.setTargetAtTime(p.rootHz / 2, now, 0.6)
  }

  /** The studio's piano voice: 3 partials + a hammer whisper, per-note LP. */
  piano(t: number, midi: number, vel: number, dur: number, pan = 0) {
    const ctx = this.ctx
    if (!ctx || !this.running) return
    this.noteFlashes.push({ t, midi, vel })
    const f = midiHz(midi)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vel, t + 0.008)
    g.gain.setTargetAtTime(vel * 0.28, t + 0.01, 0.85)
    g.gain.setTargetAtTime(0.0001, t + dur, 0.13)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = Math.min(9000, 900 + vel * 14000 + f * 1.5)
    lp.Q.value = 0.4
    const pn = ctx.createStereoPanner()
    pn.pan.value = Math.max(-0.55, Math.min(0.55, pan + (midi - 62) / 60))
    const stopAt = t + dur + 1.6
    const partials: [number, number][] = [[1, 1], [2.0015, 0.34], [2.998, 0.14]]
    for (const [mul, amp] of partials) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f * mul
      const og = ctx.createGain()
      og.gain.value = amp
      o.connect(og)
      og.connect(g)
      o.start(t)
      o.stop(stopAt)
    }
    if (!this.strikeBuf) {
      const len = Math.floor(ctx.sampleRate * 0.1)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5
      this.strikeBuf = buf
    }
    const nb = ctx.createBufferSource()
    nb.buffer = this.strikeBuf
    const nf = ctx.createBiquadFilter()
    nf.type = 'bandpass'
    nf.frequency.value = Math.min(8000, f * 3)
    nf.Q.value = 1.2
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(vel * 0.5, t)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)
    nb.connect(nf)
    nf.connect(ng)
    ng.connect(g)
    nb.start(t)
    nb.stop(t + 0.1)
    g.connect(lp)
    lp.connect(pn)
    pn.connect(this.musicBus)
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
    this.noteFlashes.length = 0
    this.currentChordHz = null
    await new Promise((r) => setTimeout(r, 700))
    try {
      this.padVoices.forEach((v) => { v.oscA.stop(); v.oscB.stop() })
      this.noiseSrc.stop()
      this.subOsc.stop()
      this.bassOsc.stop()
      this.entrainLFO.stop()
      this.slowLFO.stop()
      this.noiseWaveLFO.stop()
      this.chorusLfoL.stop()
      this.chorusLfoR.stop()
      await ctx.close()
    } catch {
      /* already stopped */
    }
    this.ctx = null
  }
}
