import { Resend } from 'resend'
import { query } from '../db/client'
import * as billingService from './billing.service'

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

  // 4. Fire sales alert — fire-and-forget, NEVER awaited inline
  setImmediate(() => {
    sendSalesAlert(blockId, orgId, competitorId).catch((err) =>
      console.error('[blocking.service] Sales alert failed:', err)
    )
  })

  // 5. Billing
  await billingService.removeSlot(orgId)
}

async function sendSalesAlert(
  blockId: string,
  orgId: string,
  competitorId: string
): Promise<void> {
  const salesEmail = process.env.SALES_ALERT_EMAIL
  if (!salesEmail) {
    console.warn('[blocking.service] SALES_ALERT_EMAIL not set — skipping sales alert')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const [orgResult, competitorResult] = await Promise.all([
      query<{ name: string }>('SELECT name FROM organizations WHERE id = $1', [orgId]),
      query<{ name: string; address: string }>('SELECT name, address FROM competitors WHERE id = $1', [competitorId]),
    ])

    const orgName = orgResult.rows[0]?.name ?? orgId
    const competitorName = competitorResult.rows[0]?.name ?? competitorId
    const city = competitorResult.rows[0]?.address?.split(',')[1]?.trim() ?? ''
    const cancelledAt = new Date().toUTCString()

    await resend.emails.send({
      from: 'CannaSpy Alerts <alerts@cannaspy.com>',
      to: [salesEmail],
      subject: `Block released — ${competitorName} is now eligible for outreach`,
      text: [
        `${orgName} just cancelled their block on ${competitorName}${city ? ` (${city})` : ''}.`,
        '',
        `They're back on the prospect list. Follow up within 24-48 hours.`,
        '',
        `Block ID: ${blockId}`,
        `Cancelled at: ${cancelledAt}`,
      ].join('\n'),
    })

    await query(
      'UPDATE block_list SET crm_notified_at = NOW() WHERE id = $1',
      [blockId]
    )

    console.info(`[blocking.service] Sales alert sent for block ${blockId}`)
  } catch (err) {
    console.error('[blocking.service] Failed to send sales alert:', err)
  }
}
