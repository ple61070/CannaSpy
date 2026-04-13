/**
 * billing.worker.ts — BullMQ worker for billing maintenance jobs
 *
 * Handles two recurring jobs:
 *   1. grace-period-expiry — deactivates slots for orgs past their 72h grace period
 *   2. stripe-usage-sync — reconciles DB slot count against Stripe subscription quantity
 *
 * Both fire on the billing-queue. Started automatically when imported in index.ts.
 */
import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import Stripe from 'stripe'
import { query } from '../db/client'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

interface BillingJobData {
  type: 'grace-period-expiry' | 'stripe-usage-sync'
}

// ----------------------------------------------------------------
// Grace period expiry
// Runs hourly. Finds orgs whose 72h post-payment-failure window has
// closed and deactivates all their active slots.
// Does NOT fire sales alerts — this is payment failure, not voluntary cancel.
// ----------------------------------------------------------------
async function handleGracePeriodExpiry(): Promise<void> {
  const expired = await query<{ id: string }>(
    `SELECT id FROM organizations
     WHERE grace_period_ends_at IS NOT NULL
       AND grace_period_ends_at < NOW()`
  )

  if (expired.rows.length === 0) return

  for (const org of expired.rows) {
    const deactivated = await query<{ id: string }>(
      `UPDATE tracked_competitors SET active = FALSE
       WHERE location_id IN (SELECT id FROM locations WHERE org_id = $1)
         AND active = TRUE
       RETURNING id`,
      [org.id]
    )

    await query(
      `UPDATE block_list SET active = FALSE, unblocked_at = NOW()
       WHERE org_id = $1 AND active = TRUE`,
      [org.id]
    )

    await query(
      `UPDATE organizations SET grace_period_ends_at = NULL WHERE id = $1`,
      [org.id]
    )

    await query(
      `INSERT INTO audit_log (org_id, action, entity_type, metadata)
       VALUES ($1, 'grace_period_expired', 'organization', $2::jsonb)`,
      [org.id, JSON.stringify({ slots_deactivated: deactivated.rowCount ?? 0 })]
    )

    console.info(
      `[billing.worker] Grace expired for org ${org.id} — ${deactivated.rowCount ?? 0} slots deactivated`
    )
  }
}

// ----------------------------------------------------------------
// Stripe usage sync
// Runs on days 28-31 at 23:00 (end of billing period).
// Reconciles DB active slot count against Stripe subscription quantity.
// Catches any drift from failed real-time updates.
// ----------------------------------------------------------------
async function handleStripeUsageSync(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[billing.worker] STRIPE_SECRET_KEY not set — skipping usage sync')
    return
  }

  const orgs = await query<{ id: string; stripe_subscription_id: string }>(
    `SELECT id, stripe_subscription_id FROM organizations
     WHERE stripe_subscription_id IS NOT NULL`
  )

  for (const org of orgs.rows) {
    try {
      const slotResult = await query<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM tracked_competitors tc
         JOIN locations l ON l.id = tc.location_id
         WHERE l.org_id = $1 AND tc.active = TRUE`,
        [org.id]
      )
      const dbCount = parseInt(slotResult.rows[0]?.count ?? '0', 10)

      const sub = await stripe.subscriptions.retrieve(org.stripe_subscription_id)
      const item = sub.items.data[0]
      if (!item) continue

      const stripeCount = item.quantity ?? 0
      if (stripeCount !== dbCount) {
        await stripe.subscriptionItems.update(item.id, { quantity: dbCount })
        console.info(
          `[billing.worker] Stripe sync org ${org.id}: ${stripeCount} → ${dbCount} slots`
        )
      }
    } catch (err) {
      console.error(`[billing.worker] Stripe sync failed for org ${org.id}:`, err)
    }
  }
}

// ----------------------------------------------------------------
// Worker
// ----------------------------------------------------------------
export const billingWorker = new Worker<BillingJobData>(
  'billing-queue',
  async (job: Job<BillingJobData>) => {
    switch (job.data.type) {
      case 'grace-period-expiry':
        await handleGracePeriodExpiry()
        break
      case 'stripe-usage-sync':
        await handleStripeUsageSync()
        break
      default:
        console.warn(`[billing.worker] Unknown job type: ${(job.data as any).type}`)
    }
  },
  { connection }
)

billingWorker.on('failed', (job, err) => {
  console.error(`[billing.worker] Job ${job?.id} (${job?.data?.type}) failed:`, err.message)
})
