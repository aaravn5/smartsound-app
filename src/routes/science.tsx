import { createFileRoute } from '@tanstack/react-router'
import { css, cx } from 'styled-system/css'
import { InfoPage } from '~/landing/InfoPage'
import { MechanismDiagram } from '~/components/MechanismDiagram'
import { usePageTitle } from '~/lib/page-title'

/**
 * /science — the evidence ledger. Two registers, Brain.fm pattern:
 *   1. MECHANISM — what SmartSound actually does, plain language + diagram.
 *   2. EVIDENCE LEDGER — a table of claims, each with a confidence tag
 *      (Established / Promising / Early) and a numbered citation linking to
 *      a Google Scholar search over the paper's title. Zero invented DOIs,
 *      page numbers, multipliers, or percentages. One honest Early row with
 *      no strong citation: we haven't run our own trial.
 *   3. PRIVACY — the camera/rPPG explanation, reusing the honesty strings.
 *
 * Every reference below is real (title/authors/journal/year only) and MUST
 * NOT be altered. Footnote-style mono superscripts; hover reveals the source.
 */
export const Route = createFileRoute('/science')({
  component: SciencePage,
})

type Confidence = 'Established' | 'Promising' | 'Early'

interface Citation {
  n: number
  source: string
  scholar: string
}

interface Claim {
  claim: string
  confidence: Confidence
  refs: number[]
}

/** Scholar search over a paper's exact title — no fabricated identifiers. */
const scholar = (title: string) =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${title}"`)}`

const CITATIONS: Citation[] = [
  {
    n: 1,
    source:
      'Lakatos, Karmos, Mehta, Ulbert & Schroeder (2008). “Entrainment of neuronal oscillations as a mechanism of attentional selection.” Science.',
    scholar: scholar('Entrainment of neuronal oscillations as a mechanism of attentional selection'),
  },
  {
    n: 2,
    source:
      'Nozaradan, Peretz, Missal & Mouraux (2011). “Tagging the neuronal entrainment to beat and meter.” Journal of Neuroscience.',
    scholar: scholar('Tagging the neuronal entrainment to beat and meter'),
  },
  {
    n: 3,
    source:
      'Henry & Obleser (2012). “Frequency modulation entrains slow neural oscillations and optimizes human listening behavior.” PNAS.',
    scholar: scholar(
      'Frequency modulation entrains slow neural oscillations and optimizes human listening behavior',
    ),
  },
  {
    n: 4,
    source:
      'Ngo, Martinetz, Mölle & Born (2013). “Auditory closed-loop stimulation of the sleep slow oscillation enhances memory.” Neuron.',
    scholar: scholar(
      'Auditory closed-loop stimulation of the sleep slow oscillation enhances memory',
    ),
  },
  {
    n: 5,
    source:
      'Papalambros et al. (2017). “Acoustic enhancement of sleep slow oscillations and concomitant memory improvement in older adults.” Frontiers in Human Neuroscience.',
    scholar: scholar(
      'Acoustic enhancement of sleep slow oscillations and concomitant memory improvement in older adults',
    ),
  },
  {
    n: 6,
    source:
      'Woods et al. (2024). “Rapid modulation in music supports attention.” Communications Biology.',
    scholar: scholar('Rapid modulation in music supports attention'),
  },
  {
    n: 7,
    source:
      'Verkruysse, Svaasand & Nelson (2008). “Remote plethysmographic imaging using ambient light.” Optics Express.',
    scholar: scholar('Remote plethysmographic imaging using ambient light'),
  },
  {
    n: 8,
    source:
      'Wang, den Brinker, Stuijk & de Haan (2017). “Algorithmic principles of remote PPG.” IEEE Transactions on Biomedical Engineering.',
    scholar: scholar('Algorithmic principles of remote PPG'),
  },
]

const CLAIMS: Claim[] = [
  {
    claim: 'Neural oscillations can entrain (phase-lock) to a rhythmic stimulus.',
    confidence: 'Established',
    refs: [1],
  },
  {
    claim: 'Auditory rhythms entrain neural activity at the beat frequency.',
    confidence: 'Established',
    refs: [2],
  },
  {
    claim: 'Slow frequency modulation entrains oscillations and shapes listening performance.',
    confidence: 'Established',
    refs: [3],
  },
  {
    claim:
      'Sound timed to slow sleep oscillations can deepen sleep processes — shown in lab EEG settings, not consumer apps.',
    confidence: 'Promising',
    refs: [4],
  },
  {
    claim: 'Pink-noise stimulation enhanced slow-wave activity in older adults.',
    confidence: 'Promising',
    refs: [5],
  },
  {
    claim:
      'Amplitude-modulated music affected attention networks. This studied modulated music in general — not SmartSound.',
    confidence: 'Promising',
    refs: [6],
  },
  {
    claim: 'Heart rate can be estimated from ordinary skin video — the rPPG principle.',
    confidence: 'Established',
    refs: [7],
  },
  {
    claim: 'The algorithmic basis SmartSound’s on-device pulse sensing builds on.',
    confidence: 'Established',
    refs: [8],
  },
  {
    claim:
      'Whether app-delivered modulation improves YOUR focus. We haven’t run our own trial yet — here’s the third-party research we build on.',
    confidence: 'Early',
    refs: [],
  },
]

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  Established: css({ color: 'starlight', borderColor: 'lead' }),
  Promising: css({ color: 'silver', borderColor: 'hairline' }),
  Early: css({ color: 'silver', borderColor: 'hairline' }),
}

const sectionTitleCss = css({
  m: '0',
  mb: '2',
  fontFamily: 'display',
  fontWeight: '400',
  fontSize: 'headingSm',
  letterSpacing: '-0.01em',
  color: 'starlight',
  textShadow: 'var(--ss-text-glow)',
})

const eyebrowCss = css({
  m: '0',
  mb: '2',
  fontFamily: 'mono',
  fontSize: 'caption',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'silver',
  textShadow: 'var(--ss-text-glow)',
})

const proseCss = css({
  m: '0',
  fontSize: 'subhead',
  lineHeight: '1.65',
  color: 'var(--ss-ink-body)',
  textShadow: 'var(--ss-text-glow)',
})

function SciencePage() {
  usePageTitle('The Science — SmartSound')
  return (
    <InfoPage scene="ocean" eyebrow="How it works" title="The science, honestly">
      <p className={cx(proseCss, css({ mb: '10' }))}>
        Every mechanism SmartSound uses — and the evidence behind it — is below, citations
        included. Where the research is early, we say so. No invented clinical claims, no
        fabricated statistics.
      </p>

      {/* ── 1. MECHANISM ─────────────────────────────────────────────── */}
      <section className={css({ mb: '12' })}>
        <p className={eyebrowCss}>Mechanism</p>
        <h2 className={sectionTitleCss}>What SmartSound actually does</h2>
        <p className={cx(proseCss, css({ mb: '4' }))}>
          SmartSound layers a rhythmic <em>amplitude modulation</em> into music at band-target
          rates — a gentle, repeating swell rather than a flat drone. The idea it draws on is
          entrainment: parts of the brain can fall into step with a steady rhythmic input. It
          also estimates your pulse from your camera using remote photoplethysmography (rPPG) —
          reading the tiny color changes in your skin as your heart beats — entirely on your
          device.
        </p>
        <div
          className={css({
            display: 'flex',
            justifyContent: 'center',
            p: '5',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: 'hairline',
            background: 'midnightSlate',
          })}
        >
          <MechanismDiagram />
        </div>
        <p className={cx(proseCss, css({ mt: '3', fontSize: 'caption', color: 'silver' }))}>
          A sound wave carries an amplitude-modulation envelope pulsing at the band-target rate,
          which reaches the listener. It is a design principle, not a promise about your brain.
        </p>
      </section>

      {/* ── 2. EVIDENCE LEDGER ───────────────────────────────────────── */}
      <section className={css({ mb: '12' })}>
        <p className={eyebrowCss}>Evidence ledger</p>
        <h2 className={sectionTitleCss}>The claims, tagged and cited</h2>
        <p className={cx(proseCss, css({ mb: '5', fontSize: 'footnote', color: 'silver' }))}>
          <span className={css({ color: 'starlight' })}>Established</span> — robust, replicated
          research. <span className={css({ color: 'starlight' })}>Promising</span> — real but
          early, often lab-specific. <span className={css({ color: 'starlight' })}>Early</span> —
          not yet demonstrated for this product.
        </p>

        <div className={css({ overflowX: 'auto' })}>
          <table
            className={css({
              width: '100%',
              minWidth: '440px',
              borderCollapse: 'collapse',
              fontSize: 'footnote',
            })}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className={css({
                    textAlign: 'left',
                    py: '2.5',
                    pr: '3',
                    borderBottom: '1px solid',
                    borderColor: 'lead',
                    fontFamily: 'mono',
                    fontSize: 'caption',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'silver',
                  })}
                >
                  Claim
                </th>
                <th
                  scope="col"
                  className={css({
                    textAlign: 'left',
                    py: '2.5',
                    px: '3',
                    borderBottom: '1px solid',
                    borderColor: 'lead',
                    fontFamily: 'mono',
                    fontSize: 'caption',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'silver',
                    whiteSpace: 'nowrap',
                  })}
                >
                  Confidence
                </th>
                <th
                  scope="col"
                  className={css({
                    textAlign: 'right',
                    py: '2.5',
                    pl: '3',
                    borderBottom: '1px solid',
                    borderColor: 'lead',
                    fontFamily: 'mono',
                    fontSize: 'caption',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'silver',
                    whiteSpace: 'nowrap',
                  })}
                >
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {CLAIMS.map((row, i) => (
                <tr key={i}>
                  <td
                    className={css({
                      py: '3',
                      pr: '3',
                      borderBottom: '1px solid',
                      borderColor: 'hairline',
                      color: 'var(--ss-ink-body)',
                      lineHeight: '1.5',
                    })}
                  >
                    {row.claim}
                  </td>
                  <td
                    className={css({
                      py: '3',
                      px: '3',
                      borderBottom: '1px solid',
                      borderColor: 'hairline',
                      verticalAlign: 'top',
                    })}
                  >
                    <span
                      className={cx(
                        css({
                          display: 'inline-block',
                          px: '2.5',
                          py: '1',
                          borderRadius: 'pill',
                          border: '1px solid',
                          background: 'graphite',
                          fontSize: 'caption',
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                        }),
                        CONFIDENCE_STYLE[row.confidence],
                      )}
                    >
                      {row.confidence}
                    </span>
                  </td>
                  <td
                    className={css({
                      py: '3',
                      pl: '3',
                      borderBottom: '1px solid',
                      borderColor: 'hairline',
                      textAlign: 'right',
                      verticalAlign: 'top',
                    })}
                  >
                    {row.refs.length === 0 ? (
                      <span className={css({ color: 'silver' })}>—</span>
                    ) : (
                      row.refs.map((r) => {
                        const cite = CITATIONS.find((c) => c.n === r)!
                        return (
                          <a
                            key={r}
                            href={cite.scholar}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={cite.source}
                            aria-label={`Citation ${r}: ${cite.source}`}
                            className={cx(
                              'tabular',
                              css({
                                display: 'inline-block',
                                ml: '1',
                                fontSize: 'caption',
                                verticalAlign: 'super',
                                color: 'starlight',
                                textDecoration: 'none',
                                _hover: { color: 'ghostBlue', textDecoration: 'underline' },
                              }),
                            )}
                          >
                            [{r}]
                          </a>
                        )
                      })
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Numbered references — the full source lines. */}
        <ol
          className={css({
            listStyle: 'none',
            m: '0',
            mt: '6',
            p: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '2.5',
          })}
        >
          {CITATIONS.map((c) => (
            <li key={c.n} id={`cite-${c.n}`} className={css({ display: 'flex', gap: '2.5' })}>
              <span
                className={cx('tabular', css({ flexShrink: '0', fontSize: 'caption', color: 'silver' }))}
              >
                [{c.n}]
              </span>
              <a
                href={c.scholar}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  fontSize: 'footnote',
                  lineHeight: '1.5',
                  color: 'var(--ss-ink-body)',
                  textDecoration: 'none',
                  textShadow: 'var(--ss-text-glow)',
                  _hover: { color: 'starlight', textDecoration: 'underline' },
                })}
              >
                {c.source}
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ── 3. PRIVACY ───────────────────────────────────────────────── */}
      <section className={css({ mb: '4' })}>
        <p className={eyebrowCss}>Privacy</p>
        <h2 className={sectionTitleCss}>The camera stays on your device</h2>
        <p className={cx(proseCss, css({ mb: '3' }))}>
          When you tune to your pulse, camera frames are processed locally, in your browser, and
          turned into a heart-rate estimate on the spot. Nothing is uploaded — no frame, no video,
          no image ever leaves your device (you can verify this in your browser&rsquo;s network
          tab). The pulse feature works offline, and camera-based estimation is an active research
          area: accuracy depends on lighting, motion, and skin tone, and it is not a substitute
          for a clinical heart-rate monitor.
        </p>
        <div
          className={css({
            mt: '4',
            p: '4',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: 'hairline',
            background: 'midnightSlate',
          })}
        >
          <p className={css({ m: '0', fontSize: 'caption', lineHeight: '1.55', color: 'silver' })}>
            SmartSound is a wellness tool, not a medical device. It doesn&rsquo;t diagnose, treat,
            or cure any condition, and it isn&rsquo;t a substitute for professional medical advice.
          </p>
        </div>
      </section>
    </InfoPage>
  )
}
