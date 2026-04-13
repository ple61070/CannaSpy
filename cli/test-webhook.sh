#!/bin/bash
# ============================================================
# Test: Stripe webhook end-to-end
#
# Prerequisites:
#   1. stripe CLI installed: brew install stripe/stripe-cli/stripe
#   2. stripe login (runs once)
#   3. API running locally: pnpm dev:api
#   4. .env filled with STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
#
# Usage: bash cli/test-webhook.sh
# ============================================================

set -e

API_URL="${API_URL:-http://localhost:3001}"

echo "=== CannaSpy Webhook Test ==="
echo ""
echo "STEP 1: In a new terminal, start the Stripe forward listener:"
echo ""
echo "  stripe listen --forward-to ${API_URL}/api/v1/billing/webhook"
echo ""
echo "  Copy the webhook signing secret it prints:"
echo "  > Ready! Your webhook signing secret is whsec_xxx"
echo "  Set STRIPE_WEBHOOK_SECRET=whsec_xxx in your .env and restart the API."
echo ""
echo "STEP 2: Run these test triggers (in another terminal):"
echo ""
echo "  # Test 1 — subscription created (links sub ID to org)"
echo "  stripe trigger customer.subscription.updated"
echo ""
echo "  # Test 2 — payment failure (sets 72h grace period)"
echo "  stripe trigger invoice.payment_failed"
echo ""
echo "  # Test 3 — subscription deleted (deactivates all slots)"
echo "  stripe trigger customer.subscription.deleted"
echo ""
echo "STEP 3: Verify in DB after each trigger:"
echo ""
echo "  -- After subscription.updated:"
echo "  SELECT id, stripe_subscription_id FROM organizations WHERE stripe_id IS NOT NULL;"
echo ""
echo "  -- After invoice.payment_failed:"
echo "  SELECT id, grace_period_ends_at FROM organizations WHERE grace_period_ends_at IS NOT NULL;"
echo ""
echo "  -- After subscription.deleted:"
echo "  SELECT COUNT(*) FROM tracked_competitors WHERE active = TRUE;"
echo "  SELECT COUNT(*) FROM block_list WHERE active = TRUE;"
echo ""
echo "EXPECTED:"
echo "  - subscription.updated  → 200 OK, stripe_subscription_id saved"
echo "  - invoice.payment_failed → 200 OK, grace_period_ends_at ≈ NOW() + 72h"
echo "  - subscription.deleted  → 200 OK, all slots and blocks deactivated"
echo ""
echo "Full webhook test requires a real Stripe test mode customer with subscription."
echo "See Stripe docs: https://stripe.com/docs/webhooks/test"
