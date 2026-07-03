import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'
import { c, font } from './theme'

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: c.ink, color: c.mist, fontFamily: font.body, margin: 0, padding: '32px 0' }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '0 24px' }}>
          <Section style={{ paddingBottom: '8px' }}>
            <Text style={{ fontFamily: font.display, fontWeight: 600, fontSize: '18px', color: c.mist, margin: 0 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, backgroundColor: c.signal, marginRight: 8 }} />
              SmartSound
            </Text>
          </Section>
          <Section
            style={{ backgroundColor: c.surface, borderRadius: '16px', border: `1px solid ${c.line}`, padding: '28px' }}
          >
            {children}
          </Section>
          <Hr style={{ borderColor: c.line, margin: '24px 0 12px' }} />
          <Text style={{ fontFamily: font.mono, fontSize: '11px', color: c.haze, margin: 0 }}>
            SmartSound · a wellness tool, not a medical device.{' '}
            <Link href="{{unsubscribe_url}}" style={{ color: c.haze, textDecoration: 'underline' }}>
              Manage emails
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const styles = {
  h1: { fontFamily: font.display, fontWeight: 600, fontSize: '22px', color: c.mist, margin: '0 0 12px' },
  p: { fontSize: '15px', lineHeight: '1.5', color: c.mist, margin: '0 0 14px' },
  muted: { fontSize: '13px', lineHeight: '1.5', color: c.haze, margin: '0 0 14px' },
  button: {
    backgroundColor: c.signal,
    color: c.ink,
    fontFamily: font.display,
    fontWeight: 500,
    fontSize: '14px',
    borderRadius: '10px',
    padding: '12px 20px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  readout: { fontFamily: font.mono, fontSize: '13px', color: c.signal, margin: '0 0 6px' },
} as const
