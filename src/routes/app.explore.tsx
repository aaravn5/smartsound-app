import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { CALM_SCRIM_CARD, VARIANT_IMAGE, type SceneVariant } from '~/design/Scene'
import { ScreenTitle } from '~/components/SereneScreen'
import { Rail, SessionCard } from '~/components/SessionCard'
import { suggestedBlockMinutes } from '~/engine/circadian/model'
import { BAND_LABEL, SCENARIOS, SOUNDSCAPES } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * Explore — the Calm-style browse. Large category tiles with visible nature
 * imagery up top (each scrolls to its section), then the library sections:
 * rails and grids of crisp-photo session cards over real engine states.
 */
export const Route = createFileRoute('/app/explore')({
  component: ExploreScreen,
})

interface LibraryItem {
  id: string
  title: string
  state: TargetState
  meta: string
  keywords: string
}

/** Strip a catalog title's "· N" suffix — the minute count lives in `meta` instead. */
const baseTitle = (title: string) => title.split(' · ')[0]

function fromScenario(id: string): LibraryItem {
  const scenario = SCENARIOS.find((s) => s.id === id)
  if (!scenario) throw new Error(`Unknown scenario: ${id}`)
  return {
    id: scenario.id,
    title: baseTitle(scenario.title),
    state: scenario.state,
    meta: `${scenario.band} · ${scenario.minutes} min`,
    keywords: `${scenario.title} ${scenario.state} ${scenario.band}`.toLowerCase(),
  }
}

function fromSoundscape(id: string): LibraryItem {
  const soundscape = SOUNDSCAPES.find((s) => s.id === id)
  if (!soundscape) throw new Error(`Unknown soundscape: ${id}`)
  return {
    id: soundscape.id,
    title: soundscape.title,
    state: soundscape.state,
    meta: `${soundscape.band} · Open-ended`,
    keywords: `${soundscape.title} ${soundscape.state} ${soundscape.band}`.toLowerCase(),
  }
}

/** A short hand-authored settling session per state — the engine's real bands + minutes. */
function meditation(title: string, state: TargetState): LibraryItem {
  const minutes = suggestedBlockMinutes(state)
  return {
    id: `meditate-${state}`,
    title,
    state,
    meta: `${BAND_LABEL[state]} · ${minutes} min`,
    keywords: `${title} ${state} meditate meditation`.toLowerCase(),
  }
}

interface Category {
  id: string
  title: string
  subtitle: string
  scene: SceneVariant
  layout: 'rail' | 'grid'
  items: LibraryItem[]
}

const CATEGORIES: Category[] = [
  {
    id: 'focus',
    title: 'Focus',
    subtitle: 'Beta and alpha-beta modulation for single-thread work',
    scene: 'ocean',
    layout: 'rail',
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
    subtitle: 'Alpha-paced, unhurried — for a settled mind',
    scene: 'forest',
    layout: 'grid',
    items: [fromSoundscape('still')],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    subtitle: 'Descending toward delta-modulated noise',
    scene: 'aurora',
    layout: 'rail',
    items: [fromSoundscape('wind-down'), fromScenario('sleep-30'), fromSoundscape('delta-sleep')],
  },
  {
    id: 'meditate',
    title: 'Meditate',
    subtitle: 'A short breath, a short settle',
    scene: 'dawn',
    layout: 'grid',
    items: [meditation('Breathe', 'calm'), meditation('Settle', 'winddown')],
  },
  {
    id: 'soundscapes',
    title: 'Soundscapes',
    subtitle: 'The five states, endless and open',
    scene: 'dusk',
    layout: 'rail',
    items: SOUNDSCAPES.map((s) => fromSoundscape(s.id)),
  },
]

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
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

// ── Category tile — a large visible-imagery browse tile (Calm's browse). ────

const tileShell = css({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '104px',
  borderRadius: 'card',
  overflow: 'hidden',
  border: 'none',
  p: '0',
  m: '0',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  background: 'rgba(10, 18, 38, 1)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09), 0 10px 30px rgba(3, 6, 18, 0.3)',
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  transition: 'transform token(durations.quick) token(easings.calm)',
  _active: { transform: 'scale(0.975)' },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
    _active: { transform: 'none' },
  },
})

function CategoryTile({
  category,
  delayMs,
  onSelect,
}: {
  category: Category
  delayMs: number
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      aria-label={`Browse ${category.title}`}
      className={cx('ss-scene-dark', tileShell)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <img
        aria-hidden
        alt=""
        loading="lazy"
        decoding="async"
        src={VARIANT_IMAGE[category.scene]}
        className={css({
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        })}
      />
      <div
        aria-hidden
        className={css({ position: 'absolute', inset: '0', pointerEvents: 'none' })}
        style={{ background: CALM_SCRIM_CARD }}
      />
      <div className={css({ position: 'absolute', insetX: '0', bottom: '0', px: '3.5', pb: '2.5', pt: '6' })}>
        <p
          className={css({
            m: '0',
            fontSize: 'headline',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            color: 'rgba(255, 255, 255, 0.98)',
          })}
        >
          {category.title}
        </p>
        <p
          className={`tabular ${css({
            m: '0',
            mt: '0.5',
            fontSize: 'caption2',
            fontWeight: '500',
            letterSpacing: '0.02em',
            color: 'rgba(235, 240, 252, 0.78)',
          })}`}
        >
          {category.items.length} {category.items.length === 1 ? 'session' : 'sessions'}
        </p>
      </div>
    </button>
  )
}

function ExploreScreen() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return CATEGORIES
    return CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => item.keywords.includes(q)),
    })).filter((category) => category.items.length > 0)
  }, [q])

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`category-${id}`)
    if (!el) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  let cardIndex = 0

  return (
    <>
      <ScreenTitle caption="Library" title="Explore" />

      <div
        className={css({
          mb: '6',
          animation: 'fadeUp token(durations.calm) token(easings.enter) both',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      >
        <LiquidGlass variant="control" as="label" className={css({ display: 'block', width: 'full' })}>
          <div className={css({ display: 'flex', alignItems: 'center', gap: '2.5', px: '4', py: '2.5' })}>
            <span aria-hidden className={css({ color: 'faint', lineHeight: '0' })}>
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search focus, sleep, meditate…"
              aria-label="Search sessions"
              className={css({
                flex: '1',
                minW: '0',
                bg: 'transparent',
                border: 'none',
                outline: 'none',
                borderRadius: 'control',
                font: 'inherit',
                fontSize: 'subhead',
                color: 'text',
                '&::placeholder': { color: 'faint' },
                _focusVisible: {
                  outline: '2px solid token(colors.accent)',
                  outlineOffset: '2px',
                },
              })}
            />
          </div>
        </LiquidGlass>
      </div>

      {/* Browse — large visible-imagery category tiles, Calm-style. Hidden
          while searching (the filtered sections below are the results). */}
      {!q && (
        <div
          className={css({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3',
            mb: '8',
          })}
        >
          {CATEGORIES.map((category, i) => (
            <CategoryTile
              key={category.id}
              category={category}
              delayMs={60 + i * 50}
              onSelect={scrollToCategory}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <LiquidGlass
          variant="card"
          className={css({
            animation: 'fadeUp token(durations.calm) token(easings.enter) both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          })}
        >
          <div className={css({ px: '7', py: '10', textAlign: 'center' })}>
            <p className={css({ m: '0', fontSize: 'subhead', color: 'muted' })}>
              Nothing matches &ldquo;{query}&rdquo; — try focus, relax, sleep, or meditate.
            </p>
          </div>
        </LiquidGlass>
      )}

      {filtered.map((category, ci) => {
        const startIndex = cardIndex
        cardIndex += category.items.length
        const delayBase = 80 + ci * 90

        return (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className={css({ mb: '8', scrollMarginTop: '16px' })}
          >
            <header
              className={css({
                mb: '3',
                animation: 'fadeUp token(durations.calm) token(easings.enter) both',
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              })}
              style={{ animationDelay: `${delayBase}ms` }}
            >
              <h2
                className={css({
                  m: '0',
                  fontFamily: 'display',
                  fontSize: 'title3',
                  fontWeight: '600',
                  letterSpacing: '-0.01em',
                  color: 'text',
                  textShadow: 'var(--ss-text-glow)',
                })}
              >
                {category.title}
              </h2>
              <p
                className={css({
                  m: '0',
                  mt: '0.5',
                  fontSize: 'footnote',
                  color: 'var(--ss-ink-body)',
                  textShadow: 'var(--ss-text-glow)',
                })}
              >
                {category.subtitle}
              </p>
            </header>

            {category.layout === 'rail' ? (
              <Rail>
                {category.items.map((item, i) => (
                  <div key={item.id} className={css({ width: '176px', flexShrink: '0' })}>
                    <SessionCard
                      state={item.state}
                      title={item.title}
                      meta={item.meta}
                      height="220px"
                      delayMs={delayBase + 60 + (startIndex + i) * 50}
                    />
                  </div>
                ))}
              </Rail>
            ) : (
              <div
                className={css({
                  display: 'grid',
                  gridTemplateColumns: category.items.length > 1 ? '1fr 1fr' : '1fr',
                  gap: '3',
                })}
              >
                {category.items.map((item, i) => (
                  <SessionCard
                    key={item.id}
                    state={item.state}
                    title={item.title}
                    meta={item.meta}
                    height={category.items.length > 1 ? '170px' : '210px'}
                    delayMs={delayBase + 60 + (startIndex + i) * 50}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
