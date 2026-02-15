import pino from 'pino'
import { pinoHttp } from 'pino-http'
import { env } from '../config/env.js'

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export const httpLogger = pinoHttp({
  logger,
  redact: ['req.headers.authorization', 'req.headers["x-api-key"]'],
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
})
