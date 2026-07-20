import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { chipCss, chipActiveCss, glassCss } from '~/components/Card'
import { RecordDisc, STATE_BAND, BAND_TINT } from '~/components/vinyl/RecordDisc'
import { WaveformRing } from '~/design/WaveformRing'
import { useClickSound } from '~/lib/click-sound'
import { useEngine } from '~/lib/engine-context'
import { TARGET_STATES } from '~/engine/audio/profiles'
import { StudioDirector, SCORE_TITLES } from '~/engine/audio/score'
import { AtmosMixer, ATMOS } from '~/engine/audio/atmos'
import type { TargetState } from '~/engine/audio/types'

/**
 * The Studio — the pressed-studio experience folded into SmartSound.
 * A live score layer (public-domain classical, synthesized note by note
 * on the engine's new piano voice) and Serene's nine atmospheres, all
 * driven through the same SoundscapeEngine and analyser. Everything that
 * moves on this page is real state: the ring ripples at the band rate,
 * each spark is one scheduled note, the pulse strip is the actual
 * modulation envelope, and the tonearm only rests on a spinning record.
 */
export const Route = createFileRoute('/app/studio')({
  component: StudioScreen,
})

const DISC_SIZE = 216
const RING_SIZE = 330

// ── deck overlays ───────────────────────────────────────────────────────────

/** One spark per scheduled piano note, placed by pitch, fading ~1.6s. */
function SparkCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { getEngine } = useEngine()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const g = canvas.getContext('2d')
    if (!g) return
    canvas.width = size
    canvas.height = size
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      g.clearRect(0, 0, size, size)
      const engine = getEngine()
      const ac = engine.context
      if (!ac || !engine.isRunning) return
      const now = ac.currentTime
      const flashes = engine.noteFlashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const n = flashes[i]
        const age = now - n.t
        if (age > 1.6) { flashes.splice(i, 1); continue }
        if (age < 0) continue
        const k = age / 1.6
        const a = ((n.midi - 30) / 60) * Math.PI * 2 - Math.PI / 2
        const r = size * 0.355 + k * size * 0.14
        g.globalAlpha = (1 - k) * Math.min(1, n.vel * 5)
        g.fillStyle = '#ededf3'
        g.beginPath()
        g.arc(size / 2 + Math.cos(a) * r, size / 2 + Math.sin(a) * r, 2 + n.vel * 7 * (1 - k), 0, Math.PI * 2)
        g.fill()
      }
      g.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [getEngine, size])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
      style={{ width: size, height: size }}
    />
  )
}

/** The tonearm rests off the platter and swings in while the engine runs. */
function Tonearm({ running }: { running: boolean }) {
  return (
    <div
      aria-hidden
      className={css({
        position: 'absolute',
        top: '-2%',
        right: '4%',
        width: '12px',
        height: '46%',
        zIndex: '3',
        pointerEvents: 'none',
        transformOrigin: '6px 8px',
        transition: 'transform 1200ms cubic-bezier(0.19, 1, 0.22, 1)',
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      })}
      style={{ transform: `rotate(${running ? 4 : -30}deg)` }}
    >
      <div
        className={css({
          position: 'absolute', top: '0', left: '0',
          width: '12px', height: '12px', borderRadius: 'full',
          background: 'starlight', opacity: '0.92',
        })}
      />
      <div
        className={css({
          position: 'absolute', top: '10px', left: '5px',
          width: '2px', height: 'calc(100% - 10px)',
          background: 'linear-gradient(#ededf3, #70707d)',
        })}
      />
      <div
        className={css({
          position: 'absolute', bottom: '-8px', left: '-1px',
          width: '8px', height: '18px', borderRadius: '2px',
          background: 'mercuryBlue',
        })}
      />
    </div>
  )
}

/** The actual modulation envelope — real rate, real depth, band-tinted. */
function PulseStrip({ state }: { state: TargetState }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { getEngine } = useEngine()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const g = canvas.getContext('2d')
    if (!g) return
    const PW = 300, PH = 44
    canvas.width = PW
    canvas.height = PH
    let raf = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      g.clearRect(0, 0, PW, PH)
      const engine = getEngine()
      const params = engine.currentParams
      const mid = PH / 2
      const tint = BAND_TINT[STATE_BAND[stateRef.current]]
      if (engine.isRunning) {
        g.strokeStyle = tint
        g.globalAlpha = 0.95
        g.lineWidth = 1.6
        g.beginPath()
        for (let x = 0; x <= PW; x++) {
          const tt = t / 1000 - (1 - x / PW)
          const y = mid - Math.sin(tt * params.entrainmentHz * Math.PI * 2) * params.neuralDepth * (PH * 0.42)
          if (x === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.stroke()
      } else {
        g.strokeStyle = '#70707d'
        g.globalAlpha = 0.5
        g.lineWidth = 1
        g.setLineDash([3, 5])
        g.beginPath()
        g.moveTo(0, mid)
        g.lineTo(PW, mid)
        g.stroke()
        g.setLineDash([])
      }
      g.globalAlpha = 0.95
      g.fillStyle = engine.isRunning ? '#ededf3' : '#70707d'
      g.font = '9px ui-monospace, SFMono-Regular, Menlo, monospace'
      g.fillText(`${params.entrainmentHz.toFixed(1)} Hz`, 5, 11)
      g.globalAlpha = 1
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [getEngine])

  return (
    <canvas
      ref={ref}
      aria-label="Live modulation envelope — real rate and depth"
      className={css({
        width: '100%',
        maxW: '300px',
        height: '44px',
        borderRadius: '10px',
        background: 'rgba(23, 23, 33, 0.6)',
        border: '0.5px solid',
        borderColor: 'frost.stroke',
      })}
    />
  )
}

/** Three tiny bars that only animate while the layer is audible. */
function EqBars({ tint }: { tint: string }) {
  return (
    <span
      aria-hidden
      className={css({ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '12px' })}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={css({
            display: 'block',
            width: '3px',
            height: '12px',
            borderRadius: '2px',
            transformOrigin: 'bottom',
            animation: `studioEq ${1.1 + i * 0.22}s ease-in-out infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'scaleY(0.6)' },
          })}
          style={{ background: tint }}
        />
      ))}
    </span>
  )
}

// ── the screen ──────────────────────────────────────────────────────────────

function StudioScreen() {
  const playClick = useClickSound()
  const { status, profile, start, stop, selectState, getEngine } = useEngine()
  const running = status === 'running'
  const state = profile.key

  const directorRef = useRef<StudioDirector | null>(null)
  if (!directorRef.current) directorRef.current = new StudioDirector(getEngine())
  const director = directorRef.current

  const mixerRef = useRef<AtmosMixer | null>(null)
  if (!mixerRef.current) mixerRef.current = new AtmosMixer(getEngine())
  const mixer = mixerRef.current

  const [scoreOn, setScoreOn] = useState(true)
  const [scoreVol, setScoreVol] = useState(0.9)
  const [scoreLine, setScoreLine] = useState('Score · idle')
  const [, bump] = useState(0) // re-render after mixer toggles

  useEffect(() => {
    const id = window.setInterval(() => setScoreLine(director.scoreText()), 500)
    return () => window.clearInterval(id)
  }, [director])

  // Leaving the page keeps the session but parks the score scheduler.
  useEffect(() => () => director.stop(false), [director])

  async function playPause() {
    playClick('tap')
    if (running) {
      director.stop(false)
      mixer.onEngineStopped()
      await stop()
      return
    }
    await start(state)
    const engine = getEngine()
    engine.setMusicLevel(scoreOn ? scoreVol : 0.0001)
    if (scoreOn) {
      director.setMode(state)
      director.start()
    }
    mixer.sync()
  }

  function pickState(next: TargetState) {
    playClick('tap')
    selectState(next)
    if (director.isRunning) director.setMode(next)
  }

  function toggleScore() {
    playClick('tap')
    const engine = getEngine()
    const next = !scoreOn
    setScoreOn(next)
    if (!running) return
    if (next) {
      engine.setMusicLevel(scoreVol)
      director.setMode(state)
      director.start()
    } else {
      director.stop()
      engine.setMusicLevel(0.0001)
    }
  }

  function changeScoreVol(v: number) {
    setScoreVol(v)
    if (scoreOn) getEngine().setMusicLevel(v)
  }

  function toggleAtmo(id: string) {
    playClick('tap')
    void (async () => {
      if (!running && !mixer.isOn(id)) {
        // an atmosphere is a session — starting one starts the engine
        await start(state)
        getEngine().setMusicLevel(scoreOn ? scoreVol : 0.0001)
        if (scoreOn) {
          director.setMode(state)
          director.start()
        }
        mixer.sync()
      }
      mixer.toggle(id)
      bump((n) => n + 1)
    })()
  }

  const tint = BAND_TINT[STATE_BAND[state]]

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', gap: '7' })}>
      {/* the one page-level keyframe this screen needs */}
      <style>{`@keyframes studioEq { 0%,100% { transform: scaleY(0.3); } 30% { transform: scaleY(1); } 60% { transform: scaleY(0.5); } 80% { transform: scaleY(0.85); } }`}</style>

      <header>
        <h1
          className={css({
            fontFamily: 'display',
            fontSize: '38px',
            lineHeight: '1.1',
            color: 'starlight',
          })}
        >
          The Studio
        </h1>
        <p className={css({ mt: '2', color: 'secondaryLabel', fontSize: '15px', maxW: '46ch' })}>
          The whole engine, playing real music — a public-domain score synthesized
          note by note over your pressing, with Serene's atmospheres on the same
          bus. No samples, nothing faked.
        </p>
      </header>

      {/* ── deck ── */}
      <section
        className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5' })}
      >
        <div
          className={css({ position: 'relative', display: 'grid', placeItems: 'center' })}
          style={{ width: RING_SIZE, height: RING_SIZE }}
        >
          {/* every deck layer shares the single grid cell — they stack, never flow */}
          <div style={{ gridArea: '1 / 1', display: 'grid', placeItems: 'center' }}>
            <WaveformRing state={state} size={RING_SIZE} discSize={DISC_SIZE} running={running} />
          </div>
          <SparkCanvas size={RING_SIZE} />
          <button
            onClick={() => void playPause()}
            aria-label={running ? 'Pause the session' : 'Start the session'}
            style={{ width: DISC_SIZE, height: DISC_SIZE, gridArea: '1 / 1' }}
            className={css({
              position: 'relative',
              display: 'block',
              borderRadius: 'full',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              p: '0',
              WebkitTapHighlightColor: 'transparent',
              transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              _active: { transform: 'scale(0.97)' },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
            })}
          >
            <RecordDisc state={state} size={DISC_SIZE} spinning={running ? 'playing' : 'idle'} plain />
          </button>
          <Tonearm running={running} />
        </div>

        <p
          className={css({ fontSize: '13px', letterSpacing: '0.05em', color: 'tertiaryLabel', textTransform: 'uppercase' })}
        >
          {running ? 'Playing' : 'Tap the record'} · {SCORE_TITLES[state]}
        </p>

        {/* pressing chips */}
        <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '2', justifyContent: 'center' })}>
          {TARGET_STATES.map((p) => (
            <button
              key={p.key}
              className={cx(chipCss, state === p.key && chipActiveCss)}
              aria-pressed={state === p.key}
              onClick={() => pickState(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── the score ── */}
      <section className={cx(glassCss, css({ borderRadius: '20px', p: '5', display: 'flex', flexDirection: 'column', gap: '4' }))}>
        <div className={css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between' })}>
          <div>
            <h2 className={css({ fontSize: '17px', fontWeight: '600', color: 'starlight' })}>The score</h2>
            <p className={css({ fontSize: '13px', color: 'secondaryLabel', mt: '1' })}>
              Bach · Pachelbel · Satie · one nocturne — performed live, never modulated.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={scoreOn}
            onClick={toggleScore}
            className={css({
              position: 'relative',
              width: '46px',
              height: '28px',
              borderRadius: 'pill',
              border: '0.5px solid',
              borderColor: 'frost.stroke',
              background: scoreOn ? 'mercuryBlue' : 'graphite',
              transition: 'background 300ms ease',
              cursor: 'pointer',
              flexShrink: '0',
            })}
          >
            <span
              aria-hidden
              className={css({
                position: 'absolute',
                top: '2px',
                width: '22px',
                height: '22px',
                borderRadius: 'full',
                background: 'starlight',
                transition: 'left 300ms cubic-bezier(0.19, 1, 0.22, 1)',
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              })}
              style={{ left: scoreOn ? 20 : 2 }}
            />
          </button>
        </div>

        <PulseStrip state={state} />

        <label className={css({ display: 'flex', alignItems: 'center', gap: '3', fontSize: '13px', color: 'secondaryLabel' })}>
          Score level
          <input
            type="range"
            min={0}
            max={1.3}
            step={0.01}
            value={scoreVol}
            onChange={(e) => changeScoreVol(Number(e.target.value))}
            disabled={!scoreOn}
            className={css({ flex: '1', height: '4px', cursor: 'pointer' })}
            style={{ accentColor: tint }}
            aria-label="Score volume"
          />
        </label>

        <p className={css({ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12.5px', color: running && scoreOn ? 'starlight' : 'tertiaryLabel' })}>
          {scoreLine}
        </p>
      </section>

      {/* ── atmospheres ── */}
      <section className={cx(glassCss, css({ borderRadius: '20px', p: '5', display: 'flex', flexDirection: 'column', gap: '4' }))}>
        <div>
          <h2 className={css({ fontSize: '17px', fontWeight: '600', color: 'starlight' })}>Atmospheres</h2>
          <p className={css({ fontSize: '13px', color: 'secondaryLabel', mt: '1' })}>
            Serene's nine synthesized layers — mix any of them over the pressing.
          </p>
        </div>
        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '2',
          })}
        >
          {ATMOS.map((a) => {
            const on = mixer.isOn(a.id)
            return (
              <div
                key={a.id}
                className={css({
                  borderRadius: '14px',
                  background: on ? 'graphite' : 'rgba(39, 39, 53, 0.45)',
                  border: '0.5px solid',
                  borderColor: on ? 'lead' : 'transparent',
                  transition: 'background 300ms ease, border-color 300ms ease',
                  p: '3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2',
                })}
              >
                <button
                  onClick={() => toggleAtmo(a.id)}
                  aria-pressed={on}
                  className={css({
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    p: '0',
                    WebkitTapHighlightColor: 'transparent',
                  })}
                >
                  <span className={css({ display: 'flex', alignItems: 'center', gap: '2', fontSize: '14.5px', fontWeight: '500', color: on ? 'starlight' : 'silver' })}>
                    {a.name}
                    {on && running && <EqBars tint={tint} />}
                  </span>
                  <span className={css({ display: 'block', fontSize: '12px', color: 'tertiaryLabel', mt: '0.5' })}>
                    {a.desc}
                  </span>
                </button>
                {on && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={mixer.vols[a.id]}
                    onChange={(e) => mixer.setVol(a.id, Number(e.target.value))}
                    className={css({ width: '100%', height: '4px', cursor: 'pointer' })}
                    style={{ accentColor: tint }}
                    aria-label={`${a.name} volume`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      <p className={css({ fontSize: '12px', color: 'quaternaryLabel', maxW: '52ch' })}>
        Scores are public domain (Bach 1722 · Pachelbel c. 1680 · Satie 1888 · one
        original nocturne); every note and every atmosphere is synthesized in your
        browser. Band-rate modulation touches only the beds, never the music. No
        clinical claims — this is a listening experience, not a treatment.
      </p>
    </div>
  )
}
