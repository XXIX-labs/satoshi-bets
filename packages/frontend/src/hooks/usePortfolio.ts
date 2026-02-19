import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { useWalletStore } from '../stores/walletStore.js'

export function usePortfolio() {
  const address = useWalletStore((s) => s.address)
  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => api.portfolio.get(address!),
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
