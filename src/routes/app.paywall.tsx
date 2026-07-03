import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'

/** Pro/Studio paywall — stubbed for Milestone 2; billing lands in a later milestone. */
export const Route = createFileRoute('/app/paywall')({
  component: PaywallScreen,
})

function PaywallScreen() {
  return (
    <div className={stack({ gap: '4', align: 'center', justify: 'center', minH: '60vh', textAlign: 'center' })}>
      <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.16em', textTransform: 'uppercase' })}>
        Pro &amp; Studio
      </span>
      <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em' })}>
        Coming soon
      </h1>
      <p className={css({ color: 'muted', maxW: '42ch', lineHeight: '1.55' })}>
        Billing and the full Pro/Studio membership flow are landing in a later update. Free stays genuinely useful in the meantime.
      </p>
      <Link to="/app/me">
        <GlassButton variant="pill">Back to profile</GlassButton>
      </Link>
    </div>
  )
}
