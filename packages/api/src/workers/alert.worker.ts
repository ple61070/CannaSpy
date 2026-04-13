import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { Resend } from 'resend'
import { query } from '../db/client'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const resend = new Resend(process.env.RESEND_API_KEY)

interface AlertJobData {
  alertId: string
}

function formatAlertMessage(alertType: string, competitorName: string, oldValue: string | null, newValue: string | null): string {
  switch (alertType) {
    case 'price_drop':
      return `${competitorName} dropped a price from $${oldValue} to $${newValue}`
    case 'price_increase':
      return `${competitorName} raised a price from $${oldValue} to $${newValue}`
    case 'new_promo':
      return `${competitorName} launched a new promotion`
    case 'promo_ended':
      return `${competitorName} ended a promotion`
    case 'new_sku':
      return `${competitorName} added a new product`
    case 'sku_removed':
      return `${competitorName} removed a product`
    case 'new_competitor':
      return `New competitor detected: ${competitorName}`
    default:
      return `${competitorName} had a change detected`
  }
}

export const alertWorker = new Worker<AlertJobData>(
  'alert-queue',
  async (job: Job<AlertJobData>) => {
    const { alertId } = job.data

    const alertResult = await query<{
      id: string
      org_id: string
      alert_type: string
      old_value: string | null
      new_value: string | null
      competitor_name: string
      location_id: string
    }>(
      `SELECT a.id, a.org_id, a.alert_type, a.old_value, a.new_value,
              c.name as competitor_name, a.location_id
       FROM alerts a
       LEFT JOIN competitors c ON c.id = a.competitor_id
       WHERE a.id = $1`,
      [alertId]
    )

    if (!alertResult.rows.length) return

    const alert = alertResult.rows[0]

    // Get notification preferences for this org
    const prefs = await query<{
      user_id: string | null
      email_enabled: boolean
      digest_frequency: string
      alert_types: string[]
      quiet_hours_start: string | null
      quiet_hours_end: string | null
    }>(
      `SELECT user_id, email_enabled, digest_frequency, alert_types,
              quiet_hours_start, quiet_hours_end
       FROM notification_preferences
       WHERE org_id = $1 AND (location_id = $2 OR location_id IS NULL)`,
      [alert.org_id, alert.location_id]
    )

    const message = formatAlertMessage(
      alert.alert_type,
      alert.competitor_name,
      alert.old_value,
      alert.new_value
    )

    for (const pref of prefs.rows) {
      if (!pref.alert_types.includes(alert.alert_type)) continue
      if (pref.digest_frequency !== 'realtime') continue
      if (!pref.email_enabled) continue

      // In production: send via Resend to user's email
      // For now: log the dispatch
      console.log(`Alert dispatch: ${message} → org ${alert.org_id}`)
    }
  },
  { connection, concurrency: 10 }
)
