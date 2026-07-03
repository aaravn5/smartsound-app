import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { css } from 'styled-system/css'
import { flex, stack } from 'styled-system/patterns'

/**
 * FaqAccordion — Liquid Glass accordion (Part 5.B). Each item is a glass panel;
 * one opens at a time with an animated height reveal. The toggle is a clean
 * plus/minus (the vertical bar collapses when open). Keyboard-operable buttons.
 */
export interface FaqItem {
  q: string
  a: string
}

const panel = css({
  overflow: 'hidden',
  rounded: '2xl',
  bg: 'glassFill',
  border: '1px solid token(colors.glassBorder)',
  backdropFilter: 'blur(var(--glass-blur))',
  boxShadow: 'inset 0 1px 0 token(colors.glassHighlight)',
})

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className={stack({ gap: '3', width: 'full' })}>
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={i} className={panel}>
            <button
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className={flex({
                justify: 'space-between', align: 'center', gap: '4', width: 'full',
                px: '5', py: '4', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'display', fontWeight: '600', fontSize: 'md', color: 'text',
              })}
            >
              <span>{it.q}</span>
              <span className={css({ position: 'relative', width: '16px', height: '16px', flexShrink: '0' })} aria-hidden>
                <span className={css({ position: 'absolute', top: '50%', left: '0', width: '16px', height: '2px', bg: 'signal', transform: 'translateY(-50%)', rounded: 'full' })} />
                <span
                  className={css({ position: 'absolute', left: '50%', top: '0', width: '2px', height: '16px', bg: 'signal', transform: 'translateX(-50%)', rounded: 'full', transition: 'transform 250ms token(easings.calm)' })}
                  style={{ transform: `translateX(-50%) scaleY(${isOpen ? 0 : 1})` }}
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  className={css({ overflow: 'hidden' })}
                >
                  <p className={css({ px: '5', pb: '5', color: 'muted', fontSize: 'sm', lineHeight: '1.6', maxW: '58ch' })}>{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
