import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'

/**
 * useAttuneVisuals — bridges the live Attune state stream (arousal +
 * respiration from `useEngine()`) into SUBLIMINAL scene modulation:
 *
 *   settled  → scene motion eases to 0.95× (Web Animations playbackRate on
 *              the scene subtree — no restart) + saturation 1.05×
 *   elevated → brightness 1.04× + a vignette breathing at the measured
 *              respiration pace
 *
 * Hard rules, enforced here:
 *   · every delta ≤5%, clamped by construction (0.95 / 1.05 / 1.04)
 *   · ≥20s hysteresis — a zone must hold for HYSTERESIS_MS before it is
 *     applied, so noisy rPPG readings can't make the scene flicker
 *   · feature-flagged: localStorage ss_attune_visuals = '0' disables
 *   · degrades to static when Attune is off / camera denied (active=false)
 *
 * The engine and its readings are consumed read-only — nothing here touches
 * the closed loop.
 */

const HYSTERESIS_MS = 20_000
const SETTLED_BELOW = 0.4
const ELEVATED_ABOVE = 0.62

export type AttuneZone = 'settled' | 'neutral' | 'elevated'

export function attuneVisualsEnabled(): boolean {
  try {
    return window.localStorage.getItem('ss_attune_visuals') !== '0'
  } catch {
    return true
  }
}

function classify(arousal: number): AttuneZone {
  if (arousal < SETTLED_BELOW) return 'settled'
  if (arousal > ELEVATED_ABOVE) return 'elevated'
  return 'neutral'
}

export interface AttuneVisuals {
  /** Filter/transition style for the scene wrapper. */
  style: CSSProperties
  /** Breathing vignette config while elevated, else null. */
  vignette: { durationS: number } | null
  /** The zone currently APPLIED (post-hysteresis) — exposed for debugging. */
  zone: AttuneZone
}

export interface AttuneVisualsInput {
  /** Attune actually running (camera granted, reading live). */
  active: boolean
  arousal: number
  respirationBpm: number
  /** Wrapper around the scene layers — its CSS animations get the 0.95× ease. */
  containerRef: RefObject<HTMLElement | null>
}

export function useAttuneVisuals({ active, arousal, respirationBpm, containerRef }: AttuneVisualsInput): AttuneVisuals {
  const [applied, setApplied] = useState<AttuneZone>('neutral')
  const appliedRef = useRef<AttuneZone>('neutral')
  const latest = useRef({ active, arousal })
  latest.current = { active, arousal }
  const candidate = useRef<{ zone: AttuneZone; since: number }>({ zone: 'neutral', since: 0 })

  // 1 Hz sampler with 20s hysteresis — cheap, and immune to per-frame noise.
  useEffect(() => {
    if (!attuneVisualsEnabled()) return
    const id = window.setInterval(() => {
      const { active: on, arousal: a } = latest.current
      const zone: AttuneZone = on ? classify(a) : 'neutral'
      const now = Date.now()
      if (zone !== candidate.current.zone) {
        candidate.current = { zone, since: now }
        return
      }
      // Attune switching off applies immediately (degrade to static);
      // zone CHANGES while live wait out the hysteresis window.
      const held = now - candidate.current.since
      if ((!on || held >= HYSTERESIS_MS) && zone !== appliedRef.current) {
        appliedRef.current = zone
        setApplied(zone)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  // Motion ease: 0.95× playback on the scene subtree's CSS animations while
  // settled — adjusted in place (no restart), restored otherwise.
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof el.getAnimations !== 'function') return
    const rate = applied === 'settled' ? 0.95 : 1
    try {
      for (const anim of el.getAnimations({ subtree: true })) anim.playbackRate = rate
    } catch {
      // Web Animations API quirks — visuals simply stay at normal pace.
    }
    return () => {
      try {
        for (const anim of el.getAnimations({ subtree: true })) anim.playbackRate = 1
      } catch {
        // ignore
      }
    }
  }, [applied, containerRef])

  const style: CSSProperties =
    applied === 'settled'
      ? { filter: 'saturate(1.05)', transition: 'filter 2400ms ease' }
      : applied === 'elevated'
        ? { filter: 'brightness(1.04)', transition: 'filter 2400ms ease' }
        : { filter: 'none', transition: 'filter 2400ms ease' }

  const vignette =
    applied === 'elevated'
      ? { durationS: Math.min(12, Math.max(4, respirationBpm > 0 ? 60 / respirationBpm : 8)) }
      : null

  return { style, vignette, zone: applied }
}
