import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { query } from './db/client'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const scrapeQueue = new Queue('scrape-queue', { connection })
export const normalizeQueue = new Queue('normalize-queue', { connection })
export const diffQueue = new Queue('diff-queue', { connection })
export const alertQueue = new Queue('alert-queue', { connection })
export const billingQueue = new Queue('billing-queue', { connection })
export const crmAlertQueue = new Queue('crm-alert-queue', { connection })

const SCHEDULES = {
  trackedCompetitors: '0 */4 * * *',
  blockedCompetitors: '0 0 * * *',
  discoveryScans: '0 9 * * 1',
  robotsRecheck: '0 3 * * 0',
  stripeUsageReport: '0 23 28-31 * *',
}

export async function startScheduler() {
  // Remove existing repeatable jobs and re-add
  await scrapeQueue.obliterate({ force: true }).catch(() => {})

  // Every 4 hours: scrape active tracked competitors
  await scrapeQueue.add(
    'scrape-tracked',
    { type: 'tracked' },
    {
      repeat: { pattern: SCHEDULES.trackedCompetitors },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  )

  // Daily: scrape blocked competitors
  await scrapeQueue.add(
    'scrape-blocked',
    { type: 'blocked' },
    {
      repeat: { pattern: SCHEDULES.blockedCompetitors },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  )

  // Hourly: check for expired grace periods and deactivate slots
  await billingQueue.add(
    'grace-period-expiry',
    { type: 'grace-period-expiry' },
    {
      repeat: { pattern: '0 * * * *' },
      removeOnComplete: 10,
      removeOnFail: 20,
    }
  )

  // End of billing period: reconcile Stripe subscription quantity against DB
  await billingQueue.add(
    'stripe-usage-sync',
    { type: 'stripe-usage-sync' },
    {
      repeat: { pattern: SCHEDULES.stripeUsageReport },
      removeOnComplete: 10,
      removeOnFail: 20,
    }
  )

  console.log('CannaSpy scheduler started')
}

export async function enqueueScrapeJob(competitorId: string, trigger: 'scheduled' | 'manual' | 'discovery' = 'scheduled') {
  const job = await scrapeQueue.add(
    'scrape-competitor',
    { competitorId, trigger },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30000 },
      removeOnComplete: 200,
      removeOnFail: 100,
    }
  )
  return job.id
}
