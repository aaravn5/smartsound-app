import { createFileRoute, Link } from '@tanstack/react-router'
import { InfoPage, InfoSection } from '~/landing/InfoPage'
import { usePageTitle } from '~/lib/page-title'

/**
 * /privacy — the honest privacy page. Everything here describes what the
 * app ACTUALLY does today: on-device camera analysis, localStorage-only
 * data, no accounts server, no analytics. No boilerplate claims about
 * infrastructure that doesn't exist.
 */
export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  usePageTitle('Privacy Policy — SmartSound')
  return (
    <InfoPage scene="forest" eyebrow="Legal" title="Privacy Policy" updated="Updated July 2026">
      <InfoSection title="The short version">
        <p>
          SmartSound runs in your browser and keeps everything on your device. There is no
          account server, no analytics, and no data pipeline behind it — this page is short
          because there is genuinely little to disclose.
        </p>
      </InfoSection>

      <InfoSection title="Your camera stays on your device">
        <p>
          Attune, the optional pulse feature, analyzes your camera feed entirely on-device to
          estimate heart rate from subtle skin-tone changes (rPPG). Frames are processed in
          memory and discarded — they are never uploaded, stored, or shared. The camera only
          runs while you have Attune switched on, and your browser's permission prompt is the
          gate.
        </p>
      </InfoSection>

      <InfoSection title="What we store, and where">
        <p>
          Everything SmartSound remembers lives in this browser's local storage on your device:
        </p>
        <ul>
          <li>Your account — a name and email you typed, stored locally only. There is no accounts server yet; nothing is transmitted.</li>
          <li>Preferences — theme, sound effects, scene choice, favorites.</li>
          <li>Session history — recently played modes and daily usage minutes.</li>
        </ul>
        <p>
          Clearing your browser's site data removes all of it. We can't recover it — we never
          had it.
        </p>
      </InfoSection>

      <InfoSection title="Wellness, not medicine">
        <p>
          SmartSound is a wellness product. Its soundscapes and pulse estimates are for
          relaxation and focus support only — they are not medical measurements, and nothing
          here diagnoses, treats, or prevents any condition. If you have concerns about your
          heart rate or sleep, talk to a clinician, not an app.
        </p>
      </InfoSection>

      <InfoSection title="Questions">
        <p>
          Write to us through the <Link to="/contact">contact page</Link> — it opens your own
          mail app, so even your message to us starts on your device. See also our{' '}
          <Link to="/terms">Terms of Use</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
