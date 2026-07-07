import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { css, cx } from 'styled-system/css'
import { Scene, type SceneVariant } from '~/design/Scene'

/**
 * InfoPage — the shared editorial stage for /privacy, /terms, /contact and
 * /science: a scene-dark landscape with the page scrim, a glass back
 * control, an Instrument Serif title (400 — never bold), and a readable
 * measure. These pages scroll normally (they're documents, not the hero).
 */

const DISPLAY_SERIF = '"Instrument Serif", Georgia, "Times New Roman", serif'

export function InfoPage({
  scene,
  eyebrow,
  title,
  updated,
  children,
}: {
  scene: SceneVariant
  eyebrow: string
  title: string
  updated?: string
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        'ss-scene-dark',
        css({ position: 'relative', minHeight: '100dvh', color: 'text', bg: 'bgDeep' }),
      )}
    >
      <Scene variant={scene} scrim="page" daylight={false} />
      <div
        className={css({
          position: 'relative',
          zIndex: '1',
          maxW: '640px',
          mx: 'auto',
          px: '5',
          pt: 'calc(env(safe-area-inset-top) + 24px)',
          pb: 'calc(env(safe-area-inset-bottom) + 64px)',
        })}
      >
        <Link
          to="/"
          aria-label="Back to SmartSound"
          className={cx(
            'liquid-glass',
            css({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2',
              borderRadius: 'capsule',
              px: '4',
              py: '2.5',
              fontSize: 'footnote',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.92)',
              textDecoration: 'none',
            }),
          )}
        >
          <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
          SmartSound
        </Link>

        <p
          className={css({
            m: '0',
            mt: '9',
            fontSize: 'footnote',
            fontWeight: '600',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--ss-ink-soft)',
            textShadow: 'var(--ss-text-glow)',
          })}
        >
          {eyebrow}
        </p>
        <h1
          className={css({
            m: '0',
            mt: '2',
            fontSize: 'clamp(2.25rem, 6vw, 3.25rem)',
            fontWeight: '400',
            letterSpacing: '-0.02em',
            lineHeight: '1.08',
            color: 'text',
            textShadow: 'var(--ss-text-glow)',
          })}
          style={{ fontFamily: DISPLAY_SERIF }}
        >
          {title}
        </h1>
        {updated && (
          <p className={cx('tabular', css({ m: '0', mt: '3', fontSize: 'caption', color: 'var(--ss-ink-soft)', textShadow: 'var(--ss-text-glow)' }))}>
            {updated}
          </p>
        )}

        <div className={css({ mt: '8' })}>{children}</div>
      </div>
    </div>
  )
}

/** A titled prose section on the glass-free page — quiet, readable. */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={css({ mb: '7' })}>
      <h2
        className={css({
          m: '0',
          mb: '2.5',
          fontSize: 'title3',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          color: 'text',
          textShadow: 'var(--ss-text-glow)',
        })}
      >
        {title}
      </h2>
      <div
        className={css({
          fontSize: 'subhead',
          lineHeight: '1.65',
          color: 'var(--ss-ink-body)',
          textShadow: 'var(--ss-text-glow)',
          '& p': { m: '0', mb: '3' },
          '& ul': { m: '0', mb: '3', pl: '5' },
          '& li': { mb: '1.5' },
          '& a': { color: 'rgba(196, 181, 253, 0.95)', textDecoration: 'underline' },
        })}
      >
        {children}
      </div>
    </section>
  )
}
