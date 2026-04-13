import { FastifyRequest, FastifyReply } from 'fastify'
import { getAuth } from '@clerk/fastify'
import { query } from '../db/client'

// Attach to request: declare module augmentation for request.auth
declare module 'fastify' {
  interface FastifyRequest {
    auth: { orgId: string; orgDbId: string | null; userId: string } | null
  }
}

export async function clerkAuthPreHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const auth = getAuth(request as any)
    if (!auth?.userId) {
      return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
    }

    // Use Clerk org ID if present, fall back to user ID as personal org key
    // This allows the app to work without Clerk Organizations being configured
    request.log.info(`[clerk] userId=${auth.userId} orgId=${auth.orgId} hasAuthHeader=${!!request.headers.authorization}`)
    const tenantKey = auth.orgId || `user_${auth.userId}`

    // Resolve tenant key → internal DB UUID, auto-creating on first access
    let orgResult = await query<{ id: string }>(
      'SELECT id FROM organizations WHERE clerk_org_id = $1',
      [tenantKey]
    )

    if (!orgResult.rows.length) {
      const slug = tenantKey.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      const name = auth.orgId
        ? ((auth as any).orgSlug || auth.orgId).replace(/-/g, ' ').replace(/^org_/i, '').trim()
        : `Personal (${auth.userId.slice(-6)})`
      orgResult = await query<{ id: string }>(
        `INSERT INTO organizations (clerk_org_id, name, slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (clerk_org_id) DO UPDATE SET name = organizations.name
         RETURNING id`,
        [tenantKey, name, slug]
      )
    }

    const orgDbId = orgResult.rows[0]?.id ?? null
    request.auth = { orgId: tenantKey, orgDbId, userId: auth.userId }
  } catch {
    return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
  }
}
