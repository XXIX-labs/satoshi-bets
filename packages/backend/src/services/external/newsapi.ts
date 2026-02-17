import { env } from '../../config/env.js'
import { redisCache } from '../cache/redisCache.js'

const BASE_URL = 'https://newsapi.org/v2'
const CACHE_TTL = 300 // 5 minutes

export interface NewsArticle {
  title: string
  description: string
  url: string
  publishedAt: string
  source: { name: string }
}

export async function getCryptoNews(query = 'Bitcoin crypto prediction'): Promise<NewsArticle[]> {
  if (!env.NEWS_API_KEY) return []

  const cacheKey = `newsapi:${query.slice(0, 50)}`
  const cached = await redisCache.get<NewsArticle[]>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '10',
    apiKey: env.NEWS_API_KEY,
  })

  const res = await fetch(`${BASE_URL}/everything?${params}`, {
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    // Don't throw — degrade gracefully
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const articles = (data.articles ?? []) as NewsArticle[]
  await redisCache.set(cacheKey, articles, CACHE_TTL)
  return articles
}

export async function getMarketNews(marketQuestion: string): Promise<NewsArticle[]> {
  // Extract key terms from market question for searching
  const keyTerms = marketQuestion
    .replace(/[?.,]/g, '')
    .split(' ')
    .filter((w) => w.length > 4)
    .slice(0, 4)
    .join(' ')
  return getCryptoNews(keyTerms)
}
