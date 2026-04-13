/**
 * billing.ts — Authenticated billing routes
 *
 * Registered INSIDE the Clerk auth preHandler in index.ts.
 * Webhook is handled separately in billing.webhook.ts.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import Stripe from 'stripe'
import * as billingService from '../services/billing.service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/v1/billing/usage
  fastify.get('/usage', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const usage = await billingService.getUsage(orgDbId)

    // Fetch next billing date from Stripe if subscription exists
    let next_billing_date: string | null = null
    try {
      const org = await query<{ stripe_subscription_id: string | null }>(
        'SELECT stripe_subscription_id FROM organizations WHERE id = $1',
        [orgDbId]
      )
      const subId = org.rows[0]?.stripe_subscription_id
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId)
        next_billing_date = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null
      }
    } catch {
      // Non-fatal — Stripe may not be configured in dev
    }

    return {
      success: true,
      data: { ...usage, next_billing_date },
    }
  })

  // POST /api/v1/billing/checkout — create Stripe checkout session
  fastify.post('/checkout', async (req: FastifyRequest, reply: FastifyReply) => {
    const orgDbId = req.auth?.orgDbId
    if (!orgDbId) return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })

    const org = await query<{ stripe_id: string | null; name: string }>(
      'SELECT stripe_id, name FROM organizations WHERE id = $1',
      [orgDbId]
    )

    if (!org.rows.length) {
      return reply.code(404).send({ error: 'Organization not found', code: 'ORG_NOT_FOUND' })
    }

    let customerId = org.rows[0].stripe_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: org.rows[0].name,
        metadata: { org_id: req.auth!.orgId },
      })
      customerId = customer.id
      await query('UPDATE organizations SET stripe_id = $1 WHERE id = $2', [customerId, orgDbId])
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${process.env.WEB_URL}/billing?success=true`,
      cancel_url: `${process.env.WEB_URL}/billing?cancelled=true`,
    })

    return { success: true, data: { url: session.url } }
  })
}
