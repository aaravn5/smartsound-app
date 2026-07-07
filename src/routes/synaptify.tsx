import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { SynaptifyBrain } from '~/landing/SynaptifyBrain'
import { usePageTitle } from '~/lib/page-title'

/**
 * `/synaptify` — the Dala-idiom landing, rebuilt for Synaptify.
 *
 * A pure-black void where a single Electric-Iris violet accent and amber sparks
 * float. Monolithic weight-400 headlines at outsized scale carry hierarchy
 * through scale + tracking, never weight; ultra-light (200) body copy reads
 * airy. The hero is the signature morphing triangle-particle brain — knowledge
 * as distributed neural intelligence. Self-contained dark surface, independent
 * of the app's light theme.
 */
export const Route = createFileRoute('/synaptify')({
  component: SynaptifyLanding,
})

// ── Dala tokens (self-contained; not the app's light Panda tokens) ──
const VOID = '#000000'
const IRIS = '#8052ff'
const AMBER = '#ffb829'
const WHITE = '#ffffff'
const ASH = '#9a9a9a'
const MIST = '#bdbdbd'
const FONT =
  '"PP Neue Montreal", "Neue Montreal", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

const page = css({
  position: 'relative',
  minH: '100dvh',
  bg: 'transparent',
  color: 'transparent', // real colors set inline below
  overflowX: 'hidden',
})

const shell = css({
  maxW: '1280px',
  mx: 'auto',
  px: { base: '24px', md: '48px' },
})

// ── Kinetic headline — letters fade+rise on a stagger ──
function Kinetic({ text, size, tracking, delay = 0 }: { text: string; size: string; tracking: string; delay?: number }) {
  return (
    <h2
      className={css({ m: '0', fontWeight: '400', lineHeight: '1.05' })}
      style={{ fontFamily: FONT, fontSize: size, letterSpacing: tracking, color: WHITE }}
    >
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className={css({
            display: 'inline-block',
            animation: 'lq-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) backwards',
            whiteSpace: 'pre',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          })}
          style={{ animationDelay: `${delay + i * 0.028}s` }}
        >
          {ch}
        </span>
      ))}
    </h2>
  )
}

const amberLabel = css({
  m: '0',
  mb: '18px',
  fontWeight: '600',
  fontSize: '14px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
})

const bodyCopy = css({
  m: '0',
  maxW: '32rem',
  fontWeight: '200',
  fontSize: '18px',
  lineHeight: '1.5',
})

function IrisPill({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        px: '22px',
        py: '14px',
        borderRadius: '9999px',
        fontWeight: '600',
        fontSize: '14px',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform 160ms ease, filter 200ms ease',
        _hover: { filter: 'brightness(1.12)' },
        _active: { transform: 'scale(0.97)' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', _active: { transform: 'none' } },
      })}
      style={{ background: IRIS, color: WHITE, fontFamily: FONT }}
    >
      {children}
    </a>
  )
}

// ── The loading overlay — counts 0 → 100, then dissolves ──
function LoadingOverlay() {
  const [pct, setPct] = useState(0)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPct(100)
      setGone(true)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1500
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else window.setTimeout(() => setGone(true), 350)
    }
    raf = requestAnimationFrame(tick)
    // Hard fallback — rAF pauses on hidden/backgrounded tabs, so never trap the
    // user behind the overlay: dismiss on a wall-clock timer no matter what.
    const fallback = window.setTimeout(() => {
      setPct(100)
      setGone(true)
    }, 2200)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
  }, [])
  if (gone) return null
  return (
    <div
      aria-hidden
      className={css({
        position: 'fixed',
        inset: '0',
        zIndex: '50',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'opacity 350ms ease',
      })}
      style={{ background: VOID, opacity: pct >= 100 ? 0 : 1, fontFamily: FONT }}
    >
      <span style={{ color: ASH, fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
        {pct >= 100 ? 'Completed' : 'Loading'}
      </span>
      <span
        className={css({ fontWeight: '400' })}
        style={{ color: WHITE, fontSize: '78px', letterSpacing: '-0.04em', fontFamily: FONT }}
      >
        {pct}
      </span>
    </div>
  )
}

function Nav() {
  const link = css({
    fontWeight: '600',
    fontSize: '14px',
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    transition: 'color 200ms ease',
    _hover: { color: WHITE },
  })
  return (
    <nav
      className={cx(
        shell,
        css({
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          w: 'full',
          zIndex: '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: '28px',
        }),
      )}
    >
      <div className={css({ display: 'flex', alignItems: 'center', gap: '12px' })}>
        <TriangleMark />
        <span style={{ color: WHITE, fontFamily: FONT, fontSize: '20px', letterSpacing: '-0.02em' }}>Synaptify</span>
      </div>
      <div className={css({ display: { base: 'none', md: 'flex' }, alignItems: 'center', gap: '30px' })}>
        <a href="#manifesto" className={link} style={{ color: ASH, fontFamily: FONT }}>Manifesto</a>
        <a href="#team" className={link} style={{ color: ASH, fontFamily: FONT }}>Team</a>
        <IrisPill href="https://synaptify.ai">Request access</IrisPill>
      </div>
    </nav>
  )
}

function TriangleMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="synmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={IRIS} />
          <stop offset="1" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M12 2.5 22 20H2z" fill="url(#synmark)" />
    </svg>
  )
}

function SectionBlock({
  label,
  headline,
  size,
  tracking,
  body,
  align = 'left',
  id,
}: {
  label: string
  headline: string
  size: string
  tracking: string
  body: React.ReactNode
  align?: 'left' | 'right'
  id?: string
}) {
  return (
    <section
      id={id}
      className={cx(
        shell,
        css({
          py: { base: '60px', md: '120px' },
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
          gap: { base: '24px', md: '60px' },
          alignItems: 'center',
        }),
      )}
    >
      <div className={css({ order: align === 'right' ? { base: 0, md: 2 } : 0 })}>
        <p className={amberLabel} style={{ color: AMBER, fontFamily: FONT }}>{label}</p>
        <Kinetic text={headline} size={size} tracking={tracking} />
      </div>
      <div style={{ color: MIST, fontFamily: FONT }} className={bodyCopy}>
        {body}
      </div>
    </section>
  )
}

function SynaptifyLanding() {
  usePageTitle('Synaptify — unlock collective intelligence')
  const heroBrainRef = useRef<HTMLDivElement>(null)

  return (
    <div className={page} style={{ background: VOID }}>
      <LoadingOverlay />
      <Nav />

      {/* ── Hero — headline left, morphing triangle-brain right ── */}
      <section
        className={cx(
          shell,
          css({
            position: 'relative',
            minH: '100dvh',
            display: 'grid',
            gridTemplateColumns: { base: '1fr', md: '1.05fr 0.95fr' },
            alignItems: 'center',
            gap: '24px',
            pt: { base: '120px', md: '0' },
          }),
        )}
      >
        <div className={css({ position: 'relative', zIndex: '2' })}>
          <p className={amberLabel} style={{ color: AMBER, fontFamily: FONT }}>Synaptify</p>
          <Kinetic
            text="Unlock collective"
            size="clamp(3rem, 8vw, 7rem)"
            tracking="-0.04em"
          />
          <Kinetic
            text="intelligence."
            size="clamp(3rem, 8vw, 7rem)"
            tracking="-0.04em"
            delay={0.18}
          />
          <p
            className={cx(bodyCopy, css({ mt: '30px' }))}
            style={{ color: WHITE, fontFamily: FONT }}
          >
            Stop managing knowledge. Start firing on it. Synaptify wires every
            mind, doc and decision across your team into one living neural source
            of truth — ask it anything and get the answer with context,
            conviction and clarity.
          </p>
          <div className={css({ mt: '36px' })}>
            <IrisPill href="https://synaptify.ai">Request access</IrisPill>
          </div>
        </div>

        {/* The signature: thousands of triangles morphing between forms. */}
        <div
          ref={heroBrainRef}
          className={css({
            position: { base: 'absolute', md: 'relative' },
            inset: { base: '0', md: 'auto' },
            zIndex: '1',
            w: 'full',
            h: { base: '100%', md: 'min(78vh, 680px)' },
            opacity: { base: 0.4, md: 1 },
            pointerEvents: 'none',
          })}
        >
          <SynaptifyBrain className={css({ w: 'full', h: 'full' })} />
        </div>
      </section>

      {/* ── Zigzag sections — Synaptify-apt copy ── */}
      <SectionBlock
        id="manifesto"
        label="Make decisions with confidence"
        headline="Every synapse, connected."
        size="clamp(2.2rem, 5vw, 3.4rem)"
        tracking="-0.03em"
        body={
          <>
            Synaptify's neural search fires across every system your organisation
            runs — instantly surfacing the knowledge and the people you need. Take
            the guesswork out of your work.
          </>
        }
      />

      <SectionBlock
        label="Spark lightbulb moments"
        headline="A real-time source of truth."
        size="clamp(2.2rem, 5vw, 3.4rem)"
        tracking="-0.03em"
        align="right"
        body={
          <>
            We connect your tools behind the scenes and pull exactly the context
            you need into one elegant view. Just ask Synaptify for the answer that
            advances your work — and decide with more confidence.
          </>
        }
      />

      <SectionBlock
        id="team"
        label="Build a better world of work"
        headline="From doing more to being better."
        size="clamp(2.2rem, 5vw, 3.4rem)"
        tracking="-0.03em"
        body={
          <>
            Your most purposeful moments at work are when you're in flow —
            intellectually stimulated, creating real value. Synaptify recreates
            that every time: a tool completely integrated with how you think, feel
            and work.
          </>
        }
      />

      {/* ── Closing CTA ── */}
      <section
        className={cx(
          shell,
          css({
            py: { base: '96px', md: '160px' },
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '30px',
          }),
        )}
      >
        <Kinetic
          text="Your team already knows."
          size="clamp(2.4rem, 6vw, 4.2rem)"
          tracking="-0.04em"
        />
        <p className={bodyCopy} style={{ color: ASH, fontFamily: FONT, textAlign: 'center' }}>
          Ask Synaptify to find it.
        </p>
        <IrisPill href="https://synaptify.ai">Request access</IrisPill>
      </section>

      {/* ── Footer ── */}
      <footer
        className={cx(
          shell,
          css({
            py: '48px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }),
        )}
      >
        <div className={css({ display: 'flex', alignItems: 'center', gap: '10px' })}>
          <TriangleMark />
          <span style={{ color: ASH, fontFamily: FONT, fontSize: '13px' }}>
            © 2026 Synaptify. All rights reserved.
          </span>
        </div>
        <div className={css({ display: 'flex', gap: '24px' })}>
          {['Manifesto', 'Team', 'Privacy', 'Terms'].map((l) => (
            <span key={l} style={{ color: ASH, fontFamily: FONT, fontSize: '13px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  )
}
