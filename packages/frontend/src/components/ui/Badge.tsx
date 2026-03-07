import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'orange' | 'gray' | 'blue' | 'yellow'
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'gray', className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-medium uppercase tracking-wider',
        'border transition-colors duration-150',
        variant === 'green'  && 'border-yes/25 bg-yes/8 text-yes',
        variant === 'red'    && 'border-no/25 bg-no/8 text-no',
        variant === 'orange' && 'border-orange/25 bg-orange/8 text-orange',
        variant === 'gray'   && 'border-border bg-s1 text-t3',
        variant === 'blue'   && 'border-blue-500/25 bg-blue-500/8 text-blue-400',
        variant === 'yellow' && 'border-yellow-500/25 bg-yellow-500/8 text-yellow-400',
        className
      )}
    >
      {dot && (
        <span className={clsx(
          'h-1.5 w-1.5 rounded-full',
          variant === 'green'  && 'bg-yes',
          variant === 'red'    && 'bg-no',
          variant === 'orange' && 'bg-orange',
          variant === 'gray'   && 'bg-t3',
          variant === 'blue'   && 'bg-blue-400',
          variant === 'yellow' && 'bg-yellow-400',
        )} />
      )}
      {children}
    </span>
  )
}
