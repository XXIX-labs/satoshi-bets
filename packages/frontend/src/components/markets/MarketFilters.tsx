import { clsx } from 'clsx'
import { CATEGORY_LABELS } from '../../lib/formatters.js'
import type { MarketCategory } from '../../lib/types.js'

interface MarketFiltersProps {
  selected: MarketCategory | null
  onSelect: (category: MarketCategory | null) => void
}

export function MarketFilters({ selected, onSelect }: MarketFiltersProps) {
  const categories: { id: MarketCategory | null; label: string }[] = [
    { id: null, label: 'ALL' },
    ...Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
      id: id as MarketCategory,
      label: label.toUpperCase(),
    })),
  ]

  return (
    <nav className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none" role="tablist">
      {categories.map(({ id, label }) => (
        <button
          key={label}
          role="tab"
          aria-selected={selected === id}
          onClick={() => onSelect(id)}
          className={clsx(
            'whitespace-nowrap rounded px-3 py-1.5 font-mono text-[10px] font-medium tracking-wider transition-all duration-150 border',
            selected === id
              ? 'border-orange/30 bg-orange/10 text-orange'
              : 'border-transparent text-t3 hover:text-t1 hover:bg-s1'
          )}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
