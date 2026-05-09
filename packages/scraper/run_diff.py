"""
run_diff.py — Orchestrate diff_engine across all competitors with ≥2 snapshots.

For each competitor that has at least 2 menu_snapshots, finds the two most
recent snapshots and runs diff_snapshots() to generate change_events.

Run from repo root or packages/scraper/:
    python3 packages/scraper/run_diff.py [--dry-run]

Options:
    --dry-run   Parse and report diffs without writing to change_events.

Requires DATABASE_URL in .env at repo root (or environment).
"""

import argparse
import json
import logging
import os
import sys
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

import re
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

sys.path.insert(0, str(Path(__file__).parent))
from diff_engine import diff_snapshots


def get_conn() -> psycopg2.extensions.connection:
    url = os.environ["DATABASE_URL"]
    # Strip uselibpqcompat which psycopg2 doesn't support
    url = re.sub(r"[?&]uselibpqcompat=[^&]*", "", url).rstrip("?")
    return psycopg2.connect(url)


def get_competitors_with_multiple_snapshots(conn) -> list[dict]:
    """Return competitors with ≥2 menu_snapshots, ordered by most recent activity."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                competitor_id,
                COUNT(*) AS snapshot_count,
                MAX(collected_at) AS latest_run
            FROM menu_snapshots
            GROUP BY competitor_id
            HAVING COUNT(*) >= 2
            ORDER BY MAX(collected_at) DESC
            """
        )
        rows = cur.fetchall()
    return [
        {"competitor_id": str(r[0]), "snapshot_count": r[1], "latest_run": r[2]}
        for r in rows
    ]


def get_two_latest_snapshots(conn, competitor_id: str) -> tuple[dict | None, dict | None]:
    """Return the two most recent snapshots for a competitor."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, snapshot_json, item_count, collected_at
            FROM menu_snapshots
            WHERE competitor_id = %s
            ORDER BY collected_at DESC
            LIMIT 2
            """,
            [competitor_id],
        )
        rows = cur.fetchall()

    if len(rows) < 2:
        return None, None

    def parse_snapshot(row) -> dict:
        snap_json = row[1]
        if isinstance(snap_json, str):
            snap_json = json.loads(snap_json)
        return {
            "id": str(row[0]),
            "items": snap_json.get("items", []) if isinstance(snap_json, dict) else [],
            "collected_at": row[3],
        }

    current = parse_snapshot(rows[0])
    previous = parse_snapshot(rows[1])
    return current, previous


def main() -> None:
    ap = argparse.ArgumentParser(description="Run diff_engine across all competitors with ≥2 snapshots")
    ap.add_argument("--dry-run", action="store_true", help="Do not persist change_events to DB")
    args = ap.parse_args()

    logger.info("=== run_diff.py — CannaSpy diff orchestrator ===")
    logger.info("Mode: %s", "DRY RUN" if args.dry_run else "LIVE (writing to change_events)")

    conn = get_conn()

    competitors = get_competitors_with_multiple_snapshots(conn)
    if not competitors:
        logger.warning(
            "No competitors with ≥2 menu_snapshots found. "
            "Run collector.py at least twice for a competitor before running diffs."
        )
        conn.close()
        sys.exit(0)

    logger.info("Found %d competitor(s) with ≥2 snapshots", len(competitors))

    total_events = 0
    for comp in competitors:
        cid = comp["competitor_id"]
        logger.info(
            "Processing competitor %s (%d snapshots, latest %s)",
            cid, comp["snapshot_count"], comp["latest_run"]
        )

        current, previous = get_two_latest_snapshots(conn, cid)
        if not current or not previous:
            logger.warning("  Skipping %s — could not load 2 snapshots", cid)
            continue

        logger.info(
            "  Comparing snapshot %s (%d items) vs %s (%d items)",
            current["id"], len(current["items"]),
            previous["id"], len(previous["items"]),
        )

        events = diff_snapshots(
            prev_items=previous["items"],
            curr_items=current["items"],
            dispensary_id=cid,
            persist=(not args.dry_run),
        )

        by_type: dict[str, int] = {}
        for e in events:
            by_type[e["event_type"]] = by_type.get(e["event_type"], 0) + 1

        logger.info("  Generated %d events: %s", len(events), by_type)
        total_events += len(events)

    conn.close()

    action = "Would write" if args.dry_run else "Wrote"
    logger.info("=== Done. %s %d change_events total. ===", action, total_events)


if __name__ == "__main__":
    main()
