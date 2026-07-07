import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'

/**
 * SynaptifyBrain — the signature Dala-idiom hero, rebuilt for Synaptify.
 *
 * Thousands of tiny triangular particles in a violet/amber/teal spectrum that
 * continuously MORPH between forms — a neural brain, a sphere, a torus knot, a
 * synapse network — drifting on the pure-black void. Knowledge visualized as
 * distributed intelligence: the constellation is the brand. Positions lerp
 * toward the active target every frame; the target auto-advances so the cloud
 * is always transforming into a different object. Reduced-motion holds the
 * brain, still.
 */

const COUNT = 4200

// The chromatic spectrum — violet-dominant, amber + teal sparks, assorted blues.
const PALETTE = [
  '#8052ff', '#8052ff', '#8052ff', // Electric Iris (weighted)
  '#9a7bff', '#6a4bd6',
  '#ffb829', '#ffcf6b', // Saffron sparks
  '#15846e', '#2fb89b', // Deep Verdant teal
  '#c05cff', '#5c7cff', // magenta / blue
]

/** A soft-edged triangle sprite so every particle reads as a triangle glyph. */
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
    out[i * 3] = side * (Math.abs(x) * 0.62 + 0.34) * 1.9 // split into hemispheres
    out[i * 3 + 1] = y * 1.9 + 0.1
    out[i * 3 + 2] = z * 1.9
  }
  return out
}

function sampleSphere(n: number): Float32Array {
  const out = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(2 * Math.random() - 1)
    const R = 2.6
    out[i * 3] = R * Math.sin(v) * Math.cos(u)
    out[i * 3 + 1] = R * Math.sin(v) * Math.sin(u)
    out[i * 3 + 2] = R * Math.cos(v)
  }
  return out
}

function sampleTorus(n: number): Float32Array {
  const out = new Float32Array(n * 3)
  const R = 1.9
  const r = 0.75
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    out[i * 3] = (R + r * Math.cos(v)) * Math.cos(u)
    out[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u)
    out[i * 3 + 2] = r * Math.sin(v)
  }
  return out
}

function sampleNetwork(n: number): Float32Array {
  // A synapse network — clustered nodes wired through space.
  const out = new Float32Array(n * 3)
  const nodes = 14
  const centers: [number, number, number][] = []
  for (let k = 0; k < nodes; k++) {
    centers.push([
      (k % 5 - 2) * 1.15 + (Math.random() - 0.5) * 0.4,
      (Math.floor(k / 5) - 1) * 1.3 + (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 2.2,
    ])
  }
  for (let i = 0; i < n; i++) {
    if (i % 3 === 0) {
      // node cluster
      const c = centers[i % nodes]
      out[i * 3] = c[0] + (Math.random() - 0.5) * 0.5
      out[i * 3 + 1] = c[1] + (Math.random() - 0.5) * 0.5
      out[i * 3 + 2] = c[2] + (Math.random() - 0.5) * 0.5
    } else {
      // wire between two nodes
      const a = centers[i % nodes]
      const b = centers[(i * 7 + 3) % nodes]
      const t = Math.random()
      out[i * 3] = a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * 0.12
      out[i * 3 + 1] = a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * 0.12
      out[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (Math.random() - 0.5) * 0.12
    }
  }
  return out
}

function Constellation({ animate }: { animate: boolean }) {
  const points = useRef<THREE.Points>(null)
  const tex = useTriangleTexture()

  const { geometry, targets, current } = useMemo(() => {
    const shapes = [sampleBrain(COUNT), sampleNetwork(COUNT), sampleSphere(COUNT), sampleTorus(COUNT)]
    const current = Float32Array.from(shapes[0])
    const colors = new Float32Array(COUNT * 3)
    const scale = new Float32Array(COUNT)
    const col = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      col.set(PALETTE[(Math.random() * PALETTE.length) | 0])
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
      scale[i] = 0.6 + Math.random() * 0.9
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(current, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, targets: shapes, current }
  }, [])

  const state = useRef({ idx: 0, hold: 0 })

  useFrame((_, dt) => {
    const pts = points.current
    if (!pts) return
    if (animate) pts.rotation.y += dt * 0.12

    const target = targets[state.current.idx ?? 0]
    // Lerp every particle toward the active target shape.
    const speed = Math.min(1, dt * 1.6)
    for (let i = 0; i < current.length; i++) {
      current[i] += (target[i] - current[i]) * speed
    }
    ;(geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true

    if (animate) {
      state.current.hold += dt
      if (state.current.hold > 3.4) {
        state.current.hold = 0
        state.current.idx = (state.current.idx + 1) % targets.length
      }
    }
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

export function SynaptifyBrain({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Constellation animate={!reduce} />
        </Suspense>
      </Canvas>
    </div>
  )
}
