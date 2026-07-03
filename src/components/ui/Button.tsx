import type { ButtonHTMLAttributes } from 'react'
import { button } from '~/design/recipes'
import { cx } from 'styled-system/css'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant, size, className, ...rest }: ButtonProps) {
  return <button className={cx(button({ variant, size }), className)} {...rest} />
}
