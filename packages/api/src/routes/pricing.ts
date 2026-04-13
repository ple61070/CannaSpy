import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'

export async function pricingRoutes(fastify: FastifyInstance) {
  // GET /api/v1/prices/matrix?location_id=&category=
  fastify.get('/matrix', async (req: FastifyRequest<{
    Querystring: { location_id?: string; category?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const { location_id, category } = req.query

    if (!location_id) {
      return reply.code(400).send({ error: 'location_id is required', code: 'MISSING_PARAM' })
    }

    // Verify location belongs to org
    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [location_id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    // Query menu_items (written by collector.py) for competitors linked to this location.
    // No active=TRUE requirement — seeded competitors may be inactive prospects but still have real data.
    const params: unknown[] = [location_id]
    let categoryFilter = ''
    if (category) {
      params.push(category)
      categoryFilter = `AND mi.category = $${params.length}`
    }

    const result = await query(
      `SELECT DISTINCT ON (mi.competitor_id, mi.name)
         mi.competitor_id,
         mi.name        AS raw_name,
         mi.price,
         mi.on_sale,
         mi.discount_label,
         mi.category,
         mi.collected_at AS last_updated,
         c.name          AS competitor_name
       FROM menu_items mi
       JOIN competitors c ON c.id = mi.competitor_id
       WHERE mi.competitor_id IN (
         SELECT tc.competitor_id
         FROM tracked_competitors tc
         WHERE tc.location_id = $1
       )
         AND mi.price IS NOT NULL
         AND mi.price > 0
         ${categoryFilter}
       ORDER BY mi.competitor_id, mi.name, mi.collected_at DESC
       LIMIT 500`,
      params
    )

    return { success: true, data: { matrix: result.rows, total: result.rowCount } }
  })

  // GET /api/v1/prices/history?competitor_id=&days=30
  fastify.get('/history', async (req: FastifyRequest<{
    Querystring: { competitor_id?: string; days?: string; product_id?: string }
  }>, reply: FastifyReply) => {
    const { competitor_id, product_id } = req.query
    const days = Math.min(parseInt(req.query.days || '30', 10), 90)

    if (!competitor_id) {
      return reply.code(400).send({ error: 'competitor_id is required', code: 'MISSING_PARAM' })
    }

    const productFilter = product_id ? 'AND po.product_id = $3' : ''
    const params: unknown[] = [competitor_id, String(days)]
    if (product_id) params.push(product_id)

    const result = await query(
      `SELECT po.raw_name, po.price, po.on_promo, po.promo_text,
              po.detected_at::date as date, po.detected_at
       FROM price_observations po
       WHERE po.competitor_id = $1
         AND po.detected_at > NOW() - ($2 || ' days')::interval
         ${productFilter}
       ORDER BY po.detected_at DESC
       LIMIT 500`,
      params
    )

    // Group by raw_name for frontend convenience
    const grouped: Record<string, unknown[]> = {}
    for (const row of result.rows as Array<Record<string, unknown>>) {
      const name = row.raw_name as string
      if (!grouped[name]) grouped[name] = []
      grouped[name].push(row)
    }

    return { success: true, data: { history: grouped, total: result.rowCount } }
  })
}
