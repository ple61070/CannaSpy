#!/usr/bin/env python3
"""
scraper-ctl.py — CannaSpy scraper control CLI (internal tool).

Usage:
  python3 cli/scraper-ctl.py scrape --competitor-id <uuid>
  python3 cli/scraper-ctl.py status
  python3 cli/scraper-ctl.py inspect --competitor-id <uuid>
  python3 cli/scraper-ctl.py rescrape --location-id <uuid>
"""

import argparse
import json
import os
import sys
import subprocess
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def cmd_scrape(args):
    """Trigger immediate scrape for a specific competitor."""
    print(f"Triggering scrape for competitor {args.competitor_id}...")
    result = subprocess.run(
        [
            "python3",
            "packages/scraper/dispensary_scraper.py",
            "--competitor-id", args.competitor_id,
            "--output", "pretty",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        data = json.loads(result.stdout)
        print(f"\n✓ Scrape completed")
        print(f"  Prices found: {len(data.get('prices', []))}")
        print(f"  Promotions found: {len(data.get('promotions', []))}")
        print(f"  Platform: {data.get('platform_detected', 'unknown')}")
        if data.get("error"):
            print(f"  Warning: {data['error']}", file=sys.stderr)
    else:
        print(f"✗ Scrape failed:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        sys.exit(1)


def cmd_status(args):
    """Show scrape job queue status."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT status, COUNT(*) as count, MAX(created_at) as latest
            FROM scrape_jobs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY status
            ORDER BY status
        """)
        rows = cur.fetchall()
        print("\nScrape job status (last 24h):")
        print(f"  {'Status':<12} {'Count':<8} {'Latest'}")
        print("  " + "-" * 40)
        for row in rows:
            print(f"  {row[0]:<12} {row[1]:<8} {row[2]}")

        cur.execute("""
            SELECT c.name, sj.status, sj.error_message, sj.created_at
            FROM scrape_jobs sj
            JOIN competitors c ON c.id = sj.competitor_id
            WHERE sj.status = 'failed'
              AND sj.created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY sj.created_at DESC
            LIMIT 5
        """)
        failures = cur.fetchall()
        if failures:
            print("\nRecent failures:")
            for row in failures:
                print(f"  {row[0]}: {row[2] or 'unknown error'} ({row[3]})")
    conn.close()


def cmd_inspect(args):
    """Show last scrape result for a competitor."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.name, c.website_url, c.platform, c.last_scraped, c.robots_ok,
                   sj.status, sj.error_message, sj.records_written, sj.completed_at
            FROM competitors c
            LEFT JOIN scrape_jobs sj ON sj.competitor_id = c.id
            WHERE c.id = %s
            ORDER BY sj.created_at DESC
            LIMIT 1
            """,
            (args.competitor_id,),
        )
        row = cur.fetchone()
        if not row:
            print(f"Competitor {args.competitor_id} not found")
            sys.exit(1)

        print(f"\nCompetitor: {row[0]}")
        print(f"  Website: {row[1] or 'not set'}")
        print(f"  Platform: {row[2] or 'unknown'}")
        print(f"  Robots OK: {row[4]}")
        print(f"  Last scraped: {row[3] or 'never'}")
        if row[5]:
            print(f"\nLast scrape job:")
            print(f"  Status: {row[5]}")
            print(f"  Records written: {row[7]}")
            print(f"  Completed: {row[8]}")
            if row[6]:
                print(f"  Error: {row[6]}")

        # Show recent prices
        cur.execute(
            """
            SELECT raw_name, price, in_stock, detected_at
            FROM price_observations
            WHERE competitor_id = %s
            ORDER BY detected_at DESC
            LIMIT 10
            """,
            (args.competitor_id,),
        )
        prices = cur.fetchall()
        if prices:
            print(f"\nMost recent prices ({len(prices)} shown):")
            for p in prices:
                stock = "in stock" if p[2] else "OUT OF STOCK"
                print(f"  ${p[1]:.2f}  {p[0]} ({stock}) @ {p[3]}")
    conn.close()


def cmd_rescrape(args):
    """Force re-scrape all competitors for a location."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT competitor_id
            FROM tracked_competitors
            WHERE location_id = %s AND active = TRUE
            """,
            (args.location_id,),
        )
        competitors = cur.fetchall()
    conn.close()

    if not competitors:
        print(f"No active competitors found for location {args.location_id}")
        return

    print(f"Re-scraping {len(competitors)} competitors for location {args.location_id}...")
    for (competitor_id,) in competitors:
        print(f"  Scraping {competitor_id}...", end=" ", flush=True)
        result = subprocess.run(
            ["python3", "packages/scraper/dispensary_scraper.py", "--competitor-id", str(competitor_id)],
            capture_output=True, text=True,
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            print(f"✓ {len(data.get('prices', []))} prices")
        else:
            print(f"✗ failed")


def main():
    parser = argparse.ArgumentParser(description="CannaSpy scraper control")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_scrape = subparsers.add_parser("scrape", help="Trigger immediate scrape")
    p_scrape.add_argument("--competitor-id", required=True)

    subparsers.add_parser("status", help="Show queue status")

    p_inspect = subparsers.add_parser("inspect", help="Inspect last scrape result")
    p_inspect.add_argument("--competitor-id", required=True)

    p_rescrape = subparsers.add_parser("rescrape", help="Force re-scrape all competitors at a location")
    p_rescrape.add_argument("--location-id", required=True)

    args = parser.parse_args()

    commands = {
        "scrape": cmd_scrape,
        "status": cmd_status,
        "inspect": cmd_inspect,
        "rescrape": cmd_rescrape,
    }
    commands[args.command](args)


if __name__ == "__main__":
    main()
