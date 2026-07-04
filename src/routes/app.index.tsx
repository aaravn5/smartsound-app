import { useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { LivingScene } from '~/design/LivingScene'
import { SmartSoundRings } from '~/design/SmartSoundRings'
import { useClickSound } from '~/lib/click-sound'
import { useMainScrollRef } from '~/lib/scroll-context'
import { Rail, SessionCard, STATE_SCENE } from '~/components/SessionCard'
import { suggestFor, suggestedBlockMinutes } from '~/engine/circadian/model'
import { BAND_LABEL, SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import { readRecents } from '~/lib/recents'
import {
  ATTUNE_GOAL,
  MINUTES_GOAL,
  STREAK_GOAL,
  streakDays,
  todayMinutes,
  todaySessions,
} from '~/lib/sample-stats'
import type { TargetState } from '~/engine/audio/types'

/**
 * Today — the Calm-style home. A small, centered, time-based greeting floats
 * over the crisp nature scene; below it the daily hero card (the circadian
 * recommendation), the rhythm rings, and horizontal shelves of visible-photo
 * content cards: Focus · Calm · Sleep · Recently played. The hero keeps its
 * gentle sticky parallax (plain static block under reduced motion).
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

function dayPart(hour: number): string {
  if (hour < 5) return 'Night'
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
)

const ChevronIcon = () => (
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
    <path d="M9 5l7 7-7 7" />
  </svg>
)

// Scroll-linked reveal — a short, calm rise-and-fade as a section enters
// view. Disabled entirely under reduced motion (sections just render still).
const CALM_EASE = [0.16, 1, 0.3, 1] as const

// ── shelf content — real catalog entries, grouped Calm-style ────────────────

interface ShelfItem {
  id: string
  state: TargetState
  title: string
  meta: string
}

const soundscapeItem = (id: string): ShelfItem => {
  const s = SOUNDSCAPES.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title, meta: `${s.band} · Open-ended` }
}

const scenarioItem = (id: string): ShelfItem => {
  const s = SCENARIOS.find((x) => x.id === id)!
  return { id: s.id, state: s.state, title: s.title.split(' · ')[0], meta: `${s.band} · ${s.minutes} min` }
}

interface Shelf {
  id: string
  title: string
  items: ShelfItem[]
}

const SHELVES: Shelf[] = [
  {
    id: 'focus',
    title: 'Focus',
    items: [
      soundscapeItem('deep-focus'),
      scenarioItem('pomodoro-25'),
      scenarioItem('deep-work-50'),
      soundscapeItem('open-flow'),
    ],
  },
  {
    id: 'calm',
    title: 'Calm',
    items: [
      soundscapeItem('still'),
      scenarioItem('unwind-15'),
      soundscapeItem('wind-down'),
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    items: [
      soundscapeItem('delta-sleep'),
      scenarioItem('sleep-30'),
      soundscapeItem('wind-down'),
    ],
  },
]

/** Recently played — real history only (recorded when a session actually starts). */
function recentShelf(): Shelf | null {
  const states = readRecents()
  if (states.length === 0) return null
  const items = states.map((state) => {
    const s = SOUNDSCAPES.find((x) => x.state === state) ?? SOUNDSCAPES[0]
    return { id: `recent-${state}`, state, title: s.title, meta: `${BAND_LABEL[state]} · Open-ended` }
  })
  return { id: 'recent', title: 'Recently played', items }
}

const shelfTitleCss = css({
  m: '0',
  mb: '3',
  fontFamily: 'display',
  fontSize: 'title3',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'text',
  textShadow: 'var(--ss-text-glow)',
})

const CARD_W = '176px'
const CARD_H = '220px'

function ShelfRow({
  shelf,
  reveal,
  reduceMotion,
  delay,
}: {
  shelf: Shelf
  reveal: object | undefined
  reduceMotion: boolean | null
  delay: number
}) {
  return (
    <motion.section
      {...(reveal ?? {})}
      transition={reduceMotion ? undefined : { duration: 0.7, ease: CALM_EASE, delay: 0.05 }}
      className={css({ mb: '7' })}
    >
      <h2 className={shelfTitleCss}>{shelf.title}</h2>
      <Rail>
        {shelf.items.map((item, i) => (
          <div key={item.id} className={css({ flexShrink: '0' })} style={{ width: CARD_W }}>
            <SessionCard
              state={item.state}
              title={item.title}
              meta={item.meta}
              height={CARD_H}
              delayMs={reduceMotion ? 0 : delay + i * 60}
            />
          </div>
        ))}
      </Rail>
    </motion.section>
  )
}

function TodayScreen() {
  const navigate = useNavigate()
  const playClick = useClickSound()
  const reduceMotion = useReducedMotion()
  const mainRef = useMainScrollRef()

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    container: mainRef ?? undefined,
    offset: ['start start', 'end start'],
  })
  // Gentle parallax: the pinned scene drifts a little slower than the
  // content sliding over it, dims, and breathes outward — never a hard cut.
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 28])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.06])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.6, 0.32])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const now = new Date()
  const suggestion = suggestFor(now)
  const daily = SOUNDSCAPES.find((s) => s.state === suggestion.state) ?? SOUNDSCAPES[0]
  const dailyMinutes = suggestedBlockMinutes(suggestion.state)

  // Recently played — read once per mount (localStorage, real history only).
  const [recents] = useState(recentShelf)

  const reveal = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 26 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '0px 0px -80px 0px' },
        transition: { duration: 0.7, ease: CALM_EASE },
      }

  return (
    // ss-scene-dark on the WHOLE page: Today's content sits directly over the
    // always-dark ambient photo in BOTH themes, so its ink must stay light —
    // without this, Daylight flips the greeting/shelf titles to slate-on-dark.
    <div className="ss-scene-dark">
      {/* Centered, time-based greeting over the scene — Calm's home opening. */}
      <header
        className={css({
          mb: '6',
          pt: '2',
          textAlign: 'center',
          animation: 'fadeUp token(durations.calm) token(easings.enter) both',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      >
        <p
          className={css({
            m: '0',
            mb: '1.5',
            fontSize: 'footnote',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ss-ink-soft)',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          {todayCaption()}
        </p>
        <h1
          className={css({
            m: '0',
            fontFamily: 'display',
            fontSize: 'title1',
            fontWeight: '700',
            letterSpacing: '-0.015em',
            lineHeight: '1.12',
            color: 'text',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          {greeting()}
        </h1>
        <p
          className={css({
            m: '0',
            mt: '1.5',
            fontSize: 'subhead',
            lineHeight: '1.4',
            color: 'var(--ss-ink-body)',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          {greetingLine()}
        </p>
      </header>

      {/* Sticky stage — the daily hero pins while the shelves glide over it.
          Reduced motion collapses this back to a plain, non-sticky block. */}
      <div
        ref={stageRef}
        className={css({ position: 'relative', mb: '8' })}
        style={reduceMotion ? undefined : { height: 'calc(52vh + 200px)', minHeight: '540px' }}
      >
        <div
          className={cx(
            'ss-scene-dark',
            css({
              borderRadius: 'card',
              overflow: 'hidden',
              boxShadow: '0 18px 48px rgba(3, 6, 18, 0.4)',
            }),
          )}
          style={
            reduceMotion
              ? { height: '392px' }
              : {
                  position: 'sticky',
                  top: 'calc(env(safe-area-inset-top) + 8px)',
                  height: '52vh',
                  minHeight: '360px',
                  maxHeight: '560px',
                }
          }
        >
          <motion.div
            aria-hidden
            className={css({ position: 'absolute', inset: '0' })}
            style={reduceMotion ? undefined : { y: sceneY, scale: sceneScale, opacity: sceneOpacity }}
          >
            <LivingScene variant={STATE_SCENE[suggestion.state]} />
          </motion.div>

          <motion.div
            className={css({
              position: 'relative',
              zIndex: '1',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: '5',
            })}
            style={reduceMotion ? undefined : { opacity: overlayOpacity }}
          >
            <p
              className={css({
                m: '0',
                mb: '2',
                fontSize: 'footnote',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-body)',
              })}
            >
              {dayPart(now.getHours())} · Daily session
            </p>
            <h2
              className={css({
                m: '0',
                fontFamily: 'display',
                fontSize: 'title1',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                lineHeight: '1.15',
                color: 'text',
              })}
            >
              {daily.title}
            </h2>
            <p
              className={css({
                m: '0',
                mt: '2',
                maxW: '32ch',
                fontSize: 'subhead',
                lineHeight: '1.5',
                color: 'var(--ss-ink-strong)',
              })}
            >
              {daily.blurb}
            </p>
            <div className={css({ display: 'flex', alignItems: 'center', gap: '4', mt: '5' })}>
              <LiquidGlass
                as="button"
                variant="control"
                staticSheen
                onClick={() => {
                  playClick('primary')
                  void navigate({ to: '/app/player', search: { state: suggestion.state } })
                }}
                className={css({ border: 'none', font: 'inherit', color: 'text' })}
              >
                <span
                  className={css({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5',
                    px: '5',
                    py: '2.5',
                    fontSize: 'callout',
                    fontWeight: '600',
                  })}
                >
                  Begin
                  <ArrowIcon />
                </span>
              </LiquidGlass>
              <span
                className={`tabular ${css({
                  fontSize: 'caption',
                  fontWeight: '500',
                  letterSpacing: '0.02em',
                  color: 'var(--ss-ink-soft)',
                })}`}
              >
                {daily.band} · {dailyMinutes} min
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* The shelf — rings + content rows glide up over the pinned scene. */}
      <motion.section {...(reveal ?? {})}>
        <LiquidGlass
          as="button"
          variant="card"
          onClick={() => void navigate({ to: '/app/progress' })}
          className={css({
            display: 'block',
            width: '100%',
            border: 'none',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
            cursor: 'pointer',
            mb: '8',
          })}
        >
          <div className={css({ display: 'flex', alignItems: 'center', gap: '5', px: '5', py: '5' })}>
            <SmartSoundRings
              variant="compact"
              size={92}
              attune={{ progress: todaySessions / ATTUNE_GOAL, value: todaySessions, goal: ATTUNE_GOAL }}
              minutes={{ progress: todayMinutes / MINUTES_GOAL, value: todayMinutes, goal: MINUTES_GOAL }}
              streak={{ progress: streakDays / STREAK_GOAL, value: streakDays, goal: STREAK_GOAL }}
            />
            <div className={css({ flex: '1', minW: '0' })}>
              <p className={css({ m: '0', fontSize: 'headline', fontWeight: '600', color: 'text' })}>
                Today&rsquo;s rhythm
              </p>
              <p
                className={`tabular ${css({
                  m: '0',
                  mt: '1',
                  fontSize: 'footnote',
                  color: 'muted',
                })}`}
              >
                Attune {todaySessions}/{ATTUNE_GOAL} · {todayMinutes}/{MINUTES_GOAL} min · {streakDays}-day streak
              </p>
              <p
                className={css({
                  m: '0',
                  mt: '0.5',
                  fontSize: 'caption2',
                  fontWeight: '500',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  color: 'faint',
                })}
              >
                Sample data
              </p>
            </div>
            <span aria-hidden className={css({ color: 'faint', lineHeight: '0' })}>
              <ChevronIcon />
            </span>
          </div>
        </LiquidGlass>
      </motion.section>

      {/* Recommended — the timed scenarios, today's suggested state first. */}
      <motion.section
        {...(reveal ?? {})}
        transition={reduceMotion ? undefined : { duration: 0.7, ease: CALM_EASE, delay: 0.08 }}
        className={css({ mb: '7' })}
      >
        <h2 className={shelfTitleCss}>Recommended for now</h2>
        <Rail>
          {[...SCENARIOS]
            .sort((a, b) => (a.state === suggestion.state ? 0 : 1) - (b.state === suggestion.state ? 0 : 1))
            .map((scenario, i) => (
              <div key={scenario.id} className={css({ flexShrink: '0' })} style={{ width: CARD_W }}>
                <SessionCard
                  state={scenario.state}
                  title={scenario.title.split(' · ')[0]}
                  meta={`${scenario.band} · ${scenario.minutes} min`}
                  height={CARD_H}
                  delayMs={reduceMotion ? 0 : 320 + i * 70}
                />
              </div>
            ))}
        </Rail>
      </motion.section>

      {/* Calm-style shelves — Focus · Calm · Sleep (+ real Recently played). */}
      {SHELVES.map((shelf, si) => (
        <ShelfRow
          key={shelf.id}
          shelf={shelf}
          reveal={reveal}
          reduceMotion={reduceMotion}
          delay={120 + si * 60}
        />
      ))}
      {recents && (
        <ShelfRow shelf={recents} reveal={reveal} reduceMotion={reduceMotion} delay={120} />
      )}
    </div>
  )
}
