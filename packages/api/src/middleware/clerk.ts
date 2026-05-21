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
  let auth: ReturnType<typeof getAuth>
  try {
    auth = getAuth(request as any)
  } catch (err: any) {
    request.log.error(`[clerk] getAuth threw: ${err?.message || String(err)}`)
    return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
  }

  if (!auth?.userId) {
    return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
  }

  try {
    // Use Clerk org ID if present, fall back to user ID as personal org key
    const tenantKey = auth.orgId || `user_${auth.userId}`

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
  } catch (err: any) {
    request.log.error(`[clerk] db lookup threw: ${err?.message || String(err)}`)
    return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
  }
}
