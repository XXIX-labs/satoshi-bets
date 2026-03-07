import { clsx } from 'clsx'
import { formatSbtc } from '../../lib/formatters.js'

interface PriceImpactProps {
  quote: {
    sharesOut: number
    fee: number
    newYesPrice: number
    priceImpactBps: number
  }
  loading: boolean
  side: 'YES' | 'NO'
}

export function PriceImpact({ quote, loading, side }: PriceImpactProps) {
  if (loading) {
    return (
      <div className="rounded-md border border-border bg-bg p-3 animate-pulse">
        <div className="h-16 rounded bg-s1" />
      </div>
    )
  }

  const rows = [
    { label: 'EST. SHARES', value: quote.sharesOut.toLocaleString(), accent: true },
    { label: 'PROTOCOL FEE', value: `${formatSbtc(quote.fee, 8)} sBTC` },
    { label: 'NEW YES PRICE', value: `${(quote.newYesPrice / 10_000).toFixed(1)}%` },
    { label: 'PRICE IMPACT', value: `${(quote.priceImpactBps / 100).toFixed(2)}%`, warn: quote.priceImpactBps > 500 },
  ]

  return (
    <div className="rounded-md border border-border bg-bg overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <span className="font-mono text-[9px] text-t4 tracking-widest">QUOTE PREVIEW</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map(({ label, value, accent, warn }) => (
          <div key={label} className="flex items-center justify-between px-3 py-2">
            <span className="font-mono text-[10px] text-t3 tracking-wider">{label}</span>
            <span className={clsx(
              'font-mono text-[12px] tabular-nums',
              warn ? 'text-no' : accent ? (side === 'YES' ? 'text-yes' : 'text-no') : 'text-t1'
            )}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
