import clsx from 'clsx'

type Color = 'gray' | 'brand' | 'success' | 'warning' | 'danger' | 'violet'
type Size  = 'xs' | 'sm'

const colors: Record<Color, string> = {
  gray:    'bg-surface-100 text-surface-600 border-surface-200',
  brand:   'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger:  'bg-danger-50 text-danger-700 border-danger-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
}

const sizes: Record<Size, string> = {
  xs: 'px-1.5 py-0.5 text-2xs rounded',
  sm: 'px-2 py-0.5 text-xs rounded-md',
}

export default function Badge({
  color = 'gray',
  size  = 'sm',
  dot,
  icon,
  children,
  className,
}: {
  color?:    Color
  size?:     Size
  dot?:      boolean
  icon?:     React.ReactNode
  children:  React.ReactNode
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium border',
        colors[color],
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            color === 'success' ? 'bg-success-500' :
            color === 'warning' ? 'bg-warning-500' :
            color === 'danger'  ? 'bg-danger-500'  :
            color === 'brand'   ? 'bg-brand-500'   :
            color === 'violet'  ? 'bg-violet-500'  :
            'bg-surface-400',
          )}
        />
      )}
      {icon && <span className="flex-none">{icon}</span>}
      {children}
    </span>
  )
}
