import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import type { AiResearchBrief } from '../lib/types.js'

export function useResearch(marketId: number) {
  const [research, setResearch] = useState<AiResearchBrief | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.research.generate(marketId),
    onSuccess: (data) => setResearch(data as AiResearchBrief),
    retry: 0,
  })

  return {
    research,
    isLoading: mutation.isPending,
    fetchResearch: () => mutation.mutate(),
  }
}
