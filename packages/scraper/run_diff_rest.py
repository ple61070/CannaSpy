"""
run_diff_rest.py — Diff orchestrator using PostgREST (psycopg2-free).

Fetches snapshots and items via Supabase REST API, runs diff_snapshots()
from diff_engine.py, and writes change_events via PostgREST.

Use this instead of run_diff.py when psycopg2 cannot connect to Supabase
(e.g. from local dev — pooler rejects non-Railway IPs).

Usage:
    cd /Users/patricksimac/CannaSpy
    python3 packages/scraper/run_diff_rest.py --dry-run   # print events, no writes
    python3 packages/scraper/run_diff_rest.py             # write to change_events
"""

import argparse
import json
import os
import sys
from collections import defaultdict
from pathlib import Path

import requests

# diff_engine lives in the same package directory
sys.path.insert(0, str(Path(__file__).resolve().parent))
from diff_engine import diff_snapshots


# ---------------------------------------------------------------------------
# .env loader
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


def fetch_all_snapshots(base_url: str, service_key: str) -> list[dict]:
    """Fetch all menu_snapshots (id, competitor_id, collected_at, item_count)."""
    url = f"{base_url}/rest/v1/menu_snapshots?select=id,competitor_id,collected_at,item_count&order=collected_at.asc"
    resp = requests.get(url, headers=_headers(service_key), timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_items_for_snapshot(base_url: str, service_key: str, snapshot_id: str) -> list[dict]:
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


def post_events(base_url: str, service_key: str, events: list[dict]) -> None:
    """POST change_events to Supabase in batches of 100."""
    batch_size = 100
    url = f"{base_url}/rest/v1/change_events"
    headers = _headers(service_key)

    for i in range(0, len(events), batch_size):
        batch = events[i : i + batch_size]
        # Serialize old_value / new_value dicts to JSON strings for JSONB columns
        payload = []
        for e in batch:
            row = {
                "competitor_id": e.get("competitor_id"),
                "event_type": e.get("event_type"),
                "platform_item_id": e.get("platform_item_id"),
                "item_name": e.get("item_name"),
                "brand": e.get("brand"),
                "category": e.get("category"),
                "old_value": e.get("old_value"),   # PostgREST accepts native dict for JSONB
                "new_value": e.get("new_value"),
            }
            payload.append(row)

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if not resp.ok:
            print(f"  ERROR posting events batch {i}–{i+len(batch)}: {resp.status_code} {resp.text[:300]}")
            resp.raise_for_status()


# ---------------------------------------------------------------------------
# Main diff logic
# ---------------------------------------------------------------------------

def run_diff(dry_run: bool = False) -> None:
    repo_root = Path(__file__).resolve().parent.parent.parent
    load_env(repo_root / ".env")

    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not base_url or not service_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)

    mode = "DRY-RUN" if dry_run else "LIVE"
    print(f"=== run_diff_rest.py [{mode}] ===\n")

    # 1. Fetch all snapshots, group by competitor_id
    print("Fetching all snapshots ...")
    all_snapshots = fetch_all_snapshots(base_url, service_key)
    print(f"  Total snapshots: {len(all_snapshots)}")

    by_competitor: dict[str, list[dict]] = defaultdict(list)
    for snap in all_snapshots:
        by_competitor[snap["competitor_id"]].append(snap)

    # Find competitors with >= 2 snapshots
    eligible = {cid: snaps for cid, snaps in by_competitor.items() if len(snaps) >= 2}
    print(f"  Competitors with >= 2 snapshots: {len(eligible)}\n")

    if not eligible:
        print("Nothing to diff. Exiting.")
        return

    total_events = 0

    for competitor_id, snaps in eligible.items():
        # Sort by collected_at ascending; take the 2 most recent
        snaps_sorted = sorted(snaps, key=lambda s: s["collected_at"])
        prev_snap = snaps_sorted[-2]
        curr_snap = snaps_sorted[-1]

        print(f"Competitor: {competitor_id}")
        print(f"  prev snapshot: {prev_snap['id']} ({prev_snap['collected_at']}, {prev_snap['item_count']} items)")
        print(f"  curr snapshot: {curr_snap['id']} ({curr_snap['collected_at']}, {curr_snap['item_count']} items)")

        print("  Fetching prev items ...")
        prev_items = fetch_items_for_snapshot(base_url, service_key, prev_snap["id"])
        print(f"    → {len(prev_items)} items")

        print("  Fetching curr items ...")
        curr_items = fetch_items_for_snapshot(base_url, service_key, curr_snap["id"])
        print(f"    → {len(curr_items)} items")

        print("  Running diff ...")
        # persist=False — we handle DB writes ourselves via PostgREST
        events = diff_snapshots(prev_items, curr_items, competitor_id, persist=False)
        print(f"  Events detected: {len(events)}")

        # Tally by type
        by_type: dict[str, int] = defaultdict(int)
        for e in events:
            by_type[e["event_type"]] += 1
        for etype, count in sorted(by_type.items()):
            print(f"    {etype}: {count}")

        if dry_run:
            if events:
                print("  Sample event (first):")
                sample = events[0]
                print(f"    {json.dumps(sample, indent=4, default=str)}")
        else:
            if events:
                print(f"  Writing {len(events)} events to change_events ...")
                post_events(base_url, service_key, events)
                print("  Done.")

        total_events += len(events)
        print()

    print(f"=== Total events {'(dry-run, not written)' if dry_run else 'written'}: {total_events} ===")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Diff snapshots via PostgREST")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print events but do not write to change_events table",
    )
    args = parser.parse_args()
    run_diff(dry_run=args.dry_run)
