import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/** Root — every route swap crossfades over the persistent Deep Space canvas
 * (400ms fade + 12px rise); there is never a white flash. */
function RootShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduce = useReducedMotion()
  // The app shell handles its own tab motion; only top-level swaps animate.
  const key = pathname.startsWith('/app') ? '/app' : pathname
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={key}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

export const Route = createRootRoute({
  component: RootShell,
})
