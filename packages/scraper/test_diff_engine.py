"""
test_diff_engine.py — Smoke test for diff_engine.py end-to-end.

Uses the seed competitor (c0000000-0000-0000-0000-000000000001) and synthetic
snapshots to verify the full code path: diff logic → change_events table write.

Run from packages/scraper/:
    cd packages/scraper
    python3 test_diff_engine.py

Requires DATABASE_URL in .env at repo root (or environment).
"""

import json
import logging
import os
import sys
import urllib.request
from pathlib import Path

# Load .env from repo root
root = Path(__file__).resolve().parents[2]
env_file = root / ".env"
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Seed competitor from migration 001
SEED_COMPETITOR_ID = "c0000000-0000-0000-0000-000000000001"

# Synthetic "previous" snapshot — baseline prices
PREV_ITEMS = [
    {
        "platform_item_id": "sku-001",
        "name": "Blue Dream 1g",
        "brand": "TestBrand",
        "category": "flower",
        "price": 12.00,
        "on_sale": False,
        "discount_label": None,
    },
    {
        "platform_item_id": "sku-002",
        "name": "OG Kush Pre-Roll",
        "brand": "TestBrand",
        "category": "pre-rolls",
        "price": 8.00,
        "on_sale": False,
        "discount_label": None,
    },
    {
        "platform_item_id": "sku-003",
        "name": "CBD Gummies 250mg",
        "brand": "TestBrand",
        "category": "edibles",
        "price": 25.00,
        "on_sale": True,
        "discount_label": "20% off",
    },
    {
        "platform_item_id": "sku-004",
        "name": "Vape Pen Starter Kit",
        "brand": "TestBrand",
        "category": "vaporizers",
        "price": 45.00,
        "on_sale": False,
        "discount_label": None,
    },
]

# Synthetic "current" snapshot — price drops, sale ended, new product, removed product
CURR_ITEMS = [
    {
        "platform_item_id": "sku-001",
        "name": "Blue Dream 1g",
        "brand": "TestBrand",
        "category": "flower",
        "price": 10.00,          # price_change: 12 → 10
        "on_sale": True,          # sale_started
        "discount_label": "15% off",
    },
    {
        "platform_item_id": "sku-002",
        "name": "OG Kush Pre-Roll",
        "brand": "TestBrand",
        "category": "pre-rolls",
        "price": 8.00,            # unchanged
        "on_sale": False,
        "discount_label": None,
    },
    {
        "platform_item_id": "sku-003",
        "name": "CBD Gummies 250mg",
        "brand": "TestBrand",
        "category": "edibles",
        "price": 22.00,           # price_change: 25 → 22
        "on_sale": False,          # sale_ended
        "discount_label": None,
    },
    # sku-004 removed → removed_product event
    {
        "platform_item_id": "sku-005",
        "name": "Live Resin Cartridge",  # new product
        "brand": "TestBrand",
        "category": "concentrate",
        "price": 38.00,
        "on_sale": False,
        "discount_label": None,
    },
]

EXPECTED_EVENTS = {
    "price_change": 2,      # sku-001 (12→10), sku-003 (25→22)
    "sale_started": 1,      # sku-001
    "sale_ended": 1,        # sku-003
    "new_product": 1,       # sku-005
    "removed_product": 1,   # sku-004
}


def _query_change_events_count(before_ts: str) -> int:
    """Count change_events rows created after before_ts for the seed competitor."""
    base = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base or not key:
        logger.warning("No SUPABASE_URL/KEY — skipping PostgREST count verification")
        return -1
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "count=exact",
        "Range-Unit": "items",
        "Range": "0-0",
    }
    url = (
        f"{base}/rest/v1/change_events"
        f"?competitor_id=eq.{SEED_COMPETITOR_ID}"
        f"&detected_at=gt.{before_ts}"
    )
    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        content_range = resp.headers.get("Content-Range", "0/0")
        total = content_range.split("/")[-1]
        return int(total) if total.isdigit() else -1
    except Exception as e:
        logger.error("PostgREST count failed: %s", e)
        return -1


def main() -> None:
    from datetime import datetime, timezone

    sys.path.insert(0, str(Path(__file__).parent))
    from diff_engine import diff_snapshots

    logger.info("=== diff_engine smoke test ===")
    logger.info("Competitor: %s (seed)", SEED_COMPETITOR_ID)
    logger.info("Prev snapshot: %d items", len(PREV_ITEMS))
    logger.info("Curr snapshot: %d items", len(CURR_ITEMS))

    before_ts = datetime.now(timezone.utc).isoformat()

    # Run diff — persist=True writes to change_events table
    events = diff_snapshots(PREV_ITEMS, CURR_ITEMS, SEED_COMPETITOR_ID, persist=True)

    logger.info("Generated %d events:", len(events))
    by_type: dict[str, int] = {}
    for e in events:
        t = e["event_type"]
        by_type[t] = by_type.get(t, 0) + 1
        logger.info("  [%s] %s — old=%s new=%s", t, e.get("item_name"), e.get("old_value"), e.get("new_value"))

    # Validate counts
    passed = True
    for event_type, expected_count in EXPECTED_EVENTS.items():
        actual = by_type.get(event_type, 0)
        status = "✅" if actual == expected_count else "❌"
        if actual != expected_count:
            passed = False
        logger.info("  %s %s: expected %d, got %d", status, event_type, expected_count, actual)

    # Verify DB persistence via PostgREST
    count = _query_change_events_count(before_ts)
    if count >= 0:
        db_status = "✅" if count == len(events) else "❌"
        logger.info("%s DB write: %d rows in change_events (expected %d)", db_status, count, len(events))
        if count != len(events):
            passed = False

    if passed:
        logger.info("=== PASSED — diff_engine end-to-end smoke test complete ===")
        sys.exit(0)
    else:
        logger.error("=== FAILED — see above ===")
        sys.exit(1)


if __name__ == "__main__":
    main()
