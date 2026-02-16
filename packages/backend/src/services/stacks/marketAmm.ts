import { Cl } from '@stacks/transactions'
import { readContract, callContract } from './contractClient.js'
import { CONTRACTS } from '../../config/stacks.js'
import { redisCache } from '../cache/redisCache.js'
import type { MarketPool, MarketPosition } from '../../types/index.js'

const { address, name } = CONTRACTS.marketAmm
const POOL_CACHE_TTL = 15 // 15 seconds

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePool(id: number, raw: any): MarketPool {
  const d = raw.value
  return {
    marketId: id,
    yesPool: Number(d['yes-pool'].value),
    noPool: Number(d['no-pool'].value),
    kConstant: Number(d['k-constant'].value),
    totalVolume: Number(d['total-volume'].value),
    totalFees: Number(d['total-fees'].value),
    resolved: d.resolved.value,
    outcome: d.outcome.value !== null ? d.outcome.value.value : undefined,
    sbtcContract: d['sbtc-contract'].value,
  }
}

export async function getPool(marketId: number): Promise<MarketPool | null> {
  const cacheKey = `pool:${marketId}`
  const cached = await redisCache.get<MarketPool>(cacheKey)
  if (cached) return cached

  const result = await readContract(address, name, 'get-pool', [Cl.uint(marketId)]) as { value: unknown }
  if (!result.value) return null

  const pool = parsePool(marketId, result.value)
  await redisCache.set(cacheKey, pool, POOL_CACHE_TTL)
  return pool
}

export async function getPosition(marketId: number, trader: string): Promise<MarketPosition | null> {
  const result = await readContract(address, name, 'get-position', [
    Cl.uint(marketId),
    Cl.principal(trader),
  ]) as { value: unknown }

  if (!result.value) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (result.value as any).value
  return {
    marketId,
    trader,
    yesShares: Number(d['yes-shares'].value),
    noShares: Number(d['no-shares'].value),
    costBasis: Number(d['cost-basis'].value),
    claimed: d.claimed.value,
  }
}

export async function getYesPrice(marketId: number): Promise<number> {
  const result = await readContract(address, name, 'get-yes-price', [Cl.uint(marketId)]) as { value: string }
  return Number(result.value)
}

export async function initializePool(
  marketId: number,
  initialYes: number,
  initialNo: number
): Promise<string> {
  const { address: sbtcAddr, name: sbtcName } = CONTRACTS.sbtc
  return callContract(address, name, 'initialize-pool', [
    Cl.uint(marketId),
    Cl.uint(initialYes),
    Cl.uint(initialNo),
    Cl.contractPrincipal(sbtcAddr, sbtcName),
  ])
}
