import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { css, cx } from 'styled-system/css'
import { RecordDisc, STATE_BAND, BAND_TINT, capText } from '~/components/vinyl/RecordDisc'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'
import type { BandKey } from '~/components/vinyl/RecordDisc'

/**
 * PressingCarousel — Act III of the landing hero: the revolving rack of
 * records inside the computer. A 3D-feeling lazy susan (perspective +
 * rotateX ~12° tilt), front record largest and lit, spinning at a lazy
 * 33⅓ feel that quickens slightly on hover. Drag and ←/→ revolve; click or
 * Enter drops a tonearm onto the front disc (~600ms) and then hands the
 * state to `onPlay` — the caller applies the auth gate.
 *
 * Engineering follows the proven lazy-susan: the motion loop writes
 * transforms on DOM refs inside one rAF — zero per-frame React. ARIA keeps
 * the old carousel's group+button semantics. Reduced motion is handled by
 * the PARENT (a static record row) — this component assumes motion is ok.
 */

export interface PressingItem {
  id: string
  state: TargetState
  title: string
  /** Mono metadata — 'BETA · ~15 HZ · 25 MIN'. */
  meta: string
  /** Session preset handed to the gate (undefined = open-ended). */
  minutes?: number
}

const soundscape = (id: string, metaTail = 'OPEN-ENDED'): PressingItem => {
  const s = SOUNDSCAPES.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title, meta: `${capText(s.state)} · ${metaTail}` }
}

const scenario = (id: string): PressingItem => {
  const s = SCENARIOS.find((x) => x.id === id)!
  return {
    id: s.id,
    state: s.state,
    title: s.title.split(' · ')[0],
    meta: `${capText(s.state)} · ${s.minutes} MIN`,
    minutes: s.minutes,
  }
}

/** The pressings — every mode, with Wind-down MERGED (one record, not two). */
export const PRESSINGS: PressingItem[] = [
  soundscape('deep-focus'),
  scenario('pomodoro-25'),
  soundscape('open-flow'),
  scenario('deep-work-50'),
  soundscape('still'),
  soundscape('wind-down', '15 MIN | OPEN'),
  scenario('sleep-30'),
  soundscape('delta-sleep'),
]

const N = PRESSINGS.length
const STEP = (Math.PI * 2) / N
/** Idle revolve — one pressing through the front every ~10s (ignorable). */
const AUTO_RAD_PER_MS = STEP / 10000

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const stageCss = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  userSelect: 'none',
  touchAction: 'pan-y',
  _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '-2px', borderRadius: '4px' },
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
  _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '4px' },
})

interface Geom {
  disc: number
  rx: number
  lift: number
}

function computeGeom(vw: number, vh: number): Geom {
  const disc = Math.round(clamp(Math.min(vw * 0.26, vh * 0.62), 116, 200))
  return { disc, rx: Math.min(vw * 0.4, 470), lift: disc * 0.17 }
}

/** The tonearm — a simple SVG arm that rotates onto the disc in ~600ms. */
function Tonearm({ dropping, disc }: { dropping: boolean; disc: number }) {
  const w = disc * 0.92
  return (
    <svg
      aria-hidden
      data-tonearm={dropping ? 'dropping' : 'rest'}
      width={w}
      height={w}
      viewBox="0 0 100 100"
      className={css({ position: 'absolute', pointerEvents: 'none' })}
      style={{
        right: -w * 0.34,
        top: -w * 0.16,
        zIndex: 400,
        opacity: dropping ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      <g
        style={{
          transformOrigin: '78px 16px',
          transform: dropping ? 'rotate(24deg)' : 'rotate(-6deg)',
          transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* pivot base */}
        <circle cx="78" cy="16" r="7" fill="#272735" stroke="#70707d" strokeWidth="1" />
        {/* arm */}
        <path d="M78 16 L46 62 L38 74" fill="none" stroke="#c3c3cc" strokeWidth="2.4" strokeLinecap="round" />
        {/* counterweight */}
        <rect x="80" y="6" width="9" height="9" rx="2" transform="rotate(35 84 10)" fill="#70707d" />
        {/* headshell + stylus */}
        <rect x="32" y="70" width="12" height="8" rx="2" transform="rotate(-38 38 74)" fill="#ededf3" />
      </g>
    </svg>
  )
}

export interface PressingCarouselProps {
  /** Called with state (+ preset minutes) after the tonearm lands. */
  onPlay: (state: TargetState, minutes?: number) => void
  /** Fired whenever the focused (front) record changes — band tint out. */
  onFocus?: (item: PressingItem, tint: string) => void
}

export function PressingCarousel({ onPlay, onFocus }: PressingCarouselProps) {
  const [vp, setVp] = useState(() =>
    typeof window === 'undefined' ? { w: 1280, h: 800 } : { w: window.innerWidth, h: window.innerHeight },
  )
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const stageBoxRef = useRef<HTMLDivElement>(null)
  const geom = useMemo(() => {
    const stageH = stageBoxRef.current?.clientHeight ?? vp.h * 0.34
    return computeGeom(vp.w, Math.max(150, stageH))
  }, [vp])

  const [frontIdx, setFrontIdx] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  const stageRef = useRef<HTMLDivElement>(null)
  const discEls = useRef(new Map<string, HTMLDivElement>())
  const geomRef = useRef(geom)
  geomRef.current = geom
  const rotRef = useRef(0)
  const targetRef = useRef<number | null>(null)
  const rafRef = useRef(0)
  const lastTRef = useRef(0)
  const draggingRef = useRef(false)
  const dragMovedRef = useRef(0)
  const lastXRef = useRef(0)
  const lastMoveTRef = useRef(0)
  const velocityRef = useRef(0)
  const hoverRef = useRef(false)
  const resumeAtRef = useRef(0)
  const frontRef = useRef(0)
  const droppingRef = useRef(false)
  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus

  const apply = useCallback(() => {
    const { disc, rx, lift } = geomRef.current
    const rot = rotRef.current
    for (let i = 0; i < N; i++) {
      const el = discEls.current.get(PRESSINGS[i].id)
      if (!el) continue
      const angle = i * STEP - rot
      const s = Math.sin(angle)
      const d = (Math.cos(angle) + 1) / 2 // 1 = front, 0 = back
      const frontness = clamp((d - 0.86) / 0.14, 0, 1)
      const x = s * rx
      const y = (1 - d) * -lift
      const scale = 0.48 + 0.4 * d + 0.14 * frontness
      const tilt = 12 - 5 * frontness
      el.style.transform = `translate3d(${(x - disc / 2).toFixed(2)}px, ${(y - disc / 2).toFixed(2)}px, 0) rotateX(${tilt.toFixed(1)}deg) scale(${scale.toFixed(4)})`
      el.style.zIndex = String(10 + Math.round(d * 100))
      el.style.opacity = (0.34 + 0.66 * d).toFixed(3)
      // Front lit, back receding — elevation is light, never shadow.
      el.style.filter = `brightness(${(0.72 + 0.42 * frontness).toFixed(3)})`
    }
    const idx = ((Math.round(rot / STEP) % N) + N) % N
    if (idx !== frontRef.current) {
      frontRef.current = idx
      setFrontIdx(idx)
      onFocusRef.current?.(PRESSINGS[idx], BAND_TINT[STATE_BAND[PRESSINGS[idx].state]])
    }
  }, [])

  const tick = useCallback(
    (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const dt = Math.min(64, lastTRef.current ? now - lastTRef.current : 16.7)
      lastTRef.current = now
      if (draggingRef.current) return
      if (targetRef.current != null) {
        const d = targetRef.current - rotRef.current
        if (Math.abs(d) < 0.0008) {
          rotRef.current = targetRef.current
          targetRef.current = null
          resumeAtRef.current = performance.now() + 2600
        } else {
          rotRef.current += d * (1 - Math.pow(0.992, dt))
        }
      } else if (
        !hoverRef.current &&
        !droppingRef.current &&
        now >= resumeAtRef.current &&
        !document.hidden
      ) {
        rotRef.current += AUTO_RAD_PER_MS * dt
      }
      apply()
    },
    [apply],
  )

  useEffect(() => {
    apply()
    onFocusRef.current?.(PRESSINGS[frontRef.current], BAND_TINT[STATE_BAND[PRESSINGS[frontRef.current].state]])
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [apply, tick])

  // ── drag ──────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if (droppingRef.current) return
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
      if (dragMovedRef.current > 6 && stageRef.current && !stageRef.current.hasPointerCapture(e.pointerId)) {
        try {
          stageRef.current.setPointerCapture(e.pointerId)
        } catch {
          // capture unsupported — drag still works via bubbling
        }
      }
      const radPerPx = STEP / (geomRef.current.disc * 1.4)
      const dRot = -dx * radPerPx
      rotRef.current += dRot
      velocityRef.current = 0.72 * velocityRef.current + 0.28 * (dRot / dt)
      apply()
    },
    [apply],
  )

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (stageRef.current?.hasPointerCapture(e.pointerId)) {
      try {
        stageRef.current.releasePointerCapture(e.pointerId)
      } catch {
        // already released
      }
    }
    const projected = rotRef.current + velocityRef.current * 320
    targetRef.current = Math.round(projected / STEP) * STEP
  }, [])

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
    setHoverIdx(null)
  }, [])

  /** Revolve to `idx` (if needed), drop the tonearm, then hand off to the gate. */
  const beginPlay = useCallback(
    (idx: number) => {
      if (droppingRef.current) return
      droppingRef.current = true
      const item = PRESSINGS[idx]
      let settleMs = 0
      if (idx !== frontRef.current) {
        const t0 = idx * STEP
        const k = Math.round((rotRef.current - t0) / (Math.PI * 2))
        targetRef.current = t0 + k * Math.PI * 2
        settleMs = 420
      }
      window.setTimeout(() => setDropTarget(idx), settleMs)
      window.setTimeout(() => {
        droppingRef.current = false
        setDropTarget(null)
        onPlay(item.state, item.minutes)
      }, settleMs + 640)
    },
    [onPlay],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const base = targetRef.current ?? Math.round(rotRef.current / STEP) * STEP
        targetRef.current = base + dir * STEP
        resumeAtRef.current = performance.now() + 6000
      } else if (e.key === 'Enter' && e.target === stageRef.current) {
        e.preventDefault()
        beginPlay(frontRef.current)
      }
    },
    [beginPlay],
  )

  const setDiscEl = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) discEls.current.set(id, el)
      else discEls.current.delete(id)
    }
  }, [])

  const front = PRESSINGS[frontIdx]
  const caption = hoverIdx != null ? PRESSINGS[hoverIdx] : front
  const hovered = hoverIdx === frontIdx || hoverRef.current

  return (
    <div ref={stageBoxRef} className={css({ position: 'relative', width: '100%', height: '100%' })}>
      <div
        ref={stageRef}
        role="group"
        aria-label="The pressings — drag or use arrow keys to revolve, Enter to play the front record"
        tabIndex={0}
        data-pressing-carousel
        data-front-record={front.id}
        className={stageCss}
        style={{ perspective: '1100px' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        <div
          className={css({ position: 'absolute', left: '50%', top: '48%', width: '0', height: '0' })}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {PRESSINGS.map((item, i) => {
            const isFront = i === frontIdx
            return (
              <div
                key={item.id}
                ref={setDiscEl(item.id)}
                className={css({ position: 'absolute', left: '0', top: '0', willChange: 'transform, opacity' })}
                style={
                  {
                    width: geom.disc,
                    height: geom.disc,
                    // Front record: slow 33⅓ feel; hover quickens it slightly.
                    '--rec-spin': hovered ? '4.5s' : '7s',
                  } as CSSProperties
                }
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx((h) => (h === i ? null : h))}
              >
                <button
                  type="button"
                  onClick={() => beginPlay(i)}
                  aria-label={`${item.title} — ${item.meta}. Play`}
                  className={discButtonCss}
                >
                  <RecordDisc state={item.state} size={geom.disc} spinning={isFront ? 'idle' : 'none'} />
                </button>
                {isFront && <Tonearm dropping={dropTarget === i} disc={geom.disc} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Caption — the focused (or hovered) pressing, Fraunces + mono. */}
      <div
        className={css({
          position: 'absolute',
          insetX: '0',
          bottom: '-4px',
          textAlign: 'center',
          pointerEvents: 'none',
        })}
      >
        <p
          className={css({
            m: '0',
            fontFamily: 'display',
            fontWeight: '700',
            fontSize: 'clamp(1.1rem, 2.2vw, 1.45rem)',
            letterSpacing: '-0.02em',
            color: 'starlight',
          })}
        >
          {caption.title}
        </p>
        <p
          className={cx(
            'tabular',
            css({ m: '0', mt: '0.5', fontSize: 'caption', letterSpacing: '0.08em', color: 'silver' }),
          )}
        >
          {caption.meta}
        </p>
      </div>
    </div>
  )
}

export function pressingTint(item: PressingItem): string {
  return BAND_TINT[STATE_BAND[item.state] as BandKey]
}
