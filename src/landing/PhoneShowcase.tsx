import { css, cx } from 'styled-system/css'
import { LiquidGlass } from '~/design/LiquidGlass'
import { TriangleSpectrum } from '~/design/TriangleSpectrum'

/**
 * PhoneShowcase — the front face of a modern flagship phone, in DOM.
 *
 * Titanium-rim frame, island cutout, and the real updated player composed on
 * its screen: the dusk scene, a glass now-playing card, the triangular
 * pixelated wavelength (the same TriangleSpectrum component the app ships,
 * running in idle-preview mode), and a transport with a perfectly centered
 * play glyph. The landing's swarm assembles into this exact silhouette, then
 * this element fades in over it — pixels becoming product.
 */

const BLUE = '#4aa8ff'
const GREEN = '#37c2a0'

function PlayGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M8.5 5.9a1 1 0 0 1 1.52-.85l9.6 6.1a1 1 0 0 1 0 1.7l-9.6 6.1a1 1 0 0 1-1.52-.85V5.9z"
        fill="white"
      />
    </svg>
  )
}

export function PhoneShowcase({ className }: { className?: string }) {
  return (
    <div
      aria-label="SmartSound player running on a phone"
      className={cx(
        css({
          position: 'relative',
          w: 'min(320px, 72vw)',
          aspectRatio: '320 / 655',
          borderRadius: '52px',
          p: '3px',
          background:
            'linear-gradient(155deg, #8a8f99 0%, #3c4048 18%, #14161a 42%, #3c4048 74%, #767b84 100%)',
          boxShadow:
            '0 40px 120px rgba(0, 0, 0, 0.6), 0 12px 40px rgba(74, 168, 255, 0.12), inset 0 0 2px rgba(255,255,255,0.4)',
        }),
        className,
      )}
    >
      {/* Screen */}
      <div
        className={css({
          position: 'relative',
          w: '100%',
          h: '100%',
          borderRadius: '49px',
          overflow: 'hidden',
          bg: 'black',
          border: '3px solid #000',
        })}
      >
        {/* Scene wallpaper — the real dusk scene asset. */}
        <img
          src="/scenes/dusk.webp"
          alt=""
          aria-hidden
          className={css({
            position: 'absolute',
            inset: '0',
            w: '100%',
            h: '100%',
            objectFit: 'cover',
            opacity: '0.9',
          })}
        />
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            inset: '0',
            background:
              'linear-gradient(to bottom, rgba(2,4,10,0.55) 0%, rgba(2,4,10,0.1) 30%, rgba(2,4,10,0.2) 62%, rgba(2,4,10,0.78) 100%)',
          })}
        />

        {/* Island */}
        <div
          aria-hidden
          className={css({
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            w: '86px',
            h: '24px',
            borderRadius: 'capsule',
            bg: 'black',
            boxShadow: 'inset 0 0 3px rgba(255,255,255,0.12)',
            zIndex: '3',
          })}
        />

        {/* Status row */}
        <div
          className={css({
            position: 'absolute',
            top: '14px',
            insetX: '22px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            fontWeight: '700',
            color: 'white',
            zIndex: '2',
          })}
        >
          <span>9:41</span>
          <span aria-hidden>●●●</span>
        </div>

        {/* Now playing */}
        <div className={css({ position: 'absolute', insetX: '16px', top: '17%', textAlign: 'center', zIndex: '2' })}>
          <p
            className={css({
              m: '0',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.66)',
            })}
          >
            SmartSound Session · Calm
          </p>
          <p
            className={css({
              m: '0',
              mt: '1.5',
              fontFamily: 'display',
              fontSize: '22px',
              fontWeight: '600',
              letterSpacing: '-0.02em',
              color: 'white',
            })}
          >
            Evening wind-down
          </p>
          <p className={css({ m: '0', mt: '1', fontSize: '11px', color: 'rgba(255,255,255,0.72)' })}>
            62 bpm · attuned · live
          </p>
        </div>

        {/* The triangular pixelated wavelength — the shipped component. */}
        <TriangleSpectrum
          getSpectrum={() => null}
          running={false}
          className={css({ position: 'absolute', insetX: '0', bottom: '24%', h: '26%' })}
        />

        {/* Transport */}
        <div
          className={css({
            position: 'absolute',
            insetX: '20px',
            bottom: '7%',
            zIndex: '2',
            display: 'flex',
            flexDirection: 'column',
            gap: '3',
            alignItems: 'center',
          })}
        >
          <LiquidGlass variant="control" staticSheen className={css({ w: '64px', h: '64px' })}>
            <span
              className={css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                w: '100%',
                h: '100%',
              })}
            >
              <PlayGlyph />
            </span>
          </LiquidGlass>
          <div className={css({ display: 'flex', gap: '1.5' })}>
            {['15', '30', '45', '∞'].map((chip, i) => (
              <span
                key={chip}
                className={css({
                  px: '2.5',
                  py: '0.5',
                  borderRadius: 'capsule',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: i === 1 ? 'white' : 'rgba(255,255,255,0.6)',
                  border: '1px solid',
                })}
                style={{
                  background: i === 1 ? `linear-gradient(135deg, ${BLUE}44, ${GREEN}44)` : 'rgba(255,255,255,0.06)',
                  borderColor: i === 1 ? `${BLUE}88` : 'rgba(255,255,255,0.14)',
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
