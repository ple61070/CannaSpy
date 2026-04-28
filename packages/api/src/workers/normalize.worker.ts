import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'
import { query } from '../db/client'
import { redisCache as redis } from '../db/redis'
import { diffQueue } from '../scheduler'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BATCH_SIZE = 20
const CACHE_TTL = 60 * 60 * 24 * 30 // 30 days in seconds

interface NormalizeJobData {
  competitorId: string
  rawNames: string[]
}

interface NormalizedProduct {
  canonical_name: string
  brand: string | null
  category: string
  package_size: string | null
  confidence: 'high' | 'medium' | 'low'
  ambiguous: boolean
}

async function normalizeWithClaude(rawNames: string[]): Promise<Record<string, NormalizedProduct>> {
  const cacheKey = `normalize:${crypto.createHash('sha256').update(rawNames.sort().join('|')).digest('hex')}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  const NORMALIZATION_PROMPT = `You are normalizing cannabis product names across dispensary menus.

Given these raw product names from different dispensaries, identify which refer to the same product and return a canonical name + confidence score.

Rules:
- Same brand + strain + package size = same product (high confidence)
- Same brand + strain, different size = different products
- Abbreviations like "BD" for "Blue Dream" are acceptable matches
- If you cannot determine equivalency with >70% confidence, flag as ambiguous

Return a JSON object where each key is the input raw name and the value has this schema:
{
  "canonical_name": string,
  "brand": string | null,
  "category": "flower"|"edible"|"concentrate"|"vape"|"preroll"|"topical",
  "package_size": string | null,
  "confidence": "high" | "medium" | "low",
  "ambiguous": boolean
}

Raw product names:
${rawNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: NORMALIZATION_PROMPT }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude did not return valid JSON')

  const result = JSON.parse(jsonMatch[0])

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))

  return result
}

export const normalizeWorker = new Worker<NormalizeJobData>(
  'normalize-queue',
  async (job: Job<NormalizeJobData>) => {
    const { competitorId, rawNames } = job.data

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < rawNames.length; i += BATCH_SIZE) {
      const batch = rawNames.slice(i, i + BATCH_SIZE)
      const normalized = await normalizeWithClaude(batch)

      for (const [rawName, product] of Object.entries(normalized)) {
        if (product.ambiguous || product.confidence === 'low') continue

        // Upsert product
        const productResult = await query<{ id: string }>(
          `INSERT INTO products (canonical_name, brand, category, package_size)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (canonical_name) DO UPDATE
             SET brand = EXCLUDED.brand,
                 category = EXCLUDED.category,
                 package_size = EXCLUDED.package_size
           RETURNING id`,
          [product.canonical_name, product.brand, product.category, product.package_size]
        )

        // Update price_observations with product_id
        await query(
          `UPDATE price_observations
           SET product_id = $1, confidence = $2
           WHERE competitor_id = $3 AND raw_name = $4 AND product_id IS NULL`,
          [productResult.rows[0].id, product.confidence, competitorId, rawName]
        )
      }
    }

    // Enqueue diff job
    await diffQueue.add('diff', { competitorId, detectedAt: new Date().toISOString() }, {
      removeOnComplete: 100,
    })
  },
  { connection, concurrency: 2 }
)
