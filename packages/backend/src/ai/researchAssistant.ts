import { createMessage, parseJsonFromResponse } from './claude.js'
import { getBtcUsdPrice } from '../services/pyth/priceFeeds.js'
import { getMarketNews } from '../services/external/newsapi.js'
import { redisCache } from '../services/cache/redisCache.js'
import { logger } from '../middleware/logger.js'
import type { AiResearchBrief, ResearchArgument } from '../types/index.js'

const RESEARCH_CACHE_TTL = 15 * 60 // 15 minutes

interface RawBrief {
  yes_arguments: Array<{ title: string; body: string; source_url?: string; weight: number }>
  no_arguments: Array<{ title: string; body: string; source_url?: string; weight: number }>
  sources: string[]
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence_score: number
  summary: string
}

export async function generateResearchBrief(
  marketId: number,
  question: string,
  resolutionCriteria: string,
  currentYesPrice: number // in millionths (0-1,000,000)
): Promise<AiResearchBrief> {
  const cacheKey = `research:${marketId}`
  const cached = await redisCache.get<AiResearchBrief>(cacheKey)
  if (cached) return cached

  logger.info({ marketId, question }, 'Research Assistant: generating brief')

  const [btcPrice, news] = await Promise.allSettled([
    getBtcUsdPrice(),
    getMarketNews(question),
  ])

  const btcPriceStr = btcPrice.status === 'fulfilled'
    ? `$${btcPrice.value.price.toLocaleString()}`
    : 'unavailable'

  const newsContext = news.status === 'fulfilled'
    ? news.value.slice(0, 5).map((a) => `- ${a.title} (${a.source.name})`).join('\n')
    : 'No recent news found'

  const currentProbability = (currentYesPrice / 1_000_000 * 100).toFixed(1)

  const text = await createMessage({
    system: `You are Satoshi AI, an objective research assistant for prediction markets.
You provide balanced, evidence-based analysis to help users make informed decisions.
You NEVER recommend specific trades or tell users what to bet.
You present information objectively for BOTH yes and no outcomes.
Always respond with valid JSON only, no markdown or extra text.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this prediction market:

Question: ${question}
Resolution Criteria: ${resolutionCriteria}
Current Market Probability: ${currentProbability}% YES
Current BTC/USD (Pyth): ${btcPriceStr}

Recent News:
${newsContext}

Provide a balanced research brief with 3-5 arguments for each outcome.
Respond with ONLY this JSON:
{
  "yes_arguments": [
    {"title": "Short title", "body": "2-3 sentence explanation", "source_url": "optional", "weight": 1-5}
  ],
  "no_arguments": [
    {"title": "Short title", "body": "2-3 sentence explanation", "source_url": "optional", "weight": 1-5}
  ],
  "sources": ["url1", "url2"],
  "sentiment": "bullish|bearish|neutral",
  "confidence_score": 0-100,
  "summary": "One paragraph neutral summary"
}`,
      },
    ],
  })

  const raw = parseJsonFromResponse<RawBrief>(text)
  const now = new Date()
  const cachedUntil = new Date(now.getTime() + RESEARCH_CACHE_TTL * 1000)

  const brief: AiResearchBrief = {
    marketId,
    question,
    yesArguments: raw.yes_arguments.map(
      (a): ResearchArgument => ({
        title: a.title,
        body: a.body,
        sourceUrl: a.source_url,
        weight: Math.max(1, Math.min(5, a.weight)),
      })
    ),
    noArguments: raw.no_arguments.map(
      (a): ResearchArgument => ({
        title: a.title,
        body: a.body,
        sourceUrl: a.source_url,
        weight: Math.max(1, Math.min(5, a.weight)),
      })
    ),
    sources: raw.sources,
    sentiment: raw.sentiment,
    confidenceScore: Math.max(0, Math.min(100, raw.confidence_score)),
    generatedAt: now.toISOString(),
    cachedUntil: cachedUntil.toISOString(),
  }

  await redisCache.set(cacheKey, brief, RESEARCH_CACHE_TTL)
  return brief
}
