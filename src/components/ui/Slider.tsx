import * as RadixSlider from '@radix-ui/react-slider'
import { css } from 'styled-system/css'

/** The neural-effect / target controls are Radix Sliders styled with Panda (§4.1). */
interface SliderProps {
  value: number
  onValueChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label: string
}

const root = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  touchAction: 'none',
  width: 'full',
  height: '5',
})

const track = css({
  position: 'relative',
  flexGrow: 1,
  height: '1.5',
  rounded: 'full',
  bg: 'hairline',
})

const range = css({
  position: 'absolute',
  height: 'full',
  rounded: 'full',
  bg: 'signal',
})

const thumb = css({
  display: 'block',
  width: '4',
  height: '4',
  rounded: 'full',
  bg: 'mist',
  boxShadow: '0 0 0 3px token(colors.signalSoft), 0 1px 4px rgba(0,0,0,0.4)',
  cursor: 'grab',
  transition: 'box-shadow token(durations.instant)',
  _hover: { boxShadow: '0 0 0 5px token(colors.signalSoft), 0 1px 4px rgba(0,0,0,0.4)' },
  _active: { cursor: 'grabbing' },
  _focusVisible: { outline: '2px solid token(colors.signal)', outlineOffset: '2px' },
})

export function Slider({ value, onValueChange, min = 0, max = 1, step = 0.01, label }: SliderProps) {
  return (
    <RadixSlider.Root
      className={root}
      value={[value]}
      onValueChange={([v]) => onValueChange(v)}
      min={min}
      max={max}
      step={step}
    >
      <RadixSlider.Track className={track}>
        <RadixSlider.Range className={range} />
      </RadixSlider.Track>
      <RadixSlider.Thumb className={thumb} aria-label={label} />
    </RadixSlider.Root>
  )
}
