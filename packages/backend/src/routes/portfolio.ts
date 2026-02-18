import { Router } from 'express'
import { getAllMarkets } from '../services/stacks/marketFactory.js'
import { getPool, getPosition } from '../services/stacks/marketAmm.js'
import type { PortfolioSummary, PositionWithMarket } from '../types/index.js'

const router = Router()

// GET /api/v1/portfolio/:address — user portfolio
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params

    const markets = await getAllMarkets()
    const positions: PositionWithMarket[] = []

    for (const market of markets) {
      const position = await getPosition(market.id, address)
      if (!position || (position.yesShares === 0 && position.noShares === 0)) continue

      const pool = await getPool(market.id)
      let currentValue = 0
      let unrealizedPnl = 0

      if (pool && !pool.resolved) {
        const yesPrice = pool.noPool / (pool.yesPool + pool.noPool)
        const noPrice = 1 - yesPrice
        // Rough value estimate: shares × current price × total pool
        const yesValue = pool.yesPool > 0
          ? (position.yesShares / pool.yesPool) * pool.yesPool
          : 0
        const noValue = pool.noPool > 0
          ? (position.noShares / pool.noPool) * pool.noPool
          : 0
        currentValue = yesValue + noValue
        unrealizedPnl = currentValue - position.costBasis
      }

      positions.push({
        ...position,
        market,
        pool: pool ?? undefined,
        currentValue,
        unrealizedPnl,
      })
    }

    const totalInvested = positions.reduce((sum, p) => sum + p.costBasis, 0)
    const unrealizedPnl = positions.reduce((sum, p) => sum + (p.unrealizedPnl ?? 0), 0)
    const claimable = positions
      .filter((p) => p.market.status === 'resolved' && !p.claimed)
      .reduce((sum, p) => sum + (p.currentValue ?? 0), 0)

    const summary: PortfolioSummary = {
      address,
      positions,
      totalInvested,
      unrealizedPnl,
      claimableWinnings: claimable,
    }

    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
