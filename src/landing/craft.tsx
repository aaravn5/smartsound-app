import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { css, cx } from 'styled-system/css'

gsap.registerPlugin(ScrollTrigger)

/**
 * craft.tsx — the award-pass toolkit.
 *
 * useLenis      inertial smooth scroll (landing only), synced to ScrollTrigger
 * SplitReveal   masked line reveals for display type (custom line splitter)
 * Marquee       seamless infinite strip, pauses on hover, aria-hidden twin
 * CountUp       honest stat counters, ease-out, animate exactly once
 * Magnetic      CTAs that lean toward the cursor (≤6px, lerp, spring back)
 * CursorDot     a 6px Mercury dot trailing the pointer; grows over targets
 *
 * Everything here is a no-op under prefers-reduced-motion and on touch.
 */

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

// ── smooth scroll ──────────────────────────────────────────────────────────

export function useLenis(onProgress?: (p: number) => void) {
  useEffect(() => {
    if (reduced()) {
      // Native scroll still reports progress so the 3D layer stays scrubbed.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        onProgress?.(max > 0 ? window.scrollY / max : 0)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
      return () => window.removeEventListener('scroll', onScroll)
    }
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(2, -10 * t),
    })
    lenis.on('scroll', (e: { progress: number }) => {
      ScrollTrigger.update()
      onProgress?.(e.progress)
    })
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ── masked line reveals ────────────────────────────────────────────────────

/** Splits rendered text into line boxes, wraps each in an overflow mask, and
 * raises the lines 110% → 0 with a 70ms stagger the first time it scrolls
 * into view. Re-splits on resize while unrevealed. Reduced motion: a single
 * ≤300ms opacity fade. */
export function SplitReveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
}: {
  children: string
  as?: 'h1' | 'h2' | 'p' | 'div' | 'span'
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || done.current) return
    if (reduced()) {
      el.style.opacity = '0'
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return
          io.disconnect()
          el.style.transition = 'opacity 0.3s ease'
          el.style.opacity = '1'
          done.current = true
        },
        { rootMargin: '-60px' },
      )
      io.observe(el)
      return () => io.disconnect()
    }

    const split = () => {
      const text = el.dataset.text ?? ''
      el.textContent = ''
      // Lay words out to discover the rendered line boxes.
      const words = text.split(/\s+/).filter(Boolean)
      const spans = words.map((w) => {
        const s = document.createElement('span')
        s.textContent = w
        s.style.display = 'inline-block'
        el.appendChild(s)
        el.appendChild(document.createTextNode(' '))
        return s
      })
      const lines: HTMLSpanElement[][] = []
      let top: number | null = null
      for (const s of spans) {
        if (s.offsetTop !== top) {
          top = s.offsetTop
          lines.push([])
        }
        lines[lines.length - 1].push(s)
      }
      el.textContent = ''
      return lines.map((ws) => {
        const mask = document.createElement('span')
        mask.style.display = 'block'
        mask.style.overflow = 'hidden'
        const inner = document.createElement('span')
        inner.style.display = 'block'
        inner.style.transform = 'translateY(110%)'
        inner.textContent = ws.map((w) => w.textContent).join(' ')
        mask.appendChild(inner)
        el.appendChild(mask)
        return inner
      })
    }

    el.dataset.text = el.textContent ?? ''
    let inners = split()
    const onResize = () => {
      if (!done.current) inners = split()
    }
    window.addEventListener('resize', onResize)

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        done.current = true
        window.removeEventListener('resize', onResize)
        gsap.to(inners, {
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.07,
          delay,
        })
      },
    })
    return () => {
      st.kill()
      window.removeEventListener('resize', onResize)
    }
  }, [children, delay])

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  )
}

/** Body copy under a heading — fades up 12px, 150ms after its heading. */
export function FadeUp({ children, className, delay = 0.15 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced()) return
    gsap.set(el, { opacity: 0, y: 12 })
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay }),
    })
    return () => st.kill()
  }, [delay])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// ── editorial furniture ────────────────────────────────────────────────────

/** Infinite horizontal strip between hairlines; duplicate is aria-hidden. */
export function Marquee({ text, className }: { text: string; className?: string }) {
  const row = css({
    display: 'inline-block',
    whiteSpace: 'nowrap',
    pr: '12',
    animation: 'marquee 46s linear infinite',
  })
  return (
    <div
      className={cx(
        css({
          overflow: 'hidden',
          borderTop: '1px solid #70707d40',
          borderBottom: '1px solid #70707d40',
          py: '4',
          whiteSpace: 'nowrap',
          _hover: { '& > span': { animationPlayState: 'paused' } },
          '@media (prefers-reduced-motion: reduce)': {
            '& > span': { animation: 'none' },
          },
        }),
        className,
      )}
    >
      <span className={row}>{text}</span>
      <span className={row} aria-hidden>
        {text}
      </span>
    </div>
  )
}

/** Ease-out count-up that runs exactly once when scrolled into view. */
export function CountUp({
  value,
  className,
}: {
  /** Final display string; digits animate, other chars pass through. */
  value: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState(reduced() ? value : value.replace(/\d/g, '0'))
  useEffect(() => {
    const el = ref.current
    if (!el || reduced()) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const dur = 1200
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur)
          const k = 1 - Math.pow(1 - p, 3)
          setText(
            value.replace(/\d+(\.\d+)?/g, (m) => {
              const n = parseFloat(m) * k
              return m.includes('.') ? n.toFixed(1) : Math.round(n).toString()
            }),
          )
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { rootMargin: '-40px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}

// ── pointer craft ──────────────────────────────────────────────────────────

/** Wrapper that leans toward the cursor within 40px (≤6px, lerp 0.15). */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || !finePointer()) return
    let raf = 0
    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.15
      pos.y += (target.y - pos.y) * 0.15
      el.style.transform = `translate(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px)`
      if (Math.abs(pos.x - target.x) > 0.05 || Math.abs(pos.y - target.y) > 0.05) {
        raf = requestAnimationFrame(tick)
      }
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const reach = 40
      const d = Math.hypot(dx, dy)
      const max = 6
      if (d < r.width / 2 + reach) {
        target.x = (dx / (r.width / 2 + reach)) * max
        target.y = (dy / (r.height / 2 + reach)) * max
      } else {
        target.x = 0
        target.y = 0
      }
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div ref={ref} className={cx(css({ display: 'inline-block', willChange: 'transform' }), className)}>
      {children}
    </div>
  )
}

/** A 6px Mercury dot lerping behind the pointer; 3× over [data-cursor]
 * elements with a mono label. Fine pointers only; cheap by construction
 * (one transform per frame, no layout reads in the loop). */
export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label || reduced() || !finePointer()) return
    const pos = { x: -100, y: -100 }
    const cur = { x: -100, y: -100 }
    let scale = 1
    let targetScale = 1
    let raf = 0
    const tick = () => {
      cur.x += (pos.x - cur.x) * 0.22
      cur.y += (pos.y - cur.y) * 0.22
      scale += (targetScale - scale) * 0.2
      dot.style.transform = `translate(${cur.x}px, ${cur.y}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`
      raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const t = (e.target as HTMLElement).closest?.('[data-cursor]') as HTMLElement | null
      targetScale = t ? 3 : 1
      label.textContent = t?.dataset.cursor ?? ''
      label.style.opacity = t ? '1' : '0'
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])
  if (typeof window !== 'undefined' && (!finePointer() || reduced())) return null
  return (
    <div
      ref={dotRef}
      aria-hidden
      className={css({
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '90',
        w: '6px',
        h: '6px',
        borderRadius: 'full',
        bg: '#5266eb',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      })}
    >
      <span
        ref={labelRef}
        className={css({
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%) scale(0.34)',
          fontFamily: 'mono',
          fontSize: '9px',
          letterSpacing: '0.12em',
          color: '#ededf3',
          opacity: '0',
          transition: 'opacity 0.2s ease',
          whiteSpace: 'nowrap',
        })}
      />
    </div>
  )
}
