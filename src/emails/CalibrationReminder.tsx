import { Button, Section, Text } from '@react-email/components'
import { EmailLayout, styles } from './Layout'

export interface CalibrationReminderProps {
  sessionUrl?: string
  daysSince?: number
}

export default function CalibrationReminder({ sessionUrl = 'https://smartsound.live/app/now', daysSince = 5 }: CalibrationReminderProps) {
  return (
    <EmailLayout preview="A quick check-in keeps the loop learning.">
      <Text style={styles.h1}>Keep the loop learning.</Text>
      <Text style={styles.p}>
        It's been {daysSince} days since your last check-in. A two-tap rating of how the work felt is how SmartSound
        keeps tuning to <em>you</em> instead of drifting back toward an average.
      </Text>
      <Text style={styles.muted}>Run a session and answer the one question when it appears — that's the whole ask.</Text>
      <Section style={{ paddingTop: '6px' }}>
        <Button href={sessionUrl} style={styles.button}>Run a session</Button>
      </Section>
    </EmailLayout>
  )
}
