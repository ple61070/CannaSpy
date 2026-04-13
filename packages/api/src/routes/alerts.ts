import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'

export async function alertsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/alerts
  fastify.get('/', async (req: FastifyRequest<{
    Querystring: {
      location_id?: string
      competitor_id?: string
      alert_type?: string
      reviewed?: string    // 'true' | 'false' (default false — show unreviewed)
      limit?: string
      offset?: string
    }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const offset = parseInt(req.query.offset || '0', 10)

    const conditions: string[] = ['a.org_id = $1']
    const params: unknown[] = [orgDbId]
    let idx = 2

    if (req.query.location_id) {
      conditions.push(`a.location_id = $${idx++}`)
      params.push(req.query.location_id)
    }
    if (req.query.competitor_id) {
      conditions.push(`a.competitor_id = $${idx++}`)
      params.push(req.query.competitor_id)
    }
    if (req.query.alert_type) {
      conditions.push(`a.alert_type = $${idx++}`)
      params.push(req.query.alert_type)
    }

    // reviewed defaults to false (show only unreviewed)
    const reviewedParam = req.query.reviewed
    if (reviewedParam === 'true') {
      conditions.push('a.reviewed = TRUE')
    } else if (!reviewedParam || reviewedParam === 'false') {
      conditions.push('a.reviewed = FALSE')
    }
    // If reviewedParam is some other value, show all (no filter)

    params.push(limit, offset)

    const result = await query(
      `SELECT
         a.id, a.alert_type, a.old_value, a.new_value, a.confidence,
         a.reviewed, a.reviewed_by, a.reviewed_at, a.created_at,
         c.name as competitor_name, c.address as competitor_address,
         l.name as location_name
       FROM alerts a
       LEFT JOIN competitors c ON c.id = a.competitor_id
       LEFT JOIN locations l ON l.id = a.location_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    )

    return { success: true, data: { alerts: result.rows, total: result.rowCount, limit, offset } }
  })

  // PATCH /api/v1/alerts/:id/reviewed
  fastify.patch('/:id/reviewed', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const existing = await query(
      'SELECT id FROM alerts WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )

    if (!existing.rows.length) {
      return reply.code(404).send({ error: 'Alert not found', code: 'ALERT_NOT_FOUND' })
    }

    const result = await query(
      `UPDATE alerts SET reviewed = TRUE, reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2
       RETURNING id, alert_type, reviewed, reviewed_by, reviewed_at, created_at`,
      [req.auth!.userId, req.params.id]
    )

    return { success: true, data: result.rows[0] }
  })
}
