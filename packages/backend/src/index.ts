import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './middleware/logger.js'
import { getRedis, closeRedis } from './config/redis.js'
import { startScheduler } from './jobs/scheduler.js'

async function main() {
  // Connect Redis eagerly so we surface connection errors at startup
  try {
    const redis = getRedis()
    await redis.connect()
    logger.info('Redis connected')
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed — cache disabled')
  }

  const app = createApp()

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, network: env.STACKS_NETWORK, env: env.NODE_ENV },
      '🚀 Satoshi Bets API started'
    )
  })

  // Start cron jobs
  startScheduler()

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...')
    server.close(async () => {
      await closeRedis()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
