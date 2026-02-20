import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'orange' | 'gray' | 'blue'
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const variants = {
    green: 'bg-green-500/15 text-green-400 border border-green-500/20',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
    gray: 'bg-white/8 text-white/60 border border-white/10',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  }
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
