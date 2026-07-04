import { useState } from 'react'
import { css } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { useClickSound } from '~/lib/click-sound'

/**
 * SciencePanel — an honest, expandable "how this works" disclosure for the
 * Player. SmartSound sits on real, cited mechanisms (remote pulse sensing,
 * tempo/arousal, auditory entrainment) but the claims made about them here
 * are deliberately modest: "research suggests" / "early evidence", never
 * "proven" or "clinically validated". Every reference below is a genuine,
 * well-established citation or search — nothing invented, no fabricated
 * DOIs. If a reader wants to verify a claim, the link gets them to real
 * primary literature, not a dead end.
 */

const iconAttrs = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
}

const FlaskIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" {...iconAttrs}>
    <path d="M9.5 3h5M10.2 3v5.6l-4.6 8a2 2 0 0 0 1.75 3h9.3a2 2 0 0 0 1.75-3l-4.6-8V3" />
    <path d="M7.8 14.5h8.4" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={css({ color: 'faint', flexShrink: '0', transition: 'transform token(durations.quick) token(easings.calm)' })}
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const ExternalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

interface Reference {
  claim: string
  detail: string
  citation: string
  searchHref: string
}

// Three real, checkable anchors — one per mechanism SmartSound actually
// uses. Where the exact citation details (volume/pages/DOI) aren't
// something to state with certainty, the link points to a search over the
// primary literature rather than a fabricated identifier.
const REFERENCES: Reference[] = [
  {
    claim: 'Attune reads your pulse from the camera, on-device',
    detail:
      'Attune estimates heart rate from subtle, camera-visible color changes in your skin — a technique the research literature calls remote photoplethysmography (rPPG). The signal-processing approach SmartSound’s pipeline draws on follows principles described in a widely cited engineering paper on the method. Camera-based pulse estimation is an active research area: accuracy depends on lighting, motion, and skin tone, and it is not a substitute for a clinical heart-rate monitor.',
    citation: 'Wang, W., den Brinker, A. C., Stuijk, S., & de Haan, G. (2017). "Algorithmic Principles of Remote PPG." IEEE Transactions on Biomedical Engineering.',
    searchHref: 'https://scholar.google.com/scholar?q=%22Algorithmic+Principles+of+Remote+PPG%22+Wang+den+Brinker+Stuijk+de+Haan',
  },
  {
    claim: 'Slow, steady soundscapes and a calmer heart rate',
    detail:
      'Research on music and the autonomic nervous system suggests that slow-tempo, low-arousal music can nudge heart rate and breathing toward a slower, steadier rhythm — an effect that faster or more chaotic music doesn’t reliably produce. That’s part of why SmartSound’s calm and wind-down soundscapes favor a slow, steady tempo over abrupt or busy arrangements. The effect is real but modest, varies between people, and isn’t a treatment for any cardiovascular condition.',
    citation: 'Search: "music tempo heart rate relaxation", "slow music autonomic nervous system" (PubMed)',
    searchHref: 'https://pubmed.ncbi.nlm.nih.gov/?term=music+tempo+heart+rate+relaxation',
  },
  {
    claim: 'The gentle pulsing under each soundscape',
    detail:
      'SmartSound layers slow amplitude modulation onto its ambient tones — a rhythmic pulse rather than a flat drone. That design is inspired by early evidence that the auditory system can phase-lock to a rhythmic input, an electrophysiological response researchers call the auditory steady-state response (ASSR). This is a well-studied response of the auditory pathway, not a claim that a soundscape changes your brainwaves in a specific, measurable way.',
    citation: 'Search: "auditory steady-state response amplitude modulation", "auditory entrainment neural oscillations" (Google Scholar)',
    searchHref: 'https://scholar.google.com/scholar?q=auditory+steady-state+response+amplitude+modulation+entrainment',
  },
]

export function SciencePanel() {
  const [open, setOpen] = useState(false)
  const playClick = useClickSound()

  return (
    <LiquidGlass variant="card">
      <div className={css({ px: '5', py: '4' })}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            playClick('tap')
            setOpen((v) => !v)
          }}
          className={css({
            display: 'flex',
            alignItems: 'center',
            gap: '3',
            width: 'full',
            p: '0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            font: 'inherit',
            color: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          })}
        >
          <span
            aria-hidden
            className={css({
              display: 'grid',
              placeItems: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'full',
              color: 'accent',
              background: 'accentSoft',
              flexShrink: '0',
              lineHeight: '0',
            })}
          >
            <FlaskIcon />
          </span>
          <span className={css({ flex: '1', minW: '0' })}>
            <span className={css({ display: 'block', fontSize: 'subhead', fontWeight: '600', color: 'text' })}>
              The science
            </span>
            <span className={css({ display: 'block', mt: '0.5', fontSize: 'caption', color: 'faint' })}>
              How SmartSound works, honestly
            </span>
          </span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div
            className={css({
              mt: '4',
              pt: '4',
              borderTop: '1px solid',
              borderColor: 'hairline',
              display: 'flex',
              flexDirection: 'column',
              gap: '4',
              animation: 'fadeUp token(durations.gentle) token(easings.enter) both',
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            })}
          >
            {REFERENCES.map((ref) => (
              <div key={ref.claim}>
                <p className={css({ m: '0', fontSize: 'footnote', fontWeight: '600', color: 'text' })}>
                  {ref.claim}
                </p>
                <p className={css({ m: '0', mt: '1', fontSize: 'footnote', lineHeight: '1.55', color: 'muted' })}>
                  {ref.detail}
                </p>
                <a
                  href={ref.searchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    display: 'inline-flex',
                    alignItems: 'flex-start',
                    gap: '1.5',
                    mt: '1.5',
                    fontSize: 'caption',
                    fontWeight: '600',
                    color: 'accent',
                    textDecoration: 'none',
                    lineHeight: '1.4',
                  })}
                >
                  <span>{ref.citation}</span>
                  <span className={css({ flexShrink: '0', mt: '0.5' })}>
                    <ExternalIcon />
                  </span>
                </a>
              </div>
            ))}

            <div
              className={css({
                p: '3',
                borderRadius: 'control',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid',
                borderColor: 'hairline',
              })}
            >
              <p className={css({ m: '0', fontSize: 'caption', lineHeight: '1.5', color: 'faint' })}>
                SmartSound is a wellness tool, not a medical device. It doesn&rsquo;t diagnose, treat, or cure any
                condition, and it isn&rsquo;t a substitute for professional medical advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </LiquidGlass>
  )
}
