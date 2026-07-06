import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { InfoPage } from '~/landing/InfoPage'
import { usePageTitle } from '~/lib/page-title'
import { SciencePanel } from '~/components/SciencePanel'

/**
 * /science — the landing header's Science destination: the player's honest,
 * cited SciencePanel on its own editorial page, so the mechanism disclosure
 * is reachable without entering the app.
 */
export const Route = createFileRoute('/science')({
  component: SciencePage,
})

function SciencePage() {
  usePageTitle('The Science — SmartSound')
  return (
    <InfoPage scene="ocean" eyebrow="How it works" title="The science, honestly">
      <p
        className={css({
          m: '0',
          mb: '6',
          fontSize: 'subhead',
          lineHeight: '1.65',
          color: 'var(--ss-ink-body)',
          textShadow: 'var(--ss-text-glow)',
        })}
      >
        Every mechanism SmartSound uses — and the evidence behind it — is disclosed below,
        citations included. No invented clinical claims: where the research is early, we say
        so.
      </p>
      <SciencePanel />
    </InfoPage>
  )
}
