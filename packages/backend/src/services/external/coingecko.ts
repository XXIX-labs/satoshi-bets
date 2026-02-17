import { env } from '../../config/env.js'
import { redisCache } from '../cache/redisCache.js'

const BASE_URL = 'https://api.coingecko.com/api/v3'
const CACHE_TTL = 300 // 5 minutes

interface CoinData {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  total_volume: number
}

export async function getTopCryptoData(): Promise<CoinData[]> {
  const cacheKey = 'coingecko:top-coins'
  const cached = await redisCache.get<CoinData[]>(cacheKey)
  if (cached) return cached

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY
  }

  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })

  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`)
  }

  const data = await res.json() as CoinData[]
  await redisCache.set(cacheKey, data, CACHE_TTL)
  return data
}

export async function getBtcDominance(): Promise<number> {
  const cacheKey = 'coingecko:btc-dominance'
  const cached = await redisCache.get<number>(cacheKey)
  if (cached !== null) return cached

  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY

  const res = await fetch(`${BASE_URL}/global`, { headers, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`CoinGecko global API error: ${res.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const dominance = data.data.market_cap_percentage.btc as number
  await redisCache.set(cacheKey, dominance, CACHE_TTL)
  return dominance
}
