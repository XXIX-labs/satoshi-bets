import { getBtcUsdPrice } from '../services/pyth/priceFeeds.js'
import { getPool, initializePool } from '../services/stacks/marketAmm.js'
import { logger } from '../middleware/logger.js'
import { env } from '../config/env.js'

const MAX_LIQUIDITY_SHARE = 0.30  // AI MM max 30% of pool
const IMBALANCE_PAUSE_THRESHOLD = 0.90  // Pause if >90% on one side
const SEED_AMOUNT = env.MARKET_MAKER_SEED_AMOUNT

interface MarketMakerStatus {
  marketId: number
  seeded: boolean
  seedTxId?: string
  currentYesPrice?: number
  poolBalance?: { yes: number; no: number }
  paused: boolean
  pauseReason?: string
}

export async function seedMarketLiquidity(
  marketId: number,
  initialProbability: number // 0-100 as percentage
): Promise<MarketMakerStatus> {
  if (!env.MARKET_MAKER_MNEMONIC) {
    logger.warn({ marketId }, 'Market Maker: no mnemonic configured, skipping')
    return { marketId, seeded: false, paused: false }
  }

  // Calculate initial pool split based on probability
  // If initial probability is 60% YES, seed 60% in NO pool and 40% in YES pool
  // (CPMM: high NO pool → higher YES price)
  const noRatio = initialProbability / 100
  const yesRatio = 1 - noRatio

  const initialYes = Math.floor(SEED_AMOUNT * yesRatio)
  const initialNo = Math.floor(SEED_AMOUNT * noRatio)

  const btcPrice = await getBtcUsdPrice().catch(() => null)
  logger.info(
    { marketId, initialYes, initialNo, btcPrice: btcPrice?.price },
    'Market Maker: seeding liquidity'
  )

  try {
    const txId = await initializePool(marketId, initialYes, initialNo)
    logger.info({ marketId, txId }, 'Market Maker: pool seeded successfully')
    return { marketId, seeded: true, seedTxId: txId, paused: false }
  } catch (err) {
    logger.error({ err, marketId }, 'Market Maker: pool seed failed')
    return { marketId, seeded: false, paused: false }
  }
}

export async function checkMarketHealth(marketId: number): Promise<MarketMakerStatus> {
  const pool = await getPool(marketId)
  if (!pool) {
    return { marketId, seeded: false, paused: false }
  }

  const totalPool = pool.yesPool + pool.noPool
  const yesRatio = pool.yesPool / totalPool
  const noRatio = pool.noPool / totalPool

  const isImbalanced = yesRatio > IMBALANCE_PAUSE_THRESHOLD || noRatio > IMBALANCE_PAUSE_THRESHOLD
  const yesPrice = pool.noPool / totalPool

  const status: MarketMakerStatus = {
    marketId,
    seeded: true,
    currentYesPrice: yesPrice,
    poolBalance: { yes: pool.yesPool, no: pool.noPool },
    paused: isImbalanced,
    pauseReason: isImbalanced ? `Pool imbalanced: YES ${(yesRatio * 100).toFixed(1)}% / NO ${(noRatio * 100).toFixed(1)}%` : undefined,
  }

  if (isImbalanced) {
    logger.warn({ marketId, yesRatio, noRatio }, 'Market Maker: pool imbalanced — pausing MM activity')
  }

  return status
}
