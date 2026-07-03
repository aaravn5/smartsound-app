import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { prefersReducedMotion } from '~/design/signal'
import { useReactivePointer } from '~/design/useReactivePointer'

/**
 * PixelHero — the landing's anchor motif (Part 5.B): a full-viewport WebGL field
 * of small glowing squares on pure black. Nearby pixels displace away from the
 * cursor and settle back naturally; colour drifts along --ring-cool → --ring-warm.
 * Rendered in clip space so it fills the viewport regardless of camera. Density
 * adapts to viewport width; animation freezes under prefers-reduced-motion.
 */
const vertex = /* glsl */ `
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uAspect;
  uniform float uSize;
  attribute float aRand;
  varying float vGlow;
  varying float vMix;
  void main() {
    vec2 p = position.xy;
    // screen-space (aspect-corrected) distance to cursor → circular falloff
    vec2 toM = vec2((p.x - uMouse.x) * uAspect, p.y - uMouse.y);
    float d = length(toM);
    float force = exp(-d * d * 7.0);
    vec2 dir = d > 0.0001 ? normalize(p - uMouse) : vec2(0.0);
    // idle breathing ripple keeps the field alive
    float ripple = sin(uTime * 0.5 + p.x * 3.2 + p.y * 2.1 + aRand * 6.28) * 0.006;
    p += dir * force * 0.16 + vec2(0.0, ripple);
    vGlow = force;
    vMix = clamp(p.x * 0.5 + 0.5 + force * 0.3, 0.0, 1.0);
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = uSize * (1.0 + force * 2.2);
  }
`
const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uCool;
  uniform vec3 uWarm;
  varying float vGlow;
  varying float vMix;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    // soft square with rounded falloff → reads as a glowing pixel
    float m = max(abs(c.x), abs(c.y));
    float alpha = smoothstep(0.5, 0.28, m);
    vec3 col = mix(uCool, uWarm, vMix) + vGlow * 0.7;
    gl_FragColor = vec4(col, alpha * (0.42 + vGlow * 0.9));
  }
`

function Field() {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const mouse = useRef(new THREE.Vector2(0, 0))
  const target = useRef(new THREE.Vector2(0, 0))
  const reduce = prefersReducedMotion()
  // Touch + pointer reactivity (§1.5) — both mouse drags and finger drags move the field.
  const pointer = useReactivePointer()

  const { geometry, uniforms } = useMemo(() => {
    const aspect = size.width / size.height
    // adaptive density — fewer points on narrow / small viewports
    const cols = Math.round(Math.min(120, Math.max(34, size.width / 16)))
    const rows = Math.max(20, Math.round(cols / aspect))
    const positions = new Float32Array(cols * rows * 3)
    const rand = new Float32Array(cols * rows)
    let i = 0
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        positions[i * 3] = (x / (cols - 1)) * 2 - 1
        positions[i * 3 + 1] = (y / (rows - 1)) * 2 - 1
        positions[i * 3 + 2] = 0
        rand[i] = Math.random()
        i++
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const u = {
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uAspect: { value: aspect },
      uSize: { value: Math.max(2.2, (size.width / cols) * 0.16) * dpr },
      uCool: { value: new THREE.Color('#38BDF8') },
      uWarm: { value: new THREE.Color('#A78BFA') },
    }
    return { geometry: g, uniforms: u }
  }, [size.width, size.height])

  useFrame((_, delta) => {
    const m = matRef.current
    if (!m) return
    // pointer/touch → clip space target, read live each frame (no listener churn)
    target.current.set(pointer.current.x, pointer.current.y)
    // spring-ish settle toward the cursor/finger target
    mouse.current.lerp(target.current, reduce ? 1 : Math.min(1, delta * 6))
    m.uniforms.uMouse.value.copy(mouse.current)
    if (!reduce) m.uniforms.uTime.value += delta
  })

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        args={[{ uniforms, vertexShader: vertex, fragmentShader: fragment }]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function PixelHero() {
  const reduce = prefersReducedMotion()
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      frameloop={reduce ? 'demand' : 'always'}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ position: [0, 0, 1] }}
    >
      <Field />
    </Canvas>
  )
}
