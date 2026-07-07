import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { chipCss, chipActiveCss } from '~/components/Card'
import { Rail } from '~/components/SessionCard'
import { RecordDisc, capText } from '~/components/vinyl/RecordDisc'
import { RecordSleeve } from '~/components/vinyl/RecordSleeve'
import { useClickSound } from '~/lib/click-sound'
import { useGatedPlay } from '~/lib/gated-play'
import { suggestFor } from '~/engine/circadian/model'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import { readRecents } from '~/lib/recents'
import type { TargetState } from '~/engine/audio/types'

/**
 * /app — Today, "Pressed at Night". ONE featured pressing — a large,
 * slowly revolving RecordDisc chosen by time of day (suggestFor) under a
 * caps-label badge ("THIS MORNING'S PRESS · DEEP FOCUS") — and below it a
 * single horizontal shelf of the remaining records as sleeves, filtered by
 * the All/Focus/Calm/Sleep chips. The two Wind-down entries are merged into
 * ONE record whose sleeve offers a 15 min | Open-ended duration selector.
 * Record clicks keep the listen gate: signed-out → onboarding auth intent.
 */
export const Route = createFileRoute('/app/')({
  component: TodayScreen,
})

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function greetingLine(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Let the day go.'
  if (hour < 12) return 'Take a deep breath.'
  if (hour < 18) return 'A moment to settle.'
  return 'Take a deep breath.'
}

function todayCaption(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

/** "THIS MORNING'S PRESS" — the badge's daypart half. */
function pressLabel(hour: number): string {
  if (hour >= 22 || hour < 5) return "TONIGHT'S PRESS"
  if (hour < 12) return "THIS MORNING'S PRESS"
  if (hour < 18) return "THIS AFTERNOON'S PRESS"
  return "THIS EVENING'S PRESS"
}

// ── the record crate — every playable pressing, deduped ────────────────────

type Group = 'focus' | 'calm' | 'sleep'
type Filter = 'all' | Group

interface Pressing {
  id: string
  state: TargetState
  title: string
  /** null = open-ended. */
  minutes: number | null
  group: Group
  /** The merged Wind-down record — carries the 15 min | Open-ended selector. */
  windDown?: boolean
}

const soundscape = (id: string, group: Group, extra?: Partial<Pressing>): Pressing => {
  const s = SOUNDSCAPES.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title, minutes: null, group, ...extra }
}

const scenario = (id: string, group: Group): Pressing => {
  const s = SCENARIOS.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title.split(' · ')[0], minutes: s.minutes, group }
}

/** The full crate. Audit 1.5: the Wind-down soundscape (open-ended) and the
 * Wind-down · 15 scenario are ONE record here — the duration selector on its
 * sleeve routes to the correct play target. */
const PRESSINGS: Pressing[] = [
  soundscape('deep-focus', 'focus'),
  scenario('pomodoro-25', 'focus'),
  scenario('deep-work-50', 'focus'),
  soundscape('open-flow', 'focus'),
  soundscape('still', 'calm'),
  soundscape('wind-down', 'calm', { windDown: true }),
  soundscape('delta-sleep', 'sleep'),
  scenario('sleep-30', 'sleep'),
]

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'focus', label: 'Focus' },
  { id: 'calm', label: 'Calm' },
  { id: 'sleep', label: 'Sleep' },
]

function pressingMeta(p: Pressing): string {
  const duration = p.windDown ? '15 MIN | OPEN' : p.minutes ? `${p.minutes} MIN` : 'OPEN'
  return `${capText(p.state)} · ${duration}`
}

const capsLabelCss = css({
  m: '0',
  fontFamily: 'mono',
  fontSize: '0.75rem',
  fontWeight: '400',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'silver',
})

const fadeUpCss = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

/** 15 min | Open-ended — the merged Wind-down record's duration selector. */
function WindDownSelector({ onPick }: { onPick: (minutes: number | null) => void }) {
  return (
    <div className={css({ display: 'flex', gap: '1.5', mt: '2' })} aria-label="Wind-down duration">
      <button
        type="button"
        onClick={() => onPick(15)}
        className={cx(chipCss, css({ px: '2.5', py: '1', fontSize: '0.6875rem' }))}
      >
        15 min
      </button>
      <button
        type="button"
        onClick={() => onPick(null)}
        className={cx(chipCss, css({ px: '2.5', py: '1', fontSize: '0.6875rem' }))}
      >
        Open-ended
      </button>
    </div>
  )
}

function TodayScreen() {
  const playClick = useClickSound()
  const gatedPlay = useGatedPlay()
  const [filter, setFilter] = useState<Filter>('all')

  const now = new Date()
  const suggestion = suggestFor(now)
  const featured =
    PRESSINGS.find((p) => p.state === suggestion.state && p.minutes === null) ?? PRESSINGS[0]

  const shelf = useMemo(
    () =>
      PRESSINGS.filter(
        (p) => p.id !== featured.id && (filter === 'all' || p.group === filter),
      ),
    [featured.id, filter],
  )

  // Recently played — real history only; renders nothing until a session ran.
  const [recents] = useState<TargetState[]>(() => readRecents())
  const recentPressings = useMemo(
    () =>
      recents
        .map((state) => PRESSINGS.find((p) => p.state === state && p.minutes === null))
        .filter((p): p is Pressing => p != null)
        .filter((p) => p.id !== featured.id),
    [recents, featured.id],
  )

  const play = (p: Pressing, minutes?: number | null) => {
    playClick('primary')
    gatedPlay(p.state, minutes === null ? undefined : minutes ?? p.minutes ?? undefined)
  }

  return (
    <div>
      {/* Wordmark — normal header scale, never clipped. */}
      <p
        className={css({
          m: '0',
          mb: '7',
          textAlign: 'center',
          fontFamily: 'display',
          fontWeight: '400',
          fontSize: 'headingSm',
          letterSpacing: '-0.01em',
          color: 'starlight',
        })}
      >
        SmartSound
      </p>

      {/* Time-based greeting — Instrument Serif 400, huge and airy. */}
      <header className={cx(css({ mb: '9', textAlign: 'center' }), fadeUpCss)}>
        <p className={cx('tabular', capsLabelCss, css({ mb: '2' }))}>{todayCaption()}</p>
        <h1
          className={css({
            m: '0',
            fontFamily: 'display',
            fontWeight: '400',
            fontSize: 'clamp(2.375rem, 7vw, 2.75rem)',
            letterSpacing: '-0.015em',
            lineHeight: '1.08',
            color: 'starlight',
          })}
        >
          {greeting()}
        </h1>
        {/* The poetic register — Instrument Serif italic. */}
        <p
          className={css({
            m: '0',
            mt: '2',
            fontFamily: 'display',
            fontStyle: 'italic',
            fontWeight: '400',
            fontSize: '1.125rem',
            letterSpacing: '0.01em',
            color: 'silver',
          })}
        >
          {greetingLine()}
        </p>
      </header>

      {/* Today's Pressing — ONE featured record, large, slowly revolving. */}
      <section className={cx(css({ mb: '12', textAlign: 'center' }), fadeUpCss)}>
        <p className={cx(capsLabelCss, css({ mb: '6' }))}>
          {pressLabel(now.getHours())} · {featured.title.toUpperCase()}
        </p>
        <button
          type="button"
          onClick={() => play(featured, null)}
          aria-label={`Play ${featured.title} — ${pressingMeta(featured)}`}
          className={css({
            display: 'inline-block',
            p: '0',
            m: '0',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 'full',
            WebkitTapHighlightColor: 'transparent',
            transition: 'filter 300ms ease',
            _hover: { filter: 'brightness(1.12)' },
            _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '6px' },
          })}
        >
          <RecordDisc state={featured.state} size={272} spinning="idle" />
        </button>
        <h2
          className={css({
            m: '0',
            mt: '6',
            fontFamily: 'display',
            fontWeight: '400',
            fontSize: '1.875rem',
            letterSpacing: '-0.01em',
            lineHeight: '1.1',
            color: 'starlight',
          })}
        >
          {featured.title}
        </h2>
        <p className={cx('tabular', capsLabelCss, css({ mt: '1.5' }))}>{capText(featured.state)}</p>
        {featured.windDown && (
          <div className={css({ display: 'flex', justifyContent: 'center' })}>
            <WindDownSelector onPick={(m) => play(featured, m)} />
          </div>
        )}
      </section>

      {/* The shelf — every other record, one horizontal row of sleeves. */}
      <section className={fadeUpCss} style={{ animationDelay: '120ms' }}>
        <div
          className={css({
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '3',
            mb: '4',
          })}
        >
          {/* Small section heading — Hanken 600, not the serif (crispness rule). */}
          <h2
            className={css({
              m: '0',
              fontWeight: '600',
              fontSize: '1.0625rem',
              letterSpacing: '-0.01em',
              color: 'starlight',
            })}
          >
            The shelf
          </h2>
        </div>

        <div role="tablist" aria-label="Filter the shelf" className={css({ display: 'flex', gap: '2', mb: '5', flexWrap: 'wrap' })}>
          {FILTERS.map((f) => {
            const active = f.id === filter
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  playClick('tap')
                  setFilter(f.id)
                }}
                className={cx(chipCss, active && chipActiveCss)}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <Rail>
          {shelf.map((p) => (
            <RecordSleeve
              key={p.id}
              state={p.state}
              title={p.title}
              meta={pressingMeta(p)}
              onClick={() => play(p)}
              className={css({ width: '168px', flexShrink: '0' })}
            >
              {p.windDown && <WindDownSelector onPick={(m) => play(p, m)} />}
            </RecordSleeve>
          ))}
        </Rail>
      </section>

      {/* Recently played — honest local history only. Rendered as quiet
          chips (not sleeves) so no record ever appears on the page twice. */}
      {recentPressings.length > 0 && (
        <section className={cx(css({ mt: '10' }), fadeUpCss)} style={{ animationDelay: '200ms' }}>
          <h2
            className={css({
              m: '0',
              mb: '3',
              fontWeight: '600',
              fontSize: '1.0625rem',
              letterSpacing: '-0.01em',
              color: 'starlight',
            })}
          >
            Recently played
          </h2>
          <div className={css({ display: 'flex', gap: '2', flexWrap: 'wrap' })}>
            {recentPressings.map((p) => (
              <button
                key={`recent-${p.id}`}
                type="button"
                onClick={() => play(p)}
                className={chipCss}
                aria-label={`Play ${p.title} again`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
