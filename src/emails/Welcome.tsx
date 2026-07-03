import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, styles } from './Layout'

export interface WelcomeProps {
  baselineHr?: number
  sessionUrl?: string
}

export default function Welcome({ baselineHr = 62, sessionUrl = 'https://smartsound.live/app/session' }: WelcomeProps) {
  return (
    <EmailLayout preview="Your baseline is captured — here's your first session.">
      <Text style={styles.h1}>Your baseline is set.</Text>
      <Text style={styles.p}>
        SmartSound read your resting rhythm at <strong>{Math.round(baselineHr)} bpm</strong>. From now on every session
        measures you against your own numbers — not an average — and steers the sound to move you where you're headed.
      </Text>
      <Text style={styles.muted}>One next step: run a Focus session and let the loop learn how you settle.</Text>
      <Section style={{ paddingTop: '6px' }}>
        <Button href={sessionUrl} style={styles.button}>Begin a session</Button>
      </Section>
    </EmailLayout>
  )
}
