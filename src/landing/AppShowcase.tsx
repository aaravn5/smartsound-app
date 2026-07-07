import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'

/**
 * AppShowcase — "inside the app" panels for the landing.
 *
 * Three static, hand-drawn miniatures of the real UI — the progress rings,
 * the glass player, and the native tab bar — each staged on a scene-dark
 * device slab so visitors see the actual product idiom before onboarding.
 * Pure CSS/SVG, no live engine: these are honest illustrations of screens the
 * app really has, not screenshots pretending to be interactive.
 */

const RING_BLUE = '#2fd4c4'
const RING_GREEN = '#63e8da'
const RING_YELLOW = '#fad1ff'

const slab = css({
  position: 'relative',
  borderRadius: '24px',
  overflow: 'hidden',
  height: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.09)',
  background:
    'radial-gradient(120% 90% at 20% 0%, rgba(0, 130, 124, 0.35) 0%, transparent 55%), radial-gradient(110% 80% at 85% 100%, rgba(250, 209, 255, 0.10) 0%, transparent 60%), linear-gradient(to bottom, #01302d, #011d1c)',
})

function Arc({
  r,
  color,
  frac,
  track,
}: {
  r: number
  color: string
  frac: number
  track?: boolean
}) {
  const C = 2 * Math.PI * r
  return (
    <circle
      cx="90"
      cy="90"
      r={r}
      fill="none"
      stroke={color}
      strokeWidth="13"
      strokeLinecap="round"
      strokeDasharray={track ? undefined : `${C * frac} ${C}`}
      opacity={track ? 0.16 : 1}
      transform="rotate(-90 90 90)"
    />
  )
}

/** Progress rings — Attune / Minutes / Streak. */
function RingsMock() {
  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '7' })}>
      <svg width="180" height="180" viewBox="0 0 180 180" aria-hidden>
        <Arc r={74} color={RING_BLUE} frac={1} track />
        <Arc r={74} color={RING_BLUE} frac={0.78} />
        <Arc r={56} color={RING_GREEN} frac={1} track />
        <Arc r={56} color={RING_GREEN} frac={0.62} />
        <Arc r={38} color={RING_YELLOW} frac={1} track />
        <Arc r={38} color={RING_YELLOW} frac={0.45} />
      </svg>
      <div className={css({ display: 'flex', flexDirection: 'column', gap: '3' })}>
        {(
          [
            ['Attune', '78%', RING_BLUE],
            ['Minutes', '24 / 40', RING_GREEN],
            ['Streak', '5 days', RING_YELLOW],
          ] as const
        ).map(([label, value, color]) => (
          <div key={label} className={css({ display: 'flex', alignItems: 'center', gap: '2.5' })}>
            <span
              aria-hidden
              className={css({ w: '10px', h: '10px', borderRadius: 'full', flexShrink: '0' })}
              style={{ background: color }}
            />
            <div>
              <p
                className={css({
                  m: '0',
                  fontSize: 'caption',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ss-ink-soft)',
                })}
              >
                {label}
              </p>
              <p className={css({ m: '0', fontSize: 'headline', fontWeight: '700', color: 'text' })}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The glass player — now-playing card over the scene. */
function PlayerMock() {
  return (
    <LiquidGlass
      variant="card"
      staticSheen
      className={css({ w: '82%', maxW: '340px', p: '5' })}
    >
      <div className={css({ display: 'flex', alignItems: 'center', gap: '4' })}>
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
          <circle cx="36" cy="36" r="31" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="3" />
          <circle
            cx="36"
            cy="36"
            r="31"
            fill="none"
            stroke={RING_BLUE}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="136 195"
            transform="rotate(-90 36 36)"
          />
          <polygon points="30,25 51,36 30,47" fill="white" opacity="0.92" />
        </svg>
        <div>
          <p
            className={css({
              m: '0',
              fontSize: 'caption',
              fontWeight: '600',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ss-ink-soft)',
            })}
          >
            Calm · attuned
          </p>
          <p className={css({ m: '0', mt: '1', fontSize: 'headline', fontWeight: '700', color: 'text' })}>
            Evening wind-down
          </p>
          <p className={css({ m: '0', mt: '1', fontSize: 'footnote', color: 'var(--ss-ink-body)' })}>
            62 bpm · steady
          </p>
        </div>
      </div>
      <div
        aria-hidden
        className={css({ mt: '4', h: '4px', borderRadius: 'full', bg: 'rgba(255,255,255,0.12)' })}
      >
        <div
          className={css({ h: '100%', w: '38%', borderRadius: 'full' })}
          style={{ background: `linear-gradient(to right, ${RING_BLUE}, ${RING_GREEN})` }}
        />
      </div>
      <div className={css({ mt: '3', display: 'flex', gap: '2' })}>
        {['15 min', '30 min', '45 min'].map((chip, i) => (
          <span
            key={chip}
            className={css({
              px: '3',
              py: '1',
              borderRadius: 'capsule',
              fontSize: 'caption',
              fontWeight: '600',
              color: i === 1 ? 'text' : 'var(--ss-ink-soft)',
              bg: i === 1 ? 'rgba(0, 130, 124, 0.4)' : 'rgba(255,255,255,0.07)',
              border: '1px solid',
              borderColor: i === 1 ? 'rgba(47, 212, 196, 0.5)' : 'rgba(255,255,255,0.10)',
            })}
          >
            {chip}
          </span>
        ))}
      </div>
    </LiquidGlass>
  )
}

/** The five-tab Liquid Glass tab bar. */
function TabBarMock() {
  const tabs = ['Today', 'Explore', 'Player', 'Progress', 'Profile'] as const
  return (
    <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6' })}>
      <p
        className={css({
          m: '0',
          fontFamily: 'display',
          fontSize: 'title3',
          fontWeight: '700',
          color: 'text',
        })}
      >
        Good evening
      </p>
      <LiquidGlass variant="bar" staticSheen className={css({ px: '3', py: '2.5' })}>
        <div className={css({ display: 'flex', gap: '1' })}>
          {tabs.map((t, i) => (
            <span
              key={t}
              className={css({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5',
                px: '3.5',
                py: '1.5',
                borderRadius: 'capsule',
              })}
              style={i === 0 ? { background: 'rgba(74,168,255,0.18)' } : undefined}
            >
              <span
                aria-hidden
                className={css({ w: '14px', h: '14px', borderRadius: 'full' })}
                style={{
                  background:
                    i === 0
                      ? RING_BLUE
                      : i === 2
                        ? `linear-gradient(135deg, ${RING_BLUE}, ${RING_GREEN})`
                        : 'rgba(255,255,255,0.28)',
                }}
              />
              <span
                className={css({
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.02em',
                  color: 'var(--ss-ink-body)',
                })}
              >
                {t}
              </span>
            </span>
          ))}
        </div>
      </LiquidGlass>
    </div>
  )
}

const PANELS = [
  {
    id: 'rings',
    mock: <RingsMock />,
    title: 'Rings that close, honestly',
    body: 'Progress rings for Attune, Minutes and Streak — filled only by what the engine actually measured in your sessions, with a close animation when you make it.',
  },
  {
    id: 'player',
    mock: <PlayerMock />,
    title: 'A player made of glass',
    body: 'The immersive now-playing screen floats a Liquid Glass transport over the living scene — biofeedback ring around play, honest bpm readout, session-length chips.',
  },
  {
    id: 'tabs',
    mock: <TabBarMock />,
    title: 'Five tabs, native to the bone',
    body: 'Today, Explore, Player, Progress, Profile — a floating Liquid Glass tab bar, system type, grouped settings, and scene-dark surfaces exactly as the platform schematics draw them.',
  },
]

export function AppShowcase({ className }: { className?: string }) {
  return (
    <div className={cx(css({ display: 'grid', gap: '8', md: { gridTemplateColumns: 'repeat(3, 1fr)', gap: '6' } }), className)}>
      {PANELS.map((p) => (
        <div key={p.id}>
          <div className={slab}>{p.mock}</div>
          <h3
            className={css({
              m: '0',
              mt: '5',
              fontFamily: 'display',
              fontSize: 'title3',
              fontWeight: '700',
              letterSpacing: '-0.01em',
              color: 'text',
            })}
          >
            {p.title}
          </h3>
          <p
            className={css({
              m: '0',
              mt: '2',
              fontSize: 'subhead',
              lineHeight: '1.6',
              color: 'var(--ss-ink-body)',
            })}
          >
            {p.body}
          </p>
        </div>
      ))}
    </div>
  )
}
