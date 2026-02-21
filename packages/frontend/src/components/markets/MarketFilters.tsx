import { clsx } from 'clsx'
import { CATEGORY_LABELS } from '../../lib/formatters.js'
import type { MarketCategory } from '../../lib/types.js'

interface MarketFiltersProps {
  selected: MarketCategory | ''
  onSelect: (cat: MarketCategory | '') => void
}

const ALL_CATEGORIES: (MarketCategory | '')[] = ['', 'crypto', 'stacks', 'macro', 'regulation', 'tech', 'global']
const LABELS: Record<string, string> = { '': 'All', ...CATEGORY_LABELS }

export function MarketFilters({ selected, onSelect }: MarketFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat || 'all'}
          onClick={() => onSelect(cat)}
          className={clsx(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
            selected === cat
              ? 'bg-orange-500 text-white'
              : 'border border-white/10 bg-surface text-white/60 hover:border-orange-500/30 hover:text-white'
          )}
        >
          {LABELS[cat] ?? cat}
        </button>
      ))}
    </div>
  )
}
