import { createContext, useContext, type RefObject } from 'react'

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
