import { query } from '../db/client'
import * as billingService from './billing.service'
import { crmAlertQueue } from '../scheduler'

export class BlockNotFoundError extends Error {
  constructor(blockId: string) {
    super(`Block ${blockId} not found or already inactive`)
    this.name = 'BlockNotFoundError'
  }
}

export async function addBlock(
  orgId: string,
  competitorId: string,
  userId: string,
  locationIds: string[]
): Promise<{ blockId: string }> {
  // 1. Insert/update tracked_competitors for each location
  for (const locationId of locationIds) {
    await query(
      `INSERT INTO tracked_competitors (location_id, competitor_id, slot_type, active, blocked_at)
       VALUES ($1, $2, 'block', TRUE, NOW())
       ON CONFLICT (location_id, competitor_id) DO UPDATE
         SET slot_type = 'block', active = TRUE, blocked_at = NOW()`,
      [locationId, competitorId]
    )
  }

  // 2. Insert block_list (or return existing active block)
  const existing = await query<{ id: string }>(
    'SELECT id FROM block_list WHERE org_id = $1 AND competitor_id = $2 AND active = TRUE',
    [orgId, competitorId]
  )

  let blockId: string
  if (existing.rows.length) {
    blockId = existing.rows[0].id
  } else {
    const bl = await query<{ id: string }>(
      `INSERT INTO block_list (org_id, competitor_id, blocked_by, active, notify_on_unblock)
       VALUES ($1, $2, $3, TRUE, TRUE) RETURNING id`,
      [orgId, competitorId, userId]
    )
    blockId = bl.rows[0].id
  }

  // 3. Audit log
  await query(
    `INSERT INTO audit_log (org_id, user_id, action, entity_type, entity_id)
     VALUES ($1, $2, 'block_added', 'competitor', $3)`,
    [orgId, userId, competitorId]
  )

  // 4. Billing — one slot per org/competitor block (not per location)
  await billingService.addSlot(orgId)

  return { blockId }
}

export async function cancelBlock(
  blockId: string,
  orgId: string,
  userId: string
): Promise<void> {
  // 1. Deactivate block_list
  const result = await query<{ competitor_id: string }>(
    `UPDATE block_list SET active = FALSE, unblocked_at = NOW()
     WHERE id = $1 AND org_id = $2 AND active = TRUE
     RETURNING competitor_id`,
    [blockId, orgId]
  )

  if (!result.rowCount || result.rowCount === 0) {
    throw new BlockNotFoundError(blockId)
  }

  const competitorId = result.rows[0].competitor_id

  // 2. Deactivate tracked_competitors across all org locations
  await query(
    `UPDATE tracked_competitors SET active = FALSE
     WHERE competitor_id = $1
       AND location_id IN (SELECT id FROM locations WHERE org_id = $2)`,
    [competitorId, orgId]
  )

  // 3. Audit log
  await query(
    `INSERT INTO audit_log (org_id, user_id, action, entity_type, entity_id)
     VALUES ($1, $2, 'block_cancelled', 'competitor', $3)`,
    [orgId, userId, competitorId]
  )

  // 4. Enqueue CRM alert — at-least-once via crm.worker.ts
  // Fire-and-forget enqueue: cancel DB changes are already committed above.
  // If Redis is unavailable, the enqueue fails and logs — not blocking the cancel.
  crmAlertQueue.add(
    'send-sales-alert',
    { blockId, orgId, competitorId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    }
  ).catch((err) => console.error('[blocking.service] Failed to enqueue CRM alert:', err))

  // 5. Billing
  await billingService.removeSlot(orgId)
}
