import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { SmartSoundScreen } from '~/components/SmartSoundScreen'
import { useEngine } from '~/lib/engine-context'
import { useDailyUsage, FREE_DAILY_MIN } from '~/lib/entitlements'
import type { TargetState } from '~/engine/audio/types'
import type { PaywallTrigger } from '~/routes/app.paywall'

/**
 * Now — the closed-loop instrument (Milestone 2 tab). Deep-links via ?state=.
 *
 * Milestone 4 adds the free daily-cap UX (§4.1/§4.3 of the goal doc) as a thin
 * wrapper around the engine, not inside it: a local elapsed-minute timer feeds
 * the client-side entitlements STUB (src/lib/entitlements.ts — the server is
 * the real source of truth in a later milestone), warns at 17 minutes, and
 * hard-stops + redirects to the paywall at 20. `src/engine/**` is untouched.
 */
const VALID_STATES: readonly TargetState[] = ['focus', 'flow', 'calm', 'winddown', 'sleep']
const WARN_AT_MIN = 17

interface NowSearch {
  state?: TargetState
}

export const Route = createFileRoute('/app/now')({
  validateSearch: (search: Record<string, unknown>): NowSearch => {
    const s = search.state
    return typeof s === 'string' && (VALID_STATES as readonly string[]).includes(s) ? { state: s as TargetState } : {}
  },
  component: NowScreen,
})

function NowScreen() {
  const { state } = Route.useSearch()
  const { status, start, stop, selectState } = useEngine()
  const { plan, capReached, addMinutes, recordSessionStart } = useDailyUsage()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const appliedFor = useRef<TargetState | null>(null)
  const [warning, setWarning] = useState(false)

  // Elapsed-minute accounting for the running free session — reset whenever a
  // fresh session starts, independent of SmartSoundScreen's own on-screen clock.
  const runningSince = useRef<number | null>(null)
  const flushedMinutes = useRef(0)
  const warnedRef = useRef(false)
  const cappedRef = useRef(false)

  const goToPaywall = useCallback(
    (trigger: PaywallTrigger) => navigate({ to: '/app/paywall', search: { trigger } }),
    [navigate],
  )

  /** Checked right before a session begins. Blocks + redirects when the free cap is already spent. */
  const beginGate = useCallback((): boolean => {
    if (plan !== 'free') return true
    if (capReached) {
      void goToPaywall('cap')
      return false
    }
    recordSessionStart()
    return true
  }, [plan, capReached, recordSessionStart, goToPaywall])

  // Deep link (Discover/Browse → /app/now?state=…) goes through the same gate
  // as the on-screen Play control — a locked deep link never silently starts.
  useEffect(() => {
    if (!state || appliedFor.current === state) return
    if (status !== 'running' && !beginGate()) return
    appliedFor.current = state
    if (status === 'running') selectState(state)
    else void start(state)
  }, [state, status, start, selectState, beginGate])

  // Free-plan elapsed timer: gentle warning at 17 min, graceful hard-stop at 20.
  useEffect(() => {
    if (status !== 'running' || plan !== 'free') {
      runningSince.current = null
      flushedMinutes.current = 0
      warnedRef.current = false
      cappedRef.current = false
      if (status !== 'running') setWarning(false)
      return
    }
    if (runningSince.current == null) runningSince.current = performance.now()

    const id = window.setInterval(() => {
      const startedAt = runningSince.current
      if (startedAt == null) return
      const elapsedMin = (performance.now() - startedAt) / 60_000
      const delta = elapsedMin - flushedMinutes.current
      if (delta > 0) {
        addMinutes(delta)
        flushedMinutes.current = elapsedMin
      }
      if (!warnedRef.current && elapsedMin >= WARN_AT_MIN) {
        warnedRef.current = true
        setWarning(true)
      }
      if (!cappedRef.current && elapsedMin >= FREE_DAILY_MIN) {
        cappedRef.current = true
        setWarning(false)
        void stop().then(() => goToPaywall('cap'))
      }
    }, 1000)

    return () => window.clearInterval(id)
  }, [status, plan, addMinutes, stop, goToPaywall])

  return (
    <div className={css({ height: '100%', position: 'relative' })}>
      <AnimatePresence>
        {warning && (
          <motion.div
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={flex({
              align: 'center',
              justify: 'center',
              gap: '2.5',
              position: 'absolute',
              top: 'calc(14px + env(safe-area-inset-top))',
              left: '50%',
              zIndex: '30',
              px: '5',
              py: '2.5',
              rounded: 'full',
              border: '1px solid token(colors.glassBorder)',
              bg: 'glassFill',
              textAlign: 'center',
            })}
            style={{
              transform: 'translateX(-50%)',
              backdropFilter: 'blur(var(--glass-blur)) saturate(1.5)',
              WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.5)',
              boxShadow: 'var(--glass-shadow)',
            }}
          >
            <span
              aria-hidden
              className={css({ w: '1.5', h: '1.5', rounded: 'full', bg: 'signal', flexShrink: '0', boxShadow: '0 0 10px token(colors.signal)' })}
            />
            <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'text', letterSpacing: '0.04em' })}>
              3 minutes left on today's free session
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <SmartSoundScreen onBeginAttempt={beginGate} />
    </div>
  )
}
