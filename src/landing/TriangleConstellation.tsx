import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
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

export type ShapeName = 'brain' | 'note' | 'waveform' | 'network' | 'sphere'

const HOVER_COLOR = new THREE.Color('#ffd24a')
const HOVER_RADIUS = 1.45

// Blue/green signal spectrum; yellow stays reserved for the pointer.
const DEFAULT_PALETTE = [
  '#4aa8ff', '#4aa8ff',
  '#5c7cff', '#3b82f6',
  '#37c2a0', '#37c2a0',
  '#2fb89b', '#63e0c2',
  '#7bd4ff', '#25a08a',
]

type HoverRef = MutableRefObject<{ x: number; y: number; active: boolean }>

/** Soft triangle sprite so each particle reads as a glyph, not a dot. */
function useTriangleTexture(): THREE.Texture {
  return useMemo(() => {
    const S = 64
    const c = document.createElement('canvas')
    c.width = c.height = S
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, S, S)
    ctx.beginPath()
    ctx.moveTo(S * 0.5, S * 0.12)
    ctx.lineTo(S * 0.88, S * 0.82)
    ctx.lineTo(S * 0.12, S * 0.82)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fill()
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

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

const SAMPLERS: Record<ShapeName, (n: number) => Sampled> = {
  brain: sampleBrain,
  note: sampleNote,
  waveform: sampleWaveform,
  network: sampleNetwork,
  sphere: sampleSphere,
}

export interface TriangleConstellationProps {
  className?: string
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
}

function Cloud({
  shapes,
  mode,
  progressRef,
  pulseRef,
  getPulse,
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
}) {
  const points = useRef<THREE.Points>(null)
  const tex = useTriangleTexture()

  const { geometry, targets, current, base, colors } = useMemo(() => {
    const sampled = shapes.map((s) => SAMPLERS[s](count))
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
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(current, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, targets, current, base, colors }
  }, [shapes, count, palette])

  const st8 = useRef({ idx: 0, hold: 0 })
  const hoverPoint = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Vector3(), [])

  useFrame((st, dt) => {
    const pts = points.current
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
    ;(geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

    // ── pointer → yellow ──
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
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let f = 0
      if (hasHover) {
        const dx = current[i3] - hoverPoint.x
        const dy = current[i3 + 1] - hoverPoint.y
        const dz = current[i3 + 2] - hoverPoint.z
        const d2 = dx * dx + dy * dy + dz * dz
        if (d2 < R2) {
          f = 1 - d2 / R2
          f *= f
        }
      }
      colors[i3] += (base[i3] + (HOVER_COLOR.r - base[i3]) * f - colors[i3]) * k
      colors[i3 + 1] += (base[i3 + 1] + (HOVER_COLOR.g - base[i3 + 1]) * f - colors[i3 + 1]) * k
      colors[i3 + 2] += (base[i3 + 2] + (HOVER_COLOR.b - base[i3 + 2]) * f - colors[i3 + 2]) * k
    }
    ;(geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        map={tex}
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={particleOpacity}
      />
    </points>
  )
}

export function TriangleConstellation({
  className,
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
}: TriangleConstellationProps) {
  const reduce = useReducedMotion()
  const hover = useRef({ x: 0, y: 0, active: false })
  return (
    <div
      className={className}
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
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
