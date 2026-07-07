import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'

/**
 * RecordHero — the Desktop.fm hero object, as a record.
 *
 * A single 3D-rendered asset floating on the flat calming-grey canvas: a
 * matte-black vinyl with concentric groove speculars and a paper label,
 * ringed by a polished chrome rim that catches a cool blue-white highlight on
 * the left and a warm one on the right (a local Lightformer environment — no
 * network HDR). Two thin laser lines in the calming-blue signal gradient cross
 * diagonally through the scene. The disc floats at a slight backward tilt and
 * turns slowly (33⅓ at rest); reduced-motion freezes it.
 *
 * This is the ONLY source of colour on the page — the chrome + the blue laser,
 * exactly as Desktop.fm lets its rendered object carry the whole palette.
 */

// The one colour — calming blue → soft periwinkle (matches --signal's band).
const LASER_A = '#5872e6'
const LASER_B = '#8aa2f2'

/** A procedural groove texture: concentric rings + a paper label + spindle. */
function useGrooveTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const S = 1024
    const c = document.createElement('canvas')
    c.width = c.height = S
    const ctx = c.getContext('2d')!
    const cx = S / 2
    const cy = S / 2

    // Matte-black vinyl base.
    ctx.fillStyle = '#0a0a0c'
    ctx.beginPath()
    ctx.arc(cx, cy, cx, 0, Math.PI * 2)
    ctx.fill()

    // Concentric grooves — faint light rings that catch the rim light as the
    // disc turns. Denser toward the rim, sparser near the label.
    const outer = cx * 0.98
    const labelR = cx * 0.34
    for (let r = labelR + 6; r < outer; r += 2.2) {
      ctx.strokeStyle = `rgba(150, 156, 172, ${0.03 + 0.05 * (0.5 + 0.5 * Math.sin(r * 0.9))})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Paper label — soft off-white, a faint concentric print ring.
    const lab = ctx.createRadialGradient(cx, cy, 0, cx, cy, labelR)
    lab.addColorStop(0, '#f4f5f7')
    lab.addColorStop(0.82, '#e9eaee')
    lab.addColorStop(1, '#d9dade')
    ctx.fillStyle = lab
    ctx.beginPath()
    ctx.arc(cx, cy, labelR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(17,17,17,0.10)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, labelR * 0.66, 0, Math.PI * 2)
    ctx.stroke()

    // Spindle hole.
    ctx.fillStyle = '#0a0a0c'
    ctx.beginPath()
    ctx.arc(cx, cy, S * 0.012, 0, Math.PI * 2)
    ctx.fill()

    const tex = new THREE.CanvasTexture(c)
    tex.anisotropy = 8
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function Record({ spin }: { spin: boolean }) {
  const disc = useRef<THREE.Group>(null)
  const groove = useGrooveTexture()

  useFrame((_, dt) => {
    if (spin && disc.current) disc.current.rotation.z -= dt * 0.34 // ~calm 33⅓
  })

  return (
    <group rotation={[-0.42, 0, 0]}>
      <group ref={disc}>
        {/* Vinyl platter — grooved top face. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[2.4, 2.4, 0.06, 160]} />
          {/* Top gets the groove map; sides/bottom stay matte black. */}
          <meshStandardMaterial
            attach="material-0"
            color="#0a0a0c"
            roughness={0.55}
            metalness={0.3}
          />
          <meshStandardMaterial
            attach="material-1"
            map={groove}
            roughnessMap={groove}
            roughness={0.38}
            metalness={0.35}
            color="#ffffff"
          />
          <meshStandardMaterial
            attach="material-2"
            color="#0a0a0c"
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>

        {/* Polished chrome rim — the object's luxury, catching cool + warm. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.41, 0.055, 24, 200]} />
          <meshStandardMaterial color="#cfd4dc" metalness={1} roughness={0.08} envMapIntensity={1.4} />
        </mesh>

        {/* Inner label rim — a fine chrome ring around the paper. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.032, 0]}>
          <torusGeometry args={[0.82, 0.012, 16, 120]} />
          <meshStandardMaterial color="#c8ccd4" metalness={1} roughness={0.12} envMapIntensity={1.2} />
        </mesh>
      </group>
    </group>
  )
}

/** One laser: a bright emissive core wrapped in a soft additive halo. */
function Laser({ color, angle, z }: { color: string; angle: number; z: number }) {
  return (
    <group rotation={[0, 0, angle]} position={[0, 0, z]}>
      <mesh>
        <cylinderGeometry args={[0.012, 0.012, 11, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 11, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Scene({ spin }: { spin: boolean }) {
  return (
    <>
      {/* Key + fill so the matte vinyl and grooves read even off-reflection. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[-4, 5, 4]} intensity={0.9} color="#eaf0ff" />
      <directionalLight position={[5, -2, 3]} intensity={0.5} color="#fff2e0" />

      <Float speed={spin ? 1.1 : 0} rotationIntensity={spin ? 0.18 : 0} floatIntensity={spin ? 0.5 : 0} floatingRange={[-0.06, 0.06]}>
        <Record spin={spin} />
        {/* Two crossing lasers, in front of the disc. */}
        <Laser color={LASER_A} angle={0.62} z={2.6} />
        <Laser color={LASER_B} angle={-0.62} z={2.55} />
      </Float>

      {/* A local studio environment — cool light left, warm right — so the
          chrome rim reflects Desktop.fm's blue-white/warm edges. No network. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} color="#eaf0ff" position={[-4, 2, 3]} scale={[5, 5, 1]} />
        <Lightformer intensity={1.4} color="#fff2e0" position={[4, -1, 3]} scale={[5, 5, 1]} />
        <Lightformer intensity={1.1} color="#ffffff" position={[0, 0, 5]} scale={[7, 7, 1]} />
        <Lightformer intensity={0.8} color="#c9d6ff" position={[0, 4, -2]} scale={[8, 3, 1]} />
      </Environment>
    </>
  )
}

export function RecordHero({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const spin = !reduce
  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene spin={spin} />
        </Suspense>
      </Canvas>
    </div>
  )
}
