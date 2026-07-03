import { Section, Text } from '@react-email/components'
import { EmailLayout, styles } from './Layout'
import { c } from './theme'

export interface SessionRecapProps {
  state?: string
  minutes?: number
  adherencePct?: number
  steadinessTrend?: 'up' | 'flat' | 'down'
}

const trendWord = { up: 'steadier', flat: 'held steady', down: 'less steady' } as const

export default function SessionRecap({
  state = 'Deep Focus',
  minutes = 25,
  adherencePct = 78,
  steadinessTrend = 'up',
}: SessionRecapProps) {
  return (
    <EmailLayout preview={`${state} · ${minutes} min · ${adherencePct}% in target`}>
      <Text style={styles.h1}>Session recap</Text>
      <Text style={styles.p}>
        {minutes} minutes of <strong>{state}</strong>. Here's the honest readout — no vanity numbers.
      </Text>
      <Section style={{ borderTop: `1px solid ${c.line}`, paddingTop: '14px' }}>
        <Text style={styles.readout}>IN-TARGET ADHERENCE · {adherencePct}%</Text>
        <Text style={styles.muted}>Share of the session your measured arousal sat within your target band.</Text>
        <Text style={styles.readout}>STEADINESS · {trendWord[steadinessTrend]}</Text>
        <Text style={styles.muted}>A relative trend from your camera signal — not a clinical HRV figure.</Text>
      </Section>
      <Text style={styles.muted}>Effects are individual and build with practice. Same time tomorrow?</Text>
    </EmailLayout>
  )
}
