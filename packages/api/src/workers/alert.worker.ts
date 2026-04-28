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

    // Get org contact email for delivery
    const orgResult = await query<{ name: string; contact_email: string | null }>(
      'SELECT name, contact_email FROM organizations WHERE id = $1',
      [alert.org_id]
    )
    const orgName = orgResult.rows[0]?.name ?? alert.org_id
    const contactEmail = orgResult.rows[0]?.contact_email

    if (!contactEmail) {
      console.warn(`[alert.worker] No contact_email for org ${alert.org_id} — skipping alert ${alertId}`)
      return
    }

    // Check if any pref allows realtime delivery for this alert type
    const shouldSend = prefs.rows.length === 0
      ? true // no prefs configured — default to sending
      : prefs.rows.some((pref) =>
          pref.email_enabled &&
          pref.digest_frequency === 'realtime' &&
          (pref.alert_types.length === 0 || pref.alert_types.includes(alert.alert_type))
        )

    if (!shouldSend) {
      console.log(`[alert.worker] Alert ${alertId} suppressed by notification prefs for org ${alert.org_id}`)
      return
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [contactEmail],
      subject: `CannaSpy Alert: ${message}`,
      text: [
        `Hi ${orgName},`,
        '',
        message,
        '',
        'Log in to review: https://app.cannaspy.com/alerts',
      ].join('\n'),
    })

    console.log(`[alert.worker] Alert ${alertId} sent to ${contactEmail} — ${message}`)
  },
  { connection, concurrency: 10 }
)
