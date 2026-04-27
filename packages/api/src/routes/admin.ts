/**
 * admin.ts — Internal admin routes
 *
 * Registered INSIDE the Clerk auth preHandler in index.ts.
 * TODO: Proper admin role-gating is deferred — no role infrastructure exists
 * yet. Any authenticated org member can currently call these endpoints.
 * Add role check (e.g., req.auth?.orgRole === 'admin') in a later sprint
 * when Clerk org roles are wired up.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /api/v1/admin/crm-failures
  // Lists block_list rows where the CRM alert worker exhausted all retries.
  // Used to manually re-trigger sales follow-up or investigate Resend outages.
  fastify.get('/crm-failures', async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = await query<{
      id: string
      competitor_id: string
      competitor_name: string
      crm_notified_at: string | null
      blocked_at: string
      unblocked_at: string | null
      org_name: string
    }>(
      `SELECT
         bl.id,
         bl.competitor_id,
         c.name  AS competitor_name,
         bl.crm_notified_at,
         bl.blocked_at,
         bl.unblocked_at,
         o.name  AS org_name
       FROM block_list bl
       JOIN competitors  c ON bl.competitor_id = c.id
       JOIN organizations o ON bl.org_id = o.id
       WHERE bl.crm_notify_failed = TRUE
       ORDER BY bl.unblocked_at DESC NULLS LAST`
    )

    return reply.send({
      success: true,
      data: { failures: result.rows, count: result.rowCount ?? 0 },
      error: null,
    })
  })
}
