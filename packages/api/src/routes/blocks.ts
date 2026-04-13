import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import { z } from 'zod'
import { addBlock, cancelBlock, BlockNotFoundError } from '../services/blocking.service'

const CreateBlockSchema = z.object({
  competitor_id: z.string().uuid(),
  location_ids: z.array(z.string().uuid()).min(1),
})

export async function blocksRoutes(fastify: FastifyInstance) {
  // GET /api/v1/blocks
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const result = await query(
      `SELECT
         bl.id,
         bl.blocked_by,
         bl.blocked_at,
         bl.unblocked_at,
         bl.notify_on_unblock,
         bl.crm_notified_at,
         c.id as competitor_id,
         c.name as competitor_name,
         c.address as competitor_address
       FROM block_list bl
       JOIN competitors c ON c.id = bl.competitor_id
       WHERE bl.org_id = $1 AND bl.active = TRUE
       ORDER BY bl.blocked_at DESC`,
      [orgDbId]
    )

    return { success: true, data: { blocks: result.rows, total: result.rowCount } }
  })

  // POST /api/v1/blocks
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const parsed = CreateBlockSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    const { competitor_id, location_ids } = parsed.data

    // Verify all location_ids belong to this org
    const locCheck = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM locations
       WHERE id = ANY($1::uuid[]) AND org_id = $2`,
      [location_ids, orgDbId]
    )
    if (parseInt(locCheck.rows[0]?.count || '0', 10) !== location_ids.length) {
      return reply.code(403).send({
        success: false,
        error: 'One or more locations not found or not owned by your organization',
        code: 'INVALID_LOCATIONS',
      })
    }

    const { blockId } = await addBlock(orgDbId, competitor_id, req.auth!.userId, location_ids)

    // Fetch competitor name for response
    const comp = await query<{ name: string }>(
      'SELECT name FROM competitors WHERE id = $1',
      [competitor_id]
    )
    const competitor_name = comp.rows[0]?.name ?? null

    return reply.code(201).send({
      success: true,
      data: { id: blockId, competitor_id, competitor_name, location_ids },
    })
  })

  // DELETE /api/v1/blocks/:id
  fastify.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    try {
      await cancelBlock(req.params.id, orgDbId, req.auth!.userId)
      return {
        success: true,
        data: {
          message: 'Block cancelled. Competitor will be re-added to our prospect list immediately.',
        },
      }
    } catch (err) {
      if (err instanceof BlockNotFoundError) {
        return reply.code(404).send({ success: false, error: err.message, code: 'BLOCK_NOT_FOUND' })
      }
      throw err
    }
  })
}
