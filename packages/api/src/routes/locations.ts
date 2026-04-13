import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import { z } from 'zod'
import * as blockingService from '../services/blocking.service'
import * as billingService from '../services/billing.service'

const CreateLocationSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  dcc_license: z.string().optional(),
})

const UpdateLocationSchema = CreateLocationSchema.partial().extend({
  active: z.boolean().optional(),
})

export async function locationsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/locations
  fastify.get('/', async (req: FastifyRequest<{
    Querystring: { limit?: string; offset?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const offset = parseInt(req.query.offset || '0', 10)

    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM locations WHERE org_id = $1',
      [orgDbId]
    )
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    const result = await query(
      `SELECT id, name, address, lat, lng, dcc_license, active, created_at
       FROM locations
       WHERE org_id = $1
       ORDER BY created_at ASC
       LIMIT $2 OFFSET $3`,
      [orgDbId, limit, offset]
    )

    return { locations: result.rows, total, limit, offset }
  })

  // GET /api/v1/locations/:id
  fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const result = await query(
      `SELECT id, name, address, lat, lng, dcc_license, active, created_at
       FROM locations
       WHERE id = $1 AND org_id = $2`,
      [req.params.id, orgDbId]
    )

    if (!result.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    return result.rows[0]
  })

  // POST /api/v1/locations
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const parsed = CreateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    const { name, address, lat, lng, dcc_license } = parsed.data

    const result = await query<{ id: string }>(
      `INSERT INTO locations (org_id, name, address, lat, lng, dcc_license)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [orgDbId, name, address, lat ?? null, lng ?? null, dcc_license ?? null]
    )

    await query(
      `INSERT INTO audit_log (org_id, user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'location_created', 'location', $3)`,
      [orgDbId, req.auth!.userId, result.rows[0].id]
    )

    return reply.code(201).send({ id: result.rows[0].id })
  })

  // PATCH /api/v1/locations/:id
  fastify.patch('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const parsed = UpdateLocationSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    // Verify ownership
    const existing = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )
    if (!existing.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    const updates = parsed.data
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name) }
    if (updates.address !== undefined) { fields.push(`address = $${idx++}`); values.push(updates.address) }
    if (updates.lat !== undefined) { fields.push(`lat = $${idx++}`); values.push(updates.lat) }
    if (updates.lng !== undefined) { fields.push(`lng = $${idx++}`); values.push(updates.lng) }
    if (updates.dcc_license !== undefined) { fields.push(`dcc_license = $${idx++}`); values.push(updates.dcc_license) }
    if (updates.active !== undefined) { fields.push(`active = $${idx++}`); values.push(updates.active) }

    if (!fields.length) {
      return reply.code(400).send({ error: 'No fields to update', code: 'NO_UPDATES' })
    }

    values.push(req.params.id)
    await query(
      `UPDATE locations SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )

    return { success: true }
  })

  // GET /api/v1/locations/:id/competitors
  fastify.get('/:id/competitors', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    // Verify location belongs to org
    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    const result = await query(
      `SELECT
         tc.id as tracked_id,
         tc.slot_type,
         tc.market_tier,
         tc.price_per_slot,
         tc.active,
         tc.blocked_at,
         c.id as competitor_id,
         c.name,
         c.address,
         c.website_url,
         c.platform,
         c.last_scraped,
         c.robots_ok
       FROM tracked_competitors tc
       JOIN competitors c ON c.id = tc.competitor_id
       WHERE tc.location_id = $1 AND tc.active = TRUE
       ORDER BY tc.created_at ASC`,
      [req.params.id]
    )

    return { competitors: result.rows, total: result.rowCount }
  })

  // POST /api/v1/locations/:id/competitors
  fastify.post('/:id/competitors', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const AddCompetitorSchema = z.object({
      competitor_id: z.string().uuid(),
      slot_type: z.enum(['track', 'block']).default('track'),
    })

    const parsed = AddCompetitorSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    // Verify location belongs to org
    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    try {
      if (parsed.data.slot_type === 'block') {
        // Delegate to blocking service for full block logic
        const { blockId } = await blockingService.addBlock(
          orgDbId,
          parsed.data.competitor_id,
          req.auth!.userId,
          [req.params.id]
        )
        return reply.code(201).send({ id: blockId, slot_type: 'block' })
      }

      // Track slot — insert tracked_competitors + billing
      const result = await query<{ id: string }>(
        `INSERT INTO tracked_competitors (location_id, competitor_id, slot_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (location_id, competitor_id) DO UPDATE
           SET slot_type = EXCLUDED.slot_type, active = TRUE
         RETURNING id`,
        [req.params.id, parsed.data.competitor_id, parsed.data.slot_type]
      )
      await billingService.addSlot(orgDbId)
      return reply.code(201).send({ id: result.rows[0].id, slot_type: 'track' })
    } catch (err: any) {
      if (err.code === '23503') {
        return reply.code(400).send({ error: 'Competitor not found', code: 'COMPETITOR_NOT_FOUND' })
      }
      throw err
    }
  })

  // GET /api/v1/locations/:id/discover — competitors not yet tracked at this location
  fastify.get('/:id/discover', async (req: FastifyRequest<{
    Params: { id: string }
    Querystring: { radius?: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const loc = await query(
      'SELECT id, lat, lng FROM locations WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    // Return competitors in DB not already actively tracked at this location
    const result = await query(
      `SELECT c.id, c.name, c.address, c.google_place_id, c.platform, c.lat, c.lng, c.last_scraped
       FROM competitors c
       WHERE NOT EXISTS (
         SELECT 1 FROM tracked_competitors tc
         WHERE tc.competitor_id = c.id AND tc.location_id = $1 AND tc.active = TRUE
       )
       ORDER BY c.name
       LIMIT 50`,
      [req.params.id]
    )

    return { success: true, data: { competitors: result.rows, total: result.rowCount } }
  })

  // DELETE /api/v1/locations/:id/competitors/:cId
  fastify.delete('/:id/competitors/:cId', async (req: FastifyRequest<{
    Params: { id: string; cId: string }
  }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    // Verify location belongs to org
    const loc = await query(
      'SELECT id FROM locations WHERE id = $1 AND org_id = $2',
      [req.params.id, orgDbId]
    )
    if (!loc.rows.length) {
      return reply.code(404).send({ error: 'Location not found', code: 'LOCATION_NOT_FOUND' })
    }

    // Find tracked_competitor row
    const tc = await query<{ id: string; slot_type: string }>(
      `SELECT id, slot_type FROM tracked_competitors
       WHERE location_id = $1 AND competitor_id = $2 AND active = TRUE`,
      [req.params.id, req.params.cId]
    )
    if (!tc.rows.length) {
      return reply.code(404).send({ error: 'Tracked competitor not found', code: 'TRACKED_COMPETITOR_NOT_FOUND' })
    }

    const { slot_type } = tc.rows[0]

    if (slot_type === 'block') {
      // Find the active block_list row and cancel it
      const bl = await query<{ id: string }>(
        `SELECT id FROM block_list
         WHERE org_id = $1 AND competitor_id = $2 AND active = TRUE`,
        [orgDbId, req.params.cId]
      )
      if (bl.rows.length) {
        await blockingService.cancelBlock(bl.rows[0].id, orgDbId, req.auth!.userId)
      } else {
        // No active block_list row — just deactivate tracked_competitor
        await query(
          'UPDATE tracked_competitors SET active = FALSE WHERE id = $1',
          [tc.rows[0].id]
        )
        await billingService.removeSlot(orgDbId)
      }
    } else {
      await query(
        'UPDATE tracked_competitors SET active = FALSE WHERE id = $1',
        [tc.rows[0].id]
      )
      await billingService.removeSlot(orgDbId)
    }

    return { success: true }
  })
}
