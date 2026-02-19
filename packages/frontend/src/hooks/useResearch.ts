import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export function useResearch() {
  return useMutation({
    mutationFn: ({ marketId, userQuery }: { marketId: number; userQuery?: string }) =>
      api.research.generate(marketId, userQuery),
    retry: 0,
  })
}
