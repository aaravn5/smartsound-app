import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { Rail } from '~/components/SessionCard'
import { capText } from '~/components/vinyl/RecordDisc'
import { RecordSleeve } from '~/components/vinyl/RecordSleeve'
import { chipCss } from '~/components/Card'
import { useClickSound } from '~/lib/click-sound'
import { useGatedPlay } from '~/lib/gated-play'
import { useTypewriterPlaceholder } from '~/lib/typewriter'
import { suggestedBlockMinutes } from '~/engine/circadian/model'
import { SCENARIOS, SOUNDSCAPES } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * The Library — crate-digging, not SaaS cards. Each category is a labeled
 * crate: a horizontal row of RecordSleeves you flip through, a Fraunces
 * crate header with its one-line science blurb. Every sleeve carries title,
 * band + Hz, duration, and a tiny etched waveform of its band frequency.
 * Search stays on top; its typewriter placeholder pauses while the field is
 * focused and keeps its phase in a ref so re-renders never reset it mid-word.
 */
export const Route = createFileRoute('/app/explore')({
  component: LibraryScreen,
})

interface CrateItem {
  id: string
  title: string
  state: TargetState
  /** null = open-ended. */
  minutes: number | null
  /** The merged Wind-down record — 15 min | Open-ended selector. */
  windDown?: boolean
  keywords: string
}

const baseTitle = (title: string) => title.split(' · ')[0]

function fromScenario(id: string): CrateItem {
  const s = SCENARIOS.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return {
    id: s.id,
    title: baseTitle(s.title),
    state: s.state,
    minutes: s.minutes,
    keywords: `${s.title} ${s.state} ${s.band}`.toLowerCase(),
  }
}

function fromSoundscape(id: string, extra?: Partial<CrateItem>): CrateItem {
  const s = SOUNDSCAPES.find((x) => x.id === id)
  if (!s) throw new Error(`Unknown soundscape: ${id}`)
  return {
    id: s.id,
    title: s.title,
    state: s.state,
    minutes: null,
    keywords: `${s.title} ${s.state} ${s.band}`.toLowerCase(),
    ...extra,
  }
}

function meditation(title: string, state: TargetState): CrateItem {
  const minutes = suggestedBlockMinutes(state)
  return {
    id: `meditate-${state}`,
    title,
    state,
    minutes,
    keywords: `${title} ${state} meditate meditation`.toLowerCase(),
  }
}

interface Crate {
  id: string
  title: string
  blurb: string
  items: CrateItem[]
}

/** The crates. Wind-down exists ONCE in the whole library (audit 1.5) — in
 * the Sleep crate, merged, with its duration selector. */
const CRATES: Crate[] = [
  {
    id: 'focus',
    title: 'Focus',
    blurb: 'Beta and alpha-beta modulation for single-thread work',
    items: [
      fromSoundscape('deep-focus'),
      fromSoundscape('open-flow'),
      fromScenario('pomodoro-25'),
      fromScenario('deep-work-50'),
    ],
  },
  {
    id: 'relax',
    title: 'Relax',
    blurb: 'Alpha-paced, unhurried — for a settled mind',
    items: [fromSoundscape('still')],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    blurb: 'Descending toward delta-modulated noise',
    items: [
      fromSoundscape('wind-down', { windDown: true }),
      fromScenario('sleep-30'),
      fromSoundscape('delta-sleep'),
    ],
  },
  {
    id: 'meditate',
    title: 'Meditate',
    blurb: 'A short breath, a short settle',
    items: [meditation('Breathe', 'calm'), meditation('Settle', 'winddown')],
  },
  {
    id: 'soundscapes',
    title: 'Soundscapes',
    blurb: 'The states, endless and open',
    items: [
      fromSoundscape('deep-focus'),
      fromSoundscape('open-flow'),
      fromSoundscape('still'),
      fromSoundscape('delta-sleep'),
    ],
  },
]

function itemMeta(item: CrateItem): string {
  const duration = item.windDown ? '15 MIN | OPEN' : item.minutes ? `${item.minutes} MIN` : 'OPEN-ENDED'
  return `${capText(item.state)} · ${duration}`
}

const SearchIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="10.8" cy="10.8" r="6.8" />
    <path d="M20 20l-4.6-4.6" />
  </svg>
)

const crateTitleCss = css({
  m: '0',
  fontFamily: 'display',
  fontWeight: '400',
  fontSize: 'headingSm',
  letterSpacing: '-0.01em',
  color: 'starlight',
})

const fadeUpCss = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

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

function LibraryScreen() {
  const playClick = useClickSound()
  const gatedPlay = useGatedPlay()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const q = query.trim().toLowerCase()

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const typed = useTypewriterPlaceholder(focused || query.length > 0 || reduceMotion)
  const placeholder = reduceMotion ? 'Search the library' : typed || ' '

  const filtered = useMemo(() => {
    if (!q) return CRATES
    return CRATES.map((crate) => ({
      ...crate,
      items: crate.items.filter((item) => item.keywords.includes(q)),
    })).filter((crate) => crate.items.length > 0)
  }, [q])

  const play = (item: CrateItem, minutes?: number | null) => {
    playClick('primary')
    gatedPlay(item.state, minutes === null ? undefined : minutes ?? item.minutes ?? undefined)
  }

  return (
    <div>
      <header className={cx(css({ mb: '7' }), fadeUpCss)}>
        <p
          className={css({
            m: '0',
            mb: '1.5',
            fontFamily: 'mono',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'silver',
          })}
        >
          Crate-digging
        </p>
        <h1
          className={css({
            m: '0',
            fontFamily: 'display',
            fontWeight: '400',
            fontSize: 'heading',
            letterSpacing: '-0.01em',
            lineHeight: '1.1',
            color: 'starlight',
          })}
        >
          The Library
        </h1>
      </header>

      {/* Search — transparent bg, 1px Lead border, pill radius (design.md). */}
      <div className={cx(css({ mb: '8' }), fadeUpCss)}>
        <label
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '2.5',
            px: '4',
            height: '48px',
            borderRadius: 'pill',
            border: '1px solid',
            borderColor: 'lead',
            background: 'transparent',
            cursor: 'text',
            transition: 'border-color 300ms ease',
            _focusWithin: { borderColor: 'ghostBlue' },
          })}
        >
          <span aria-hidden className={css({ color: 'silver', lineHeight: '0' })}>
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            aria-label="Search the library"
            autoComplete="off"
            spellCheck={false}
            className={css({
              flex: '1',
              minW: '0',
              bg: 'transparent',
              border: 'none',
              outline: 'none',
              font: 'inherit',
              fontSize: 'bodySm',
              color: 'starlight',
              '&::placeholder': { color: 'silver', opacity: '0.75' },
              '&::-webkit-search-cancel-button': { display: 'none' },
            })}
          />
        </label>
      </div>

      {filtered.length === 0 && (
        <p className={cx(css({ m: '0', py: '10', textAlign: 'center', fontSize: 'bodySm', color: 'silver' }), fadeUpCss)}>
          Nothing matches &ldquo;{query}&rdquo; — try focus, relax, sleep, or meditate.
        </p>
      )}

      {/* The crates. */}
      {filtered.map((crate, ci) => (
        <section key={crate.id} className={cx(css({ mb: '10' }), fadeUpCss)} style={{ animationDelay: `${80 + ci * 70}ms` }}>
          <header className={css({ mb: '4' })}>
            <h2 className={crateTitleCss}>{crate.title}</h2>
            <p className={css({ m: '0', mt: '1', fontSize: 'bodySm', color: 'silver' })}>{crate.blurb}</p>
          </header>
          <Rail>
            {crate.items.map((item) => (
              <RecordSleeve
                key={`${crate.id}-${item.id}`}
                state={item.state}
                title={item.title}
                meta={itemMeta(item)}
                waveform
                onClick={() => play(item)}
                className={css({ width: '168px', flexShrink: '0' })}
              >
                {item.windDown && <WindDownSelector onPick={(m) => play(item, m)} />}
              </RecordSleeve>
            ))}
          </Rail>
        </section>
      ))}
    </div>
  )
}
