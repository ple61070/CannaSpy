import Stripe from 'stripe'
import { query } from '../db/client'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

const VOLUME_TIERS = [
  { min: 50, price: 85 },
  { min: 20, price: 90 },
  { min: 10, price: 95 },
  { min: 1,  price: 100 },
]

function getPricePerSlot(totalSlots: number): number {
  for (const tier of VOLUME_TIERS) {
    if (totalSlots >= tier.min) return tier.price
  }
  return 100
}

export async function addSlot(orgId: string): Promise<void> {
  const org = await query<{ stripe_subscription_id: string | null }>(
    'SELECT stripe_subscription_id FROM organizations WHERE id = $1',
    [orgId]
  )
  const subId = org.rows[0]?.stripe_subscription_id
  if (!subId) {
    console.warn(`[billing] No Stripe subscription for org ${orgId} — skipping slot add`)
    return
  }
  const sub = await stripe.subscriptions.retrieve(subId)
  const item = sub.items.data[0]
  if (!item) return
  await stripe.subscriptionItems.update(item.id, {
    quantity: (item.quantity ?? 0) + 1,
  })
}

export async function removeSlot(orgId: string): Promise<void> {
  const org = await query<{ stripe_subscription_id: string | null }>(
    'SELECT stripe_subscription_id FROM organizations WHERE id = $1',
    [orgId]
  )
  const subId = org.rows[0]?.stripe_subscription_id
  if (!subId) {
    console.warn(`[billing] No Stripe subscription for org ${orgId} — skipping slot remove`)
    return
  }
  const sub = await stripe.subscriptions.retrieve(subId)
  const item = sub.items.data[0]
  if (!item) return
  const newQty = Math.max(0, (item.quantity ?? 1) - 1)
  await stripe.subscriptionItems.update(item.id, { quantity: newQty })
}

export interface UsageResult {
  total_slots: number
  tracking_slots: number
  blocking_slots: number
  monthly_cost: number
  discount_tier: string
}

export async function getUsage(orgId: string): Promise<UsageResult> {
  const result = await query<{
    total_slots: string
    tracking_slots: string
    blocking_slots: string
  }>(
    `SELECT
       COUNT(*) FILTER (WHERE tc.active = TRUE) as total_slots,
       COUNT(*) FILTER (WHERE tc.active = TRUE AND tc.slot_type = 'track') as tracking_slots,
       COUNT(*) FILTER (WHERE tc.active = TRUE AND tc.slot_type = 'block') as blocking_slots
     FROM tracked_competitors tc
     JOIN locations l ON l.id = tc.location_id
     WHERE l.org_id = $1`,
    [orgId]
  )
  const row = result.rows[0]
  const total = parseInt(row.total_slots, 10) || 0
  const tracking = parseInt(row.tracking_slots, 10) || 0
  const blocking = parseInt(row.blocking_slots, 10) || 0
  const pricePerSlot = getPricePerSlot(total)
  const tier = VOLUME_TIERS.find((t) => total >= t.min)
  return {
    total_slots: total,
    tracking_slots: tracking,
    blocking_slots: blocking,
    monthly_cost: total * pricePerSlot,
    discount_tier: tier ? `$${tier.price}/slot` : '$100/slot',
  }
}

export async function sendDunningEmail(orgId: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const org = await query<{ name: string; slug: string; contact_email: string | null }>(
    'SELECT name, slug, contact_email FROM organizations WHERE id = $1',
    [orgId]
  )
  const orgName = org.rows[0]?.name ?? 'Your organization'
  const contactEmail = org.rows[0]?.contact_email
  if (!contactEmail) {
    console.warn(`[billing] No contact_email for org ${orgId} — skipping dunning email`)
    return
  }
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: [contactEmail],
    subject: `Action required: Payment failed for ${orgName}`,
    text: [
      `Hi ${orgName},`,
      '',
      'We were unable to process your latest payment.',
      'Your blocks and tracking slots remain active for the next 72 hours.',
      'Please update your payment method to avoid service interruption.',
      '',
      'Log in to update: https://app.cannaspy.com/billing',
    ].join('\n'),
  })
}
