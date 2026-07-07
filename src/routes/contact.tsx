import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { InfoPage } from '~/landing/InfoPage'
import { usePageTitle } from '~/lib/page-title'
import { useClickSound } from '~/lib/click-sound'

/**
 * /contact — a liquid-glass form that opens the visitor's OWN mail app via
 * a `mailto:` URL. Honest by construction: there is no send-message backend,
 * so nothing pretends to be one — no fake "sent!" toast, and the
 * confirmation explains exactly what happened. The support address is
 * assembled from parts in code and is NEVER rendered in visible copy.
 */
export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

// Assembled at runtime; the address must never appear in page text.
const SUPPORT_ADDRESS = ['smartsound', 'support'].join('') + '@' + 'gmail.com'

const labelCss = css({
  display: 'block',
  mb: '1.5',
  fontSize: 'footnote',
  fontWeight: '600',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ss-ink-soft)',
})

const inputCss = css({
  display: 'block',
  w: 'full',
  px: '3.5',
  border: '1px solid rgba(17,17,17,0.16)',
  borderRadius: 'control',
  background: 'rgba(17,17,17,0.05)',
  font: 'inherit',
  fontSize: 'body',
  color: 'text',
  outline: 'none',
  transition: 'border-color 160ms ease, background 160ms ease',
  _focus: { borderColor: 'mercuryBlue', background: 'rgba(17,17,17,0.08)' },
  _placeholder: { color: 'ghost' },
})

function ContactPage() {
  usePageTitle('Contact — SmartSound')
  const playClick = useClickSound()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mailtoUrl, setMailtoUrl] = useState<string | null>(null)

  const submit = () => {
    if (message.trim().length < 3) {
      setError('Write us a line or two first.')
      return
    }
    setError(null)
    playClick('primary')
    const subject = `SmartSound — message from ${name.trim() || 'a listener'}`
    const body = `${message.trim()}\n\n— ${name.trim() || 'Anonymous'}${email.trim() ? ` (${email.trim()})` : ''}`
    const url = `mailto:${SUPPORT_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setMailtoUrl(url)
    window.location.href = url
  }

  return (
    <InfoPage scene="dawn" eyebrow="Say hello" title="Contact us">
      <div className={cx('liquid-glass', css({ borderRadius: 'card' }))}>
        <form
          className={css({ px: '5', py: '5', display: 'flex', flexDirection: 'column', gap: '4' })}
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div>
            <label htmlFor="ct-name" className={labelCss}>
              Name
            </label>
            <input
              id="ct-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              className={cx(inputCss, css({ h: '50px' }))}
            />
          </div>
          <div>
            <label htmlFor="ct-email" className={labelCss}>
              Email
            </label>
            <input
              id="ct-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="So we can write back"
              className={cx(inputCss, css({ h: '50px' }))}
            />
          </div>
          <div>
            <label htmlFor="ct-message" className={labelCss}>
              Message
            </label>
            <textarea
              id="ct-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className={cx(inputCss, css({ py: '3', resize: 'vertical', minH: '120px' }))}
            />
            {error && (
              <p className={css({ m: '0', mt: '1.5', fontSize: 'caption', fontWeight: '500', color: '#DC2626' })}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={cx(
              'liquid-glass',
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minH: '52px',
                borderRadius: 'capsule',
                border: 'none',
                font: 'inherit',
                fontSize: 'headline',
                fontWeight: '600',
                color: 'text',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 160ms ease',
                _active: { transform: 'scale(0.975)' },
              }),
            )}
          >
            Open in your mail app
          </button>
        </form>
      </div>

      {mailtoUrl ? (
        <div
          data-contact-confirm
          className={css({ mt: '5', fontSize: 'subhead', lineHeight: '1.6', color: 'var(--ss-ink-body)', textShadow: 'var(--ss-text-glow)' })}
        >
          <p className={css({ m: '0' })}>
            Your mail app should be opening with the message ready to send — nothing was sent
            by this page itself.
          </p>
          <p className={css({ m: '0', mt: '2' })}>
            Didn&rsquo;t open?{' '}
            <a href={mailtoUrl} data-contact-mailto className={css({ color: 'mercuryBlue', textDecoration: 'underline' })}>
              Try again
            </a>{' '}
            — or write to us from any mail client; the compose window carries the address.
          </p>
        </div>
      ) : (
        <p className={css({ m: '0', mt: '5', fontSize: 'footnote', lineHeight: '1.6', color: 'var(--ss-ink-soft)', textShadow: 'var(--ss-text-glow)' })}>
          Submitting opens your own mail app with the message pre-filled — SmartSound has no
          message server, so your words go straight from you to us.
        </p>
      )}
    </InfoPage>
  )
}
