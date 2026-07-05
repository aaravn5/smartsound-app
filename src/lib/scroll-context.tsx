import { createContext, useContext, useEffect, type RefObject } from 'react'
import { useMotionValue, type MotionValue } from 'motion/react'

/**
 * The app shell's single scrollable surface (`<main>` in `routes/app.tsx`) is
 * the only element that ever scrolls — the window/body never does. Motion's
 * `useScroll` needs a ref to that actual scrolling ancestor to compute
 * scroll-linked values (sticky-scroll parallax on Today, etc.); this context
 * hands it down without every route needing to know the shell's DOM shape.
 */
export const MainScrollContext = createContext<RefObject<HTMLElement> | null>(null)

export function useMainScrollRef(): RefObject<HTMLElement> | null {
  return useContext(MainScrollContext)
}

/**
 * Scroll progress of `target` through the shell scroller, as a MotionValue —
 * 0 when the target's top reaches the scrollport top, 1 when its bottom does
 * (motion `useScroll`'s `['start start', 'end start']`, hand-rolled).
 *
 * Why not `useScroll({ container })`? motion@11's container-scroll tracking
 * silently detaches under React 18 StrictMode double-mounting — the returned
 * progress stays frozen at 0. This drives a plain passive scroll listener +
 * rAF into a MotionValue instead: same downstream `useTransform` ergonomics,
 * zero per-frame React state, and it actually fires.
 */
export function useContainerScrollProgress(target: RefObject<HTMLElement>): MotionValue<number> {
  const container = useMainScrollRef()
  const progress = useMotionValue(0)

  useEffect(() => {
    const scroller = container?.current
    const el = target.current
    if (!scroller || !el) return
    let top = 0
    let span = 1
    const measure = () => {
      const r = el.getBoundingClientRect()
      top = r.top - scroller.getBoundingClientRect().top + scroller.scrollTop
      span = Math.max(1, r.height)
    }
    let raf = 0
    const update = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        progress.set(Math.min(1, Math.max(0, (scroller.scrollTop - top) / span)))
      })
    }
    const onResize = () => {
      measure()
      update()
    }
    measure()
    update()
    scroller.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      scroller.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
    }
  }, [container, target, progress])

  return progress
}
