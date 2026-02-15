import rateLimit from 'express-rate-limit'

export const defaultLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please slow down.' },
})

export const researchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // AI calls are expensive
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI research rate limit exceeded. Please wait a moment.' },
})

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Admin rate limit exceeded.' },
})
