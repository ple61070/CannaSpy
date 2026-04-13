import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { query } from '../db/client'
import { alertQueue } from '../scheduler'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

interface DiffJobData {
  competitorId: string
  detectedAt: string
}

export const diffWorker = new Worker<DiffJobData>(
  'diff-queue',
  async (job: Job<DiffJobData>) => {
    const { competitorId, detectedAt } = job.data

    // Get current observations from this run
    const current = await query<{
      product_id: string
      price: number
      in_stock: boolean
      on_promo: boolean
      canonical_name: string
      detected_at: string
    }>(
      `SELECT DISTINCT ON (product_id)
         product_id, price, in_stock, on_promo, detected_at
       FROM price_observations
       WHERE competitor_id = $1
         AND detected_at >= $2::TIMESTAMPTZ - INTERVAL '10 minutes'
         AND product_id IS NOT NULL
       ORDER BY product_id, detected_at DESC`,
      [competitorId, detectedAt]
    )

    // Get previous observations (before this run)
    const previous = await query<{
      product_id: string
      price: number
      in_stock: boolean
      on_promo: boolean
    }>(
      `SELECT DISTINCT ON (product_id)
         product_id, price, in_stock, on_promo
       FROM price_observations
       WHERE competitor_id = $1
         AND detected_at < $2::TIMESTAMPTZ - INTERVAL '10 minutes'
         AND product_id IS NOT NULL
       ORDER BY product_id, detected_at DESC`,
      [competitorId, detectedAt]
    )

    const prevMap = new Map(previous.rows.map((r) => [r.product_id, r]))

    // Get orgs that track this competitor
    const orgs = await query<{ org_id: string; location_id: string }>(
      `SELECT l.org_id, tc.location_id
       FROM tracked_competitors tc
       JOIN locations l ON l.id = tc.location_id
       WHERE tc.competitor_id = $1 AND tc.active = TRUE`,
      [competitorId]
    )

    const alerts: Array<{
      org_id: string
      location_id: string
      alert_type: string
      entity_id: string | null
      old_value: string | null
      new_value: string | null
    }> = []

    for (const obs of current.rows) {
      const prev = prevMap.get(obs.product_id)

      if (!prev) {
        // New SKU
        for (const org of orgs.rows) {
          alerts.push({
            org_id: org.org_id,
            location_id: org.location_id,
            alert_type: 'new_sku',
            entity_id: obs.product_id,
            old_value: null,
            new_value: String(obs.price),
          })
        }
        continue
      }

      const priceDiff = Math.abs(obs.price - prev.price) / prev.price * 100

      if (priceDiff >= 5) {
        const alertType = obs.price < prev.price ? 'price_drop' : 'price_increase'
        for (const org of orgs.rows) {
          alerts.push({
            org_id: org.org_id,
            location_id: org.location_id,
            alert_type: alertType,
            entity_id: obs.product_id,
            old_value: String(prev.price),
            new_value: String(obs.price),
          })
        }
      }

      if (obs.on_promo !== prev.on_promo) {
        const alertType = obs.on_promo ? 'new_promo' : 'promo_ended'
        for (const org of orgs.rows) {
          alerts.push({
            org_id: org.org_id,
            location_id: org.location_id,
            alert_type: alertType,
            entity_id: obs.product_id,
            old_value: prev.on_promo ? 'on_promo' : null,
            new_value: obs.on_promo ? 'on_promo' : null,
          })
        }
      }
    }

    // Write all alerts
    for (const alert of alerts) {
      const result = await query<{ id: string }>(
        `INSERT INTO alerts (org_id, location_id, competitor_id, alert_type, entity_id, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [alert.org_id, alert.location_id, competitorId, alert.alert_type, alert.entity_id, alert.old_value, alert.new_value]
      )

      await alertQueue.add('dispatch-alert', { alertId: result.rows[0].id }, {
        removeOnComplete: 200,
      })
    }
  },
  { connection, concurrency: 3 }
)
