import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import * as Slider from '@radix-ui/react-slider'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { LivingScene } from '~/design/LivingScene'
import { SignalRing } from '~/design/SignalRing'
import { STATE_SCENE } from '~/components/SessionCard'
import { SciencePanel } from '~/components/SciencePanel'
import { useClickSound } from '~/lib/click-sound'
import { useEngine } from '~/lib/engine-context'
import { recordRecent } from '~/lib/recents'
import { arousalToLch, lchToCss } from '~/design/signal'
import { TARGET_STATES } from '~/engine/audio/profiles'
import { BAND_LABEL, SOUNDSCAPES } from '~/lib/catalog'
import { useDailyUsage } from '~/lib/entitlements'
import type { TargetState } from '~/engine/audio/types'

/**
 * Player — the immersive now-playing surface (Milestone 3). A full-bleed
 * Scene keyed to the loaded state, a central signal ring that is honestly
 * live (real spectrum + pulse) or honestly a generative preview, and a
 * Liquid Glass transport wired straight to `useEngine()`. The closed loop
 * underneath is untouched — this is purely a presentation layer over it.
 */

const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

interface PlayerSearch {
  state?: TargetState
}

function isTargetState(value: unknown): value is TargetState {
  return typeof value === 'string' && (VALID_STATES as readonly string[]).includes(value)
}

export const Route = createFileRoute('/app/player')({
  validateSearch: (search: Record<string, unknown>): PlayerSearch => ({
    state: isTargetState(search.state) ? search.state : undefined,
  }),
  component: PlayerScreen,
})

const RING_SIZE = 252

const LENGTH_OPTIONS: { label: string; minutes: number | null }[] = [
  { label: '10', minutes: 10 },
  { label: '20', minutes: 20 },
  { label: '45', minutes: 45 },
  { label: '∞', minutes: null }, // infinity — open-ended
]

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── icons — SF-symbol-flavored strokes, matching the shell's icon language ──

const iconAttrs = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
}

const ChevronDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...iconAttrs}>
    <path d="M5 9l7 7 7-7" />
  </svg>
)

// Larger, optically-centered glyphs for the orb's center. The play triangle is
// nudged slightly right so its visual mass sits on the true center.
const CenterPlayIcon = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden style={{ transform: 'translateX(2px)' }}>
    <path d="M8.2 5.6a1 1 0 0 1 1.53-.85l9.4 6.4a1 1 0 0 1 0 1.66l-9.4 6.4A1 1 0 0 1 8.2 18.3V5.6z" fill="currentColor" />
  </svg>
)

const CenterPauseIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden>
    <rect x="6.3" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
    <rect x="13.7" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
  </svg>
)

const SkipBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    <path d="M18.5 5.8a1 1 0 0 0-1.53-.85l-8.2 5.2a1 1 0 0 0 0 1.7l8.2 5.2a1 1 0 0 0 1.53-.85V5.8z" fill="currentColor" />
    <rect x="4.6" y="5" width="1.9" height="14" rx="0.9" fill="currentColor" />
  </svg>
)

const SkipForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
    <path d="M5.5 5.8a1 1 0 0 1 1.53-.85l8.2 5.2a1 1 0 0 1 0 1.7l-8.2 5.2A1 1 0 0 1 5.5 16.2V5.8z" fill="currentColor" />
    <rect x="17.5" y="5" width="1.9" height="14" rx="0.9" fill="currentColor" />
  </svg>
)

const CameraIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" {...iconAttrs}>
    <path d="M4 8.4a1.6 1.6 0 0 1 1.6-1.6h2l1-1.8h6.8l1 1.8h2A1.6 1.6 0 0 1 20 8.4v9A1.6 1.6 0 0 1 18.4 19H5.6A1.6 1.6 0 0 1 4 17.4v-9z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
)

function ringStatusLabel(status: 'idle' | 'running', bioActive: boolean, capped: boolean): string {
  if (status !== 'running') {
    return capped ? 'Today’s free session is used — play to see Pro' : 'Preview — begin to hear it live'
  }
  return bioActive ? 'Live audio + pulse' : 'Live audio'
}

function attuneStatusLabel(bioStatus: string): string {
  switch (bioStatus) {
    case 'requesting':
      return 'Requesting camera access…'
    case 'active':
      return 'On-device pulse detection — nothing leaves your device'
    case 'denied':
      return 'Camera access denied — enable it in system settings'
    case 'nocamera':
      return 'No camera detected on this device'
    case 'error':
      return 'Camera unavailable — try again'
    default:
      return 'Off — uses your front camera, on-device only'
  }
}

function PlayerScreen() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const playClick = useClickSound()
  const { plan, capReached, addMinutes, recordSessionStart } = useDailyUsage()
  const {
    status, profile, params, arousal, reading, bioStatus,
    start, stop, selectState, setNeuralIntensity, startAttune, stopAttune,
    getSpectrum, getPulse,
  } = useEngine()

  const state = profile.key
  const scene = STATE_SCENE[state]
  const title = SOUNDSCAPES.find((s) => s.state === state)?.title ?? profile.label
  const band = BAND_LABEL[state]
  const running = status === 'running'
  const bioActive = reading.active
  const capped = plan === 'free' && capReached

  // Preselect ?state= once on mount — an honest preview, never a forced auto-play.
  const appliedInitial = useRef(false)
  useEffect(() => {
    if (appliedInitial.current) return
    appliedInitial.current = true
    if (search.state && search.state !== state) selectState(search.state)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Elapsed session timer.
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAt = useRef<number | null>(null)
  const [length, setLength] = useState<number | null>(null)

  useEffect(() => {
    if (!running) {
      startedAt.current = null
      setElapsedMs(0)
      return
    }
    startedAt.current = performance.now()
    setElapsedMs(0)
    const id = window.setInterval(() => {
      if (startedAt.current != null) setElapsedMs(performance.now() - startedAt.current)
    }, 250)
    return () => window.clearInterval(id)
  }, [running])

  // Honor the chosen session length — a gentle, self-timed close.
  useEffect(() => {
    if (!running || length == null) return
    if (elapsedMs >= length * 60_000) {
      addMinutes(elapsedMs / 60_000)
      void stop()
    }
  }, [elapsedMs, length, running, stop, addMinutes])

  // Entitlements are a client-side UX stub (see `lib/entitlements.ts`) — this
  // is the single point a session actually starts, so it's the single point
  // the Free daily cap is honored. A capped Free listener is routed to the
  // paywall with context rather than silently blocked or let through.
  const handlePlayPause = () => {
    if (running) {
      playClick('primary')
      if (elapsedMs > 0) addMinutes(elapsedMs / 60_000)
      void stop()
      return
    }
    if (capped) {
      playClick('tap')
      void navigate({ to: '/app/paywall', search: { reason: 'cap' } })
      return
    }
    playClick('primary')
    recordSessionStart()
    recordRecent(state)
    void start(state)
  }

  const cycleState = (dir: 1 | -1) => {
    playClick('tap')
    const idx = TARGET_STATES.findIndex((p) => p.key === state)
    const next = TARGET_STATES[(idx + dir + TARGET_STATES.length) % TARGET_STATES.length]
    selectState(next.key)
  }

  const attuneOn = bioStatus === 'active' || bioStatus === 'requesting'
  const handleAttuneToggle = () => {
    if (attuneOn) stopAttune()
    else void startAttune()
  }

  const ringColor = lchToCss(arousalToLch(arousal))
  const breathDuration = bioActive && reading.respiration > 0 ? 60 / reading.respiration : 6

  return (
    // ss-scene-dark: the immersive player stays dark in both themes (Calm/Endel
    // style) — its text + glass sit over an inherently dark landscape.
    <div className={cx('ss-scene-dark', css({ position: 'fixed', inset: '0', zIndex: '0', overflow: 'hidden' }))}>
      <LivingScene variant={scene} />

      <div
        className={css({
          position: 'absolute',
          inset: '0',
          zIndex: '1',
          // Mirror app.tsx's tab-bar-safe `<main>` clipping: the Scene
          // above stays full-bleed, but this scrollable content layer stops
          // short of the floating tab bar's footprint so controls can never
          // render behind it on first paint (not just after scrolling).
          bottom: 'calc(env(safe-area-inset-bottom) + 96px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <div
          className={css({
            maxW: '480px',
            w: 'full',
            mx: 'auto',
            px: '5',
            pt: 'calc(env(safe-area-inset-top) + 18px)',
            pb: 'calc(env(safe-area-inset-bottom) + 140px)',
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
          })}
        >
          {/* Top bar — dismiss to Today. The session keeps playing underneath. */}
          <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: '5' })}>
            <LiquidGlass
              as="button"
              variant="control"
              staticSheen
              onClick={() => void navigate({ to: '/app' })}
              aria-label="Done — back to Today"
              className={css({
                border: 'none',
                font: 'inherit',
                color: 'text',
                w: '44px',
                h: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <ChevronDownIcon />
            </LiquidGlass>
          </div>

          {/* Now-playing info — the "album" line, title, band/Hz subtitle. */}
          <div
            className={css({
              textAlign: 'center',
              mb: '6',
              animation: 'fadeUp token(durations.calm) token(easings.enter) both',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            })}
          >
            <p
              className={css({
                m: '0',
                mb: '2',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-strong)',
                textShadow: 'var(--ss-text-glow)',
              })}
            >
              SmartSound Session · {profile.label}
            </p>
            <h1
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'title1',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                color: 'text',
                textShadow: 'var(--ss-text-glow)',
                transition: 'opacity token(durations.gentle) ease',
              })}
            >
              {title}
            </h1>
            <p
              className={`tabular ${css({
                m: '0',
                mt: '1.5',
                fontSize: 'subhead',
                fontWeight: '500',
                letterSpacing: '0.01em',
                color: 'var(--ss-ink-strong)',
                textShadow: 'var(--ss-text-glow)',
              })}`}
            >
              {band}
            </p>
          </div>

          {/* Central orb — the signal ring IS the play/pause control. Tapping
              the living orb starts or stops the session; a soft center glyph
              invites the touch (bright when paused, receding while it plays so
              the ring's motion reads as "alive"). The breathing halo doubles as
              the press feedback. This is the merged orb⇄transport surface. */}
          <div
            className={css({
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: '2',
            })}
          >
            <div
              aria-hidden
              className={cx(
                css({
                  position: 'absolute',
                  borderRadius: 'full',
                  pointerEvents: 'none',
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none !important' },
                }),
              )}
              style={{
                width: RING_SIZE * 1.32,
                height: RING_SIZE * 1.32,
                background: `radial-gradient(circle, ${ringColor}${running ? '38' : '22'} 0%, transparent 68%)`,
                animation: reduceMotion ? 'none' : `breathe ${breathDuration}s ease-in-out infinite`,
                transition: 'background token(durations.slow) ease',
              }}
            />
            <motion.button
              type="button"
              onClick={handlePlayPause}
              aria-label={running ? 'Pause session' : 'Play session'}
              aria-pressed={running}
              whileTap={reduceMotion ? undefined : { scale: 0.955 }}
              animate={reduceMotion ? undefined : running ? { scale: [1, 1.015, 1] } : { scale: 1 }}
              transition={
                reduceMotion
                  ? undefined
                  : running
                    ? { duration: breathDuration, repeat: Infinity, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 320, damping: 20 }
              }
              className={css({
                position: 'relative',
                border: 'none',
                background: 'transparent',
                p: '0',
                borderRadius: 'full',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                _focusVisible: {
                  outline: '2px solid token(colors.accent)',
                  outlineOffset: '8px',
                  borderRadius: 'full',
                },
              })}
              style={{ width: RING_SIZE, height: RING_SIZE }}
            >
              <SignalRing
                arousal={arousal}
                color={ringColor}
                getSpectrum={getSpectrum}
                getPulse={getPulse}
                respirationBpm={reading.respiration}
                heartBpm={reading.hr}
                size={RING_SIZE}
                label={`Signal ring — ${band}, ${ringStatusLabel(status, bioActive, capped)}`}
              />
              {/* Center glyph on a frosted disc — the play affordance living
                  inside the orb. Recedes (not vanishes) while running. */}
              <span
                aria-hidden
                className={css({
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  w: '84px',
                  h: '84px',
                  borderRadius: 'full',
                  color: 'text',
                  background: 'rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(6px)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
                  pointerEvents: 'none',
                  transition: 'opacity token(durations.gentle) ease, transform token(durations.gentle) ease',
                })}
                style={{ opacity: running ? 0.28 : 0.96 }}
              >
                {running ? <CenterPauseIcon /> : <CenterPlayIcon />}
              </span>
            </motion.button>
          </div>

          <p
            className={css({
              m: '0',
              mt: '3',
              mb: '7',
              textAlign: 'center',
              fontSize: 'caption',
              fontWeight: '500',
              letterSpacing: '0.02em',
              color: 'var(--ss-ink-body)',
              textShadow: 'var(--ss-text-glow)',
              transition: 'opacity token(durations.gentle) ease',
            })}
          >
            {ringStatusLabel(status, bioActive, capped)}
          </p>

          {/* Timer + session length. */}
          <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3', mb: '6' })}>
            <span
              className={`tabular ${css({
                fontFamily: 'rounded',
                fontSize: 'largeTitle',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: 'text',
                textShadow: 'var(--ss-text-glow)',
              })}`}
            >
              {formatElapsed(elapsedMs)}
            </span>
            <div className={css({ display: 'flex', gap: '2' })}>
              {LENGTH_OPTIONS.map((opt) => {
                const selected = opt.minutes === length
                return (
                  <LiquidGlass
                    key={opt.label}
                    as="button"
                    variant="control"
                    staticSheen
                    aria-pressed={selected}
                    onClick={() => setLength(opt.minutes)}
                    tint={selected ? 'var(--signal)' : undefined}
                    className={css({
                      border: 'none',
                      font: 'inherit',
                      minW: '44px',
                      h: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <span
                      className={`tabular ${css({
                        px: '2',
                        fontSize: 'footnote',
                        fontWeight: '600',
                      })}`}
                      style={{ color: selected ? 'var(--signal)' : 'var(--colors-text)' }}
                    >
                      {opt.label}{opt.minutes != null && <span aria-hidden> min</span>}
                    </span>
                  </LiquidGlass>
                )
              })}
            </div>
          </div>

          {/* Transport — the orb above owns play/pause; this row only shifts
              between states. A centered pill keeps prev/next visually paired
              with the current state's name, so the row reads as one control. */}
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3',
              mb: '6',
            })}
          >
            <LiquidGlass
              as="button"
              variant="control"
              staticSheen
              onClick={() => cycleState(-1)}
              aria-label="Previous state"
              className={css({
                border: 'none',
                color: 'text',
                w: '52px',
                h: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <SkipBackIcon />
            </LiquidGlass>

            <div
              className={css({
                minW: '128px',
                textAlign: 'center',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-strong)',
                textShadow: 'var(--ss-text-glow)',
              })}
            >
              {profile.label}
            </div>

            <LiquidGlass
              as="button"
              variant="control"
              staticSheen
              onClick={() => cycleState(1)}
              aria-label="Next state"
              className={css({
                border: 'none',
                color: 'text',
                w: '52px',
                h: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <SkipForwardIcon />
            </LiquidGlass>
          </div>

          {/* Neural depth. */}
          <LiquidGlass variant="card" className={css({ mb: '4' })}>
            <div className={css({ px: '5', py: '4' })}>
              <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '3' })}>
                <span className={css({ fontSize: 'subhead', fontWeight: '600', color: 'text' })}>
                  Neural depth
                </span>
                <span
                  className={`tabular ${css({ fontSize: 'footnote', fontWeight: '600', color: 'muted' })}`}
                >
                  {Math.round(params.neuralDepth * 100)}%
                </span>
              </div>
              <Slider.Root
                className={css({
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  w: 'full',
                  h: '44px',
                  touchAction: 'none',
                })}
                min={0}
                max={1}
                step={0.01}
                value={[params.neuralDepth]}
                onValueChange={(v) => setNeuralIntensity(v[0])}
              >
                <Slider.Track
                  className={css({
                    position: 'relative',
                    flex: '1',
                    h: '5px',
                    borderRadius: 'capsule',
                    bg: 'var(--ss-control-track)',
                  })}
                >
                  <Slider.Range
                    className={css({ position: 'absolute', h: 'full', borderRadius: 'capsule' })}
                    style={{ background: 'var(--signal)' }}
                  />
                </Slider.Track>
                <Slider.Thumb
                  aria-label="Neural depth"
                  className={css({
                    display: 'block',
                    w: '28px',
                    h: '28px',
                    borderRadius: 'full',
                    bg: 'white',
                    boxShadow: '0 2px 8px rgba(3,6,18,0.4)',
                    cursor: 'pointer',
                    transition: 'transform var(--spring-smooth-duration) var(--spring-smooth)',
                    _active: { transform: 'scale(1.15)' },
                    _focusVisible: { outline: '2px solid token(colors.accent)', outlineOffset: '2px' },
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  })}
                />
              </Slider.Root>
            </div>
          </LiquidGlass>

          {/* Attune — camera-based presence, honest about what it is. */}
          <LiquidGlass variant="card">
            <div className={css({ px: '5', py: '4' })}>
              <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
                <span
                  aria-hidden
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    w: '40px',
                    h: '40px',
                    borderRadius: 'full',
                    flexShrink: '0',
                    color: attuneOn ? 'signal' : 'faint',
                    background: attuneOn ? 'signalFaint' : 'var(--ss-control-track-soft)',
                    transition: 'color token(durations.gentle) ease, background token(durations.gentle) ease',
                  })}
                >
                  <CameraIcon />
                </span>
                <div className={css({ flex: '1', minW: '0' })}>
                  <p className={css({ m: '0', fontSize: 'subhead', fontWeight: '600', color: 'text' })}>
                    Attune
                  </p>
                  <p className={css({ m: '0', mt: '0.5', fontSize: 'caption', lineHeight: '1.4', color: 'faint' })}>
                    {attuneStatusLabel(bioStatus)}
                  </p>
                </div>
                <LiquidGlass
                  as="button"
                  variant="control"
                  staticSheen
                  role="switch"
                  aria-checked={attuneOn}
                  aria-label="Toggle Attune camera"
                  onClick={handleAttuneToggle}
                  tint={attuneOn ? 'var(--signal)' : undefined}
                  className={css({
                    border: 'none',
                    minW: '64px',
                    h: '44px',
                    flexShrink: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <span
                    className={css({ px: '2', fontSize: 'footnote', fontWeight: '600' })}
                    style={{ color: attuneOn ? 'var(--signal)' : 'var(--colors-text)' }}
                  >
                    {attuneOn ? 'On' : 'Off'}
                  </span>
                </LiquidGlass>
              </div>

              {bioActive && (
                <div
                  className={`tabular ${css({
                    display: 'flex',
                    gap: '4',
                    mt: '3',
                    pt: '3',
                    borderTop: '1px solid',
                    borderColor: 'hairline',
                    fontSize: 'footnote',
                    fontWeight: '600',
                    color: 'muted',
                    animation: 'fadeUp token(durations.gentle) token(easings.enter) both',
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  })}`}
                >
                  <span>{Math.round(reading.hr)} bpm</span>
                  <span aria-hidden>·</span>
                  <span>{Math.round(reading.confidence * 100)}% confidence</span>
                </div>
              )}
            </div>
          </LiquidGlass>

          {/* The science — honest, cited disclosure of the actual mechanisms. */}
          <div className={css({ mt: '4' })}>
            <SciencePanel />
          </div>
        </div>
      </div>
    </div>
  )
}
