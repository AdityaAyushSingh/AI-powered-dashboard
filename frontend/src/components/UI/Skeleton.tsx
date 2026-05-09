import clsx from 'clsx'

export default function Skeleton({
  className,
  lines,
}: {
  className?: string
  lines?:     number
}) {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx('skeleton h-3.5', i === lines - 1 ? 'w-3/4' : 'w-full')}
          />
        ))}
      </div>
    )
  }
  return <div className={clsx('skeleton', className)} />
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-surface-0 rounded-xl p-4 space-y-3 border border-surface-200', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-2 w-16" />
    </div>
  )
}
