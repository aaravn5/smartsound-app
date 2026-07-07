import { useEffect, useId, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { css } from 'styled-system/css'

/**
 * SmartSoundRings — the Apple Fitness-style activity rings, in SmartSound
 * terms: Attune (outer, violet) · Minutes (middle, teal) · Streak (inner, dawn).
 *
 * Real SVG geometry: gradient strokes, rounded caps, and the tip that carries
 * a soft drop shadow so a closed ring visibly overlaps its own start — the
 * Apple detail. On mount the rings close with a staggered, spring-eased
 * stroke-dashoffset sweep; the tip rides the same curve as a rotated group.
 * `prefers-reduced-motion` renders the final state statically.
 */

export interface RingMetric {
  /** 0..1+ progress toward goal (values > 1 lap past the start, Apple-style). */
  progress: number
  /** Today's value, in the ring's unit. */
  value: number
  /** The goal value. */
  goal: number
}

export interface SmartSoundRingsProps {
  attune: RingMetric
  minutes: RingMetric
  streak: RingMetric
  /** Outer diameter in px. */
  size?: number
  /** hero = rings + center value + legend · compact = rings only. */
  variant?: 'hero' | 'compact'
  /** Big centered value (hero variant), e.g. { value: '24', label: 'min today' }. */
  center?: { value: string; label: string }
}

interface RingSpec {
  key: 'attune' | 'minutes' | 'streak'
  label: string
  from: string
  to: string
  metric: RingMetric
}

const EASE = 'var(--spring-smooth, cubic-bezier(0.22, 1, 0.36, 1))'
const SWEEP_MS = 1500
const STAGGER_MS = 170

export function SmartSoundRings({
  attune,
  minutes,
  streak,
  size = 280,
  variant = 'hero',
  center,
}: SmartSoundRingsProps) {
  const uid = useId()
  const reduce = useReducedMotion()
  const [armed, setArmed] = useState(false)

  // Close-the-rings: arm the sweep one frame after mount so the transition runs.
  useEffect(() => {
    if (reduce) return
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setArmed(true)))
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  const shown = reduce || armed

  const stroke = Math.max(10, Math.round(size * 0.088))
  const gap = Math.max(3, Math.round(size * 0.014))
  const c = size / 2
  const rOuter = c - stroke / 2 - 1
  const rMid = rOuter - stroke - gap
  const rInner = rMid - stroke - gap

  const rings: (RingSpec & { r: number })[] = [
    { key: 'attune', label: 'Attune', from: '#C4B5FD', to: '#8B5CF6', metric: attune, r: rOuter },
    { key: 'minutes', label: 'Minutes', from: '#6EE7B7', to: '#14B8A6', metric: minutes, r: rMid },
    { key: 'streak', label: 'Streak', from: '#FDE68A', to: '#FB923C', metric: streak, r: rInner },
  ]

  const ariaLabel = rings
    .map((ring) => `${ring.label} ${ring.metric.value} of ${ring.metric.goal}`)
    .join(', ')

  return (
    <div className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5' })}>
      <div className={css({ position: 'relative' })} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            {rings.map((ring) => (
              <linearGradient
                key={ring.key}
                id={`${uid}-${ring.key}`}
                gradientUnits="userSpaceOnUse"
                x1={c - ring.r}
                y1={c - ring.r}
                x2={c + ring.r}
                y2={c + ring.r}
              >
                <stop offset="0%" stopColor={ring.from} />
                <stop offset="100%" stopColor={ring.to} />
              </linearGradient>
            ))}
            <filter id={`${uid}-tip-shadow`} x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation={stroke * 0.22}
                floodColor="#000000"
                floodOpacity="0.5"
              />
            </filter>
          </defs>

          {rings.map((ring, i) => {
            const circumference = 2 * Math.PI * ring.r
            const p = Math.max(0, ring.metric.progress)
            // A closed cap dot is always visible, even at zero — Apple's nub.
            const arc = Math.min(1, Math.max(0.004, p))
            const target = shown ? circumference * (1 - arc) : circumference * (1 - 0.004)
            const tipDeg = shown ? (p % 1 === 0 && p > 0 ? 360 : (p % 1) * 360) : 0
            const delay = reduce ? 0 : i * STAGGER_MS
            const transition = reduce
              ? undefined
              : `stroke-dashoffset ${SWEEP_MS}ms ${EASE} ${delay}ms`
            const tipTransition = reduce
              ? undefined
              : `transform ${SWEEP_MS}ms ${EASE} ${delay}ms`

            return (
              <g key={ring.key}>
                {/* Track — the dimmed lane the ring closes over. */}
                <circle
                  cx={c}
                  cy={c}
                  r={ring.r}
                  fill="none"
                  stroke={ring.to}
                  strokeOpacity={0.16}
                  strokeWidth={stroke}
                />
                {/* Progress arc — gradient stroke, rounded caps, 12 o'clock start. */}
                <circle
                  cx={c}
                  cy={c}
                  r={ring.r}
                  fill="none"
                  stroke={`url(#${uid}-${ring.key})`}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={target}
                  transform={`rotate(-90 ${c} ${c})`}
                  style={{ transition }}
                />
                {/* Tip — carries the overlap shadow as the ring closes. */}
                {p > 0.03 && (
                  <g
                    style={{
                      transform: `rotate(${tipDeg}deg)`,
                      transformOrigin: '50% 50%',
                      transformBox: 'view-box',
                      transition: tipTransition,
                    }}
                  >
                    <circle
                      cx={c}
                      cy={c - ring.r}
                      r={stroke / 2}
                      fill={ring.to}
                      filter={p > 0.85 ? `url(#${uid}-tip-shadow)` : undefined}
                    />
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {variant === 'hero' && center && (
          <div
            aria-hidden
            className={css({
              position: 'absolute',
              inset: '0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            })}
          >
            <span
              className={`tabular ${css({
                fontFamily: 'rounded',
                fontWeight: '700',
                color: 'text',
                lineHeight: '1',
                letterSpacing: '-0.02em',
              })}`}
              style={{ fontSize: size * 0.19 }}
            >
              {center.value}
            </span>
            <span
              className={css({
                marginTop: '1',
                fontSize: 'footnote',
                fontWeight: '500',
                color: 'muted',
                letterSpacing: '0.01em',
              })}
            >
              {center.label}
            </span>
          </div>
        )}
      </div>

      {variant === 'hero' && (
        <dl
          className={css({
            display: 'flex',
            gap: '7',
            margin: '0',
            justifyContent: 'center',
          })}
        >
          {rings.map((ring) => (
            <div
              key={ring.key}
              className={css({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1' })}
            >
              <dt
                className={css({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5',
                  fontSize: 'caption',
                  fontWeight: '600',
                  color: 'muted',
                  letterSpacing: '0.02em',
                })}
              >
                <span
                  aria-hidden
                  className={css({ width: '2', height: '2', borderRadius: 'full' })}
                  style={{ background: `linear-gradient(135deg, ${ring.from}, ${ring.to})` }}
                />
                {ring.label}
              </dt>
              <dd
                className={`tabular ${css({
                  margin: '0',
                  fontFamily: 'rounded',
                  fontSize: 'headline',
                  fontWeight: '600',
                  color: 'text',
                })}`}
              >
                {ring.metric.value}
                <span className={css({ color: 'faint', fontWeight: '500' })}>/{ring.metric.goal}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
