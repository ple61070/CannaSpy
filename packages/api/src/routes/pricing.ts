import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'

export async function pricingRoutes(fastify: FastifyInstance) {
  // GET /api/v1/prices/matrix?location_id=&category=
  fastify.get('/matrix', async (req: FastifyRequest<{
    Querystring: { location_id?: string; category?: string; type?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const { location_id, category, type } = req.query

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
    let typeFilter = ''
    if (type && type !== 'both') {
      params.push(type)
      typeFilter = `AND c.business_type = $${params.length}`
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
         c.name          AS competitor_name,
         c.business_type
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
         ${typeFilter}
       ORDER BY mi.competitor_id, mi.name, mi.collected_at DESC
       LIMIT 500`,
      params
    )

    return { success: true, data: { matrix: result.rows, total: result.rowCount } }
  })

  // GET /api/v1/prices/history?competitor_id=&days=30
  // Legacy endpoint — queries price_observations (populated by diff engine)
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

  // GET /api/v1/prices/products?location_id=
  // Returns distinct product names that appear across ≥2 competitors for a location.
  // Source: menu_items (populated by collector.py primary pipeline).
  fastify.get('/products', async (req: FastifyRequest<{
    Querystring: { location_id?: string; category?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const { location_id, category } = req.query
    if (!location_id) {
      return reply.code(400).send({ error: 'location_id is required', code: 'MISSING_PARAM' })
    }

    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [location_id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    const params: unknown[] = [location_id]
    let catFilter = ''
    if (category) {
      params.push(category)
      catFilter = `AND mi.category = $${params.length}`
    }

    const result = await query(
      `SELECT
         mi.name,
         mi.category,
         COUNT(DISTINCT mi.competitor_id) AS competitor_count,
         ROUND(AVG(mi.price)::numeric, 2)  AS avg_price,
         MIN(mi.price)                      AS min_price,
         MAX(mi.price)                      AS max_price
       FROM menu_items mi
       WHERE mi.competitor_id IN (
         SELECT tc.competitor_id FROM tracked_competitors tc WHERE tc.location_id = $1
       )
         AND mi.price IS NOT NULL
         AND mi.price > 0
         ${catFilter}
       GROUP BY mi.name, mi.category
       HAVING COUNT(DISTINCT mi.competitor_id) >= 2
       ORDER BY COUNT(DISTINCT mi.competitor_id) DESC, mi.name
       LIMIT 100`,
      params
    )

    return { success: true, data: { products: result.rows } }
  })

  // GET /api/v1/prices/history-by-product?location_id=&product_name=&days=90
  // Time-series price data for a specific product name across all competitors.
  // Source: menu_items (primary pipeline). Falls back gracefully if only one
  // collection run exists — returns flat lines showing current prices.
  fastify.get('/history-by-product', async (req: FastifyRequest<{
    Querystring: { location_id?: string; product_name?: string; days?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const { location_id, product_name } = req.query
    const days = Math.min(parseInt(req.query.days || '90', 10), 90)

    if (!location_id || !product_name) {
      return reply.code(400).send({ error: 'location_id and product_name are required', code: 'MISSING_PARAM' })
    }

    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [location_id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    // Fetch competitors for this location (with block status)
    const competitorRows = await query(
      `SELECT
         c.id           AS competitor_id,
         c.name         AS competitor_name,
         tc.slot_type
       FROM tracked_competitors tc
       JOIN competitors c ON c.id = tc.competitor_id
       WHERE tc.location_id = $1
       ORDER BY c.name`,
      [location_id]
    )

    // Fetch price history for the named product across those competitors.
    // Uses ILIKE for case-insensitive exact match. Group by date + competitor
    // so multiple intraday scrapes collapse to one point per day.
    const seriesRows = await query(
      `SELECT
         mi.competitor_id,
         mi.collected_at::date          AS date,
         ROUND(AVG(mi.price)::numeric, 2) AS price,
         BOOL_OR(mi.on_sale)            AS on_sale,
         MAX(mi.discount_label)         AS discount_label
       FROM menu_items mi
       WHERE mi.competitor_id = ANY(
         SELECT tc.competitor_id FROM tracked_competitors tc WHERE tc.location_id = $1
       )
         AND mi.name ILIKE $2
         AND mi.price IS NOT NULL
         AND mi.price > 0
         AND mi.collected_at > NOW() - ($3 || ' days')::interval
       GROUP BY mi.competitor_id, mi.collected_at::date
       ORDER BY mi.collected_at::date ASC`,
      [location_id, product_name, String(days)]
    )

    // Build series map: { competitor_id → [{ date, price, on_sale }] }
    type SeriesPoint = { date: string; price: number; on_sale: boolean; discount_label: string | null }
    const seriesMap: Record<string, SeriesPoint[]> = {}
    for (const row of seriesRows.rows as Array<Record<string, unknown>>) {
      const cid = row.competitor_id as string
      if (!seriesMap[cid]) seriesMap[cid] = []
      seriesMap[cid].push({
        date: String(row.date),
        price: Number(row.price),
        on_sale: Boolean(row.on_sale),
        discount_label: (row.discount_label as string) || null,
      })
    }

    return {
      success: true,
      data: {
        product_name,
        days,
        competitors: competitorRows.rows,
        series: seriesMap,
      },
    }
  })
}
