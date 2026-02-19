// Formatting helpers for sBTC amounts, probabilities, dates

/** Convert raw sBTC satoshi units to human-readable string */
export function formatSbtc(sats: number, decimals = 4): string {
  const btc = sats / 1_000_000_00  // sBTC has 8 decimal places
  return `${btc.toFixed(decimals)} sBTC`
}

/** Convert CPMM price (0–1,000,000) to percentage string */
export function formatProbability(price: number): string {
  return `${(price / 10_000).toFixed(1)}%`
}

/** Convert CPMM price to 0–100 number */
export function priceToPercent(price: number): number {
  return price / 10_000
}

/** Format USD price */
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

/** Truncate Stacks address for display */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/** Format block height as approximate date */
export function blockToDate(blockHeight: number, currentBlock: number): string {
  const blocksRemaining = blockHeight - currentBlock
  const secondsRemaining = blocksRemaining * 600 // ~10 min per block
  const date = new Date(Date.now() + secondsRemaining * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Relative time string */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Category display labels */
export const CATEGORY_LABELS: Record<string, string> = {
  crypto: '₿ Crypto',
  stacks: '🟠 Stacks',
  macro: '📈 Macro',
  regulation: '⚖️ Regulation',
  tech: '🤖 Tech',
  global: '🌍 Global',
}
