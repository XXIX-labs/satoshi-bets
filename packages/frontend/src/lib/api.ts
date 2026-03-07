import { API_URL } from '../config/stacks.js'
import type { Market, MarketPool, AiResearchBrief, PythPrice, PortfolioData } from './types.js'

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
    get: (address: string) => fetchApi<PortfolioData>(`/portfolio/${address}`),
  },
  price: {
    btc: () => fetchApi<PythPrice>('/price/btc'),
  },
  oracle: {
    get: (marketId: number) => fetchApi(`/oracle/${marketId}`),
  },
  admin: {
    pendingMarkets: (key: string) =>
      fetchApi('/admin/pending-markets', { headers: { 'X-API-Key': key } }),
    approveMarket: (proposalId: string, key: string) =>
      fetchApi('/admin/approve-market', {
        method: 'POST',
        headers: { 'X-API-Key': key },
        body: JSON.stringify({ proposalId }),
      }),
    rejectMarket: (proposalId: string, key: string) =>
      fetchApi('/admin/reject-market', {
        method: 'POST',
        headers: { 'X-API-Key': key },
        body: JSON.stringify({ proposalId }),
      }),
    generateMarkets: (key: string) =>
      fetchApi('/admin/generate-markets', {
        method: 'POST',
        headers: { 'X-API-Key': key },
      }),
    oracleQueue: (key: string) =>
      fetchApi('/admin/oracle-queue', { headers: { 'X-API-Key': key } }),
    runOracle: (marketId: number, key: string) =>
      fetchApi('/admin/run-oracle', {
        method: 'POST',
        headers: { 'X-API-Key': key },
        body: JSON.stringify({ marketId }),
      }),
    finalizeOracle: (marketId: number, key: string) =>
      fetchApi('/admin/finalize-oracle', {
        method: 'POST',
        headers: { 'X-API-Key': key },
        body: JSON.stringify({ marketId }),
      }),
    analytics: (key: string) =>
      fetchApi('/admin/analytics', { headers: { 'X-API-Key': key } }),
  },
}
