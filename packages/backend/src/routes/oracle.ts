import { Router } from 'express'
import { getResolution } from '../services/stacks/oracleRegistry.js'

const router = Router()

// GET /api/v1/oracle/:marketId — get resolution data for a market
router.get('/:marketId', async (req, res) => {
  try {
    const id = parseInt(req.params.marketId)
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid market ID' })
      return
    }

    const resolution = await getResolution(id)
    res.json({ success: true, data: resolution })
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message })
  }
})

export default router
