/**
 * billing.webhook.ts — Stripe webhook handler
 *
 * Registered OUTSIDE the Clerk auth preHandler in index.ts.
 * Authentication is via Stripe webhook signature verification only.
 * Raw body is required for stripe.webhooks.constructEvent().
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../db/client'
import Stripe from 'stripe'
import * as billingService from '../services/billing.service'
import { cancelBlock } from '../services/blocking.service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

export async function billingWebhookRoute(fastify: FastifyInstance) {
  // Override default JSON parser for this plugin scope to get raw Buffer
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (_req, body, done) {
    done(null, body)
  })

  // POST /api/v1/billing/webhook
  fastify.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const sig = req.headers['stripe-signature'] as string
    const rawBody = req.body as Buffer

    if (!sig) {
      return reply.code(400).send({ error: 'Missing stripe-signature header' })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err: any) {
      fastify.log.warn(`[billing/webhook] Invalid Stripe signature: ${err.message}`)
      return reply.code(400).send({ error: 'Invalid signature' })
    }

    // Idempotency: short-circuit if we've seen this event_id before.
    const dup = await query(
      'SELECT 1 FROM webhook_events WHERE event_id = $1',
      [event.id]
    )
    if (dup.rowCount && dup.rowCount > 0) {
      fastify.log.info(
        { eventId: event.id, eventType: event.type },
        'webhook duplicate, skipping'
      )
      return reply.send({ received: true, idempotent_skip: true })
    }

    fastify.log.info(`[billing/webhook] Event: ${event.type}`)

    try {
      switch (event.type) {
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const org = await query<{ id: string }>(
            'SELECT id FROM organizations WHERE stripe_id = $1',
            [customerId]
          )
          if (org.rows.length) {
            await query(
              'UPDATE organizations SET stripe_subscription_id = $1 WHERE id = $2',
              [sub.id, org.rows[0].id]
            )
          }
          break
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const org = await query<{ id: string }>(
            'SELECT id FROM organizations WHERE stripe_id = $1',
            [customerId]
          )
          if (!org.rows.length) break
          const orgId = org.rows[0].id

          // Cancel all active blocks
          const activeBlocks = await query<{ id: string }>(
            'SELECT id FROM block_list WHERE org_id = $1 AND active = TRUE',
            [orgId]
          )
          const systemUserId = 'system:subscription_deleted'
          for (const block of activeBlocks.rows) {
            try {
              await cancelBlock(block.id, orgId, systemUserId)
            } catch (err) {
              fastify.log.error(`[billing/webhook] Failed to cancel block ${block.id}: ${err}`)
            }
          }

          // Deactivate all tracked competitors
          await query(
            `UPDATE tracked_competitors SET active = FALSE
             WHERE location_id IN (SELECT id FROM locations WHERE org_id = $1)`,
            [orgId]
          )

          fastify.log.info(`[billing/webhook] Subscription deleted — deactivated all slots for org ${orgId}`)
          break
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string
          const org = await query<{ id: string }>(
            'SELECT id FROM organizations WHERE stripe_id = $1',
            [customerId]
          )
          if (!org.rows.length) break
          const orgId = org.rows[0].id

          // Set 72-hour grace period — do NOT deactivate blocks
          await query(
            `UPDATE organizations SET grace_period_ends_at = NOW() + INTERVAL '72 hours'
             WHERE id = $1`,
            [orgId]
          )

          // Fire dunning email — fire-and-forget, non-blocking
          billingService.sendDunningEmail(orgId).catch((err) =>
            fastify.log.error(`[billing/webhook] Dunning email failed for org ${orgId}: ${err}`)
          )

          fastify.log.info(`[billing/webhook] Payment failed — grace period set for org ${orgId}`)
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice
          const customerField = invoice.customer
          const customerId: string | null = typeof customerField === 'string'
            ? customerField
            : customerField != null && typeof customerField === 'object' && 'id' in customerField
              ? (customerField as { id: string }).id
              : null
          if (!customerId) break

          const cleared = await query<{ id: string }>(
            `UPDATE organizations
             SET grace_period_ends_at = NULL
             WHERE stripe_id = $1 AND grace_period_ends_at IS NOT NULL
             RETURNING id`,
            [customerId]
          )
          if (cleared.rowCount && cleared.rowCount > 0) {
            const orgId = cleared.rows[0].id
            await query(
              `INSERT INTO audit_log (org_id, action, entity_type, entity_id, metadata, created_at)
               VALUES ($1, 'grace_period_cleared', 'organization', $1, $2::jsonb, NOW())`,
              [orgId, JSON.stringify({ stripe_invoice_id: invoice.id, stripe_id: customerId })]
            )
            fastify.log.info(`[billing/webhook] Grace period cleared for org ${orgId}`)
          }
          break
        }

        default:
          fastify.log.debug(`[billing/webhook] Unhandled event type: ${event.type}`)
      }

      await query(
        'INSERT INTO webhook_events (event_id, event_type) VALUES ($1, $2)',
        [event.id, event.type]
      )
    } catch (err) {
      fastify.log.error(`[billing/webhook] Error processing event ${event.type}: ${err}`)
      return reply.code(500).send({ error: 'Webhook processing failed' })
    }

    return reply.code(200).send({ received: true })
  })
}
