import { getRedis } from '../../config/redis.js'

export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis()
    const raw = await redis.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = getRedis()
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  },

  async del(key: string): Promise<void> {
    const redis = getRedis()
    await redis.del(key)
  },

  async exists(key: string): Promise<boolean> {
    const redis = getRedis()
    return (await redis.exists(key)) === 1
  },

  async lpush(key: string, ...values: string[]): Promise<number> {
    const redis = getRedis()
    return redis.lpush(key, ...values)
  },

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const redis = getRedis()
    return redis.lrange(key, start, stop)
  },

  async incr(key: string): Promise<number> {
    const redis = getRedis()
    return redis.incr(key)
  },
}
