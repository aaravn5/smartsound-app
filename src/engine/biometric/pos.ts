import { fft, nextPow2 } from './fft'

export interface Rgb {
  r: number
  g: number
  b: number
}

function mean(x: ArrayLike<number>): number {
  let s = 0
  for (let i = 0; i < x.length; i++) s += x[i]
  return s / x.length
}

function std(x: ArrayLike<number>): number {
  const m = mean(x)
  let s = 0
  for (let i = 0; i < x.length; i++) s += (x[i] - m) ** 2
  return Math.sqrt(s / x.length)
}

/**
 * POS — Plane-Orthogonal-to-Skin (Wang et al. 2017), §8.1. Temporally
 * normalizes each channel, projects onto a plane orthogonal to the skin-tone
 * direction, and combines with a std-ratio weight. More robust to lighting and
 * motion than raw green-channel; CHROM is a close cousin kept in reserve.
 */
export function pos(rgb: Rgb[]): Float64Array {
  const n = rgb.length
  let mr = 0, mg = 0, mb = 0
  for (const c of rgb) { mr += c.r; mg += c.g; mb += c.b }
  mr /= n; mg /= n; mb /= n

  const s1 = new Float64Array(n)
  const s2 = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const rn = mr > 0 ? rgb[i].r / mr : 0
    const gn = mg > 0 ? rgb[i].g / mg : 0
    const bn = mb > 0 ? rgb[i].b / mb : 0
    s1[i] = gn - bn
    s2[i] = -2 * rn + gn + bn
  }
  const sd2 = std(s2)
  const alpha = sd2 > 1e-9 ? std(s1) / sd2 : 0
  const pulse = new Float64Array(n)
  for (let i = 0; i < n; i++) pulse[i] = s1[i] + alpha * s2[i]
  const m = mean(pulse)
  for (let i = 0; i < n; i++) pulse[i] -= m
  return pulse
}

export interface BandPeak {
  freqHz: number
  confidence: number
}

/** Hann-windowed periodogram peak within [loHz, hiHz]. */
export function bandPeak(sig: ArrayLike<number>, fps: number, loHz: number, hiHz: number): BandPeak {
  const L = sig.length
  if (L < 8 || fps <= 0) return { freqHz: 0, confidence: 0 }
  const N = nextPow2(L)
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  const m = mean(sig)
  for (let i = 0; i < L; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (L - 1)) // Hann
    re[i] = (sig[i] - m) * w
  }
  fft(re, im)
  const half = N >> 1
  const loBin = Math.max(1, Math.floor((loHz * N) / fps))
  const hiBin = Math.min(half - 1, Math.ceil((hiHz * N) / fps))
  let bestMag = 0
  let bestBin = -1
  let bandSum = 0
  for (let k = loBin; k <= hiBin; k++) {
    const mag = Math.hypot(re[k], im[k])
    bandSum += mag
    if (mag > bestMag) { bestMag = mag; bestBin = k }
  }
  const freqHz = bestBin > 0 ? (bestBin * fps) / N : 0
  const span = Math.max(1, hiBin - loBin + 1)
  const confidence = bandSum > 0 ? Math.min(1, ((bestMag / bandSum) * span) / 5) : 0
  return { freqHz, confidence }
}

/** Steadiness (HRV-*trend* proxy): low recent HR variance → high steadiness. */
export function steadinessFrom(hrHistory: number[]): number {
  if (hrHistory.length < 4) return 0.5
  const recent = hrHistory.slice(-24)
  const v = std(recent)
  return Math.min(1, Math.max(0, 1 - v / 8))
}
