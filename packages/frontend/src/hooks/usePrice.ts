import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export function useBtcPrice() {
  return useQuery({
    queryKey: ['btc-price'],
    queryFn: () => api.price.btc(),
    staleTime: 10_000,
    refetchInterval: 10_000,   // Poll every 10s
  })
}
