import { useMemo, type MutableRefObject } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { css } from 'styled-system/css'
import { TriangleConstellation } from '~/landing/TriangleConstellation'

/**
 * WireSwarm — the landing's continuous 3D companion, outlined.
 *
 * Loads the Blender-built wire tetrahedron (edge frame, beveled — no filled
 * faces exist in the geometry) and instances it as the scroll-scrubbed swarm:
 * Starlight edges, a 3% glass-ghost interior, band tints crossfading
 * Beta → Alpha → Theta → Delta down the page, each pulsing at its band's
 * scaled pace. Rotation, drift and camera dolly are owned by scroll; idle
 * motion is a ≥14s drift; the pointer adds ±2° parallax and parts the swarm.
 */

const WIRE_URL = '/assets/3d/tetra-wire-lo.glb'

// Edges are Starlight with slight variance; the material tint (band color)
// multiplies on top.
const EDGE_PALETTE = ['#f7f7f5', '#ffffff', '#e7e8e1', '#c9cbbe', '#ffffff']

// design.md band tints + their scaled pulse paces (Beta ripples, Delta barely breathes).
const BAND_TINTS = ['#ffffff', '#e9f5df', '#ffffff', '#d9e8cf']
const BAND_PULSE = [1.5, 1.0, 0.6, 0.25]

export function WireSwarm({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const gltf = useGLTF(WIRE_URL, '/draco/')
  const wireGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | undefined
    gltf.scene.traverse((o) => {
      if (!geo && (o as THREE.Mesh).isMesh) geo = (o as THREE.Mesh).geometry
    })
    return geo
  }, [gltf])

  return (
    <TriangleConstellation
      shapes={['brain', 'dust', 'note', 'waveform', 'network']}
      mode="scroll"
      progressRef={progressRef}
      choreo
      wireGeometry={wireGeometry}
      count={2600}
      size={0.052}
      ambient={70}
      cameraZ={8}
      paletteOverride={EDGE_PALETTE}
      tintTimeline={BAND_TINTS}
      pulseTimeline={BAND_PULSE}
      particleOpacity={0.9}
      hoverColor="#cef79e"
      className={css({ position: 'fixed', inset: '0', zIndex: '0' })}
    />
  )
}

useGLTF.preload(WIRE_URL, '/draco/')
