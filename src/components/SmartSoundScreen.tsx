import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { flex, hstack, stack } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { BiofeedbackRing } from '~/design/BiofeedbackRing'
import { HeartRateReadout } from '~/components/HeartRateReadout'
import { GlassButton } from '~/components/GlassButton'
import { Slider } from '~/components/ui/Slider'
import { TARGET_STATES } from '~/engine/audio'
import { arousalLabel, fmtClock, pct } from '~/lib/format'
import type { TargetState } from '~/engine/audio/types'

/**
 * SmartSoundScreen — the app itself (Part 5.A): one full-bleed dark screen, no
 * nav chrome, reskinned over the existing rPPG + audio engine (consumed via
 * useEngine — never rewritten). BiofeedbackRing centrepiece, HeartRateReadout
 * beneath it, a single frosted Liquid Glass control bar, and a faint pixel-grid
 * texture for depth. Session start/stop replays the ring's pixel assemble.
 */
const PlayIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
)
const PauseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </svg>
)
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
    <rect x="3" y="6" width="18" height="13" rx="2" /><circle cx="12" cy="12.5" r="3.2" /><path d="M8 6l1.5-2h5L16 6" />
  </svg>
)

export function SmartSoundScreen() {
  const {
    status, profile, params, arousal, reading, bioStatus,
    start, stop, selectState, setNeuralIntensity, startAttune, stopAttune,
    getSpectrum, getPulse,
  } = useEngine()

  const [selected, setSelected] = useState<TargetState>(profile.key as TargetState)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [bootKey, setBootKey] = useState(0)
  const prevHr = useRef(reading.hr)

  const running = status === 'running'
  const attuned = bioStatus === 'active'

  // Keep the pill selection in sync with the engine's active profile — e.g. a
  // deep link (Discover/Browse → /app/now?state=…) starts a state before this
  // component mounts, or a running scenario advances phases underneath it.
  useEffect(() => {
    setSelected(profile.key as TargetState)
  }, [profile.key])

  useEffect(() => {
    if (!running) { setStartedAt(null); setElapsed(0); return }
    if (startedAt == null) setStartedAt(performance.now())
    const id = setInterval(() => setElapsed(startedAt ? (performance.now() - startedAt) / 1000 : 0), 500)
    return () => clearInterval(id)
  }, [running, startedAt])

  const trend: 'up' | 'down' | 'steady' = reading.active
    ? reading.hr > prevHr.current + 0.5 ? 'up' : reading.hr < prevHr.current - 0.5 ? 'down' : 'steady'
    : 'steady'
  useEffect(() => { prevHr.current = reading.hr }, [reading.hr])

  const pickState = useCallback((key: TargetState) => {
    setSelected(key)
    if (running) selectState(key)
  }, [running, selectState])

  const togglePlay = useCallback(() => {
    setBootKey((k) => k + 1) // pixel assemble / dissolve on both start and stop
    if (running) void stop()
    else void start(selected)
  }, [running, stop, start, selected])

  const toggleAttune = useCallback(() => {
    if (attuned) stopAttune()
    else void startAttune()
  }, [attuned, startAttune, stopAttune])

  return (
    <div
      className={css({
        position: 'relative',
        minH: '100%',
        height: '100%',
        bg: 'bgBase',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        overflow: 'hidden',
      })}
    >
      {/* faint pixel-grid texture for depth (Part 5.A) */}
      <div
        aria-hidden
        className={css({
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          opacity: '0.5',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: 'var(--pixel-size) var(--pixel-size)',
          maskImage: 'radial-gradient(120% 80% at 50% 35%, #000 30%, transparent 80%)',
        })}
      />

      {/* minimal, unobtrusive top row (not nav chrome) */}
      <div className={flex({ justify: 'space-between', align: 'center', px: '5', pt: '5', position: 'relative', zIndex: '2' })}>
        <Link
          to="/"
          className={hstack({ gap: '2.5', textDecoration: 'none', color: 'text' })}
          aria-label="SmartSound home"
        >
          <span className={css({ w: '2', h: '2', rounded: 'full', bg: 'signal', boxShadow: '0 0 12px token(colors.signal)' })} />
          <span className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'md', letterSpacing: '-0.01em' })}>SmartSound</span>
        </Link>
        <GlassButton variant={attuned ? 'pill' : 'ghost'} selected={attuned} size="sm" onClick={toggleAttune}
          aria-label={attuned ? 'Turn off camera attune' : 'Attune with camera'}>
          <CameraIcon />
          {attuned && <span className={css({ fontSize: 'xs' })}>Attuned</span>}
        </GlassButton>
      </div>

      {/* stage */}
      <div className={stack({ gap: '5', align: 'center', justify: 'center', position: 'relative', zIndex: '1', px: '5' })}>
        <div className={css({ position: 'relative', width: 'min(440px, 82vw)', aspectRatio: '1' })}>
          <BiofeedbackRing
            arousal={arousal}
            getSpectrum={getSpectrum}
            getPulse={getPulse}
            heartBpm={reading.active ? reading.hr : 64}
            size={440}
            bootKey={bootKey}
          />
          <div
            className={stack({
              gap: '1', align: 'center', position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center',
            })}
          >
            <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', color: 'signal' })}`}>
              {arousalLabel(arousal)}
            </span>
            <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.1em' })}>
              {running ? `${profile.label.toUpperCase()} · ${Math.round(params.entrainmentHz)} HZ` : 'READY'}
            </span>
          </div>
        </div>

        <HeartRateReadout
          bpm={reading.active ? reading.hr : null}
          active={reading.active}
          trend={trend}
          caption={reading.active ? `${pct(reading.confidence)}% confidence` : attuned ? 'attuning…' : 'camera off'}
        />
      </div>

      {/* controls */}
      <div className={stack({ gap: '4', align: 'center', px: '4', pb: 'calc(20px + env(safe-area-inset-bottom))', pt: '4', position: 'relative', zIndex: '2' })}>
        {/* soundscape / state toggle */}
        <div className={flex({ gap: '2', wrap: 'wrap', justify: 'center' })}>
          {TARGET_STATES.map((s) => (
            <GlassButton key={s.key} variant="pill" size="sm" selected={selected === s.key}
              onClick={() => pickState(s.key as TargetState)}>
              {s.label}
            </GlassButton>
          ))}
        </div>

        {/* neural depth */}
        <div className={css({ width: 'min(440px, 88vw)' })}>
          <div className={flex({ justify: 'space-between', mb: '1.5' })}>
            <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.1em' })}>NEURAL</span>
            <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>{pct(params.neuralDepth)}%</span>
          </div>
          <Slider label="Neural effect intensity" value={params.neuralDepth} onValueChange={setNeuralIntensity} />
        </div>

        {/* the single frosted Liquid Glass control bar */}
        <div
          className={flex({
            align: 'center', justify: 'space-between', gap: '4',
            width: 'min(440px, 88vw)', px: '5', py: '3', rounded: '3xl',
            bg: 'glassFill', border: '1px solid token(colors.glassBorder)',
          })}
          style={{
            backdropFilter: 'blur(var(--glass-blur)) saturate(1.5)',
            WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.5)',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          <span className={`tabular ${css({ fontFamily: 'mono', fontSize: 'sm', color: 'muted', minW: '3.2em' })}`}>
            {fmtClock(elapsed)}
          </span>
          <GlassButton variant="primary" size="lg" onClick={togglePlay}
            aria-label={running ? 'Pause session' : 'Begin session'}
            className={css({ width: '64px', height: '64px', px: '0', rounded: 'full' })}>
            {running ? <PauseIcon /> : <PlayIcon />}
          </GlassButton>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', minW: '3.2em', textAlign: 'right' })}>
            {running ? arousalLabel(arousal) : 'ENDLESS'}
          </span>
        </div>
      </div>
    </div>
  )
}
