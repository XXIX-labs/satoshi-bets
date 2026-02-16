import { Cl } from '@stacks/transactions'
import { readContract, callContract } from './contractClient.js'
import { CONTRACTS } from '../../config/stacks.js'
import { redisCache } from '../cache/redisCache.js'
import type { Market } from '../../types/index.js'

const { address, name } = CONTRACTS.marketFactory
const CACHE_TTL = 30 // 30 seconds

function mapStatusToString(status: number): Market['status'] {
  switch (status) {
    case 1: return 'active'
    case 2: return 'paused'
    case 3: return 'resolved'
    case 4: return 'cancelled'
    default: return 'active'
  }
}

function mapCategoryToString(cat: number): Market['category'] {
  const map: Record<number, Market['category']> = {
    1: 'crypto', 2: 'stacks', 3: 'macro', 4: 'regulation', 5: 'tech', 6: 'global'
  }
  return map[cat] ?? 'crypto'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseMarketData(id: number, raw: any): Market {
  const d = raw.value
  return {
    id,
    question: d.question.value,
    description: d.description.value,
    category: mapCategoryToString(Number(d.category.value)),
    creator: d.creator.value,
    createdAt: Number(d['created-at'].value),
    resolutionBlock: Number(d['resolution-block'].value),
    status: mapStatusToString(Number(d.status.value)),
    outcome: d.outcome.value !== null ? d.outcome.value.value : undefined,
    aiGenerated: d['ai-generated'].value,
    metadataUri: d['metadata-uri'].value,
  }
}

export async function getMarket(id: number): Promise<Market | null> {
  const cacheKey = `market:${id}`
  const cached = await redisCache.get<Market>(cacheKey)
  if (cached) return cached

  const result = await readContract(address, name, 'get-market', [Cl.uint(id)]) as { value: unknown }
  if (!result.value) return null

  const market = parseMarketData(id, result.value)
  await redisCache.set(cacheKey, market, CACHE_TTL)
  return market
}

export async function getMarketCount(): Promise<number> {
  const result = await readContract(address, name, 'get-market-count', []) as { value: string }
  return Number(result.value)
}

export async function getAllMarkets(): Promise<Market[]> {
  const count = await getMarketCount()
  const markets: Market[] = []

  for (let i = 1; i <= count; i++) {
    const market = await getMarket(i)
    if (market) markets.push(market)
  }

  return markets
}

export async function createMarketOnChain(
  question: string,
  description: string,
  category: number,
  resolutionBlock: number,
  aiGenerated: boolean,
  metadataUri: string
): Promise<string> {
  return callContract(address, name, 'create-market', [
    Cl.stringAscii(question),
    Cl.stringAscii(description),
    Cl.uint(category),
    Cl.uint(resolutionBlock),
    Cl.bool(aiGenerated),
    Cl.stringAscii(metadataUri),
  ])
}
