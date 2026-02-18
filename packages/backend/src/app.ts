import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { httpLogger } from './middleware/logger.js'
import { defaultLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import marketsRouter from './routes/markets.js'
import researchRouter from './routes/research.js'
import oracleRouter from './routes/oracle.js'
import adminRouter from './routes/admin.js'
import portfolioRouter from './routes/portfolio.js'

export function createApp() {
  const app = express()

  // Security
  app.use(helmet())
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    })
  )

  // Body parsing
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false }))

  // Logging
  app.use(httpLogger)

  // Global rate limiting
  app.use(defaultLimiter)

  // Routes
  app.use('/api/v1/health', healthRouter)
  app.use('/api/v1/markets', marketsRouter)
  app.use('/api/v1/research', researchRouter)
  app.use('/api/v1/oracle', oracleRouter)
  app.use('/api/v1/admin', adminRouter)
  app.use('/api/v1/portfolio', portfolioRouter)

  // Price endpoint (shortcut on portfolio router)
  app.get('/api/v1/price/btc', async (_req, res) => {
    try {
      const { getBtcUsdPrice } = await import('./services/pyth/priceFeeds.js')
      const price = await getBtcUsdPrice()
      res.json({ success: true, data: price })
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message })
    }
  })

  // 404 + error handlers
  app.use(notFound)
  app.use(errorHandler)

  return app
}
