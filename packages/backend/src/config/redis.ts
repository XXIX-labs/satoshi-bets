import Redis from 'ioredis'
import { env } from './env.js'

let redisClient: Redis | null = null

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 5) return null
        return Math.min(times * 200, 2000)
      },
    })

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message)
    })
  }
  return redisClient
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
