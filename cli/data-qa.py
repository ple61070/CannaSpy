#!/usr/bin/env python3
"""
data-qa.py — Normalization quality inspection CLI (internal tool).

Usage:
  python3 cli/data-qa.py failures --hours 24
  python3 cli/data-qa.py review-queue
  python3 cli/data-qa.py normalize --name "Blue Dream 1g flower"
"""

import argparse
import json
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from packages.scraper.parsers.normalizer import Normalizer


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cmd_failures(args):
    """Show normalization failures in last N hours."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT raw_name, COUNT(*) as count
            FROM price_observations
            WHERE product_id IS NULL
              AND detected_at >= NOW() - (%s || ' hours')::INTERVAL
            GROUP BY raw_name
            ORDER BY count DESC
            LIMIT 50
            """,
            (str(args.hours),),
        )
        rows = cur.fetchall()

    if not rows:
        print(f"No normalization failures in the last {args.hours} hours.")
        return

    print(f"\nNormalization failures (last {args.hours}h) — {len(rows)} unique names:")
    for row in rows:
        print(f"  {row[1]:>4}x  {row[0]}")
    conn.close()


def cmd_review_queue(args):
    """Show low-confidence normalizations pending review."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT po.raw_name, p.canonical_name, po.confidence, COUNT(*) as observations
            FROM price_observations po
            JOIN products p ON p.id = po.product_id
            WHERE po.confidence IN ('low', 'medium')
            GROUP BY po.raw_name, p.canonical_name, po.confidence
            ORDER BY po.confidence ASC, observations DESC
            LIMIT 50
        """)
        rows = cur.fetchall()

    if not rows:
        print("No low-confidence normalizations pending review.")
        return

    print(f"\nLow-confidence normalizations ({len(rows)} items):")
    print(f"  {'Raw Name':<40}  {'Canonical':<40}  {'Confidence':<10}  Obs")
    print("  " + "-" * 100)
    for row in rows:
        print(f"  {row[0][:38]:<40}  {row[1][:38]:<40}  {row[2]:<10}  {row[3]}")
    conn.close()


def cmd_normalize(args):
    """Test normalization on a specific raw product name."""
    print(f"\nNormalizing: '{args.name}'")
    normalizer = Normalizer()
    result = normalizer.normalize_single(args.name)
    print(json.dumps(result, indent=2))


def main():
    parser = argparse.ArgumentParser(description="CannaSpy data quality inspection")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_failures = subparsers.add_parser("failures", help="Show normalization failures")
    p_failures.add_argument("--hours", type=int, default=24)

    subparsers.add_parser("review-queue", help="Show low-confidence normalizations")

    p_normalize = subparsers.add_parser("normalize", help="Test normalization on a name")
    p_normalize.add_argument("--name", required=True)

    args = parser.parse_args()
    commands = {"failures": cmd_failures, "review-queue": cmd_review_queue, "normalize": cmd_normalize}
    commands[args.command](args)


if __name__ == "__main__":
    main()
