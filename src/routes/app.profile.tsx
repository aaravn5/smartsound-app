import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useReducedMotion } from 'motion/react'
import * as Switch from '@radix-ui/react-switch'
import { css, cx } from 'styled-system/css'
import { Card } from '~/components/Card'
import { ScreenTitle } from '~/components/SereneScreen'
import { SettingsGroup, SettingsRow } from '~/components/SettingsList'
import { RecordDisc } from '~/components/vinyl/RecordDisc'
import { useClickSound, useSfxEnabled } from '~/lib/click-sound'
import { signOut, useAccount } from '~/lib/account'
import { disableDevAccess, isDevAccess, tryUnlockDevAccess } from '~/lib/dev-access'
import { useDailyUsage, FREE_DAILY_MIN } from '~/lib/entitlements'

/**
 * Profile — Pressed at Night. The avatar is a mini RecordDisc whose label
 * carries the listener's initial; the plan card is a Midnight Slate surface
 * with the ONE Mercury Blue primary pill and the plain-words transparency
 * block. One dark world: no theme toggle. Dev access, data rows, and legal
 * links keep working exactly as before.
 */
export const Route = createFileRoute('/app/profile')({
  component: ProfileScreen,
})

const cardAnim = css({
  animation: 'fadeUp token(durations.calm) token(easings.enter) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
})

// ── icons — SF-symbol-flavored strokes, matching the shell's icon language ──
const iconAttrs = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const CameraIcon = () => (
  <svg {...iconAttrs}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.6h7l1 1.6h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
)
const MotionIcon = () => (
  <svg {...iconAttrs}>
    <path d="M3 15c1.6 0 1.6-3.4 3.2-3.4S7.8 15 9.4 15s1.6-3.4 3.2-3.4S14.2 15 15.8 15s1.6-3.4 3.2-3.4S20.6 15 21 15" />
  </svg>
)
const BellIcon = () => (
  <svg {...iconAttrs}>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.4 5.2 1.4 5.2H4.6S6 13.5 6 9.5Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
)
const DownloadIcon = () => (
  <svg {...iconAttrs}>
    <path d="M12 4v11M8 11.5 12 15.5 16 11.5" />
    <path d="M5 18.5h14" />
  </svg>
)
const TrashIcon = () => (
  <svg {...iconAttrs}>
    <path d="M5.5 7.5h13M9.5 7.5V5.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7M9 11v6M15 11v6" />
    <path d="M6.5 7.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-11.5" />
  </svg>
)
const SignOutIcon = () => (
  <svg {...iconAttrs}>
    <path d="M9.5 4.5H6A1.5 1.5 0 0 0 4.5 6v12A1.5 1.5 0 0 0 6 19.5h3.5" />
    <path d="M13.5 8.5 17.5 12l-4 3.5M17.5 12h-9" />
  </svg>
)
const SpeakerIcon = () => (
  <svg {...iconAttrs}>
    <path d="M4.5 9.5h2.4L11 6v12l-4.1-3.5H4.5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="M14.5 9.2a4 4 0 0 1 0 5.6M17 6.8a7.4 7.4 0 0 1 0 10.4" />
  </svg>
)
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </svg>
)

/** The avatar — a mini pressed record with the listener's initial as label. */
function Avatar({ initial }: { initial: string }) {
  return (
    <span aria-hidden className={css({ display: 'block', flexShrink: '0' })}>
      <RecordDisc state="calm" size={64} spinning="none" initial={initial} />
    </span>
  )
}

/** Interface-sounds switch — a live control, so it's a real row, not a disclosure. */
function SoundRow() {
  const [sfxOn, setSfxOn] = useSfxEnabled()
  const playClick = useClickSound()

  return (
    <div className={css({ display: 'flex', alignItems: 'center', gap: '3', px: '4', py: '3.5' })}>
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
        <SpeakerIcon />
      </span>
      <div className={css({ flex: '1', minW: '0' })}>
        <p className={css({ m: '0', fontSize: 'subhead', fontWeight: '500', color: 'text' })}>
          Interface sounds
        </p>
        <p className={css({ m: '0', mt: '0.5', fontSize: 'caption', lineHeight: '1.4', color: 'faint' })}>
          Soft tactile clicks on key controls
        </p>
      </div>
      <Switch.Root
        checked={sfxOn}
        onCheckedChange={(on) => {
          setSfxOn(on)
          // A sample of what was just turned on — inside the tap gesture.
          if (on) playClick('tap')
        }}
        aria-label="Interface sounds"
        className={css({
          position: 'relative',
          w: '51px',
          h: '31px',
          p: '0',
          borderRadius: 'capsule',
          border: 'none',
          cursor: 'pointer',
          flexShrink: '0',
          bg: 'var(--ss-control-track)',
          transition: 'background token(durations.quick) ease',
          WebkitTapHighlightColor: 'transparent',
          '&[data-state=checked]': { bg: 'accent' },
        })}
      >
        <Switch.Thumb
          className={css({
            display: 'block',
            w: '27px',
            h: '27px',
            borderRadius: 'full',
            bg: 'white',
            boxShadow: '0 2px 6px rgba(3,6,18,0.4)',
            transform: 'translateX(2px)',
            transition: 'transform token(durations.quick) token(easings.calm)',
            '&[data-state=checked]': { transform: 'translateX(22px)' },
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          })}
        />
      </Switch.Root>
    </div>
  )
}

const KeyIcon = () => (
  <svg {...iconAttrs}>
    <circle cx="8" cy="14.5" r="4.2" />
    <path d="M11.2 11.3 19.5 3M16 6.5l3 3M13.5 9l2 2" />
  </svg>
)

/**
 * Developer access — a password-gated unlock (all modes, no daily cap).
 * Client-side only, same honesty as the entitlements stub: this reviews the
 * paid experience, it is not a security boundary. A reload after
 * unlock/disable lets every `useDailyUsage()` instance re-read the plan.
 */
function DevAccessRow() {
  const playClick = useClickSound()
  const [unlocked, setUnlocked] = useState(() => isDevAccess())
  const [value, setValue] = useState('')
  const [rejected, setRejected] = useState(false)

  const submit = () => {
    if (tryUnlockDevAccess(value)) {
      playClick('primary')
      setUnlocked(true)
      setRejected(false)
      window.location.reload()
    } else {
      playClick('tap')
      setRejected(true)
    }
  }

  return (
    <div className={css({ px: '4', py: '3.5' })}>
      <div className={css({ display: 'flex', alignItems: 'center', gap: '3' })}>
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
          <KeyIcon />
        </span>
        <div className={css({ flex: '1', minW: '0' })}>
          <p className={css({ m: '0', fontSize: 'subhead', fontWeight: '500', color: 'text' })}>
            Developer access
          </p>
          <p className={css({ m: '0', mt: '0.5', fontSize: 'caption', lineHeight: '1.4', color: 'faint' })}>
            {unlocked
              ? 'Active — all modes unlocked, no daily cap'
              : 'Enter the developer password to unlock every mode'}
          </p>
        </div>
        {unlocked && (
          <button
            type="button"
            onClick={() => {
              playClick('tap')
              disableDevAccess()
              setUnlocked(false)
              window.location.reload()
            }}
            className={css({
              border: 'none',
              borderRadius: 'capsule',
              px: '3',
              py: '1.5',
              font: 'inherit',
              fontSize: 'footnote',
              fontWeight: '600',
              color: 'text',
              background: 'var(--ss-control-track)',
              cursor: 'pointer',
              flexShrink: '0',
              WebkitTapHighlightColor: 'transparent',
            })}
          >
            Disable
          </button>
        )}
      </div>

      {!unlocked && (
        <div className={css({ display: 'flex', gap: '2', mt: '3' })}>
          <input
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setRejected(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder="Developer password"
            aria-label="Developer password"
            aria-invalid={rejected || undefined}
            className={css({
              flex: '1',
              minW: '0',
              px: '3.5',
              h: '40px',
              borderRadius: 'control',
              border: '1px solid',
              borderColor: rejected ? 'rgba(248, 113, 113, 0.65)' : 'hairline',
              background: 'var(--ss-control-track-soft)',
              font: 'inherit',
              fontSize: 'subhead',
              color: 'text',
              outline: 'none',
              '&::placeholder': { color: 'faint' },
              _focusVisible: { outline: '2px solid token(colors.accent)', outlineOffset: '2px' },
            })}
          />
          <button
            type="button"
            onClick={submit}
            className={css({
              border: 'none',
              borderRadius: 'control',
              px: '4',
              h: '40px',
              font: 'inherit',
              fontSize: 'subhead',
              fontWeight: '600',
              color: 'text',
              background: 'var(--ss-control-track)',
              cursor: 'pointer',
              flexShrink: '0',
              WebkitTapHighlightColor: 'transparent',
            })}
          >
            Unlock
          </button>
        </div>
      )}
      {!unlocked && rejected && (
        <p className={css({ m: '0', mt: '2', fontSize: 'caption', color: 'rgba(252, 165, 165, 0.9)' })}>
          That password isn&rsquo;t right.
        </p>
      )}
    </div>
  )
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  studio: 'Studio',
}

function ProfileScreen() {
  const reduceMotion = useReducedMotion()
  const usage = useDailyUsage()
  const navigate = useNavigate()
  const playClick = useClickSound()
  const account = useAccount()

  const paidPlan = usage.plan !== 'free'
  const devActive = isDevAccess()
  const usedPct = Math.min(100, Math.round((usage.minutesToday / FREE_DAILY_MIN) * 100))

  return (
    <>
      <ScreenTitle caption="You" title="Profile" />

      {/* Identity — the on-device account when one exists, guest otherwise.
          Honest either way: no external image, no invented sync status. */}
      <Card className={cx(css({ mb: '5' }), cardAnim)}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4', px: '6', py: '6' })}>
          <Avatar initial={(account?.name.trim().charAt(0) || 'S').toUpperCase()} />
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '1', minW: '0' })}>
            <span className={css({ fontSize: 'headingSm', fontWeight: '600', letterSpacing: '-0.01em', color: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
              {account ? account.name : 'Guest'}
            </span>
            <span className={css({ fontSize: 'footnote', color: 'faint', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
              {account ? account.email : '@exploring'}
            </span>
            <span className={css({ mt: '1', fontSize: 'caption', fontWeight: '500', color: 'muted' })}>
              {account ? 'Account on this device — sync coming' : 'Sign-in coming — exploring as guest'}
            </span>
          </div>
        </div>
      </Card>

      {/* Membership. */}
      <Card className={cx(css({ mb: '5' }), cardAnim)} style={{ animationDelay: '60ms' }}>
        <div className={css({ px: '6', py: '6' })}>
          <div className={css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '1' })}>
            <div>
              <p className={css({ m: '0', fontSize: 'caption', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'silver' })}>
                Current plan
              </p>
              <h2 className={css({ m: '0', mt: '0.5', fontSize: 'headingSm', fontWeight: '600', letterSpacing: '-0.01em', color: 'text' })}>
                {PLAN_LABEL[usage.plan] ?? 'Free'}
              </h2>
            </div>
            <span
              className={css({
                fontSize: 'caption',
                fontWeight: '600',
                color: usage.capReached ? 'text' : 'muted',
                bg: usage.capReached ? 'accentSoft' : 'transparent',
                px: usage.capReached ? '2.5' : '0',
                py: usage.capReached ? '1' : '0',
                borderRadius: 'capsule',
              })}
            >
              {paidPlan
                ? devActive
                  ? 'Developer access'
                  : 'Unlimited'
                : usage.capReached
                  ? 'Today’s limit reached'
                  : `${FREE_DAILY_MIN} min / day`}
            </span>
          </div>

          {paidPlan ? (
            <p className={css({ m: '0', mb: '1.5', fontSize: 'footnote', color: 'muted' })}>
              <span className={`tabular ${css({ color: 'text' })}`}>{Math.round(usage.minutesToday)}</span>{' '}
              minutes today · no daily cap
            </p>
          ) : (
            <>
              <p className={css({ m: '0', mb: '1.5', fontSize: 'footnote', color: 'muted' })}>
                <span className={`tabular ${css({ color: 'text' })}`}>{Math.round(usage.minutesToday)}</span> of{' '}
                <span className="tabular">{FREE_DAILY_MIN}</span> minutes used today
              </p>
              <div className={css({ height: '4px', borderRadius: 'full', bg: 'hairline', overflow: 'hidden' })}>
                <div
                  className={css({ height: 'full', borderRadius: 'full', bg: 'accent', transition: 'width token(durations.gentle) ease' })}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </>
          )}

          <div className={css({ height: '1px', bg: 'hairline', my: '5' })} />

          <h3 className={css({ m: '0', mb: '3', fontSize: 'headline', fontWeight: '600', letterSpacing: '-0.01em', color: 'text' })}>
            Go deeper with Pro
          </h3>
          <ul className={css({ listStyle: 'none', m: '0', mb: '5', p: '0', display: 'flex', flexDirection: 'column', gap: '2.5' })}>
            {['Unlimited sessions, every day', 'All soundscapes and scenarios', 'Full insights — your complete history'].map((item) => (
              <li key={item} className={css({ display: 'flex', alignItems: 'flex-start', gap: '2.5', fontSize: 'subhead', color: 'muted' })}>
                <span className={css({ color: 'accent', flexShrink: '0', mt: '0.5' })}>
                  <CheckIcon />
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* THE primary pill — Mercury Blue, Pure White text, pill radius. */}
          <button
            type="button"
            onClick={() => {
              playClick('primary')
              void navigate({ to: '/app/paywall' })
            }}
            className={css({
              display: 'block',
              width: 'full',
              px: '6',
              py: '3',
              border: 'none',
              borderRadius: 'pill',
              background: 'mercuryBlue',
              font: 'inherit',
              fontSize: 'bodyMd',
              fontWeight: '500',
              color: 'white',
              textAlign: 'center',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              transition: 'filter 300ms ease',
              _hover: { filter: 'brightness(1.1)' },
              _focusVisible: { outline: '2px solid token(colors.ghostBlue)', outlineOffset: '2px' },
            })}
          >
            See plans
          </button>

          {/* Transparency — plain words, no asterisks. */}
          <p className={css({ m: '0', mt: '4', fontSize: 'caption', lineHeight: '1.5', color: 'faint' })}>
            Free: <span className="tabular">20</span> min/day, counted before you press play. Pro: one
            tap to cancel, no charges during trial.
          </p>
        </div>
      </Card>

      {/* Settings — grouped, honest disclosures in place of dead-end
          navigation. One dark world: no theme toggle (design.md). */}
      <SettingsGroup title="Sound">
        <SoundRow />
      </SettingsGroup>

      <SettingsGroup title="Privacy">
        <SettingsRow
          icon={<CameraIcon />}
          label="Camera & Attunement"
          value="On-device"
          detail="Attunement analyzes your camera feed fully on-device to read arousal. Frames are never uploaded or stored."
        />
        <SettingsRow
          icon={<MotionIcon />}
          label="Reduce Motion"
          value={reduceMotion ? 'On' : 'Off'}
          detail="SmartSound follows your system Reduce Motion setting automatically — change it in your device's Accessibility settings."
          systemControlled
        />
        <SettingsRow
          icon={<BellIcon />}
          label="Notifications"
          value="Off"
          detail="Session reminders aren't built yet — they're coming in a future update."
        />
        <LegalLinkRow to="/privacy" label="Privacy Policy" />
        <LegalLinkRow to="/terms" label="Terms of Use" last />
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          icon={<DownloadIcon />}
          label="Export data"
          detail="You're exploring as a guest, so there's no account data to export yet — this arrives with sign-in."
        />
        <SettingsRow
          icon={<TrashIcon />}
          label="Delete data"
          detail="Your session history stays on this device only. Clearing your browser storage removes it; an in-app control is coming soon."
          last
        />
      </SettingsGroup>

      <SettingsGroup title="Developer">
        <DevAccessRow />
      </SettingsGroup>

      <SettingsGroup title="Account">
        {account ? (
          <button
            type="button"
            onClick={() => {
              playClick('tap')
              signOut()
              void navigate({ to: '/' })
            }}
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: '3',
              w: 'full',
              px: '4',
              py: '3.5',
              border: 'none',
              background: 'transparent',
              font: 'inherit',
              color: 'text',
              textAlign: 'left',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            })}
          >
            <span
              aria-hidden
              className={css({ display: 'grid', placeItems: 'center', width: '30px', height: '30px', borderRadius: 'full', color: 'accent', background: 'accentSoft', flexShrink: '0', lineHeight: '0' })}
            >
              <SignOutIcon />
            </span>
            <span className={css({ flex: '1', minW: '0' })}>
              <span className={css({ display: 'block', fontSize: 'subhead', fontWeight: '500' })}>Sign out</span>
              <span className={css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'faint', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}>
                {account.email} — removes the account from this device
              </span>
            </span>
          </button>
        ) : (
          <SettingsRow
            icon={<SignOutIcon />}
            label="Sign out"
            detail="You're browsing as a guest — create an account from the landing page to sign in on this device."
            last
          />
        )}
      </SettingsGroup>
    </>
  )
}

/** A settings row that actually navigates — the legal pages exist now. */
function LegalLinkRow({ to, label, last = false }: { to: '/privacy' | '/terms'; label: string; last?: boolean }) {
  const navigate = useNavigate()
  const playClick = useClickSound()
  return (
    <div className={last ? undefined : css({ borderBottom: '1px solid', borderColor: 'hairline' })}>
      <button
        type="button"
        onClick={() => {
          playClick('tap')
          void navigate({ to })
        }}
        className={css({
          display: 'flex',
          alignItems: 'center',
          gap: '3',
          w: 'full',
          px: '4',
          py: '3.5',
          border: 'none',
          background: 'transparent',
          font: 'inherit',
          color: 'text',
          textAlign: 'left',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        })}
      >
        <span
          aria-hidden
          className={css({ display: 'grid', placeItems: 'center', width: '30px', height: '30px', borderRadius: 'full', color: 'accent', background: 'accentSoft', flexShrink: '0', lineHeight: '0' })}
        >
          <DocumentIcon />
        </span>
        <span className={css({ flex: '1', fontSize: 'subhead', fontWeight: '500' })}>{label}</span>
        <span aria-hidden className={css({ color: 'ghost', fontSize: 'footnote' })}>→</span>
      </button>
    </div>
  )
}

const DocumentIcon = () => (
  <svg {...iconAttrs}>
    <path d="M7 3.5h6.5L18 8v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.4z" />
    <path d="M13.5 3.5V8H18M9 12h6M9 15.5h6" />
  </svg>
)
