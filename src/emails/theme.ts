/**
 * Email palette — hex approximations of the OKLCH design tokens (§5.3), since
 * mail clients can't read CSS custom properties or oklch(). The instrument's
 * dark aesthetic carries into email; clients that force light degrade cleanly.
 */
export const c = {
  ink: '#191c23',
  surface: '#252932',
  mist: '#d7d9de',
  haze: '#8b8f98',
  line: '#383c45',
  signal: '#6f74e6', // focus indigo-violet
} as const

export const font = {
  display: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
} as const
