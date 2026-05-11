"""
make_second_snapshot.py — Creates a second synthetic snapshot for cannabis-house-4.

Reads all menu_items from snapshot e5a43c17-126e-4c84-85d2-dc69f2d0a960,
simulates realistic price changes on ~5% of items and marks ~3% on_sale,
then writes a new snapshot + items to Supabase via PostgREST.

Usage:
    cd /Users/patricksimac/CannaSpy
    python3 packages/scraper/make_second_snapshot.py
"""

import os
import random
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Load .env from repo root
# ---------------------------------------------------------------------------

def load_env(env_path: Path) -> None:
    if not env_path.exists():
        raise FileNotFoundError(f".env not found at {env_path}")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


# ---------------------------------------------------------------------------
# PostgREST helpers
# ---------------------------------------------------------------------------

def _headers(service_key: str) -> dict:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def fetch_all_items(base_url: str, service_key: str, snapshot_id: str) -> list[dict]:
    """Fetch all menu_items for a snapshot, paginating with Range header."""
    items = []
    page_size = 1000
    offset = 0

    while True:
        url = f"{base_url}/rest/v1/menu_items?snapshot_id=eq.{snapshot_id}"
        headers = _headers(service_key)
        headers["Range"] = f"{offset}-{offset + page_size - 1}"
        headers["Range-Unit"] = "items"

        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        items.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    return items


def create_snapshot(base_url: str, service_key: str, competitor_id: str, item_count: int, slug: str) -> dict:
    """Create a new menu_snapshot row. Returns the created row."""
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    payload = {
        "id": new_id,
        "competitor_id": competitor_id,
        "slug": slug,
        "collected_at": now,
        "item_count": item_count,
        "snapshot_json": [],  # items are stored in menu_items; this satisfies the NOT NULL constraint
    }

    url = f"{base_url}/rest/v1/menu_snapshots"
    resp = requests.post(url, headers=_headers(service_key), json=payload, timeout=30)
    resp.raise_for_status()
    rows = resp.json()
    return rows[0] if rows else payload


def insert_items_batch(base_url: str, service_key: str, items: list[dict]) -> None:
    """Insert items in batches of 100."""
    batch_size = 100
    url = f"{base_url}/rest/v1/menu_items"
    headers = _headers(service_key)

    for i in range(0, len(items), batch_size):
        batch = items[i : i + batch_size]
        resp = requests.post(url, headers=headers, json=batch, timeout=30)
        if not resp.ok:
            print(f"  ERROR inserting batch {i}–{i+len(batch)}: {resp.status_code} {resp.text[:200]}")
            resp.raise_for_status()


def update_last_scraped(base_url: str, service_key: str, competitor_id: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    url = f"{base_url}/rest/v1/competitors?id=eq.{competitor_id}"
    resp = requests.patch(
        url,
        headers=_headers(service_key),
        json={"last_scraped": now},
        timeout=30,
    )
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# Price mutation helpers
# ---------------------------------------------------------------------------

def mutate_items(items: list[dict]) -> tuple[list[dict], int, int]:
    """
    Returns (mutated_items, price_change_count, on_sale_count).
    ~5% price changes, ~3% on_sale marks.
    Strips 'id' so Supabase auto-generates new UUIDs.
    """
    price_changed = 0
    on_sale_marked = 0
    mutated = []

    for item in items:
        row = dict(item)

        # Drop the old primary key — Supabase will assign a new UUID
        row.pop("id", None)

        # ~5% price change
        if random.random() < 0.05:
            current_price = row.get("price")
            if current_price is not None:
                try:
                    p = float(current_price)
                    delta = 5.0 if random.random() < 0.5 else -5.0
                    new_price = max(1.0, round(p + delta, 2))
                    row["price"] = new_price
                    price_changed += 1
                except (TypeError, ValueError):
                    pass

        # ~3% on_sale mark
        if random.random() < 0.03:
            row["on_sale"] = True
            row["discount_label"] = "Daily Deal"
            on_sale_marked += 1

        mutated.append(row)

    return mutated, price_changed, on_sale_marked


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

SOURCE_SNAPSHOT_ID = "e5a43c17-126e-4c84-85d2-dc69f2d0a960"
COMPETITOR_ID = "19f0699b-436a-4144-b1a4-35a0180b28a7"


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent.parent
    load_env(repo_root / ".env")

    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)

    print(f"Fetching items from source snapshot {SOURCE_SNAPSHOT_ID} ...")
    items = fetch_all_items(base_url, service_key, SOURCE_SNAPSHOT_ID)
    print(f"  Fetched {len(items)} items")

    if not items:
        print("ERROR: No items found in source snapshot. Aborting.")
        sys.exit(1)

    print("Mutating items (price changes + on_sale marks) ...")
    mutated, price_changed, on_sale_marked = mutate_items(items)
    print(f"  Price changes: {price_changed}")
    print(f"  On-sale marks: {on_sale_marked}")

    print("Creating new menu_snapshot row ...")
    snapshot_row = create_snapshot(base_url, service_key, COMPETITOR_ID, len(mutated), slug="cannabis-house-4")
    new_snapshot_id = snapshot_row["id"]
    print(f"  New snapshot id: {new_snapshot_id}")

    # Wire each item to the new snapshot
    for row in mutated:
        row["snapshot_id"] = new_snapshot_id
        row["competitor_id"] = COMPETITOR_ID

    print(f"Inserting {len(mutated)} items in batches of 100 ...")
    insert_items_batch(base_url, service_key, mutated)

    print("Updating competitors.last_scraped ...")
    update_last_scraped(base_url, service_key, COMPETITOR_ID)

    print("\n=== Summary ===")
    print(f"  New snapshot id : {new_snapshot_id}")
    print(f"  Item count      : {len(mutated)}")
    print(f"  Prices changed  : {price_changed}")
    print(f"  On-sale marked  : {on_sale_marked}")
    print("Done.")


if __name__ == "__main__":
    main()
