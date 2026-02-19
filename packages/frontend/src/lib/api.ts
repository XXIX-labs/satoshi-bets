import { API_URL } from '../config/stacks.js'
import type { Market, MarketPool, AiResearchBrief, PythPrice, PortfolioSummary } from './types.js'

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'API error')
  return data.data as T
}

export interface MarketWithPool {
  market: Market
  pool: MarketPool | null
  btcPrice: PythPrice | null
}

export const api = {
  markets: {
    list: (params?: { category?: string; status?: string; sort?: string; page?: number }) =>
      fetchApi<Market[]>(`/markets?${new URLSearchParams(params as Record<string, string>).toString()}`),
    get: (id: number) => fetchApi<MarketWithPool>(`/markets/${id}`),
    priceHistory: (id: number) => fetchApi<{ timestamp: number; yesPrice: number; volume: number }[]>(`/markets/${id}/price-history`),
    position: (id: number, address: string) => fetchApi(`/markets/${id}/positions/${address}`),
  },
  research: {
    generate: (marketId: number, userQuery?: string) =>
      fetchApi<AiResearchBrief>('/research', {
        method: 'POST',
        body: JSON.stringify({ marketId, userQuery }),
      }),
  },
  portfolio: {
    get: (address: string) => fetchApi<PortfolioSummary>(`/portfolio/${address}`),
  },
  price: {
    btc: () => fetchApi<PythPrice>('/price/btc'),
  },
  oracle: {
    get: (marketId: number) => fetchApi(`/oracle/${marketId}`),
  },
}
