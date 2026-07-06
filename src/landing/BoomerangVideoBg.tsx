import { useEffect, useRef, useState } from 'react'
import { css, cx } from 'styled-system/css'

/**
 * BoomerangVideoBg — the landing's living backdrop.
 *
 * The hero loop (`/intro/hero-loop.mp4`, self-hosted and therefore
 * same-origin — canvas capture is never tainted) plays ONCE, muted and
 * inline, while frames are captured to offscreen bitmaps via
 * `requestVideoFrameCallback` (rAF fallback). When it ends, a <canvas> takes
 * over and ping-pongs the captured frames forward/backward endlessly at
 * 30fps — a seamless boomerang no `loop` attribute can produce.
 *
 * Memory budget (critical): at most `FRAME_CAP` (90) frames at 960×540 —
 * alternate frames are skipped, `createImageBitmap` used where available
 * (GPU-backed) with a per-frame canvas fallback. Three modes, decided once:
 *   capture — desktop with headroom (the default described above)
 *   native  — viewport < 768px or deviceMemory ≤ 4: plain <video loop>,
 *             seam accepted, zero capture memory
 *   poster  — prefers-reduced-motion or Save-Data: the first frame drawn
 *             once to the canvas, NO motion at all
 * Everything pauses on document.hidden; bitmaps are closed on unmount.
 * While capturing, the live <video> IS the visible background — no flash.
 */

const SRC = '/intro/hero-loop.mp4'
const FRAME_CAP = 90
const CAPTURE_W = 960
const CAPTURE_H = 540
const PLAYBACK_FPS = 30

type Mode = 'capture' | 'native' | 'poster'

type Frame = ImageBitmap | HTMLCanvasElement

function decideMode(): Mode {
  if (typeof window === 'undefined') return 'native'
  try {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean }
      deviceMemory?: number
    }
    if (reduce || nav.connection?.saveData === true) return 'poster'
    if (window.innerWidth < 768) return 'native'
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return 'native'
    return 'capture'
  } catch {
    return 'native'
  }
}

const mediaCss = css({
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  maxWidth: 'none',
  objectFit: 'cover',
  pointerEvents: 'none',
})

/** Cover-fit drawImage — the canvas equivalent of object-fit: cover. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  cw: number,
  ch: number,
): void {
  const fw = frame.width
  const fh = frame.height
  if (fw === 0 || fh === 0 || cw === 0 || ch === 0) return
  const scale = Math.max(cw / fw, ch / fh)
  const dw = fw * scale
  const dh = fh * scale
  ctx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
}

export interface BoomerangVideoBgProps {
  /** Per-daypart CSS filter grading the footage (video AND canvas alike). */
  grade?: string
  className?: string
}

export function BoomerangVideoBg({ grade = 'none', className }: BoomerangVideoBgProps) {
  const [mode] = useState<Mode>(decideMode)
  // 'video' while the live element is the backdrop, 'canvas' after the swap.
  const [phase, setPhase] = useState<'video' | 'canvas'>(mode === 'poster' ? 'canvas' : 'video')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    let disposed = false
    const frames: Frame[] = []
    let rafId = 0
    let vfcId = 0
    let capturing = false
    let captureBusy = false
    let playing = false

    const ctx2d = canvas.getContext('2d')

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    // ── poster: one frame, no motion ─────────────────────────────────────
    if (mode === 'poster') {
      const onLoaded = () => {
        if (disposed || !ctx2d) return
        sizeCanvas()
        try {
          const fw = video.videoWidth
          const fh = video.videoHeight
          if (fw > 0 && fh > 0) {
            const scale = Math.max(canvas.width / fw, canvas.height / fh)
            const dw = fw * scale
            const dh = fh * scale
            ctx2d.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
          }
        } catch {
          // decode hiccup — leave the dark canvas; the scrim carries the frame
        }
        video.pause()
      }
      video.addEventListener('loadeddata', onLoaded)
      // Some browsers need a play() nudge to decode the first frame.
      void video.play().then(() => video.pause()).catch(() => undefined)
      return () => {
        disposed = true
        video.removeEventListener('loadeddata', onLoaded)
      }
    }

    // ── native: the <video loop> is the whole story ──────────────────────
    if (mode === 'native') {
      const onVisibility = () => {
        if (document.hidden) video.pause()
        else void video.play().catch(() => undefined)
      }
      document.addEventListener('visibilitychange', onVisibility)
      void video.play().catch(() => undefined)
      return () => {
        disposed = true
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }

    // ── capture mode ─────────────────────────────────────────────────────

    // createImageBitmap where available (GPU-backed) — but ADAPTIVE: on
    // software rasterizers (headless SwiftShader, tiny GPUs) an async bitmap
    // of a 1080p frame can take whole seconds, starving the capture. If the
    // first bitmap comes back slow, drop to the synchronous canvas path.
    let canBitmap = typeof createImageBitmap === 'function'
    let bitmapTimed = false

    const captureToCanvas = () => {
      const off = document.createElement('canvas')
      off.width = CAPTURE_W
      off.height = CAPTURE_H
      const octx = off.getContext('2d')
      if (!octx) return
      try {
        octx.drawImage(video, 0, 0, CAPTURE_W, CAPTURE_H)
        frames.push(off)
      } catch {
        // draw failed — skip this frame
      }
    }

    const captureFrame = () => {
      if (captureBusy || frames.length >= FRAME_CAP || video.readyState < 2) return
      if (canBitmap) {
        captureBusy = true
        const t0 = performance.now()
        createImageBitmap(video, {
          resizeWidth: CAPTURE_W,
          resizeHeight: CAPTURE_H,
          resizeQuality: 'low',
        })
          .then((bmp) => {
            if (!bitmapTimed) {
              bitmapTimed = true
              if (performance.now() - t0 > 150) canBitmap = false
            }
            if (disposed || frames.length >= FRAME_CAP) bmp.close()
            else frames.push(bmp)
          })
          .catch(() => {
            // bitmap path broken here — the canvas path takes over
            canBitmap = false
          })
          .finally(() => {
            captureBusy = false
          })
      } else {
        captureToCanvas()
      }
    }

    type VideoWithVFC = HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number
      cancelVideoFrameCallback?: (id: number) => void
    }
    const v = video as VideoWithVFC

    const vfcLoop = () => {
      if (disposed || !capturing) return
      // Pace captures evenly across the clip toward the 90-frame budget —
      // at full 24fps this skips roughly every other source frame; under a
      // slow decoder it captures every presented frame instead of starving.
      const dur = video.duration || 8
      const due = Math.ceil((video.currentTime / dur) * FRAME_CAP)
      if (frames.length < Math.min(due, FRAME_CAP)) captureFrame()
      vfcId = v.requestVideoFrameCallback!(vfcLoop)
    }

    let lastRafCapture = 0
    const rafCaptureLoop = (now: number) => {
      if (disposed || !capturing) return
      // rAF fallback ≈ every 80ms — the same ~12fps the vfc skip produces.
      if (now - lastRafCapture >= 80) {
        lastRafCapture = now
        captureFrame()
      }
      rafId = requestAnimationFrame(rafCaptureLoop)
    }

    const startCapture = () => {
      if (capturing) return
      capturing = true
      if (typeof v.requestVideoFrameCallback === 'function') {
        vfcId = v.requestVideoFrameCallback(vfcLoop)
      } else {
        rafId = requestAnimationFrame(rafCaptureLoop)
      }
    }

    const stopCapture = () => {
      capturing = false
      if (vfcId && typeof v.cancelVideoFrameCallback === 'function') v.cancelVideoFrameCallback(vfcId)
      cancelAnimationFrame(rafId)
      vfcId = 0
    }

    // ── boomerang playback ───────────────────────────────────────────────
    let playRaf = 0
    let cursor = 0 // fractional frame index
    let direction = 1
    let lastT = 0

    const playLoop = (now: number) => {
      if (disposed || !playing) return
      playRaf = requestAnimationFrame(playLoop)
      const dt = lastT ? Math.min(100, now - lastT) : 1000 / PLAYBACK_FPS
      lastT = now
      cursor += direction * (dt / 1000) * PLAYBACK_FPS
      const max = frames.length - 1
      if (cursor >= max) {
        cursor = max
        direction = -1
      } else if (cursor <= 0) {
        cursor = 0
        direction = 1
      }
      const idx = Math.round(cursor)
      const frame = frames[idx]
      if (frame && ctx2d) {
        sizeCanvas()
        drawCover(ctx2d, frame, canvas.width, canvas.height)
      }
    }

    const startPlayback = () => {
      if (playing) return
      playing = true
      lastT = 0
      playRaf = requestAnimationFrame(playLoop)
    }

    const stopPlayback = () => {
      playing = false
      cancelAnimationFrame(playRaf)
      lastT = 0
    }

    const onEnded = () => {
      stopCapture()
      if (disposed) return
      if (frames.length >= 24 && ctx2d) {
        // Paint the current frame BEFORE revealing the canvas — no flash.
        sizeCanvas()
        cursor = frames.length - 1
        direction = -1
        drawCover(ctx2d, frames[frames.length - 1], canvas.width, canvas.height)
        canvas.dataset.frames = String(frames.length)
        setPhase('canvas')
        if (!document.hidden) startPlayback()
      } else {
        // Capture came up short (decode stalls, tiny GPU) — honest fallback:
        // free what we grabbed and let the native loop carry the backdrop.
        for (const f of frames) if ('close' in f) f.close()
        frames.length = 0
        video.loop = true
        void video.play().catch(() => undefined)
      }
    }

    const onPlaying = () => startCapture()

    const onVisibility = () => {
      if (document.hidden) {
        video.pause()
        stopPlayback()
      } else if (frames.length > 0 && !capturing && video.ended) {
        startPlayback()
      } else {
        void video.play().catch(() => undefined)
      }
    }

    video.addEventListener('ended', onEnded)
    video.addEventListener('playing', onPlaying)
    document.addEventListener('visibilitychange', onVisibility)
    void video.play().catch(() => {
      // Autoplay refused (rare for muted) — fall back to the native loop
      // on the first user interaction; until then the poster frame stands.
      video.loop = true
    })

    return () => {
      disposed = true
      stopCapture()
      stopPlayback()
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('playing', onPlaying)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const f of frames) if ('close' in f) f.close()
      frames.length = 0
    }
  }, [mode])

  const showVideo = mode !== 'poster' && phase === 'video'

  return (
    <div
      aria-hidden
      className={cx(
        css({
          position: 'absolute',
          inset: '0',
          overflow: 'hidden',
          transform: 'scale(1.08)',
          transformOrigin: 'center',
          bg: 'black',
        }),
        className,
      )}
    >
      {/* Shared grade wrapper — the daypart filter hits video and canvas alike. */}
      <div
        className={css({ position: 'absolute', inset: '0' })}
        style={{ filter: grade === 'none' ? undefined : grade }}
      >
        <video
          ref={videoRef}
          src={SRC}
          muted
          playsInline
          autoPlay={mode !== 'poster'}
          loop={mode === 'native'}
          preload="auto"
          disablePictureInPicture
          aria-hidden
          className={mediaCss}
          style={{ opacity: showVideo || mode === 'native' ? 1 : 0 }}
        />
        <canvas
          ref={canvasRef}
          aria-hidden
          data-boomerang={phase === 'canvas' ? 'on' : 'off'}
          className={mediaCss}
          style={{ opacity: mode !== 'native' && phase === 'canvas' ? 1 : 0 }}
        />
      </div>
    </div>
  )
}
