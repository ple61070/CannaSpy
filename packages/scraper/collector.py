"""
collector.py — CannaSpy PRIMARY data collection pipeline.

NOTE: This is the primary pipeline. The fallback pipeline is dispensary_scraper.py.

Collects menu data from a public JSON API — NOT website scraping.
All requests go through ip_pool.get_session() for IP rotation.
Implements timing jitter and pagination per CannaSpy_Data_Architecture.md.

API pattern:
  GET https://{CANNASPY_PRIMARY_API_HOST}/discovery/v1/listings/dispensaries/{slug}/menu_items
      ?page={n}&page_size=100

Environment variables required:
  CANNASPY_PRIMARY_API_HOST  — API host (never hardcode the platform domain)
  DATABASE_URL               — PostgreSQL connection string

Usage:
  from collector import collect_menu, collect_all
"""

import json
import logging
import math
import os
import random
import sys
import time
from datetime import datetime
from typing import Optional
from uuid import UUID

import psycopg2
import requests

from ip_pool import get_session, get_pool_status

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class PrimaryPipelineUnavailableError(Exception):
    """
    Raised when the primary API returns HTTP 401 or 403.
    Fallback activation is a MANUAL decision — never automatic.
    """
    pass


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------


def _api_host() -> str:
    host = os.environ.get("CANNASPY_PRIMARY_API_HOST", "").strip().rstrip("/")
    if not host:
        raise EnvironmentError(
            "CANNASPY_PRIMARY_API_HOST is not set. "
            "This environment variable is required for the primary pipeline."
        )
    return host


def _menu_items_url(host: str, slug: str, page: int) -> str:
    return (
        f"https://{host}/discovery/v1/listings/dispensaries/{slug}/menu_items"
        f"?page={page}&page_size=100"
    )


def _jittered_delay() -> None:
    """
    Primary delay: 0.5–2.5 seconds between most requests.
    5% probability of long pause: 8–25 seconds (mimics human reading pause).
    Never uses a fixed sleep value.
    """
    if random.random() < 0.05:
        delay = random.uniform(8.0, 25.0)
        logger.debug("Long jitter pause: %.1fs", delay)
    else:
        delay = random.uniform(0.5, 2.5)
    time.sleep(delay)


def _fetch_page(session: requests.Session, url: str) -> dict:
    """
    Fetch a single page from the primary API.
    Raises PrimaryPipelineUnavailableError on 401/403.
    Raises requests.HTTPError on other 4xx/5xx.
    """
    resp = session.get(url, timeout=15)

    if resp.status_code in (401, 403):
        logger.error(
            "Primary pipeline returned HTTP %d for %s. "
            "Manual fallback decision required.",
            resp.status_code,
            url,
        )
        raise PrimaryPipelineUnavailableError(
            f"Primary API returned HTTP {resp.status_code}. "
            "Do not automatically activate fallback. Notify engineering lead."
        )

    resp.raise_for_status()
    return resp.json()


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------


def _parse_item(raw: dict) -> dict:
    """
    Parse a single raw API response item into the normalized schema.
    Maps API fields to CannaSpy's internal representation.
    """
    price_data = raw.get("price") or {}
    brand_data = raw.get("brand_endorsement") or {}
    category_data = raw.get("category") or {}
    edge_category = raw.get("edge_category") or {}
    genetics = raw.get("genetics_tag") or {}
    metrics = raw.get("metrics") or {}
    cannabinoids = metrics.get("cannabinoids") or []

    thc_mg = None
    cbd_mg = None
    for cb in cannabinoids:
        code = cb.get("code", "")
        if code == "thc":
            thc_mg = cb.get("value")
        elif code == "cbd":
            cbd_mg = cb.get("value")

    # Extract strain name from tags
    strain_name = None
    for tag in raw.get("tags") or []:
        group = tag.get("tag_group") or {}
        if group.get("name") == "Strains":
            strain_name = tag.get("name")
            break

    return {
        "platform_item_id": str(raw["id"]) if raw.get("id") is not None else None,
        "name": raw.get("name"),
        "brand": brand_data.get("brand_name"),
        "category": category_data.get("name"),
        "subcategory": edge_category.get("name"),
        "price": price_data.get("price"),
        "original_price": price_data.get("original_price"),
        "on_sale": bool(price_data.get("on_sale")),
        "discount_label": price_data.get("discount_label"),
        "current_deal_title": raw.get("current_deal_title"),
        "deal_ids": raw.get("deal_ids") or [],
        "thc_mg": thc_mg,
        "cbd_mg": cbd_mg,
        "genetics_tag": genetics.get("name"),
        "strain_name": strain_name,
        "is_online_orderable": raw.get("is_online_orderable", True),
        "updated_at": raw.get("updated_at"),
    }


# ---------------------------------------------------------------------------
# Database persistence
# ---------------------------------------------------------------------------


def _get_conn() -> psycopg2.extensions.connection:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise EnvironmentError("DATABASE_URL is not set.")
    return psycopg2.connect(url)


def _store_snapshot(conn, competitor_id: str, slug: str, raw_items: list[dict]) -> str:
    """Store raw JSON snapshot. Returns snapshot UUID."""
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO menu_snapshots (competitor_id, slug, snapshot_json, item_count)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (competitor_id, slug, json.dumps(raw_items), len(raw_items)),
        )
        snapshot_id = str(cur.fetchone()[0])
    conn.commit()
    return snapshot_id


def _store_menu_items(conn, snapshot_id: str, competitor_id: str, items: list[dict]) -> None:
    """Bulk insert normalized menu items."""
    if not items:
        return
    with conn.cursor() as cur:
        args = [
            (
                snapshot_id,
                competitor_id,
                item["platform_item_id"],
                item["name"],
                item["brand"],
                item["category"],
                item["subcategory"],
                item["price"],
                item["original_price"],
                item["on_sale"],
                item["discount_label"],
                item["current_deal_title"],
                item["deal_ids"],
                item["thc_mg"],
                item["cbd_mg"],
                item["genetics_tag"],
                item["strain_name"],
                item["is_online_orderable"],
                item["updated_at"],
            )
            for item in items
        ]
        cur.executemany(
            """
            INSERT INTO menu_items (
                snapshot_id, competitor_id, platform_item_id, name, brand, category,
                subcategory, price, original_price, on_sale, discount_label,
                current_deal_title, deal_ids, thc_mg, cbd_mg, genetics_tag,
                strain_name, is_online_orderable, updated_at
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            args,
        )
    conn.commit()


def _update_scrape_timestamp(conn, competitor_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE competitors SET last_scraped = NOW() WHERE id = %s",
            (competitor_id,),
        )
    conn.commit()


def _log_pipeline_health(
    conn,
    run_date: str,
    total_attempted: int,
    total_succeeded: int,
    total_failed: int,
    avg_response_time_ms: Optional[float],
    errors: list[dict],
) -> None:
    """Log a pipeline health record for the current run."""
    ip_status = get_pool_status()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO pipeline_health (
                run_date, total_attempted, total_succeeded, total_failed,
                avg_response_time_ms, ip_pool_status, errors, completed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """,
            (
                run_date,
                total_attempted,
                total_succeeded,
                total_failed,
                avg_response_time_ms,
                json.dumps(ip_status),
                json.dumps(errors),
            ),
        )
    conn.commit()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def collect_menu(dispensary_slug: str, dispensary_id: str) -> dict:
    """
    Collect the full menu for one dispensary from the primary API.

    Paginates through all pages (page_size=100) until all items are fetched.
    Applies timing jitter between every page request.
    Stores raw snapshot and normalized items to the database.

    Args:
        dispensary_slug: URL slug identifier for the dispensary.
        dispensary_id:   CannaSpy UUID for the competitor record.

    Returns:
        {
          "dispensary_id": str,
          "slug": str,
          "snapshot_id": str,
          "item_count": int,
          "pages_fetched": int,
          "success": bool,
          "error": str | None,
          "response_time_ms": float,
        }

    Raises:
        PrimaryPipelineUnavailableError: if API returns 401 or 403.
    """
    host = _api_host()
    session = get_session(dispensary_slug)
    raw_items: list[dict] = []
    page = 1
    start_ts = time.time()

    logger.info("Starting collection for slug='%s' id='%s'", dispensary_slug, dispensary_id)

    try:
        # Fetch first page to determine total
        url = _menu_items_url(host, dispensary_slug, page)
        first_page = _fetch_page(session, url)
        page_items = (first_page.get("data") or {}).get("menu_items") or []
        raw_items.extend(page_items)

        # Determine total count and required pages
        total = (
            (first_page.get("meta") or {}).get("total_menu_items")
            or len(page_items)
        )
        total_pages = max(1, math.ceil(total / 100))

        logger.info(
            "slug='%s': %d total items across %d pages",
            dispensary_slug, total, total_pages,
        )

        # Fetch remaining pages
        for page in range(2, total_pages + 1):
            _jittered_delay()
            url = _menu_items_url(host, dispensary_slug, page)
            page_data = _fetch_page(session, url)
            page_items = (page_data.get("data") or {}).get("menu_items") or []
            raw_items.extend(page_items)
            logger.debug("slug='%s': fetched page %d/%d (%d items)", dispensary_slug, page, total_pages, len(page_items))

    except PrimaryPipelineUnavailableError:
        raise
    except requests.HTTPError as exc:
        elapsed_ms = (time.time() - start_ts) * 1000
        logger.error("HTTP error collecting slug='%s': %s", dispensary_slug, exc)
        return {
            "dispensary_id": dispensary_id,
            "slug": dispensary_slug,
            "snapshot_id": None,
            "item_count": 0,
            "pages_fetched": page,
            "success": False,
            "error": str(exc),
            "response_time_ms": elapsed_ms,
        }
    except Exception as exc:
        elapsed_ms = (time.time() - start_ts) * 1000
        logger.error("Unexpected error collecting slug='%s': %s", dispensary_slug, exc, exc_info=True)
        return {
            "dispensary_id": dispensary_id,
            "slug": dispensary_slug,
            "snapshot_id": None,
            "item_count": 0,
            "pages_fetched": page,
            "success": False,
            "error": str(exc),
            "response_time_ms": elapsed_ms,
        }

    elapsed_ms = (time.time() - start_ts) * 1000
    logger.info(
        "Collected %d items for slug='%s' in %.0fms",
        len(raw_items), dispensary_slug, elapsed_ms,
    )

    # Persist to database
    try:
        conn = _get_conn()
        normalized = [_parse_item(r) for r in raw_items]
        snapshot_id = _store_snapshot(conn, dispensary_id, dispensary_slug, raw_items)
        _store_menu_items(conn, snapshot_id, dispensary_id, normalized)
        _update_scrape_timestamp(conn, dispensary_id)
        conn.close()
    except Exception as exc:
        logger.error("DB persistence failed for slug='%s': %s", dispensary_slug, exc, exc_info=True)
        return {
            "dispensary_id": dispensary_id,
            "slug": dispensary_slug,
            "snapshot_id": None,
            "item_count": len(raw_items),
            "pages_fetched": total_pages,
            "success": False,
            "error": f"DB error: {exc}",
            "response_time_ms": elapsed_ms,
        }

    return {
        "dispensary_id": dispensary_id,
        "slug": dispensary_slug,
        "snapshot_id": snapshot_id,
        "item_count": len(raw_items),
        "pages_fetched": total_pages,
        "success": True,
        "error": None,
        "response_time_ms": elapsed_ms,
        "items": normalized,  # returned for use by diff_engine
    }


def collect_all(dispensary_ids: list[dict]) -> list[dict]:
    """
    Collect menus for a list of dispensaries.

    Args:
        dispensary_ids: list of dicts with keys 'id' (UUID) and 'slug' (str).

    Returns:
        List of result dicts (one per dispensary, same structure as collect_menu).

    Logs a pipeline health summary to the database on completion.
    Does NOT raise on per-dispensary failures — errors are captured in results.
    """
    results = []
    errors = []
    response_times: list[float] = []
    today = datetime.utcnow().date().isoformat()

    logger.info("collect_all: starting run for %d dispensaries", len(dispensary_ids))

    conn = _get_conn()

    for entry in dispensary_ids:
        slug = entry["slug"]
        d_id = entry["id"]
        try:
            result = collect_menu(slug, d_id)
            results.append(result)
            if result["response_time_ms"]:
                response_times.append(result["response_time_ms"])
            if not result["success"]:
                errors.append({"slug": slug, "error": result.get("error")})
        except PrimaryPipelineUnavailableError as exc:
            logger.error("Primary pipeline unavailable during collect_all: %s", exc)
            results.append({
                "dispensary_id": d_id,
                "slug": slug,
                "snapshot_id": None,
                "item_count": 0,
                "pages_fetched": 0,
                "success": False,
                "error": str(exc),
                "response_time_ms": None,
            })
            errors.append({"slug": slug, "error": str(exc)})
        except Exception as exc:
            logger.error("Unhandled error for slug='%s': %s", slug, exc, exc_info=True)
            results.append({
                "dispensary_id": d_id,
                "slug": slug,
                "snapshot_id": None,
                "item_count": 0,
                "pages_fetched": 0,
                "success": False,
                "error": str(exc),
                "response_time_ms": None,
            })
            errors.append({"slug": slug, "error": str(exc)})
        _jittered_delay()

    succeeded = sum(1 for r in results if r["success"])
    failed = len(results) - succeeded
    avg_rt = sum(response_times) / len(response_times) if response_times else None

    try:
        _log_pipeline_health(conn, today, len(dispensary_ids), succeeded, failed, avg_rt, errors)
    except Exception as exc:
        logger.error("Failed to log pipeline health: %s", exc)
    finally:
        conn.close()

    logger.info(
        "collect_all complete: %d succeeded, %d failed, avg response time %.0fms",
        succeeded, failed, avg_rt or 0,
    )
    return results


if __name__ == "__main__":
    import argparse
    from dotenv import load_dotenv

    load_dotenv()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    ap = argparse.ArgumentParser(description="CannaSpy primary pipeline — collect one dispensary menu")
    ap.add_argument("--slug", required=True, help="Dispensary slug (e.g. off-the-charts)")
    ap.add_argument("--competitor-id", required=True, help="CannaSpy competitor UUID (or any string for testing)")
    ap.add_argument("--no-db", action="store_true", help="Skip database writes (parse and print only)")
    ap.add_argument("--output", choices=["summary", "json"], default="summary")
    args = ap.parse_args()

    if args.no_db:
        # Parse-only mode: fetch + parse, no DB
        import math as _math
        session = get_session(args.slug)
        host = _api_host()
        first = _fetch_page(session, _menu_items_url(host, args.slug, 1))
        items = (first.get("data") or {}).get("menu_items") or []
        total = (first.get("meta") or {}).get("total_menu_items", 0)
        pages = _math.ceil(total / 100) if total else 1
        normalized = [_parse_item(i) for i in items]
        result = {
            "dispensary_id": args.competitor_id,
            "slug": args.slug,
            "snapshot_id": None,
            "item_count": total,
            "pages_fetched": pages,
            "success": True,
            "error": None,
            "response_time_ms": None,
            "items": normalized,
        }
    else:
        result = collect_menu(args.slug, args.competitor_id)

    if args.output == "json":
        import json as _json
        out = {k: v for k, v in result.items() if k != "items"}
        if result.get("items"):
            out["sample_item"] = result["items"][0]
        print(_json.dumps(out, indent=2, default=str))
    else:
        status = "OK" if result["success"] else "FAIL"
        print(f"\n[{status}] slug={result['slug']}")
        print(f"  items:        {result['item_count']}")
        print(f"  pages:        {result['pages_fetched']}")
        print(f"  snapshot_id:  {result['snapshot_id']}")
        print(f"  response_ms:  {result['response_time_ms']}")
        if result.get("error"):
            print(f"  error:        {result['error']}")
        if result.get("items"):
            s = result["items"][0]
            print(f"  sample:       '{s['name']}' by {s['brand']} — ${s['price']}")

    sys.exit(0 if result["success"] else 1)
