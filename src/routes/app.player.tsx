import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import * as Slider from '@radix-ui/react-slider'
import { css, cx } from 'styled-system/css'
import { BandField } from '~/design/BandField'
import { WaveformRing } from '~/design/WaveformRing'
import { PulseFlow } from '~/components/PulseFlow'
import { Card, chipCss, chipActiveCss, glassCss } from '~/components/Card'
import { RecordDisc } from '~/components/vinyl/RecordDisc'
import { useClickSound } from '~/lib/click-sound'
import { useEngine } from '~/lib/engine-context'
import { recordRecent } from '~/lib/recents'
import { clearSessionStartedAt, recordSessionStartedAt } from '~/lib/session-meta'
import { remainingFreeMinutes, shouldWarnLowTime, lowTimeMessage } from '~/lib/free-warning'
import { TARGET_STATES } from '~/engine/audio/profiles'
import { BAND_LABEL, SOUNDSCAPES } from '~/lib/catalog'
import { useDailyUsage, FREE_DAILY_MIN } from '~/lib/entitlements'
import type { TargetState } from '~/engine/audio/types'

/**
 * Player — the generative band world (Phase B). No photos, no glass: a
 * Deep Space canvas with a band-tinted particle drift (Delta slowest/
 * dimmest → Beta fastest/brightest), the pressed record as the play
 * control, and a waveform ring rippling at the record's band frequency
 * scaled (band Hz / 10). The engine underneath is untouched — this is
 * purely a presentation layer over `useEngine()`.
 */

const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']

interface PlayerSearch {
  state?: TargetState
  /** Preset session length in minutes (e.g. Wind-down · 15, Pomodoro · 25). */
  minutes?: number
}

function isTargetState(value: unknown): value is TargetState {
  return typeof value === 'string' && (VALID_STATES as readonly string[]).includes(value)
}

export const Route = createFileRoute('/app/player')({
  validateSearch: (search: Record<string, unknown>): PlayerSearch => ({
    state: isTargetState(search.state) ? search.state : undefined,
    minutes:
      typeof search.minutes === 'number' && Number.isFinite(search.minutes) && search.minutes > 0
        ? Math.round(search.minutes)
        : undefined,
  }),
  component: PlayerScreen,
})

/** The revolving record — the disc IS the play control. */
const DISC_SIZE = 232
/** The waveform ring drawn just outside the vinyl's rim. */
const RING_SIZE = 340

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

// ── icons — quiet strokes ───────────────────────────────────────────────────

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

const CenterPlayIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden style={{ transform: 'translateX(2px)' }}>
    <path
      d="M8.2 5.6a1 1 0 0 1 1.53-.85l9.4 6.4a1 1 0 0 1 0 1.66l-9.4 6.4A1 1 0 0 1 8.2 18.3V5.6z"
      fill="currentColor"
    />
  </svg>
)

const CenterPauseIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
    <rect x="6.3" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
    <rect x="13.7" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
  </svg>
)

const PrevIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...iconAttrs}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

const NextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...iconAttrs}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

function ringStatusLabel(status: 'idle' | 'running', bioActive: boolean, capped: boolean): string {
  if (status !== 'running') {
    return capped ? 'Today’s free session is used — play to see Pro' : 'Preview — begin to hear it live'
  }
  return bioActive ? 'Live audio + pulse' : 'Live audio'
}

// Quiet round controls floating over the band field — lightly frosted
// (.ss-frost-light in index.css carries the backdrop blur pair).
const quietRoundBtnCss = cx(
  'ss-frost-light',
  css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '0.5px solid',
  borderColor: 'frost.stroke',
  borderRadius: 'pill',
  background: 'rgba(30, 30, 42, 0.55)',
  color: 'silver',
  font: 'inherit',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition:
    'background 300ms ease, color 300ms ease, transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  _hover: { background: 'rgba(45, 45, 61, 0.65)', color: 'starlight' },
  _active: { transform: 'scale(0.94)' },
  '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
  }),
)

function PlayerScreen() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const { plan, capReached, minutesToday, addMinutes, recordSessionStart } = useDailyUsage()
  const {
    status, profile, params, reading, bioStatus,
    start, stop, selectState, setNeuralIntensity, startAttune, stopAttune, getPulse,
  } = useEngine()

  const state = profile.key
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

  // Elapsed session timer. A ?minutes= search param presets the length —
  // the merged Wind-down record's "15 min" target lands here.
  const [elapsedMs, setElapsedMs] = useState(0)
  const startedAt = useRef<number | null>(null)
  const [length, setLength] = useState<number | null>(search.minutes ?? null)

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
  // the Free daily cap is honored.
  const handlePlayPause = () => {
    if (running) {
      playClick('primary')
      if (elapsedMs > 0) addMinutes(elapsedMs / 60_000)
      clearSessionStartedAt()
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
    recordSessionStartedAt()
    void start(state)
  }

  const cycleState = (dir: 1 | -1) => {
    playClick('tap')
    const idx = TARGET_STATES.findIndex((p) => p.key === state)
    const next = TARGET_STATES[(idx + dir + TARGET_STATES.length) % TARGET_STATES.length]
    selectState(next.key)
  }

  // A preset length outside the standard chips (e.g. Wind-down's 15) gets
  // its own chip so the selection stays visible.
  const lengthOptions =
    search.minutes != null && !LENGTH_OPTIONS.some((o) => o.minutes === search.minutes)
      ? [{ label: String(search.minutes), minutes: search.minutes }, ...LENGTH_OPTIONS]
      : LENGTH_OPTIONS

  // The gentle two-minute warning — display only; the cap logic in
  // entitlements.ts stays authoritative.
  const remaining = remainingFreeMinutes(minutesToday, running ? elapsedMs : 0)
  const warnLowTime = shouldWarnLowTime(plan, running, remaining)

  return (
    // ss-scene-dark: the immersive player stays dark — ONE dark world.
    <div
      className={cx(
        'ss-scene-dark',
        css({ position: 'fixed', inset: '0', zIndex: '0', overflow: 'hidden', bg: 'deepSpace' }),
      )}
    >
      {/* The generative band field — the only background this route has. */}
      <BandField state={state} />

      <div
        className={css({
          position: 'absolute',
          inset: '0',
          zIndex: '1',
          overflowY: 'auto',
          overflowX: 'hidden',
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
            // Content scrolls beneath the frosted nav; keep the tail clear of it.
            pb: 'calc(env(safe-area-inset-bottom) + 58px + 32px)',
            flex: '1',
            display: 'flex',
            flexDirection: 'column',
          })}
        >
          {/* Top bar — dismiss to Today. The session keeps playing underneath. */}
          <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: '5' })}>
            <button
              type="button"
              onClick={() => void navigate({ to: '/app' })}
              aria-label="Done — back to Today"
              className={cx(quietRoundBtnCss, css({ w: '44px', h: '44px' }))}
            >
              <ChevronDownIcon />
            </button>
          </div>

          {/* Now-playing info — the "album" line, title, band/Hz subtitle. */}
          <div className={css({ textAlign: 'center', mb: '5' })}>
            <p
              className={cx(
                'tabular',
                css({
                  m: '0',
                  mb: '2',
                  fontSize: 'caption',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'silver',
                }),
              )}
            >
              SmartSound Session · {profile.label}
            </p>
            <h1
              className={css({
                m: '0',
                fontFamily: 'display',
                fontWeight: '400',
                fontSize: 'heading',
                letterSpacing: '-0.01em',
                color: 'starlight',
              })}
            >
              {title}
            </h1>
            <p
              className={cx(
                'tabular',
                css({ m: '0', mt: '1.5', fontSize: 'bodySm', letterSpacing: '0.02em', color: 'silver' }),
              )}
            >
              {band}
            </p>
          </div>

          {/* The pressed record — the disc IS the play/pause control, the
              waveform ring around it ripples at the band's scaled rate. */}
          <div
            className={css({
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              my: '2',
            })}
            style={{ minHeight: RING_SIZE }}
          >
            <span aria-hidden className={css({ position: 'absolute', pointerEvents: 'none' })}>
              <WaveformRing state={state} size={RING_SIZE} discSize={DISC_SIZE} running={running} />
            </span>
            <button
              type="button"
              onClick={handlePlayPause}
              aria-label={running ? 'Pause session' : 'Play session'}
              aria-pressed={running}
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
                transition: 'transform 160ms ease',
                _active: { transform: 'scale(0.97)' },
                _focusVisible: {
                  outline: '2px solid token(colors.ghostBlue)',
                  outlineOffset: '8px',
                  borderRadius: 'full',
                },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
              })}
              style={{ width: DISC_SIZE, height: DISC_SIZE }}
            >
              {/* plain label — the player issues ZERO photo requests. */}
              <RecordDisc state={state} size={DISC_SIZE} plain spinning={running ? 'playing' : 'idle'} />
              {/* Center glyph on the hub — a soft frosted circular play
                  control with a gentle glow ring (Calm/Brain.fm signature);
                  recedes while running. */}
              <span
                aria-hidden
                className={cx(
                  'ss-frost',
                  css({
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    w: '68px',
                    h: '68px',
                    borderRadius: 'full',
                    color: 'starlight',
                    background: 'rgba(30, 30, 42, 0.72)',
                    // 0.5px rim + a soft mercury glow — the ONE accent, on the
                    // ONE primary action.
                    boxShadow:
                      'inset 0 0 0 0.5px rgba(237, 237, 243, 0.16), 0 0 0 0.5px rgba(237, 237, 243, 0.08), 0 0 32px rgba(82, 102, 235, 0.28), 0 2px 12px rgba(0, 0, 0, 0.35)',
                    pointerEvents: 'none',
                    transition: 'opacity 420ms ease, box-shadow 420ms ease',
                    '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  }),
                )}
                style={{ opacity: running ? 0.28 : 0.98 }}
              >
                {running ? <CenterPauseIcon /> : <CenterPlayIcon />}
              </span>
            </button>
          </div>

          <p
            className={css({
              m: '0',
              mt: '3',
              textAlign: 'center',
              fontSize: 'caption',
              letterSpacing: '0.02em',
              color: 'silver',
            })}
          >
            {ringStatusLabel(status, bioActive, capped)}
          </p>

          {/* Free-tier honesty: remaining minutes BEFORE playback; a gentle
              2-minute warning DURING playback — no hard-cut surprises. */}
          {plan === 'free' && !running && (
            <p
              data-testid="free-minutes-left"
              className={cx(
                'tabular',
                css({ m: '0', mt: '1.5', textAlign: 'center', fontSize: 'caption', letterSpacing: '0.06em', color: 'silver' }),
              )}
            >
              {Math.max(0, Math.floor(FREE_DAILY_MIN - minutesToday))} min left today
            </p>
          )}
          {warnLowTime && (
            <p
              data-testid="two-min-warning"
              className={cx(
                'tabular',
                css({ m: '0', mt: '1.5', textAlign: 'center', fontSize: 'caption', letterSpacing: '0.06em', color: 'silver' }),
              )}
            >
              {lowTimeMessage(remaining)}
            </p>
          )}

          {/* Tune to your pulse — THE differentiator, near the disc. */}
          <div className={css({ display: 'flex', justifyContent: 'center', mt: '4', mb: '5' })}>
            <PulseFlow
              state={state}
              bioStatus={bioStatus}
              reading={reading}
              getPulse={getPulse}
              startAttune={startAttune}
              stopAttune={stopAttune}
            />
          </div>

          {/* Timer + session length — design.md chips. */}
          <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3', mb: '6' })}>
            <span
              className={cx(
                'tabular',
                css({ fontSize: 'heading', letterSpacing: '-0.01em', color: 'starlight' }),
              )}
            >
              {formatElapsed(elapsedMs)}
            </span>
            <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap', justifyContent: 'center' })}>
              {lengthOptions.map((opt) => {
                const selected = opt.minutes === length
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      playClick('tap')
                      setLength(opt.minutes)
                    }}
                    className={cx(chipCss, selected ? chipActiveCss : undefined, 'tabular')}
                  >
                    {opt.label}
                    {opt.minutes != null && <span aria-hidden> min</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Transport — shifts between states only; visually quiet. */}
          <div
            className={css({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3',
              mb: '2',
            })}
          >
            <button
              type="button"
              onClick={() => cycleState(-1)}
              aria-label="Previous state"
              className={cx(quietRoundBtnCss, css({ w: '48px', h: '48px' }))}
            >
              <PrevIcon />
            </button>
            <div
              className={cx(
                'tabular',
                css({
                  minW: '128px',
                  textAlign: 'center',
                  fontSize: 'caption',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'silver',
                }),
              )}
            >
              {profile.label}
            </div>
            <button
              type="button"
              onClick={() => cycleState(1)}
              aria-label="Next state"
              className={cx(quietRoundBtnCss, css({ w: '48px', h: '48px' }))}
            >
              <NextIcon />
            </button>
          </div>

          {/* Constrained-player honesty — that's the point. */}
          <p
            className={css({
              m: '0',
              mb: '6',
              textAlign: 'center',
              fontSize: 'caption',
              lineHeight: '1.5',
              color: 'silver',
            })}
          >
            No skipping. Records play through — that&rsquo;s the point.
          </p>

          {/* Neural depth — frosted, floating over the band field. */}
          <Card glass className={css({ mb: '4' })}>
            <div className={css({ px: '5', py: '4' })}>
              <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '3' })}>
                <span className={css({ fontSize: 'bodySm', fontWeight: '500', color: 'starlight' })}>
                  Neural depth
                </span>
                <span className={cx('tabular', css({ fontSize: 'caption', color: 'silver' }))}>
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
                    h: '4px',
                    borderRadius: 'pill',
                    bg: 'rgba(112, 112, 125, 0.35)',
                  })}
                >
                  <Slider.Range
                    className={css({
                      position: 'absolute',
                      h: 'full',
                      borderRadius: 'pill',
                      bg: 'silver',
                    })}
                  />
                </Slider.Track>
                <Slider.Thumb
                  aria-label="Neural depth"
                  className={css({
                    display: 'block',
                    w: '22px',
                    h: '22px',
                    borderRadius: 'full',
                    bg: 'starlight',
                    border: '1px solid',
                    borderColor: 'lead',
                    cursor: 'pointer',
                    _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '2px' },
                  })}
                />
              </Slider.Root>
            </div>
          </Card>

          {/* The science — the full evidence ledger lives on /science. */}
          <Link
            to="/science"
            className={cx(
              glassCss,
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '3',
                px: '5',
                py: '4',
                borderRadius: 'card',
                textDecoration: 'none',
                transition: 'background 300ms ease',
                _hover: { background: 'rgba(45, 45, 61, 0.72)' },
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              }),
            )}
          >
            <span>
              <span className={css({ display: 'block', fontSize: 'bodySm', fontWeight: '500', color: 'starlight' })}>
                The science, honestly
              </span>
              <span className={css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'silver' })}>
                Every mechanism, cited — read the evidence ledger
              </span>
            </span>
            <span aria-hidden className={css({ color: 'silver' })}>
              <NextIcon />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
