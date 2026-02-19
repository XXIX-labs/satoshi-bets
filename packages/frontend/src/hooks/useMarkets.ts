import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import type { MarketCategory, MarketStatus } from '../lib/types.js'

interface UseMarketsOptions {
  category?: MarketCategory
  status?: MarketStatus
  sort?: 'newest' | 'volume' | 'expiry'
  page?: number
}

export function useMarkets(options: UseMarketsOptions = {}) {
  return useQuery({
    queryKey: ['markets', options],
    queryFn: () => api.markets.list(options),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
