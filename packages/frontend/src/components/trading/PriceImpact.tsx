import { Spinner } from '../ui/Spinner.js'
import { formatProbability, formatSbtc } from '../../lib/formatters.js'

interface TradeQuote {
  sharesOut: number
  fee: number
  newYesPrice: number
  priceImpactBps: number
}

interface PriceImpactProps {
  quote: TradeQuote | null
  loading: boolean
  side: 'YES' | 'NO'
}

export function PriceImpact({ quote, loading, side }: PriceImpactProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  if (!quote) return null

  const impactPct = quote.priceImpactBps / 100

  return (
    <div className="space-y-2 rounded-xl border border-white/8 bg-dark-50 p-4 text-sm">
      <div className="flex justify-between text-white/60">
        <span>Estimated shares</span>
        <span className="font-mono text-white">{quote.sharesOut.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-white/60">
        <span>Fee (2%)</span>
        <span className="font-mono text-white">{formatSbtc(quote.fee, 6)}</span>
      </div>
      <div className="flex justify-between text-white/60">
        <span>Price impact</span>
        <span className={`font-mono ${impactPct > 5 ? 'text-red-400' : 'text-white'}`}>
          {impactPct.toFixed(2)}%
        </span>
      </div>
      <div className="border-t border-white/8 pt-2 flex justify-between">
        <span className="text-white/60">New {side} price</span>
        <span className="font-mono text-orange-400">
          {formatProbability(quote.newYesPrice)}
        </span>
      </div>
    </div>
  )
}
