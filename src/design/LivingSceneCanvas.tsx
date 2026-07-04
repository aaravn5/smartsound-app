import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { SceneVariant } from './Scene'
import type { PulseQueue } from './LivingScene'

/**
 * LivingSceneCanvas — the R3F world behind LivingScene. Loaded lazily so
 * three never blocks first paint.
 *
 * Three GPU-cheap layers, all authored for calm:
 *   1. sky — one full-frame shader triangle-pair: the variant's vertical
 *      gradient, two counter-drifting fbm cloud banks (the volumetric haze),
 *      a top light bloom, an in-shader vignette, and the touch-pulse ripples
 *      (up to 5 concurrent expanding `--signal`-colored rings).
 *   2. orb — a slowly morphing liquid-glass sphere: 3D-noise vertex
 *      displacement + fresnel rim light, with a soft additive halo sprite.
 *   3. dust — ~120 drifting light motes on an additive point cloud.
 *
 * Variant changes crossfade by damping every palette color toward its new
 * target each frame — no canvas remount, no flash. Reduced motion switches
 * the frameloop to `demand` and renders one rich still frame (time frozen
 * deep into the drift), re-rendered only on variant/size changes.
 *
 * Color note: the sky and orb are ShaderMaterials writing literal sRGB, so
 * palette hexes are passed raw (bypassing three's color management) and the
 * canvas runs `flat` — what the CSS design system specifies is what renders.
 */

const MAX_RIPPLES = 5
const STILL_TIME = 32
const ORB_Y = 0.55

interface PaletteSpec {
  top: string
  mid: string
  low: string
  cloud: string
  haze: string
  orbA: string
  orbB: string
  dust: string
}

const PALETTES: Record<SceneVariant, PaletteSpec> = {
  dusk: {
    top: '#2B1E56',
    mid: '#1E1B4B',
    low: '#0E1230',
    cloud: '#C4B5FD',
    haze: '#D2C3FF',
    orbA: '#3A2E8F',
    orbB: '#A78BFA',
    dust: '#C4B5FD',
  },
  aurora: {
    top: '#0B2E33',
    mid: '#0F3D3E',
    low: '#0A1626',
    cloud: '#6EE7B7',
    haze: '#B4FAEB',
    orbA: '#0F5F5C',
    orbB: '#5EEAD4',
    dust: '#6EE7B7',
  },
  ocean: {
    top: '#0C2A4D',
    mid: '#0B2344',
    low: '#081226',
    cloud: '#94C5FF',
    haze: '#BEE1FF',
    orbA: '#1E4E8C',
    orbB: '#7DD3FC',
    dust: '#94C5FF',
  },
  dawn: {
    top: '#4A2B3F',
    mid: '#3D2547',
    low: '#121430',
    cloud: '#FDBA74',
    haze: '#FFD6B3',
    orbA: '#8C5096',
    orbB: '#FB9274',
    dust: '#FDBA74',
  },
}

/** Hex → THREE.Color with raw sRGB components (no color-management rewrite). */
function rawColor(hex: string): THREE.Color {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

interface PaletteColors {
  top: THREE.Color
  mid: THREE.Color
  low: THREE.Color
  cloud: THREE.Color
  haze: THREE.Color
  orbA: THREE.Color
  orbB: THREE.Color
  dust: THREE.Color
}

function paletteColors(variant: SceneVariant): PaletteColors {
  const spec = PALETTES[variant]
  return {
    top: rawColor(spec.top),
    mid: rawColor(spec.mid),
    low: rawColor(spec.low),
    cloud: rawColor(spec.cloud),
    haze: rawColor(spec.haze),
    orbA: rawColor(spec.orbA),
    orbB: rawColor(spec.orbB),
    dust: rawColor(spec.dust),
  }
}

// ── shaders ─────────────────────────────────────────────────────────────────

const SKY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}
`

const SKY_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uLow;
uniform vec3 uCloud;
uniform vec3 uHaze;
uniform vec4 uRipples[${MAX_RIPPLES}];
uniform vec3 uRippleColors[${MAX_RIPPLES}];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(11.7, 5.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);

  // Vertical sky gradient — low → mid → top.
  vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.52, uv.y));
  col = mix(col, uTop, smoothstep(0.48, 1.0, uv.y));

  // Volumetric haze — two counter-drifting fbm cloud banks, lit from above.
  float c1 = fbm(p * 1.7 + vec2(uTime * 0.012, uTime * 0.005));
  float c2 = fbm(p * 3.1 + vec2(-uTime * 0.008, uTime * 0.003) + 7.31);
  float clouds = smoothstep(0.42, 0.92, c1 * 0.62 + c2 * 0.38);
  col = mix(col, col + uCloud * 0.30, clouds * (0.30 + 0.55 * uv.y));

  // A second light source — soft bloom at the top of frame.
  float bloom = exp(-length((uv - vec2(0.5, 1.08)) * vec2(1.0, 1.6)) * 2.1);
  col += uHaze * bloom * 0.20;

  // Touch pulses — an expanding ring + a soft core glow, fading over ~3 s.
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 rp = uRipples[i];
    if (rp.w > 0.001) {
      float age = uTime - rp.z;
      if (age > 0.0 && age < 3.0) {
        vec2 d = (uv - rp.xy) * vec2(uAspect, 1.0);
        float dist = length(d);
        float radius = 0.06 + age * 0.30;
        float ring = exp(-pow((dist - radius) * 10.0, 2.0));
        float core = exp(-dist * 6.0) * exp(-age * 2.6);
        float fade = exp(-age * 1.3) * rp.w;
        col += uRippleColors[i] * (ring * 0.5 + core * 0.7) * fade;
      }
    }
  }

  // In-shader vignette — the frame reads as lit from within.
  float vig = smoothstep(1.3, 0.35,
    length((uv - vec2(0.5, 0.45)) * vec2(max(uAspect * 0.7, 1.0), 1.2)));
  col *= mix(0.74, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`

const NOISE3 = /* glsl */ `
float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}
`

const ORB_VERTEX = /* glsl */ `
uniform float uTime;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
${NOISE3}
void main() {
  float n1 = vnoise3(normal * 1.9 + vec3(0.0, uTime * 0.14, 0.0));
  float n2 = vnoise3(normal * 4.2 - vec3(uTime * 0.10, 0.0, uTime * 0.06));
  float bump = (n1 - 0.5) * 0.30 + (n2 - 0.5) * 0.10;
  vNoise = bump;
  vec3 displaced = position + normal * bump;
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const ORB_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float fres = pow(1.0 - abs(dot(n, v)), 2.2);
  float lit = 0.5 + 0.5 * dot(n, normalize(vec3(0.35, 0.8, 0.55)));
  vec3 col = mix(uColorA, uColorB, clamp(0.45 + vNoise * 2.2, 0.0, 1.0));
  col = col * (0.35 + 0.5 * lit) + uColorB * fres * 0.9;
  gl_FragColor = vec4(col, 0.30 + fres * 0.55);
}
`

// ── assets ──────────────────────────────────────────────────────────────────

let dustTexture: THREE.CanvasTexture | null = null

/** A soft radial mote sprite, drawn once — no network asset. */
function getDustTexture(): THREE.CanvasTexture {
  if (!dustTexture) {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const g = canvas.getContext('2d')
    if (g) {
      const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, size, size)
    }
    dustTexture = new THREE.CanvasTexture(canvas)
  }
  return dustTexture
}

function createSkyUniforms(variant: SceneVariant) {
  const c = paletteColors(variant)
  return {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uTop: { value: c.top },
    uMid: { value: c.mid },
    uLow: { value: c.low },
    uCloud: { value: c.cloud },
    uHaze: { value: c.haze },
    uRipples: {
      value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, 0, 0)),
    },
    uRippleColors: {
      value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Color(1, 1, 1)),
    },
  }
}

function createOrbUniforms(variant: SceneVariant) {
  const c = paletteColors(variant)
  return {
    uTime: { value: 0 },
    uColorA: { value: c.orbA },
    uColorB: { value: c.orbB },
  }
}

interface WorldProps {
  variant: SceneVariant
  reducedMotion: boolean
  pulses: PulseQueue
}

function LivingWorld({ variant, reducedMotion, pulses }: WorldProps) {
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const invalidate = useThree((state) => state.invalidate)
  const camera = useThree((state) => state.camera)

  const orbRef = useRef<THREE.Mesh>(null)
  const dustRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Sprite>(null)
  const timeRef = useRef(reducedMotion ? STILL_TIME : 0)
  const pulseSlot = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const initialVariant = useRef(variant)

  const skyUniforms = useMemo(() => createSkyUniforms(initialVariant.current), [])
  const orbUniforms = useMemo(() => createOrbUniforms(initialVariant.current), [])
  const target = useRef(paletteColors(variant))

  const skyGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), [])
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        uniforms: skyUniforms,
        depthWrite: false,
        depthTest: false,
      }),
    [skyUniforms],
  )
  const orbGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 48), [])
  const orbMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ORB_VERTEX,
        fragmentShader: ORB_FRAGMENT,
        uniforms: orbUniforms,
        transparent: true,
        depthWrite: false,
      }),
    [orbUniforms],
  )
  const dustGeo = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = -1.5 - Math.random() * 3.5
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])
  const dustMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: getDustTexture(),
        color: paletteColors(initialVariant.current).dust,
        size: 0.14,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const haloMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: getDustTexture(),
        color: paletteColors(initialVariant.current).orbB,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(
    () => () => {
      skyGeo.dispose()
      skyMat.dispose()
      orbGeo.dispose()
      orbMat.dispose()
      dustGeo.dispose()
      dustMat.dispose()
      haloMat.dispose()
    },
    [skyGeo, skyMat, orbGeo, orbMat, dustGeo, dustMat, haloMat],
  )

  const snapColors = (colors: PaletteColors) => {
    skyUniforms.uTop.value.copy(colors.top)
    skyUniforms.uMid.value.copy(colors.mid)
    skyUniforms.uLow.value.copy(colors.low)
    skyUniforms.uCloud.value.copy(colors.cloud)
    skyUniforms.uHaze.value.copy(colors.haze)
    orbUniforms.uColorA.value.copy(colors.orbA)
    orbUniforms.uColorB.value.copy(colors.orbB)
    dustMat.color.copy(colors.dust)
    haloMat.color.copy(colors.orbB)
  }

  // Variant change — retarget the crossfade (or snap + re-render when still).
  useEffect(() => {
    target.current = paletteColors(variant)
    if (reducedMotion) {
      snapColors(target.current)
      invalidate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, reducedMotion, invalidate])

  // Reduced motion — freeze time deep into the drift for a rich still frame.
  useEffect(() => {
    if (!reducedMotion) return
    timeRef.current = STILL_TIME
    skyUniforms.uTime.value = STILL_TIME
    orbUniforms.uTime.value = STILL_TIME
    invalidate()
  }, [reducedMotion, skyUniforms, orbUniforms, invalidate])

  // Aspect + orb scale track the frame (hero card vs full-screen player).
  useEffect(() => {
    skyUniforms.uAspect.value = size.width / Math.max(1, size.height)
    const scale = Math.min(1.05, viewport.width * 0.3)
    orbRef.current?.scale.setScalar(scale)
    haloRef.current?.scale.setScalar(scale * 3.6)
    if (reducedMotion) invalidate()
  }, [size, viewport, skyUniforms, reducedMotion, invalidate])

  // Desktop-only pointer parallax — fine pointers, never under reduced motion.
  useEffect(() => {
    if (reducedMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion])

  useFrame((_, delta) => {
    if (reducedMotion) {
      snapColors(target.current)
      return
    }
    const dt = Math.min(delta, 0.05)
    timeRef.current += dt
    const t = timeRef.current
    skyUniforms.uTime.value = t
    orbUniforms.uTime.value = t

    // Palette crossfade — damped, unhurried.
    const k = 1 - Math.exp(-dt * 1.6)
    const c = target.current
    skyUniforms.uTop.value.lerp(c.top, k)
    skyUniforms.uMid.value.lerp(c.mid, k)
    skyUniforms.uLow.value.lerp(c.low, k)
    skyUniforms.uCloud.value.lerp(c.cloud, k)
    skyUniforms.uHaze.value.lerp(c.haze, k)
    orbUniforms.uColorA.value.lerp(c.orbA, k)
    orbUniforms.uColorB.value.lerp(c.orbB, k)
    dustMat.color.lerp(c.dust, k)
    haloMat.color.lerp(c.orbB, k)

    // Consume queued touch pulses into ripple slots.
    const queue = pulses.pending
    while (queue.length > 0) {
      const pulse = queue.shift()
      if (!pulse) break
      const slot = pulseSlot.current % MAX_RIPPLES
      pulseSlot.current += 1
      skyUniforms.uRipples.value[slot].set(pulse.x, pulse.y, t, 1)
      skyUniforms.uRippleColors.value[slot].setRGB(pulse.r, pulse.g, pulse.b)
    }

    // The living layer — slow orb morph-rotation, dust drift, camera sway.
    const orb = orbRef.current
    if (orb) {
      orb.rotation.y = t * 0.05
      orb.rotation.z = Math.sin(t * 0.07) * 0.08
      orb.position.y = ORB_Y + Math.sin(t * 0.25) * 0.06
    }
    const halo = haloRef.current
    if (halo && orb) halo.position.y = orb.position.y
    const dust = dustRef.current
    if (dust) {
      dust.rotation.y = t * 0.012
      dust.position.y = Math.sin(t * 0.06) * 0.15
    }
    const damp = 1 - Math.exp(-dt * 1.2)
    const targetX = Math.sin(t * 0.05) * 0.22 + pointer.current.x * 0.18
    const targetY = 0.1 + Math.cos(t * 0.04) * 0.12 - pointer.current.y * 0.12
    camera.position.x += (targetX - camera.position.x) * damp
    camera.position.y += (targetY - camera.position.y) * damp
    camera.lookAt(0, 0.2, 0)
  })

  return (
    <>
      <mesh geometry={skyGeo} material={skyMat} frustumCulled={false} renderOrder={-1} />
      <sprite ref={haloRef} material={haloMat} position={[0, ORB_Y, -0.5]} />
      <mesh ref={orbRef} geometry={orbGeo} material={orbMat} position={[0, ORB_Y, 0]} />
      <points ref={dustRef} geometry={dustGeo} material={dustMat} />
    </>
  )
}

export interface LivingSceneCanvasProps {
  variant: SceneVariant
  reducedMotion: boolean
  pulses: PulseQueue
  onContextLost: () => void
  /** Applied to the canvas element itself — used to drop it a shade under
   * fully opaque so the nature-photo layer behind it can bleed through. */
  className?: string
}

export function LivingSceneCanvas({
  variant,
  reducedMotion,
  pulses,
  onContextLost,
  className,
}: LivingSceneCanvasProps) {
  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [0, 0.1, 6], fov: 42, near: 0.1, far: 40 }}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      className={className}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          onContextLost()
        })
      }}
    >
      <LivingWorld variant={variant} reducedMotion={reducedMotion} pulses={pulses} />
    </Canvas>
  )
}
