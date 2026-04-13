"""
scheduler.py — Off-peak cron orchestration for the CannaSpy primary pipeline.

Executes the daily scrape job between 2:00–5:00 AM Pacific time only.
Spreads dispensary scrapes across the full 3-hour window with per-dispensary
jitter to prevent predictable request patterns.

Cron: 30 2 * * * (2:30 AM daily — gives the window time to open)

Usage:
  python3 scheduler.py [--force]  # --force bypasses time window check (dev only)
"""

import logging
import os
import random
import sys
import time
from datetime import datetime, timedelta
from typing import Optional

import psycopg2
import pytz

from collector import collect_menu, collect_all, PrimaryPipelineUnavailableError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("scheduler")

PACIFIC_TZ = pytz.timezone("America/Los_Angeles")
WINDOW_START_HOUR = 2   # 2:00 AM Pacific
WINDOW_END_HOUR = 5     # 5:00 AM Pacific


# ---------------------------------------------------------------------------
# Time window enforcement
# ---------------------------------------------------------------------------


def _is_in_scrape_window(now_pacific: Optional[datetime] = None) -> bool:
    """Return True if current Pacific time is within the 2–5 AM scrape window."""
    if now_pacific is None:
        now_pacific = datetime.now(PACIFIC_TZ)
    hour = now_pacific.hour
    return WINDOW_START_HOUR <= hour < WINDOW_END_HOUR


def _assert_scrape_window(force: bool = False) -> None:
    """
    Exit gracefully if outside the scrape window.
    The 2–5 AM Pacific window is required per the Three Mitigation Rules.
    """
    now = datetime.now(PACIFIC_TZ)
    if not _is_in_scrape_window(now) and not force:
        logger.info(
            "Scheduler called at %s Pacific — outside 2:00–5:00 AM scrape window. Exiting.",
            now.strftime("%H:%M"),
        )
        sys.exit(0)
    elif force:
        logger.warning(
            "Scrape window check bypassed via --force flag. "
            "Current time: %s Pacific. Use only for development/testing.",
            now.strftime("%H:%M"),
        )


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------


def _get_conn() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL is not set.")
    return psycopg2.connect(url)


def _load_active_dispensaries(conn) -> list[dict]:
    """
    Load all active tracked competitors with their slugs.
    Only competitors with a slug set in the database are returned.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT
                c.id,
                c.name,
                c.slug
            FROM competitors c
            JOIN tracked_competitors tc ON tc.competitor_id = c.id
            WHERE tc.active = TRUE
              AND c.slug IS NOT NULL
              AND c.slug != ''
            ORDER BY c.id
            """
        )
        rows = cur.fetchall()
    return [{"id": str(row[0]), "name": row[1], "slug": row[2]} for row in rows]


# ---------------------------------------------------------------------------
# Schedule calculation
# ---------------------------------------------------------------------------


def _calculate_scrape_schedule(dispensary_count: int) -> list[float]:
    """
    Distribute dispensary scrapes across the 3-hour window (180 minutes).
    Returns a list of offsets in seconds from window start, one per dispensary.

    Each interval gets ±20% jitter. The order is shuffled after generation.
    """
    if dispensary_count == 0:
        return []

    window_seconds = 3 * 60 * 60  # 180 minutes
    base_interval = window_seconds / dispensary_count

    offsets: list[float] = []
    cumulative = 0.0
    for i in range(dispensary_count):
        jittered = base_interval * random.uniform(0.8, 1.2)
        offsets.append(cumulative)
        cumulative += jittered

    # Cap any offsets that exceed window to avoid running past 5 AM
    max_offset = window_seconds - 1
    offsets = [min(o, max_offset) for o in offsets]

    # Shuffle so scrape order is randomized each run
    random.shuffle(offsets)
    return offsets


# ---------------------------------------------------------------------------
# Main run
# ---------------------------------------------------------------------------


def run(force: bool = False) -> dict:
    """
    Execute the daily scrape run.

    Returns a summary dict:
    {
      "total_attempted": int,
      "total_succeeded": int,
      "total_failed": int,
      "errors": list[dict],
      "avg_response_time_ms": float | None,
    }
    """
    _assert_scrape_window(force=force)

    conn = _get_conn()
    dispensaries = _load_active_dispensaries(conn)
    conn.close()

    if not dispensaries:
        logger.info("No active dispensaries to scrape. Exiting.")
        return {"total_attempted": 0, "total_succeeded": 0, "total_failed": 0, "errors": [], "avg_response_time_ms": None}

    logger.info("Loaded %d active dispensaries for scrape run.", len(dispensaries))

    offsets = _calculate_scrape_schedule(len(dispensaries))
    start_time = time.time()

    results = []
    errors = []
    response_times: list[float] = []

    # Pair each dispensary with its scheduled offset
    schedule = list(zip(dispensaries, offsets))
    # Sort by offset so we sleep forward in time
    schedule.sort(key=lambda x: x[1])

    run_start = time.time()

    for dispensary, offset_seconds in schedule:
        # Sleep until this dispensary's scheduled slot
        elapsed = time.time() - run_start
        sleep_for = offset_seconds - elapsed
        if sleep_for > 0:
            logger.debug(
                "Waiting %.1fs before scraping '%s'",
                sleep_for, dispensary["name"],
            )
            time.sleep(sleep_for)

        logger.info("Scraping '%s' (slug=%s)", dispensary["name"], dispensary["slug"])
        try:
            result = collect_menu(dispensary["slug"], dispensary["id"])
            results.append(result)
            if result.get("response_time_ms"):
                response_times.append(result["response_time_ms"])
            if not result["success"]:
                errors.append({"slug": dispensary["slug"], "name": dispensary["name"], "error": result.get("error")})
                logger.warning("Failed: '%s' — %s", dispensary["name"], result.get("error"))
        except PrimaryPipelineUnavailableError as exc:
            logger.error(
                "PRIMARY PIPELINE UNAVAILABLE: %s — stopping scheduler run. "
                "Manual intervention required.",
                exc,
            )
            errors.append({
                "slug": dispensary["slug"],
                "name": dispensary["name"],
                "error": str(exc),
                "critical": True,
            })
            # Do NOT continue. Surface the failure immediately.
            break
        except Exception as exc:
            logger.error(
                "Error scraping '%s': %s", dispensary["name"], exc, exc_info=True
            )
            errors.append({"slug": dispensary["slug"], "name": dispensary["name"], "error": str(exc)})
            # Continue with next dispensary — single failures don't stop the run

    succeeded = sum(1 for r in results if r.get("success"))
    failed = len(results) - succeeded
    avg_rt = sum(response_times) / len(response_times) if response_times else None

    summary = {
        "total_attempted": len(results),
        "total_succeeded": succeeded,
        "total_failed": failed,
        "errors": errors,
        "avg_response_time_ms": avg_rt,
    }

    logger.info(
        "Scrape run complete: %d/%d succeeded, %d failed. "
        "Avg response time: %s ms.",
        succeeded,
        len(results),
        failed,
        f"{avg_rt:.0f}" if avg_rt else "N/A",
    )
    return summary


if __name__ == "__main__":
    import argparse
    from dotenv import load_dotenv
    load_dotenv()

    ap = argparse.ArgumentParser(description="CannaSpy daily scrape scheduler")
    ap.add_argument(
        "--force",
        action="store_true",
        help="Bypass time window check (development/testing only)",
    )
    args = ap.parse_args()
    summary = run(force=args.force)
    sys.exit(0 if summary["total_failed"] == 0 else 1)
