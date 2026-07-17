import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from 'motion/react'
import { css, cx } from 'styled-system/css'

/**
 * WaveField3D — the player's wavelength, in three dimensions.
 *
 * A ribbon of tetrahedra across the stage: each column's height, tilt and
 * glow follow its live frequency bin from `getSpectrum()`, and the whole
 * field breathes on the low band — the beat. Mirrored below the axis so it
 * reads as a waveform, not a bar chart. Idle (engine stopped) it settles to
 * a quiet synthetic swell that is obviously a preview. Replaces the old
 * morphing brain, which never belonged inside the player.
 */

const COLS = 64
const TETRA = new THREE.TetrahedronGeometry(1)

function Field({ getSpectrum, running, animate }: { getSpectrum: () => Uint8Array | null; running: boolean; animate: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tint = useMemo(() => new THREE.Color(), [])
  const base = useMemo(() => new THREE.Color('#cfd6d2'), [])
  const hot = useMemo(() => new THREE.Color('#cef79e'), [])
  const levels = useMemo(() => new Float32Array(COLS), [])

  useFrame((st) => {
    const m = mesh.current
    if (!m) return
    const t = st.clock.elapsedTime
    const spectrum = running ? getSpectrum() : null
    let beat = 0
    for (let c = 0; c < COLS; c++) {
      let target: number
      if (spectrum && spectrum.length) {
        const idx = Math.min(spectrum.length - 1, Math.floor(Math.pow(c / COLS, 1.5) * spectrum.length * 0.7))
        target = spectrum[idx] / 255
        if (c < 6) beat += target / 6
      } else {
        target = 0.16 + 0.12 * Math.sin(t * 0.9 + c * 0.35) * Math.sin(t * 0.53 + c * 0.11)
      }
      // Fast attack, slow release.
      levels[c] += (target - levels[c]) * (target > levels[c] ? (animate ? 0.5 : 1) : 0.07)
    }
    const spread = 8.4
    for (let c = 0; c < COLS; c++) {
      const lv = levels[c]
      const x = (c / (COLS - 1) - 0.5) * spread
      for (let half = 0; half < 2; half++) {
        const i = c * 2 + half
        const dir = half === 0 ? 1 : -1
        dummy.position.set(x, dir * (0.12 + lv * 1.35) * 0.5, 0)
        dummy.rotation.set(t * 0.6 + c * 0.4, t * 0.4 + c * 0.7, 0)
        const s = 0.05 + lv * 0.16 + beat * 0.03
        dummy.scale.setScalar(animate ? s : 0.1)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
        tint.lerpColors(base, hot, Math.min(1, lv * 1.4))
        m.setColorAt(i, tint)
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.scale.setScalar(1 + beat * 0.06)
  })

  return (
    <instancedMesh ref={mesh} args={[TETRA, undefined, COLS * 2]} frustumCulled={false}>
      <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.3} transparent opacity={0.9} />
    </instancedMesh>
  )
}

export function WaveField3D({
  getSpectrum,
  running,
  className,
}: {
  getSpectrum: () => Uint8Array | null
  running: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <div className={cx(css({ pointerEvents: 'none' }), className)} aria-hidden>
      <Canvas camera={{ position: [0, 0, 6.4], fov: 40 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 6]} intensity={1.3} />
        <pointLight position={[-5, -2, 4]} intensity={26} color="#cef79e" />
        <Suspense fallback={null}>
          <Field getSpectrum={getSpectrum} running={running} animate={!reduce} />
        </Suspense>
      </Canvas>
    </div>
  )
}
