import clsx from 'clsx'
import { forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'xs' | 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  loading?: boolean
  icon?:    React.ReactNode
  iconRight?: React.ReactNode
}

const variants: Record<Variant, string> = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-soft',
  secondary: 'bg-surface-0 text-surface-700 border border-surface-200 hover:bg-surface-50 hover:border-surface-300 active:bg-surface-100 shadow-soft',
  ghost:     'text-surface-600 hover:text-surface-900 hover:bg-surface-100 active:bg-surface-200',
  danger:    'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 shadow-soft',
}

const sizes: Record<Size, string> = {
  xs: 'px-2 py-1 text-xs gap-1 rounded-md',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-3.5 py-2 text-sm gap-2 rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'sm', loading, icon, iconRight, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-brand select-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size={size} /> : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  },
)
Button.displayName = 'Button'
export default Button

function Spinner({ size }: { size: Size }) {
  const s = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <svg className={clsx('animate-spin', s)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
