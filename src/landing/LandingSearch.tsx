import { useMemo, useState } from 'react'
import { css, cx } from 'styled-system/css'
import { useTypewriterPlaceholder } from '~/lib/typewriter'
import { SOUNDSCAPES, SCENARIOS } from '~/lib/catalog'
import type { TargetState } from '~/engine/audio/types'

/**
 * LandingSearch — the hero's search field, sharing The Library's typewriter
 * placeholder (one component of truth — audit 1.5) and the design.md input:
 * transparent bg, 1px Lead border, pill radius, Starlight text. Typing
 * live-filters the real catalog; Enter or a result click hands the state to
 * `onPlay` — the caller applies the auth gate. The query only ever renders
 * as React text nodes (no HTML sink).
 */

interface SearchEntry {
  id: string
  state: TargetState
  title: string
  meta: string
  minutes?: number
  haystack: string
}

const ENTRIES: SearchEntry[] = [
  ...SOUNDSCAPES.map((s) => ({
    id: s.id,
    state: s.state,
    title: s.title,
    // Wind-down is the MERGED record — 15 min | open, one entry only.
    meta: s.id === 'wind-down' ? `${s.band} · 15 min | Open` : `${s.band} · Open-ended`,
    haystack: `${s.title} ${s.state} ${s.band} ${s.blurb}`.toLowerCase(),
  })),
  ...SCENARIOS.filter((s) => s.id !== 'unwind-15').map((s) => ({
    id: s.id,
    state: s.state,
    title: s.title.split(' · ')[0],
    meta: `${s.band} · ${s.minutes} min`,
    minutes: s.minutes,
    haystack: `${s.title} ${s.state} ${s.band} ${s.blurb}`.toLowerCase(),
  })),
]

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
  color: 'starlight',
  textAlign: 'left',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 160ms ease',
  _hover: { background: 'graphite' },
  _focusVisible: { outline: 'none', background: 'graphite' },
})

export interface LandingSearchProps {
  onPlay: (state: TargetState, minutes?: number) => void
  reduced?: boolean
  className?: string
}

export function LandingSearch({ onPlay, reduced, className }: LandingSearchProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const typed = useTypewriterPlaceholder(Boolean(reduced) || focused || query.length > 0)
  const placeholder = reduced ? 'Search the library' : typed || ' '

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return ENTRIES.filter((e) => e.haystack.includes(q)).slice(0, 6)
  }, [query])

  const open = focused && query.trim().length > 0

  return (
    <div className={cx(css({ position: 'relative', width: '100%' }), className)}>
      <label
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '2.5',
          px: '4',
          height: '50px',
          borderRadius: 'pill',
          border: '1px solid',
          borderColor: 'lead',
          background: 'rgba(23, 23, 33, 0.72)',
          cursor: 'text',
          transition: 'border-color 300ms ease',
          _focusWithin: { borderColor: 'ghostBlue' },
        })}
      >
        <span aria-hidden className={css({ color: 'silver', lineHeight: '0', flexShrink: '0' })}>
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) {
              e.preventDefault()
              onPlay(results[0].state, results[0].minutes)
            } else if (e.key === 'Escape') {
              setQuery('')
            }
          }}
          placeholder={placeholder}
          aria-label="Search the library"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          className={css({
            flex: '1',
            minW: '0',
            bg: 'transparent',
            border: 'none',
            outline: 'none',
            font: 'inherit',
            fontSize: 'bodySm',
            color: 'starlight',
            caretColor: 'token(colors.starlight)',
            '&::placeholder': { color: 'silver', opacity: '0.75' },
            '&::-webkit-search-cancel-button': { display: 'none' },
          })}
        />
      </label>

      {open && (
        <div
          role="listbox"
          aria-label="Search results"
          className={css({
            position: 'absolute',
            insetX: '0',
            bottom: 'calc(100% + 8px)',
            zIndex: '40',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: 'hairline',
            background: 'midnightSlate',
            overflow: 'hidden',
            py: '1',
          })}
        >
          {results.length === 0 ? (
            <p className={css({ m: '0', px: '4', py: '3.5', fontSize: 'bodySm', color: 'silver' })}>
              Nothing in the library matches &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={false}
                className={rowCss}
                onClick={() => onPlay(r.state, r.minutes)}
              >
                <span className={css({ flex: '1', minW: '0' })}>
                  <span
                    className={css({
                      display: 'block',
                      fontSize: 'bodySm',
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    {r.title}
                  </span>
                  <span
                    className={cx(
                      'tabular',
                      css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'silver' }),
                    )}
                  >
                    {r.meta}
                  </span>
                </span>
                <span
                  className={css({
                    fontSize: 'caption',
                    fontWeight: '500',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'silver',
                  })}
                >
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
