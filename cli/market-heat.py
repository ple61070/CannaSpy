#!/usr/bin/env python3
"""
market-heat.py — Market classification tool for CannaSpy (internal).

Classifies markets by dispensary density to determine pricing tiers.

Usage:
  python cli/market-heat.py classify --lat 34.09 --lng -118.36 --radius 5
  python cli/market-heat.py update-all
  python cli/market-heat.py report
"""

import argparse
import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Tier thresholds by dispensary count within radius
TIER_THRESHOLDS = {
    "standard":    (0, 5),     # 0-4 dispensaries
    "competitive": (5, 10),    # 5-9 dispensaries
    "hot":         (10, 20),   # 10-19 dispensaries
    "elite":       (20, 9999), # 20+ dispensaries
}

TIER_PRICES = {
    "standard":    100.0,
    "competitive": 150.0,
    "hot":         200.0,
    "elite":       250.0,
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def classify_market(lat: float, lng: float, radius_miles: float = 5.0) -> str:
    """Classify a market based on dispensary density from our database."""
    conn = get_conn()
    with conn.cursor() as cur:
        # Count dispensaries in the database within radius
        # Uses haversine formula approximation
        radius_deg = radius_miles / 69.0  # rough degrees per mile
        cur.execute(
            """
            SELECT COUNT(*)
            FROM competitors
            WHERE lat BETWEEN %s AND %s
              AND lng BETWEEN %s AND %s
            """,
            (lat - radius_deg, lat + radius_deg, lng - radius_deg, lng + radius_deg),
        )
        count = cur.fetchone()[0]
    conn.close()

    for tier, (low, high) in TIER_THRESHOLDS.items():
        if low <= count < high:
            return tier
    return "standard"


def cmd_classify(args):
    tier = classify_market(args.lat, args.lng, args.radius)
    price = TIER_PRICES[tier]
    print(f"\nMarket classification for ({args.lat}, {args.lng}) within {args.radius} miles:")
    print(f"  Tier: {tier.upper()}")
    print(f"  Price per slot: ${price:.2f}/mo")


def cmd_update_all(args):
    """Update market_tier for all tracked_competitors based on location density."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT l.id, l.lat, l.lng
            FROM locations l
            WHERE l.active = TRUE AND l.lat IS NOT NULL AND l.lng IS NOT NULL
        """)
        locations = cur.fetchall()

        updated = 0
        for (loc_id, lat, lng) in locations:
            tier = classify_market(lat, lng)
            price = TIER_PRICES[tier]
            cur.execute(
                """
                UPDATE tracked_competitors
                SET market_tier = %s, price_per_slot = %s
                WHERE location_id = %s AND active = TRUE
                """,
                (tier, price, loc_id),
            )
            updated += cur.rowcount
        conn.commit()

    print(f"Updated {updated} tracked competitor slots.")
    conn.close()


def cmd_report(args):
    """Show current tier distribution."""
    conn = get_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT market_tier, COUNT(*) as slots, SUM(price_per_slot) as revenue
            FROM tracked_competitors
            WHERE active = TRUE
            GROUP BY market_tier
            ORDER BY price_per_slot DESC
        """)
        rows = cur.fetchall()

    print("\nMarket tier distribution:")
    print(f"  {'Tier':<12}  {'Slots':<8}  {'Monthly Revenue'}")
    print("  " + "-" * 35)
    total_slots = 0
    total_revenue = 0.0
    for row in rows:
        print(f"  {row[0]:<12}  {row[1]:<8}  ${float(row[2] or 0):,.2f}")
        total_slots += row[1]
        total_revenue += float(row[2] or 0)
    print("  " + "-" * 35)
    print(f"  {'TOTAL':<12}  {total_slots:<8}  ${total_revenue:,.2f}")
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="CannaSpy market heat classification")
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_classify = subparsers.add_parser("classify", help="Classify a specific market")
    p_classify.add_argument("--lat", type=float, required=True)
    p_classify.add_argument("--lng", type=float, required=True)
    p_classify.add_argument("--radius", type=float, default=5.0)

    subparsers.add_parser("update-all", help="Update all market tiers")
    subparsers.add_parser("report", help="Show tier distribution report")

    args = parser.parse_args()
    commands = {"classify": cmd_classify, "update-all": cmd_update_all, "report": cmd_report}
    commands[args.command](args)


if __name__ == "__main__":
    main()
