import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import { z } from 'zod'

const CreateOrgSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

export async function organizationsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/organizations/me — get current user's org
  fastify.get('/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) {
      return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })
    }

    const result = await query<{
      id: string
      name: string
      slug: string
      stripe_id: string | null
      plan_type: string
      created_at: string
    }>(
      'SELECT id, name, slug, stripe_id, plan_type, created_at FROM organizations WHERE id = $1',
      [orgDbId]
    )

    if (!result.rows.length) {
      return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })
    }

    return result.rows[0]
  })

  // POST /api/v1/organizations — create org (called after Clerk org creation)
  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateOrgSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    const { name, slug } = parsed.data

    try {
      const result = await query<{ id: string }>(
        `INSERT INTO organizations (clerk_org_id, name, slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (clerk_org_id) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [req.auth!.orgId, name, slug]
      )

      await query(
        `INSERT INTO audit_log (org_id, user_id, action, entity_type, entity_id)
         VALUES ($1, $2, 'org_created', 'organization', $1)`,
        [result.rows[0].id, req.auth!.userId]
      )

      return reply.code(201).send({ id: result.rows[0].id })
    } catch (err: any) {
      if (err.code === '23505') {
        return reply.code(409).send({ error: 'Slug already taken', code: 'SLUG_TAKEN' })
      }
      throw err
    }
  })
}
