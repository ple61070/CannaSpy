#!/usr/bin/env python3
"""
block-ctl.py — CannaSpy block list management CLI (internal tool).

Usage:
  python3 cli/block-ctl.py list
  python3 cli/block-ctl.py add --org-id <uuid> --competitor-id <uuid>
  python3 cli/block-ctl.py remove --block-id <uuid>
  python3 cli/block-ctl.py expiring --days 7
"""

import argparse
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cmd_list(args):
    """List all active blocks."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT bl.id, o.name as org_name, c.name as competitor_name,
                   c.address, bl.blocked_at, bl.crm_notified_at
            FROM block_list bl
            JOIN organizations o ON o.id = bl.org_id
            JOIN competitors c ON c.id = bl.competitor_id
            WHERE bl.active = TRUE
            ORDER BY bl.blocked_at DESC
        """)
        rows = cur.fetchall()

    if not rows:
        print("No active blocks.")
        return

    print(f"\nActive blocks ({len(rows)} total):")
    print(f"  {'Block ID':<36}  {'Org':<20}  {'Competitor':<30}  {'Blocked'}")
    print("  " + "-" * 100)
    for row in rows:
        print(f"  {str(row[0]):<36}  {row[1]:<20}  {row[2]:<30}  {row[4]}")
    conn.close()


def cmd_add(args):
    """Manually add a block (admin use)."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO block_list (org_id, competitor_id, blocked_by, notify_on_unblock)
            VALUES (%s, %s, 'cli-admin', TRUE)
            RETURNING id
            """,
            (args.org_id, args.competitor_id),
        )
        block_id = cur.fetchone()[0]
        conn.commit()
    conn.close()
    print(f"Block created: {block_id}")


def cmd_remove(args):
    """Remove a block and trigger sales notification."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE block_list
            SET active = FALSE, unblocked_at = NOW()
            WHERE id = %s AND active = TRUE
            RETURNING competitor_id
            """,
            (args.block_id,),
        )
        result = cur.fetchone()
        if not result:
            print(f"Block {args.block_id} not found or already inactive.")
            conn.close()
            sys.exit(1)
        conn.commit()

    print(f"Block {args.block_id} cancelled.")
    print("CRM notification would be triggered via BullMQ in production.")
    conn.close()


def cmd_expiring(args):
    """Show blocks with no recent activity (proxy for 'expiring')."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT bl.id, o.name as org_name, c.name as competitor_name, bl.blocked_at
            FROM block_list bl
            JOIN organizations o ON o.id = bl.org_id
            JOIN competitors c ON c.id = bl.competitor_id
            WHERE bl.active = TRUE
              AND bl.blocked_at <= NOW() - (%s || ' days')::INTERVAL
            ORDER BY bl.blocked_at ASC
            """,
            (str(args.days),),
        )
        rows = cur.fetchall()

    if not rows:
        print(f"No blocks older than {args.days} days.")
        return

    print(f"\nBlocks older than {args.days} days ({len(rows)} total):")
    for row in rows:
        print(f"  {row[0]}  {row[1]}  {row[2]}  (since {row[3].date()})")
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="CannaSpy block list management")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("list", help="List all active blocks")

    p_add = subparsers.add_parser("add", help="Add a block")
    p_add.add_argument("--org-id", required=True)
    p_add.add_argument("--competitor-id", required=True)

    p_remove = subparsers.add_parser("remove", help="Remove a block")
    p_remove.add_argument("--block-id", required=True)

    p_expiring = subparsers.add_parser("expiring", help="Show blocks expiring soon")
    p_expiring.add_argument("--days", type=int, default=7)

    args = parser.parse_args()

    commands = {
        "list": cmd_list,
        "add": cmd_add,
        "remove": cmd_remove,
        "expiring": cmd_expiring,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
