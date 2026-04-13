import { query } from '../db/client'

export interface Alert {
  id: string
  alert_type: string
  competitor_name: string
  location_name: string
  old_value: string | null
  new_value: string | null
  confidence: string
  reviewed: boolean
  created_at: string
}

export async function getUnreviewedAlertCount(orgId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM alerts WHERE org_id = $1 AND reviewed = FALSE',
    [orgId]
  )
  return parseInt(result.rows[0]?.count || '0', 10)
}

export async function markAlertReviewed(alertId: string, orgId: string, userId: string): Promise<void> {
  await query(
    `UPDATE alerts SET reviewed = TRUE, reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2 AND org_id = $3`,
    [userId, alertId, orgId]
  )
}
