# SmartSound Design System — "Pressed at Night"
> One product, one dark world: a record-pressing studio for the mind.
> Base system: Mercury (Mountain Top Command Center), adapted for SmartSound's
> neuroscience/vinyl identity. Where this file and old code disagree, this file wins.

## Theme
Dark, cinematic, restrained. Near-black neutrals, glowing off-white text, ONE
violet-blue accent reserved for primary actions. All expressive color and motion
lives inside generative content (records, particles, pulse traces) — never in chrome.
Elevation = light first: surfaces brighten on interaction; genuinely floating
surfaces may add SOFT, low-opacity depth (see Materials) — never heavy shadow.

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
| Instrument Serif | LARGE display only (≥ ~30px): page titles, greetings, featured/player record titles | 400 (the whole family) | The signature — elegant, editorial, airy at large sizes. NEVER bold (400 is all that exists; font-synthesis is off). Italic 400 for the poetic register ("the waking mind", "Take a deep breath."). |
| Hanken Grotesk (variable) | UI, body, labels, nav, forms — AND all small headings | 400, 500, 600 | Replaces every -apple-system fallback. Load it; do not rely on system fonts. |
| JetBrains Mono | Stats, Hz values, BPM, timers, session counts | 400 | "This was measured" signal: `~15 Hz`, `64 BPM`, `24 min today`. |

**The size rule (hard):** Instrument Serif is a light, high-contrast display
face — beautiful huge, fragile small. Use `display` (the serif) only at
≥ ~30px, with letter-spacing −0.01 to −0.02em and line-height 1.05–1.15.
Small section headings (h2/h3 ≤ ~22px), card titles, sleeve titles → Hanken
Grotesk 600. When in doubt at mid sizes, choose Hanken 600.

Scale (px): display 64 / heading-lg 44 / heading 32 / heading-sm 21 / body 16 /
body-sm 14 / caption 12. Line-height 1.05–1.15 display → 1.5 body.
Letterspacing: caps-labels (nav, badges, "THIS MORNING'S PRESS") 0.08–0.12em,
12–13px, Silver.

## Spacing & shape
Base unit 4px. Section gap 80–120px. Element gap 12–32px. Page max-width 1200px.
Radii: buttons & inputs = pill (32px / 40px); cards & elevated surfaces =
16px continuous/squircle feel (Apple); record SLEEVES stay 4px (square-cornered
like real jackets); records = perfect circles. Borders are thin — 0.5px
hairlines wherever a border appears.
Density: spacious. When in doubt, add space.

## Materials (Apple depth — layered, translucent, never heavy)
- **Frosted glass** (`glassCss` in `src/components/Card.tsx`, `frost.*` tokens):
  `rgba(30,30,42,0.72)` + `backdrop-filter: saturate(180%) blur(20px)` +
  0.5px `rgba(237,237,243,0.10)` hairline. For the bottom nav, overlays,
  toasts, sticky headers, and any surface floating over live content (the
  player's cards over the band field). Falls back to near-opaque slate when
  backdrop-filter is unsupported or transparency is reduced.
- **Soft depth**: elevated cards/overlays may carry a subtle low-opacity
  shadow — `shadows.soft` = `0 1px 2px rgba(0,0,0,0.3), 0 8px 30px
  rgba(0,0,0,0.22)`. Tasteful only; still prefer "brighten on hover."
- **Aurora glows** (`AuroraBackdrop`): two very slow (≥45s), very subtle
  (≤6% opacity) mercury/ghost radial blooms drifting in page backgrounds —
  Calm/Endel ethereal, never loud, frozen under prefers-reduced-motion.
- **Inputs**: pill radius, 0.5px Lead hairline, faint graphite translucent
  fill (`rgba(39,39,53,0.35)`) that deepens slightly on focus.

## Components
- **Primary pill**: Mercury Blue bg, Pure White text, 32px radius, 16px/24px padding, Hanken Grotesk 500.
- **Secondary pill**: Ghost Blue @20% bg, Starlight text, same geometry.
- **Chip/tab (filters, timers)**: Graphite bg, Silver text; active = Starlight text + 1px Lead border brighten. Never white-filled chips over content.
- **Record**: near-black disc (#101018), concentric groove rings in Lead @ 10–20%, center label = band-tinted art, etched circular text `BAND · ~N Hz` in mono caps. Idle spin 8–12s/rev; playing spin ~1.8s/rev (33⅓ feel).
- **Record sleeve**: square (4px), Midnight Slate, band-tinted label art, Hanken 600 title (sleeve titles sit below the serif's display floor), mono metadata line. Hover: surface → Graphite + record peeks 8px out of sleeve.
- **Waveform ring**: hairline Starlight ring around playing record, radial ripple at scaled band frequency, peaks tinted to band.
- **Pulse trace**: 1px Starlight polyline, systolic peaks in band tint, draws left→right, mono BPM readout.
- **Input**: transparent bg, 1px Lead border, pill radius, Starlight text.
- **Bottom nav**: frosted glass bar (frost fill + saturate(180%) blur(20px)), 0.5px starlight hairline top border, content scrolls beneath it; icons+labels Silver; active = Starlight + 4px Mercury Blue dot. One accent for all five items.
- **Citation footnote**: mono superscript number, Silver; hover reveals source line.

## Motion
- Default UI ease: cubic-bezier(0.16, 1, 0.3, 1); tactile press/hover
  micro-interactions use the spring cubic-bezier(0.34, 1.56, 0.64, 1).
- Durations: 150ms micro (press/hover), 300–420ms transitions, 1200ms+ scenes.
- Ambient loops must be slow enough to ignore (≥8s periods) except band-paced elements.
- Scroll-zoom hero: sticky container + scroll-progress-driven transform; 3 parallax particle depths.
- prefers-reduced-motion: kill particle drift, record spin, scroll-jacking; keep opacity fades ≤300ms; hero becomes static composed scene with normal scroll.

## Do
- Reserve #5266eb exclusively for primary action.
- Put ALL expressive color in content (records, particles, traces), tinted by band.
- Use Instrument Serif 400 huge and airy (never below ~30px); Hanken 600 for
  small headings; mono for every number.
- Brighten on hover (Graphite → +4% L); soft depth only where a surface
  genuinely floats (cards, overlays, glass chrome).
- Use frosted glass for floating chrome (nav, overlays, toasts) — translucency
  over flat opacity.
- Keep photographic imagery ONLY inside record label/sleeve art, band-tinted.

## Don't
- No system-font headings. No weight >600. No bold serif, ever. No multicolor
  ring charts.
- No new saturated colors beyond the accent + band tints. No harsh/dark drop
  shadows — soft, low-opacity depth only (`shadows.soft`).
- No white-filled chips floating over imagery. No photos as page backgrounds.
- No video files. All motion is generative (canvas/CSS/SVG).
- No scientific claim without a real citation and a confidence tag.
