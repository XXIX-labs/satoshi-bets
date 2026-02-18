import { Router } from 'express'
import { getAllMarkets, getMarket } from '../services/stacks/marketFactory.js'
import { getPool, getPosition } from '../services/stacks/marketAmm.js'
import { getBtcUsdPrice } from '../services/pyth/priceFeeds.js'
import { redisCache } from '../services/cache/redisCache.js'
import type { Market } from '../types/index.js'

const router = Router()

// GET /api/v1/markets — list all markets with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, status, sort = 'newest', page = '1', limit = '20' } = req.query

    let markets = await getAllMarkets()

    if (category) {
      markets = markets.filter((m) => m.category === category)
    }

    if (status) {
      markets = markets.filter((m) => m.status === status)
    }

    // Sorting
    switch (sort) {
      case 'volume':
        // Sort by volume from pool data (best-effort)
        break
      case 'expiry':
        markets.sort((a, b) => a.resolutionBlock - b.resolutionBlock)
        break
      default: // 'newest'
        markets.sort((a, b) => b.createdAt - a.createdAt)
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum
    const paginated = markets.slice(offset, offset + limitNum)

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: markets.length,
        hasMore: offset + limitNum < markets.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// GET /api/v1/markets/:id — single market with pool data
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid market ID' })
      return
    }

    const [market, pool, btcPrice] = await Promise.allSettled([
      getMarket(id),
      getPool(id),
      getBtcUsdPrice(),
    ])

    if (market.status === 'rejected' || !market.value) {
      res.status(404).json({ success: false, error: 'Market not found' })
      return
    }

    res.json({
      success: true,
      data: {
        market: market.value,
        pool: pool.status === 'fulfilled' ? pool.value : null,
        btcPrice: btcPrice.status === 'fulfilled' ? btcPrice.value : null,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// GET /api/v1/markets/:id/price-history — historical probability data for chart
router.get('/:id/price-history', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const cacheKey = `price-history:${id}`
    const cached = await redisCache.get(cacheKey)
    if (cached) {
      res.json({ success: true, data: cached })
      return
    }
    // In PoC, return synthetic history based on current pool state
    const pool = await getPool(id)
    if (!pool) {
      res.json({ success: true, data: [] })
      return
    }
    const currentYesPrice = pool.noPool / (pool.yesPool + pool.noPool)
    const points = Array.from({ length: 24 }, (_, i) => ({
      timestamp: Date.now() - (24 - i) * 3600000,
      yesPrice: Math.round((0.5 + (currentYesPrice - 0.5) * (i / 23)) * 1_000_000),
      volume: Math.floor(Math.random() * 500000),
    }))
    await redisCache.set(cacheKey, points, 60)
    res.json({ success: true, data: points })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// GET /api/v1/markets/:id/positions/:address — user position
router.get('/:id/positions/:address', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { address } = req.params
    const position = await getPosition(id, address)
    res.json({ success: true, data: position })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
