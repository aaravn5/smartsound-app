import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'

/**
 * Terms & Privacy — stub. The paywall (Milestone 4) and landing link here;
 * real legal copy lands with billing (§4.4/§9 of the goal doc). Honest
 * placeholder rather than fabricated legal text.
 */
export const Route = createFileRoute('/legal')({
  component: LegalScreen,
})

function LegalScreen() {
  return (
    <div
      className={css({
        minH: '100dvh',
        bg: 'bgBase',
        color: 'text',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: '6',
        py: '16',
      })}
    >
      <div className={stack({ gap: '5', maxW: '52ch', textAlign: 'center', align: 'center' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.16em', textTransform: 'uppercase' })}>
          Terms &amp; Privacy
        </span>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: { base: '3xl', md: '4xl' }, letterSpacing: '-0.02em' })}>
          Coming with billing
        </h1>
        <p className={css({ color: 'muted', lineHeight: '1.6' })}>
          SmartSound's Terms of Service and Privacy Policy publish alongside real billing (Stripe checkout, a later
          milestone). What's true today: camera frames process on-device and are never uploaded — see the Camera &amp;
          privacy section in <strong className={css({ color: 'text' })}>Me</strong>.
        </p>
        <Link to="/app/me">
          <GlassButton variant="pill">Back to profile</GlassButton>
        </Link>
      </div>
    </div>
  )
}
