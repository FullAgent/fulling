// lib/logger.ts
import pino from 'pino'

const isProd = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      '*.accessToken',
      '*.clientCertificateData',
      '*.clientKeyData',
      '*.content',
      '*.idToken',
      '*.password',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
})
