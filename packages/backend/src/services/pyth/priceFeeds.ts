import { env } from '../../config/env.js'
import { redisCache } from '../cache/redisCache.js'
import type { PythPrice } from '../../types/index.js'

const PRICE_CACHE_TTL = 10 // 10 seconds

export async function getBtcUsdPrice(): Promise<PythPrice> {
  if (env.USE_MOCK_PYTH) {
    return {
      price: 95_000,
      confidence: 150,
      publishTime: Math.floor(Date.now() / 1000),
      feedId: env.PYTH_BTC_USD_FEED_ID,
    }
  }

  const cacheKey = 'pyth:btc-usd'
  const cached = await redisCache.get<PythPrice>(cacheKey)
  if (cached) return cached

  const url = `${env.PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${env.PYTH_BTC_USD_FEED_ID}&parsed=true`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

  if (!res.ok) {
    throw new Error(`Pyth Hermes API error: ${res.status} ${res.statusText}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const feed = data.parsed?.[0]

  if (!feed) {
    throw new Error('No price feed data returned from Pyth')
  }

  const exponent = feed.price.expo
  const price: PythPrice = {
    price: feed.price.price * Math.pow(10, exponent),
    confidence: feed.price.conf * Math.pow(10, exponent),
    publishTime: feed.price.publish_time,
    feedId: env.PYTH_BTC_USD_FEED_ID,
  }

  await redisCache.set(cacheKey, price, PRICE_CACHE_TTL)
  return price
}

export async function getPriceVaa(feedId: string): Promise<string> {
  const url = `${env.PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${feedId}&encoding=base64`
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) throw new Error(`Pyth VAA fetch error: ${res.status}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  return data.binary?.data?.[0] ?? ''
}
