import { css } from 'styled-system/css'

/**
 * MechanismDiagram — a small animated SVG in system colors: a plain sound
 * wave flows into a modulation envelope (amplitude pulsing at the band
 * target rate), which reaches a brain icon. It illustrates the MECHANISM
 * register of /science — no data, no claims, just what the words describe.
 * Under prefers-reduced-motion the dash flow and envelope pulse are frozen
 * (a static, still-legible diagram).
 */

export function MechanismDiagram() {
  return (
    <svg
      role="img"
      aria-label="A sound wave passes through an amplitude-modulation envelope, then reaches a brain."
      viewBox="0 0 340 96"
      className={css({ display: 'block', width: '100%', maxWidth: '340px', height: 'auto' })}
    >
      {/* carrier sound wave */}
      <path
        d="M4 48 q10 -20 20 0 t20 0 t20 0 t20 0"
        fill="none"
        stroke="#c3c3cc"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* modulation envelope — amplitude swelling and easing (the pulse) */}
      <path
        d="M96 48 C110 20 110 20 124 48 C138 76 138 76 152 48 C166 20 166 20 180 48 C194 76 194 76 208 48"
        fill="none"
        stroke="#70707d"
        strokeWidth="1.2"
        strokeDasharray="3 4"
        className={css({
          animation: 'ss-mech-flow 2.2s linear infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      />
      {/* the modulated signal inside the envelope */}
      <path
        d="M96 48 q6 -14 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0"
        fill="none"
        stroke="#5266eb"
        strokeWidth="1.6"
        strokeLinecap="round"
        className={css({
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: 'ss-mech-pulse 1.4s ease-in-out infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        })}
      />
      {/* arrow */}
      <path d="M216 48 h30 m0 0 l-6 -4 m6 4 l-6 4" fill="none" stroke="#70707d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* brain icon */}
      <g transform="translate(258 26)" fill="none" stroke="#ededf3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 6c-3-4-10-4-12 1c-5-1-9 3-7 8c-3 2-3 8 1 10c1 5 8 6 11 2c3 4 10 3 11-2c4-2 4-8 1-10c2-5-2-9-6-9z" />
        <path d="M16 8v30M10 16c3 1 3 5 6 5M22 24c-3 0-4 3-6 4" />
      </g>
    </svg>
  )
}
