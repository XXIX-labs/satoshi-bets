interface MarketSortProps {
  value: string
  onChange: (value: string) => void
}

const SORT_OPTIONS = [
  { value: 'volume', label: 'Most Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'expiring', label: 'Expiring Soon' },
  { value: 'probability', label: 'Nearest 50%' },
]

export function MarketSort({ value, onChange }: MarketSortProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-white/70 focus:border-orange-500/50 focus:outline-none"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
