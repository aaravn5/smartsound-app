#!/usr/bin/env node
/**
 * Landing hero contrast audit — asserts WCAG AA (≥4.5:1) for the landing's
 * white ink over the boomerang video in EVERY text zone, using the exact
 * HERO_SCRIM gradient from src/routes/index.tsx.
 *
 * Method (same as scripts/contrast-audit.mjs): frames are extracted from
 * public/intro/hero-loop.mp4 with ffmpeg (start / middle / end — run
 * `npm run` step below first), downscaled with sharp, composited with the
 * scrim alpha for their pixel row, and the WORST pixel contrast per zone
 * must clear 4.5:1. The UNGRADED frame is audited — the morning daypart
 * applies no filter, so it is the brightest (worst) case; every other
 * daypart only darkens.
 *
 * Zones (fractions of viewport height):
 *   header    0.02–0.10  (wordmark, nav, auth pills)
 *   hero      0.26–0.62  (badge, headline, subtext, CTAs, search)
 *   bottom    0.72–0.99  (record caption, footer microline)
 *
 * Run:
 *   ffmpeg -y -i public/intro/hero-loop.mp4 -vf "select='eq(n,0)+eq(n,96)+eq(n,190)'" -vsync 0 /tmp/hero-frame-%d.png
 *   node scripts/hero-contrast-audit.mjs
 */
import sharp from 'sharp'

// ── mirrors HERO_SCRIM in src/routes/index.tsx — keep in sync ──────────────
const SCRIM_RGB = [4, 8, 22]
const SCRIM_STOPS = [
  [0, 0.68],
  [0.16, 0.56],
  [0.34, 0.56],
  [0.52, 0.6],
  [0.68, 0.68],
  [0.84, 0.82],
  [1, 0.92],
]
// Primary landing ink: rgba(255,255,255,0.9) subtext is the weakest text.
const TEXT = { rgb: [255, 255, 255], alpha: 0.9 }

const ZONES = {
  header: [0.02, 0.1],
  hero: [0.26, 0.62],
  bottom: [0.72, 0.99],
}

const srgbToLinear = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
const relLuminance = ([r, g, b]) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
const contrast = (a, b) => {
  const [hi, lo] = [Math.max(a, b), Math.min(a, b)]
  return (hi + 0.05) / (lo + 0.05)
}
const mix = (top, alpha, under) => under.map((c, i) => top[i] * alpha + c * (1 - alpha))

function scrimAlphaAt(y) {
  for (let i = 1; i < SCRIM_STOPS.length; i++) {
    const [p0, a0] = SCRIM_STOPS[i - 1]
    const [p1, a1] = SCRIM_STOPS[i]
    if (y <= p1) return a0 + ((y - p0) / (p1 - p0)) * (a1 - a0)
  }
  return SCRIM_STOPS[SCRIM_STOPS.length - 1][1]
}

const SIZE = 96
let failures = 0

for (const frameNo of [1, 2, 3]) {
  const file = `/tmp/hero-frame-${frameNo}.png`
  let raw
  try {
    raw = await sharp(file).resize(SIZE, SIZE, { fit: 'fill' }).raw().toBuffer()
  } catch {
    console.error(`missing ${file} — run the ffmpeg extract first (see header)`)
    process.exit(2)
  }
  for (const [zone, [y0, y1]] of Object.entries(ZONES)) {
    let worst = Infinity
    let worstAt = null
    for (let py = Math.floor(y0 * SIZE); py < Math.ceil(y1 * SIZE); py++) {
      const alpha = scrimAlphaAt(py / (SIZE - 1))
      for (let px = 0; px < SIZE; px++) {
        const i = (py * SIZE + px) * 3
        const pixel = [raw[i], raw[i + 1], raw[i + 2]]
        const surface = mix(SCRIM_RGB, alpha, pixel)
        const ink = mix(TEXT.rgb, TEXT.alpha, surface)
        const c = contrast(relLuminance(ink), relLuminance(surface))
        if (c < worst) {
          worst = c
          worstAt = [px, py]
        }
      }
    }
    const ok = worst >= 4.5
    if (!ok) failures++
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  frame ${frameNo}  ${zone.padEnd(6)}  worst ${worst.toFixed(2)}:1  at ${worstAt}`,
    )
  }
}

process.exit(failures > 0 ? 1 : 0)
