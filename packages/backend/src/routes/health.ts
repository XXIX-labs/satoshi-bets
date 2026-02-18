import { Router } from 'express'
import { getRedis } from '../config/redis.js'
import { env } from '../config/env.js'

const router = Router()

router.get('/', async (_req, res) => {
  let redisStatus = 'disconnected'
  try {
    const redis = getRedis()
    await redis.ping()
    redisStatus = 'connected'
  } catch {
    redisStatus = 'error'
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '0.1.0',
      network: env.STACKS_NETWORK,
      redis: redisStatus,
      aiJobsEnabled: env.ENABLE_AI_JOBS,
      timestamp: new Date().toISOString(),
    },
  })
})

export default router
