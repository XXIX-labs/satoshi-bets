import { createMessage, parseJsonFromResponse } from './claude.js'
import { getBtcUsdPrice } from '../services/pyth/priceFeeds.js'
import { getMarketNews } from '../services/external/newsapi.js'
import { logger } from '../middleware/logger.js'

const AUTO_SUBMIT_CONFIDENCE = 9500 // 95% in basis points

export interface OracleResolutionResult {
  outcome: boolean
  confidence: number // 0-10000 bps
  reasoning: string
  sources: string[]
  autoSubmit: boolean
}

interface RawOracleResult {
  outcome: boolean
  confidence: number
  reasoning: string
  sources: string[]
}

export async function resolveMarket(
  marketId: number,
  question: string,
  resolutionCriteria: string,
  resolutionBlock: number,
  currentBlock: number
): Promise<OracleResolutionResult> {
  logger.info({ marketId, question }, 'Oracle Agent: resolving market')

  const [btcPrice, news] = await Promise.allSettled([
    getBtcUsdPrice(),
    getMarketNews(question),
  ])

  const btcPriceStr = btcPrice.status === 'fulfilled'
    ? `$${btcPrice.value.price.toLocaleString()} (published at ${new Date(btcPrice.value.publishTime * 1000).toISOString()})`
    : 'Price data unavailable'

  const newsContext = news.status === 'fulfilled'
    ? news.value.slice(0, 5).map((a) => `- ${a.title} — ${a.publishedAt} (${a.url})`).join('\n')
    : 'No news found'

  const text = await createMessage({
    system: `You are an objective oracle agent for Satoshi Bets, a Bitcoin-secured prediction market.
Your role is to determine whether a market's resolution criteria have been met based on verifiable evidence.
You must be extremely precise and evidence-based. When in doubt, report lower confidence.
Respond with valid JSON only. No other text.`,
    messages: [
      {
        role: 'user',
        content: `Determine the outcome of this prediction market:

Market ID: ${marketId}
Question: ${question}
Resolution Criteria: ${resolutionCriteria}
Resolution Block: ${resolutionBlock}
Current Block: ${currentBlock}
Current BTC/USD (Pyth): ${btcPriceStr}

Recent relevant news:
${newsContext}

Analyze all available evidence and determine:
1. Whether the resolution criteria have been met (outcome: true = YES, false = NO)
2. Your confidence level (0-10000 basis points, where 10000 = 100%)
3. Your detailed reasoning
4. Your evidence sources

Rules:
- Only return true if there is CLEAR evidence the criteria are met
- If the deadline hasn't passed, return false unless criteria are definitively met early
- Include at least 3 source URLs in your response

Respond with ONLY this JSON:
{
  "outcome": true/false,
  "confidence": 0-10000,
  "reasoning": "Detailed explanation of the outcome determination with specific evidence",
  "sources": ["https://source1.com", "https://source2.com", "https://source3.com"]
}`,
      },
    ],
  })

  const raw = parseJsonFromResponse<RawOracleResult>(text)

  const result: OracleResolutionResult = {
    outcome: raw.outcome,
    confidence: Math.max(0, Math.min(10000, raw.confidence)),
    reasoning: raw.reasoning,
    sources: raw.sources.slice(0, 10),
    autoSubmit: raw.confidence >= AUTO_SUBMIT_CONFIDENCE,
  }

  logger.info(
    { marketId, outcome: result.outcome, confidence: result.confidence, autoSubmit: result.autoSubmit },
    'Oracle Agent: resolution determined'
  )

  return result
}
