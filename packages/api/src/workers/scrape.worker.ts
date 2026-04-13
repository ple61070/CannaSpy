import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { spawn } from 'child_process'
import path from 'path'
import { query } from '../db/client'
import { normalizeQueue } from '../scheduler'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const COLLECTOR_PATH = path.resolve(__dirname, '../../../scraper/collector.py')
const SCRAPER_PATH = path.resolve(__dirname, '../../../scraper/dispensary_scraper.py')

interface ScrapeJobData {
  competitorId?: string
  type?: 'tracked' | 'blocked'
  trigger?: 'scheduled' | 'manual' | 'discovery'
}

interface ScrapeResult {
  competitor_id: string
  pipeline: 'primary' | 'fallback'
  prices: Array<{
    raw_name: string
    price: number
    in_stock: boolean
    on_promo: boolean
    promo_text?: string
    source_url?: string
  }>
  promotions: Array<{
    promo_text: string
    promo_type?: string
    category?: string
    source_url?: string
  }>
}

function spawnProcess(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('python3', args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 1 })
    })
  })
}

async function runScraper(competitorId: string, slug: string | null): Promise<ScrapeResult> {
  // Attempt primary pipeline if slug exists
  if (slug) {
    const primaryResult = await spawnProcess([
      COLLECTOR_PATH,
      '--slug', slug,
      '--competitor-id', competitorId,
      '--output', 'json',
    ])

    if (primaryResult.code === 0) {
      try {
        const parsed = JSON.parse(primaryResult.stdout)
        return { ...parsed, pipeline: 'primary' }
      } catch {
        console.warn(`[scrape.worker] Primary pipeline JSON parse failed for ${competitorId} — falling back`)
      }
    } else {
      console.warn(`[scrape.worker] Primary pipeline exited ${primaryResult.code} for slug ${slug} — falling back. stderr: ${primaryResult.stderr.slice(0, 300)}`)
    }
  } else {
    console.info(`[scrape.worker] No slug for competitor ${competitorId} — using fallback directly`)
  }

  // Fallback scraper
  const fallbackResult = await spawnProcess([
    SCRAPER_PATH,
    '--competitor-id', competitorId,
    '--output', 'json',
  ])

  if (fallbackResult.code === 0) {
    try {
      const parsed = JSON.parse(fallbackResult.stdout)
      return { ...parsed, pipeline: 'fallback' }
    } catch {
      throw new Error(`Failed to parse fallback scraper output: ${fallbackResult.stdout.slice(0, 200)}`)
    }
  } else {
    throw new Error(`Fallback scraper exited with code ${fallbackResult.code}: ${fallbackResult.stderr.slice(0, 500)}`)
  }
}

async function processCompetitor(competitorId: string, trigger: string, jobId: string) {
  // Check robots_ok and fetch slug in one query
  const competitor = await query<{ robots_ok: boolean | null; slug: string | null }>(
    'SELECT robots_ok, slug FROM competitors WHERE id = $1',
    [competitorId]
  )

  if (competitor.rows[0]?.robots_ok === false) {
    console.log(`Skipping ${competitorId} — robots.txt disallows scraping`)
    return
  }

  const slug = competitor.rows[0]?.slug ?? null

  // Write scrape_jobs row
  const scrapeJob = await query<{ id: string }>(
    `INSERT INTO scrape_jobs (competitor_id, bullmq_job_id, status, trigger, started_at)
     VALUES ($1, $2, 'running', $3, NOW())
     RETURNING id`,
    [competitorId, jobId, trigger]
  )
  const scrapeJobId = scrapeJob.rows[0].id

  try {
    const result = await runScraper(competitorId, slug)

    // Write price_observations
    let recordsWritten = 0
    const rawNames: string[] = []

    for (const price of result.prices) {
      await query(
        `INSERT INTO price_observations
           (competitor_id, raw_name, price, in_stock, on_promo, promo_text, source_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [competitorId, price.raw_name, price.price, price.in_stock, price.on_promo, price.promo_text ?? null, price.source_url ?? null]
      )
      rawNames.push(price.raw_name)
      recordsWritten++
    }

    // Write promotions
    for (const promo of result.promotions) {
      await query(
        `INSERT INTO promotions (competitor_id, promo_text, promo_type, category, source_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [competitorId, promo.promo_text, promo.promo_type ?? null, promo.category ?? null, promo.source_url ?? null]
      )
    }

    // Update competitor last_scraped
    await query('UPDATE competitors SET last_scraped = NOW() WHERE id = $1', [competitorId])

    // Update scrape job as completed
    await query(
      `UPDATE scrape_jobs SET status = 'completed', completed_at = NOW(), records_written = $1
       WHERE id = $2`,
      [recordsWritten, scrapeJobId]
    )

    console.info(`[scrape.worker] ${competitorId} — ${recordsWritten} records via ${result.pipeline} pipeline`)

    // Enqueue normalization for new raw names
    if (rawNames.length > 0) {
      await normalizeQueue.add('normalize', { competitorId, rawNames }, {
        removeOnComplete: 100,
        removeOnFail: 50,
      })
    }

  } catch (err: any) {
    await query(
      `UPDATE scrape_jobs SET status = 'failed', completed_at = NOW(), error_message = $1
       WHERE id = $2`,
      [err.message, scrapeJobId]
    )
    throw err
  }
}

export const scrapeWorker = new Worker<ScrapeJobData>(
  'scrape-queue',
  async (job: Job<ScrapeJobData>) => {
    const { competitorId, type, trigger = 'scheduled' } = job.data

    if (competitorId) {
      await processCompetitor(competitorId, trigger, job.id || '')
      return
    }

    // Bulk jobs: fetch all relevant competitors
    const slotType = type === 'blocked' ? 'block' : 'track'
    const competitors = await query<{ competitor_id: string }>(
      `SELECT DISTINCT competitor_id
       FROM tracked_competitors
       WHERE slot_type = $1 AND active = TRUE`,
      [slotType]
    )

    for (const row of competitors.rows) {
      await processCompetitor(row.competitor_id, 'scheduled', job.id || '')
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

scrapeWorker.on('failed', (job, err) => {
  console.error(`Scrape job ${job?.id} failed:`, err.message)
})
