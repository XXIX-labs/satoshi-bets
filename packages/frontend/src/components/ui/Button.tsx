import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'yes' | 'no'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'relative inline-flex items-center justify-center font-mono font-medium tracking-wide',
          'select-none outline-none transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
          'active:scale-[0.97]',
          variant === 'primary' && [
            'bg-orange text-bg border border-orange/80',
            'hover:bg-orange/90 hover:shadow-orange-sm',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
          ],
          variant === 'secondary' && [
            'bg-s1 text-t1 border border-border',
            'hover:border-border-active hover:bg-s2',
          ],
          variant === 'ghost' && [
            'bg-transparent text-t2 border border-transparent',
            'hover:text-t1 hover:bg-s1 hover:border-border',
          ],
          variant === 'danger' && [
            'bg-no/15 text-no border border-no/30',
            'hover:bg-no/25 hover:shadow-no-sm',
          ],
          variant === 'yes' && [
            'bg-yes/15 text-yes border border-yes/30',
            'hover:bg-yes/25 hover:shadow-yes-sm',
          ],
          variant === 'no' && [
            'bg-no/15 text-no border border-no/30',
            'hover:bg-no/25 hover:shadow-no-sm',
          ],
          size === 'sm' && 'h-7 px-3 text-[11px] rounded gap-1.5',
          size === 'md' && 'h-9 px-4 text-[12px] rounded-md gap-2',
          size === 'lg' && 'h-11 px-5 text-[13px] rounded-md gap-2',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className={clsx('animate-spin flex-shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')}
            fill="none" viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
