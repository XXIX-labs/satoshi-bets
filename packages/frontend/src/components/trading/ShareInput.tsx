import { useState } from 'react'
import { clsx } from 'clsx'

interface ShareInputProps {
  value: string
  onChange: (v: string) => void
  side: 'YES' | 'NO'
  onSideChange: (side: 'YES' | 'NO') => void
  disabled?: boolean
}

const QUICK_AMOUNTS = ['0.01', '0.05', '0.1', '0.5']

export function ShareInput({ value, onChange, side, onSideChange, disabled }: ShareInputProps) {
  return (
    <div className="space-y-3">
      {/* YES / NO toggle */}
      <div className="flex rounded-xl border border-white/10 bg-dark-50 p-1">
        {(['YES', 'NO'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSideChange(s)}
            disabled={disabled}
            className={clsx(
              'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
              side === s
                ? s === 'YES'
                  ? 'bg-green-500 text-white shadow'
                  : 'bg-red-500 text-white shadow'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          min="0"
          step="0.001"
          className="w-full rounded-xl border border-white/10 bg-dark-50 py-3 pl-4 pr-20 font-mono text-lg text-white placeholder-white/20 focus:border-orange-500/50 focus:outline-none disabled:opacity-50"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-white/40">sBTC</span>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => onChange(amt)}
            disabled={disabled}
            className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs text-white/50 transition-colors hover:border-orange-500/30 hover:text-orange-400 disabled:opacity-40"
          >
            {amt}
          </button>
        ))}
      </div>
    </div>
  )
}
