import { useEffect, useRef, useState } from 'react'
import { css } from 'styled-system/css'
import { prefersStillScene } from './Scene'

/**
 * PulseWave — the Higgsfield light-wave loop (`/scenes/pulse.mp4`) as the
 * player's energy layer: slightly blurred, screen-blended over the scene so
 * its black frame vanishes, and honestly beat-driven — while the engine runs
 * the layer's intensity follows the REAL low-band FFT energy from
 * `getSpectrum()`, flaring on beats (energy spikes over its own rolling
 * average). Idle, it breathes on a slow, labeled-ambient sine instead of
 * pretending to hear audio. Reduced motion renders nothing.
 */

export interface PulseWaveProps {
  /** Live FFT bins from the engine, or null while idle. */
  getSpectrum: () => Uint8Array | null
}

const IDLE_BASE = 0.08
const IDLE_SWING = 0.05

export function PulseWave({ getSpectrum }: PulseWaveProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [still] = useState(prefersStillScene)

  useEffect(() => {
    if (still) return
    let raf = 0
    let level = 0 // displayed opacity, smoothed
    let rolling = 0.08 // rolling low-band energy average (beat baseline)

    const tick = () => {
      const spec = getSpectrum()
      let target: number
      if (spec && spec.length > 0) {
        // Low-band energy — the beat lives in the first bins.
        const n = Math.min(10, spec.length)
        let bass = 0
        for (let i = 0; i < n; i++) bass += spec[i]
        bass /= n * 255
        rolling += (bass - rolling) * 0.02
        const beat = bass > rolling * 1.3 && bass > 0.12
        target = 0.14 + Math.min(0.42, bass * 0.5) + (beat ? 0.2 : 0)
      } else {
        // Idle — a slow ambient breath, not a fake beat.
        const t = performance.now() / 1000
        target = IDLE_BASE + IDLE_SWING * (1 + Math.sin(t / 3)) * 0.5
      }
      // Fast attack, slow release — beats read as flares, not flicker.
      level += (target - level) * (target > level ? 0.4 : 0.05)
      const v = videoRef.current
      if (v) v.style.opacity = String(Math.min(0.62, Math.max(0, level)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getSpectrum, still])

  if (still) return null

  return (
    <video
      ref={videoRef}
      aria-hidden
      src="/scenes/pulse.mp4"
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
      className={css({
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        objectFit: 'cover',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        filter: 'blur(14px) saturate(1.25)',
        opacity: '0',
        willChange: 'opacity',
      })}
    />
  )
}
