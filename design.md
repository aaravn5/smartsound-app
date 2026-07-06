# SmartSound Design System — "Pressed at Night"
> One product, one dark world: a record-pressing studio for the mind.
> Base system: Mercury (Mountain Top Command Center), adapted for SmartSound's
> neuroscience/vinyl identity. Where this file and old code disagree, this file wins.

## Theme
Dark, cinematic, restrained. Near-black neutrals, glowing off-white text, ONE
violet-blue accent reserved for primary actions. All expressive color and motion
lives inside generative content (records, particles, pulse traces) — never in chrome.
Elevation = light, not shadow: surfaces brighten on interaction.

## Colors (tokens)
| Token | Value | Role |
|---|---|---|
| --color-deep-space      | #171721 | Outermost page background |
| --color-midnight-slate  | #1e1e2a | Section / card backgrounds |
| --color-graphite        | #272735 | Interactive surfaces, hover fills |
| --color-lead            | #70707d | Borders, dividers, etched groove lines |
| --color-starlight       | #ededf3 | Primary text |
| --color-silver          | #c3c3cc | Secondary text, captions |
| --color-pure-white      | #ffffff | Text on accent CTAs ONLY |
| --color-mercury-blue    | #5266eb | THE accent: primary CTAs, active dot, stylus marker. Never text, never decoration. |
| --color-ghost-blue      | #cdddff | Secondary button bg at ~20% opacity, focus rings |

### Band tints (content-only palette)
Used ONLY inside generative content: record labels, particle fields, waveform
rings, pulse traces, band-mix bars. Max ~35% saturation in UI-adjacent uses.
NEVER used for buttons, nav, text, or page chrome.
| Band | Freq | Tint | Feel |
|---|---|---|---|
| Beta  | ~15 Hz  | #6f7ff0 (electric violet-blue) | alert, crisp — fastest motion |
| Alpha | ~10 Hz  | #5fb8c9 (still teal)           | open, calm |
| Theta | ~6 Hz   | #b78fd6 (dusk violet)          | drifting, soft |
| Delta | ~2.5 Hz | #4a5a8a (deep slate blue)      | heavy, slow — dimmest, slowest |
Motion rule: every band-tinted animation paces itself to its band (Beta ripples
fast, Delta barely breathes). The system itself demonstrates entrainment.

## Typography
| Face | Role | Weights | Notes |
|---|---|---|---|
| Fraunces (existing) | ALL display & headlines, record titles, greetings | 400 (display), 600 (rare emphasis) | Weight 400 at large sizes is the signature. Never 700. Italic 400 for the poetic register ("the waking mind"). |
| Inter | UI, body, labels, nav, forms | 400, 500 | Replaces every -apple-system fallback. Load it; do not rely on system fonts. |
| JetBrains Mono (or system mono) | Stats, Hz values, BPM, timers, session counts | 400 | "This was measured" signal: `~15 Hz`, `64 BPM`, `24 min today`. |

Scale (px): display 64 / heading-lg 44 / heading 32 / heading-sm 21 / body 16 /
body-sm 14 / caption 12. Line-height 1.1 display → 1.5 body.
Letterspacing: caps-labels (nav, badges, "THIS MORNING'S PRESS") 0.08–0.12em,
12–13px, Silver.

## Spacing & shape
Base unit 4px. Section gap 80–120px. Element gap 12–32px. Page max-width 1200px.
Radii: buttons & inputs = pill (32px / 40px); cards & sleeves = 4px (record
sleeves are square-cornered like real jackets); records = perfect circles.
Density: spacious. When in doubt, add space.

## Components
- **Primary pill**: Mercury Blue bg, Pure White text, 32px radius, 16px/24px padding, Inter 500.
- **Secondary pill**: Ghost Blue @20% bg, Starlight text, same geometry.
- **Chip/tab (filters, timers)**: Graphite bg, Silver text; active = Starlight text + 1px Lead border brighten. Never white-filled chips over content.
- **Record**: near-black disc (#101018), concentric groove rings in Lead @ 10–20%, center label = band-tinted art, etched circular text `BAND · ~N Hz` in mono caps. Idle spin 8–12s/rev; playing spin ~1.8s/rev (33⅓ feel).
- **Record sleeve**: square, Midnight Slate, band-tinted label art, Fraunces title, mono metadata line. Hover: surface → Graphite + record peeks 8px out of sleeve.
- **Waveform ring**: hairline Starlight ring around playing record, radial ripple at scaled band frequency, peaks tinted to band.
- **Pulse trace**: 1px Starlight polyline, systolic peaks in band tint, draws left→right, mono BPM readout.
- **Input**: transparent bg, 1px Lead border, pill radius, Starlight text.
- **Bottom nav**: Midnight Slate bar, Lead hairline top border, icons+labels Silver; active = Starlight + 4px Mercury Blue dot. One accent for all five items.
- **Citation footnote**: mono superscript number, Silver; hover reveals source line.

## Motion
- Default ease: cubic-bezier(0.16, 1, 0.3, 1); durations 300–600ms UI, 1200ms+ scenes.
- Ambient loops must be slow enough to ignore (≥8s periods) except band-paced elements.
- Scroll-zoom hero: sticky container + scroll-progress-driven transform; 3 parallax particle depths.
- prefers-reduced-motion: kill particle drift, record spin, scroll-jacking; keep opacity fades ≤300ms; hero becomes static composed scene with normal scroll.

## Do
- Reserve #5266eb exclusively for primary action.
- Put ALL expressive color in content (records, particles, traces), tinted by band.
- Use Fraunces 400 huge and airy; use mono for every number.
- Brighten on hover (Graphite → +4% L); never drop shadows.
- Keep photographic imagery ONLY inside record label/sleeve art, band-tinted.

## Don't
- No system-font headings. No weight >600. No multicolor ring charts.
- No new saturated colors beyond the accent + band tints. No shadows.
- No white-filled chips floating over imagery. No photos as page backgrounds.
- No video files. All motion is generative (canvas/CSS/SVG).
- No scientific claim without a real citation and a confidence tag.
