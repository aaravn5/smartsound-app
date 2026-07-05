#!/usr/bin/env node
/**
 * Scrim contrast audit — asserts WCAG AA (≥4.5:1) for text over every scene
 * surface, photographic AND procedural, using the exact scrim gradients and
 * palette values the app renders.
 *
 * What is audited (zone = fraction of surface height):
 *   · card tiles   (CARD scrim)   — label zone y 0.78–0.97 (title + meta)
 *   · page shell   (PAGE scrim)   — header zone y 0.02–0.12 (ScreenTitle)
 *                                   and content-bottom zone y 0.80–0.97
 *   · immersive    (CANVAS scrim) — bottom zone y 0.80–0.97 (hero copy,
 *                                   player transport)
 *
 * Method: each scene photo is decoded with sharp and downscaled to 96×96;
 * for every pixel row in a zone the scrim alpha is computed from the same
 * gradient stops as src/design/Scene.tsx, each pixel is composited with the
 * scrim color, and the WORST pixel contrast against the composited text
 * color must clear 4.5:1. Procedural scenes are audited from
 * src/design/procedural-palettes.json (the same values the component
 * renders): sky top for the header zone, terrain/water colors for bottoms.
 *
 * Run: npm run contrast:audit
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ── tokens (mirrors src/design/Scene.tsx + index.css) ──────────────────────
const SCRIM_RGB = [6, 16, 38]
// Primary on-scene text: rgba(248,247,252,0.96); card titles: rgba(255,255,255,0.98)
const TEXT_PRIMARY = { rgb: [248, 247, 252], alpha: 0.96 }
const TEXT_CARD = { rgb: [255, 255, 255], alpha: 0.98 }

// Gradient stops [position, alpha] — keep in sync with Scene.tsx.
const SCRIMS = {
  canvas: [[0, 0.76], [0.22, 0.64], [0.42, 0.2], [0.58, 0.26], [0.78, 0.62], [1, 0.88]],
  page: [[0, 0.76], [0.14, 0.66], [0.26, 0.46], [0.55, 0.42], [0.78, 0.66], [1, 0.9]],
  card: [[0, 0.14], [0.26, 0], [0.44, 0], [0.72, 0.54], [1, 0.88]],
}

const PHOTOS = {
  ocean: 'public/scenes/ocean.webp',
  dusk: 'public/scenes/dusk.webp',
  forest: 'public/scenes/forest.webp',
  dawn: 'public/scenes/dawn.webp',
  aurora: 'public/scenes/aurora.webp',
}

const PALETTES = JSON.parse(readFileSync(path.join(root, 'src/design/procedural-palettes.json'), 'utf8'))

// ── color math ──────────────────────────────────────────────────────────────
const srgbToLinear = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
const relLuminance = ([r, g, b]) =>
  0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
const mix = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t)
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

function scrimAlphaAt(stops, y) {
  for (let i = 1; i < stops.length; i++) {
    const [p0, a0] = stops[i - 1]
    const [p1, a1] = stops[i]
    if (y <= p1) return a0 + ((y - p0) / (p1 - p0)) * (a1 - a0)
  }
  return stops[stops.length - 1][1]
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Contrast of text over (pixel ⊕ scrim(alpha)) — text alpha composited too. */
function textContrastOver(pixelRgb, scrimAlpha, text) {
  const bg = mix(pixelRgb, SCRIM_RGB, scrimAlpha)
  const fg = mix(bg, text.rgb, text.alpha)
  return contrast(relLuminance(fg), relLuminance(bg))
}

// ── audits ──────────────────────────────────────────────────────────────────
const SIZE = 96
const failures = []
const rows = []

function auditPixels(name, surface, pixels, zone, stops, text) {
  let worst = Infinity
  for (let y = Math.floor(zone[0] * SIZE); y < Math.ceil(zone[1] * SIZE); y++) {
    const alpha = scrimAlphaAt(stops, y / (SIZE - 1))
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 3
      const c = textContrastOver([pixels[i], pixels[i + 1], pixels[i + 2]], alpha, text)
      if (c < worst) worst = c
    }
  }
  report(name, surface, zone, worst)
}

function auditFlat(name, surface, rgb, zoneLabel, alpha, text) {
  const c = textContrastOver(rgb, alpha, text)
  report(name, surface, zoneLabel, c)
}

function report(name, surface, zone, worst) {
  const zoneStr = Array.isArray(zone) ? `y ${zone[0]}–${zone[1]}` : zone
  const pass = worst >= 4.5
  rows.push(
    `${pass ? ' PASS ' : ' FAIL '} ${name.padEnd(22)} ${surface.padEnd(8)} ${zoneStr.padEnd(14)} worst ${worst.toFixed(2)}:1`,
  )
  if (!pass) failures.push(`${name}/${surface}/${zoneStr} → ${worst.toFixed(2)}:1`)
}

for (const [id, file] of Object.entries(PHOTOS)) {
  const { data } = await sharp(path.join(root, file))
    .resize(SIZE, SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  auditPixels(`photo:${id}`, 'card', data, [0.78, 0.97], SCRIMS.card, TEXT_CARD)
  auditPixels(`photo:${id}`, 'page', data, [0.02, 0.12], SCRIMS.page, TEXT_PRIMARY)
  auditPixels(`photo:${id}`, 'page', data, [0.8, 0.97], SCRIMS.page, TEXT_PRIMARY)
  // Player now-playing header (title/band) sits in the canvas top band.
  auditPixels(`photo:${id}`, 'canvas', data, [0.06, 0.2], SCRIMS.canvas, TEXT_PRIMARY)
  auditPixels(`photo:${id}`, 'canvas', data, [0.8, 0.97], SCRIMS.canvas, TEXT_PRIMARY)
}

for (const [id, p] of Object.entries(PALETTES)) {
  const skyTop = hexToRgb(p.sky[0])
  const bottom = hexToRgb(p.bottom)
  // Header zone worst case: brightest sky band + weakest top alpha in zone.
  auditFlat(`procedural:${id}`, 'page', skyTop, 'header/top', scrimAlphaAt(SCRIMS.page, 0.12), TEXT_PRIMARY)
  auditFlat(`procedural:${id}`, 'page', bottom, 'bottom', scrimAlphaAt(SCRIMS.page, 0.8), TEXT_PRIMARY)
  auditFlat(`procedural:${id}`, 'canvas', bottom, 'bottom', scrimAlphaAt(SCRIMS.canvas, 0.8), TEXT_PRIMARY)
  auditFlat(`procedural:${id}`, 'card', bottom, 'label', scrimAlphaAt(SCRIMS.card, 0.8), TEXT_CARD)
  if (p.water) {
    const sheenBase = hexToRgb(p.water.base)
    auditFlat(`procedural:${id}`, 'canvas', sheenBase, 'water', scrimAlphaAt(SCRIMS.canvas, 0.85), TEXT_PRIMARY)
  }
  // The horizon glow adds ≤ its own alpha of near-amber light mid-frame; the
  // audited text zones sit below (bottom) or above (header) the glow band.
}

console.log('Scrim contrast audit — WCAG AA target 4.5:1, worst pixel per zone')
console.log(rows.join('\n'))
if (failures.length) {
  console.error(`\n${failures.length} zone(s) FAILED:\n  ${failures.join('\n  ')}`)
  process.exit(1)
}
console.log(`\nAll ${rows.length} zones pass AA.`)
