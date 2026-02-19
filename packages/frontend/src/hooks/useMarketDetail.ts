import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export function useMarketDetail(id: number) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => api.markets.get(id),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: id > 0,
  })
}

export function usePriceHistory(id: number) {
  return useQuery({
    queryKey: ['price-history', id],
    queryFn: () => api.markets.priceHistory(id),
    staleTime: 60_000,
    enabled: id > 0,
  })
}
