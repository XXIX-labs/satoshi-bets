import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express'
import { logger } from './logger.js'

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ err }, 'Unhandled error')
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: 'Route not found' })
}
