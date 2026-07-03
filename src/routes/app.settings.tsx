import { createFileRoute } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, flex } from 'styled-system/patterns'
import { useEngine } from '~/lib/engine-context'
import { Button } from '~/components/ui/Button'
import { prefersReducedMotion } from '~/design/signal'

export const Route = createFileRoute('/app/settings')({
  component: SettingsScreen,
})

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

function SettingsScreen() {
  const { bioStatus, startAttune, stopAttune, clearHistory } = useEngine()
  const attuned = bioStatus === 'active'
  const reduced = prefersReducedMotion()

  return (
    <div className={stack({ gap: '5', maxW: '760px', mx: 'auto' })}>
      <div className={stack({ gap: '1' })}>
        <h1 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '3xl', letterSpacing: '-0.01em' })}>Settings</h1>
        <p className={css({ color: 'muted' })}>Camera, privacy, motion, and your data.</p>
      </div>

      <Row
        title="Camera & privacy"
        action={
          <Button variant={attuned ? 'outline' : 'primary'} size="sm" onClick={() => (attuned ? stopAttune() : void startAttune())}>
            {attuned ? 'Turn off Attune' : 'Enable Attune'}
          </Button>
        }
      >
        SmartSound reads your pulse from the front camera to tune the sound to you. Every frame is processed on-device and drawn to a small in-memory canvas — <strong className={css({ color: 'text' })}>no video is ever uploaded</strong>. Open your browser's network tab while a session runs: you'll see no image data leave the page. Status: <span className={css({ color: attuned ? 'signal' : 'muted', fontFamily: 'mono', fontSize: '2xs' })}>{bioStatus.toUpperCase()}</span>.
      </Row>

      <Row title="Motion">
        The signature ring is data-bound. SmartSound respects your system's <em>Reduce Motion</em> setting — with it on, the ring becomes a static gauge with a numeric readout, never losing function. Currently detected: <span className={css({ color: 'text', fontFamily: 'mono', fontSize: '2xs' })}>{reduced ? 'REDUCE MOTION ON' : 'REDUCE MOTION OFF'}</span>.
      </Row>

      <Row title="Your data" action={<Button variant="danger" size="sm" onClick={clearHistory}>Clear session data</Button>}>
        This build keeps everything in memory on this device — baselines, arousal history, preferences. Nothing is stored on a server and nothing persists once you close the tab. Clearing removes this session's arousal history immediately.
      </Row>

      <Row title="Email">
        Session recaps, calibration reminders, and streak nudges are built as real templates (React Email) and honor opt-out. Actually sending them needs a Resend API key configured by the operator — until then, nothing is sent.
      </Row>
    </div>
  )
}
