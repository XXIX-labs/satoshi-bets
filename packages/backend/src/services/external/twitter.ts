import { env } from '../../config/env.js'
import { redisCache } from '../cache/redisCache.js'

const CACHE_TTL = 600 // 10 minutes

export interface Tweet {
  id: string
  text: string
  created_at: string
  public_metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
  }
}

export async function searchTweets(query: string, maxResults = 20): Promise<Tweet[]> {
  if (!env.TWITTER_BEARER_TOKEN) return []

  const cacheKey = `twitter:${query.slice(0, 50)}`
  const cached = await redisCache.get<Tweet[]>(cacheKey)
  if (cached) return cached

  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'created_at,public_metrics',
    sort_order: 'relevancy',
  })

  const res = await fetch(
    `https://api.twitter.com/2/tweets/search/recent?${params}`,
    {
      headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    }
  )

  if (!res.ok) {
    // Degrade gracefully — Twitter API is rate limited
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()
  const tweets = (data.data ?? []) as Tweet[]
  await redisCache.set(cacheKey, tweets, CACHE_TTL)
  return tweets
}

export function calculateSentiment(tweets: Tweet[]): 'bullish' | 'bearish' | 'neutral' {
  if (tweets.length === 0) return 'neutral'

  const bullishKeywords = ['bull', 'moon', 'pump', 'up', 'rise', 'buy', 'long', 'ath', 'green']
  const bearishKeywords = ['bear', 'dump', 'down', 'fall', 'sell', 'short', 'crash', 'red']

  let bullScore = 0
  let bearScore = 0

  for (const tweet of tweets) {
    const text = tweet.text.toLowerCase()
    const engagement = tweet.public_metrics.like_count + tweet.public_metrics.retweet_count + 1

    bullishKeywords.forEach((kw) => { if (text.includes(kw)) bullScore += engagement })
    bearishKeywords.forEach((kw) => { if (text.includes(kw)) bearScore += engagement })
  }

  if (bullScore > bearScore * 1.3) return 'bullish'
  if (bearScore > bullScore * 1.3) return 'bearish'
  return 'neutral'
}
