import { useCallback } from 'react'
import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, hstack, flex } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { SignalRing } from '~/design/SignalRing'
import { Button } from '~/components/ui/Button'
import { onboarding } from '~/lib/onboarding'
import type { TargetState } from '~/engine/audio/types'
import { arousalLabel, pct, signalColor } from '~/lib/format'

export const Route = createFileRoute('/onboarding/$step')({
  component: Onboarding,
})

const STEPS = ['intent', 'camera', 'calibrate'] as const
const INTENTS: { state: TargetState; label: string; blurb: string }[] = [
  { state: 'focus', label: 'Focus', blurb: 'Sharp, sustained attention for deep work.' },
  { state: 'calm', label: 'Calm', blurb: 'Settled and unhurried — read, think, breathe.' },
  { state: 'sleep', label: 'Sleep', blurb: 'Wind down toward delta and let go.' },
]

function Progress({ step }: { step: string }) {
  const idx = STEPS.indexOf(step as (typeof STEPS)[number])
  return (
    <div className={hstack({ gap: '2', justify: 'center' })}>
      {STEPS.map((s, i) => (
        <span
          key={s}
          className={css({ h: '1', rounded: 'full', transition: 'all token(durations.calm)', bg: i <= idx ? 'signal' : 'hairline' })}
          style={{ width: i === idx ? 32 : 16 }}
        />
      ))}
    </div>
  )
}

function Shell({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className={flex({ direction: 'column', minHeight: '100dvh', px: '5', py: '8', align: 'center' })}>
      <div className={stack({ gap: '8', maxW: '560px', width: 'full', flex: 1, justify: 'center' })}>
        <Progress step={step} />
        {children}
      </div>
    </div>
  )
}

function Onboarding() {
  const { step } = useParams({ from: '/onboarding/$step' })
  const navigate = useNavigate()
  const { arousal, reading, bioStatus, startAttune, stopAttune, captureBaseline, getPulse, start } = useEngine()

  const goIntent = useCallback((state: TargetState) => {
    onboarding.intent = state
    navigate({ to: '/onboarding/$step', params: { step: 'camera' } })
  }, [navigate])

  const beginBaseline = useCallback(() => void startAttune(), [startAttune])
  const confirmBaseline = useCallback(() => {
    captureBaseline()
    navigate({ to: '/onboarding/$step', params: { step: 'calibrate' } })
  }, [captureBaseline, navigate])

  const finish = useCallback(async () => {
    stopAttune()
    await start(onboarding.intent)
    navigate({ to: '/app/session' })
  }, [start, stopAttune, navigate])

  if (step === 'intent') {
    return (
      <Shell step={step}>
        <div className={stack({ gap: '2', textAlign: 'center' })}>
          <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.02em' })}>What are you here for?</h1>
          <p className={css({ color: 'muted' })}>Pick an intent. You can change it any time in a session.</p>
        </div>
        <div className={stack({ gap: '3' })}>
          {INTENTS.map((it) => (
            <button
              key={it.state}
              onClick={() => goIntent(it.state)}
              className={css({
                textAlign: 'left', p: '5', rounded: '2xl', cursor: 'pointer', bg: 'panel',
                border: '1px solid token(colors.hairline)',
                transition: 'border-color token(durations.instant), transform token(durations.instant)',
                _hover: { borderColor: 'signal', transform: 'translateY(-1px)' },
              })}
            >
              <div className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>{it.label}</div>
              <div className={css({ color: 'muted', fontSize: 'sm' })}>{it.blurb}</div>
            </button>
          ))}
        </div>
      </Shell>
    )
  }

  if (step === 'camera') {
    const attuned = bioStatus === 'active'
    const canCapture = attuned && reading.active && reading.confidence > 0.15
    return (
      <Shell step={step}>
        <div className={stack({ gap: '2', textAlign: 'center' })}>
          <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.02em' })}>Let SmartSound see you</h1>
          <p className={css({ color: 'muted', maxW: '30rem', mx: 'auto', lineHeight: '1.5' })}>
            SmartSound reads your pulse from your camera to tune the sound to you. Video never leaves this device.
          </p>
        </div>

        <div className={flex({ justify: 'center' })}>
          <div className={css({ position: 'relative' })} style={{ width: 'min(300px, 70vw)', aspectRatio: '1' }}>
            <SignalRing arousal={arousal} color={signalColor(arousal)} getPulse={getPulse} size={300} />
            <div className={stack({ gap: '0.5', align: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' })}>
              <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '2xl', color: 'signal' })}`}>
                {reading.active ? `${Math.round(reading.hr)}` : arousalLabel(arousal)}
              </span>
              <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>
                {reading.active ? `BPM · ${pct(reading.confidence)}% CONF` : attuned ? 'finding your pulse' : 'camera off'}
              </span>
            </div>
          </div>
        </div>

        <div className={stack({ gap: '3', align: 'center' })}>
          {!attuned ? (
            <Button variant="primary" size="lg" onClick={beginBaseline}>Enable camera</Button>
          ) : (
            <Button variant="primary" size="lg" disabled={!canCapture} onClick={confirmBaseline}>
              {canCapture ? 'Capture my baseline' : 'Hold still — reading…'}
            </Button>
          )}
          {(bioStatus === 'denied' || bioStatus === 'nocamera' || bioStatus === 'error') && (
            <p className={css({ color: 'state.elevated', fontSize: 'sm', textAlign: 'center', maxW: '30rem' })}>
              {bioStatus === 'denied'
                ? "Without the camera, SmartSound can't attune to you. You can still run a fixed soundscape, or enable the camera in your browser settings."
                : 'No camera available — you can still run a fixed soundscape.'}
            </p>
          )}
          <Link to="/onboarding/$step" params={{ step: 'calibrate' }} className={css({ color: 'muted', fontSize: 'sm', textDecoration: 'underline' })}>
            Skip — run without the camera
          </Link>
        </div>
      </Shell>
    )
  }

  // calibrate
  return (
    <Shell step={step}>
      <div className={stack({ gap: '3', textAlign: 'center' })}>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.02em' })}>One last thing</h1>
        <p className={css({ color: 'muted', maxW: '32rem', mx: 'auto', lineHeight: '1.55' })}>
          Every so often SmartSound will ask a quick, two-tap question about how hard the work felt (a lightweight NASA-TLX check-in). That's how it learns <em>your</em> arousal-to-performance curve instead of assuming an average. It's optional, and it's how the loop gets better the more you use it.
        </p>
      </div>
      <div className={flex({ justify: 'center' })}>
        <Button variant="primary" size="lg" onClick={finish}>Start my first session</Button>
      </div>
    </Shell>
  )
}
