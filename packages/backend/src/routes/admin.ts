import { Router } from 'express'
import { z } from 'zod'
import { requireAdminKey } from '../middleware/auth.js'
import { adminLimiter } from '../middleware/rateLimiter.js'
import { generateMarketProposals, getPendingProposals } from '../ai/marketGenerator.js'
import { resolveMarket } from '../ai/oracleAgent.js'
import { submitResolution, finalizeResolution, getResolution } from '../services/stacks/oracleRegistry.js'
import { getAllMarkets, getMarket } from '../services/stacks/marketFactory.js'
import { getPool } from '../services/stacks/marketAmm.js'
import { redisCache } from '../services/cache/redisCache.js'
import { getBtcUsdPrice } from '../services/pyth/priceFeeds.js'
import { logger } from '../middleware/logger.js'

const router = Router()

// All admin routes require API key
router.use(requireAdminKey)
router.use(adminLimiter)

// GET /api/v1/admin/pending-markets
router.get('/pending-markets', async (_req, res) => {
  try {
    const proposals = await getPendingProposals()
    res.json({ success: true, data: proposals })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/approve-market
const approveSchema = z.object({ proposalId: z.string().uuid() })
router.post('/approve-market', async (req, res) => {
  try {
    const body = approveSchema.safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ success: false, error: 'Invalid proposal ID' })
      return
    }
    // Mark as approved in Redis (actual on-chain creation happens separately)
    const proposals = await getPendingProposals()
    const proposal = proposals.find((p) => p.id === body.data.proposalId)
    if (!proposal) {
      res.status(404).json({ success: false, error: 'Proposal not found' })
      return
    }
    proposal.status = 'approved'
    await redisCache.set(`proposal:approved:${proposal.id}`, proposal, 86400)
    logger.info({ proposalId: proposal.id }, 'Admin: market proposal approved')
    res.json({ success: true, data: proposal })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/reject-market
const rejectSchema = z.object({ proposalId: z.string().uuid(), reason: z.string().optional() })
router.post('/reject-market', async (req, res) => {
  try {
    const body = rejectSchema.safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ success: false, error: 'Invalid request' })
      return
    }
    logger.info({ proposalId: body.data.proposalId, reason: body.data.reason }, 'Admin: market proposal rejected')
    res.json({ success: true, message: 'Proposal rejected' })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/generate-markets — manually trigger AI market generation
router.post('/generate-markets', async (_req, res) => {
  try {
    logger.info('Admin: manually triggering market generation')
    const proposals = await generateMarketProposals()
    res.json({ success: true, data: proposals, message: `Generated ${proposals.length} proposals` })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// GET /api/v1/admin/oracle-queue — markets pending oracle resolution
router.get('/oracle-queue', async (_req, res) => {
  try {
    const markets = await getAllMarkets()
    const activeMarkets = markets.filter((m) => m.status === 'active')

    const queue = await Promise.all(
      activeMarkets.map(async (market) => {
        const resolution = await getResolution(market.id).catch(() => null)
        const pool = await getPool(market.id).catch(() => null)
        return { market, resolution, pool }
      })
    )

    res.json({ success: true, data: queue })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/run-oracle/:marketId — manually trigger oracle agent
router.post('/run-oracle/:marketId', async (req, res) => {
  try {
    const id = parseInt(req.params.marketId)
    const market = await getMarket(id)
    if (!market) {
      res.status(404).json({ success: false, error: 'Market not found' })
      return
    }

    const result = await resolveMarket(id, market.question, market.description, market.resolutionBlock, market.resolutionBlock)
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/submit-oracle/:marketId — submit oracle resolution on-chain
const submitSchema = z.object({ outcome: z.boolean(), confidence: z.number().min(0).max(10000), evidenceUri: z.string().url() })
router.post('/submit-oracle/:marketId', async (req, res) => {
  try {
    const id = parseInt(req.params.marketId)
    const body = submitSchema.safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ success: false, error: body.error.message })
      return
    }
    const txId = await submitResolution(id, body.data.outcome, body.data.confidence, body.data.evidenceUri)
    res.json({ success: true, data: { txId } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// POST /api/v1/admin/finalize-oracle/:marketId
router.post('/finalize-oracle/:marketId', async (req, res) => {
  try {
    const id = parseInt(req.params.marketId)
    const txId = await finalizeResolution(id)
    res.json({ success: true, data: { txId } })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

// GET /api/v1/admin/analytics
router.get('/analytics', async (_req, res) => {
  try {
    const [markets, btcPrice] = await Promise.allSettled([getAllMarkets(), getBtcUsdPrice()])
    const allMarkets = markets.status === 'fulfilled' ? markets.value : []

    const stats = {
      totalMarkets: allMarkets.length,
      activeMarkets: allMarkets.filter((m) => m.status === 'active').length,
      resolvedMarkets: allMarkets.filter((m) => m.status === 'resolved').length,
      aiGeneratedMarkets: allMarkets.filter((m) => m.aiGenerated).length,
      btcPrice: btcPrice.status === 'fulfilled' ? btcPrice.value.price : null,
      byCategory: Object.fromEntries(
        ['crypto', 'stacks', 'macro', 'regulation', 'tech', 'global'].map((cat) => [
          cat,
          allMarkets.filter((m) => m.category === cat).length,
        ])
      ),
    }

    res.json({ success: true, data: stats })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
