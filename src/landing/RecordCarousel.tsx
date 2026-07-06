import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { VARIANT_IMAGE } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import { useClickSound } from '~/lib/click-sound'
import type { TargetState } from '~/engine/audio/types'
import { VinylDisc } from './VinylDisc'

/**
 * RecordCarousel — the landing's lazy-susan of pressings.
 *
 * Every playable item (the five soundscape modes, with the four timed
 * scenarios interleaved as pressing variants of their state's artwork)
 * is a CSS vinyl whose center label is that mode's OWN landscape photo.
 * The discs orbit a flattened ellipse through the front — a lazy susan —
 * with a seeded per-disc tilt so the row reads as records shuffled out of
 * a library crate. The front disc straightens, scales up and captions
 * itself (Fraunces title + tabular band line).
 *
 * Engineering is ModeShelf's: the whole motion loop writes transforms on
 * DOM refs inside rAF — zero per-frame React. Auto-spin is one disc every
 * ~8s; hover pauses it; drag takes pointer capture after 6px, carries
 * momentum, snaps to the nearest disc (haptic tick), and suppresses the
 * trailing click. Reduced motion: a static fanned, scrollable row.
 */

interface RecordItem {
  id: string
  state: TargetState
  title: string
  band: string
}

const mode = (id: string): RecordItem => {
  const s = SOUNDSCAPES.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title, band: `${s.band} · Open-ended` }
}

const scenario = (id: string): RecordItem => {
  const s = SCENARIOS.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title.split(' · ')[0], band: `${s.band} · ${s.minutes} min` }
}

/** Modes interleaved with their scenarios — the shelf's proven order. */
const RECORDS: RecordItem[] = [
  mode('deep-focus'),
  scenario('pomodoro-25'),
  mode('open-flow'),
  scenario('deep-work-50'),
  mode('still'),
  scenario('unwind-15'),
  mode('wind-down'),
  scenario('sleep-30'),
  mode('delta-sleep'),
]

const N = RECORDS.length
const STEP = (Math.PI * 2) / N
/** Auto-spin: one pressing through the front every ~8s. */
const AUTO_RAD_PER_MS = STEP / 8000

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Deterministic per-disc "shuffled" tilt, in degrees. */
function seededTilt(i: number): number {
  const r = Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1
  return (r * 2 - 1) * 10
}

const buzz = (ms: number) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // no haptics — fine
  }
}

interface Geom {
  disc: number
  rx: number
  lift: number
}

function computeGeom(vw: number): Geom {
  const disc = Math.round(clamp(vw * 0.155, 118, 185))
  return { disc, rx: Math.min(vw * 0.44, 560), lift: disc * 0.12 }
}

const stageCss = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  userSelect: 'none',
  touchAction: 'pan-y',
  _focusVisible: { outline: '2px solid rgba(255,255,255,0.5)', outlineOffset: '-2px' },
})

const discButtonCss = css({
  display: 'block',
  p: '0',
  m: '0',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  borderRadius: 'full',
  WebkitTapHighlightColor: 'transparent',
  _focusVisible: { outline: '2px solid rgba(255,255,255,0.6)', outlineOffset: '4px' },
})

const captionTitleCss = css({
  m: '0',
  fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'rgba(255,255,255,0.97)',
  textShadow: '0 1px 12px rgba(2,4,12,0.7)',
})

const captionBandCss = css({
  m: '0',
  mt: '0.5',
  fontSize: 'footnote',
  fontWeight: '500',
  letterSpacing: '0.04em',
  color: 'rgba(235,240,252,0.75)',
  textShadow: '0 1px 10px rgba(2,4,12,0.7)',
})

const FRAUNCES = '"Fraunces", Georgia, "Times New Roman", serif'

export interface RecordCarouselProps {
  /** Called with the record's engine state when a pressing is opened. */
  onOpen: (state: TargetState) => void
}

export function RecordCarousel({ onOpen }: RecordCarouselProps) {
  const reduceMotion = useReducedMotion()
  const playClick = useClickSound()

  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const geom = useMemo(() => computeGeom(vw), [vw])

  const [frontIdx, setFrontIdx] = useState(0)

  // ── refs: the motion loop lives entirely outside React state ────────────
  const stageRef = useRef<HTMLDivElement>(null)
  const discEls = useRef(new Map<string, HTMLDivElement>())
  const geomRef = useRef(geom)
  geomRef.current = geom
  const rotRef = useRef(0)
  const targetRef = useRef<number | null>(null) // snap target (null = free auto-spin)
  const rafRef = useRef(0)
  const lastTRef = useRef(0)
  const draggingRef = useRef(false)
  const dragMovedRef = useRef(0)
  const lastXRef = useRef(0)
  const lastMoveTRef = useRef(0)
  const velocityRef = useRef(0) // rad per ms
  const hoverRef = useRef(false)
  const resumeAtRef = useRef(0) // wall-clock when auto-spin may resume
  const interactedRef = useRef(false)
  const frontRef = useRef(0)

  /** Write every disc's transform for the current rotation. */
  const apply = useCallback(() => {
    const { disc, rx, lift } = geomRef.current
    const rot = rotRef.current
    for (let i = 0; i < N; i++) {
      const el = discEls.current.get(RECORDS[i].id)
      if (!el) continue
      const angle = i * STEP - rot
      const s = Math.sin(angle)
      const d = (Math.cos(angle) + 1) / 2 // 1 = front, 0 = back
      const frontness = clamp((d - 0.86) / 0.14, 0, 1)
      const x = s * rx
      const y = (1 - d) * -lift
      const scale = 0.52 + 0.44 * d + 0.1 * frontness
      const tilt = seededTilt(i) * (1 - frontness)
      el.style.transform = `translate3d(${(x - disc / 2).toFixed(2)}px, ${(y - disc / 2).toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(4)})`
      el.style.zIndex = String(10 + Math.round(d * 100))
      el.style.opacity = (0.42 + 0.58 * d).toFixed(3)
    }
    // Front-of-susan tracking — haptic tick + caption update on change.
    const idx = ((Math.round(rot / STEP) % N) + N) % N
    if (idx !== frontRef.current) {
      frontRef.current = idx
      if (interactedRef.current) buzz(8)
      setFrontIdx(idx)
    }
  }, [])

  const tick = useCallback(
    (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const dt = Math.min(64, lastTRef.current ? now - lastTRef.current : 16.7)
      lastTRef.current = now
      if (draggingRef.current) return // pointermove drives rot directly
      if (targetRef.current != null) {
        // Glide to the snap target, then hand back to auto-spin after a beat.
        const d = targetRef.current - rotRef.current
        if (Math.abs(d) < 0.0008) {
          rotRef.current = targetRef.current
          targetRef.current = null
          resumeAtRef.current = performance.now() + 2400
        } else {
          rotRef.current += d * (1 - Math.pow(0.992, dt))
        }
      } else if (!hoverRef.current && now >= resumeAtRef.current && !document.hidden) {
        rotRef.current += AUTO_RAD_PER_MS * dt
      }
      apply()
    },
    [apply],
  )

  useEffect(() => {
    if (reduceMotion) return
    apply()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [reduceMotion, apply, tick])

  // ── drag ────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    draggingRef.current = true
    dragMovedRef.current = 0
    lastXRef.current = e.clientX
    lastMoveTRef.current = performance.now()
    velocityRef.current = 0
    targetRef.current = null
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastXRef.current
      if (dx === 0) return
      const now = performance.now()
      const dt = Math.max(1, now - lastMoveTRef.current)
      lastXRef.current = e.clientX
      lastMoveTRef.current = now
      dragMovedRef.current += Math.abs(dx)
      if (
        dragMovedRef.current > 6 &&
        stageRef.current &&
        !stageRef.current.hasPointerCapture(e.pointerId)
      ) {
        try {
          stageRef.current.setPointerCapture(e.pointerId)
        } catch {
          // capture unsupported — drag still works via bubbling
        }
      }
      interactedRef.current = true
      // Dragging right pulls the susan right: one disc per ~1.4 disc-widths.
      const radPerPx = STEP / (geomRef.current.disc * 1.4)
      const dRot = -dx * radPerPx
      rotRef.current += dRot
      velocityRef.current = 0.72 * velocityRef.current + 0.28 * (dRot / dt)
      apply()
    },
    [apply],
  )

  const settle = useCallback(() => {
    const projected = rotRef.current + velocityRef.current * 320
    targetRef.current = Math.round(projected / STEP) * STEP
  }, [])

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return
      draggingRef.current = false
      if (stageRef.current?.hasPointerCapture(e.pointerId)) {
        try {
          stageRef.current.releasePointerCapture(e.pointerId)
        } catch {
          // already released
        }
      }
      settle()
    },
    [settle],
  )

  // Suppress the click that trails a real drag; reset so taps never eat it.
  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (dragMovedRef.current > 8) {
      dragMovedRef.current = 0
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const onPointerEnter = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') hoverRef.current = true
  }, [])
  const onPointerLeave = useCallback(() => {
    hoverRef.current = false
  }, [])

  const open = useCallback(
    (item: RecordItem) => {
      playClick('tap')
      buzz(12)
      onOpen(item.state)
    },
    [onOpen, playClick],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        interactedRef.current = true
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const base = targetRef.current ?? Math.round(rotRef.current / STEP) * STEP
        targetRef.current = base + dir * STEP
      } else if (e.key === 'Enter' && e.target === stageRef.current) {
        e.preventDefault()
        open(RECORDS[frontRef.current])
      }
    },
    [open],
  )

  const setDiscEl = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) discEls.current.set(id, el)
      else discEls.current.delete(id)
    }
  }, [])

  const front = RECORDS[frontIdx]

  // ── reduced motion: a static fanned, scrollable row ─────────────────────
  if (reduceMotion) {
    const flat = Math.round(geom.disc * 0.85)
    return (
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '4',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          px: '6',
          WebkitOverflowScrolling: 'touch',
        })}
        aria-label="The pressings — every mode as a record"
        role="group"
      >
        {RECORDS.map((item, i) => (
          <div
            key={item.id}
            className={css({ flexShrink: '0', textAlign: 'center' })}
            style={{ transform: `rotate(${seededTilt(i) * 0.5}deg)` }}
          >
            <button
              type="button"
              onClick={() => open(item)}
              aria-label={`${item.title} — ${item.band}. Play`}
              className={discButtonCss}
            >
              <VinylDisc labelSrc={VARIANT_IMAGE[STATE_SCENE[item.state]]} size={flat} />
            </button>
            <p className={cx('tabular', captionBandCss)}>{item.title}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={css({ position: 'relative', width: '100%', height: '100%' })}>
      <div
        ref={stageRef}
        role="group"
        aria-label="The pressings — drag to spin, enter to play the front record"
        tabIndex={0}
        className={stageCss}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {/* Orbit origin — horizontal center, mid-stage (back discs must stay
            clear of the search bar above). */}
        <div className={css({ position: 'absolute', left: '50%', top: '46%', width: '0', height: '0' })}>
          {RECORDS.map((item) => (
            <div
              key={item.id}
              ref={setDiscEl(item.id)}
              className={css({ position: 'absolute', left: '0', top: '0', willChange: 'transform, opacity' })}
              style={{ width: geom.disc, height: geom.disc }}
            >
              <button
                type="button"
                onClick={() => open(item)}
                aria-label={`${item.title} — ${item.band}. Play`}
                className={discButtonCss}
              >
                <VinylDisc labelSrc={VARIANT_IMAGE[STATE_SCENE[item.state]]} size={geom.disc} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Caption for the front pressing. */}
      <div
        data-front-record={front.id}
        className={css({
          position: 'absolute',
          insetX: '0',
          bottom: 'clamp(6px, 1.6dvh, 16px)',
          zIndex: '150',
          textAlign: 'center',
          pointerEvents: 'none',
        })}
      >
        <p className={captionTitleCss} style={{ fontFamily: FRAUNCES }}>
          {front.title}
        </p>
        <p className={cx('tabular', captionBandCss)}>{front.band}</p>
      </div>
    </div>
  )
}
