import type { SoundscapeEngine } from './engine'

/**
 * The Studio atmospheres — Serene's nine synthesized weather layers,
 * ported whole from the calm app (/root/projects/calm). Each builder
 * returns real Web Audio nodes; nothing is a recording. Layers sum into
 * the engine's atmosphere input so they pass the same analyser/limiter.
 * Interval-based builders bail while the context isn't running so a
 * paused session never piles up scheduled events.
 */

interface Stoppable { stop(): void }
interface BuiltAtmo { nodes: Stoppable[]; out: GainNode }

export interface AtmoDef {
  id: string
  name: string
  desc: string
  vol: number
  build(ac: AudioContext): BuiltAtmo
}

function noiseBuffer(ac: AudioContext, type: 'white' | 'brown' = 'white', seconds = 2): AudioBuffer {
  const len = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    if (type === 'brown') {
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    } else {
      data[i] = white
    }
  }
  return buf
}

export const ATMOS: AtmoDef[] = [
  {
    id: 'rain', name: 'Rain', desc: 'Steady rainfall', vol: 0.7,
    build(ac) {
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac)
      src.loop = true
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600
      const out = ac.createGain()
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.25
      const lfoGain = ac.createGain(); lfoGain.gain.value = 0.06
      const base = ac.createGain(); base.gain.value = 0.85
      lfo.connect(lfoGain); lfoGain.connect(base.gain)
      src.connect(hp); hp.connect(lp); lp.connect(base); base.connect(out)
      src.start(); lfo.start()
      return { nodes: [src, lfo], out }
    },
  },
  {
    id: 'thunder', name: 'Thunderstorm', desc: 'Distant rolling thunder', vol: 0.75,
    build(ac) {
      const out = ac.createGain()
      const bedSrc = ac.createBufferSource()
      bedSrc.buffer = noiseBuffer(ac)
      bedSrc.loop = true
      const bedHp = ac.createBiquadFilter(); bedHp.type = 'highpass'; bedHp.frequency.value = 600
      const bedLp = ac.createBiquadFilter(); bedLp.type = 'lowpass'; bedLp.frequency.value = 2200
      const bed = ac.createGain(); bed.gain.value = 0.4
      bedSrc.connect(bedHp); bedHp.connect(bedLp); bedLp.connect(bed); bed.connect(out)
      bedSrc.start()
      let cancelled = false
      let timer = 0
      const rumble = () => {
        if (cancelled) return
        if (ac.state === 'running') {
          const t = ac.currentTime + 0.05
          const dur = 2.5 + Math.random() * 3
          const src = ac.createBufferSource()
          src.buffer = noiseBuffer(ac, 'brown')
          src.loop = true
          const lp = ac.createBiquadFilter(); lp.type = 'lowpass'
          lp.frequency.setValueAtTime(160, t)
          lp.frequency.exponentialRampToValueAtTime(60, t + dur)
          const g = ac.createGain()
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.9 + Math.random() * 0.5, t + 0.25 + Math.random() * 0.4)
          g.gain.exponentialRampToValueAtTime(0.001, t + dur)
          src.connect(lp); lp.connect(g); g.connect(out)
          src.start(t); src.stop(t + dur + 0.1)
        }
        timer = window.setTimeout(rumble, (6 + Math.random() * 14) * 1000)
      }
      timer = window.setTimeout(rumble, 1200)
      return { nodes: [bedSrc, { stop: () => { cancelled = true; window.clearTimeout(timer) } }], out }
    },
  },
  {
    id: 'ocean', name: 'Ocean', desc: 'Waves on the shore', vol: 0.7,
    build(ac) {
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac, 'brown')
      src.loop = true
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 850
      const swell = ac.createGain(); swell.gain.value = 0.55
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.08
      const lfoGain = ac.createGain(); lfoGain.gain.value = 0.4
      lfo.connect(lfoGain); lfoGain.connect(swell.gain)
      const out = ac.createGain()
      src.connect(lp); lp.connect(swell); swell.connect(out)
      src.start(); lfo.start()
      return { nodes: [src, lfo], out }
    },
  },
  {
    id: 'stream', name: 'Stream', desc: 'A brook over stones', vol: 0.6,
    build(ac) {
      const out = ac.createGain()
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac)
      src.loop = true
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200
      const lfos: OscillatorNode[] = []
      const bands: [number, number, number][] = [[640, 1.1, 220], [1350, 1.9, 420]]
      for (const [f, rate, depth] of bands) {
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.6
        const lfo = ac.createOscillator(); lfo.frequency.value = rate
        const lfoGain = ac.createGain(); lfoGain.gain.value = depth
        lfo.connect(lfoGain); lfoGain.connect(bp.frequency)
        const g = ac.createGain(); g.gain.value = 0.5
        src.connect(bp); bp.connect(g); g.connect(lp)
        lfo.start(); lfos.push(lfo)
      }
      lp.connect(out)
      src.start()
      return { nodes: [src, ...lfos], out }
    },
  },
  {
    id: 'wind', name: 'Wind', desc: 'Air through the pines', vol: 0.6,
    build(ac) {
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac)
      src.loop = true
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450; bp.Q.value = 0.8
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.11
      const lfoGain = ac.createGain(); lfoGain.gain.value = 260
      lfo.connect(lfoGain); lfoGain.connect(bp.frequency)
      const out = ac.createGain()
      src.connect(bp); bp.connect(out)
      src.start(); lfo.start()
      return { nodes: [src, lfo], out }
    },
  },
  {
    id: 'birds', name: 'Forest Birds', desc: 'Morning songbirds', vol: 0.55,
    build(ac) {
      const out = ac.createGain()
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac)
      src.loop = true
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5
      const bed = ac.createGain(); bed.gain.value = 0.12
      src.connect(bp); bp.connect(bed); bed.connect(out)
      src.start()
      const sing = window.setInterval(() => {
        if (ac.state !== 'running' || Math.random() > 0.55) return
        const notes = 2 + Math.floor(Math.random() * 3)
        const f0 = 2200 + Math.random() * 1800
        let t = ac.currentTime + Math.random() * 0.4
        for (let n = 0; n < notes; n++) {
          const osc = ac.createOscillator()
          osc.type = 'sine'
          const fA = f0 * (0.9 + Math.random() * 0.25)
          const fB = fA * (1.1 + Math.random() * 0.5)
          const dur = 0.07 + Math.random() * 0.12
          osc.frequency.setValueAtTime(fA, t)
          osc.frequency.exponentialRampToValueAtTime(fB, t + dur * 0.6)
          osc.frequency.exponentialRampToValueAtTime(fA * 0.95, t + dur)
          const g = ac.createGain()
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.08, t + 0.015)
          g.gain.exponentialRampToValueAtTime(0.001, t + dur)
          osc.connect(g); g.connect(out)
          osc.start(t); osc.stop(t + dur + 0.02)
          t += dur + 0.04 + Math.random() * 0.12
        }
      }, 900)
      return { nodes: [src, { stop: () => window.clearInterval(sing) }], out }
    },
  },
  {
    id: 'fire', name: 'Campfire', desc: 'Crackling embers', vol: 0.65,
    build(ac) {
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac, 'brown')
      src.loop = true
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900
      const out = ac.createGain()
      src.connect(lp); lp.connect(out)
      src.start()
      const crackle = window.setInterval(() => {
        if (ac.state !== 'running' || Math.random() > 0.55) return
        const c = ac.createBufferSource()
        c.buffer = noiseBuffer(ac, 'white', 0.3)
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1600
        const g = ac.createGain()
        const t = ac.currentTime
        g.gain.setValueAtTime(0.5 + Math.random() * 0.5, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04 + Math.random() * 0.08)
        c.connect(hp); hp.connect(g); g.connect(out)
        c.start(t); c.stop(t + 0.15)
      }, 140)
      return { nodes: [src, { stop: () => window.clearInterval(crackle) }], out }
    },
  },
  {
    id: 'night', name: 'Night', desc: 'Crickets after dark', vol: 0.5,
    build(ac) {
      const out = ac.createGain()
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac, 'brown')
      src.loop = true
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300
      const bed = ac.createGain(); bed.gain.value = 0.25
      src.connect(lp); lp.connect(bed); bed.connect(out)
      src.start()
      const chirp = window.setInterval(() => {
        if (ac.state !== 'running' || Math.random() > 0.7) return
        const t0 = ac.currentTime + Math.random() * 0.3
        const f = 3900 + Math.random() * 900
        for (let p = 0; p < 3; p++) {
          const osc = ac.createOscillator()
          osc.frequency.value = f
          const g = ac.createGain()
          const t = t0 + p * 0.09
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.12, t + 0.015)
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
          osc.connect(g); g.connect(out)
          osc.start(t); osc.stop(t + 0.09)
        }
      }, 700)
      return { nodes: [src, { stop: () => window.clearInterval(chirp) }], out }
    },
  },
  {
    id: 'white', name: 'White Noise', desc: 'A soft blanket of static', vol: 0.5,
    build(ac) {
      const src = ac.createBufferSource()
      src.buffer = noiseBuffer(ac)
      src.loop = true
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000
      const out = ac.createGain()
      src.connect(lp); lp.connect(out)
      src.start()
      return { nodes: [src], out }
    },
  },
]

interface ActiveAtmo extends BuiltAtmo { master: GainNode }

/**
 * AtmosMixer — remembers which layers the listener wants and (re)builds
 * their graphs whenever the engine is running. The engine owns the
 * AudioContext; when a session stops, the graphs die with it and are
 * rebuilt on `sync()` at the next start.
 */
export class AtmosMixer {
  readonly wanted = new Set<string>()
  readonly vols: Record<string, number> = Object.fromEntries(ATMOS.map((a) => [a.id, a.vol]))
  private active = new Map<string, ActiveAtmo>()

  constructor(private engine: SoundscapeEngine) {}

  isOn(id: string) { return this.wanted.has(id) }

  toggle(id: string): boolean {
    if (this.wanted.has(id)) {
      this.wanted.delete(id)
      this.tearDown(id)
      return false
    }
    this.wanted.add(id)
    this.buildUp(id)
    return true
  }

  setVol(id: string, v: number) {
    this.vols[id] = v
    const entry = this.active.get(id)
    const ctx = this.engine.context
    if (entry && ctx) entry.master.gain.setTargetAtTime(v, ctx.currentTime, 0.15)
  }

  /** Rebuild every wanted layer — call after the engine (re)starts. */
  sync() {
    this.active.clear() // previous graphs died with the old context
    for (const id of this.wanted) this.buildUp(id)
  }

  /** Forget the dead graphs when a session ends (context closed). */
  onEngineStopped() {
    this.active.clear()
  }

  private buildUp(id: string) {
    const ctx = this.engine.context
    const input = this.engine.atmosphereInput
    if (!ctx || !input || this.active.has(id)) return
    const def = ATMOS.find((a) => a.id === id)
    if (!def) return
    const built = def.build(ctx)
    const master = ctx.createGain()
    master.gain.value = 0
    built.out.connect(master)
    master.connect(input)
    master.gain.linearRampToValueAtTime(this.vols[id], ctx.currentTime + 1.2)
    this.active.set(id, { ...built, master })
  }

  private tearDown(id: string) {
    const entry = this.active.get(id)
    if (!entry) return
    const ctx = this.engine.context
    if (ctx) {
      const t = ctx.currentTime
      entry.master.gain.cancelScheduledValues(t)
      entry.master.gain.setValueAtTime(entry.master.gain.value, t)
      entry.master.gain.linearRampToValueAtTime(0, t + 0.6)
    }
    const nodes = entry.nodes
    window.setTimeout(() => {
      for (const n of nodes) {
        try { n.stop() } catch { /* already stopped */ }
      }
    }, 700)
    this.active.delete(id)
  }
}
