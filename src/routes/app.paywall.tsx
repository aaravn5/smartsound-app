import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from 'styled-system/css'
import { stack, flex } from 'styled-system/patterns'
import { GlassButton } from '~/components/GlassButton'

/**
 * Paywall — Free / Pro / Studio, GOAT-membership style (§4.2 of the goal doc).
 * Billing itself (Stripe) is a later milestone: the CTAs here never fake a
 * purchase — they surface an honest "billing connects soon" state and let the
 * visitor return to their profile. Trigger points across the app (the daily
 * cap, a locked feature, an end-of-session upsell) deep-link here with
 * `?trigger=` for a short contextual banner.
 */
export type PaywallTrigger = 'cap' | 'locked' | 'upsell'
const VALID_TRIGGERS: readonly PaywallTrigger[] = ['cap', 'locked', 'upsell']

interface PaywallSearch {
  trigger?: PaywallTrigger
}

export const Route = createFileRoute('/app/paywall')({
  validateSearch: (search: Record<string, unknown>): PaywallSearch => {
    const t = search.trigger
    return typeof t === 'string' && (VALID_TRIGGERS as readonly string[]).includes(t) ? { trigger: t as PaywallTrigger } : {}
  },
  component: PaywallScreen,
})

const TRIGGER_COPY: Record<PaywallTrigger, string> = {
  cap: "You've used today's free 20 minutes — go Pro for unlimited sessions.",
  locked: "That's a Pro feature — unlock the full soundscape and program library.",
  upsell: 'That session worked — go Pro to make it unlimited.',
}

type BillingCycle = 'monthly' | 'annual'
type TierId = 'free' | 'pro' | 'studio'

interface Tier {
  id: TierId
  name: string
  tagline: string
  monthly: number
  annual: number
  features: string[]
  recommended?: boolean
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Genuinely useful, every day.',
    monthly: 0,
    annual: 0,
    features: [
      '1 session a day, capped at 20 minutes',
      'Core 3 soundscapes',
      'Full closed-loop camera (rPPG)',
      'Last 3 sessions of insights',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For a daily practice.',
    monthly: 9.99,
    annual: 79,
    recommended: true,
    features: [
      'Unlimited sessions',
      'All 5 soundscapes + seasonal',
      'Full insights history + trends',
      'All timed scenarios',
      'High audio fidelity',
      'Offline & background',
      '7-day free trial',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For the deepest work.',
    monthly: 19.99,
    annual: 179,
    features: [
      'Everything in Pro',
      'Custom multi-phase programs',
      'Data export',
      'Max (Studio) audio fidelity',
      'Early access to new drops',
      'Priority support',
    ],
  },
]

function savingsPct(monthly: number, annual: number): number {
  if (monthly <= 0) return 0
  return Math.round((1 - annual / (monthly * 12)) * 100)
}

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
)

function PaywallScreen() {
  const { trigger } = Route.useSearch()
  const [cycle, setCycle] = useState<BillingCycle>('annual')
  const [pendingTier, setPendingTier] = useState<TierId | null>(null)
  const [restoreNote, setRestoreNote] = useState<string | null>(null)

  return (
    <div className={stack({ gap: { base: '9', md: '12' }, pb: '10' })}>
      <header className={stack({ gap: '3', align: 'center', textAlign: 'center', pt: '2' })}>
        <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal', letterSpacing: '0.16em', textTransform: 'uppercase' })}>
          Membership
        </span>
        <h1
          className={css({
            fontFamily: 'display',
            fontWeight: '600',
            fontSize: { base: '4xl', md: '5xl' },
            letterSpacing: '-0.03em',
            lineHeight: '1.02',
            maxW: '18ch',
          })}
        >
          Go further with SmartSound
        </h1>
        <p className={css({ color: 'muted', fontSize: 'md', lineHeight: '1.55', maxW: '46ch' })}>
          Free is genuinely useful, one session a day. Pro and Studio remove the daily cap and unlock the rest of the
          instrument.
        </p>
      </header>

      {trigger && (
        <div
          role="status"
          className={flex({
            align: 'center',
            justify: 'center',
            gap: '2.5',
            mx: 'auto',
            maxW: '64ch',
            px: '5',
            py: '3',
            rounded: 'full',
            border: '1px solid token(colors.glassBorder)',
            bg: 'glassFill',
            textAlign: 'center',
          })}
        >
          <span
            aria-hidden
            className={css({ w: '1.5', h: '1.5', rounded: 'full', bg: 'signal', flexShrink: '0', boxShadow: '0 0 10px token(colors.signal)' })}
          />
          <span className={css({ fontFamily: 'mono', fontSize: 'xs', color: 'text', letterSpacing: '0.02em' })}>{TRIGGER_COPY[trigger]}</span>
        </div>
      )}

      {/* Monthly / annual toggle */}
      <div className={flex({ justify: 'center' })}>
        <div
          className={flex({
            gap: '1',
            p: '1',
            rounded: 'full',
            border: '1px solid token(colors.glassBorder)',
            bg: 'glassFill',
          })}
        >
          <GlassButton variant="pill" size="sm" selected={cycle === 'monthly'} onClick={() => setCycle('monthly')}>
            Monthly
          </GlassButton>
          <GlassButton variant="pill" size="sm" selected={cycle === 'annual'} onClick={() => setCycle('annual')}>
            Annual
            <span className={css({ color: cycle === 'annual' ? 'bg' : 'signal', fontSize: '2xs', ml: '1.5', opacity: '0.85' })}>
              save ~34%
            </span>
          </GlassButton>
        </div>
      </div>

      {/* Tier cards */}
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' },
          gap: { base: '4', md: '5' },
          alignItems: 'start',
        })}
      >
        {TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            cycle={cycle}
            pending={pendingTier === tier.id}
            onStartTrial={() => setPendingTier(tier.id)}
          />
        ))}
      </div>

      <div className={stack({ gap: '3', align: 'center', pt: '2' })}>
        <GlassButton
          variant="pill"
          size="sm"
          onClick={() => setRestoreNote("No purchase found — billing hasn't launched in this build yet.")}
        >
          Restore purchase
        </GlassButton>
        {restoreNote && (
          <p role="status" aria-live="polite" className={css({ color: 'muted', fontSize: 'xs', textAlign: 'center' })}>
            {restoreNote}
          </p>
        )}
        <div className={flex({ gap: '5', pt: '1' })}>
          <Link to="/legal" className={css({ color: 'faint', fontSize: 'xs', textDecoration: 'underline' })}>
            Terms
          </Link>
          <Link to="/legal" className={css({ color: 'faint', fontSize: 'xs', textDecoration: 'underline' })}>
            Privacy
          </Link>
        </div>
      </div>
    </div>
  )
}

function TierCard({
  tier,
  cycle,
  pending,
  onStartTrial,
}: {
  tier: Tier
  cycle: BillingCycle
  pending: boolean
  onStartTrial: () => void
}) {
  const isFree = tier.id === 'free'
  const price = cycle === 'monthly' ? tier.monthly : tier.annual
  const savings = savingsPct(tier.monthly, tier.annual)

  return (
    <div
      className={css({
        position: 'relative',
        display: 'flex',
        flexDir: 'column',
        gap: '6',
        h: 'full',
        rounded: '3xl',
        border: tier.recommended ? '1px solid token(colors.signal)' : '1px solid token(colors.glassBorder)',
        bg: 'glassFill',
        p: { base: '7', md: '8' },
        transform: { base: 'none', md: tier.recommended ? 'translateY(-14px)' : 'none' },
        boxShadow: tier.recommended
          ? '0 24px 70px color-mix(in oklab, var(--signal) 28%, transparent), var(--glass-shadow)'
          : 'var(--glass-shadow)',
      })}
      style={{ backdropFilter: 'blur(var(--glass-blur)) saturate(1.4)', WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(1.4)' }}
    >
      {tier.recommended && (
        <span
          className={css({
            position: 'absolute',
            top: '-13px',
            left: '50%',
            fontFamily: 'mono',
            fontSize: '2xs',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'bg',
            bg: 'signal',
            px: '3.5',
            py: '1.5',
            rounded: 'full',
            boxShadow: '0 6px 20px color-mix(in oklab, var(--signal) 45%, transparent)',
          })}
          style={{ transform: 'translateX(-50%)' }}
        >
          Recommended
        </span>
      )}

      <div className={stack({ gap: '1' })}>
        <h2 className={css({ fontFamily: 'display', fontWeight: '600', fontSize: '2xl', letterSpacing: '-0.01em' })}>{tier.name}</h2>
        <p className={css({ color: 'muted', fontSize: 'sm' })}>{tier.tagline}</p>
      </div>

      <div className={stack({ gap: '1' })}>
        <div className={flex({ align: 'baseline', gap: '1.5' })}>
          <span className={`tabular ${css({ fontFamily: 'display', fontWeight: '600', fontSize: '4xl', letterSpacing: '-0.02em' })}`}>
            {isFree ? '$0' : `$${price.toFixed(2)}`}
          </span>
          {!isFree && (
            <span className={css({ fontFamily: 'mono', fontSize: 'xs', color: 'muted' })}>/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
          )}
        </div>
        {!isFree && cycle === 'annual' && (
          <span className={`tabular ${css({ fontFamily: 'mono', fontSize: '2xs', color: 'signal' })}`}>
            ${(tier.annual / 12).toFixed(2)}/mo billed yearly · save {savings}%
          </span>
        )}
        {isFree && <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'faint' })}>forever</span>}
      </div>

      <ul className={stack({ gap: '2.5' })}>
        {tier.features.map((f) => (
          <li key={f} className={flex({ align: 'flex-start', gap: '2.5' })}>
            <span className={css({ color: 'signal', flexShrink: '0', mt: '0.5' })}>
              <CheckIcon />
            </span>
            <span className={css({ color: 'muted', fontSize: 'sm', lineHeight: '1.45' })}>{f}</span>
          </li>
        ))}
      </ul>

      <div className={css({ mt: 'auto', pt: '2' })}>
        {isFree ? (
          <div
            className={flex({
              align: 'center',
              justify: 'center',
              gap: '2',
              py: '2.5',
              rounded: 'full',
              border: '1px solid token(colors.hairline)',
            })}
          >
            <span className={css({ fontFamily: 'mono', fontSize: '2xs', color: 'muted', letterSpacing: '0.08em', textTransform: 'uppercase' })}>
              Your plan today
            </span>
          </div>
        ) : pending ? (
          <div className={stack({ gap: '3' })}>
            <p role="status" aria-live="polite" className={css({ color: 'muted', fontSize: 'xs', lineHeight: '1.5' })}>
              Billing isn't connected yet — Stripe checkout lands in a later update. Nothing has been charged.
            </p>
            <Link to="/app/me">
              <GlassButton variant="pill" size="sm" className={css({ width: 'full' })}>
                Back to profile
              </GlassButton>
            </Link>
          </div>
        ) : (
          <GlassButton variant="primary" size="lg" onClick={onStartTrial} className={css({ width: 'full' })}>
            Start 7-day trial
          </GlassButton>
        )}
      </div>
    </div>
  )
}
