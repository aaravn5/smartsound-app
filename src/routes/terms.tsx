import { createFileRoute, Link } from '@tanstack/react-router'
import { InfoPage, InfoSection } from '~/landing/InfoPage'
import { usePageTitle } from '~/lib/page-title'

/**
 * /terms — honest terms for what SmartSound actually is today: a local-first
 * wellness app with a virtual, on-device account and a UX-level free tier.
 */
export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  usePageTitle('Terms of Use — SmartSound')
  return (
    <InfoPage scene="dusk" eyebrow="Legal" title="Terms of Use" updated="Updated July 2026">
      <InfoSection title="What SmartSound is">
        <p>
          SmartSound is a neuroacoustic wellness app: generative soundscapes whose rhythm and
          texture are tuned toward focus, flow, calm, or sleep, optionally steered by an
          on-device pulse estimate. It is offered as-is, in active development, and things may
          change or break.
        </p>
      </InfoSection>

      <InfoSection title="Not medical advice">
        <p>
          SmartSound is not a medical device and makes no clinical claims. Pulse readings are
          estimates for the soundscape's benefit, not measurements you should act on. Don't use
          SmartSound while driving or in situations that need your full attention, and consult
          a clinician for anything health-related.
        </p>
      </InfoSection>

      <InfoSection title="Your account is on your device">
        <p>
          Creating an account stores a name and email in this browser only — there is no
          server, no password, and no sync yet. If you clear your browser data or switch
          devices, the account and its history don't follow you. When accounts sync ships,
          these terms will be updated to describe it.
        </p>
      </InfoSection>

      <InfoSection title="Plans and the free tier">
        <p>
          The free tier's daily session allowance and the Pro/Studio plans shown in the app are
          currently a client-side preview of the intended pricing — there is no payment
          processing yet, and no money changes hands inside the app today.
        </p>
      </InfoSection>

      <InfoSection title="Fair use">
        <p>
          The soundscapes, artwork, and design are ours; personal listening is what they're
          for. Please don't rip, resell, or rebadge them.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Questions about these terms? Reach us through the{' '}
          <Link to="/contact">contact page</Link>. Our data practices live in the{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
