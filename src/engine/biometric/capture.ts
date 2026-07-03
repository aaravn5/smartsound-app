import type { Rgb } from './pos'

export type CaptureStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'nocamera' | 'error'

export interface RoiSample extends Rgb {
  /** 0..1 — luma-based quality gate; low light or heavy motion → low. */
  quality: number
  luma: number
}

/**
 * Front-camera capture + ROI sampling (§8.1). Everything stays in-browser: the
 * video is drawn to a tiny offscreen canvas we read means from — no frame is
 * ever uploaded (verifiable in the network tab, §11). ROI = forehead + both
 * cheeks, assumed centered (see README for the MediaPipe FaceMesh upgrade path).
 */
export class CameraCapture {
  private stream: MediaStream | null = null
  private readonly video: HTMLVideoElement
  private readonly canvas: HTMLCanvasElement
  private readonly cctx: CanvasRenderingContext2D
  private lastLuma = -1
  status: CaptureStatus = 'idle'

  readonly W = 80
  readonly H = 60

  // forehead + left cheek + right cheek, in normalized ROI coordinates.
  private readonly boxes: readonly [number, number, number, number][] = [
    [0.36, 0.14, 0.64, 0.32],
    [0.24, 0.46, 0.4, 0.64],
    [0.6, 0.46, 0.76, 0.64],
  ]

  constructor() {
    this.video = document.createElement('video')
    this.video.playsInline = true
    this.video.muted = true
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.W
    this.canvas.height = this.H
    const c = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!c) throw new Error('2D canvas unavailable')
    this.cctx = c
  }

  async start(): Promise<CaptureStatus> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.status = 'nocamera'
      return this.status
    }
    this.status = 'requesting'
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240, frameRate: 30 },
        audio: false,
      })
      this.video.srcObject = this.stream
      await this.video.play()
      this.status = 'active'
    } catch (err) {
      const name = (err as DOMException)?.name
      this.status = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied'
        : name === 'NotFoundError' ? 'nocamera'
          : 'error'
    }
    return this.status
  }

  sample(): RoiSample | null {
    if (this.status !== 'active' || this.video.readyState < 2) return null
    this.cctx.drawImage(this.video, 0, 0, this.W, this.H)
    let r = 0, g = 0, b = 0, count = 0
    for (const [x0, y0, x1, y1] of this.boxes) {
      const px = Math.floor(x0 * this.W)
      const py = Math.floor(y0 * this.H)
      const w = Math.max(1, Math.floor((x1 - x0) * this.W))
      const h = Math.max(1, Math.floor((y1 - y0) * this.H))
      const d = this.cctx.getImageData(px, py, w, h).data
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; count++ }
    }
    r /= count; g /= count; b /= count
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    const motion = this.lastLuma < 0 ? 0 : Math.abs(luma - this.lastLuma)
    this.lastLuma = luma
    // Too dark, blown out, or big lighting jump → low quality (§8.1 gating).
    const lightOk = luma > 40 && luma < 245
    const quality = lightOk ? Math.max(0, 1 - motion / 25) : 0.05
    return { r, g, b, luma, quality }
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.status = 'idle'
    this.lastLuma = -1
  }

  get active(): boolean {
    return this.status === 'active'
  }
}
