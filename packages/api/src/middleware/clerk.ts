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
    if (!auth?.orgId) {
      return reply.code(403).send({ success: false, error: 'Forbidden', code: 'ORG_REQUIRED' })
    }

    // Resolve Clerk org_id → internal DB UUID, auto-creating on first access
    let orgResult = await query<{ id: string }>(
      'SELECT id FROM organizations WHERE clerk_org_id = $1',
      [auth.orgId]
    )

    if (!orgResult.rows.length) {
      // Auto-create org on first API access (onboarding path)
      // Use orgId as slug — guaranteed unique, can be updated later via settings
      const slug = auth.orgId
      const rawName = (auth as any).orgSlug || auth.orgId
      const name = rawName.replace(/-/g, ' ').replace(/^org_/i, '').trim() || auth.orgId
      orgResult = await query<{ id: string }>(
        `INSERT INTO organizations (clerk_org_id, name, slug)
         VALUES ($1, $2, $3)
         ON CONFLICT (clerk_org_id) DO UPDATE SET name = organizations.name
         RETURNING id`,
        [auth.orgId, name, slug]
      )
    }

    const orgDbId = orgResult.rows[0]?.id ?? null
    request.auth = { orgId: auth.orgId, orgDbId, userId: auth.userId }
  } catch {
    return reply.code(401).send({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' })
  }
}
