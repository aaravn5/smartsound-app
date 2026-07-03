import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, hstack, flex } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'
import { useEngine } from '~/lib/engine-context'
import { prefersReducedMotion } from '~/design/signal'

/**
 * Me — profile, membership, session history, settings (Milestone 2). No auth
 * backend yet (§3 of the goal doc is a later milestone), so identity and
 * cross-session history are honestly labelled rather than faked.
 */
export const Route = createFileRoute('/app/me')({
  component: MeScreen,
})

const GRID = 5
function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function PixelAvatar({ seed = 'smartsound-guest', size = 76 }: { seed?: string; size?: number }) {
  const cell = Math.max(4, Math.round(size / GRID / 4) * 4)
  const bits = useMemo(() => {
    const h = hashSeed(seed)
    const rows: boolean[][] = []
    for (let r = 0; r < GRID; r++) {
      const row: boolean[] = []
      for (let c = 0; c < 3; c++) {
        const on = ((h >> (r * 3 + c)) & 1) === 1
        row[c] = on
        row[GRID - 1 - c] = on
      }
      rows.push(row)
    }
    return rows
  }, [seed])

  return (
    <div
      aria-hidden
      className={css({ rounded: '2xl', overflow: 'hidden', border: '1px solid token(colors.glassBorder)', flexShrink: '0' })}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${cell}px)`, gridTemplateRows: `repeat(${GRID}, ${cell}px)`, background: 'rgba(255,255,255,0.05)' }}
    >
      {bits.flatMap((row, r) =>
        row.map((on, c) => <span key={`${r}-${c}`} style={{ background: on ? 'var(--signal)' : 'transparent' }} />),
      )}
    </div>
  )
}

function Row({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={stack({ gap: '3', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
      <div className={flex({ justify: 'space-between', align: 'center', gap: '4', wrap: 'wrap' })}>
        <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: 'lg' })}>{title}</h2>
        {action}
      </div>
      <div className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.55' })}>{children}</div>
    </section>
  )
}

function MeScreen() {
  const { bioStatus, startAttune, stopAttune, clearHistory, getArousalHistory } = useEngine()
  const attuned = bioStatus === 'active'
  const reduced = prefersReducedMotion()
  const [signOutNote, setSignOutNote] = useState<string | null>(null)

  const history = getArousalHistory()
  const sessionMinutes = history.length > 1 ? (history[history.length - 1].t - history[0].t) / 60_000 : 0

  return (
    <div className={stack({ gap: '8' })}>
      {/* Profile header */}
      <header className={flex({ gap: '5', align: 'center' })}>
        <PixelAvatar />
        <div className={stack({ gap: '1' })}>
          <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '2xl', md: '3xl' }, letterSpacing: '-0.02em' })}>
            Your profile
          </h1>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.06em' })}>
            SIGNED OUT · SIGN-IN LAUNCHES IN A LATER UPDATE
          </span>
        </div>
      </header>

      {/* Streak */}
      <section className={hstack({ gap: '6', p: '6', bg: 'panel', border: '1px solid token(colors.hairline)', rounded: '2xl' })}>
        <div className={stack({ gap: '0.5' })}>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>STREAK</span>
          <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl' })}`}>—</span>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint' })}>begins once sessions persist</span>
        </div>
        <div className={stack({ gap: '0.5' })}>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}>THIS SESSION</span>
          <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl' })}`}>
            {sessionMinutes > 0 ? sessionMinutes.toFixed(1) : '0.0'}
          </span>
          <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint' })}>minutes logged</span>
        </div>
      </section>

      {/* Membership */}
      <section
        className={css({
          position: 'relative',
          overflow: 'hidden',
          rounded: '3xl',
          border: '1px solid token(colors.glassBorder)',
          bg: 'panel',
          p: { base: '6', md: '8' },
        })}
        style={{ backgroundImage: 'radial-gradient(120% 140% at 100% -10%, color-mix(in oklab, var(--signal) 20%, transparent), transparent 62%)' }}
      >
        <div className={stack({ gap: '4' })}>
          <div className={flex({ justify: 'space-between', align: 'flex-start', wrap: 'wrap', gap: '3' })}>
            <div className={stack({ gap: '1' })}>
              <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.14em', textTransform: 'uppercase' })}>
                Membership
              </span>
              <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.02em' })}>Free</h2>
            </div>
            <Link to="/app/paywall" search={{ trigger: 'upsell' }}>
              <GlassButton variant="primary">Go Pro</GlassButton>
            </Link>
          </div>
          <p className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.5', maxW: '48ch' })}>
            One 20-minute session a day, the core three soundscapes, and full closed-loop biofeedback. Pro unlocks unlimited sessions, the full soundscape library, and complete insights history.
          </p>
        </div>
      </section>

      {/* Session history */}
      <Row title="Session history">
        {history.length > 0 ? (
          <div
            className={flex({
              justify: 'space-between',
              align: 'center',
              p: '3',
              rounded: 'lg',
              border: '1px solid token(colors.hairline)',
            })}
          >
            <span className={css({ color: 'text', fontSize: 'sm' })}>Current session</span>
            <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted' })}`}>
              {sessionMinutes.toFixed(1)} min · {history.length} samples
            </span>
          </div>
        ) : (
          <span>No sessions yet — run one from Now and it'll appear here.</span>
        )}
      </Row>

      {/* Settings */}
      <Row
        title="Camera & privacy"
        action={
          <GlassButton variant={attuned ? 'pill' : 'primary'} selected={attuned} size="sm" onClick={() => (attuned ? stopAttune() : void startAttune())}>
            {attuned ? 'Turn off Attune' : 'Enable Attune'}
          </GlassButton>
        }
      >
        SmartSound reads your pulse from the front camera to tune the sound to you. Every frame is processed on-device —{' '}
        <strong className={css({ color: 'text' })}>no video is ever uploaded</strong>. Status:{' '}
        <span className={css({ color: attuned ? 'signal' : 'muted', fontFamily: 'mono', fontSize: '2xs' })}>{bioStatus.toUpperCase()}</span>.
      </Row>

      <Row title="Motion">
        The ring respects your system's <em>Reduce Motion</em> setting — with it on, it becomes a static gauge, never losing function. Currently
        detected:{' '}
        <span className={css({ color: 'text', fontFamily: 'mono', fontSize: '2xs' })}>{reduced ? 'REDUCE MOTION ON' : 'REDUCE MOTION OFF'}</span>.
      </Row>

      <Row title="Your data" action={<GlassButton variant="pill" size="sm" onClick={clearHistory}>Clear session data</GlassButton>}>
        This build keeps everything in memory on this device. Nothing is stored on a server and nothing persists once you close the tab.
      </Row>

      <Row
        title="Account"
        action={
          <GlassButton variant="pill" size="sm" onClick={() => setSignOutNote("There's no account signed in yet — sign-in ships in a later update.")}>
            Sign out
          </GlassButton>
        }
      >
        {signOutNote ?? 'Google and Apple sign-in are on the roadmap; this build runs fully signed-out.'}
      </Row>
    </div>
  )
}
