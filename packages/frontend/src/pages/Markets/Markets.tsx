import { useState } from 'react'
import { useMarkets } from '../../hooks/useMarkets.js'
import { MarketCard } from '../../components/markets/MarketCard.js'
import { MarketFilters } from '../../components/markets/MarketFilters.js'
import { Spinner } from '../../components/ui/Spinner.js'

type SortOption = 'volume' | 'newest' | 'expiring'

export function Markets() {
  const [category, setCategory] = useState<number | null>(null)
  const [sort, setSort] = useState<SortOption>('volume')

  const { data: markets = [], isLoading, isError } = useMarkets({ category, sort })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Markets</h1>
        <p className="mt-1 text-sm text-white/40">
          AI-generated binary prediction markets. Trade YES/NO with sBTC.
        </p>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MarketFilters selected={category} onSelect={setCategory} />
        <SortPicker value={sort} onChange={setSort} />
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400">Failed to load markets</p>
          <p className="mt-1 text-xs text-white/30">Check API connection and try again</p>
        </div>
      )}

      {!isLoading && !isError && markets.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-surface p-12 text-center">
          <p className="text-white/40">No markets found</p>
          <p className="mt-1 text-xs text-white/20">
            {category ? 'Try a different category' : 'Markets are generated every 4 hours'}
          </p>
        </div>
      )}

      {!isLoading && !isError && markets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  )
}

function SortPicker({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'volume', label: 'Most Volume' },
    { value: 'newest', label: 'Newest' },
    { value: 'expiring', label: 'Expiring Soon' },
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-white/70 focus:border-orange-500/50 focus:outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
