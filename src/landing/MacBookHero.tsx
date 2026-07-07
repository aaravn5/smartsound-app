import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { RecordDisc, STATE_BAND, BAND_TINT } from '~/components/vinyl/RecordDisc'
import { BAND_LABEL } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * MacBookHero — the hyperrealistic CSS/DOM MacBook Pro the landing scroll
 * dives into. All material fidelity lives in macbook.css (layer stack:
 * contact shadow → glow spill → aluminum lid → bezel → glass → hinge →
 * 3D-foreshortened deck with a per-cap Magic Keyboard → front lip).
 *
 * This component is pure structure plus the live on-screen SmartSound
 * mini-home (wordmark, greeting, the featured RecordDisc, the press line) —
 * so at full zoom the viewport is filled by the actual app world, and the
 * Act III pressings fade in over it seamlessly.
 *
 * Runtime choreography stays OUTSIDE React: the parent's rAF writes the
 * scroll transform / transform-origin / chrome opacity straight onto the
 * DOM via `rootRef`, `screenRef` and the `[data-mac-chrome]` elements
 * (aluminum + shadow fade near full zoom so edges dissolve instead of
 * hard-clipping; the glass and its UI never fade).
 *
 * `reduced` renders the machine at rest in normal flow — no transform, no
 * spin (the global reduced-motion rule freezes .record-spin-idle).
 */

type KeySpec = number | { w: number; k: 'tid' | 'arrows' }

/** Magic Keyboard, 14″ layout — flex-grow units per cap (basis 0). */
const KB_ROWS: KeySpec[][] = [
  // esc · F1–F12 · Touch ID (half-height row)
  [1.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, { w: 1.4, k: 'tid' }],
  // ` 1–0 - = delete
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  // tab QWERTYUIOP [ ] \
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // caps ASDFGHJKL ; ' return
  [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8],
  // shift ZXCVBNM , . / shift
  [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3],
  // fn ctrl opt cmd ─ space ─ cmd opt ▪ arrows
  [1, 1, 1, 1.25, 5.9, 1.25, 1, { w: 3.1, k: 'arrows' }],
]

function Keyboard() {
  return (
    <div className="mac-kb">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className={ri === 0 ? 'mac-krow mac-krow--fn' : 'mac-krow'}>
          {row.map((spec, ki) => {
            const s = typeof spec === 'number' ? { w: spec, k: undefined } : spec
            if (s.k === 'arrows') {
              return (
                <span key={ki} className="mac-arrows" style={{ flexGrow: s.w }}>
                  <span className="mac-key mac-key--half" />
                  <span className="mac-arrcol">
                    <span className="mac-key mac-key--half" />
                    <span className="mac-key mac-key--half" />
                  </span>
                  <span className="mac-key mac-key--half" />
                </span>
              )
            }
            return (
              <span
                key={ki}
                className={s.k === 'tid' ? 'mac-key mac-key--tid' : 'mac-key'}
                style={{ flexGrow: s.w }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export interface MacBookHeroProps {
  /** Circadian suggestion — picks the featured record + glow tint. */
  state: TargetState
  /** Static, normal-flow, frozen composition (prefers-reduced-motion). */
  reduced?: boolean
  /** The scroll rAF's handle on the whole machine (transform target). */
  rootRef?: MutableRefObject<HTMLDivElement | null>
  /** The glass — measured for the fill-the-viewport scale + origin. */
  screenRef?: MutableRefObject<HTMLDivElement | null>
}

export function MacBookHero({ state, reduced, rootRef, screenRef }: MacBookHeroProps) {
  const innerScreenRef = useRef<HTMLDivElement | null>(null)
  const [discSize, setDiscSize] = useState(0)

  // The featured disc must be a *pixel* size (RecordDisc contract), so track
  // the glass's layout width — resize-only, never per-frame.
  useEffect(() => {
    const el = innerScreenRef.current
    if (!el) return
    const measure = () => {
      const w = el.offsetWidth
      if (w > 0) setDiscSize(Math.max(56, Math.round(w * 0.32)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 || hour >= 18 ? 'Good evening' : hour < 12 ? 'Good morning' : 'Good afternoon'
  const pressWord = hour >= 17 || hour < 5 ? 'TONIGHT’S PRESS' : 'TODAY’S PRESS'
  const capLine = `${pressWord} · ${BAND_LABEL[state].toUpperCase()}`
  const tint = BAND_TINT[STATE_BAND[state]]

  // Band-tinted light spill — computed color, so inline style (Panda no-op).
  const glowStyle = useMemo(
    () => ({
      background: `radial-gradient(closest-side, ${tint}14 0%, ${tint}09 45%, transparent 72%)`,
    }),
    [tint],
  )

  return (
    <div
      ref={(el) => {
        if (rootRef) rootRef.current = el
      }}
      aria-hidden
      data-macbook
      className={reduced ? 'mac-root mac-root--static' : 'mac-root'}
    >
      {/* desk contact shadow + screen-light spill (behind the machine) */}
      <span className="mac-shadow" data-mac-chrome />
      <span className="mac-glow" data-mac-chrome style={glowStyle} />

      {/* display assembly */}
      <div className="mac-lid">
        <span className="mac-lid-alu" data-mac-chrome />
        <span className="mac-bezel" data-mac-chrome />
        <div
          ref={(el) => {
            innerScreenRef.current = el
            if (screenRef) screenRef.current = el
          }}
          className="mac-screen"
        >
          {/* the live SmartSound mini-home — what the zoom lands inside.
              [data-mac-uifade] elements hand off to Act III (the pressings
              fade in over the screen; the record + aurora stay as the
              continuous vinyl-world backdrop). */}
          <div className="mac-ui">
            <div className="mac-ui-word" data-mac-uifade>
              SmartSound
            </div>
            <div className="mac-ui-greet" data-mac-uifade>
              {greeting} — your press is cut and ready.
            </div>
            {discSize > 0 && (
              <RecordDisc state={state} size={discSize} spinning={reduced ? 'none' : 'idle'} />
            )}
            <div className="mac-ui-cap" data-mac-uifade>
              {capLine}
            </div>
            <div className="mac-ui-pill" data-mac-uifade>
              Start listening
            </div>
          </div>
          <span className="mac-screen-refl" />
          <span className="mac-screen-vig" />
        </div>
        <span className="mac-notch" data-mac-chrome />
      </div>

      {/* hinge slot */}
      <div className="mac-hinge" data-mac-chrome />

      {/* deck — perspective-foreshortened body */}
      <div className="mac-deck" data-mac-chrome>
        <span className="mac-kbwell" />
        <Keyboard />
        <span className="mac-kbshade" />
        <span className="mac-speaker mac-speaker--l" />
        <span className="mac-speaker mac-speaker--r" />
        <span className="mac-trackpad" />
      </div>

      {/* front lip + smile */}
      <div className="mac-edge" data-mac-chrome />
    </div>
  )
}
