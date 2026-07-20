import type { SoundscapeEngine } from './engine'
import type { TargetState } from './types'

/**
 * The Studio score — public-domain repertoire performed live on the
 * engine's piano voice by a lookahead scheduler. The director also
 * steers the pad/sub harmony (engine.setChord) so every layer agrees
 * with the key. Nothing here is a recording; every note is synthesized.
 *
 *   focus     Bach, Prelude in C major BWV 846 (1722)
 *   flow      Pachelbel's ground (c. 1680), generative arpeggios
 *   calm      Satie, Gymnopédie No. 1 (1888)
 *   winddown  an original nocturne in D minor
 *   sleep     open fifths — the engine's own bells carry it
 */

/* Bach — five pitches per measure figured 1-2-3-4-5-3-4-5, twice each;
   32 measures plus a two-measure turnaround back to the top. */
const BACH: number[][] = [
  [60, 64, 67, 72, 76], [60, 62, 69, 74, 77], [59, 62, 67, 74, 77], [60, 64, 67, 72, 76],
  [60, 64, 69, 76, 81], [60, 62, 66, 69, 74], [59, 62, 67, 74, 79], [59, 60, 64, 67, 72],
  [57, 60, 64, 67, 72], [50, 57, 62, 66, 72], [55, 59, 62, 67, 71], [55, 58, 64, 67, 73],
  [53, 57, 62, 69, 74], [53, 56, 62, 65, 71], [52, 55, 60, 67, 72], [52, 53, 57, 60, 65],
  [50, 53, 57, 60, 65], [43, 50, 55, 59, 65], [48, 52, 55, 60, 64], [48, 55, 58, 60, 64],
  [41, 53, 57, 60, 64], [42, 48, 57, 60, 63], [44, 53, 59, 60, 62], [43, 53, 55, 59, 62],
  [43, 52, 55, 60, 64], [43, 50, 55, 60, 65], [43, 50, 55, 59, 65], [43, 51, 57, 60, 66],
  [43, 52, 55, 60, 67], [43, 50, 55, 60, 65], [43, 50, 55, 59, 65], [36, 48, 55, 58, 64],
  [41, 53, 57, 60, 64], [43, 50, 53, 59, 62],
]
const BACH_SEQ = [0, 1, 2, 3, 4, 2, 3, 4]

/* Satie — 3/4 lent: two alternating accompaniment bars, 4 intro bars,
   then the 16-bar melody loop. */
const SATIE_ACC = [
  { bass: 43, chord: [59, 62, 66], pad: [55, 59, 62, 66] },
  { bass: 38, chord: [57, 61, 66], pad: [50, 57, 61, 66] },
]
const SATIE_MEL: Record<number, [number, number, number][]> = {
  0: [[0, 78, 3]],
  1: [[0, 81, 1], [1, 79, 1], [2, 78, 1]],
  2: [[0, 73, 1], [1, 71, 1], [2, 73, 1]],
  3: [[0, 74, 3]],
  4: [[0, 69, 3]],
  5: [[0, 66, 6]],
  8: [[0, 78, 3]],
  9: [[0, 81, 1], [1, 79, 1], [2, 78, 1]],
  10: [[0, 73, 1], [1, 71, 1], [2, 73, 1]],
  11: [[0, 74, 3]],
  12: [[0, 71, 1], [1, 73, 1], [2, 74, 1]],
  13: [[0, 76, 1], [1, 73, 1], [2, 74, 1]],
  14: [[0, 73, 1], [1, 71, 1], [2, 69, 1]],
  15: [[0, 66, 3]],
}
const SATIE_BARS = 20

/* Pachelbel's eight-chord ground. */
const CANON = [
  { bass: 50, tones: [62, 66, 69] },
  { bass: 45, tones: [61, 64, 69] },
  { bass: 47, tones: [59, 62, 66] },
  { bass: 42, tones: [57, 61, 66] },
  { bass: 43, tones: [59, 62, 67] },
  { bass: 38, tones: [62, 66, 69] },
  { bass: 43, tones: [59, 62, 67] },
  { bass: 45, tones: [61, 64, 69] },
]
const CANON_PATTERNS = [[0, 1, 2, 3], [2, 1, 0, 1], [0, 2, 1, 3], [3, 2, 1, 0]]

/* An original nocturne in D minor — written for the wind-down. */
const NOCTURNE = [
  { bass: 38, tones: [50, 53, 57, 64], name: 'Dm9' },
  { bass: 46, tones: [50, 53, 57, 62], name: 'B♭maj7' },
  { bass: 43, tones: [50, 55, 58, 65], name: 'Gm7' },
  { bass: 45, tones: [52, 57, 61, 64], name: 'A7' },
]

export const SCORE_TITLES: Record<TargetState, string> = {
  focus: 'after Bach · Prelude in C, BWV 846 (1722)',
  flow: 'on Pachelbel’s ground (c. 1680)',
  calm: 'after Satie · Gymnopédie No. 1 (1888)',
  winddown: 'an original nocturne in D minor',
  sleep: 'open fifths · almost no notes',
}

interface ScoreState {
  m?: number
  i?: number
  bar?: number
  b?: number
  c?: number
  e?: number
  cycle?: number
}

export class StudioDirector {
  private timer: number | null = null
  private nextT = 0
  private s: ScoreState = {}
  mode: TargetState = 'calm'

  constructor(private engine: SoundscapeEngine) {}

  get isRunning() { return this.timer != null }

  start() {
    if (this.timer != null) return
    const ctx = this.engine.context
    if (!ctx || !this.engine.isRunning) return
    this.nextT = ctx.currentTime + 0.25
    this.applyChordNow()
    this.timer = window.setInterval(() => this.tick(), 80)
  }

  stop(resetHarmony = true) {
    if (this.timer != null) window.clearInterval(this.timer)
    this.timer = null
    if (resetHarmony) this.engine.resetChord()
  }

  setMode(mode: TargetState) {
    this.mode = mode
    this.s = {}
    const ctx = this.engine.context
    if (this.timer != null && ctx && this.engine.isRunning) {
      this.nextT = Math.max(this.nextT, ctx.currentTime + 0.6)
      this.applyChordNow()
    }
  }

  private applyChordNow() {
    const e = this.engine
    if (this.mode === 'focus') { const m = BACH[0]; e.setChord(m[0], m.slice(0, 4)) }
    else if (this.mode === 'calm') { const a = SATIE_ACC[0]; e.setChord(a.bass, a.pad) }
    else if (this.mode === 'flow') { const c = CANON[0]; e.setChord(c.bass, [c.bass + 12, ...c.tones]) }
    else if (this.mode === 'winddown') { const c = NOCTURNE[0]; e.setChord(c.bass, c.tones) }
    else e.resetChord()
  }

  private tick() {
    const ctx = this.engine.context
    if (!ctx || !this.engine.isRunning) return
    const horizon = ctx.currentTime + 0.35
    let guard = 0
    while (this.nextT < horizon && guard++ < 64) {
      this.nextT = this.step(this.nextT)
    }
  }

  private step(t: number): number {
    switch (this.mode) {
      case 'focus': return this.stepBach(t)
      case 'calm': return this.stepSatie(t)
      case 'flow': return this.stepCanon(t)
      case 'winddown': return this.stepNocturne(t)
      default: return this.stepSleep(t)
    }
  }

  private stepBach(t: number): number {
    const st = this.s, e = this.engine
    if (st.m == null) { st.m = 0; st.i = 0 }
    const M = BACH[st.m]
    if (st.i === 0) e.setChord(M[0], M.slice(0, 4), 0.9)
    const note = M[BACH_SEQ[(st.i ?? 0) % 8]]
    const accent = (st.i ?? 0) % 8 === 0 ? 0.055 : 0
    e.piano(t, note, 0.12 + accent + Math.random() * 0.02, 1.15)
    st.i = (st.i ?? 0) + 1
    if (st.i >= 16) { st.i = 0; st.m = ((st.m ?? 0) + 1) % BACH.length }
    return t + 0.25
  }

  private stepSatie(t: number): number {
    const st = this.s, e = this.engine
    const beat = 60 / 66
    if (st.bar == null) { st.bar = 0; st.b = 0 }
    const acc = SATIE_ACC[(st.bar ?? 0) % 2]
    if (st.b === 0) {
      e.setChord(acc.bass, acc.pad, 1.4)
      e.piano(t, acc.bass, 0.16, beat * 2.7, -0.2)
    }
    if (st.b === 1)
      acc.chord.forEach((n, i) =>
        e.piano(t + i * 0.012, n, 0.095 + Math.random() * 0.015, beat * 1.9, -0.1))
    const mel = SATIE_MEL[(st.bar ?? 0) - 4]
    if (mel)
      for (const [b, midi, held] of mel)
        if (b === st.b) e.piano(t, midi, 0.185 + Math.random() * 0.02, beat * held * 1.05, 0.15)
    st.b = (st.b ?? 0) + 1
    if (st.b >= 3) { st.b = 0; st.bar = ((st.bar ?? 0) + 1) % SATIE_BARS }
    return t + beat
  }

  private stepCanon(t: number): number {
    const st = this.s, e = this.engine
    const eighth = 60 / 76 / 2
    if (st.c == null) { st.c = 0; st.e = 0; st.cycle = 0 }
    const ch = CANON[st.c ?? 0]
    if (st.e === 0) {
      e.setChord(ch.bass, [ch.bass + 12, ...ch.tones], 0.9)
      e.piano(t, ch.bass, 0.17, 1.4, -0.25)
    }
    const arp = [...ch.tones, ch.tones[0] + 12]
    const pat = CANON_PATTERNS[((st.cycle ?? 0) + (st.c ?? 0)) % CANON_PATTERNS.length]
    const note = arp[pat[st.e ?? 0]]
    if (Math.random() < 0.16 && (st.e ?? 0) < 3) {
      e.piano(t, note, 0.13, 0.4, 0.1)
      e.piano(t + eighth / 2, arp[pat[((st.e ?? 0) + 1) % 4]], 0.11, 0.4, 0.1)
    } else {
      e.piano(t, note, 0.14 + Math.random() * 0.02, 0.6, 0.1)
    }
    st.e = (st.e ?? 0) + 1
    if (st.e >= 4) {
      st.e = 0
      st.c = ((st.c ?? 0) + 1) % CANON.length
      if (st.c === 0) st.cycle = (st.cycle ?? 0) + 1
    }
    return t + eighth
  }

  private stepNocturne(t: number): number {
    const st = this.s, e = this.engine
    const beat = 60 / 54
    if (st.c == null) { st.c = 0; st.b = 0 }
    const ch = NOCTURNE[st.c ?? 0]
    if (st.b === 0) {
      e.setChord(ch.bass, ch.tones, 1.8)
      e.piano(t, ch.bass, 0.15, beat * 5, -0.3)
    }
    if ((st.b ?? 0) > 0 && Math.random() < 0.26) {
      const n = ch.tones[Math.floor(Math.random() * ch.tones.length)] + 12
      e.piano(t + Math.random() * 0.3, n, 0.085 + Math.random() * 0.05, beat * 2.6, 0.25)
    }
    st.b = (st.b ?? 0) + 1
    if (st.b >= 8) { st.b = 0; st.c = ((st.c ?? 0) + 1) % NOCTURNE.length }
    return t + beat
  }

  private stepSleep(t: number): number {
    if (Math.random() < 0.14)
      this.engine.piano(t, Math.random() < 0.5 ? 33 : 40, 0.08, 7, -0.2)
    return t + 4
  }

  /** Where the performance actually is — real scheduler state. */
  scoreText(): string {
    if (this.timer == null || !this.engine.isRunning) return 'Score · idle'
    const st = this.s
    switch (this.mode) {
      case 'focus': return `After Bach · measure ${(st.m ?? 0) + 1} of ${BACH.length}`
      case 'calm': return `After Satie · bar ${(st.bar ?? 0) + 1} of ${SATIE_BARS}`
      case 'flow': return `Pachelbel's ground · chord ${(st.c ?? 0) + 1} of 8 · cycle ${(st.cycle ?? 0) + 1}`
      case 'winddown': return `Nocturne · ${NOCTURNE[st.c ?? 0].name}`
      default: return 'Open fifths · a bell now and then'
    }
  }
}
