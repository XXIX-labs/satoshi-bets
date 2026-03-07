import { clsx } from 'clsx'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block rounded-sm bg-orange animate-pulse-orange"
          style={{
            width:  size === 'sm' ? 3 : size === 'lg' ? 5 : 4,
            height: size === 'sm' ? 12 : size === 'lg' ? 20 : 16,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Skeleton loading block */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded bg-s1 animate-pulse',
        className
      )}
    />
  )
}
