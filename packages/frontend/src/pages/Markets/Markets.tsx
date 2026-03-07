import { useState } from 'react'
import { useMarkets } from '../../hooks/useMarkets.js'
import { MarketCard } from '../../components/markets/MarketCard.js'
import { MarketFilters } from '../../components/markets/MarketFilters.js'
import { Spinner } from '../../components/ui/Spinner.js'
import { Skeleton } from '../../components/ui/Spinner.js'

import type { MarketCategory } from '../../lib/types.js'

type SortOption = 'volume' | 'newest' | 'expiry'

export function Markets() {
  const [category, setCategory] = useState<MarketCategory | null>(null)
  const [sort, setSort] = useState<SortOption>('volume')
  const { data: markets = [], isLoading, isError } = useMarkets({ category: category ?? undefined, sort })

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="animate-fade-up">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-t1 sm:text-3xl">
          MARKETS
        </h1>
        <p className="mt-1 font-mono text-xs text-t3">
          Binary prediction markets · sBTC collateral · Bitcoin settlement
        </p>
      </header>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <MarketFilters selected={category} onSelect={setCategory} />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-md border border-border bg-s0 px-3 py-1.5 font-mono text-[11px] text-t2 focus:border-orange/50 focus:outline-none"
        >
          <option value="volume">MOST VOLUME</option>
          <option value="newest">NEWEST</option>
          <option value="expiry">EXPIRING SOON</option>
        </select>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-no/20 bg-no/5 p-6 text-center">
          <p className="font-mono text-xs text-no">FAILED TO LOAD MARKETS</p>
          <p className="mt-1 font-mono text-[10px] text-t4">Check API connection</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && markets.length === 0 && (
        <div className="rounded-lg border border-border bg-s0 p-12 text-center">
          <p className="font-mono text-xs text-t3">NO MARKETS FOUND</p>
          <p className="mt-1 font-mono text-[10px] text-t4">
            {category ? 'Try a different category' : 'Markets generate every 4h'}
          </p>
        </div>
      )}

      {/* Market feed — dense list, not a card grid */}
      {!isLoading && !isError && markets.length > 0 && (
        <div className="space-y-1.5 stagger">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  )
}
