import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import { z } from 'zod'

const CreateCompetitorSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  website_url: z.string().url().optional(),
  platform: z.enum(['dutchie', 'custom', 'unknown']).optional(),
  google_place_id: z.string().optional(),
  dcc_license: z.string().optional(),
  business_type: z.enum(['storefront', 'delivery', 'both']).optional(),
})

export async function competitorsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/competitors/:id
  fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await query(
      `SELECT id, name, address, lat, lng, website_url, platform, google_place_id,
              dcc_license, business_type, robots_ok, last_scraped, created_at
       FROM competitors WHERE id = $1`,
      [req.params.id]
    )

    if (!result.rows.length) {
      return reply.code(404).send({ error: 'Competitor not found', code: 'COMPETITOR_NOT_FOUND' })
    }

    return result.rows[0]
  })

  // POST /api/v1/competitors — add a new competitor to the global pool
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateCompetitorSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    const { name, address, lat, lng, website_url, platform, google_place_id, dcc_license, business_type } = parsed.data

    const result = await query<{ id: string }>(
      `INSERT INTO competitors (name, address, lat, lng, website_url, platform, google_place_id, dcc_license, business_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [name, address, lat ?? null, lng ?? null, website_url ?? null, platform ?? 'unknown', google_place_id ?? null, dcc_license ?? null, business_type ?? 'storefront']
    )

    return reply.code(201).send({ id: result.rows[0].id })
  })

  // GET /api/v1/competitors/:id/prices — price history
  fastify.get('/:id/prices', async (req: FastifyRequest<{
    Params: { id: string }
    Querystring: { days?: string }
  }>, reply: FastifyReply) => {
    const days = Math.min(parseInt(req.query.days || '30', 10), 90)

    const result = await query(
      `SELECT po.raw_name, po.price, po.on_promo, po.promo_text,
              po.detected_at::date as date, po.detected_at
       FROM price_observations po
       WHERE po.competitor_id = $1
         AND po.detected_at > NOW() - ($2 || ' days')::interval
       ORDER BY po.detected_at DESC
       LIMIT 500`,
      [req.params.id, String(days)]
    )

    return { prices: result.rows, total: result.rowCount }
  })

  // GET /api/v1/competitors/:id/promotions — active promotions
  fastify.get('/:id/promotions', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await query(
      `SELECT * FROM promotions
       WHERE competitor_id = $1 AND active = TRUE
       ORDER BY detected_at DESC
       LIMIT 50`,
      [req.params.id]
    )

    return { promotions: result.rows, total: result.rowCount }
  })
}
