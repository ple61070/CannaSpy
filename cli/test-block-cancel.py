#!/usr/bin/env python3
"""
Test: block cancellation → CRM sales alert fires within 60 seconds.

This script polls the DB for crm_notified_at to be set after you cancel
a block via the API. Use it to verify the 60-second SLA.

Usage:
  1. Create or find an active block in block_list
  2. Cancel it via the API:
       DELETE http://localhost:3001/api/v1/blocks/<block_id>
  3. Run this script to verify the CRM alert fires within 60s:
       python3 cli/test-block-cancel.py --block-id <uuid> --org-id <uuid>

Requires:
  - DATABASE_URL in .env or environment
  - python-dotenv and psycopg2-binary installed
    (pip install python-dotenv psycopg2-binary)
"""

import argparse
import os
import sys
import time

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
except ImportError:
    pass  # dotenv optional

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2-binary not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Test block cancel → CRM alert SLA")
    parser.add_argument('--block-id', required=True, help='block_list.id UUID')
    parser.add_argument('--org-id', required=True, help='organizations.id UUID')
    parser.add_argument('--timeout', type=int, default=60, help='Seconds to wait (default: 60)')
    args = parser.parse_args()

    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not set")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    # Verify block exists
    cur.execute(
        "SELECT id, active, crm_notified_at, unblocked_at FROM block_list WHERE id = %s AND org_id = %s",
        (args.block_id, args.org_id)
    )
    row = cur.fetchone()
    if not row:
        print(f"ERROR: Block {args.block_id} not found for org {args.org_id}")
        sys.exit(1)

    block_id, active, crm_notified_at, unblocked_at = row

    if crm_notified_at:
        print(f"Block already has crm_notified_at = {crm_notified_at}")
        print("PASS (pre-existing notification)")
        sys.exit(0)

    if active:
        print(f"Block is still active. Cancel it first:")
        print(f"  DELETE http://localhost:3001/api/v1/blocks/{args.block_id}")
        print(f"  (requires Clerk org auth header)")
        print(f"")
        print(f"Waiting for block to be cancelled and CRM alert to fire...")
    else:
        print(f"Block deactivated at {unblocked_at}. Waiting for CRM alert...")

    start = time.time()
    while time.time() - start < args.timeout:
        cur.execute(
            "SELECT active, crm_notified_at, unblocked_at FROM block_list WHERE id = %s",
            (args.block_id,)
        )
        result = cur.fetchone()
        if not result:
            print("ERROR: Block disappeared from DB")
            sys.exit(1)

        current_active, current_notified, current_unblocked = result
        elapsed = time.time() - start

        if current_notified:
            print(f"PASS — crm_notified_at set: {current_notified} ({elapsed:.1f}s after start)")
            if elapsed > 60:
                print(f"WARNING: Alert fired in {elapsed:.1f}s — exceeds 60s SLA")
            sys.exit(0)

        if current_active:
            print(f"  {elapsed:.0f}s — still active, waiting for cancel...")
        else:
            print(f"  {elapsed:.0f}s — block deactivated at {current_unblocked}, waiting for alert...")

        time.sleep(2)

    cur.execute(
        "SELECT active, crm_notified_at FROM block_list WHERE id = %s",
        (args.block_id,)
    )
    final = cur.fetchone()
    print(f"FAIL — crm_notified_at not set within {args.timeout}s")
    print(f"  Final state: active={final[0]}, crm_notified_at={final[1]}")
    print(f"  Check: RESEND_API_KEY and SALES_ALERT_EMAIL are set in .env")
    sys.exit(1)


if __name__ == '__main__':
    main()
