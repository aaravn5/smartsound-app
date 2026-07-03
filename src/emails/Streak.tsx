import { Text } from '@react-email/components'
import { EmailLayout, styles } from './Layout'

export interface StreakProps {
  days?: number
}

export default function Streak({ days = 4 }: StreakProps) {
  return (
    <EmailLayout preview={`${days} days of showing up.`}>
      <Text style={styles.h1}>{days} days, quietly.</Text>
      <Text style={styles.p}>
        {days} sessions in a row. No confetti — just a note that the practice is taking hold, which is when the loop's
        calibration starts to really fit you.
      </Text>
      <Text style={styles.muted}>Not useful? You can turn cadence emails off any time from the link below.</Text>
    </EmailLayout>
  )
}
