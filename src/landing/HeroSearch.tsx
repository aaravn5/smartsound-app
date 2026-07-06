import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { Search } from 'lucide-react'
import { css, cx } from 'styled-system/css'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * HeroSearch — the landing's liquid-glass search bar.
 *
 * Before any typing, the placeholder types ITSELF: benefit-led lines are
 * typed character by character, held, deleted, and cycled — the proven
 * self-typing-search marketing pattern, kept quiet (the loudness budget is
 * spent on the headline's type scale, not here). Under reduced motion the
 * placeholder is a static "Search".
 *
 * Typing live-filters the real catalog (modes + scenarios); Enter or a
 * result click hands the state to `onPlay` — the caller applies the auth
 * gate. The query is only ever rendered as text (React text nodes — no HTML
 * sink anywhere on this path).
 */

const LINES = [
  'Want to focus? Try Focus today.',
  'Racing mind? Still it in 10 minutes.',
  'Sleep deeper tonight.',
  'Find your calm.',
]

const TYPE_MS = 46
const DELETE_MS = 22
const HOLD_MS = 1700
const GAP_MS = 420

interface SearchEntry {
  id: string
  state: TargetState
  title: string
  meta: string
  haystack: string
}

const ENTRIES: SearchEntry[] = [
  ...SOUNDSCAPES.map((s) => ({
    id: s.id,
    state: s.state,
    title: s.title,
    meta: `${s.band} · Open-ended`,
    haystack: `${s.title} ${s.state} ${s.band} ${s.blurb}`.toLowerCase(),
  })),
  ...SCENARIOS.map((s) => ({
    id: s.id,
    state: s.state,
    title: s.title.split(' · ')[0],
    meta: `${s.band} · ${s.minutes} min`,
    haystack: `${s.title} ${s.state} ${s.band} ${s.blurb}`.toLowerCase(),
  })),
]

/** The self-typing loop — type, hold, delete, next. */
function useSelfTypingPlaceholder(active: boolean): string {
  const [text, setText] = useState('')
  const lineRef = useRef(0)

  useEffect(() => {
    if (!active) return
    let timer = 0
    let disposed = false

    const run = (line: string, pos: number, dir: 1 | -1) => {
      if (disposed) return
      const next = pos + dir
      setText(line.slice(0, Math.max(0, next)))
      if (dir === 1 && next >= line.length) {
        timer = window.setTimeout(() => run(line, next, -1), HOLD_MS)
      } else if (dir === -1 && next <= 0) {
        lineRef.current = (lineRef.current + 1) % LINES.length
        timer = window.setTimeout(
          () => run(LINES[lineRef.current], 0, 1),
          GAP_MS,
        )
      } else {
        timer = window.setTimeout(() => run(line, next, dir), dir === 1 ? TYPE_MS : DELETE_MS)
      }
    }

    timer = window.setTimeout(() => run(LINES[lineRef.current], 0, 1), 600)
    return () => {
      disposed = true
      window.clearTimeout(timer)
    }
  }, [active])

  return active ? text : 'Search'
}

const rowCss = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  width: '100%',
  px: '4',
  minH: '52px',
  border: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'rgba(255,255,255,0.94)',
  textAlign: 'left',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 160ms ease',
  _hover: { background: 'rgba(255,255,255,0.08)' },
  _focusVisible: { outline: 'none', background: 'rgba(255,255,255,0.1)' },
})

export interface HeroSearchProps {
  onPlay: (state: TargetState) => void
  className?: string
}

export function HeroSearch({ onPlay, className }: HeroSearchProps) {
  const reduce = useReducedMotion()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const idle = query.length === 0
  const typed = useSelfTypingPlaceholder(!reduce && idle)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ENTRIES.filter((e) => e.haystack.includes(q)).slice(0, 6)
  }, [query])

  const open = focused && query.trim().length > 0

  return (
    <div className={cx(css({ position: 'relative', width: '100%' }), className)}>
      <label
        className={cx(
          'liquid-glass',
          css({
            display: 'flex',
            alignItems: 'center',
            gap: '3',
            borderRadius: 'capsule',
            px: '5',
            height: '54px',
            cursor: 'text',
          }),
        )}
      >
        <Search size={18} strokeWidth={2} aria-hidden className={css({ color: 'rgba(255,255,255,0.75)', flexShrink: '0' })} />
        <span className={css({ position: 'relative', flex: '1', minW: '0', display: 'flex', alignItems: 'center' })}>
          {idle && (
            <span
              aria-hidden
              className={css({
                position: 'absolute',
                inset: '0',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                fontSize: 'subhead',
                color: 'rgba(235,238,250,0.66)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
              data-typing-placeholder
            >
              {typed}
              {!reduce && (
                <span
                  className={css({ display: 'inline-block', width: '1px', height: '1.05em', ml: '0.5', background: 'rgba(255,255,255,0.7)', animation: 'lq-caret 1.1s steps(1) infinite' })}
                />
              )}
            </span>
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0) {
                e.preventDefault()
                onPlay(results[0].state)
              } else if (e.key === 'Escape') {
                setQuery('')
              }
            }}
            aria-label="Search the library"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className={css({
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              font: 'inherit',
              fontSize: 'subhead',
              color: 'rgba(255,255,255,0.95)',
              caretColor: 'rgba(255,255,255,0.85)',
              '&::-webkit-search-cancel-button': { display: 'none' },
            })}
          />
        </span>
      </label>

      {open && (
        <div
          className={cx(
            'liquid-glass',
            css({
              position: 'absolute',
              insetX: '0',
              top: 'calc(100% + 8px)',
              zIndex: '30',
              borderRadius: '18px',
              overflow: 'hidden',
              py: '1',
            }),
          )}
          role="listbox"
          aria-label="Search results"
          // Inline: .liquid-glass (unlayered) sets position:relative and
          // would beat the layered pos_absolute utility.
          style={{ position: 'absolute' }}
        >
          {results.length === 0 ? (
            <p className={css({ m: '0', px: '4', py: '3.5', fontSize: 'subhead', color: 'rgba(235,238,250,0.7)' })}>
              Nothing in the library matches “{query.trim()}”.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={false}
                className={rowCss}
                onClick={() => onPlay(r.state)}
              >
                <span className={css({ flex: '1', minW: '0' })}>
                  <span className={css({ display: 'block', fontSize: 'subhead', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                    {r.title}
                  </span>
                  <span className={cx('tabular', css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'rgba(235,238,250,0.66)' }))}>
                    {r.meta}
                  </span>
                </span>
                <span className={css({ fontSize: 'caption', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(235,238,250,0.55)' })}>
                  Play
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
