import * as Sentry from '@sentry/node'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })
}

// Workers started after server is ready (see bootstrap())
// Deferred to avoid crashing startup if Redis is unavailable

import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { clerkPlugin, getAuth } from '@clerk/fastify'
import { organizationsRoutes } from './routes/organizations'
import { locationsRoutes } from './routes/locations'
import { competitorsRoutes } from './routes/competitors'
import { blocksRoutes } from './routes/blocks'
import { pricingRoutes } from './routes/pricing'
import { alertsRoutes } from './routes/alerts'
import { billingRoutes } from './routes/billing'
import { billingWebhookRoute } from './routes/billing.webhook'
import { settingsRoutes } from './routes/settings'
import { adminRoutes } from './routes/admin'
import { clerkAuthPreHandler } from './middleware/clerk'
import { startScheduler } from './scheduler'

const PORT = parseInt(process.env.PORT || process.env.API_PORT || '3001', 10)

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// Tolerate empty JSON bodies on POST routes (e.g. POST /billing/portal sent
// from the frontend with `Content-Type: application/json` but no payload).
// Without this, Fastify's default parser throws FST_ERR_CTP_EMPTY_JSON_BODY
// before the route handler runs, returning 500 + Sentry noise.
fastify.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_req, body, done) => {
    const raw = (body as string | Buffer | undefined)?.toString?.() ?? ''
    if (raw.trim() === '') {
      done(null, {})
      return
    }
    try {
      done(null, JSON.parse(raw))
    } catch (err) {
      done(err as Error, undefined)
    }
  }
)

async function bootstrap() {
  await fastify.register(cors, {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  })

  await fastify.register(clerkPlugin)

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      try {
        const auth = getAuth(req as any)
        return auth?.orgId || req.ip
      } catch {
        return req.ip
      }
    },
  })

  // Global error handler — captures unhandled route errors to Sentry
  fastify.setErrorHandler((error, _request, reply) => {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error)
    }
    fastify.log.error(error)
    reply.code(500).send({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' })
  })

  // Health check (no auth)
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Stripe webhook — NO Clerk auth, raw body required for signature verification
  fastify.register(billingWebhookRoute, { prefix: '/api/v1/billing' })

  // API v1 routes — all require Clerk org auth via preHandler
  fastify.register(async (instance) => {
    instance.addHook('preHandler', clerkAuthPreHandler)
    instance.register(organizationsRoutes, { prefix: '/api/v1/organizations' })
    instance.register(locationsRoutes, { prefix: '/api/v1/locations' })
    instance.register(competitorsRoutes, { prefix: '/api/v1/competitors' })
    instance.register(blocksRoutes, { prefix: '/api/v1/blocks' })
    instance.register(pricingRoutes, { prefix: '/api/v1/prices' })
    instance.register(alertsRoutes, { prefix: '/api/v1/alerts' })
    instance.register(billingRoutes, { prefix: '/api/v1/billing' })
    instance.register(settingsRoutes, { prefix: '/api/v1/settings' })
    instance.register(adminRoutes, { prefix: '/api/v1/admin' })
  })

  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  fastify.log.info(`CannaSpy API running on port ${PORT}`)

  if (process.env.NODE_ENV !== 'test') {
    try {
      await startScheduler()
    } catch (err) {
      fastify.log.error({ err }, 'Scheduler failed to start — continuing without it')
    }
    try {
      await import('./workers/billing.worker')
    } catch (err) {
      fastify.log.error({ err }, 'Billing worker failed to start — continuing without it')
    }
    try {
      await import('./workers/crm.worker')
    } catch (err) {
      fastify.log.error({ err }, 'CRM alert worker failed to start — continuing without it')
    }
    try {
      await import('./workers/scrape.worker')
    } catch (err) {
      fastify.log.error({ err }, 'Scrape worker failed to start — continuing without it')
    }
    try {
      await import('./workers/normalize.worker')
    } catch (err) {
      fastify.log.error({ err }, 'Normalize worker failed to start — continuing without it')
    }
    try {
      await import('./workers/diff.worker')
    } catch (err) {
      fastify.log.error({ err }, 'Diff worker failed to start — continuing without it')
    }
    try {
      await import('./workers/alert.worker')
    } catch (err) {
      fastify.log.error({ err }, 'Alert worker failed to start — continuing without it')
    }
  }
}

bootstrap().catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})
