import { useCallback, useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { flex, hstack, stack, wrap } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { SignalRing } from '~/design/SignalRing'
import { Slider } from '~/components/ui/Slider'
import { Button } from '~/components/ui/Button'
import { TARGET_STATES } from '~/engine/audio'
import type { CaptureStatus } from '~/engine/biometric/capture'
import { suggestFor } from '~/engine/circadian/model'
import { arousalLabel, fmtClock, pct, signalColor } from '~/lib/format'

export const Route = createFileRoute('/app/session')({
  component: SessionScreen,
})

function attuneCopy(status: CaptureStatus): { tone: 'ok' | 'warn'; text: string } {
  switch (status) {
    case 'active': return { tone: 'ok', text: 'Attuned — reading your pulse. Video never leaves this device.' }
    case 'requesting': return { tone: 'ok', text: 'Requesting the camera…' }
    case 'denied': return { tone: 'warn', text: "Without the camera, SmartSound can't attune to you. You can still run a fixed soundscape, or enable the camera in your browser settings." }
    case 'nocamera': return { tone: 'warn', text: 'No camera found. SmartSound will run a fixed soundscape instead.' }
    case 'error': return { tone: 'warn', text: 'The camera is unavailable. SmartSound will run a fixed soundscape instead.' }
    default: return { tone: 'ok', text: 'Your camera senses how settled you are. Video is processed on-device and never sent anywhere.' }
  }
}

function SessionScreen() {
  const {
    status, profile, params, arousal, reading, baseline, bioStatus,
    start, selectState, setNeuralIntensity, startAttune, stopAttune, getSpectrum, getPulse,
  } = useEngine()

  const [selected, setSelected] = useState(profile.key)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const color = signalColor(arousal)
  const running = status === 'running'
  const attuned = bioStatus === 'active'

  useEffect(() => {
    if (!running) { setStartedAt(null); setElapsed(0); return }
    if (startedAt == null) setStartedAt(performance.now())
    const id = setInterval(() => {
      setElapsed((prev) => (startedAt ? (performance.now() - startedAt) / 1000 : prev))
    }, 500)
    return () => clearInterval(id)
  }, [running, startedAt])

  const onPickState = useCallback((key: typeof selected) => {
    setSelected(key)
    if (running) selectState(key)
  }, [running, selectState])

  const begin = useCallback(() => void start(selected), [start, selected])

  const attune = useCallback(() => {
    if (attuned) stopAttune()
    else void startAttune()
  }, [attuned, startAttune, stopAttune])

  const copy = attuneCopy(bioStatus)
  const hrDelta = baseline.captured && reading.active ? reading.hr - baseline.hr : null
  const suggestion = suggestFor(new Date())

  return (
    <div className={stack({ gap: '8', maxW: '860px', mx: 'auto' })}>
      {/* State selector */}
      <div className={flex({ justify: 'space-between', align: 'center', wrap: 'wrap', gap: '3' })}>
        <div className={wrap({ gap: '2' })}>
          {TARGET_STATES.map((s) => (
            <button
              key={s.key}
              onClick={() => onPickState(s.key)}
              className={css({
                fontFamily: 'display', fontWeight: '500', fontSize: 'sm',
                px: '4', py: '2', rounded: 'full', cursor: 'pointer',
                border: '1px solid token(colors.hairline)',
                color: selected === s.key ? 'bg' : 'muted',
                bg: selected === s.key ? 'signal' : 'transparent',
                borderColor: selected === s.key ? 'signal' : 'hairline',
                transition: 'all token(durations.instant)',
                _hover: { color: selected === s.key ? 'bg' : 'text' },
              })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className={hstack({ gap: '3' })}>
          <button
            onClick={() => onPickState(suggestion.state)}
            className={css({
              fontFamily: 'mono', fontSize: '2xs', color: 'muted', cursor: 'pointer',
              px: '3', py: '1.5', rounded: 'full', bg: 'transparent',
              border: '1px solid token(colors.hairline)',
              transition: 'all token(durations.instant)',
              _hover: { borderColor: 'signal', color: 'text' },
            })}
            title="Circadian suggestion"
          >
            NOW → {suggestion.label.toUpperCase()} · {suggestion.reason}
          </button>
          <span className={`tabular ${css({ fontFamily: 'mono', fontSize: 'sm', color: 'muted' })}`}>
            {fmtClock(elapsed)}
          </span>
        </div>
      </div>

      {/* The instrument */}
      <div className={flex({ justify: 'center', position: 'relative', py: '2' })}>
        <div style={{ width: 'min(420px, 82vw)', aspectRatio: '1' }}>
          <SignalRingResponsive arousal={arousal} color={color} getSpectrum={getSpectrum} getPulse={getPulse} />
        </div>
        <div
          className={stack({
            gap: '1', align: 'center', position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', pointerEvents: 'none', textAlign: 'center',
          })}
        >
          <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', color: 'signal' })}`}>
            {arousalLabel(arousal)}
          </span>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em' })}>
            {reading.active
              ? `${Math.round(reading.hr)} BPM · ${pct(reading.confidence)}% CONF`
              : running
                ? `${profile.label.toUpperCase()} · ${Math.round(params.entrainmentHz)} Hz`
                : 'READY'}
          </span>
        </div>
      </div>

      {/* Readout strip */}
      <div className={css({ display: 'grid', gridTemplateColumns: { base: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: '3' })}>
        <Readout label="HEART RATE" value={reading.active ? `${Math.round(reading.hr)}` : '—'} unit="bpm"
          sub={hrDelta != null ? `${hrDelta >= 0 ? '+' : ''}${Math.round(hrDelta)} vs base` : 'no baseline'} />
        <Readout label="STEADINESS" value={reading.active ? `${pct(reading.steadiness)}` : '—'} unit="%" sub="trend" />
        <Readout label="ENTRAINMENT" value={`${params.entrainmentHz.toFixed(1)}`} unit="Hz" sub={profile.label} />
        <Readout label="CONFIDENCE" value={reading.active ? `${pct(reading.confidence)}` : '—'} unit="%" sub={attuned ? 'attuned' : 'camera off'} />
      </div>

      {/* Controls — recede as the session deepens (§6.3) */}
      <div
        className={css({
          transition: 'opacity token(durations.calm) token(easings.settle)',
          opacity: running && attuned ? 0.62 : 1,
          _hover: { opacity: 1 },
        })}
      >
        <div className={stack({ gap: '5', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
          <div className={stack({ gap: '2' })}>
            <div className={flex({ justify: 'space-between' })}>
              <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.1em' })}>NEURAL EFFECT INTENSITY</span>
              <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>{pct(params.neuralDepth)}%</span>
            </div>
            <Slider label="Neural effect intensity" value={params.neuralDepth} onValueChange={setNeuralIntensity} />
          </div>

          <div className={flex({ justify: 'space-between', align: 'center', gap: '4', wrap: 'wrap' })}>
            <p className={css({ fontSize: 'sm', color: copy.tone === 'warn' ? 'state.elevated' : 'muted', maxW: '30rem', lineHeight: '1.45' })}>
              {copy.text}
            </p>
            <Button variant={attuned ? 'outline' : 'primary'} onClick={attune}>
              {attuned ? 'Turn off Attune' : 'Enable Attune'}
            </Button>
          </div>
        </div>
      </div>

      {/* Primary action */}
      {!running && (
        <div className={flex({ justify: 'center' })}>
          <Button size="lg" variant="primary" onClick={begin}>Begin session</Button>
        </div>
      )}
    </div>
  )
}

function SignalRingResponsive(props: Omit<Parameters<typeof SignalRing>[0], 'size'>) {
  // The ring reads container size once; 420 is the design max and it scales via CSS.
  return <SignalRing {...props} size={420} />
}

function Readout({ label, value, unit, sub }: { label: string; value: string; unit: string; sub: string }) {
  return (
    <div className={stack({ gap: '0.5', p: '4', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: 'xl' })}>
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em' })}>{label}</span>
      <div className={flex({ gap: '1', align: 'baseline' })}>
        <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '2xl' })}`}>{value}</span>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>{unit}</span>
      </div>
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>{sub}</span>
    </div>
  )
}
