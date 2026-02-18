import { Router } from 'express'
import { z } from 'zod'
import { generateResearchBrief } from '../ai/researchAssistant.js'
import { getMarket } from '../services/stacks/marketFactory.js'
import { getYesPrice } from '../services/stacks/marketAmm.js'
import { researchLimiter } from '../middleware/rateLimiter.js'

const router = Router()

const researchRequestSchema = z.object({
  marketId: z.number().int().positive(),
  userQuery: z.string().max(500).optional(),
})

// POST /api/v1/research — get AI research brief for a market
router.post('/', researchLimiter, async (req, res) => {
  try {
    const body = researchRequestSchema.safeParse(req.body)
    if (!body.success) {
      res.status(400).json({ success: false, error: body.error.message })
      return
    }

    const { marketId } = body.data
    const market = await getMarket(marketId)
    if (!market) {
      res.status(404).json({ success: false, error: 'Market not found' })
      return
    }

    const yesPrice = await getYesPrice(marketId).catch(() => 500_000)

    const brief = await generateResearchBrief(
      marketId,
      market.question,
      market.description,
      yesPrice
    )

    res.json({ success: true, data: brief })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
