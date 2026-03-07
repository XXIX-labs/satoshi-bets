import { clsx } from 'clsx'

interface ShareInputProps {
  value: string
  onChange: (value: string) => void
  side: 'YES' | 'NO'
  onSideChange: (side: 'YES' | 'NO') => void
  disabled?: boolean
}

const QUICK_AMOUNTS = ['0.01', '0.05', '0.1', '0.5']

export function ShareInput({ value, onChange, side, onSideChange, disabled }: ShareInputProps) {
  return (
    <div className="space-y-3">
      {/* Side toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-bg p-1">
        {(['YES', 'NO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSideChange(s)}
            disabled={disabled}
            className={clsx(
              'rounded py-2 font-mono text-[12px] font-bold tracking-wider transition-all duration-150',
              side === s
                ? s === 'YES'
                  ? 'bg-yes/15 text-yes border border-yes/30 shadow-yes-sm'
                  : 'bg-no/15 text-no border border-no/30 shadow-no-sm'
                : 'text-t3 border border-transparent hover:text-t1',
              'disabled:opacity-40'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="relative">
        <label className="block font-mono text-[10px] text-t4 tracking-wider mb-1.5">
          AMOUNT (sBTC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
            className={clsx(
              'w-full rounded-md border border-border bg-bg px-4 py-3',
              'font-mono text-lg font-medium text-t1 tabular-nums',
              'placeholder:text-t4',
              'focus:border-orange/50 focus:outline-none focus:ring-1 focus:ring-orange/20',
              'disabled:opacity-40',
              'transition-all duration-150'
            )}
            step="0.01"
            min="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-t3">
            sBTC
          </span>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-1.5">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onChange(amt)}
            disabled={disabled}
            className={clsx(
              'flex-1 rounded border border-border bg-s0 py-1.5',
              'font-mono text-[10px] text-t3',
              'hover:border-border-active hover:text-t1 hover:bg-s1',
              'active:scale-[0.97]',
              'transition-all duration-100',
              'disabled:opacity-40'
            )}
          >
            {amt}
          </button>
        ))}
      </div>
    </div>
  )
}
