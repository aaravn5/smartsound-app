import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { ScreenTitle } from '~/components/SereneScreen'
import { SettingsGroup, SettingsRow } from '~/components/SettingsList'
import { useDailyUsage, FREE_DAILY_MIN } from '~/lib/entitlements'

/**
 * Profile — Calm/Apple settings idiom. No live account yet (the `server/`
 * scaffold in `src/lib/api.ts` isn't wired in this milestone) so everything
 * here is honest about being a guest: a generated avatar (no external
 * image), a Free-plan membership card with a non-fatal Pro disclosure, and
 * grouped Liquid Glass settings rows.
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
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </svg>
)

function Avatar() {
  return (
    <span
      aria-hidden
      className={css({
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        width: '64px',
        height: '64px',
        borderRadius: 'full',
        flexShrink: '0',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 24px rgba(3,6,18,0.4)',
      })}
      style={{
        background:
          'radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--scene-accent) 70%, white), var(--scene-accent) 60%, color-mix(in oklab, var(--scene-accent) 55%, black))',
      }}
    >
      <span
        className={css({
          fontFamily: 'rounded',
          fontSize: 'title1',
          fontWeight: '700',
          color: 'rgba(10,8,20,0.82)',
          letterSpacing: '-0.02em',
        })}
      >
        G
      </span>
    </span>
  )
}

function ProfileScreen() {
  const reduceMotion = useReducedMotion()
  const usage = useDailyUsage()
  const [proOpen, setProOpen] = useState(false)

  const usedPct = Math.min(100, Math.round((usage.minutesToday / FREE_DAILY_MIN) * 100))

  return (
    <>
      <ScreenTitle caption="You" title="Profile" />

      {/* Identity — honest about being a guest, no external image. */}
      <LiquidGlass variant="card" className={cx(css({ mb: '5' }), cardAnim)}>
        <div className={css({ display: 'flex', alignItems: 'center', gap: '4', px: '6', py: '6' })}>
          <Avatar />
          <div className={css({ display: 'flex', flexDirection: 'column', gap: '1', minW: '0' })}>
            <span className={css({ fontFamily: 'display', fontSize: 'title3', fontWeight: '600', color: 'text' })}>
              Guest
            </span>
            <span className={css({ fontSize: 'footnote', color: 'faint' })}>@exploring</span>
            <span className={css({ mt: '1', fontSize: 'caption', fontWeight: '500', color: 'muted' })}>
              Sign-in coming — exploring as guest
            </span>
          </div>
        </div>
      </LiquidGlass>

      {/* Membership. */}
      <LiquidGlass variant="card" className={cx(css({ mb: '5' }), cardAnim)} style={{ animationDelay: '60ms' }}>
        <div className={css({ px: '6', py: '6' })}>
          <div className={css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '1' })}>
            <div>
              <p className={css({ m: '0', fontSize: 'caption', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'faint' })}>
                Current plan
              </p>
              <h2 className={css({ m: '0', mt: '0.5', fontFamily: 'display', fontSize: 'title2', fontWeight: '700', color: 'text' })}>
                Free
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
              {usage.capReached ? 'Today’s limit reached' : `${FREE_DAILY_MIN} min / day`}
            </span>
          </div>

          <p className={css({ m: '0', mb: '1.5', fontSize: 'footnote', color: 'muted' })}>
            <span className={`tabular ${css({ fontWeight: '700', color: 'text' })}`}>{Math.round(usage.minutesToday)}</span> of{' '}
            <span className="tabular">{FREE_DAILY_MIN}</span> minutes used today
          </p>
          <div className={css({ height: '4px', borderRadius: 'full', bg: 'hairline', overflow: 'hidden' })}>
            <div
              className={css({ height: 'full', borderRadius: 'full', bg: 'accent', transition: 'width token(durations.gentle) ease' })}
              style={{ width: `${usedPct}%` }}
            />
          </div>

          <div className={css({ height: '1px', bg: 'hairline', my: '5' })} />

          <h3 className={css({ m: '0', mb: '3', fontFamily: 'display', fontSize: 'headline', fontWeight: '600', color: 'text' })}>
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

          <LiquidGlass
            as="button"
            variant="control"
            aria-expanded={proOpen}
            onClick={() => setProOpen((v) => !v)}
            className={css({ display: 'block', width: 'full', textAlign: 'center' })}
          >
            <span className={css({ display: 'block', px: '5', py: '3', fontSize: 'subhead', fontWeight: '600', color: 'text' })}>
              {proOpen ? 'Noted — thank you' : 'Go deeper with Pro'}
            </span>
          </LiquidGlass>
          {proOpen && (
            <p className={css({ m: '0', mt: '3', fontSize: 'footnote', color: 'faint', textAlign: 'center' })}>
              Pro is coming soon — checkout isn&rsquo;t live on this build yet.
            </p>
          )}
        </div>
      </LiquidGlass>

      {/* Settings — grouped, honest disclosures in place of dead-end navigation. */}
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
          last
        />
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

      <SettingsGroup title="Account">
        <SettingsRow
          icon={<SignOutIcon />}
          label="Sign out"
          detail="You're already browsing as a guest — there's nothing signed in to sign out of yet."
          last
        />
      </SettingsGroup>
    </>
  )
}
