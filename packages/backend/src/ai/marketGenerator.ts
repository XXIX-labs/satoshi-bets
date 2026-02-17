import { createMessage, parseJsonFromResponse } from './claude.js'
import { getTopCryptoData, getBtcDominance } from '../services/external/coingecko.js'
import { getCryptoNews } from '../services/external/newsapi.js'
import { searchTweets } from '../services/external/twitter.js'
import { redisCache } from '../services/cache/redisCache.js'
import { logger } from '../middleware/logger.js'
import type { AiMarketProposal, MarketCategory } from '../types/index.js'
import { randomUUID } from 'crypto'

const PROPOSALS_KEY = 'ai:pending-proposals'
const DEDUP_TTL = 60 * 60 * 4 // 4 hours (same as cron interval)

interface RawProposal {
  question: string
  description: string
  category: MarketCategory
  resolution_criteria: string
  oracle_type: 'pyth' | 'ai' | 'manual'
  end_date: string
  initial_probability: number
  confidence: number
}

export async function generateMarketProposals(): Promise<AiMarketProposal[]> {
  logger.info('AI Market Generator: starting proposal generation')

  // Gather context from all data sources
  const [coinData, dominance, news, tweets] = await Promise.allSettled([
    getTopCryptoData(),
    getBtcDominance(),
    getCryptoNews('Bitcoin Ethereum crypto prediction market'),
    searchTweets('Bitcoin price prediction 2026'),
  ])

  const coinSummary = coinData.status === 'fulfilled'
    ? coinData.value.slice(0, 5).map((c) => `${c.name}: $${c.current_price.toLocaleString()} (${c.price_change_percentage_24h.toFixed(1)}% 24h)`).join('\n')
    : 'Price data unavailable'

  const btcDom = dominance.status === 'fulfilled' ? `${dominance.value.toFixed(1)}%` : 'N/A'

  const newsHeadlines = news.status === 'fulfilled'
    ? news.value.slice(0, 5).map((a) => `- ${a.title}`).join('\n')
    : 'News unavailable'

  const tweetSample = tweets.status === 'fulfilled'
    ? tweets.value.slice(0, 5).map((t) => `- ${t.text.slice(0, 120)}`).join('\n')
    : 'Twitter data unavailable'

  const currentDate = new Date().toISOString().split('T')[0]

  const text = await createMessage({
    system: `You are an expert prediction market curator for Satoshi Bets, a Bitcoin-secured prediction market on Stacks L2.
You generate high-quality YES/NO binary prediction markets based on real-world events.

Requirements for each market:
- Binary YES/NO outcome only
- Objective, verifiable resolution criteria
- Resolution date 2-12 weeks in the future
- Topics: crypto prices, Bitcoin ecosystem, macro economics, regulation, technology
- Avoid vague, subjective, or unverifiable questions
- Avoid duplicate topics

Respond with a JSON array of exactly 3 market proposals. No other text.`,
    messages: [
      {
        role: 'user',
        content: `Today's date: ${currentDate}

Current market data:
${coinSummary}
BTC Dominance: ${btcDom}

Recent crypto news:
${newsHeadlines}

Social sentiment:
${tweetSample}

Generate 3 compelling prediction market proposals. Respond with ONLY this JSON array:
[
  {
    "question": "Will [specific outcome] by [specific date]?",
    "description": "Detailed description of what this market is about and why it matters.",
    "category": "crypto|stacks|macro|regulation|tech|global",
    "resolution_criteria": "Objective criteria: Resolves YES if [specific measurable condition]. Resolves NO otherwise.",
    "oracle_type": "pyth|ai|manual",
    "end_date": "YYYY-MM-DD",
    "initial_probability": 45,
    "confidence": 85
  }
]`,
      },
    ],
  })

  const raw = parseJsonFromResponse<RawProposal[]>(text)

  const proposals: AiMarketProposal[] = raw.map((r) => ({
    id: randomUUID(),
    question: r.question.slice(0, 256),
    description: r.description.slice(0, 1024),
    category: r.category,
    resolutionCriteria: r.resolution_criteria,
    oracleType: r.oracle_type,
    endDate: r.end_date,
    initialProbability: Math.max(5, Math.min(95, r.initial_probability)),
    confidence: Math.max(0, Math.min(100, r.confidence)),
    sources: [],
    generatedAt: new Date().toISOString(),
    status: 'pending',
  }))

  // Deduplicate against recent proposals
  const filtered = await deduplicateProposals(proposals)

  // Store in Redis queue for admin review
  for (const proposal of filtered) {
    await redisCache.lpush(PROPOSALS_KEY, JSON.stringify(proposal))
  }

  logger.info({ count: filtered.length }, 'AI Market Generator: proposals queued')
  return filtered
}

export async function getPendingProposals(): Promise<AiMarketProposal[]> {
  const raw = await redisCache.lrange(PROPOSALS_KEY, 0, 49)
  return raw.map((r) => JSON.parse(r) as AiMarketProposal)
}

async function deduplicateProposals(proposals: AiMarketProposal[]): Promise<AiMarketProposal[]> {
  const existing = await getPendingProposals()
  const existingQuestions = new Set(existing.map((p) => p.question.toLowerCase()))

  return proposals.filter((p) => {
    const questionLower = p.question.toLowerCase()
    if (existingQuestions.has(questionLower)) return false
    existingQuestions.add(questionLower)
    return true
  })
}
