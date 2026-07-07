import { useEffect, useRef, useState } from 'react'

/**
 * The self-typing placeholder — SHARED by The Library's search and the
 * landing's search (audit 1.5: one typewriter, not two forks). The whole
 * typing phase (line index, character position, direction) lives in a ref,
 * so re-renders never reset it mid-word; the loop simply stops while
 * `paused` (field focused / query present / reduced motion), resuming
 * exactly where it left off.
 */

export const TYPEWRITER_LINES = [
  'Want to focus? Try Deep Focus.',
  'Racing mind? Still it in 10 minutes.',
  'Sleep deeper tonight.',
  'Find your calm.',
] as const

const TYPE_MS = 46
const DELETE_MS = 22
const HOLD_MS = 1700
const GAP_MS = 420

export function useTypewriterPlaceholder(
  paused: boolean,
  lines: readonly string[] = TYPEWRITER_LINES,
): string {
  const phase = useRef({ line: 0, pos: 0, dir: 1 as 1 | -1 })
  const [text, setText] = useState('')

  useEffect(() => {
    if (paused) return
    let disposed = false
    let timer = 0

    const step = () => {
      if (disposed) return
      const p = phase.current
      const line = lines[p.line % lines.length]
      p.pos = Math.max(0, p.pos + p.dir)
      setText(line.slice(0, p.pos))
      let delay = p.dir === 1 ? TYPE_MS : DELETE_MS
      if (p.dir === 1 && p.pos >= line.length) {
        p.dir = -1
        delay = HOLD_MS
      } else if (p.dir === -1 && p.pos <= 0) {
        p.dir = 1
        p.line = (p.line + 1) % lines.length
        delay = GAP_MS
      }
      timer = window.setTimeout(step, delay)
    }

    timer = window.setTimeout(step, 500)
    return () => {
      disposed = true
      window.clearTimeout(timer)
    }
  }, [paused, lines])

  return text
}
