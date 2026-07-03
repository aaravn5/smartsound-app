import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { Scene } from '~/design/Scene'
import { hasOnboarded } from '~/lib/onboarding'

/**
 * Welcome — the serene Calm-style landing. A dusk sky, one calm line, and a
 * single Liquid Glass door into a short guided onboarding. A returning
 * visitor (device already carries the onboarded flag) never sees this
 * marketing screen again — `beforeLoad` sends them straight to `/app`.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (hasOnboarded()) throw redirect({ to: '/app' })
  },
  component: Welcome,
})

const enter = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }

function Welcome() {
  const reduce = useReducedMotion()
  const navigate = useNavigate()

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { ...enter, delay },
        }

  return (
    <div
      className={css({
        position: 'relative',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text',
        bg: 'bgDeep',
      })}
    >
      <Scene variant="dusk" />

      <main
        className={css({
          position: 'relative',
          zIndex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '5',
          px: '6',
          py: '16',
          maxW: '560px',
        })}
      >
        <motion.p
          {...reveal(0.1)}
          className={css({
            m: '0',
            fontSize: 'footnote',
            fontWeight: '600',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'faint',
          })}
        >
          SmartSound
        </motion.p>

        <motion.h1
          {...reveal(0.25)}
          className={css({
            m: '0',
            fontFamily: 'display',
            fontSize: 'clamp(2.5rem, 8vw, 3.6rem)',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            lineHeight: '1.08',
            color: 'text',
          })}
        >
          Calm, tuned
          <br />
          to your body
        </motion.h1>

        <motion.p
          {...reveal(0.42)}
          className={css({
            m: '0',
            maxW: '38ch',
            fontSize: 'body',
            lineHeight: '1.6',
            color: 'muted',
          })}
        >
          Neuroacoustic soundscapes that listen to your pulse and gently steer you into focus,
          rest, or sleep.
        </motion.p>

        <motion.div {...reveal(0.6)} className={css({ mt: '4' })}>
          <LiquidGlass
            as="button"
            variant="control"
            tint="rgba(139, 108, 246, 0.6)"
            onClick={() => void navigate({ to: '/onboarding/$step', params: { step: 'welcome' } })}
            className={css({
              minW: '220px',
              minH: '54px',
              border: 'none',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(196, 181, 253, 0.38)',
              color: 'text',
              font: 'inherit',
            })}
          >
            <span
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '54px',
                px: '9',
                fontSize: 'headline',
                fontWeight: '600',
                letterSpacing: '0.01em',
              })}
            >
              Begin
            </span>
          </LiquidGlass>
        </motion.div>

        <motion.p
          {...reveal(0.78)}
          className={css({ m: '0', mt: '2', fontSize: 'caption', color: 'ghost' })}
        >
          Free to explore. The camera stays on your device.
        </motion.p>
      </main>
    </div>
  )
}
