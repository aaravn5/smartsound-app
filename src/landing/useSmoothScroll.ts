import { useEffect } from 'react'

/**
 * useSmoothScroll — the "screen glides" scroll feel.
 *
 * Wheel input is intercepted and eased toward its target with a lerp, so the
 * page drifts instead of stepping. Crucially this animates the REAL scroll
 * position (window.scrollTo), so position: sticky stages, ScrollTrigger-style
 * observers, and anchor links all keep working — no transform hijacking.
 *
 * Touch scrolling stays native (momentum physics are already good there),
 * keyboard/anchor jumps resync the target, and prefers-reduced-motion opts
 * out entirely.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let target = window.scrollY
    let current = target
    let raf = 0
    let animating = false

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    const tick = () => {
      current += (target - current) * 0.088
      if (Math.abs(target - current) < 0.5) {
        current = target
        animating = false
      }
      window.scrollTo(0, current)
      if (animating) raf = requestAnimationFrame(tick)
    }

    const onWheel = (e: WheelEvent) => {
      // Let pinch-zoom and modified scrolls through untouched.
      if (e.ctrlKey || e.metaKey) return
      e.preventDefault()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      target = Math.max(0, Math.min(maxScroll(), target + delta))
      if (!animating) {
        animating = true
        current = window.scrollY
        raf = requestAnimationFrame(tick)
      }
    }

    // Keyboard scrolling, anchor jumps, touch — resync so we never fight them.
    const onScroll = () => {
      if (!animating) {
        target = window.scrollY
        current = target
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [enabled])
}
