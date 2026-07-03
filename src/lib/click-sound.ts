import { useCallback, useSyncExternalStore } from 'react'

/**
 * Click sound — procedural tactile UI audio (no samples, no network).
 *
 * Two-part synthesis per press, modeled on an expensive physical switch —
 * solid, damped, never a beep:
 *   1. contact — a few milliseconds of bandpass-filtered noise: the crisp
 *      "click" of surfaces meeting.
 *   2. body    — a pitch-dropping sine through a lowpass: the low, damped
 *      "thunk" of mass settling (the Rolls-Royce door).
 * A ±4% random variation keeps repeated taps from sounding stamped-out.
 *
 * The AudioContext is created lazily inside `playClick`, which is only ever
 * called from click/press handlers — audio never starts without a user
 * gesture. A global mute lives in localStorage under `ss_sfx` (default ON)
 * with a React binding for the Profile settings toggle.
 */

export type ClickKind = 'tap' | 'primary'

const STORAGE_KEY = 'ss_sfx'

// ── mute store ──────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()

function readEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export function isSfxEnabled(): boolean {
  return readEnabled()
}

export function setSfxEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // Storage unavailable — the preference simply doesn't persist.
  }
  listeners.forEach((notify) => notify())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** React binding for the mute switch (Profile → Sound). */
export function useSfxEnabled(): [boolean, (on: boolean) => void] {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true)
  return [enabled, setSfxEnabled]
}

// ── synthesis ───────────────────────────────────────────────────────────────

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 0.85
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = Math.floor(c.sampleRate * 0.06)
    noiseBuffer = c.createBuffer(1, length, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

interface ClickVoice {
  clickHz: number
  clickQ: number
  clickGain: number
  clickDecay: number
  thunkFrom: number
  thunkTo: number
  thunkGain: number
  thunkDecay: number
  thunkDelay: number
}

const VOICES: Record<ClickKind, ClickVoice> = {
  // A light latch — crisp contact, a small damped body. Tab taps, prev/next.
  tap: {
    clickHz: 2300,
    clickQ: 8,
    clickGain: 0.3,
    clickDecay: 0.024,
    thunkFrom: 200,
    thunkTo: 96,
    thunkGain: 0.16,
    thunkDecay: 0.09,
    thunkDelay: 0.005,
  },
  // The door close — the same contact, then a deeper, longer body.
  // Play/pause, Begin, Continue.
  primary: {
    clickHz: 1700,
    clickQ: 7,
    clickGain: 0.34,
    clickDecay: 0.03,
    thunkFrom: 150,
    thunkTo: 55,
    thunkGain: 0.28,
    thunkDecay: 0.16,
    thunkDelay: 0.008,
  },
}

export function playClick(kind: ClickKind = 'tap'): void {
  if (!readEnabled()) return
  const c = ensureContext()
  if (!c || !master) return
  const voice = VOICES[kind]
  const t = c.currentTime + 0.003
  const vary = 0.96 + Math.random() * 0.08

  // 1 · contact — a filtered noise tick, gone in ~25 ms.
  const click = c.createBufferSource()
  click.buffer = getNoise(c)
  const bandpass = c.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = voice.clickHz * vary
  bandpass.Q.value = voice.clickQ
  const clickEnv = c.createGain()
  clickEnv.gain.setValueAtTime(voice.clickGain, t)
  clickEnv.gain.exponentialRampToValueAtTime(0.0001, t + voice.clickDecay)
  click.connect(bandpass).connect(clickEnv).connect(master)
  click.start(t)
  click.stop(t + voice.clickDecay + 0.02)

  // 2 · body — a pitch-dropping sine through a lowpass: mass, damped.
  const thunkT = t + voice.thunkDelay
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(voice.thunkFrom * vary, thunkT)
  osc.frequency.exponentialRampToValueAtTime(voice.thunkTo * vary, thunkT + voice.thunkDecay)
  const lowpass = c.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 480
  const thunkEnv = c.createGain()
  thunkEnv.gain.setValueAtTime(0.0001, thunkT)
  thunkEnv.gain.linearRampToValueAtTime(voice.thunkGain, thunkT + 0.006)
  thunkEnv.gain.exponentialRampToValueAtTime(0.0001, thunkT + voice.thunkDecay)
  osc.connect(lowpass).connect(thunkEnv).connect(master)
  osc.start(thunkT)
  osc.stop(thunkT + voice.thunkDecay + 0.05)
}

/** Stable play() for onClick wiring — only ever runs inside a user gesture. */
export function useClickSound(): (kind?: ClickKind) => void {
  return useCallback((kind: ClickKind = 'tap') => playClick(kind), [])
}
