import { timingSafeEqual, createHash } from 'crypto'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'

function safeCompare(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function requireAdminKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!apiKey || !safeCompare(apiKey, env.ADMIN_API_KEY)) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  next()
}
