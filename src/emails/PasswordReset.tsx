import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, styles } from './Layout'

export interface PasswordResetProps {
  resetUrl?: string
  minutesValid?: number
}

export default function PasswordReset({ resetUrl = 'https://smartsound.live/reset?token=…', minutesValid = 30 }: PasswordResetProps) {
  return (
    <EmailLayout preview="Reset your SmartSound password.">
      <Text style={styles.h1}>Reset your password.</Text>
      <Text style={styles.p}>
        Use the button below to set a new password. The link is valid for {minutesValid} minutes. If you didn't request
        this, you can safely ignore it — nothing changes.
      </Text>
      <Section style={{ paddingTop: '6px' }}>
        <Button href={resetUrl} style={styles.button}>Set a new password</Button>
      </Section>
      <Text style={styles.muted}>If the button doesn't work, copy this link into your browser: {resetUrl}</Text>
    </EmailLayout>
  )
}
