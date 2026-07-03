import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { prefersReducedMotion } from '~/design/signal'

/**
 * BrainCanvas — the sticky low-poly neural mesh for BrainStemScroll, split into
 * its own module so three/R3F load as an async chunk (Part 5.C: 3D lazy-loaded,
 * never blocking first paint). Default export for React.lazy.
 */
function NeuralMesh() {
  const group = useRef<THREE.Group>(null)
  const reduce = prefersReducedMotion()
  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (!reduce) g.rotation.y += delta * 0.14
    g.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.035)
  })
  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.35, 3]} />
        <meshBasicMaterial color="#6ea0ff" wireframe transparent opacity={0.38} />
      </mesh>
      <mesh scale={0.98}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <points>
        <icosahedronGeometry args={[1.35, 3]} />
        <pointsMaterial color="#A78BFA" size={0.05} sizeAttenuation transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  )
}

export default function BrainCanvas() {
  const reduce = prefersReducedMotion()
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      dpr={[1, 2]}
      frameloop={reduce ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <NeuralMesh />
    </Canvas>
  )
}
