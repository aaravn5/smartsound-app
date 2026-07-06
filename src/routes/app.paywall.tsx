import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { SettingsGroup, SettingsRow } from '~/components/SettingsList'
import { useClickSound } from '~/lib/click-sound'
import { FREE_DAILY_MIN, FREE_DAILY_SESSIONS } from '~/lib/entitlements'

/**
 * Paywall — Free vs Pro vs Studio, Calm-serene and honest. No fake urgency
 * (no countdown timers, no "price goes up tomorrow"), no dark patterns: the
 * close button is exactly as prominent as the CTAs, "Restore purchase" and
 * the legal links are real rows (not decorative), and every price shown is
 * the real price — annual's "save X%" is computed from the tier's own
 * numbers, not a made-up discount badge.
 *
 * Checkout itself isn't wired to a payment processor in this build (see
 * `lib/api.ts` — `billingCheckout` is scaffolded for a later milestone), so
 * the CTAs say so plainly rather than pretending to complete a purchase.
 * That mirrors the same honesty policy as `entitlements.ts`: never fake a
 * result the app can't actually deliver yet.
 */

interface PaywallSearch {
  /** Mirrors `isCapReached`'s `reason: 'cap'` in `lib/api.ts` — how the
   * listener got here, so the hero can explain *why* instead of just *what*. */
  reason?: 'cap'
}

export const Route = createFileRoute('/app/paywall')({
  validateSearch: (search: Record<string, unknown>): PaywallSearch => ({
    reason: search.reason === 'cap' ? 'cap' : undefined,
  }),
  component: PaywallScreen,
})

type Interval = 'month' | 'year'

interface Tier {
  id: 'pro' | 'studio'
  name: string
  monthly: number
  annual: number
  tagline: string
  features: string[]
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    id: 'pro',
    name: 'Pro',
    monthly: 9.99,
    annual: 79,
    tagline: 'Unlimited, everyday SmartSound.',
    featured: true,
    features: [
      'Unlimited sessions, every day',
      'All soundscapes and scenarios',
      'Full session history & insights',
      'Every session length, including open-ended',
      'Priority support',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthly: 19.99,
    annual: 179,
    tagline: 'For practitioners and sound designers.',
    features: [
      'Everything in Pro',
      'Multiple client / listener profiles',
      'Data export',
      'Custom session length & phasing',
      'Early access to new engine features',
    ],
  },
]

interface FeatureRow {
  label: string
  free: string | boolean
  pro: string | boolean
  studio: string | boolean
}

const FEATURE_ROWS: FeatureRow[] = [
  { label: 'Daily sessions', free: `${FREE_DAILY_SESSIONS} / day · ${FREE_DAILY_MIN} min`, pro: 'Unlimited', studio: 'Unlimited' },
  { label: 'Soundscapes & scenarios', free: 'Core 5', pro: 'All, unlocked', studio: 'All, unlocked' },
  { label: 'Attune camera biofeedback', free: true, pro: true, studio: true },
  { label: 'Session history & insights', free: 'Last 3 sessions', pro: 'Full history', studio: 'Full history' },
  { label: 'Session lengths', free: '10 · 20 min', pro: '10 · 20 · 45 · ∞', studio: '10 · 20 · 45 · ∞ · custom' },
  { label: 'Client / listener profiles', free: false, pro: false, studio: true },
  { label: 'Data export', free: false, pro: false, studio: true },
  { label: 'Priority support', free: false, pro: true, studio: true },
]

function formatPrice(tier: Tier, interval: Interval): string {
  return interval === 'month' ? `$${tier.monthly.toFixed(2)}` : `$${tier.annual.toFixed(0)}`
}

function annualSavingsPct(tier: Tier): number {
  return Math.round((1 - tier.annual / (tier.monthly * 12)) * 100)
}

// ── icons ─────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </svg>
)

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
    <path d="M14 3.5V8h4M9 12.5h6M9 16h6" />
  </svg>
)

const RestoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 12a8 8 0 1 1 2.6 5.9" />
    <path d="M4 17v-4h4" />
  </svg>
)

function FeatureCell({ value }: { value: string | boolean }) {
  return (
    <td className={css({ textAlign: 'center', px: '3', py: '3', fontSize: 'footnote', color: 'muted' })}>
      {value === true ? (
        <span aria-label="Included" className={css({ display: 'inline-flex', color: 'accent' })}>
          <CheckIcon />
        </span>
      ) : value === false ? (
        <span aria-label="Not included" className={css({ color: 'faint' })}>
          —
        </span>
      ) : (
        value
      )}
    </td>
  )
}

function PaywallScreen() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const [billingInterval, setBillingInterval] = useState<Interval>('year')
  const [ctaNote, setCtaNote] = useState<string | null>(null)

  const dismiss = () => {
    playClick('tap')
    void navigate({ to: '/app' })
  }

  const handleContinue = (tier: Tier) => {
    playClick('primary')
    setCtaNote(
      `Checkout isn’t wired up in this build yet, so nothing was charged. (Would start: ${tier.name}, billed ${
        billingInterval === 'month' ? 'monthly' : 'annually'
      }, 7-day trial.)`,
    )
  }

  const handleRestore = () => {
    playClick('tap')
    setCtaNote('Checkout isn’t live in this build yet, so there’s no purchase to restore.')
  }

  return (
    <>
      <div className={css({ display: 'flex', justifyContent: 'flex-end', mb: '1' })}>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Not now — back to Today"
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '1.5',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 'subhead',
            fontWeight: '600',
            color: 'muted',
            px: '2',
            py: '2',
            WebkitTapHighlightColor: 'transparent',
          })}
        >
          Not now
          <CloseIcon />
        </button>
      </div>

      {/* Hero — an always-dark scene surface (crisp photo + scrim) in both themes. */}
      <div
        className={cx(
          'ss-scene-dark',
          css({
            position: 'relative',
            borderRadius: 'card',
            overflow: 'hidden',
            height: '224px',
            mb: '6',
            animation: 'fadeUp token(durations.calm) token(easings.enter) both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }),
        )}
      >
        {/* Generative Deep Space wash — no photographic backgrounds in /app. */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            inset: '0',
            background:
              'radial-gradient(ellipse 90% 70% at 20% 0%, rgba(82, 102, 235, 0.18) 0%, transparent 60%), linear-gradient(172deg, #272735 0%, #1e1e2a 55%, #171721 100%)',
          })}
        />
        <div
          className={css({
            position: 'relative',
            zIndex: '1',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: '5',
          })}
        >
          {search.reason === 'cap' && (
            <p
              className={css({
                m: '0',
                mb: '2',
                fontSize: 'caption',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--ss-ink-strong)',
              })}
            >
              Today’s free session is used
            </p>
          )}
          <h1 className={css({ m: '0', fontFamily: 'display', fontSize: 'title1', fontWeight: '700', color: 'text' })}>
            SmartSound Pro
          </h1>
          <p className={css({ m: '0', mt: '1.5', maxW: '34ch', fontSize: 'subhead', lineHeight: '1.4', color: 'var(--ss-ink-strong)' })}>
            Unlimited sessions and the full library, whenever you need them.
          </p>
        </div>
      </div>

      {/* Billing interval */}
      <div className={css({ display: 'flex', justifyContent: 'center', gap: '2', mb: '6' })}>
        {(['month', 'year'] as Interval[]).map((i) => {
          const active = billingInterval === i
          return (
            <LiquidGlass
              key={i}
              as="button"
              variant="control"
              staticSheen
              aria-pressed={active}
              onClick={() => {
                playClick('tap')
                setBillingInterval(i)
              }}
              tint={active ? 'var(--signal)' : undefined}
              className={css({ border: 'none', font: 'inherit' })}
            >
              <span
                className={css({ display: 'block', px: '5', py: '2.5', fontSize: 'subhead', fontWeight: '600' })}
                style={{ color: active ? 'var(--signal)' : 'var(--colors-text)' }}
              >
                {i === 'month' ? 'Monthly' : 'Annual'}
              </span>
            </LiquidGlass>
          )
        })}
      </div>

      {/* Tier cards */}
      <div className={css({ display: 'flex', flexDirection: 'column', gap: '4', mb: '4' })}>
        {TIERS.map((tier) => (
          <LiquidGlass key={tier.id} variant="card" tint={tier.featured ? 'var(--signal)' : undefined}>
            <div className={css({ px: '6', py: '6' })}>
              <div className={css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '1' })}>
                <h2 className={css({ m: '0', fontFamily: 'display', fontSize: 'title2', fontWeight: '700', color: 'text' })}>
                  {tier.name}
                </h2>
                {tier.featured && (
                  <span
                    className={css({
                      fontSize: 'caption2',
                      fontWeight: '700',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: 'accent',
                      background: 'accentSoft',
                      px: '2.5',
                      py: '1',
                      borderRadius: 'capsule',
                    })}
                  >
                    Most popular
                  </span>
                )}
              </div>
              <p className={css({ m: '0', mb: '4', fontSize: 'subhead', color: 'muted' })}>{tier.tagline}</p>

              <div className={css({ display: 'flex', alignItems: 'baseline', gap: '1.5' })}>
                <span className={`tabular ${css({ fontFamily: 'rounded', fontSize: 'title1', fontWeight: '700', color: 'text' })}`}>
                  {formatPrice(tier, billingInterval)}
                </span>
                <span className={css({ fontSize: 'footnote', color: 'faint' })}>{billingInterval === 'month' ? '/ month' : '/ year'}</span>
              </div>
              <p className={`tabular ${css({ m: '0', mb: '4', mt: '1', fontSize: 'caption', fontWeight: '600', color: billingInterval === 'year' ? 'accent' : 'faint' })}`}>
                {billingInterval === 'year'
                  ? `$${(tier.annual / 12).toFixed(2)}/mo billed annually · save ${annualSavingsPct(tier)}% vs monthly`
                  : `or $${tier.annual.toFixed(0)}/yr — save ${annualSavingsPct(tier)}%`}
              </p>

              <ul className={css({ listStyle: 'none', m: '0', mb: '5', p: '0', display: 'flex', flexDirection: 'column', gap: '2' })}>
                {tier.features.map((f) => (
                  <li key={f} className={css({ display: 'flex', alignItems: 'flex-start', gap: '2.5', fontSize: 'footnote', color: 'muted' })}>
                    <span className={css({ color: 'accent', flexShrink: '0', mt: '0.5' })}>
                      <CheckIcon />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <LiquidGlass
                as="button"
                variant="control"
                tint={tier.featured ? 'var(--signal)' : undefined}
                onClick={() => handleContinue(tier)}
                className={css({ display: 'block', width: 'full', textAlign: 'center', border: 'none', font: 'inherit' })}
              >
                <span
                  className={css({ display: 'block', px: '5', py: '3', fontSize: 'subhead', fontWeight: '700', color: 'text' })}
                >
                  Start 7-day free trial
                </span>
              </LiquidGlass>
              <p className={css({ m: '0', mt: '2', fontSize: 'caption2', color: 'faint', textAlign: 'center' })}>
                7 days free, then {formatPrice(tier, billingInterval)}
                {billingInterval === 'month' ? '/mo' : '/yr'} · cancel anytime
              </p>
            </div>
          </LiquidGlass>
        ))}
      </div>

      {/* Free — what stays free, for contrast. */}
      <LiquidGlass variant="card" className={css({ mb: '6' })}>
        <div className={css({ px: '6', py: '5' })}>
          <div className={css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' })}>
            <h3 className={css({ m: '0', fontFamily: 'display', fontSize: 'headline', fontWeight: '600', color: 'text' })}>
              Free
            </h3>
            <span className={`tabular ${css({ fontSize: 'footnote', fontWeight: '600', color: 'faint' })}`}>$0</span>
          </div>
          <p className={css({ m: '0', mt: '1', fontSize: 'footnote', lineHeight: '1.5', color: 'muted' })}>
            {FREE_DAILY_SESSIONS} session a day, up to {FREE_DAILY_MIN} minutes, with the core soundscapes — no card
            required, no expiry.
          </p>
        </div>
      </LiquidGlass>

      {ctaNote && (
        <p
          className={css({
            m: '0',
            mb: '6',
            fontSize: 'footnote',
            lineHeight: '1.5',
            color: 'faint',
            textAlign: 'center',
            animation: 'fadeUp token(durations.gentle) token(easings.enter) both',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          })}
        >
          {ctaNote}
        </p>
      )}

      {/* Feature matrix. */}
      <h2
        className={css({
          m: '0',
          mb: '3',
          fontFamily: 'display',
          fontSize: 'title3',
          fontWeight: '600',
          letterSpacing: '-0.01em',
          color: 'text',
        })}
      >
        Compare plans
      </h2>
      <LiquidGlass variant="card" className={css({ mb: '6' })}>
        <div className={css({ overflowX: 'auto', WebkitOverflowScrolling: 'touch' })}>
          <table className={css({ width: 'full', minW: '480px', borderCollapse: 'collapse' })}>
            <thead>
              <tr>
                <th className={css({ textAlign: 'left', fontSize: 'caption', fontWeight: '600', color: 'faint', px: '4', py: '3' })}>
                  Feature
                </th>
                <th className={css({ textAlign: 'center', fontSize: 'caption', fontWeight: '600', color: 'faint', px: '3', py: '3' })}>
                  Free
                </th>
                <th className={css({ textAlign: 'center', fontSize: 'caption', fontWeight: '700', color: 'accent', px: '3', py: '3' })}>
                  Pro
                </th>
                <th className={css({ textAlign: 'center', fontSize: 'caption', fontWeight: '600', color: 'faint', px: '3', py: '3' })}>
                  Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={i < FEATURE_ROWS.length - 1 ? css({ borderBottom: '1px solid', borderColor: 'hairline' }) : undefined}
                >
                  <td className={css({ fontSize: 'footnote', color: 'text', px: '4', py: '3' })}>{row.label}</td>
                  <FeatureCell value={row.free} />
                  <FeatureCell value={row.pro} />
                  <FeatureCell value={row.studio} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LiquidGlass>

      {/* Restore + legal — real rows, not decoration. */}
      <SettingsGroup title="Purchases">
        <div
          className={css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '3',
            px: '4',
            py: '3.5',
          })}
        >
          <div className={css({ display: 'flex', alignItems: 'center', gap: '3', minW: '0' })}>
            <span
              aria-hidden
              className={css({
                display: 'grid',
                placeItems: 'center',
                width: '30px',
                height: '30px',
                borderRadius: 'full',
                color: 'accent',
                background: 'accentSoft',
                flexShrink: '0',
                lineHeight: '0',
              })}
            >
              <RestoreIcon />
            </span>
            <div className={css({ minW: '0' })}>
              <p className={css({ m: '0', fontSize: 'subhead', fontWeight: '500', color: 'text' })}>Restore purchase</p>
              <p className={css({ m: '0', mt: '0.5', fontSize: 'caption', color: 'faint' })}>
                Already subscribed on another device? Restore it here.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            className={css({
              flexShrink: '0',
              background: 'transparent',
              border: '1px solid',
              borderColor: 'hairline',
              borderRadius: 'capsule',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 'footnote',
              fontWeight: '600',
              color: 'accent',
              px: '3.5',
              py: '2',
              WebkitTapHighlightColor: 'transparent',
            })}
          >
            Restore
          </button>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Legal">
        <SettingsRow
          icon={<DocumentIcon />}
          label="Terms of Service"
          detail="Not published for this build yet — final terms will be linked here before checkout goes live."
        />
        <SettingsRow
          icon={<DocumentIcon />}
          label="Privacy Policy"
          detail="Attune's camera analysis stays on-device either way — see Profile → Privacy. A full policy ships alongside checkout."
          last
        />
      </SettingsGroup>
    </>
  )
}
