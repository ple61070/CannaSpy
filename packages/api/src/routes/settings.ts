import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import { z } from 'zod'

const UpdatePrefsSchema = z.object({
  digest_frequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  price_threshold_pct: z.number().min(0).max(100).optional(),
  quiet_hours_start: z.string().nullable().optional(),
  quiet_hours_end: z.string().nullable().optional(),
})

export async function settingsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/settings/notifications
  fastify.get('/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const result = await query(
      `SELECT digest_frequency, email_enabled, push_enabled,
              price_threshold_pct, quiet_hours_start, quiet_hours_end, alert_types
       FROM notification_preferences
       WHERE org_id = $1 AND user_id = $2 AND location_id IS NULL
       LIMIT 1`,
      [orgDbId, req.auth!.userId]
    )

    if (result.rows.length) {
      return { success: true, data: result.rows[0] }
    }

    // Return defaults if no record exists yet
    return {
      success: true,
      data: {
        digest_frequency: 'realtime',
        email_enabled: true,
        push_enabled: true,
        price_threshold_pct: 5,
        quiet_hours_start: null,
        quiet_hours_end: null,
        alert_types: ['price_drop', 'price_increase', 'new_promo', 'promo_ended', 'new_sku', 'sku_removed', 'new_competitor'],
      },
    }
  })

  // PATCH /api/v1/settings/notifications
  fastify.patch('/notifications', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const parsed = UpdatePrefsSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
    }

    const { digest_frequency, email_enabled, push_enabled, price_threshold_pct } = parsed.data

    // Upsert — note: location_id IS NULL, which breaks standard ON CONFLICT, so use select+update/insert
    const existing = await query<{ id: string }>(
      'SELECT id FROM notification_preferences WHERE org_id = $1 AND user_id = $2 AND location_id IS NULL',
      [orgDbId, req.auth!.userId]
    )

    if (existing.rows.length) {
      await query(
        `UPDATE notification_preferences SET
           digest_frequency    = COALESCE($2, digest_frequency),
           email_enabled       = COALESCE($3, email_enabled),
           push_enabled        = COALESCE($4, push_enabled),
           price_threshold_pct = COALESCE($5, price_threshold_pct)
         WHERE id = $1`,
        [existing.rows[0].id, digest_frequency, email_enabled, push_enabled, price_threshold_pct]
      )
    } else {
      await query(
        `INSERT INTO notification_preferences
           (org_id, user_id, location_id, digest_frequency, email_enabled, push_enabled, price_threshold_pct)
         VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [
          orgDbId,
          req.auth!.userId,
          digest_frequency ?? 'realtime',
          email_enabled ?? true,
          push_enabled ?? true,
          price_threshold_pct ?? 5,
        ]
      )
    }

    return { success: true, data: { message: 'Preferences saved' } }
  })
}
