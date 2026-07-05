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
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion, useTransform } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { CALM_SCRIM_CARD, VARIANT_IMAGE } from '~/design/Scene'
import { STATE_SCENE } from '~/components/SessionCard'
import { useClickSound } from '~/lib/click-sound'
import { useContainerScrollProgress } from '~/lib/scroll-context'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * ModeShelf — the cinematic 3D mode picker the app now opens on.
 *
 * A near-black stage (the shell's ambient scene glows ~15% through it), a
 * giant Fraunces serif wordmark across the top half, and below/over it THE
 * SHELF: every playable item — the five soundscape modes and the timed
 * scenarios — as tall book-cover cards raked diagonally in perspective.
 * Drag / horizontal wheel / touch slides the shelf with momentum and snaps
 * to the nearest card; the frontmost card straightens and brightens. A tap
 * opens the item in the Player exactly the way Today's cards always have
 * (`/app/player?state=` — the engine is untouched). Category pills along the
 * bottom filter the shelf: All · Focus · Calm · Sleep.
 *
 * Engineering notes:
 *   - Rake math: card i sits at p = i·STEP − scroll along the rake axis.
 *     Its transform is translate3d(p, −p·SLOPE, 0) rotateY(θ) scale(s) under
 *     a parent `perspective`, where θ eases 14°→42° with distance from the
 *     focus point and s = 1/(1 + p·K) for p>0 (depth recession). Depth
 *     sorting is plain z-index by shelf order (left card overlaps deeper) —
 *     deterministic, no preserve-3d sorting quirks.
 *   - The drag loop writes `transform` + overlay `opacity` directly on DOM
 *     refs inside rAF — zero per-frame React state. `will-change: transform`
 *     on cards only.
 *   - Haptics, sensibly: navigator.vibrate?.(8) on focus-snap and pill
 *     change, 12ms on card open. No-op where unsupported.
 *   - Reduced motion: a flat, styled, scrollable row — no 3D, no momentum.
 */

// ── content ─────────────────────────────────────────────────────────────────

type ShelfGroup = 'focus' | 'calm' | 'sleep'
type ShelfFilter = 'all' | ShelfGroup

interface ShelfItem {
  id: string
  state: TargetState
  title: string
  meta: string
  group: ShelfGroup
}

const STATE_GROUP: Record<TargetState, ShelfGroup> = {
  focus: 'focus',
  flow: 'focus',
  calm: 'calm',
  winddown: 'calm',
  sleep: 'sleep',
}

const mode = (id: string): ShelfItem => {
  const s = SOUNDSCAPES.find((x) => x.id === id)!
  return {
    id: s.id,
    state: s.state,
    title: s.title,
    meta: `${s.band} · Open-ended`,
    group: STATE_GROUP[s.state],
  }
}

const scenario = (id: string): ShelfItem => {
  const s = SCENARIOS.find((x) => x.id === id)!
  return {
    id: s.id,
    state: s.state,
    title: s.title.split(' · ')[0],
    meta: `${s.band} · ${s.minutes} min`,
    group: STATE_GROUP[s.state],
  }
}

/** Shelf order — modes interleaved with their scenarios so the art varies. */
const SHELF_ITEMS: ShelfItem[] = [
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

const FILTERS: { id: ShelfFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'focus', label: 'Focus' },
  { id: 'calm', label: 'Calm' },
  { id: 'sleep', label: 'Sleep' },
]

// ── rake geometry ───────────────────────────────────────────────────────────

const SLOPE = 0.2 // vertical rise per horizontal px along the rake
const DEPTH_K = 0.00042 // scale recession rate for cards deeper on the shelf
const ROT_NEAR = 14 // deg — the focused, straightened card
const ROT_FAR = 42 // deg — the resting rake lean

interface Geom {
  cardW: number
  cardH: number
  step: number
}

function computeGeom(vw: number): Geom {
  const cardW = Math.round(Math.min(240, Math.max(150, vw * 0.26)))
  return { cardW, cardH: Math.round(cardW * 1.4), step: Math.round(cardW * 0.56) }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Where the shelf rests after load / filter — a couple of cards trail left. */
const initialIndex = (count: number) => (count >= 6 ? 2 : Math.min(1, count - 1))

const buzz = (ms: number) => {
  try {
    navigator.vibrate?.(ms)
  } catch {
    // no haptics on this device — fine
  }
}

// ── styles ──────────────────────────────────────────────────────────────────

const WORDMARK_FONT = '"Fraunces", Georgia, "Times New Roman", serif'

const stageCss = css({
  position: 'relative',
  overflow: 'hidden',
  // Full-bleed breakout of the shell's 640px padded column.
  mx: 'calc(50% - 50vw)',
  mt: 'calc(-1 * (env(safe-area-inset-top) + 28px))',
  // Exactly the shell scrollport's height: the stage owns the first screen.
  height: 'calc(100dvh - env(safe-area-inset-bottom) - 96px)',
  minHeight: '540px',
  // Near-black stage — the shell's ambient scene glows very low through it.
  background: 'rgba(2, 3, 8, 0.85)',
  userSelect: 'none',
  touchAction: 'pan-y',
  _focusVisible: { outline: '2px solid token(colors.accent)', outlineOffset: '-2px' },
})

const wordmarkCss = css({
  position: 'absolute',
  insetX: '0',
  top: 'calc(env(safe-area-inset-top) + 5dvh)',
  zIndex: '1',
  textAlign: 'center',
  pointerEvents: 'none',
  m: '0',
  fontWeight: '400',
  fontSize: 'clamp(4rem, 14vw, 9rem)',
  lineHeight: '0.98',
  letterSpacing: '-0.045em',
  color: 'rgba(246, 244, 240, 0.97)',
  textShadow: '0 2px 26px rgba(0, 0, 0, 0.55)',
})

const shelfPlaneCss = css({
  position: 'absolute',
  inset: '0',
  zIndex: '2',
  perspective: '1400px',
  perspectiveOrigin: '50% 38%',
})

const cardShellCss = css({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '100%',
  p: '0',
  m: '0',
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: '16px',
  overflow: 'hidden',
  background: 'rgba(8, 12, 26, 1)',
  WebkitTapHighlightColor: 'transparent',
  // Specular edges — the liquid-glass echo: lit top edge, faint left rim.
  boxShadow:
    'inset 0 1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.08), 0 26px 60px rgba(0, 0, 0, 0.55), 0 6px 18px rgba(0, 0, 0, 0.4)',
})

const cardPhotoCss = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  pointerEvents: 'none',
})

const cardTitleCss = css({
  m: '0',
  fontSize: 'headline',
  fontWeight: '700',
  letterSpacing: '-0.01em',
  lineHeight: '1.2',
  color: 'rgba(255, 255, 255, 0.98)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const cardMetaCss = css({
  m: '0',
  mt: '0.5',
  fontSize: 'caption',
  fontWeight: '500',
  letterSpacing: '0.02em',
  lineHeight: '1.35',
  color: 'rgba(235, 240, 252, 0.8)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

const pillRowCss = css({
  position: 'absolute',
  insetX: '0',
  bottom: '16px',
  zIndex: '10',
  display: 'flex',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '2',
  px: '4',
})

const pillCss = css({
  px: '4',
  py: '2',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  borderRadius: 'capsule',
  font: 'inherit',
  fontSize: 'footnote',
  fontWeight: '600',
  letterSpacing: '0.01em',
  color: 'rgba(240, 242, 250, 0.86)',
  background: 'rgba(16, 18, 30, 0.55)',
  backdropFilter: 'blur(14px)',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition:
    'background token(durations.quick) ease, color token(durations.quick) ease, border-color token(durations.quick) ease, transform token(durations.quick) token(easings.calm)',
  _active: { transform: 'scale(0.95)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
})

const pillActiveCss = css({
  background: 'rgba(242, 243, 248, 0.94)',
  color: 'rgba(12, 14, 24, 0.94)',
  borderColor: 'rgba(242, 243, 248, 0.94)',
})

// ── card face ───────────────────────────────────────────────────────────────

function CardFace({ item, eager }: { item: ShelfItem; eager: boolean }) {
  return (
    <>
      <img
        aria-hidden
        alt=""
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        src={VARIANT_IMAGE[STATE_SCENE[item.state]]}
        className={cardPhotoCss}
      />
      <div
        aria-hidden
        className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
        style={{ background: CALM_SCRIM_CARD }}
      />
      <div className={css({ position: 'absolute', insetX: '0', bottom: '0', px: '3.5', pb: '3', pt: '6' })}>
        <p className={cardTitleCss}>{item.title}</p>
        <p className={`tabular ${cardMetaCss}`}>{item.meta}</p>
      </div>
    </>
  )
}

// ── the shelf ───────────────────────────────────────────────────────────────

export function ModeShelf() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const reduceMotion = useReducedMotion()

  const [filter, setFilter] = useState<ShelfFilter>('all')
  const items = useMemo(
    () => (filter === 'all' ? SHELF_ITEMS : SHELF_ITEMS.filter((i) => i.group === filter)),
    [filter],
  )

  // Viewport width drives the card geometry (state → re-render on resize).
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const geom = useMemo(() => computeGeom(vw), [vw])

  // ── refs — the whole drag loop lives outside React state ─────────────────
  const stageRef = useRef<HTMLElement>(null)
  const cardEls = useRef(new Map<string, HTMLDivElement>())
  const dimEls = useRef(new Map<string, HTMLDivElement>())
  const itemsRef = useRef(items)
  const geomRef = useRef(geom)
  const scrollRef = useRef(initialIndex(items.length) * geom.step)
  const targetRef = useRef(scrollRef.current)
  const rafRef = useRef(0)
  const draggingRef = useRef(false)
  const dragMovedRef = useRef(0)
  const lastXRef = useRef(0)
  const lastTRef = useRef(0)
  const velocityRef = useRef(0)
  const focusedRef = useRef(initialIndex(items.length))
  const interactedRef = useRef(false)
  const wheelSnapTimer = useRef(0)
  const lastTickRef = useRef(0)

  itemsRef.current = items
  geomRef.current = geom

  const maxScroll = useCallback(
    () => Math.max(0, (itemsRef.current.length - 1) * geomRef.current.step),
    [],
  )

  /** Write every card's rake transform + dim for the current scroll. */
  const apply = useCallback(() => {
    const { step } = geomRef.current
    const scroll = scrollRef.current
    const list = itemsRef.current
    for (let i = 0; i < list.length; i++) {
      const el = cardEls.current.get(list[i].id)
      if (!el) continue
      const p = i * step - scroll
      const t = clamp(Math.abs(p) / (step * 1.35), 0, 1)
      const rot = ROT_NEAR + (ROT_FAR - ROT_NEAR) * t
      const depth = p > 0 ? 1 / (1 + p * DEPTH_K) : 1
      const scale = depth * (1 + 0.05 * (1 - t))
      const y = -p * SLOPE
      el.style.transform = `translate3d(${p.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`
      const dim = dimEls.current.get(list[i].id)
      if (dim) {
        const dimO = clamp(0.4 * t + (p > 0 ? p * 0.00012 : 0), 0, 0.62)
        dim.style.opacity = dimO.toFixed(3)
      }
    }
    // Focus snap — haptic tick when the frontmost card changes.
    const idx = clamp(Math.round(scroll / step), 0, list.length - 1)
    if (idx !== focusedRef.current) {
      focusedRef.current = idx
      if (interactedRef.current) buzz(8)
    }
  }, [])

  const tick = useCallback(
    (now: number) => {
      rafRef.current = 0
      // Framerate-independent glide — the same wall-clock settle whether the
      // device paints at 120Hz or a slow GPU drops to 20fps (dt capped so a
      // background-tab hiccup can't teleport the shelf).
      const dt = Math.min(64, lastTickRef.current ? now - lastTickRef.current : 16.7)
      lastTickRef.current = now
      if (!draggingRef.current) {
        const d = targetRef.current - scrollRef.current
        if (Math.abs(d) < 0.4) {
          scrollRef.current = targetRef.current
          lastTickRef.current = 0
          apply()
          return // settled — loop stops
        }
        scrollRef.current += d * (1 - Math.pow(0.9885, dt))
      }
      apply()
      rafRef.current = requestAnimationFrame(tick)
    },
    [apply],
  )

  const ensureLoop = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // Filter / geometry changes: rest the shelf a couple of cards in, repaint.
  useEffect(() => {
    if (reduceMotion) return
    const idx = initialIndex(items.length)
    focusedRef.current = idx
    scrollRef.current = idx * geom.step
    targetRef.current = scrollRef.current
    // Two frames: let AnimatePresence mount the new cards' DOM first.
    const raf = requestAnimationFrame(() => apply())
    return () => cancelAnimationFrame(raf)
  }, [items, geom, reduceMotion, apply])

  // ── input: drag (pointer), momentum + snap ────────────────────────────────
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    draggingRef.current = true
    dragMovedRef.current = 0
    lastXRef.current = e.clientX
    lastTRef.current = performance.now()
    velocityRef.current = 0
    targetRef.current = scrollRef.current
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastXRef.current
      if (dx === 0) return
      const now = performance.now()
      const dt = Math.max(1, now - lastTRef.current)
      lastXRef.current = e.clientX
      lastTRef.current = now
      dragMovedRef.current += Math.abs(dx)
      // Capture only once it's clearly a drag, so plain taps still click cards.
      if (dragMovedRef.current > 6 && stageRef.current && !stageRef.current.hasPointerCapture(e.pointerId)) {
        try {
          stageRef.current.setPointerCapture(e.pointerId)
        } catch {
          // capture unsupported — drag still works via bubbling
        }
      }
      interactedRef.current = true
      const max = maxScroll()
      const raw = scrollRef.current - dx
      // Rubber-band past the ends.
      let next = raw
      if (raw < 0) next = raw * 0.35
      else if (raw > max) next = max + (raw - max) * 0.35
      scrollRef.current = next
      targetRef.current = next
      velocityRef.current = 0.7 * velocityRef.current + 0.3 * (-dx / dt)
      apply()
    },
    [apply, maxScroll],
  )

  const settle = useCallback(() => {
    const { step } = geomRef.current
    const max = maxScroll()
    // Project the momentum ~320ms out, then snap to the nearest card.
    const projected = scrollRef.current + velocityRef.current * 320
    targetRef.current = clamp(Math.round(projected / step) * step, 0, max)
    ensureLoop()
  }, [ensureLoop, maxScroll])

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

  // Suppress the click that trails a real drag — taps still pass through.
  // Reset immediately after: the stale distance must never eat a later tap
  // (e.g. a pill press right after a drag).
  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (dragMovedRef.current > 8) {
      dragMovedRef.current = 0
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  // Horizontal wheel/trackpad moves the shelf; vertical scroll stays the
  // page's. React registers wheel passively, so bind non-passive by hand.
  useEffect(() => {
    if (reduceMotion) return
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      interactedRef.current = true
      const max = maxScroll()
      targetRef.current = clamp(targetRef.current + e.deltaX, 0, max)
      ensureLoop()
      window.clearTimeout(wheelSnapTimer.current)
      wheelSnapTimer.current = window.setTimeout(() => {
        const { step } = geomRef.current
        targetRef.current = clamp(Math.round(targetRef.current / step) * step, 0, max)
        ensureLoop()
      }, 140)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.clearTimeout(wheelSnapTimer.current)
    }
  }, [reduceMotion, ensureLoop, maxScroll])

  // ── open a card — exactly Today's SessionCard wiring, plus SFX + haptic ──
  const open = useCallback(
    (item: ShelfItem) => {
      playClick('tap')
      buzz(12)
      void navigate({ to: '/app/player', search: { state: item.state } })
    },
    [navigate, playClick],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (reduceMotion) return
      const { step } = geomRef.current
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        interactedRef.current = true
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const idx = clamp(focusedRef.current + dir, 0, itemsRef.current.length - 1)
        targetRef.current = idx * step
        ensureLoop()
      } else if (e.key === 'Enter' && e.target === stageRef.current) {
        e.preventDefault()
        const item = itemsRef.current[focusedRef.current]
        if (item) open(item)
      }
    },
    [reduceMotion, ensureLoop, open],
  )

  const pickFilter = useCallback(
    (next: ShelfFilter) => {
      if (next === filter) return
      playClick('tap')
      buzz(8)
      setFilter(next)
    },
    [filter, playClick],
  )

  // Wordmark shrinks + fades as the stage scrolls away ("heavy scrolling +
  // sticky" — the mark pins visually, then hands off to the Today section).
  const wrapRef = useRef<HTMLDivElement>(null)
  const scrollYProgress = useContainerScrollProgress(wrapRef)
  const markScale = useTransform(scrollYProgress, [0, 1], [1, 0.62])
  const markOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const markY = useTransform(scrollYProgress, [0, 1], [0, 60])

  const setCardEl = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) cardEls.current.set(id, el)
      else cardEls.current.delete(id)
    }
  }, [])
  const setDimEl = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) dimEls.current.set(id, el)
      else dimEls.current.delete(id)
    }
  }, [])

  const { cardW, cardH } = geom

  // ── reduced motion: a flat, styled, scrollable row ────────────────────────
  if (reduceMotion) {
    const flatW = Math.round(cardW * 0.82)
    return (
      <section ref={stageRef} aria-label="Choose a mode" className={cx('ss-scene-dark', stageCss)}>
        <h1 className={wordmarkCss} style={{ fontFamily: WORDMARK_FONT }}>
          SmartSound
        </h1>
        <div
          className={css({
            position: 'absolute',
            insetX: '0',
            top: 'calc(env(safe-area-inset-top) + 5dvh + clamp(4.5rem, 15vw, 9.5rem))',
            bottom: '72px',
            zIndex: '2',
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            gap: '4',
            px: '5',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity',
          })}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={css({ flexShrink: '0', scrollSnapAlign: 'center' })}
              style={{ width: flatW, height: Math.round(flatW * 1.4) }}
            >
              <button type="button" onClick={() => open(item)} className={cardShellCss} aria-label={`${item.title} — ${item.meta}`}>
                <CardFace item={item} eager />
              </button>
            </div>
          ))}
        </div>
        <FilterPills filter={filter} pick={pickFilter} />
      </section>
    )
  }

  return (
    <div ref={wrapRef}>
      <section
        ref={stageRef}
        aria-label="Choose a mode — drag to browse, enter to begin"
        role="group"
        tabIndex={0}
        className={cx('ss-scene-dark', stageCss)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {/* Giant serif wordmark — the reference's Foliom moment. */}
        <motion.h1
          className={wordmarkCss}
          style={{ fontFamily: WORDMARK_FONT, scale: markScale, opacity: markOpacity, y: markY }}
        >
          SmartSound
        </motion.h1>

        {/* The raked shelf plane. */}
        <div className={shelfPlaneCss}>
          {/* Rake origin — the focus point sits at mid-stage, ~62% down. */}
          <div className={css({ position: 'absolute', left: '50%', top: '62%', width: '0', height: '0' })}>
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.03 * i } }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  style={{
                    position: 'absolute',
                    left: -cardW / 2,
                    top: -cardH / 2,
                    zIndex: items.length - i,
                  }}
                >
                  <div
                    ref={setCardEl(item.id)}
                    className={css({ willChange: 'transform', transformOrigin: 'center center' })}
                    style={{ width: cardW, height: cardH }}
                  >
                    <button
                      type="button"
                      onClick={() => open(item)}
                      className={cardShellCss}
                      aria-label={`${item.title} — ${item.meta}`}
                    >
                      <CardFace item={item} eager={i < 4} />
                      {/* Depth dim — opacity-only, written by the drag loop. */}
                      <div
                        ref={setDimEl(item.id)}
                        aria-hidden
                        className={css({
                          position: 'absolute',
                          inset: '0',
                          pointerEvents: 'none',
                          background: 'rgba(2, 3, 10, 1)',
                          opacity: '0',
                        })}
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <FilterPills filter={filter} pick={pickFilter} />
      </section>
    </div>
  )
}

function FilterPills({ filter, pick }: { filter: ShelfFilter; pick: (f: ShelfFilter) => void }) {
  return (
    <div className={pillRowCss} role="tablist" aria-label="Filter the shelf">
      {FILTERS.map((f) => {
        const active = f.id === filter
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => pick(f.id)}
            className={cx(pillCss, active && pillActiveCss)}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}
