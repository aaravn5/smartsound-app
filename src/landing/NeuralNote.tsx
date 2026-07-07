import { Suspense, useMemo, useRef, type MutableRefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'

/**
 * NeuralNote — a Dala-idiom particle constellation for the landing.
 *
 * Thousands of soft triangular particles in blue/green hues form a BRAIN that
 * morphs into a beamed MUSIC NOTE as the visitor scrolls through the pinned
 * stage (progress 0 → 1 comes in via `progressRef`, written by the scroll
 * observer — no re-renders per frame). Particles near the pointer warm to
 * yellow, so touching the constellation lights it up.
 *
 * Reduced motion: the sway stops and the morph/color changes snap instead of
 * easing — the scroll-driven transform itself is user-initiated, so it stays.
 */

const COUNT = 4200

// Blue/green spectrum — cool signal colors; yellow is reserved for the pointer.
const PALETTE = [
  '#4aa8ff', '#4aa8ff', // sky blue (weighted)
  '#5c7cff', '#3b82f6', // indigo / azure
  '#37c2a0', '#37c2a0', // sea green (weighted)
  '#2fb89b', '#63e0c2', // teal / mint
  '#7bd4ff', '#25a08a', // ice / deep green
]
const HOVER_COLOR = new THREE.Color('#ffd24a')
const HOVER_RADIUS = 1.45

type HoverRef = MutableRefObject<{ x: number; y: number; active: boolean }>

/** A soft triangle sprite so every particle reads as a tiny glyph, not a dot. */
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

// ── shape samplers — each returns a Float32Array(COUNT*3) target cloud ──

function sampleBrain(n: number): Float32Array {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    // Two mirrored lobes with a central fissure + surface noise → organic brain.
    const side = i % 2 === 0 ? 1 : -1
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(2 * Math.random() - 1)
    let x = Math.sin(v) * Math.cos(u)
    let y = Math.sin(v) * Math.sin(u)
    let z = Math.cos(v)
    const r = 1 + 0.14 * Math.sin(u * 6) * Math.sin(v * 5) // gyri/sulci wrinkles
    x *= 1.15 * r
    y *= 0.95 * r
    z *= 1.25 * r
    out[i * 3] = side * (Math.abs(x) * 0.62 + 0.34) * 1.9 // hemispheric split
    out[i * 3 + 1] = y * 1.9 + 0.1
    out[i * 3 + 2] = z * 1.9
  }
  return out
}

function sampleNote(n: number): Float32Array {
  // Beamed eighth notes (♫) — two tilted heads, two stems, one thick beam.
  // Mostly planar with slight depth so the glyph reads instantly.
  const out = new Float32Array(n * 3)
  const SCALE = 1.16
  for (let i = 0; i < n; i++) {
    const pick = Math.random()
    let x = 0
    let y = 0
    const z = (Math.random() - 0.5) * 0.3
    if (pick < 0.46) {
      // note heads — filled ellipses, tilted like set type
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
    } else if (pick < 0.61) {
      // left stem
      x = -0.86 + (Math.random() - 0.5) * 0.1
      y = -1.45 + Math.random() * 2.9
    } else if (pick < 0.76) {
      // right stem
      x = 1.72 + (Math.random() - 0.5) * 0.1
      y = -1.05 + Math.random() * 2.8
    } else {
      // beam — a thick slanted slab joining the stem tops
      const t = Math.random()
      x = -0.86 + t * (1.72 - -0.86)
      y = 1.42 + t * (1.78 - 1.42) - Math.random() * 0.5
    }
    out[i * 3] = x * SCALE
    out[i * 3 + 1] = y * SCALE
    out[i * 3 + 2] = z
  }
  return out
}

function Constellation({
  animate,
  progressRef,
  hoverRef,
}: {
  animate: boolean
  progressRef: MutableRefObject<number>
  hoverRef: HoverRef
}) {
  const points = useRef<THREE.Points>(null)
  const tex = useTriangleTexture()

  const { geometry, brain, note, current, base, colors } = useMemo(() => {
    const brain = sampleBrain(COUNT)
    const note = sampleNote(COUNT)
    const current = Float32Array.from(brain)
    const base = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const col = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      col.set(PALETTE[(Math.random() * PALETTE.length) | 0])
      base[i * 3] = col.r
      base[i * 3 + 1] = col.g
      base[i * 3 + 2] = col.b
    }
    colors.set(base)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(current, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, brain, note, current, base, colors }
  }, [])

  const hoverPoint = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Vector3(), [])

  useFrame((st, dt) => {
    const pts = points.current
    if (!pts) return
    if (animate) pts.rotation.y = Math.sin(st.clock.elapsedTime * 0.22) * 0.42

    // Scroll-driven morph: brain (0) → music note (1), easeInOut.
    const p = Math.min(1, Math.max(0, progressRef.current))
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
    const speed = animate ? Math.min(1, dt * 4.5) : 1
    for (let i = 0; i < current.length; i++) {
      const target = brain[i] + (note[i] - brain[i]) * e
      current[i] += (target - current[i]) * speed
    }
    ;(geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

    // Pointer → yellow. Unproject the pointer onto the z=0 plane, bring it into
    // the (swaying) local space, then warm every particle within reach.
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
    for (let i = 0; i < COUNT; i++) {
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
        size={0.085}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.95}
      />
    </points>
  )
}

export function NeuralNote({
  className,
  progressRef,
}: {
  className?: string
  progressRef: MutableRefObject<number>
}) {
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
        camera={{ position: [0, 0, 7.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Constellation animate={!reduce} progressRef={progressRef} hoverRef={hover} />
        </Suspense>
      </Canvas>
    </div>
  )
}
