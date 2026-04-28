/**
 * crm.worker.ts — BullMQ worker for sales CRM alert delivery
 *
 * Consumes crm-alert-queue. Enqueued by cancelBlock() in blocking.service.ts
 * whenever a customer cancels a block. Delivers the Resend email with
 * at-least-once semantics: 3 attempts, exponential backoff (30s / 60s / 120s).
 *
 * On final failure: sets block_list.crm_notify_failed = TRUE and captures
 * to Sentry so the ops team can investigate and manually follow up.
 *
 * SALES_ALERT_EMAIL guard: if the env var is not set, the job is treated as a
 * successful no-op (returns without throwing) — no retry, nothing to send to.
 */
import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import * as Sentry from '@sentry/node'
import { Resend } from 'resend'
import { query } from '../db/client'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export interface CrmAlertJobData {
  blockId: string
  orgId: string
  competitorId: string
}

export const crmWorker = new Worker<CrmAlertJobData>(
  'crm-alert-queue',
  async (job: Job<CrmAlertJobData>) => {
    const { blockId, orgId, competitorId } = job.data

    const salesEmail = process.env.SALES_ALERT_EMAIL
    if (!salesEmail) {
      // No destination configured — treat as successful no-op, do not retry.
      return
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const [orgResult, competitorResult] = await Promise.all([
      query<{ name: string }>('SELECT name FROM organizations WHERE id = $1', [orgId]),
      query<{ name: string; address: string }>('SELECT name, address FROM competitors WHERE id = $1', [competitorId]),
    ])

    const orgName = orgResult.rows[0]?.name ?? orgId
    const competitorName = competitorResult.rows[0]?.name ?? competitorId
    const city = competitorResult.rows[0]?.address?.split(',')[1]?.trim() ?? ''
    const cancelledAt = new Date().toUTCString()

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [salesEmail],
      subject: `Block released — ${competitorName} is now eligible for outreach`,
      text: [
        `${orgName} just cancelled their block on ${competitorName}${city ? ` (${city})` : ''}.`,
        '',
        `They're back on the prospect list. Follow up within 24-48 hours.`,
        '',
        `Block ID: ${blockId}`,
        `Cancelled at: ${cancelledAt}`,
      ].join('\n'),
    })

    await query(
      'UPDATE block_list SET crm_notified_at = NOW() WHERE id = $1',
      [blockId]
    )
  },
  { connection }
)

crmWorker.on('failed', async (job: Job<CrmAlertJobData> | undefined, err: Error) => {
  if (!job) return

  const { blockId, orgId, competitorId } = job.data

  await query(
    'UPDATE block_list SET crm_notify_failed = TRUE WHERE id = $1',
    [blockId]
  ).catch((dbErr) =>
    console.error('[crm.worker] Failed to set crm_notify_failed for block', blockId, dbErr)
  )

  Sentry.captureException(err, {
    extra: {
      blockId,
      orgId,
      competitorId,
      jobId: job.id,
      attemptsMade: job.attemptsMade,
    },
  })

  console.error(`[crm.worker] CRM alert exhausted all retries for block ${blockId}:`, err.message)
})
