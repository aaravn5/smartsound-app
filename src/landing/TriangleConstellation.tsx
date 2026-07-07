import { Suspense, useMemo, useRef, type CSSProperties, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'

/**
 * TriangleConstellation — the signature morphing particle object.
 *
 * Thousands of soft triangular glyphs in blue/green hues that form shapes and
 * transform between them — the Dala idiom, rebuilt for SmartSound. The brain
 * is anatomical rather than a noisy ball: two cortical hemispheres with two
 * octaves of gyri folding, a striated cerebellum tucked low at the back, and
 * a tapering brainstem. Other targets: a beamed music note, a waveform, a
 * synapse network, a sphere.
 *
 * Modes:
 *   auto   — cycle through `shapes`, holding `holdSeconds` between morphs
 *   scroll — `progressRef` (0..1) sweeps across the whole `shapes` sequence
 *   static — hold shapes[0]
 *
 * Particles within reach of the pointer warm to yellow and ease back after.
 * `pulseRef` (0..1, optional) breathes the whole constellation — the player
 * feeds it so the object beats with you. Reduced motion: no sway, snapping
 * transitions, but scroll-driven morphs (user-initiated) still land.
 */

export type ShapeName =
  | 'brain'
  | 'note'
  | 'waveform'
  | 'network'
  | 'sphere'
  | 'dome'
  | 'dust'
  | 'bulb'
  | 'globe'
  | 'ribbon'
  | 'phone'

const HOVER_COLOR = new THREE.Color('#fad1ff')
const HOVER_RADIUS = 1.45

// The SmartSound spectrum — its own signal identity (not the reference's
// violet/amber): deep sky blues into sea greens with silver-blue ink.
// Yellow warmth stays reserved for the pointer.
const DEFAULT_PALETTE = [
  '#00a89c', '#00a89c', '#0cc4b4',
  '#2fd4c4', '#2fd4c4', '#63e8da',
  '#9ffcf0', '#cbfffc', '#cbfffc',
  '#edfffe', '#ffffff',
  '#fad1ff', '#fde9ff',
]

/** Every particle is a real 3D solid — one shared tetrahedron. */
const TETRA_GEOMETRY = new THREE.TetrahedronGeometry(1)

type HoverRef = MutableRefObject<{ x: number; y: number; active: boolean }>

// ── samplers — each returns positions (n*3) and a region id per particle ──

interface Sampled {
  pos: Float32Array
  /** 0..1 per particle — regions let the palette shade anatomy differently. */
  region: Float32Array
}

function sampleBrain(n: number): Sampled {
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const S = 1.9
  for (let i = 0; i < n; i++) {
    const kind = Math.random()
    let x = 0
    let y = 0
    let z = 0
    if (kind < 0.78) {
      // ── cortex: mirrored hemispheres, two octaves of gyri/sulci folding ──
      const side = i % 2 === 0 ? 1 : -1
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      let sx = Math.sin(v) * Math.cos(u)
      let sy = Math.sin(v) * Math.sin(u)
      const sz = Math.cos(v)
      // Coarse gyri + fine secondary folds, displaced along the normal.
      const g1 = Math.sin(u * 9 + Math.sin(v * 4) * 1.6) * Math.sin(v * 7)
      const g2 = Math.sin(u * 17 + 1.3) * Math.sin(v * 13 + 0.6)
      const r = (1 + 0.1 * g1 + 0.045 * g2) * (0.94 + 0.06 * Math.random())
      sx *= 1.12 * r
      sy *= 0.92 * r
      let zz = sz * 1.3 * r
      // Temporal-lobe bulge low on each side.
      if (sy < -0.1 && Math.abs(zz) < 0.7) sx *= 1.14
      // Flatten the basal surface the way a real brain sits.
      if (sy < -0.58) sy = -0.58 + (sy + 0.58) * 0.3
      // Frontal taper (front = +z).
      if (zz > 0.7) zz *= 0.92
      // Interhemispheric fissure.
      x = side * (Math.abs(sx) * 0.6 + 0.3)
      y = sy + 0.12
      z = zz
      region[i] = 0
    } else if (kind < 0.93) {
      // ── cerebellum: striated small lobes tucked low at the back ──
      const side = i % 2 === 0 ? 1 : -1
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      let r = 0.96 + 0.04 * Math.random()
      // Fine horizontal folia striations.
      r *= 1 + 0.07 * Math.sin(Math.cos(v) * 26)
      x = side * (Math.abs(Math.sin(v) * Math.cos(u)) * 0.5 + 0.06) * r
      y = -0.72 + Math.sin(v) * Math.sin(u) * 0.3 * r
      z = -0.78 + Math.cos(v) * 0.42 * r
      region[i] = 0.5
    } else {
      // ── brainstem: a tapering column curving down and back ──
      const t = Math.random()
      const a = Math.random() * Math.PI * 2
      const rad = 0.15 * (1 - t * 0.45) * Math.sqrt(Math.random())
      x = Math.cos(a) * rad
      y = -0.5 - t * 0.85
      z = -0.28 - t * 0.34 + Math.sin(a) * rad
      region[i] = 1
    }
    pos[i * 3] = x * S
    pos[i * 3 + 1] = y * S
    pos[i * 3 + 2] = z * S
  }
  return { pos, region }
}

function sampleNote(n: number): Sampled {
  // Beamed eighth notes (♫) — two tilted heads, two stems, one thick beam.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const S = 1.16
  for (let i = 0; i < n; i++) {
    const pick = Math.random()
    let x = 0
    let y = 0
    const z = (Math.random() - 0.5) * 0.3
    if (pick < 0.46) {
      const left = pick < 0.23
      const a = Math.random() * Math.PI * 2
      const rr = Math.sqrt(Math.random())
      const ex = Math.cos(a) * 0.62 * rr
      const ey = Math.sin(a) * 0.4 * rr
      const tilt = -0.35
      const cx = left ? -1.45 : 1.15
      const cy = left ? -1.55 : -1.15
      x = cx + ex * Math.cos(tilt) - ey * Math.sin(tilt)
      y = cy + ex * Math.sin(tilt) + ey * Math.cos(tilt)
      region[i] = 0
    } else if (pick < 0.61) {
      x = -0.86 + (Math.random() - 0.5) * 0.1
      y = -1.45 + Math.random() * 2.9
      region[i] = 0.5
    } else if (pick < 0.76) {
      x = 1.72 + (Math.random() - 0.5) * 0.1
      y = -1.05 + Math.random() * 2.8
      region[i] = 0.5
    } else {
      const t = Math.random()
      x = -0.86 + t * (1.72 - -0.86)
      y = 1.42 + t * (1.78 - 1.42) - Math.random() * 0.5
      region[i] = 1
    }
    pos[i * 3] = x * S
    pos[i * 3 + 1] = y * S
    pos[i * 3 + 2] = z
  }
  return { pos, region }
}

function sampleWaveform(n: number): Sampled {
  // A living waveform — carrier wave with harmonics, drawn as a thick ribbon.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = Math.random() * 2 - 1 // -1..1 across the width
    const x = t * 2.7
    const envelope = Math.exp(-t * t * 1.7)
    const yc =
      (Math.sin(t * 9.4) * 0.85 + Math.sin(t * 21.2 + 1.1) * 0.3 + Math.sin(t * 4.2 - 0.4) * 0.5) *
      envelope
    const thickness = 0.09 + 0.2 * envelope
    pos[i * 3] = x
    pos[i * 3 + 1] = yc + (Math.random() - 0.5) * thickness * 2
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    region[i] = Math.abs(yc) > 0.6 ? 1 : 0
  }
  return { pos, region }
}

function sampleNetwork(n: number): Sampled {
  // A synapse network — clustered nodes wired through space.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const nodes = 14
  const centers: [number, number, number][] = []
  for (let k = 0; k < nodes; k++) {
    centers.push([
      ((k % 5) - 2) * 1.15 + (Math.random() - 0.5) * 0.4,
      (Math.floor(k / 5) - 1) * 1.3 + (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 2.2,
    ])
  }
  for (let i = 0; i < n; i++) {
    if (i % 3 === 0) {
      const c = centers[i % nodes]
      pos[i * 3] = c[0] + (Math.random() - 0.5) * 0.5
      pos[i * 3 + 1] = c[1] + (Math.random() - 0.5) * 0.5
      pos[i * 3 + 2] = c[2] + (Math.random() - 0.5) * 0.5
      region[i] = 0
    } else {
      const a = centers[i % nodes]
      const b = centers[(i * 7 + 3) % nodes]
      const t = Math.random()
      pos[i * 3] = a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * 0.12
      pos[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * 0.12
      pos[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (Math.random() - 0.5) * 0.12
      region[i] = 1
    }
  }
  return { pos, region }
}

function sampleSphere(n: number): Sampled {
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(2 * Math.random() - 1)
    const R = 2.5
    pos[i * 3] = R * Math.sin(v) * Math.cos(u)
    pos[i * 3 + 1] = R * Math.sin(v) * Math.sin(u)
    pos[i * 3 + 2] = R * Math.cos(v)
    region[i] = Math.random()
  }
  return { pos, region }
}

function sampleDome(n: number): Sampled {
  // A rolling terrain dome filling the lower frame — the swarm as landscape.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (Math.random() * 2 - 1) * 4.4
    const z = (Math.random() * 2 - 1) * 2.6
    const hill =
      2.5 * Math.exp(-((x * x) / 6.5 + (z * z) / 3.2)) +
      0.5 * Math.sin(x * 2.1) * Math.cos(z * 2.6) * Math.exp(-Math.abs(x) * 0.25)
    const y = -1.7 + hill + Math.random() * 0.14
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
    region[i] = Math.min(1, Math.max(0, hill / 2.6))
  }
  return { pos, region }
}

function sampleDust(n: number): Sampled {
  // A weightless starfield — the swarm at rest between statements.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() * 2 - 1) * 5.2
    pos[i * 3 + 1] = (Math.random() * 2 - 1) * 3.2
    pos[i * 3 + 2] = (Math.random() * 2 - 1) * 3
    region[i] = Math.random()
  }
  return { pos, region }
}

function sampleBulb(n: number): Sampled {
  // A lightbulb, staged left of center: glass sphere, neck, screw base.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const X = -1.7
  for (let i = 0; i < n; i++) {
    const kind = Math.random()
    let x = 0
    let y = 0
    let z = 0
    if (kind < 0.72) {
      // glass — a sphere shell, slightly pear-stretched downward
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      const r = 1.35 * (0.97 + 0.03 * Math.random())
      x = r * Math.sin(v) * Math.cos(u)
      y = r * Math.sin(v) * Math.sin(u) * 1.12 + 0.75
      z = r * Math.cos(v)
      if (y < 0.2) x *= 0.82
      region[i] = 0
    } else if (kind < 0.9) {
      // neck — tapering into the base
      const t = Math.random()
      const a = Math.random() * Math.PI * 2
      const rad = (0.62 - t * 0.18) * Math.sqrt(Math.random() * 0.35 + 0.65)
      x = Math.cos(a) * rad
      y = -0.75 - t * 0.55
      z = Math.sin(a) * rad
      region[i] = 0.5
    } else {
      // screw threads — stacked rings
      const ring = (Math.random() * 3) | 0
      const a = Math.random() * Math.PI * 2
      x = Math.cos(a) * 0.44
      y = -1.42 - ring * 0.22
      z = Math.sin(a) * 0.44
      region[i] = 1
    }
    pos[i * 3] = x + X
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = z
  }
  return { pos, region }
}

function sampleGlobe(n: number): Sampled {
  // A planet, staged right of center — patchy landmass density over a faint
  // full shell, so continents read without any real geography.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const X = 1.55
  const R = 2.15
  let i = 0
  let guard = 0
  while (i < n && guard < n * 30) {
    guard++
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(2 * Math.random() - 1)
    const x = Math.sin(v) * Math.cos(u)
    const y = Math.sin(v) * Math.sin(u)
    const z = Math.cos(v)
    // Low-frequency lat/lon noise → landmass patches.
    const land =
      Math.sin(u * 2.2 + 0.8) * Math.sin(v * 3.1) +
      0.6 * Math.sin(u * 4.7 + 2.1) * Math.sin(v * 1.7 + 0.4)
    const isLand = land > 0.15
    // Keep all land samples; keep only a sparse shell elsewhere.
    if (!isLand && Math.random() > 0.18) continue
    pos[i * 3] = x * R + X
    pos[i * 3 + 1] = y * R
    pos[i * 3 + 2] = z * R
    region[i] = isLand ? (land > 0.8 ? 1 : 0.5) : 0
    i++
  }
  return { pos, region }
}

function sampleRibbon(n: number): Sampled {
  // The closing form — a loose helical ribbon breathing behind the sign-off.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = Math.random() * 2 - 1
    const a = t * Math.PI * 2.4
    const spread = 0.55 + Math.abs(t) * 0.35
    pos[i * 3] = Math.cos(a) * 1.9 + (Math.random() - 0.5) * spread
    pos[i * 3 + 1] = t * 2.4 + (Math.random() - 0.5) * spread * 0.8
    pos[i * 3 + 2] = Math.sin(a) * 1.4 + (Math.random() - 0.5) * spread
    region[i] = (t + 1) / 2
  }
  return { pos, region }
}


function samplePhone(n: number): Sampled {
  // The front face of a modern phone, drawn in pixels: a rounded portrait
  // slab, a brighter edge frame, and the island cutout near the top.
  const pos = new Float32Array(n * 3)
  const region = new Float32Array(n)
  const W = 1.05 // half-width
  const H = 2.15 // half-height
  const R = 0.34 // corner radius
  const inside = (x: number, y: number): boolean => {
    const qx = Math.abs(x) - (W - R)
    const qy = Math.abs(y) - (H - R)
    if (qx <= 0 || qy <= 0) return Math.abs(x) <= W && Math.abs(y) <= H
    return qx * qx + qy * qy <= R * R
  }
  const inIsland = (x: number, y: number): boolean =>
    Math.abs(y - 1.62) < 0.09 && Math.abs(x) < 0.34
  let i = 0
  let guard = 0
  while (i < n && guard < n * 40) {
    guard++
    const edge = Math.random() < 0.3
    let x = (Math.random() * 2 - 1) * W
    let y = (Math.random() * 2 - 1) * H
    if (edge) {
      // Bias onto the frame — walk a point to the border band.
      const side = Math.random()
      if (side < 0.5) {
        x = (Math.random() < 0.5 ? -1 : 1) * (W - 0.03 - Math.random() * 0.05)
        y = (Math.random() * 2 - 1) * H
      } else {
        y = (Math.random() < 0.5 ? -1 : 1) * (H - 0.03 - Math.random() * 0.05)
        x = (Math.random() * 2 - 1) * W
      }
    }
    if (!inside(x, y) || inIsland(x, y)) continue
    pos[i * 3] = x
    pos[i * 3 + 1] = y
    pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12
    region[i] = edge ? 1 : Math.abs(y) < 0.9 ? 0.5 : 0
    i++
  }
  return { pos, region }
}

const SAMPLERS: Record<ShapeName, (n: number) => Sampled> = {
  brain: sampleBrain,
  note: sampleNote,
  waveform: sampleWaveform,
  network: sampleNetwork,
  sphere: sampleSphere,
  dome: sampleDome,
  dust: sampleDust,
  bulb: sampleBulb,
  globe: sampleGlobe,
  ribbon: sampleRibbon,
  phone: samplePhone,
}

export interface TriangleConstellationProps {
  className?: string
  style?: CSSProperties
  shapes?: ShapeName[]
  mode?: 'auto' | 'scroll' | 'static'
  /** scroll mode — 0..1 sweeps the whole shapes sequence. */
  progressRef?: MutableRefObject<number>
  /** optional 0..1 heartbeat — breathes the constellation. */
  pulseRef?: MutableRefObject<number>
  /** optional live pulse getter (sampled per frame; wins over pulseRef). */
  getPulse?: () => number
  count?: number
  size?: number
  holdSeconds?: number
  rotate?: 'sway' | 'spin' | 'none'
  paletteOverride?: string[]
  cameraZ?: number
  particleOpacity?: number
  /** Lateral (x) staging per shape — e.g. { brain: 1.7 } parks the brain right of center. */
  stageOffsets?: Partial<Record<ShapeName, number>>
  /** Count of larger, always-present loner triangles drifting across the frame. */
  ambient?: number
}

function Cloud({
  shapes,
  mode,
  progressRef,
  pulseRef,
  getPulse,
  stageOffsets,
  count,
  size,
  holdSeconds,
  rotate,
  palette,
  particleOpacity,
  animate,
  hoverRef,
}: Required<
  Pick<
    TriangleConstellationProps,
    'shapes' | 'mode' | 'count' | 'size' | 'holdSeconds' | 'rotate' | 'particleOpacity'
  >
> & {
  progressRef?: MutableRefObject<number>
  pulseRef?: MutableRefObject<number>
  getPulse?: () => number
  palette: string[]
  animate: boolean
  hoverRef: HoverRef
  stageOffsets?: Partial<Record<ShapeName, number>>
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])

  const { targets, current, base, colors, spins, scales, offsets } = useMemo(() => {
    const sampled = shapes.map((s) => {
      const smp = SAMPLERS[s](count)
      const off = stageOffsets?.[s] ?? 0
      if (off) for (let k = 0; k < count; k++) smp.pos[k * 3] += off
      return smp
    })
    const targets = sampled.map((s) => s.pos)
    const current = Float32Array.from(targets[0])
    const base = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const col = new THREE.Color()
    // Region-aware shading: regions pick from different palette thirds so
    // anatomy (cortex vs cerebellum vs stem) reads through color.
    const r0 = sampled[0].region
    const third = Math.max(1, Math.floor(palette.length / 3))
    for (let i = 0; i < count; i++) {
      const lo = Math.min(palette.length - third, Math.round(r0[i] * 2) * third)
      col.set(palette[lo + ((Math.random() * third) | 0)])
      base[i * 3] = col.r
      base[i * 3 + 1] = col.g
      base[i * 3 + 2] = col.b
    }
    colors.set(base)
    // Per-instance life: tumble speeds + phase, size variance, physics offsets.
    const spins = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const offsets = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      spins[i * 3] = (Math.random() - 0.5) * 1.7
      spins[i * 3 + 1] = (Math.random() - 0.5) * 1.7
      spins[i * 3 + 2] = Math.random() * Math.PI * 2
      scales[i] = 0.55 + Math.random() * 1.05
    }
    return { targets, current, base, colors, spins, scales, offsets }
  }, [shapes, count, palette, stageOffsets])

  const st8 = useRef({ idx: 0, hold: 0 })
  const hoverPoint = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Vector3(), [])

  useFrame((st, dt) => {
    const pts = mesh.current
    if (!pts) return
    const t = st.clock.elapsedTime
    if (animate && rotate === 'sway') pts.rotation.y = Math.sin(t * 0.22) * 0.42
    if (animate && rotate === 'spin') pts.rotation.y += dt * 0.14

    // Heartbeat breathing.
    const pulse = getPulse ? getPulse() : (pulseRef?.current ?? 0)
    const breathe = 1 + pulse * 0.05 + (animate ? Math.sin(t * 0.8) * 0.012 : 0)
    pts.scale.setScalar(breathe)

    // ── choose the morph target ──
    let targetA = targets[0]
    let targetB = targets[0]
    let blend = 0
    if (mode === 'auto' && targets.length > 1) {
      if (animate) {
        st8.current.hold += dt
        if (st8.current.hold > holdSeconds) {
          st8.current.hold = 0
          st8.current.idx = (st8.current.idx + 1) % targets.length
        }
      }
      targetA = targets[st8.current.idx]
      blend = 0
    } else if (mode === 'scroll' && progressRef && targets.length > 1) {
      const p = Math.min(1, Math.max(0, progressRef.current)) * (targets.length - 1)
      const i0 = Math.min(targets.length - 2, Math.floor(p))
      const frac = p - i0
      const e = frac < 0.5 ? 2 * frac * frac : 1 - Math.pow(-2 * frac + 2, 2) / 2
      targetA = targets[i0]
      targetB = targets[i0 + 1]
      blend = e
    }
    const speed = animate ? Math.min(1, dt * 4.2) : 1
    for (let i = 0; i < current.length; i++) {
      const target = blend === 0 ? targetA[i] : targetA[i] + (targetB[i] - targetA[i]) * blend
      current[i] += (target - current[i]) * speed
    }

    // ── pointer: warmth + physical repulsion ──
    const hover = hoverRef.current
    let hasHover = false
    if (hover.active) {
      ray.set(hover.x, hover.y, 0.5).unproject(st.camera)
      ray.sub(st.camera.position).normalize()
      if (ray.z < -1e-4) {
        const dist = -st.camera.position.z / ray.z
        hoverPoint.copy(st.camera.position).addScaledVector(ray, dist)
        pts.updateMatrixWorld()
        pts.worldToLocal(hoverPoint)
        hasHover = true
      }
    }
    const R2 = HOVER_RADIUS * HOVER_RADIUS
    const k = animate ? Math.min(1, dt * 7) : 1
    const settle = animate ? Math.pow(0.12, dt) : 0 // displaced solids spring home
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let f = 0
      if (hasHover) {
        const dx = current[i3] + offsets[i3] - hoverPoint.x
        const dy = current[i3 + 1] + offsets[i3 + 1] - hoverPoint.y
        const dz = current[i3 + 2] + offsets[i3 + 2] - hoverPoint.z
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < R2) {
          f = 1 - d2 / R2
          f *= f
          // The swarm physically parts around the pointer.
          if (animate && d2 > 1e-6) {
            const d = Math.sqrt(d2)
            const push = f * dt * 5.5
            offsets[i3] += (dx / d) * push
            offsets[i3 + 1] += (dy / d) * push
            offsets[i3 + 2] += (dz / d) * push
          }
        }
      }
      offsets[i3] *= settle
      offsets[i3 + 1] *= settle
      offsets[i3 + 2] *= settle
      colors[i3] += (base[i3] + (HOVER_COLOR.r - base[i3]) * f - colors[i3]) * k
      colors[i3 + 1] += (base[i3 + 1] + (HOVER_COLOR.g - base[i3 + 1]) * f - colors[i3 + 1]) * k
      colors[i3 + 2] += (base[i3 + 2] + (HOVER_COLOR.b - base[i3 + 2]) * f - colors[i3 + 2]) * k

      // Compose this solid: position + individual tumble + size variance.
      dummy.position.set(current[i3] + offsets[i3], current[i3 + 1] + offsets[i3 + 1], current[i3 + 2] + offsets[i3 + 2])
      const rt = animate ? t : 0
      const phase = spins[i3 + 2]
      dummy.rotation.set(spins[i3] * rt + phase, spins[i3 + 1] * rt + phase * 1.7, phase * 0.6)
      dummy.scale.setScalar(scales[i] * size)
      dummy.updateMatrix()
      pts.setMatrixAt(i, dummy.matrix)
      tint.setRGB(colors[i3], colors[i3 + 1], colors[i3 + 2])
      pts.setColorAt(i, tint)
    }
    pts.instanceMatrix.needsUpdate = true
    if (pts.instanceColor) pts.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[TETRA_GEOMETRY, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.35}
        roughness={0.32}
        emissive="#ffffff"
        emissiveIntensity={0.05}
        transparent
        opacity={particleOpacity}
      />
    </instancedMesh>
  )
}

export function TriangleConstellation({
  className,
  style,
  shapes = ['brain', 'note'],
  mode = 'auto',
  progressRef,
  pulseRef,
  getPulse,
  count = 5200,
  size = 0.082,
  holdSeconds = 3.6,
  rotate = 'sway',
  paletteOverride,
  cameraZ = 7.2,
  particleOpacity = 0.95,
  stageOffsets,
  ambient = 0,
}: TriangleConstellationProps) {
  const reduce = useReducedMotion()
  const hover = useRef({ x: 0, y: 0, active: false })
  return (
    <div
      className={className}
      style={style}
      aria-hidden
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        hover.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
        hover.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1)
        hover.current.active = true
      }}
      onPointerLeave={() => {
        hover.current.active = false
      }}
    >
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        {/* Studio lighting — the solids read as lit glass-metal, not sprites. */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 8]} intensity={1.5} />
        <pointLight position={[-6, -2, 5]} intensity={40} color="#00c2b4" />
        <pointLight position={[6, 3, -3]} intensity={30} color="#fad1ff" />
        <Suspense fallback={null}>
          <Cloud
            shapes={shapes}
            mode={mode}
            progressRef={progressRef}
            pulseRef={pulseRef}
            getPulse={getPulse}
            count={count}
            size={size}
            holdSeconds={holdSeconds}
            rotate={rotate}
            palette={paletteOverride ?? DEFAULT_PALETTE}
            particleOpacity={particleOpacity}
            animate={!reduce}
            hoverRef={hover}
            stageOffsets={stageOffsets}
          />
          {ambient > 0 && (
            <AmbientDust count={ambient} palette={paletteOverride ?? DEFAULT_PALETTE} animate={!reduce} />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

/** Larger loner tetrahedra drifting across the whole frame — always present,
 * never part of the morph, giving the void its 3D depth. */
function AmbientDust({
  count,
  palette,
  animate,
}: {
  count: number
  palette: string[]
  animate: boolean
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spin = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const cols: THREE.Color[] = []
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 6.5
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 4
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 3.5
      spin[i * 3] = (Math.random() - 0.5) * 0.7
      spin[i * 3 + 1] = (Math.random() - 0.5) * 0.7
      spin[i * 3 + 2] = Math.random() * Math.PI * 2
      scale[i] = 0.08 + Math.random() * 0.2
      cols.push(new THREE.Color(palette[(Math.random() * palette.length) | 0]))
    }
    return { pos, spin, scale, cols }
  }, [count, palette])

  useFrame((st) => {
    const m = mesh.current
    if (!m) return
    const t = animate ? st.clock.elapsedTime : 0
    m.rotation.y = t * 0.02
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      dummy.position.set(data.pos[i3], data.pos[i3 + 1], data.pos[i3 + 2])
      const phase = data.spin[i3 + 2]
      dummy.rotation.set(data.spin[i3] * t + phase, data.spin[i3 + 1] * t + phase * 1.7, 0)
      dummy.scale.setScalar(data.scale[i])
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, data.cols[i])
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[TETRA_GEOMETRY, undefined, count]} frustumCulled={false}>
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.35}
        roughness={0.35}
        emissive="#ffffff"
        emissiveIntensity={0.04}
        transparent
        opacity={0.55}
      />
    </instancedMesh>
  )
}
