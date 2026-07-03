import { render } from '@react-email/render'
import type { ReactElement } from 'react'

/** Render a template to HTML (for preview, testing, or sending). */
export function renderEmail(el: ReactElement): Promise<string> {
  return render(el)
}

export interface SendParams {
  to: string
  subject: string
  react: ReactElement
  from?: string
}

function resendKey(): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return g.process?.env?.RESEND_API_KEY
}

/**
 * Send via Resend (§10). If no RESEND_API_KEY is configured we throw rather than
 * pretend to send — §0 forbids fake output. Wire the key to enable sending.
 */
export async function sendEmail({ to, subject, react, from = 'SmartSound <hello@smartsound.live>' }: SendParams): Promise<{ id: string }> {
  const key = resendKey()
  const html = await render(react)
  if (!key) {
    throw new Error('RESEND_API_KEY not set — refusing to fake a send. Configure it to enable email.')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`)
  return (await res.json()) as { id: string }
}
